const { randomBytes } = require('crypto');
const fs = require('fs');
const path = require('path');

// This version creates profiles WITH UUIDs that don't conflict with auth system
// We'll generate random UUIDs for dummy profiles

// Sample data for generating realistic profiles
const firstNames = {
  male: ['Alex', 'Ben', 'Chris', 'David', 'Ethan', 'Felix', 'Gabriel', 'Henry', 'Ian', 'Jack', 'Kevin', 'Liam', 'Michael', 'Nathan', 'Oliver', 'Paul', 'Quinn', 'Ryan', 'Sam', 'Tom', 'Victor', 'William', 'Xavier', 'Yuki', 'Zach', 'Adam', 'Blake', 'Connor', 'Daniel', 'Eric'],
  female: ['Alice', 'Bella', 'Claire', 'Diana', 'Emma', 'Fiona', 'Grace', 'Hannah', 'Iris', 'Julia', 'Kate', 'Luna', 'Maya', 'Nina', 'Olivia', 'Paige', 'Quinn', 'Rachel', 'Sarah', 'Tara', 'Uma', 'Violet', 'Wendy', 'Xara', 'Yasmin', 'Zoe', 'Aria', 'Brooke', 'Chloe', 'Delia'],
  non_binary: ['Avery', 'Bailey', 'Casey', 'Drew', 'Emery', 'Finley', 'Gray', 'Harper', 'Indigo', 'Jordan', 'Kai', 'Logan', 'Morgan', 'Nova', 'Oakley', 'Parker', 'River', 'Sage', 'Taylor', 'Unity', 'Vale', 'Winter', 'Xen', 'Yael', 'Zen']
};

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

const cities = [
  { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
  { name: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
  { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740 },
  { name: 'Philadelphia, PA', lat: 39.9526, lng: -75.1652 },
  { name: 'San Antonio, TX', lat: 29.4241, lng: -98.4936 },
  { name: 'San Diego, CA', lat: 32.7157, lng: -117.1611 },
  { name: 'Dallas, TX', lat: 32.7767, lng: -96.7970 },
  { name: 'San Jose, CA', lat: 37.3382, lng: -121.8863 },
  { name: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
  { name: 'Jacksonville, FL', lat: 30.3322, lng: -81.6557 },
  { name: 'Fort Worth, TX', lat: 32.7555, lng: -97.3308 },
  { name: 'Columbus, OH', lat: 39.9612, lng: -82.9988 },
  { name: 'Charlotte, NC', lat: 35.2271, lng: -80.8431 },
  { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
  { name: 'Indianapolis, IN', lat: 39.7684, lng: -86.1581 },
  { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
  { name: 'Denver, CO', lat: 39.7392, lng: -104.9903 },
  { name: 'Boston, MA', lat: 42.3601, lng: -71.0589 }
];

const bioTemplates = [
  "Love playing {sport}! Looking for someone to hit the courts with. When I'm not playing, you can find me exploring new restaurants or hiking trails.",
  "Passionate {sport} player seeking a fun partner to improve my game. I enjoy good coffee, live music, and weekend adventures.",
  "Been playing {sport} for {years} years and always looking to meet new people on the court. Big fan of outdoor activities and trying new cuisines.",
  "{sport} enthusiast who believes in work-life balance. Love to travel, read, and catch up with friends over a good game.",
  "Competitive {sport} player looking for someone who shares my passion for the sport. Also enjoy cooking, movies, and exploring the city.",
  "Just started playing {sport} and loving every minute of it! Looking for patient partners to learn and have fun with.",
  "Weekend warrior on the {sport} court. When not playing, I'm probably at a brewery, watching sports, or planning my next vacation.",
  "{sport} is my stress relief after long work days. Would love to find a regular playing partner who enjoys good conversation too.",
  "Lifelong {sport} player who loves the competitive spirit and social aspect of the game. Always up for post-game drinks!",
  "New to the area and looking to meet people through {sport}. I'm friendly, reliable, and always bring good energy to the court."
];

const profilePhotos = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face'
];

// Enums from the database
const genderTypes = ['male', 'female', 'non_binary', 'prefer_not_to_say'];
const sportTypes = ['tennis', 'pickleball', 'basketball', 'badminton', 'squash', 'racquetball'];
const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
const frequencies = ['1_2_per_week', '3_4_per_week', 'daily', 'flexible'];
const timeSlots = ['morning', 'afternoon', 'evening'];
const venueTypes = ['public_free', 'private_club', 'paid_facility', 'home_court'];

// Helper functions
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];
const randomChoices = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
};
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;

// Generate a UUID v4
const generateUUID = () => {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
  
  const hex = bytes.toString('hex');
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32)
  ].join('-');
};

