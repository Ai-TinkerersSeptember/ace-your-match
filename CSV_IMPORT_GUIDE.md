# 📊 CSV Import Guide for Supabase

You now have 3 CSV files with 300 dummy user profiles ready to import into your Supabase database!

## 📁 Generated Files:

- **`generated-data/profiles.csv`** - 300 user profiles
- **`generated-data/user_preferences.csv`** - 300 user preference records  
- **`generated-data/user_sports.csv`** - 615 user sport entries (users can have multiple sports)

## 🚀 How to Import into Supabase:

### Step 1: Open Supabase Dashboard
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click on **Table Editor** in the left sidebar

### Step 2: Import Profiles
1. Click on the **`profiles`** table
2. Click the **"Insert"** dropdown → **"Import data via CSV"**
3. Upload `generated-data/profiles.csv`
4. Make sure column mapping is correct:
   - `id` → `id`
   - `name` → `name` 
   - `age` → `age`
   - `gender` → `gender`
   - `bio` → `bio`
   - `location` → `location`
   - `latitude` → `latitude`
   - `longitude` → `longitude`
   - `profile_photo_url` → `profile_photo_url`
   - `created_at` → `created_at`
   - `updated_at` → `updated_at`
5. Click **"Import"**

### Step 3: Import User Preferences  
1. Click on the **`user_preferences`** table
2. Click **"Insert"** → **"Import data via CSV"**
3. Upload `generated-data/user_preferences.csv`
4. Verify column mapping:
   - `id` → `id`
   - `user_id` → `user_id`
   - `age_range_min` → `age_range_min`
   - `age_range_max` → `age_range_max`
   - `gender_preference` → `gender_preference` (array)
   - `max_travel_distance` → `max_travel_distance`
   - `frequency` → `frequency`
   - `preferred_days` → `preferred_days` (array)
   - `preferred_time_slots` → `preferred_time_slots` (array)
   - `venue_types` → `venue_types` (array)
   - `created_at` → `created_at`
   - `updated_at` → `updated_at`
5. Click **"Import"**

### Step 4: Import User Sports
1. Click on the **`user_sports`** table  
2. Click **"Insert"** → **"Import data via CSV"**
3. Upload `generated-data/user_sports.csv`
4. Verify column mapping:
   - `id` → `id`
   - `user_id` → `user_id`
   - `sport` → `sport`
   - `skill_level` → `skill_level`
   - `created_at` → `created_at`
5. Click **"Import"**

## ⚠️ Important Notes:

### Array Fields
The CSV contains array fields (like `gender_preference`) in the format `"{value1,value2}"`. Supabase should automatically parse these correctly.

### Order Matters
Import in this exact order:
1. **profiles** first (other tables reference this)
2. **user_preferences** second (references profiles)
3. **user_sports** last (references profiles)

### If Import Fails
If you get errors about Row Level Security (RLS):
1. Go to **Authentication** → **Policies** 
2. Temporarily disable RLS policies for import
3. Re-enable them after import is complete

Or use the SQL Editor to import directly:

```sql
-- Temporarily disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;  
ALTER TABLE user_sports DISABLE ROW LEVEL SECURITY;

-- Import your CSV files through the UI

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sports ENABLE ROW LEVEL SECURITY;
```

## 🎯 What You'll Get:

After importing, your database will have:

### 📊 **300 Diverse Users** across:
- **20 Major Cities**: New York, LA, Chicago, Austin, Seattle, etc.
- **All Age Groups**: 18-65 years old
- **All Genders**: Male, female, non-binary, prefer not to say
- **All Sports**: Tennis, Pickleball, Basketball, Badminton, Squash, Racquetball
- **All Skill Levels**: Beginner to Expert

### 🎮 **Perfect for Testing**:
- Matching algorithm with diverse preferences
- Location-based filtering 
- Age and gender preferences
- Sport and skill level matching
- UI with realistic profile data
- User flows with authentic-looking profiles

## ✅ Verification:

After import, run these queries in the SQL Editor to verify:

```sql
-- Check profile count
SELECT COUNT(*) FROM profiles;
-- Should return: 300

-- Check preferences count  
SELECT COUNT(*) FROM user_preferences;
-- Should return: 300

-- Check sports count
SELECT COUNT(*) FROM user_sports; 
-- Should return: ~615 (users have 1-3 sports each)

-- Sample a few profiles
SELECT name, age, gender, location FROM profiles LIMIT 5;
```

## 🚀 Ready to Test!

Your app now has 300 realistic users that your real users can:
- ✅ Browse as potential matches
- ✅ Like and dislike  
- ✅ Get mutual matches with
- ✅ Test the complete matching flow
- ✅ Practice messaging and conversations

Perfect for development, testing, and demos! 🎉
