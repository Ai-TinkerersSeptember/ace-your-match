-- Create a function to reset all matches (for development/testing purposes)
CREATE OR REPLACE FUNCTION public.reset_all_matches()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  messages_count integer;
  conversations_count integer;
  matches_count integer;
  result json;
BEGIN
  -- Count records before deletion
  SELECT COUNT(*) INTO messages_count FROM public.messages;
  SELECT COUNT(*) INTO conversations_count FROM public.conversations;
  SELECT COUNT(*) INTO matches_count FROM public.matches;
  
  -- Delete in correct order (respecting foreign key constraints)
  DELETE FROM public.messages;
  DELETE FROM public.conversations;
  DELETE FROM public.matches;
  
  -- Return summary of what was deleted
  result := json_build_object(
    'success', true,
    'deleted_messages', messages_count,
    'deleted_conversations', conversations_count,
    'deleted_matches', matches_count,
    'message', 'All matches have been reset successfully'
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.reset_all_matches TO authenticated;
