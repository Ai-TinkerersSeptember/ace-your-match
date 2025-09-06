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
      
      const { data, error } = await supabase
        .rpc('reset_all_matches');

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "✅ Matches Reset",
          description: `Deleted ${data.deleted_matches} matches, ${data.deleted_conversations} conversations, and ${data.deleted_messages} messages.`,
          duration: 5000
        });
        
        // Call the onReset callback to refresh the matches list
        if (onReset) {
          onReset();
        }
      }
    } catch (error) {
      console.error('Error resetting matches:', error);
      toast({
        title: "Error",
        description: "Failed to reset matches",
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
