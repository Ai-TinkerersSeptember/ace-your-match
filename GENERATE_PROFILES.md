# Generate Dummy User Profiles

This script generates 300 realistic dummy user profiles for your sports matching app to help with testing and development.

## What it generates:

### 📋 Profile Data (300 users)
- **Names**: Gender-appropriate first names + common last names
- **Ages**: Random ages between 18-65
- **Genders**: Mixed distribution across all gender types
- **Locations**: 20 major US cities with realistic lat/lng coordinates
- **Photos**: Placeholder profile photos from Unsplash
- **Bios**: Realistic, sport-specific bio templates

### 🏆 Sports Data
- **Sports**: Tennis, Pickleball, Basketball, Badminton, Squash, Racquetball
- **Skill Levels**: Beginner, Intermediate, Advanced, Expert
- **Multiple Sports**: Each user can play 1-3 different sports

### ⚙️ User Preferences
- **Age Range**: Realistic preferences based on user's age
- **Gender Preferences**: Mixed preferences
- **Travel Distance**: 5-30 km radius
- **Frequency**: 1-2/week, 3-4/week, daily, or flexible
- **Preferred Days**: 2-5 days of the week
- **Time Slots**: Morning, afternoon, evening combinations
- **Venue Types**: Public courts, private clubs, paid facilities, home courts

## How to use:

### 1. Set up environment variables

You need your Supabase credentials. Create a `.env` file in the project root:

```bash
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can find these in your Supabase project dashboard under Settings > API.

### 2. Run the generator

```bash
npm run generate-profiles
```

Or run directly:

```bash
node generate-profiles-simple.js
```

### 3. What happens:

1. **Generates 300 profiles** with diverse characteristics
2. **Creates user preferences** for each profile
3. **Assigns sports** and skill levels to each user
4. **Inserts data in batches** to avoid timeouts
5. **Shows progress** as it runs

## Generated Data Distribution:

- **Cities**: 20 major US cities
- **Age Range**: 18-65 years old
- **Gender Mix**: Balanced across all types
- **Sports Distribution**: Random 1-3 sports per user
- **Skill Levels**: Realistic distribution across all levels
- **Location Spread**: Users distributed across different cities

## Sample Generated Profile:

```json
{
  "profile": {
    "name": "Sarah Johnson",
    "age": 28,
    "gender": "female",
    "bio": "Passionate tennis player seeking a fun partner to improve my game. I enjoy good coffee, live music, and weekend adventures.",
    "location": "Austin, TX",
    "latitude": 30.2672,
    "longitude": -97.7431,
    "profile_photo_url": "https://images.unsplash.com/photo-1494790108755-2616b612b5bc"
  },
  "preferences": {
    "age_range_min": 23,
    "age_range_max": 35,
    "gender_preference": ["male", "female"],
    "max_travel_distance": 15,
    "frequency": "3_4_per_week",
    "preferred_days": [1, 3, 5, 6],
    "preferred_time_slots": ["evening"],
    "venue_types": ["public_free", "paid_facility"]
  },
  "sports": [
    {
      "sport": "tennis",
      "skill_level": "intermediate"
    },
    {
      "sport": "pickleball", 
      "skill_level": "beginner"
    }
  ]
}
```

## Database Tables Populated:

1. **profiles** - Basic user information
2. **user_preferences** - Matching preferences and availability
3. **user_sports** - Sports and skill levels

## Safety Features:

- **Batch Processing**: Inserts data in smaller batches to avoid timeouts
- **Error Handling**: Stops on errors and shows detailed error messages
- **Progress Tracking**: Shows progress every 50 profiles generated
- **UUID Generation**: Creates proper UUIDs for all records

## After Running:

Your app will now have 300 diverse users that your real users can:
- ✅ View as potential matches
- ✅ Like or dislike
- ✅ Get matched with (if mutual)
- ✅ Practice the full user flow

Perfect for testing your matching algorithm, UI components, and user interactions!
