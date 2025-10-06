import { useState, useEffect } from 'react';
import { Plus, Loader2, Calendar, Edit, Trash2, MoreVertical, Copy } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EventFormDialog } from '@/components/events/EventFormDialog';
import { DeleteEventDialog } from '@/components/events/DeleteEventDialog';
import { Event, eventService } from '@/lib/supabase';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const permissions = usePermissions();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await eventService.getEvents();
      setEvents(data);
    } catch (error: any) {
      toast.error(`Failed to load events: ${error.message}`);
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventSaved = () => {
    fetchEvents();
  };

  const handleToggleStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      await eventService.toggleEventStatus(eventId, !currentStatus);
      toast.success('Event status updated');
      fetchEvents();
    } catch (error: any) {
      toast.error(`Failed to update status: ${error.message}`);
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
    } catch (error: any) {
      toast.error(`Failed to duplicate event: ${error.message}`);
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
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
            Manage promotional events and banners
          </p>
        </div>
        {permissions.canCreateEvents && (
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gradient-primary shadow-glow hover:opacity-90 w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        )}
      </div>

      {/* Events Table */}
      <div className="rounded-lg border border-border bg-card shadow-elegant overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[60px]">Color</TableHead>
              <TableHead className="min-w-[150px]">Title</TableHead>
              <TableHead className="min-w-[120px]">Start Date</TableHead>
              <TableHead className="min-w-[120px]">End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Active</TableHead>
              {(permissions.canEditEvents || permissions.canDeleteEvents) && (
                <TableHead className="w-[80px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow
                key={event.id}
                className="group transition-all hover:bg-muted/50"
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
                    {event.discount_percentage && event.discount_percentage > 0 && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {event.discount_percentage}% OFF
                      </Badge>
                    )}
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
                    {isEventActive(event) ? 'Active' : 'Inactive'}
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
                      {event.is_active ? 'Enabled' : 'Disabled'}
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
                            Edit
                          </DropdownMenuItem>
                        )}
                        {permissions.canCreateEvents && (
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(event)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                        )}
                        {permissions.canDeleteEvents && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingEvent(event)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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
            <p className="text-muted-foreground">No events found</p>
          </div>
        )}
      </div>

      {/* Add Event Dialog */}
      <EventFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleEventSaved}
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
    </div>
  );
}

