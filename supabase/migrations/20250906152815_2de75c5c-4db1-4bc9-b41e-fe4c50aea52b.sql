-- Drop existing types if they exist
DROP TYPE IF EXISTS gender_type CASCADE;
DROP TYPE IF EXISTS sport_type CASCADE;
DROP TYPE IF EXISTS skill_level CASCADE;
DROP TYPE IF EXISTS venue_type CASCADE;
DROP TYPE IF EXISTS time_slot CASCADE;
DROP TYPE IF EXISTS frequency CASCADE;

-- Create enums
CREATE TYPE gender_type AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');
CREATE TYPE sport_type AS ENUM ('tennis', 'pickleball', 'basketball', 'badminton', 'squash', 'racquetball');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE venue_type AS ENUM ('public_free', 'private_club', 'paid_facility', 'home_court');
CREATE TYPE time_slot AS ENUM ('morning', 'afternoon', 'evening');
CREATE TYPE frequency AS ENUM ('1_2_per_week', '3_4_per_week', 'daily', 'flexible');

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  age INTEGER,
  gender gender_type,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  bio TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sports table
CREATE TABLE IF NOT EXISTS public.user_sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport sport_type NOT NULL,
  skill_level skill_level NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sport)
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_days INTEGER[] DEFAULT '{}',
  preferred_time_slots time_slot[] DEFAULT '{}',
  frequency frequency DEFAULT 'flexible',
  venue_types venue_type[] DEFAULT '{}',
  max_travel_distance INTEGER DEFAULT 10,
  age_range_min INTEGER,
  age_range_max INTEGER,
  gender_preference gender_type[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport sport_type NOT NULL,
  is_mutual BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id, sport),
  CHECK (user1_id != user2_id)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_sports
CREATE POLICY "Users can view all sports" ON public.user_sports FOR SELECT USING (true);
CREATE POLICY "Users can manage own sports" ON public.user_sports FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view all preferences" ON public.user_preferences FOR SELECT USING (true);
CREATE POLICY "Users can manage own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for matches
CREATE POLICY "Users can view their matches" ON public.matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can create matches" ON public.matches FOR INSERT WITH CHECK (auth.uid() = user1_id);
CREATE POLICY "Users can update their matches" ON public.matches FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id 
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);
CREATE POLICY "Users can send messages" ON public.messages 
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id 
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();