// CSV helper functions
const escapeCSV = (field) => {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const arrayToCSV = (array) => {
  return `"{${array.join(',')}}"`;
};

const generateProfile = () => {
  const gender = randomChoice(genderTypes);
  const age = randomInt(18, 65);
  const city = randomChoice(cities);
  
  // Generate name based on gender
  let firstName;
  if (gender === 'male') {
    firstName = randomChoice(firstNames.male);
  } else if (gender === 'female') {
    firstName = randomChoice(firstNames.female);
  } else {
    firstName = randomChoice(firstNames.non_binary);
  }
  const lastName = randomChoice(lastNames);
  const name = `${firstName} ${lastName}`;
  
  // Generate location with some variation around the city center
  const latitude = city.lat + randomFloat(-0.5, 0.5);
  const longitude = city.lng + randomFloat(-0.5, 0.5);
  
  // Generate sports and bio
  const userSports = randomChoices(sportTypes, randomInt(1, 3));
  const primarySport = userSports[0];
  const years = randomInt(1, 20);
  
  const bio = randomChoice(bioTemplates)
    .replace('{sport}', primarySport)
    .replace('{years}', years);
  
  const profile = {
    id: generateUUID(),
    name,
    age,
    gender,
    bio,
    location: city.name,
    latitude: latitude.toFixed(6),
    longitude: longitude.toFixed(6),
    profile_photo_url: randomChoice(profilePhotos),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Generate user preferences
  const preferences = {
    id: generateUUID(),
    user_id: profile.id,
    age_range_min: Math.max(18, age - randomInt(5, 15)),
    age_range_max: Math.min(65, age + randomInt(5, 15)),
    gender_preference: randomChoices(genderTypes, randomInt(1, 2)),
    max_travel_distance: randomChoice([5, 10, 15, 20, 25, 30]),
    frequency: randomChoice(frequencies),
    preferred_days: randomChoices([1, 2, 3, 4, 5, 6, 7], randomInt(2, 5)),
    preferred_time_slots: randomChoices(timeSlots, randomInt(1, 3)),
    venue_types: randomChoices(venueTypes, randomInt(1, 3)),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Generate user sports with skill levels
  const sports = userSports.map(sport => ({
    id: generateUUID(),
    user_id: profile.id,
    sport,
    skill_level: randomChoice(skillLevels),
    created_at: new Date().toISOString()
  }));
  
  return { profile, preferences, sports };
};

const generateSQLScript = () => {
  console.log('🚀 Starting to generate 300 user profiles as SQL script...');
  console.log('⚠️  This will create a SQL script that bypasses foreign key constraints');
  
  const allProfiles = [];
  const allPreferences = [];
  const allSports = [];
  
  for (let i = 0; i < 300; i++) {
    const { profile, preferences, sports } = generateProfile();
    allProfiles.push(profile);
    allPreferences.push(preferences);
    allSports.push(...sports);
    
    if ((i + 1) % 50 === 0) {
      console.log(`Generated ${i + 1} profiles...`);
    }
  }
  
  console.log('Generated all profiles. Now creating SQL script...');
  
  // Create output directory
  const outputDir = path.join(__dirname, 'generated-data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  // Generate SQL script that inserts everything
  console.log('Creating insert_dummy_profiles.sql...');
  
  let sqlScript = `-- SQL script to insert 300 dummy user profiles
-- This script temporarily disables foreign key constraints to allow dummy data insertion

-- Start transaction
BEGIN;

-- Temporarily disable foreign key constraints and RLS
SET session_replication_role = replica;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sports DISABLE ROW LEVEL SECURITY;

-- Insert profiles
INSERT INTO profiles (id, name, age, gender, bio, location, latitude, longitude, profile_photo_url, created_at, updated_at) VALUES\n`;

  // Add profiles
  allProfiles.forEach((profile, index) => {
    sqlScript += `  ('${profile.id}', ${escapeSQL(profile.name)}, ${profile.age}, '${profile.gender}', ${escapeSQL(profile.bio)}, ${escapeSQL(profile.location)}, ${profile.latitude}, ${profile.longitude}, '${profile.profile_photo_url}', '${profile.created_at}', '${profile.updated_at}')`;
    sqlScript += index < allProfiles.length - 1 ? ',\n' : ';\n\n';
  });

  // Add preferences
  sqlScript += `-- Insert user preferences
INSERT INTO user_preferences (id, user_id, age_range_min, age_range_max, gender_preference, max_travel_distance, frequency, preferred_days, preferred_time_slots, venue_types, created_at, updated_at) VALUES\n`;

  allPreferences.forEach((pref, index) => {
    const genderPrefArray = `ARRAY['${pref.gender_preference.join("','")}']::gender_type[]`;
    const daysArray = `ARRAY[${pref.preferred_days.join(',')}]`;
    const timeSlotsArray = `ARRAY['${pref.preferred_time_slots.join("','")}']::time_slot[]`;
    const venueTypesArray = `ARRAY['${pref.venue_types.join("','")}']::venue_type[]`;
    
    sqlScript += `  ('${pref.id}', '${pref.user_id}', ${pref.age_range_min}, ${pref.age_range_max}, ${genderPrefArray}, ${pref.max_travel_distance}, '${pref.frequency}'::frequency, ${daysArray}, ${timeSlotsArray}, ${venueTypesArray}, '${pref.created_at}', '${pref.updated_at}')`;
    sqlScript += index < allPreferences.length - 1 ? ',\n' : ';\n\n';
  });

  // Add sports
  sqlScript += `-- Insert user sports
INSERT INTO user_sports (id, user_id, sport, skill_level, created_at) VALUES\n`;

  allSports.forEach((sport, index) => {
    sqlScript += `  ('${sport.id}', '${sport.user_id}', '${sport.sport}'::sport_type, '${sport.skill_level}'::skill_level, '${sport.created_at}')`;
    sqlScript += index < allSports.length - 1 ? ',\n' : ';\n\n';
  });

  sqlScript += `-- Re-enable foreign key constraints and RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sports ENABLE ROW LEVEL SECURITY;
SET session_replication_role = DEFAULT;

-- Commit transaction
COMMIT;

-- Verify the import
SELECT 
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(*) FROM user_preferences) as preferences_count,
  (SELECT COUNT(*) FROM user_sports) as sports_count;

-- Sample some profiles
SELECT name, age, gender, location FROM profiles ORDER BY created_at LIMIT 10;
`;

  fs.writeFileSync(path.join(outputDir, 'insert_dummy_profiles.sql'), sqlScript);
  
  console.log('\n🎉 Successfully generated SQL script!');
  console.log(`📊 Stats:
  - Profiles: ${allProfiles.length}
  - Preferences: ${allPreferences.length}
  - Sports entries: ${allSports.length}
  - Cities covered: ${cities.length}
  - Age range: 18-65
  - Gender distribution: Mixed across all types
  - Sports: ${sportTypes.join(', ')}
  `);
  
  console.log(`📁 File created: ${outputDir}/insert_dummy_profiles.sql`);
  
  console.log(`🎮 Usage:
  1. Go to Supabase SQL Editor
  2. Copy and paste the contents of insert_dummy_profiles.sql
  3. Run the script
  4. Your app will have 300 dummy users ready for testing!
  
  ⚠️  This script temporarily disables security constraints to insert dummy data.
  `);
};

// Helper function to escape SQL strings
function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

// Run the generator
generateSQLScript();
