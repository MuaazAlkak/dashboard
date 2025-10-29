import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Percent, TrendingUp } from 'lucide-react';
import { Event } from '@/lib/supabase';

interface EventsTimelineProps {
  events: Event[];
}

export function EventsTimeline({ events }: EventsTimelineProps) {
  const sortedEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 5); // Show next 5 events
  }, [events]);

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);

    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    if (event.is_active) return 'active';
    return 'inactive';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-green-500 bg-green-50';
      case 'upcoming':
        return 'border-blue-500 bg-blue-50';
      case 'ended':
        return 'border-gray-300 bg-gray-50';
      default:
        return 'border-orange-500 bg-orange-50';
    }
  };

  const getDaysUntil = (date: string) => {
    const now = new Date();
    const target = new Date(date);
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Events Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedEvents.map((event, index) => {
            const status = getEventStatus(event);
            const daysUntil = getDaysUntil(event.start_date);
            const daysLeft = getDaysUntil(event.end_date);
            
            return (
              <div
                key={event.id}
                className="relative pl-8 pb-4 border-l-2 border-muted last:border-l-0"
              >
                {/* Timeline dot */}
                <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 ${getStatusColor(status)}`} />
                
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{event.title.en}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.description?.en || 'No description'}
                      </p>
                    </div>
                    {event.discount_percentage && event.discount_percentage > 0 && (
                      <Badge variant="destructive" className="text-xs shrink-0">
                        <Percent className="h-3 w-3 mr-1" />
                        {event.discount_percentage}%
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(event.start_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                      {' → '}
                      {new Date(event.end_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>

                    {status === 'upcoming' && daysUntil > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Starts in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                      </Badge>
                    )}

                    {status === 'active' && daysLeft > 0 && (
                      <Badge variant="default" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                      </Badge>
                    )}

                    {status === 'ended' && (
                      <Badge variant="secondary" className="text-xs">
                        Ended
                      </Badge>
                    )}
                  </div>

                  {/* Color preview */}
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-12 h-3 rounded border border-border"
                      style={{ backgroundColor: event.background_color }}
                    />
                    <div 
                      className="w-12 h-3 rounded border border-border"
                      style={{ backgroundColor: event.text_color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {sortedEvents.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No events scheduled
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

