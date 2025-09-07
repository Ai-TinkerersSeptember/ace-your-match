-- Complete migration script for Supabase Cloud
-- Copy and paste this entire script into your Supabase Dashboard SQL Editor
-- This will add the is_liked column and update all necessary functions

-- Step 1: Add is_liked column to matches table
DO $$
BEGIN
    -- Check if column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' 
        AND column_name = 'is_liked'
        AND table_schema = 'public'
    ) THEN
        -- Add the column
        ALTER TABLE public.matches 
        ADD COLUMN is_liked BOOLEAN NOT NULL DEFAULT true;
        
        -- Add comment
        COMMENT ON COLUMN public.matches.is_liked IS 'True if user1 liked user2, false if user1 disliked user2';
        
        RAISE NOTICE 'Added is_liked column to matches table';
    ELSE
        RAISE NOTICE 'is_liked column already exists in matches table';
    END IF;
END $$;

-- Step 2: Update unique constraint
DO $$
BEGIN
    -- Drop old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_user1_id_user2_id_sport_key'
        AND table_name = 'matches'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.matches DROP CONSTRAINT matches_user1_id_user2_id_sport_key;
        RAISE NOTICE 'Dropped old unique constraint';
    END IF;
    
    -- Add new constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_user1_id_user2_id_sport_is_liked_key'
        AND table_name = 'matches'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.matches 
        ADD CONSTRAINT matches_user1_id_user2_id_sport_is_liked_key 
        UNIQUE (user1_id, user2_id, sport, is_liked);
        
        RAISE NOTICE 'Added new unique constraint with is_liked';
    ELSE
        RAISE NOTICE 'New unique constraint already exists';
    END IF;
END $$;

-- Step 3: Create the handle_user_action function
CREATE OR REPLACE FUNCTION public.handle_user_action(
  current_user_id uuid,
  target_user_id uuid,
  sport_name sport_type,
  is_like boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  existing_match record;
  reverse_match record;
  new_match_id uuid;
  conversation_id uuid;
  result json;
BEGIN
  -- Check if user has already made the same action
  SELECT * INTO existing_match
  FROM matches
  WHERE user1_id = current_user_id 
    AND user2_id = target_user_id 
    AND sport = sport_name
    AND is_liked = is_like;
  
  -- If user has already made the same action, return current state
  IF existing_match IS NOT NULL THEN
    IF is_like THEN
      result := json_build_object(
        'success', true,
        'is_mutual', existing_match.is_mutual,
        'action', 'like',
        'match_id', existing_match.id,
        'message', 'Already liked this user.'
      );
    ELSE
      result := json_build_object(
        'success', true,
        'is_mutual', false,
        'action', 'dislike',
        'match_id', existing_match.id,
        'message', 'Already disliked this user.'
      );
    END IF;
    
    RETURN result;
  END IF;
  
  -- Check if user has made the opposite action and delete it
  DELETE FROM matches 
  WHERE user1_id = current_user_id 
    AND user2_id = target_user_id 
    AND sport = sport_name
    AND is_liked = NOT is_like;
  
  -- Create new match record
  INSERT INTO matches (user1_id, user2_id, sport, is_liked, is_mutual)
  VALUES (current_user_id, target_user_id, sport_name, is_like, false)
  RETURNING id INTO new_match_id;
  
  -- If this is a like, check for mutual match
  IF is_like THEN
    -- Check if there's a reverse like
    SELECT * INTO reverse_match
    FROM matches
    WHERE user1_id = target_user_id 
      AND user2_id = current_user_id 
      AND sport = sport_name
      AND is_liked = true;
    
    IF reverse_match IS NOT NULL THEN
      -- Use helper function to ensure all mutual matches are updated
      PERFORM public.update_mutual_matches(current_user_id, target_user_id, sport_name);
      
      -- Create a conversation for the mutual match
      INSERT INTO conversations (match_id, user1_id, user2_id)
      VALUES (new_match_id, current_user_id, target_user_id)
      ON CONFLICT (match_id) DO NOTHING
      RETURNING id INTO conversation_id;
      
      result := json_build_object(
        'success', true,
        'is_mutual', true,
        'action', 'like',
        'match_id', new_match_id,
        'conversation_id', conversation_id,
        'message', 'It''s a mutual match! You can now message each other.'
      );
    ELSE
      -- Just a like, not mutual yet
      result := json_build_object(
        'success', true,
        'is_mutual', false,
        'action', 'like',
        'match_id', new_match_id,
        'message', 'Like recorded! If they like you back, you''ll be matched.'
      );
    END IF;
  ELSE
    -- This is a dislike
    result := json_build_object(
      'success', true,
      'is_mutual', false,
      'action', 'dislike',
      'match_id', new_match_id,
      'message', 'Dislike recorded.'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Step 4: Update the existing handle_mutual_match function
CREATE OR REPLACE FUNCTION public.handle_mutual_match(
  current_user_id uuid,
  target_user_id uuid,
  sport_name sport_type
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Call the new function with is_like = true
  RETURN public.handle_user_action(current_user_id, target_user_id, sport_name, true);
END;
$$;

-- Step 5: Create the handle_dislike function
CREATE OR REPLACE FUNCTION public.handle_dislike(
  current_user_id uuid,
  target_user_id uuid,
  sport_name sport_type
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Call the new function with is_like = false
  RETURN public.handle_user_action(current_user_id, target_user_id, sport_name, false);
END;
$$;

-- Step 6: Update the get_potential_matches function
-- First drop the existing function to allow return type change
DROP FUNCTION IF EXISTS public.get_potential_matches(numeric, numeric, integer, integer);

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
  distance_km double precision
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
        6371 * acos(
          cos(radians(user_latitude)) * 
          cos(radians(p.latitude)) * 
          cos(radians(p.longitude) - radians(user_longitude)) + 
          sin(radians(user_latitude)) * 
          sin(radians(p.latitude))
        )
      ELSE NULL
    END as distance_km
  FROM profiles p
  WHERE 
    -- Exclude current user
    p.id != current_user_id
    -- Exclude users that the current user has already acted upon (liked or disliked)
    AND NOT EXISTS (
      SELECT 1 FROM matches m 
      WHERE m.user1_id = current_user_id AND m.user2_id = p.id
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

-- Step 7: Create helper function to ensure mutual matches are properly updated
CREATE OR REPLACE FUNCTION public.update_mutual_matches(
  user1_id uuid,
  user2_id uuid,
  sport_name sport_type
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update all like records between these two users for this sport to be mutual
  UPDATE matches 
  SET is_mutual = true
  WHERE ((matches.user1_id = user1_id AND matches.user2_id = user2_id) 
         OR (matches.user1_id = user2_id AND matches.user2_id = user1_id))
    AND sport = sport_name
    AND is_liked = true;
END;
$$;

-- Step 8: Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_user_action TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_mutual_match TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_dislike TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_mutual_matches TO authenticated;

-- Success message
SELECT 'All migrations applied successfully! Your database now supports likes and dislikes.' as status;
