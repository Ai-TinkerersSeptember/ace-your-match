-- Fix matching by creating the missing handle_mutual_match function
-- Run this in your Supabase SQL Editor

-- Create function to handle mutual matches
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
DECLARE
  existing_match record;
  new_match_id uuid;
  conversation_id uuid;
  result json;
BEGIN
  -- Check if there's already a match in the opposite direction
  SELECT * INTO existing_match
  FROM matches
  WHERE user1_id = target_user_id 
    AND user2_id = current_user_id 
    AND sport = sport_name
    AND is_mutual = false;
  
  IF existing_match IS NOT NULL THEN
    -- Update the existing match to be mutual
    UPDATE matches 
    SET is_mutual = true
    WHERE id = existing_match.id;
    
    -- Create a conversation for the mutual match
    INSERT INTO conversations (match_id, user1_id, user2_id)
    VALUES (existing_match.id, target_user_id, current_user_id)
    ON CONFLICT (match_id) DO NOTHING
    RETURNING id INTO conversation_id;
    
    -- Return success with match info
    result := json_build_object(
      'success', true,
      'is_mutual', true,
      'existing_match_id', existing_match.id,
      'conversation_id', conversation_id,
      'message', 'Match is now mutual! You can start messaging.'
    );
  ELSE
    -- Create a new one-way match
    INSERT INTO matches (user1_id, user2_id, sport, is_mutual)
    VALUES (current_user_id, target_user_id, sport_name, false)
    RETURNING id INTO new_match_id;
    
    -- Return success with new match info
    result := json_build_object(
      'success', true,
      'is_mutual', false,
      'new_match_id', new_match_id,
      'message', 'Match created! If they like you back, you will be matched!'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_mutual_match TO authenticated;

-- Also create the debug function
CREATE OR REPLACE FUNCTION public.debug_matching_data(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_prefs record;
  total_profiles integer;
  excluded_by_match integer;
  excluded_by_age integer;
  excluded_by_gender integer;
  excluded_by_sport integer;
  excluded_by_distance integer;
  available_profiles integer;
  result json;
BEGIN
  -- Get user preferences
  SELECT * INTO user_prefs 
  FROM user_preferences 
  WHERE user_preferences.user_id = user_id;
  
  -- Count total profiles (excluding current user)
  SELECT COUNT(*) INTO total_profiles
  FROM profiles p
  WHERE p.id != user_id;
  
  -- Count profiles excluded by existing matches
  SELECT COUNT(*) INTO excluded_by_match
  FROM profiles p
  WHERE p.id != user_id
    AND EXISTS (
      SELECT 1 FROM matches m 
      WHERE (m.user1_id = user_id AND m.user2_id = p.id)
         OR (m.user2_id = user_id AND m.user1_id = p.id)
    );
  
  -- Count profiles excluded by age
  SELECT COUNT(*) INTO excluded_by_age
  FROM profiles p
  WHERE p.id != user_id
    AND NOT EXISTS (
      SELECT 1 FROM matches m 
      WHERE (m.user1_id = user_id AND m.user2_id = p.id)
         OR (m.user2_id = user_id AND m.user1_id = p.id)
    )
    AND (
      (user_prefs.age_range_min IS NOT NULL AND p.age < user_prefs.age_range_min)
      OR (user_prefs.age_range_max IS NOT NULL AND p.age > user_prefs.age_range_max)
    );
  
  -- Count profiles excluded by gender
  SELECT COUNT(*) INTO excluded_by_gender
  FROM profiles p
  WHERE p.id != user_id
    AND NOT EXISTS (
      SELECT 1 FROM matches m 
      WHERE (m.user1_id = user_id AND m.user2_id = p.id)
         OR (m.user2_id = user_id AND m.user1_id = p.id)
    )
    AND (user_prefs.age_range_min IS NULL OR p.age >= user_prefs.age_range_min)
    AND (user_prefs.age_range_max IS NULL OR p.age <= user_prefs.age_range_max)
    AND (user_prefs.gender_preference IS NOT NULL AND p.gender != ALL(user_prefs.gender_preference));
  
  -- Count profiles excluded by sport
  SELECT COUNT(*) INTO excluded_by_sport
  FROM profiles p
  WHERE p.id != user_id
    AND NOT EXISTS (
      SELECT 1 FROM matches m 
      WHERE (m.user1_id = user_id AND m.user2_id = p.id)
         OR (m.user2_id = user_id AND m.user1_id = p.id)
    )
    AND (user_prefs.age_range_min IS NULL OR p.age >= user_prefs.age_range_min)
    AND (user_prefs.age_range_max IS NULL OR p.age <= user_prefs.age_range_max)
    AND (user_prefs.gender_preference IS NULL OR p.gender = ANY(user_prefs.gender_preference))
    AND NOT EXISTS (
      SELECT 1 FROM user_sports us1
      JOIN user_sports us2 ON us1.sport = us2.sport
      WHERE us1.user_id = user_id 
        AND us2.user_id = p.id
    );
  
  -- Count available profiles
  SELECT COUNT(*) INTO available_profiles
  FROM profiles p
  WHERE p.id != user_id
    AND NOT EXISTS (
      SELECT 1 FROM matches m 
      WHERE (m.user1_id = user_id AND m.user2_id = p.id)
         OR (m.user2_id = user_id AND m.user1_id = p.id)
    )
    AND (user_prefs.age_range_min IS NULL OR p.age >= user_prefs.age_range_min)
    AND (user_prefs.age_range_max IS NULL OR p.age <= user_prefs.age_range_max)
    AND (user_prefs.gender_preference IS NULL OR p.gender = ANY(user_prefs.gender_preference))
    AND EXISTS (
      SELECT 1 FROM user_sports us1
      JOIN user_sports us2 ON us1.sport = us2.sport
      WHERE us1.user_id = user_id 
        AND us2.user_id = p.id
    );
  
  result := json_build_object(
    'user_id', user_id,
    'user_preferences', row_to_json(user_prefs),
    'total_profiles', total_profiles,
    'excluded_by_match', excluded_by_match,
    'excluded_by_age', excluded_by_age,
    'excluded_by_gender', excluded_by_gender,
    'excluded_by_sport', excluded_by_sport,
    'available_profiles', available_profiles
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.debug_matching_data TO authenticated;
