import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Event, eventService } from '@/lib/supabase';
import { toast } from 'sonner';

interface DeleteEventDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteEventDialog({
  event,
  open,
  onOpenChange,
  onSuccess,
}: DeleteEventDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!event) return;

    setIsLoading(true);
    try {
      await eventService.deleteEvent(event.id);
      toast.success('Event deleted successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to delete event: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!event) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Are you sure you want to delete this event? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 rounded-lg border border-border bg-muted p-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded border border-border"
                style={{ backgroundColor: event.background_color }}
              />
              <span className="text-muted-foreground">Background: {event.background_color}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded border border-border"
                style={{ backgroundColor: event.text_color }}
              />
              <span className="text-muted-foreground">Text: {event.text_color}</span>
            </div>
            <p className="text-muted-foreground">
              Duration: {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Event'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

