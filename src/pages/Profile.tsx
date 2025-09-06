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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trophy, MapPin, User, Heart, Calendar, Clock, Map, Edit, Save, X, Plus, Trash2, AlertCircle, ArrowLeft } from 'lucide-react';

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
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

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
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      // Load profile data
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

      // Load sports data
      const { data: userSports } = await supabase
        .from('user_sports')
        .select('sport, skill_level')
        .eq('user_id', user?.id);

      if (userSports) {
        setSports(userSports);
      }

      // Load preferences data
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

      // Check if profile is complete
      const isComplete = profile?.name && 
                        userSports && userSports.length > 0;
      setProfileComplete(!!isComplete);
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Validate required fields
      if (!profileData.name.trim()) {
        toast({
          title: "Name Required",
          description: "Please enter your name",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      if (sports.length === 0) {
        toast({
          title: "Sports Required",
          description: "Please add at least one sport",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      // Validate that all sports have both sport and skill_level
      const invalidSports = sports.filter(sport => !sport.sport || !sport.skill_level);
      if (invalidSports.length > 0) {
        toast({
          title: "Incomplete Sports",
          description: "Please ensure all sports have both sport type and skill level selected",
          variant: "destructive"
        });
        setSaving(false);
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

      // Update preferences - first try to update, if no rows affected, then insert
      const { data: existingPrefs } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingPrefs) {
        // Update existing preferences
        const { error: prefsError } = await supabase
          .from('user_preferences')
          .update({
            preferred_days: preferences.preferred_days.length > 0 ? preferences.preferred_days : [],
            preferred_time_slots: preferences.preferred_time_slots.length > 0 ? (preferences.preferred_time_slots as any) : [],
            frequency: preferences.frequency as any,
            venue_types: preferences.venue_types.length > 0 ? (preferences.venue_types as any) : [],
            max_travel_distance: preferences.max_travel_distance,
            age_range_min: preferences.age_range_min,
            age_range_max: preferences.age_range_max,
            gender_preference: preferences.gender_preference.length > 0 ? (preferences.gender_preference as any) : [],
          })
          .eq('user_id', user.id);

        if (prefsError) throw prefsError;
      } else {
        // Insert new preferences
        const { error: prefsError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            preferred_days: preferences.preferred_days.length > 0 ? preferences.preferred_days : [],
            preferred_time_slots: preferences.preferred_time_slots.length > 0 ? (preferences.preferred_time_slots as any) : [],
            frequency: preferences.frequency as any,
            venue_types: preferences.venue_types.length > 0 ? (preferences.venue_types as any) : [],
            max_travel_distance: preferences.max_travel_distance,
            age_range_min: preferences.age_range_min,
            age_range_max: preferences.age_range_max,
            gender_preference: preferences.gender_preference.length > 0 ? (preferences.gender_preference as any) : [],
          });

        if (prefsError) throw prefsError;
      }

      toast({
        title: "Profile Updated!",
        description: "Your profile has been saved successfully"
      });

      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadProfileData(); // Reload original data
  };

  const renderBasicInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          {isEditing ? (
            <Input
              id="name"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
              required
            />
          ) : (
            <p className="text-sm font-medium">{profileData.name || 'Not provided'}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            {isEditing ? (
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
            ) : (
              <p className="text-sm font-medium">{profileData.age || 'Not provided'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            {isEditing ? (
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
            ) : (
              <p className="text-sm font-medium">
                {genders.find(g => g.value === profileData.gender)?.label || 'Not provided'}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          {isEditing ? (
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
          ) : (
            <p className="text-sm font-medium">{profileData.location || 'Not provided'}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          {isEditing ? (
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell others about yourself, your sports interests, and what you're looking for..."
              rows={4}
            />
          ) : (
            <p className="text-sm">{profileData.bio || 'No bio provided'}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderSports = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Sports & Skills
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sports added yet</p>
        ) : (
          sports.map((sport, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Label>Sport</Label>
                {isEditing ? (
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
                ) : (
                  <p className="text-sm font-medium">
                    {sport.sport ? sport.sport.charAt(0).toUpperCase() + sport.sport.slice(1) : 'Not selected'}
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <Label>Skill Level</Label>
                {isEditing ? (
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
                ) : (
                  <p className="text-sm font-medium">
                    {sport.skill_level ? sport.skill_level.charAt(0).toUpperCase() + sport.skill_level.slice(1) : 'Not selected'}
                  </p>
                )}
              </div>

              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeSport(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}

        {isEditing && (
          <Button type="button" variant="outline" onClick={addSport}>
            <Plus className="h-4 w-4 mr-2" />
            Add Sport
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const renderPreferences = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Match Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Preferred Days</Label>
          {isEditing ? (
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
          ) : (
            <div className="flex flex-wrap gap-2">
              {preferences.preferred_days.length > 0 ? (
                preferences.preferred_days.map(dayValue => {
                  const day = days.find(d => d.value === dayValue);
                  return day ? <Badge key={dayValue} variant="secondary">{day.label}</Badge> : null;
                })
              ) : (
                <p className="text-sm text-muted-foreground">No preferred days set</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label>Preferred Time Slots</Label>
          {isEditing ? (
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
          ) : (
            <div className="flex flex-wrap gap-2">
              {preferences.preferred_time_slots.length > 0 ? (
                preferences.preferred_time_slots.map(slotValue => {
                  const slot = timeSlots.find(s => s.value === slotValue);
                  return slot ? <Badge key={slotValue} variant="secondary">{slot.label}</Badge> : null;
                })
              ) : (
                <p className="text-sm text-muted-foreground">No preferred time slots set</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Playing Frequency</Label>
          {isEditing ? (
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
          ) : (
            <p className="text-sm font-medium">
              {frequencies.find(f => f.value === preferences.frequency)?.label || 'Not set'}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Preferred Venue Types</Label>
          {isEditing ? (
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
          ) : (
            <div className="flex flex-wrap gap-2">
              {preferences.venue_types.length > 0 ? (
                preferences.venue_types.map(venueValue => {
                  const venue = venueTypes.find(v => v.value === venueValue);
                  return venue ? <Badge key={venueValue} variant="secondary">{venue.label}</Badge> : null;
                })
              ) : (
                <p className="text-sm text-muted-foreground">No preferred venue types set</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_distance">Max Travel Distance (miles)</Label>
          {isEditing ? (
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
          ) : (
            <p className="text-sm font-medium">{preferences.max_travel_distance} miles</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age_min">Min Age Preference</Label>
            {isEditing ? (
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
            ) : (
              <p className="text-sm font-medium">{preferences.age_range_min || 'No minimum'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="age_max">Max Age Preference</Label>
            {isEditing ? (
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
            ) : (
              <p className="text-sm font-medium">{preferences.age_range_max || 'No maximum'}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Gender Preference</Label>
          {isEditing ? (
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
          ) : (
            <div className="flex flex-wrap gap-2">
              {preferences.gender_preference.length > 0 ? (
                preferences.gender_preference.map(genderValue => {
                  const gender = genders.find(g => g.value === genderValue);
                  return gender ? <Badge key={genderValue} variant="secondary">{gender.label}</Badge> : null;
                })
              ) : (
                <p className="text-sm text-muted-foreground">No gender preference set</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
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
              <h1 className="text-3xl font-bold mb-2">My Profile</h1>
              <p className="text-muted-foreground">
                {isEditing ? 'Edit your profile information' : 'View and manage your profile'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {!profileComplete && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your profile is incomplete. Complete your profile to get better matches and improve your experience.
              <Button 
                variant="link" 
                className="p-0 h-auto ml-2"
                onClick={() => window.location.href = '/profile-setup'}
              >
                Complete Profile →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {renderBasicInfo()}
          {renderSports()}
          {renderPreferences()}
        </div>
      </div>
    </div>
  );
};

export default Profile;
