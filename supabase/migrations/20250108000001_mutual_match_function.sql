-- Create function to handle mutual matches
-- This function checks if a reverse match exists and updates it to mutual
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
    
    -- Return success with match info
    result := json_build_object(
      'success', true,
      'is_mutual', true,
      'existing_match_id', existing_match.id,
      'message', 'Match is now mutual!'
    );
  ELSE
    -- Create a new one-way match
    INSERT INTO matches (user1_id, user2_id, sport, is_mutual)
    VALUES (current_user_id, target_user_id, sport_name, false);
    
    -- Return success with new match info
    result := json_build_object(
      'success', true,
      'is_mutual', false,
      'message', 'Match created! If they like you back, you will be matched!'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_mutual_match TO authenticated;
