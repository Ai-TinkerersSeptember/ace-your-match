-- Fix critical security vulnerability: Restrict profile visibility
-- Replace the overly permissive "Users can view all profiles" policy

-- First, drop the insecure policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policies for profile access
-- 1. Users can always view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 2. Users can view profiles of people they've matched with
CREATE POLICY "Users can view matched profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE (
      (m.user1_id = auth.uid() AND m.user2_id = profiles.id AND m.is_mutual = true)
      OR
      (m.user2_id = auth.uid() AND m.user1_id = profiles.id AND m.is_mutual = true)
    )
  )
);

-- Create a secure function to find potential matches
-- This function respects privacy by not exposing exact coordinates
CREATE OR REPLACE FUNCTION public.get_potential_matches(
  user_latitude numeric DEFAULT NULL,
  user_longitude numeric DEFAULT NULL,
  max_distance_km integer DEFAULT 50,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  age integer,
  profile_photo_url text,
  location text,
  bio text,
  distance_km numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  user_prefs record;
BEGIN
  -- Get current user's preferences
  SELECT * INTO user_prefs 
  FROM user_preferences 
  WHERE user_id = current_user_id;

  -- Use default values if no preferences set
  IF user_prefs IS NULL THEN
    user_prefs.max_travel_distance := COALESCE(max_distance_km, 50);
    user_prefs.age_range_min := 18;
    user_prefs.age_range_max := 100;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.age,
    p.profile_photo_url,
    p.location,
    p.bio,
    CASE 
      WHEN user_latitude IS NOT NULL AND user_longitude IS NOT NULL 
           AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN
        -- Calculate approximate distance using Haversine formula
        ROUND(
          6371 * acos(
            cos(radians(user_latitude)) * 
            cos(radians(p.latitude)) * 
            cos(radians(p.longitude) - radians(user_longitude)) + 
            sin(radians(user_latitude)) * 
            sin(radians(p.latitude))
          )::numeric, 
          1
        )
      ELSE NULL
    END as distance_km
  FROM profiles p
  WHERE 
    -- Exclude current user
    p.id != current_user_id
    -- Exclude already matched users
    AND NOT EXISTS (
      SELECT 1 FROM matches m 
      WHERE (m.user1_id = current_user_id AND m.user2_id = p.id)
         OR (m.user2_id = current_user_id AND m.user1_id = p.id)
    )
    -- Age filtering based on preferences
    AND (user_prefs.age_range_min IS NULL OR p.age >= user_prefs.age_range_min)
    AND (user_prefs.age_range_max IS NULL OR p.age <= user_prefs.age_range_max)
    -- Gender filtering based on preferences
    AND (user_prefs.gender_preference IS NULL OR p.gender = ANY(user_prefs.gender_preference))
    -- Must share at least one sport
    AND EXISTS (
      SELECT 1 FROM user_sports us1
      JOIN user_sports us2 ON us1.sport = us2.sport
      WHERE us1.user_id = current_user_id 
        AND us2.user_id = p.id
    )
    -- Distance filtering (only if coordinates are available)
    AND (
      user_latitude IS NULL OR user_longitude IS NULL 
      OR p.latitude IS NULL OR p.longitude IS NULL
      OR (
        6371 * acos(
          cos(radians(user_latitude)) * 
          cos(radians(p.latitude)) * 
          cos(radians(p.longitude) - radians(user_longitude)) + 
          sin(radians(user_latitude)) * 
          sin(radians(p.latitude))
        ) <= COALESCE(user_prefs.max_travel_distance, max_distance_km)
      )
    )
  ORDER BY 
    -- Prioritize closer matches if location data is available
    CASE 
      WHEN user_latitude IS NOT NULL AND user_longitude IS NOT NULL 
           AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN
        6371 * acos(
          cos(radians(user_latitude)) * 
          cos(radians(p.latitude)) * 
          cos(radians(p.longitude) - radians(user_longitude)) + 
          sin(radians(user_latitude)) * 
          sin(radians(p.latitude))
        )
      ELSE 999999
    END,
    -- Then by creation date (newer users first)
    p.created_at DESC
  LIMIT limit_count;
END;
$$;