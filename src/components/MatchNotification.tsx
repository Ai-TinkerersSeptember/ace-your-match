import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Heart } from 'lucide-react';

interface MatchNotificationProps {
  onClose: () => void;
  matchInfo: {
    id: string;
    name: string;
    profile_photo_url?: string;
    sport: string;
  };
}

const MatchNotification: React.FC<MatchNotificationProps> = ({ onClose, matchInfo }) => {
  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <Card className="w-80 bg-gradient-to-r from-pink-50 to-red-50 border-pink-200 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {matchInfo.profile_photo_url ? (
                <img
                  src={matchInfo.profile_photo_url}
                  alt={matchInfo.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {matchInfo.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="font-semibold text-pink-800">It's a Match!</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                You and <span className="font-medium">{matchInfo.name}</span> liked each other!
              </p>
              <p className="text-xs text-gray-600 mb-3">
                You can now message each other about {matchInfo.sport}.
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-pink-500 hover:bg-pink-600">
                  View Match
                </Button>
                <Button size="sm" variant="outline" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchNotification;
