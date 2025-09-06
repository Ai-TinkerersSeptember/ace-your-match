import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, MessageCircle, MapPin, Zap } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">GameBuddy</h1>
          </div>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Find Your Perfect Sports Partner
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Connect with local players for tennis, pickleball, basketball, badminton, and more. 
            Match based on skill level, location, and availability.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Matching
              <Zap className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Smart Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Get matched with players of similar skill levels and availability in your area
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageCircle className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Easy Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Chat with matches and coordinate games with built-in messaging
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <MapPin className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Local & Safe</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Find players nearby and meet at public courts and facilities
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sports Section */}
      <section className="bg-white/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Supported Sports</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {[
              { name: 'Tennis', emoji: '🎾' },
              { name: 'Pickleball', emoji: '🏓' },
              { name: 'Basketball', emoji: '🏀' },
              { name: 'Badminton', emoji: '🏸' },
              { name: 'Squash', emoji: '🎾' },
              { name: 'Racquetball', emoji: '🎾' }
            ].map((sport) => (
              <Card key={sport.name} className="text-center p-4 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-2">{sport.emoji}</div>
                <p className="font-medium">{sport.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to Play?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of players finding their perfect sports partners
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-6">
              Join GameBuddy
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">GameBuddy</span>
          </div>
          <p className="text-muted-foreground">
            Connecting sports enthusiasts, one match at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
