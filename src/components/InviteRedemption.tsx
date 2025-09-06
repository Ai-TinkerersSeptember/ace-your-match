import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, CheckCircle, XCircle } from 'lucide-react';

const InviteRedemption = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; inviter_rewards?: number } | null>(null);

  useEffect(() => {
    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode && user && !result) {
      processInviteRedemption(refCode);
    }
  }, [user, result]);

  const processInviteRedemption = async (inviteCode: string) => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase
        .rpc('redeem_invite', { invite_code_param: inviteCode });

      if (error) throw error;

      setResult(data);
      
      if (data.success) {
        toast({
          title: "Welcome bonus!",
          description: "You've earned 50 points for joining via invite!",
        });
      } else {
        toast({
          title: "Invalid invite",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error redeeming invite:', error);
      toast({
        title: "Error",
        description: "Failed to process invite code",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't show anything if no referral code or already processed
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (!refCode || result || !user) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-primary" />
            Invite Bonus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">Processing invite...</span>
            </div>
          ) : result ? (
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">{result.message}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                You were invited to join GameBuddy! Claim your welcome bonus.
              </p>
              <Button 
                size="sm" 
                onClick={() => processInviteRedemption(refCode)}
                className="w-full"
              >
                Claim Bonus
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteRedemption;
