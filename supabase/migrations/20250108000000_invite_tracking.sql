-- Create invite tracking system
-- This migration adds tables and functions for tracking user invites and rewards

-- Create invites table to track referral links and their usage
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create invite_redemptions table to track when invites are used
CREATE TABLE public.invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID REFERENCES public.invites(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  redeemer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(invite_id, redeemer_id)
);

-- Create user_rewards table to track user achievements and rewards
CREATE TABLE public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL, -- 'invite_bonus', 'priority_matching', 'exclusive_feature'
  reward_value INTEGER DEFAULT 0, -- points or count
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, reward_type)
);

-- Enable RLS
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invites
CREATE POLICY "Users can view their own invites" ON public.invites FOR SELECT USING (auth.uid() = inviter_id);
CREATE POLICY "Users can create invites" ON public.invites FOR INSERT WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "Users can update their own invites" ON public.invites FOR UPDATE USING (auth.uid() = inviter_id);

-- RLS Policies for invite_redemptions
CREATE POLICY "Users can view their invite redemptions" ON public.invite_redemptions FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = redeemer_id);
CREATE POLICY "Users can create invite redemptions" ON public.invite_redemptions FOR INSERT WITH CHECK (auth.uid() = redeemer_id);

-- RLS Policies for user_rewards
CREATE POLICY "Users can view their own rewards" ON public.user_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view all rewards" ON public.user_rewards FOR SELECT USING (true); -- For leaderboards

-- Function to create an invite code
CREATE OR REPLACE FUNCTION create_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character code
    invite_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.invites WHERE invite_code = invite_code) INTO code_exists;
    
    -- If code doesn't exist, break the loop
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN invite_code;
END;
$$;

-- Function to redeem an invite
CREATE OR REPLACE FUNCTION redeem_invite(invite_code_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_record RECORD;
  inviter_rewards INTEGER;
  result JSON;
BEGIN
  -- Check if invite code exists and is active
  SELECT * INTO invite_record 
  FROM public.invites 
  WHERE invite_code = invite_code_param 
    AND is_active = TRUE 
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Invalid or expired invite code');
  END IF;
  
  -- Check if user has already redeemed this invite
  IF EXISTS(
    SELECT 1 FROM public.invite_redemptions 
    WHERE invite_id = invite_record.id 
    AND redeemer_id = auth.uid()
  ) THEN
    RETURN json_build_object('success', false, 'message', 'You have already used this invite code');
  END IF;
  
  -- Check if user is trying to use their own invite
  IF invite_record.inviter_id = auth.uid() THEN
    RETURN json_build_object('success', false, 'message', 'You cannot use your own invite code');
  END IF;
  
  -- Create redemption record
  INSERT INTO public.invite_redemptions (invite_id, inviter_id, redeemer_id)
  VALUES (invite_record.id, invite_record.inviter_id, auth.uid());
  
  -- Award points to inviter
  INSERT INTO public.user_rewards (user_id, reward_type, reward_value, description)
  VALUES (invite_record.inviter_id, 'invite_bonus', 100, 'Friend joined via your invite!')
  ON CONFLICT (user_id, reward_type) 
  DO UPDATE SET 
    reward_value = user_rewards.reward_value + 100,
    created_at = NOW();
  
  -- Award points to redeemer
  INSERT INTO public.user_rewards (user_id, reward_type, reward_value, description)
  VALUES (auth.uid(), 'invite_bonus', 50, 'Joined via friend invite!')
  ON CONFLICT (user_id, reward_type) 
  DO UPDATE SET 
    reward_value = user_rewards.reward_value + 50,
    created_at = NOW();
  
  -- Get updated inviter rewards count
  SELECT COALESCE(reward_value, 0) INTO inviter_rewards
  FROM public.user_rewards 
  WHERE user_id = invite_record.inviter_id 
  AND reward_type = 'invite_bonus';
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Invite redeemed successfully!',
    'inviter_rewards', inviter_rewards
  );
END;
$$;

-- Function to get user's invite stats
CREATE OR REPLACE FUNCTION get_user_invite_stats(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_invites INTEGER;
  successful_invites INTEGER;
  total_rewards INTEGER;
  result JSON;
BEGIN
  -- Count total invites created
  SELECT COUNT(*) INTO total_invites
  FROM public.invites
  WHERE inviter_id = user_id_param;
  
  -- Count successful invites (redemptions)
  SELECT COUNT(*) INTO successful_invites
  FROM public.invite_redemptions ir
  JOIN public.invites i ON ir.invite_id = i.id
  WHERE i.inviter_id = user_id_param;
  
  -- Get total rewards
  SELECT COALESCE(SUM(reward_value), 0) INTO total_rewards
  FROM public.user_rewards
  WHERE user_id = user_id_param;
  
  RETURN json_build_object(
    'total_invites', total_invites,
    'successful_invites', successful_invites,
    'total_rewards', total_rewards
  );
END;
$$;

-- Create index for better performance
CREATE INDEX idx_invites_code ON public.invites(invite_code);
CREATE INDEX idx_invites_inviter ON public.invites(inviter_id);
CREATE INDEX idx_invite_redemptions_inviter ON public.invite_redemptions(inviter_id);
CREATE INDEX idx_invite_redemptions_redeemer ON public.invite_redemptions(redeemer_id);
