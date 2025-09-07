-- Fix function conflict by dropping all possible function signatures
-- This handles the "function name is not unique" error more thoroughly

-- First, let's see what functions exist (for debugging)
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'get_potential_matches' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Drop all possible variations of the get_potential_matches function
-- We'll try all common signatures that might exist

DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Loop through all functions named get_potential_matches in public schema
    FOR func_record IN 
        SELECT 
            p.oid,
            p.proname,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_potential_matches' 
            AND n.nspname = 'public'
    LOOP
        -- Drop each function with its specific signature
        EXECUTE format('DROP FUNCTION IF EXISTS public.%s(%s)', 
                      func_record.proname, 
                      func_record.args);
        
        RAISE NOTICE 'Dropped function: public.%(%)', func_record.proname, func_record.args;
    END LOOP;
END $$;

-- Add location_enabled column to user_preferences if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_preferences' 
                   AND column_name = 'location_enabled') THEN
        ALTER TABLE user_preferences ADD COLUMN location_enabled BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added location_enabled column to user_preferences';
    ELSE
        RAISE NOTICE 'location_enabled column already exists';
    END IF;
END $$;

-- Ensure location fields in profiles are nullable
DO $$
BEGIN
    -- Check and modify latitude
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'latitude' 
               AND is_nullable = 'NO') THEN
        ALTER TABLE profiles ALTER COLUMN latitude DROP NOT NULL;
        RAISE NOTICE 'Made profiles.latitude nullable';
    END IF;
    
    -- Check and modify longitude  
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'longitude' 
               AND is_nullable = 'NO') THEN
        ALTER TABLE profiles ALTER COLUMN longitude DROP NOT NULL;
        RAISE NOTICE 'Made profiles.longitude nullable';
    END IF;
    
    -- Check and modify location
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'location' 
               AND is_nullable = 'NO') THEN
        ALTER TABLE profiles ALTER COLUMN location DROP NOT NULL;
        RAISE NOTICE 'Made profiles.location nullable';
    END IF;
END $$;

-- Now create the new function
CREATE OR REPLACE FUNCTION public.get_potential_matches(
  user_latitude double precision DEFAULT NULL,
  user_longitude double precision DEFAULT NULL,
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
    user_prefs.location_enabled := true;
  END IF;

  -- Set default for location_enabled if it's null (for existing users)
  IF user_prefs.location_enabled IS NULL THEN
    user_prefs.location_enabled := true;
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
      -- Only calculate distance if both users have location enabled and coordinates available
      WHEN user_prefs.location_enabled = true 
           AND user_latitude IS NOT NULL AND user_longitude IS NOT NULL 
           AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN
        -- Calculate approximate distance using Haversine formula
        ROUND(
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(user_latitude)) * 
              cos(radians(p.latitude)) * 
              cos(radians(p.longitude) - radians(user_longitude)) + 
              sin(radians(user_latitude)) * 
              sin(radians(p.latitude))
            ))
          )::numeric, 
          1
        )
      ELSE NULL
    END as distance_km
  FROM profiles p
  LEFT JOIN user_preferences up ON up.user_id = p.id
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
    -- Distance filtering (only if current user has location enabled)
    AND (
      user_prefs.location_enabled = false  -- Current user doesn't want location filtering
      OR user_latitude IS NULL OR user_longitude IS NULL  -- Current user has no coordinates
      OR p.latitude IS NULL OR p.longitude IS NULL  -- Potential match has no coordinates
      OR COALESCE(up.location_enabled, true) = false  -- Potential match doesn't want to be filtered by location
      OR (
        -- Both users have location enabled and coordinates - apply distance filter
        6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(user_latitude)) * 
            cos(radians(p.latitude)) * 
            cos(radians(p.longitude) - radians(user_longitude)) + 
            sin(radians(user_latitude)) * 
            sin(radians(p.latitude))
          ))
        ) <= COALESCE(user_prefs.max_travel_distance, max_distance_km)
      )
    )
  ORDER BY 
    -- Prioritize matches based on location preference
    CASE 
      WHEN user_prefs.location_enabled = true 
           AND user_latitude IS NOT NULL AND user_longitude IS NOT NULL 
           AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN
        -- Sort by distance if location is enabled
        6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(user_latitude)) * 
            cos(radians(p.latitude)) * 
            cos(radians(p.longitude) - radians(user_longitude)) + 
            sin(radians(user_latitude)) * 
            sin(radians(p.latitude))
          ))
        )
      ELSE 
        -- Random-ish sort if location is disabled (based on user ID hash)
        abs(hashtext(p.id::text)) % 1000000
    END,
    -- Then by creation date (newer users first)
    p.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION public.get_potential_matches IS 'Returns potential matches for the current user, respecting location preferences. If location_enabled is false, shows matches from anywhere.';

-- Add comment on the new column
COMMENT ON COLUMN user_preferences.location_enabled IS 'Whether the user wants location-based matching enabled. If false, user will see matches regardless of distance and won''t be filtered out by others'' distance preferences.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_potential_matches TO authenticated;

-- Final verification
SELECT 'Location optional feature migration completed successfully!' as status;
