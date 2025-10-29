import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Event } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Percent, Edit } from 'lucide-react';

interface DayEventsDialogProps {
  date: Date | null;
  events: Event[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventSelect: (event: Event) => void;
}

export function DayEventsDialog({
  date,
  events,
  open,
  onOpenChange,
  onEventSelect,
}: DayEventsDialogProps) {
  if (!date) return null;

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Events on {formattedDate}
          </DialogTitle>
          <DialogDescription>
            {events.length} {events.length === 1 ? 'event' : 'events'} scheduled for this day
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
          {events.map((event) => {
            const isActive = event.is_active && new Date() >= new Date(event.start_date) && new Date() <= new Date(event.end_date);
            
            return (
              <div
                key={event.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                style={{ borderLeftWidth: '4px', borderLeftColor: event.background_color }}
                onClick={() => {
                  onEventSelect(event);
                  onOpenChange(false);
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{event.title.en}</h3>
                      {isActive && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                      {event.discount_percentage && event.discount_percentage > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <Percent className="h-3 w-3 mr-1" />
                          {event.discount_percentage}% OFF
                        </Badge>
                      )}
                    </div>

                    {event.description?.en && (
                      <p className="text-sm text-muted-foreground">
                        {event.description.en}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {new Date(event.start_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                        {' → '}
                        {new Date(event.end_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>

                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: event.background_color }}
                          title="Background color"
                        />
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: event.text_color }}
                          title="Text color"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventSelect(event);
                      onOpenChange(false);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

