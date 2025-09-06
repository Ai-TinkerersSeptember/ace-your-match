-- Add RLS policies for conversations table
CREATE POLICY "Users can view their conversations" ON public.conversations 
FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations" ON public.conversations 
FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Add RLS policies for messages table
CREATE POLICY "Users can view messages in their conversations" ON public.messages 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id 
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations" ON public.messages 
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id 
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);
