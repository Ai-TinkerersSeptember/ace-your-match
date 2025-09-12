-- Debug script to understand why dummy profiles aren't showing up as matches
-- Run this in Supabase SQL Editor to diagnose the issue

-- First, let's see what's in your current user's profile and preferences
SELECT 'Current User Profile:' as debug_section;
SELECT 
  p.id,
  p.name,
  p.age,
  p.gender,
  p.location,
  p.latitude,
  p.longitude
FROM profiles p 
WHERE p.id = auth.uid();

SELECT 'Current User Preferences:' as debug_section;
SELECT 
  up.age_range_min,
  up.age_range_max,
  up.gender_preference,
  up.max_travel_distance,
  up.location_enabled,
  up.frequency,
  up.preferred_days,
  up.preferred_time_slots,
  up.venue_types
FROM user_preferences up 
WHERE up.user_id = auth.uid();

SELECT 'Current User Sports:' as debug_section;
SELECT 
  us.sport,
  us.skill_level
FROM user_sports us 
WHERE us.user_id = auth.uid();

-- Check how many dummy profiles exist
SELECT 'Total Profiles in Database:' as debug_section;
SELECT COUNT(*) as total_profiles FROM profiles;

SELECT 'Profiles with Sports:' as debug_section;
SELECT COUNT(DISTINCT p.id) as profiles_with_sports 
FROM profiles p
JOIN user_sports us ON p.id = us.user_id;

-- Check if dummy profiles have the sports data
SELECT 'Sample Dummy Profile Sports:' as debug_section;
SELECT 
  p.name,
  p.age,
  p.gender,
  p.location,
  string_agg(us.sport || ' (' || us.skill_level || ')', ', ') as sports
FROM profiles p
LEFT JOIN user_sports us ON p.id = us.user_id
WHERE p.id != auth.uid()
GROUP BY p.id, p.name, p.age, p.gender, p.location
LIMIT 10;

-- Check what sports overlap between current user and dummy profiles
SELECT 'Sports Overlap Analysis:' as debug_section;
SELECT 
  current_user_sports.sport,
  COUNT(dummy_sports.user_id) as dummy_profiles_with_this_sport
FROM (
  SELECT sport FROM user_sports WHERE user_id = auth.uid()
) current_user_sports
LEFT JOIN user_sports dummy_sports ON current_user_sports.sport = dummy_sports.sport
  AND dummy_sports.user_id != auth.uid()
GROUP BY current_user_sports.sport;

-- Test the matching function directly
SELECT 'Direct Function Test (first 5 results):' as debug_section;
SELECT * FROM get_potential_matches() LIMIT 5;

-- Check if there are any matches already created (which would exclude profiles)
SELECT 'Existing Matches:' as debug_section;
SELECT COUNT(*) as existing_matches_count 
FROM matches 
WHERE user1_id = auth.uid() OR user2_id = auth.uid();

-- Final comprehensive check - step by step filtering
SELECT 'Step-by-Step Filter Analysis:' as debug_section;

-- Step 1: All profiles except current user
WITH step1 AS (
  SELECT COUNT(*) as count FROM profiles WHERE id != auth.uid()
),
-- Step 2: Profiles not already matched
step2 AS (
  SELECT COUNT(*) as count 
  FROM profiles p
  WHERE p.id != auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM matches m 
      WHERE (m.user1_id = auth.uid() AND m.user2_id = p.id)
         OR (m.user2_id = auth.uid() AND m.user1_id = p.id)
    )
),
-- Step 3: Add sports requirement
step3 AS (
  SELECT COUNT(*) as count 
  FROM profiles p
  WHERE p.id != auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM matches m 
      WHERE (m.user1_id = auth.uid() AND m.user2_id = p.id)
         OR (m.user2_id = auth.uid() AND m.user1_id = p.id)
    )
    AND EXISTS (
      SELECT 1 FROM user_sports us1
      JOIN user_sports us2 ON us1.sport = us2.sport
      WHERE us1.user_id = auth.uid() 
        AND us2.user_id = p.id
    )
)
SELECT 
  'All profiles (except current user): ' || step1.count as filter_step,
  step1.count as remaining_count
FROM step1
UNION ALL
SELECT 
  'After excluding already matched: ' || step2.count as filter_step,
  step2.count as remaining_count
FROM step2
UNION ALL
SELECT 
  'After requiring shared sports: ' || step3.count as filter_step,
  step3.count as remaining_count
FROM step3;
