import { useState, useEffect } from 'react';
import { Plus, Loader2, Calendar, Edit, Trash2, MoreVertical, Copy, AlertCircle, LayoutGrid, List } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EventFormDialog } from '@/components/events/EventFormDialog';
import { DeleteEventDialog } from '@/components/events/DeleteEventDialog';
import { DayEventsDialog } from '@/components/events/DayEventsDialog';
import { EventsStats } from '@/components/events/EventsStats';
import { EventsCalendar } from '@/components/events/EventsCalendar';
import { EventsTimeline } from '@/components/events/EventsTimeline';
import { Event, eventService } from '@/lib/supabase';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);
  const [showDayEventsDialog, setShowDayEventsDialog] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<Date | null>(null);
  const permissions = usePermissions();
  const { t } = useLanguage();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await eventService.getEvents();
      setEvents(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load events: ${errorMessage}`);
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventSaved = () => {
    fetchEvents();
    setPrefilledDate(null);
  };

  const handleDayClick = (date: Date) => {
    // Show all events for the selected day
    const dayEvents = events.filter(event => {
      const start = new Date(event.start_date);
      const end = new Date(event.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      const checkDate = new Date(date);
      checkDate.setHours(12, 0, 0, 0);
      return checkDate >= start && checkDate <= end;
    });
    
    setSelectedDate(date);
    setSelectedDateEvents(dayEvents);
    setShowDayEventsDialog(true);
  };

  const handleAddEventForDate = (date: Date) => {
    // Pre-fill the event dialog with the selected date
    setPrefilledDate(date);
    setIsAddDialogOpen(true);
  };

  const handleToggleStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      await eventService.toggleEventStatus(eventId, !currentStatus);
      toast.success('Event status updated');
      fetchEvents();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update status: ${errorMessage}`);
    }
  };

  const handleDuplicate = async (event: Event) => {
    try {
      const today = new Date().toISOString();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const duplicatedEvent = {
        title: event.title,
        description: event.description,
        link: event.link,
        background_color: event.background_color,
        text_color: event.text_color,
        start_date: today,
        end_date: nextWeek,
        discount_percentage: event.discount_percentage,
        is_active: false, // Set to inactive by default
      };

      await eventService.createEvent(duplicatedEvent);
      toast.success('Event duplicated successfully');
      fetchEvents();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to duplicate event: ${errorMessage}`);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isEventActive = (event: Event) => {
    if (!event.is_active) return false;
    const now = new Date();
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    return now >= start && now <= end;
  };

  const isEventExpired = (event: Event) => {
    const now = new Date();
    const end = new Date(event.end_date);
    return now > end;
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t('events.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
            {t('events.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg p-1">
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
          {permissions.canCreateEvents && (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-gradient-primary shadow-glow hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('events.addEvent')}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <EventsStats events={events} />

      {/* Calendar View or List View */}
      {viewMode === 'calendar' ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EventsCalendar 
              events={events} 
              onEventClick={setEditingEvent}
              onDayClick={handleDayClick}
              onAddEvent={handleAddEventForDate}
            />
          </div>
          <div>
            <EventsTimeline events={events} />
          </div>
        </div>
      ) : (
        <>
          {/* Events Table */}
      <div className="rounded-lg border border-border bg-card shadow-elegant overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[60px]">{t('events.color')}</TableHead>
              <TableHead className="min-w-[150px]">{t('events.title')}</TableHead>
              <TableHead className="min-w-[120px]">{t('events.startDate')}</TableHead>
              <TableHead className="min-w-[120px]">{t('events.endDate')}</TableHead>
              <TableHead>{t('events.status')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('events.active')}</TableHead>
              {(permissions.canEditEvents || permissions.canDeleteEvents) && (
                <TableHead className="w-[80px]">{t('common.actions')}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow
                key={event.id}
                className={`group transition-all hover:bg-muted/50 ${isEventExpired(event) ? 'opacity-60' : ''}`}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-md border border-border"
                      style={{ backgroundColor: event.background_color }}
                      title={`BG: ${event.background_color}`}
                    />
                    <div
                      className="h-8 w-8 rounded-md border border-border"
                      style={{ backgroundColor: event.text_color }}
                      title={`Text: ${event.text_color}`}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{event.title.en}</p>
                    {event.description?.en && (
                      <p className="text-xs text-muted-foreground">
                        {event.description.en}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {event.discount_percentage && event.discount_percentage > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {event.discount_percentage}% OFF
                        </Badge>
                      )}
                      {isEventExpired(event) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="destructive" className="text-xs flex items-center gap-1 cursor-help">
                                <AlertCircle className="h-3 w-3" />
                                {t('events.expired')}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>This event has ended and cannot be used.</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Ended: {formatDate(event.end_date)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(event.start_date)}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(event.end_date)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={isEventActive(event) ? 'default' : 'outline'}
                  >
                    {isEventActive(event) ? t('events.active') : t('events.inactive')}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {permissions.canEditEvents ? (
                    <Switch
                      checked={event.is_active}
                      onCheckedChange={() => handleToggleStatus(event.id, event.is_active)}
                    />
                  ) : (
                    <Badge variant={event.is_active ? 'default' : 'secondary'}>
                      {event.is_active ? t('events.active') : t('events.inactive')}
                    </Badge>
                  )}
                </TableCell>
                {(permissions.canEditEvents || permissions.canDeleteEvents) && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {permissions.canEditEvents && (
                          <DropdownMenuItem
                            onClick={() => setEditingEvent(event)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {t('events.edit')}
                          </DropdownMenuItem>
                        )}
                        {permissions.canCreateEvents && (
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(event)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            {t('events.duplicate')}
                          </DropdownMenuItem>
                        )}
                        {permissions.canDeleteEvents && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingEvent(event)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('events.delete')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {events.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        )}
      </div>
        </>
      )}

      {/* Add Event Dialog */}
      <EventFormDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setPrefilledDate(null);
        }}
        onSuccess={handleEventSaved}
        prefilledDate={prefilledDate}
      />

      {/* Edit Event Dialog */}
      <EventFormDialog
        event={editingEvent}
        open={!!editingEvent}
        onOpenChange={(open) => !open && setEditingEvent(null)}
        onSuccess={handleEventSaved}
      />

      {/* Delete Event Dialog */}
      <DeleteEventDialog
        event={deletingEvent}
        open={!!deletingEvent}
        onOpenChange={(open) => !open && setDeletingEvent(null)}
        onSuccess={handleEventSaved}
      />

      {/* Day Events Dialog (multiple events for a day) */}
      <DayEventsDialog
        date={selectedDate}
        events={selectedDateEvents}
        open={showDayEventsDialog}
        onOpenChange={setShowDayEventsDialog}
        onEventSelect={setEditingEvent}
      />
    </div>
  );
}

