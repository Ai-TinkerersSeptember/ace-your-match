import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';

interface ResetMatchesProps {
  onReset?: () => void;
}

const ResetMatches = ({ onReset }: ResetMatchesProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleResetMatches = async () => {
    try {
      setLoading(true);
      
      // Count records before deletion for feedback
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });
      
      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });
      
      const { count: matchesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true });

      // Delete in correct order (respecting foreign key constraints)
      
      // First delete messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (messagesError) throw messagesError;

      // Then delete conversations
      const { error: conversationsError } = await supabase
        .from('conversations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (conversationsError) throw conversationsError;

      // Finally delete matches
      const { error: matchesError } = await supabase
        .from('matches')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (matchesError) throw matchesError;

      toast({
        title: "✅ Matches Reset",
        description: `Deleted ${matchesCount || 0} matches, ${conversationsCount || 0} conversations, and ${messagesCount || 0} messages.`,
        duration: 5000
      });
      
      // Call the onReset callback to refresh the matches list
      if (onReset) {
        onReset();
      }
    } catch (error) {
      console.error('Error resetting matches:', error);
      toast({
        title: "Error",
        description: `Failed to reset matches: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <Trash2 className="h-5 w-5" />
          Reset All Matches
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will permanently delete all matches, conversations, and messages. 
          This action cannot be undone.
        </p>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Reset All Matches
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently delete:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All matches (mutual and pending)</li>
                  <li>All conversations</li>
                  <li>All messages</li>
                </ul>
                <br />
                This action cannot be undone. This is typically used for development/testing purposes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetMatches}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? "Resetting..." : "Yes, Reset Everything"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default ResetMatches;
