import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock } from 'lucide-react';

interface MatchCardProps {
  profile: {
    id: string;
    name: string;
    age: number;
    profile_photo_url?: string;
    location: string;
    bio?: string;
  };
  sports: {
    sport: string;
    skill_level: string;
  }[];
  distance?: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ profile, sports, distance, onSwipeLeft, onSwipeRight }) => {
  const getSkillColor = (skill: string) => {
    switch (skill) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <Card className="w-full max-w-sm mx-auto relative overflow-hidden bg-gradient-to-b from-white to-gray-50 border-0 shadow-lg">
      <div className="relative h-64 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        {profile.profile_photo_url ? (
          <img
            src={profile.profile_photo_url}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-primary/30 flex items-center justify-center">
            <span className="text-4xl font-bold text-primary">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {distance && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-gray-600" />
            <span className="text-sm font-medium">{distance} mi</span>
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold">{profile.name}</h3>
          <span className="text-lg text-muted-foreground">{profile.age}</span>
        </div>
        
        <div className="flex items-center gap-1 mb-3 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{profile.location}</span>
        </div>

        {profile.bio && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {profile.bio}
          </p>
        )}

        <div className="space-y-2 mb-6">
          <h4 className="text-sm font-semibold">Sports & Skills</h4>
          <div className="flex flex-wrap gap-2">
            {sports.map((sport, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                <span>{getSportEmoji(sport.sport)}</span>
                <span className="capitalize">{sport.sport}</span>
                <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${getSkillColor(sport.skill_level)}`}>
                  {sport.skill_level}
                </span>
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onSwipeLeft}
            className="flex-1 py-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors flex items-center justify-center"
          >
            <span className="text-2xl">👎</span>
          </button>
          <button
            onClick={onSwipeRight}
            className="flex-1 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors flex items-center justify-center"
          >
            <span className="text-2xl">👍</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;