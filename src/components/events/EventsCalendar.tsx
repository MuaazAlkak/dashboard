import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Event } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';

interface EventsCalendarProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  onDayClick?: (date: Date) => void;
  onAddEvent?: (date: Date) => void;
}

export function EventsCalendar({ events, onEventClick, onDayClick, onAddEvent }: EventsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { calendar, eventsInMonth } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Build calendar grid
    const calendar: (number | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push(null);
    }
    
    // Add days of month
    for (let day = 1; day <= totalDays; day++) {
      calendar.push(day);
    }

    // Get events in this month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    const eventsInMonth = events.filter(event => {
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);
      return (eventStart <= monthEnd && eventEnd >= monthStart);
    });

    return { calendar, eventsInMonth };
  }, [currentDate, events]);

  const getEventsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return eventsInMonth.filter(event => {
      const start = new Date(event.start_date);
      const end = new Date(event.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayEvents = getEventsForDay(day);
    
    setSelectedDay(day);
    
    if (dayEvents.length === 0) {
      // No events on this day - open add event dialog
      onAddEvent?.(clickedDate);
    } else if (dayEvents.length === 1) {
      // Single event - open edit dialog
      onEventClick?.(dayEvents[0]);
    } else {
      // Multiple events - call day click handler
      onDayClick?.(clickedDate);
    }
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Events Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {monthName}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendar.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayEvents = getEventsForDay(day);
            const hasEvents = dayEvents.length > 0;

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`
                  aspect-square p-1 border rounded-md transition-all cursor-pointer
                  hover:shadow-md hover:scale-105 active:scale-95
                  ${isToday(day) ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}
                  ${hasEvents ? 'bg-blue-50/50 hover:bg-blue-100/50' : 'bg-background hover:bg-muted'}
                  ${selectedDay === day ? 'ring-2 ring-primary/40 shadow-lg' : ''}
                `}
                title={hasEvents ? `${dayEvents.length} event(s) - Click to ${dayEvents.length === 1 ? 'edit' : 'view'}` : 'Click to add event'}
              >
                <div className="h-full flex flex-col pointer-events-none">
                  <span className={`text-xs font-medium ${isToday(day) ? 'text-primary font-bold' : 'text-foreground'}`}>
                    {day}
                  </span>
                  
                  {hasEvents ? (
                    <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="w-full h-1 rounded-full transition-all"
                          style={{ backgroundColor: event.background_color }}
                          title={event.title.en}
                        />
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[8px] text-muted-foreground font-medium">
                          +{dayEvents.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-muted-foreground">+</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-100" />
            <span>Has Events</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

