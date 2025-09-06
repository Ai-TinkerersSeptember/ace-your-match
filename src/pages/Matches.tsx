import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, Clock, CheckCircle, MessageCircle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ResetMatches from '@/components/ResetMatches';

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  sport: string;
  is_mutual: boolean;
  created_at: string;
  other_user: {
    id: string;
    name: string;
    age: number;
    profile_photo_url?: string;
    location: string;
    bio?: string;
  };
  other_user_sports: {
    sport: string;
    skill_level: string;
  }[];
}

const Matches = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResetPanel, setShowResetPanel] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      
      // First, try the join approach
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!user1_id(id, name, age, profile_photo_url, location, bio),
          user2:profiles!user2_id(id, name, age, profile_photo_url, location, bio)
        `)
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (matchesError) {
        console.error('Matches error:', matchesError);
        throw matchesError;
      }

      console.log('Raw matches data:', matchesData);

      if (matchesData && matchesData.length > 0) {
        // Process matches to get the other user's information
        const processedMatches: Match[] = [];
        
        for (const match of matchesData) {
          console.log('Processing match:', match);
          
          const otherUser = match.user1_id === user?.id ? match.user2 : match.user1;
          const otherUserId = match.user1_id === user?.id ? match.user2_id : match.user1_id;
          
          console.log('Other user:', otherUser, 'Other user ID:', otherUserId);
          
          if (!otherUser) {
            console.warn('Skipping match with null other user:', match);
            continue;
          }
          
          // Fetch sports for the other user
          const { data: sportsData } = await supabase
            .from('user_sports')
            .select('sport, skill_level')
            .eq('user_id', otherUserId);

          processedMatches.push({
            id: match.id,
            user1_id: match.user1_id,
            user2_id: match.user2_id,
            sport: match.sport,
            is_mutual: match.is_mutual,
            created_at: match.created_at,
            other_user: otherUser,
            other_user_sports: sportsData || []
          });
        }
        
        console.log('Processed matches:', processedMatches);
        setMatches(processedMatches);
      } else {
        // Fallback: fetch matches and profiles separately
        console.log('No matches found with join, trying fallback approach');
        
        const { data: simpleMatches, error: simpleError } = await supabase
          .from('matches')
          .select('*')
          .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
          .order('created_at', { ascending: false });

        if (simpleError) throw simpleError;

        if (simpleMatches && simpleMatches.length > 0) {
          const processedMatches: Match[] = [];
          
          for (const match of simpleMatches) {
            const otherUserId = match.user1_id === user?.id ? match.user2_id : match.user1_id;
            
            // Fetch the other user's profile
            const { data: otherUserProfile } = await supabase
              .from('profiles')
              .select('id, name, age, profile_photo_url, location, bio')
              .eq('id', otherUserId)
              .single();

            if (otherUserProfile) {
              // Fetch sports for the other user
              const { data: sportsData } = await supabase
                .from('user_sports')
                .select('sport, skill_level')
                .eq('user_id', otherUserId);

              processedMatches.push({
                id: match.id,
                user1_id: match.user1_id,
                user2_id: match.user2_id,
                sport: match.sport,
                is_mutual: match.is_mutual,
                created_at: match.created_at,
                other_user: otherUserProfile,
                other_user_sports: sportsData || []
              });
            }
          }
          
          console.log('Fallback processed matches:', processedMatches);
          setMatches(processedMatches);
        } else {
          console.log('No matches found at all');
          setMatches([]);
        }
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error",
        description: "Failed to load matches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSportEmoji = (sport: string) => {
    switch (sport) {
      case 'tennis': return '🎾';
      case 'pickleball': return '🏓';
      case 'basketball': return '🏀';
      case 'badminton': return '🏸';
      case 'squash': return '🎾';
      case 'racquetball': return '🎾';
      default: return '⚽';
    }
  };

  const getSkillColor = (skill: string) => {
    switch (skill) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const mutualMatches = matches.filter(match => match.is_mutual);
  const pendingMatches = matches.filter(match => !match.is_mutual);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold">My Matches</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetPanel(!showResetPanel)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showResetPanel && (
          <div className="mb-8">
            <ResetMatches onReset={fetchMatches} />
          </div>
        )}
        
        <Tabs defaultValue="mutual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="mutual" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Mutual Matches ({mutualMatches.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingMatches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mutual">
            {mutualMatches.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mutualMatches.map((match) => (
                  <Card key={match.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        {match.other_user.profile_photo_url ? (
                          <img
                            src={match.other_user.profile_photo_url}
                            alt={match.other_user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
                            <span className="text-lg font-bold text-primary">
                              {match.other_user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{match.other_user.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{match.other_user.age} years old</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">📍 {match.other_user.location}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span>{getSportEmoji(match.sport)}</span>
                          <Badge variant="outline" className="capitalize">
                            {match.sport}
                          </Badge>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mutual Match
                          </Badge>
                        </div>

                        {match.other_user_sports.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Sports & Skills</h4>
                            <div className="flex flex-wrap gap-1">
                              {match.other_user_sports.map((sport, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <span className="mr-1">{getSportEmoji(sport.sport)}</span>
                                  {sport.sport}
                                  <span className={`ml-1 px-1 py-0.5 rounded text-xs ${getSkillColor(sport.skill_level)}`}>
                                    {sport.skill_level}
                                  </span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {match.other_user.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {match.other_user.bio}
                          </p>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              // TODO: Navigate to conversation or open message modal
                              toast({
                                title: "Coming Soon!",
                                description: "Messaging feature will be available soon.",
                              });
                            }}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center p-8">
                <CardHeader>
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <CardTitle>No Mutual Matches Yet</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Keep swiping to find your perfect match! When someone likes you back, they'll appear here.
                  </p>
                  <Button onClick={() => navigate('/dashboard')}>
                    Start Swiping
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pending">
            {pendingMatches.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingMatches.map((match) => (
                  <Card key={match.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        {match.other_user.profile_photo_url ? (
                          <img
                            src={match.other_user.profile_photo_url}
                            alt={match.other_user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
                            <span className="text-lg font-bold text-primary">
                              {match.other_user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{match.other_user.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{match.other_user.age} years old</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">📍 {match.other_user.location}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span>{getSportEmoji(match.sport)}</span>
                          <Badge variant="outline" className="capitalize">
                            {match.sport}
                          </Badge>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Waiting for response
                          </Badge>
                        </div>

                        {match.other_user_sports.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Sports & Skills</h4>
                            <div className="flex flex-wrap gap-1">
                              {match.other_user_sports.map((sport, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <span className="mr-1">{getSportEmoji(sport.sport)}</span>
                                  {sport.sport}
                                  <span className={`ml-1 px-1 py-0.5 rounded text-xs ${getSkillColor(sport.skill_level)}`}>
                                    {sport.skill_level}
                                  </span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {match.other_user.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {match.other_user.bio}
                          </p>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Liked on {new Date(match.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center p-8">
                <CardHeader>
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <CardTitle>No Pending Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    You haven't liked anyone yet. Start swiping to see your pending matches here!
                  </p>
                  <Button onClick={() => navigate('/dashboard')}>
                    Start Swiping
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Matches;
