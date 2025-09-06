-- Reset all matches and related data
-- This will clear all matches, conversations, and messages

-- First, delete all messages (they depend on conversations)
DELETE FROM public.messages;

-- Then delete all conversations (they depend on matches)
DELETE FROM public.conversations;

-- Finally, delete all matches
DELETE FROM public.matches;

-- Reset any sequences if needed (though UUIDs don't use sequences)
-- This is just to ensure a clean state

-- Optional: Add a comment about what was reset
DO $$
BEGIN
    RAISE NOTICE 'All matches, conversations, and messages have been reset';
END $$;
