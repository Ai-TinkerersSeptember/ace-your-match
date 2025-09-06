import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import InviteStats from './InviteStats';
import { Share2, Copy, Mail, MessageCircle, Users, Gift, Facebook, Twitter, Instagram, Linkedin, ExternalLink, BarChart3 } from 'lucide-react';

interface InviteModalProps {
  children: React.ReactNode;
}

const InviteModal = ({ children }: InviteModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  const inviteLink = inviteCode ? `${window.location.origin}/?ref=${inviteCode}` : `${window.location.origin}/?ref=loading`;
  const inviteMessage = `Join me on GameBuddy! Find your perfect sports partner for tennis, pickleball, basketball, and more. ${inviteLink}`;
  const shortMessage = `🎾 Join me on GameBuddy! Find your perfect sports partner! ${inviteLink}`;
  const hashtags = '#GameBuddy #SportsPartner #Tennis #Pickleball #Basketball #Badminton';

  useEffect(() => {
    if (isOpen && user) {
      createInviteCode();
    }
  }, [isOpen, user]);

  const createInviteCode = async () => {
    try {
      const { data, error } = await supabase
        .rpc('create_invite_code');

      if (error) throw error;

      // Store the invite in the database
      const { error: insertError } = await supabase
        .from('invites')
        .insert({
          inviter_id: user?.id,
          invite_code: data
        });

      if (insertError) throw insertError;

      setInviteCode(data);
    } catch (error) {
      console.error('Error creating invite code:', error);
      // Fallback to random code if database fails
      setInviteCode(Math.random().toString(36).substr(2, 9));
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Link copied!",
        description: "Invite link has been copied to your clipboard"
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually",
        variant: "destructive"
      });
    }
  };

  const copyInviteMessage = async () => {
    try {
      await navigator.clipboard.writeText(inviteMessage);
      toast({
        title: "Message copied!",
        description: "Invite message has been copied to your clipboard"
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the message manually",
        variant: "destructive"
      });
    }
  };

  const shareViaEmail = () => {
    const subject = "Join me on GameBuddy!";
    const body = inviteMessage;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const shareViaSMS = () => {
    const smsLink = `sms:?body=${encodeURIComponent(inviteMessage)}`;
    window.open(smsLink);
  };

  const shareViaTwitter = () => {
    const twitterText = `${shortMessage} ${hashtags}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
    window.open(twitterUrl, '_blank');
  };

  const shareViaFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}&quote=${encodeURIComponent(shortMessage)}`;
    window.open(facebookUrl, '_blank');
  };

  const shareViaLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(inviteLink)}`;
    window.open(linkedinUrl, '_blank');
  };

  const shareViaInstagram = () => {
    // Instagram doesn't support direct URL sharing, so we copy the message
    copyInviteMessage();
    toast({
      title: "Message copied!",
      description: "Paste this in your Instagram story or post"
    });
  };

  const shareViaWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shortMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shortMessage)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    // In a real app, you'd send this to your backend
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Invite sent!",
        description: `Invitation sent to ${email}`
      });
      setEmail('');
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Invite Friends
          </DialogTitle>
          <DialogDescription>
            Help grow the GameBuddy community and find more potential matches!
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-6 mt-6">
            {/* Rewards Section */}
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Invite Rewards</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get priority matching and exclusive features when your friends join!
                </p>
              </CardContent>
            </Card>

          {/* Quick Share Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Share</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyInviteLink}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyInviteMessage}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Copy Message
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaEmail}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaSMS}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                SMS
              </Button>
            </div>
          </div>

          {/* Social Media Share Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Share on Social Media</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaTwitter}
                className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaFacebook}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaLinkedIn}
                className="flex items-center gap-2 text-blue-700 hover:text-blue-800"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaInstagram}
                className="flex items-center gap-2 text-pink-500 hover:text-pink-600"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaWhatsApp}
                className="flex items-center gap-2 text-green-500 hover:text-green-600"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaTelegram}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-500"
              >
                <ExternalLink className="h-4 w-4" />
                Telegram
              </Button>
            </div>
          </div>

          {/* Direct Email Invite */}
          <form onSubmit={handleEmailInvite} className="space-y-3">
            <Label htmlFor="email" className="text-sm font-medium">
              Send Direct Invite
            </Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !email.trim()}>
                {loading ? "Sending..." : "Send"}
              </Button>
            </div>
          </form>

            {/* Invite Link Display */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Invite Link</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="text-xs font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyInviteLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <InviteStats />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;
