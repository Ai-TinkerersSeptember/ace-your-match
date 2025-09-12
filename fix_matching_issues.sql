-- Quick fix for common matching issues
-- Run this after the debug script to resolve typical problems

-- Issue 1: Current user might not have sports set up
-- Let's add some sports for the current user if they don't have any
INSERT INTO user_sports (user_id, sport, skill_level)
SELECT 
  auth.uid(),
  unnest(ARRAY['tennis', 'pickleball', 'basketball']) as sport,
  'intermediate' as skill_level
WHERE NOT EXISTS (
  SELECT 1 FROM user_sports WHERE user_id = auth.uid()
)
ON CONFLICT DO NOTHING;

-- Issue 2: Current user might not have preferences set up
-- Let's create basic preferences if they don't exist
INSERT INTO user_preferences (
  user_id,
  age_range_min,
  age_range_max,
  gender_preference,
  max_travel_distance,
  frequency,
  preferred_days,
  preferred_time_slots,
  venue_types,
  location_enabled
)
SELECT 
  auth.uid(),
  18,
  65,
  ARRAY['male', 'female', 'non_binary']::gender_type[],
  50,
  'flexible'::frequency,
  ARRAY[1,2,3,4,5,6,7],
  ARRAY['morning', 'afternoon', 'evening']::time_slot[],
  ARRAY['public_free', 'paid_facility']::venue_type[],
  false  -- Disable location to see matches from anywhere
WHERE NOT EXISTS (
  SELECT 1 FROM user_preferences WHERE user_id = auth.uid()
)
ON CONFLICT (user_id) DO UPDATE SET
  location_enabled = false,  -- Disable location filtering
  gender_preference = ARRAY['male', 'female', 'non_binary']::gender_type[],
  age_range_min = 18,
  age_range_max = 65;

-- Issue 3: Test the matching function after fixes
SELECT 'Testing matches after fixes:' as status;
SELECT 
  id,
  name,
  age,
  location,
  distance_km
FROM get_potential_matches(NULL, NULL, 100, 10);

-- Issue 4: If still no results, let's create a simple test
-- Show profiles that share sports with current user (ignoring other filters)
SELECT 'Profiles sharing sports (ignoring other filters):' as status;
SELECT DISTINCT
  p.name,
  p.age,
  p.gender,
  p.location,
  us2.sport,
  us2.skill_level
FROM profiles p
JOIN user_sports us2 ON p.id = us2.user_id
WHERE p.id != auth.uid()
  AND us2.sport IN (
    SELECT sport FROM user_sports WHERE user_id = auth.uid()
  )
LIMIT 10;
