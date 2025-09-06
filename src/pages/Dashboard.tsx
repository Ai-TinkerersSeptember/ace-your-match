import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import MatchCard from '@/components/MatchCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, MessageCircle, Settings, Trophy } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  age: number;
  profile_photo_url?: string;
  location: string;
  bio?: string;
}

interface UserSport {
  sport: string;
  skill_level: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userSports, setUserSports] = useState<{[key: string]: UserSport[]}>({});

  useEffect(() => {
    if (user) {
      fetchPotentialMatches();
    }
  }, [user]);

  const fetchPotentialMatches = async () => {
    try {
      // Get current user's location for distance-based matching
      let userLatitude: number | null = null;
      let userLongitude: number | null = null;
      
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', user?.id)
        .single();
      
      if (currentUserProfile?.latitude && currentUserProfile?.longitude) {
        userLatitude = parseFloat(currentUserProfile.latitude.toString());
        userLongitude = parseFloat(currentUserProfile.longitude.toString());
      }

      // Use secure function to get potential matches
      const { data: profilesData, error: profilesError } = await supabase
        .rpc('get_potential_matches', {
          user_latitude: userLatitude,
          user_longitude: userLongitude,
          max_distance_km: 50,
          limit_count: 10
        });

      if (profilesError) throw profilesError;

      if (profilesData) {
        setProfiles(profilesData);

        // Fetch sports for each profile
        const sportsData: {[key: string]: UserSport[]} = {};
        for (const profile of profilesData) {
          const { data: sports } = await supabase
            .from('user_sports')
            .select('sport, skill_level')
            .eq('user_id', profile.id);
          
          if (sports) {
            sportsData[profile.id] = sports;
          }
        }
        setUserSports(sportsData);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error",
        description: "Failed to load potential matches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeLeft = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast({
        title: "No more matches",
        description: "You've seen all potential matches for now!"
      });
    }
  };

  const handleSwipeRight = async () => {
    const currentProfile = profiles[currentIndex];
    const profileSports = userSports[currentProfile.id] || [];
    
    try {
      // Create a match record
      const { error } = await supabase
        .from('matches')
        .insert({
          user1_id: user?.id,
          user2_id: currentProfile.id,
          sport: (profileSports[0]?.sport as 'tennis' | 'pickleball' | 'basketball' | 'badminton' | 'squash' | 'racquetball') || 'tennis',
          is_mutual: false
        });

      if (error) throw error;

      toast({
        title: "Match created!",
        description: `You liked ${currentProfile.name}. If they like you back, you'll be matched!`
      });

      handleSwipeLeft();
    } catch (error) {
      console.error('Error creating match:', error);
      toast({
        title: "Error",
        description: "Failed to create match",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">GameBuddy</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {currentProfile ? (
          <div className="flex justify-center">
            <MatchCard
              profile={currentProfile}
              sports={userSports[currentProfile.id] || []}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Card className="text-center p-8 max-w-md">
              <CardHeader>
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <CardTitle>No More Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  You've seen all available matches. Check back later for more potential sports partners!
                </p>
                <Button onClick={fetchPotentialMatches}>
                  Refresh Matches
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;