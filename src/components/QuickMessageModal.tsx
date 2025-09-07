import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUser: {
    id: string;
    name: string;
    profile_photo_url?: string;
  };
  conversationId?: string;
}

const QuickMessageModal: React.FC<QuickMessageModalProps> = ({
  isOpen,
  onClose,
  otherUser,
  conversationId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      let actualConversationId = conversationId;
      
      // If no conversation ID provided, find or create conversation
      if (!actualConversationId) {
        const { data: existingConversation } = await supabase
          .from('conversations')
          .select('id')
          .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
          .or(`user1_id.eq.${otherUser.id},user2_id.eq.${otherUser.id}`)
          .single();

        if (existingConversation) {
          actualConversationId = existingConversation.id;
        }
      }

      if (!actualConversationId) {
        toast({
          title: "Error",
          description: "No conversation found. Please try again from the messages page.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: actualConversationId,
          sender_id: user?.id,
          content: message.trim()
        });

      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', actualConversationId);

      toast({
        title: "Message sent!",
        description: `Your message to ${otherUser.name} has been sent.`,
      });

      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleViewConversation = () => {
    onClose();
    navigate('/messages');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.profile_photo_url} />
              <AvatarFallback>
                {otherUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            Message {otherUser.name}
          </DialogTitle>
          <DialogDescription>
            Send a quick message to start your conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Write a message to ${otherUser.name}...`}
            className="min-h-[100px]"
            disabled={sending}
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleViewConversation}
            className="w-full sm:w-auto"
          >
            View Full Chat
          </Button>
          <Button
            onClick={sendMessage}
            disabled={!message.trim() || sending}
            className="w-full sm:w-auto"
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickMessageModal;
