import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Mail, MessageCircle, Users, Gift } from 'lucide-react';

interface InviteModalProps {
  children: React.ReactNode;
}

const InviteModal = ({ children }: InviteModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const inviteLink = `${window.location.origin}/?ref=${Math.random().toString(36).substr(2, 9)}`;
  const inviteMessage = `Join me on GameBuddy! Find your perfect sports partner for tennis, pickleball, basketball, and more. ${inviteLink}`;

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

        <div className="space-y-6">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;
