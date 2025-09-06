import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Users, Gift, Star, Crown, Zap } from 'lucide-react';

interface InviteStats {
  total_invites: number;
  successful_invites: number;
  total_rewards: number;
}

const InviteStats = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInviteStats();
    }
  }, [user]);

  const fetchInviteStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_invite_stats', { user_id_param: user?.id });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching invite stats:', error);
      toast({
        title: "Error",
        description: "Failed to load invite statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRewardTier = (rewards: number) => {
    if (rewards >= 1000) return { tier: 'Champion', icon: Crown, color: 'text-yellow-600' };
    if (rewards >= 500) return { tier: 'Pro', icon: Star, color: 'text-purple-600' };
    if (rewards >= 200) return { tier: 'Rising', icon: Zap, color: 'text-blue-600' };
    return { tier: 'Starter', icon: Gift, color: 'text-green-600' };
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const rewardTier = getRewardTier(stats.total_rewards);
  const TierIcon = rewardTier.icon;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          Your Invite Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reward Tier */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TierIcon className={`h-6 w-6 ${rewardTier.color}`} />
            <span className={`font-semibold ${rewardTier.color}`}>
              {rewardTier.tier}
            </span>
          </div>
          <Badge variant="secondary" className="text-sm">
            {stats.total_rewards} points
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.total_invites}</div>
            <div className="text-xs text-muted-foreground">Invites Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.successful_invites}</div>
            <div className="text-xs text-muted-foreground">Friends Joined</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_rewards}</div>
            <div className="text-xs text-muted-foreground">Total Points</div>
          </div>
        </div>

        {/* Rewards Info */}
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Rewards Earned</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>• 100 points per friend who joins</div>
            <div>• 50 points for joining via invite</div>
            <div>• Higher tiers get priority matching</div>
          </div>
        </div>

        {/* Next Tier Progress */}
        {stats.total_rewards < 1000 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Next Tier: {rewardTier.tier === 'Starter' ? 'Rising' : rewardTier.tier === 'Rising' ? 'Pro' : 'Champion'}</span>
              <span>{stats.total_rewards}/{rewardTier.tier === 'Starter' ? 200 : rewardTier.tier === 'Rising' ? 500 : 1000}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, (stats.total_rewards / (rewardTier.tier === 'Starter' ? 200 : rewardTier.tier === 'Rising' ? 500 : 1000)) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchInviteStats}
          className="w-full"
        >
          Refresh Stats
        </Button>
      </CardContent>
    </Card>
  );
};

export default InviteStats;
