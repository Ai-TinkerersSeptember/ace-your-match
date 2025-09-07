import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trophy, MapPin, User, Heart, Calendar, Clock, Map, ArrowLeft } from 'lucide-react';

interface ProfileData {
  name: string;
  age: number | null;
  gender: string;
  location: string;
  bio: string;
  latitude: number | null;
  longitude: number | null;
}

interface UserSport {
  sport: string;
  skill_level: string;
}

interface UserPreferences {
  preferred_days: number[];
  preferred_time_slots: string[];
  frequency: string;
  venue_types: string[];
  max_travel_distance: number;
  age_range_min: number | null;
  age_range_max: number | null;
  gender_preference: string[];
  location_enabled: boolean;
}

const ProfileSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [locationLoading, setLocationLoading] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    age: null,
    gender: '',
    location: '',
    bio: '',
    latitude: null,
    longitude: null,
  });

  // Sports data
  const [sports, setSports] = useState<UserSport[]>([]);
  const [availableSports] = useState([
    'tennis', 'pickleball', 'basketball', 'badminton', 'squash', 'racquetball'
  ]);
  const [skillLevels] = useState([
    'beginner', 'intermediate', 'advanced', 'expert'
  ]);

  // Preferences data
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferred_days: [],
    preferred_time_slots: [],
    frequency: 'flexible',
    venue_types: [],
    max_travel_distance: 10,
    age_range_min: null,
    age_range_max: null,
    gender_preference: [],
    location_enabled: true,
  });

  const [days] = useState([
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ]);

  const [timeSlots] = useState([
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' },
  ]);

  const [venueTypes] = useState([
    { value: 'public_free', label: 'Public Free' },
    { value: 'private_club', label: 'Private Club' },
    { value: 'paid_facility', label: 'Paid Facility' },
    { value: 'home_court', label: 'Home Court' },
  ]);

  const [genders] = useState([
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non_binary', label: 'Non-binary' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ]);

  const [frequencies] = useState([
    { value: '1_2_per_week', label: '1-2 times per week' },
    { value: '3_4_per_week', label: '3-4 times per week' },
    { value: 'daily', label: 'Daily' },
    { value: 'flexible', label: 'Flexible' },
  ]);

  useEffect(() => {
    if (user) {
      // Load existing profile data if available
      loadExistingData();
    }
  }, [user]);

  const loadExistingData = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profile) {
        setProfileData({
          name: profile.name || '',
          age: profile.age,
          gender: profile.gender || '',
          location: profile.location || '',
          bio: profile.bio || '',
          latitude: profile.latitude,
          longitude: profile.longitude,
        });
      }

      const { data: userSports } = await supabase
        .from('user_sports')
        .select('sport, skill_level')
        .eq('user_id', user?.id);

      if (userSports) {
        setSports(userSports);
      }

      const { data: userPrefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (userPrefs) {
        setPreferences({
          preferred_days: userPrefs.preferred_days || [],
          preferred_time_slots: userPrefs.preferred_time_slots || [],
          frequency: userPrefs.frequency || 'flexible',
          venue_types: userPrefs.venue_types || [],
          max_travel_distance: userPrefs.max_travel_distance || 10,
          age_range_min: userPrefs.age_range_min,
          age_range_max: userPrefs.age_range_max,
          gender_preference: userPrefs.gender_preference || [],
        });
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setProfileData(prev => ({
            ...prev,
            latitude,
            longitude,
          }));

          // Reverse geocoding to get location name
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            setProfileData(prev => ({
              ...prev,
              location: data.locality || data.city || data.principalSubdivision || 'Unknown',
            }));
          } catch (error) {
            console.error('Error getting location name:', error);
          }
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Error",
            description: "Could not get your location. You can enter it manually.",
            variant: "destructive"
          });
          setLocationLoading(false);
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
      setLocationLoading(false);
    }
  };

  const addSport = () => {
    setSports([...sports, { sport: '', skill_level: '' }]);
  };

  const removeSport = (index: number) => {
    setSports(sports.filter((_, i) => i !== index));
  };

  const updateSport = (index: number, field: keyof UserSport, value: string) => {
    const updatedSports = [...sports];
    updatedSports[index][field] = value;
    setSports(updatedSports);
  };

  const toggleArrayValue = (array: any[], value: any, setter: (value: any[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Validate required fields
      if (!profileData.name.trim()) {
        toast({
          title: "Name Required",
          description: "Please enter your name",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (sports.length === 0) {
        toast({
          title: "Sports Required",
          description: "Please add at least one sport",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: profileData.name,
          age: profileData.age,
          gender: (profileData.gender as any) || null,
          location: profileData.location,
          bio: profileData.bio,
          latitude: profileData.latitude,
          longitude: profileData.longitude,
        });

      if (profileError) throw profileError;

      // Update sports
      const { error: sportsDeleteError } = await supabase
        .from('user_sports')
        .delete()
        .eq('user_id', user.id);

      if (sportsDeleteError) throw sportsDeleteError;

      if (sports.length > 0) {
        const sportsToInsert = sports
          .filter(sport => sport.sport && sport.skill_level)
          .map(sport => ({
            user_id: user.id,
            sport: sport.sport as any,
            skill_level: sport.skill_level as any,
          }));

        if (sportsToInsert.length > 0) {
          const { error: sportsError } = await supabase
            .from('user_sports')
            .insert(sportsToInsert);

          if (sportsError) throw sportsError;
        }
      }

      // Update preferences
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferred_days: preferences.preferred_days,
          preferred_time_slots: preferences.preferred_time_slots as any,
          frequency: preferences.frequency as any,
          venue_types: preferences.venue_types as any,
          max_travel_distance: preferences.max_travel_distance,
          age_range_min: preferences.age_range_min,
          age_range_max: preferences.age_range_max,
          gender_preference: preferences.gender_preference as any,
        });

      if (prefsError) throw prefsError;

      toast({
        title: "Profile Updated!",
        description: "Your profile has been saved successfully"
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Basic Information
        </CardTitle>
        <CardDescription>
          Tell us about yourself so others can get to know you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={profileData.name}
            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={profileData.age || ''}
              onChange={(e) => setProfileData(prev => ({ 
                ...prev, 
                age: e.target.value ? parseInt(e.target.value) : null 
              }))}
              placeholder="Your age"
              min="18"
              max="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={profileData.gender}
              onValueChange={(value) => setProfileData(prev => ({ ...prev, gender: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {genders.map((gender) => (
                  <SelectItem key={gender.value} value={gender.value}>
                    {gender.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <div className="flex gap-2">
            <Input
              id="location"
              value={profileData.location}
              onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Enter your city or location"
            />
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={profileData.bio}
            onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell others about yourself, your sports interests, and what you're looking for..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Sports & Skills
        </CardTitle>
        <CardDescription>
          Add the sports you play and your skill level
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sports.map((sport, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label>Sport</Label>
              <Select
                value={sport.sport}
                onValueChange={(value) => updateSport(index, 'sport', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {availableSports.map((sportName) => (
                    <SelectItem key={sportName} value={sportName}>
                      {sportName.charAt(0).toUpperCase() + sportName.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <Label>Skill Level</Label>
              <Select
                value={sport.skill_level}
                onValueChange={(value) => updateSport(index, 'skill_level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {skillLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeSport(index)}
            >
              ×
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addSport}>
          + Add Sport
        </Button>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Preferences
        </CardTitle>
        <CardDescription>
          Set your preferences for finding matches
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Preferred Days</Label>
          <div className="flex flex-wrap gap-2">
            {days.map((day) => (
              <Badge
                key={day.value}
                variant={preferences.preferred_days.includes(day.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayValue(preferences.preferred_days, day.value, (value) => 
                  setPreferences(prev => ({ ...prev, preferred_days: value }))
                )}
              >
                {day.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Preferred Time Slots</Label>
          <div className="flex flex-wrap gap-2">
            {timeSlots.map((slot) => (
              <Badge
                key={slot.value}
                variant={preferences.preferred_time_slots.includes(slot.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayValue(preferences.preferred_time_slots, slot.value, (value) => 
                  setPreferences(prev => ({ ...prev, preferred_time_slots: value }))
                )}
              >
                {slot.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Playing Frequency</Label>
          <Select
            value={preferences.frequency}
            onValueChange={(value) => setPreferences(prev => ({ ...prev, frequency: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {frequencies.map((freq) => (
                <SelectItem key={freq.value} value={freq.value}>
                  {freq.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Preferred Venue Types</Label>
          <div className="flex flex-wrap gap-2">
            {venueTypes.map((venue) => (
              <Badge
                key={venue.value}
                variant={preferences.venue_types.includes(venue.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayValue(preferences.venue_types, venue.value, (value) => 
                  setPreferences(prev => ({ ...prev, venue_types: value }))
                )}
              >
                {venue.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="location_enabled"
              checked={preferences.location_enabled}
              onCheckedChange={(checked) => setPreferences(prev => ({ 
                ...prev, 
                location_enabled: checked 
              }))}
            />
            <Label htmlFor="location_enabled" className="text-sm font-medium">
              Enable location-based matching
            </Label>
          </div>
          
          {preferences.location_enabled && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="max_distance">Max Travel Distance (miles)</Label>
              <Input
                id="max_distance"
                type="number"
                value={preferences.max_travel_distance}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  max_travel_distance: parseInt(e.target.value) || 10 
                }))}
                min="1"
                max="100"
              />
            </div>
          )}
          
          {!preferences.location_enabled && (
            <p className="text-sm text-muted-foreground ml-6">
              Location-based matching is disabled. You'll see matches from anywhere and won't be filtered by distance.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age_min">Min Age Preference</Label>
            <Input
              id="age_min"
              type="number"
              value={preferences.age_range_min || ''}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                age_range_min: e.target.value ? parseInt(e.target.value) : null 
              }))}
              placeholder="18"
              min="18"
              max="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age_max">Max Age Preference</Label>
            <Input
              id="age_max"
              type="number"
              value={preferences.age_range_max || ''}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                age_range_max: e.target.value ? parseInt(e.target.value) : null 
              }))}
              placeholder="100"
              min="18"
              max="100"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Gender Preference</Label>
          <div className="flex flex-wrap gap-2">
            {genders.map((gender) => (
              <Badge
                key={gender.value}
                variant={preferences.gender_preference.includes(gender.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayValue(preferences.gender_preference, gender.value, (value) => 
                  setPreferences(prev => ({ ...prev, gender_preference: value }))
                )}
              >
                {gender.label}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Matching
            </Button>
            <div>
              <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
              <p className="text-muted-foreground">
                Step {currentStep} of 3: {currentStep === 1 ? 'Basic Information' : currentStep === 2 ? 'Sports & Skills' : 'Preferences'}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          {currentStep < 3 ? (
            <Button onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
