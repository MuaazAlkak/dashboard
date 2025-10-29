import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Event } from '@/lib/supabase';

interface EventsStatsProps {
  events: Event[];
}

export function EventsStats({ events }: EventsStatsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    
    const active = events.filter(e => {
      const start = new Date(e.start_date);
      const end = new Date(e.end_date);
      return e.is_active && now >= start && now <= end;
    }).length;

    const upcoming = events.filter(e => {
      const start = new Date(e.start_date);
      return now < start;
    }).length;

    const ended = events.filter(e => {
      const end = new Date(e.end_date);
      return now > end;
    }).length;

    const withDiscount = events.filter(e => 
      e.discount_percentage && e.discount_percentage > 0
    ).length;

    const avgDiscount = events.reduce((sum, e) => {
      return sum + (e.discount_percentage || 0);
    }, 0) / (withDiscount || 1);

    return {
      total: events.length,
      active,
      upcoming,
      ended,
      withDiscount,
      avgDiscount: Math.round(avgDiscount),
    };
  }, [events]);

  const statCards = [
    {
      title: 'Total Events',
      value: stats.total.toString(),
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Now',
      value: stats.active.toString(),
      subtitle: 'Currently running',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Upcoming',
      value: stats.upcoming.toString(),
      subtitle: 'Not started yet',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Ended',
      value: stats.ended.toString(),
      subtitle: 'Past events',
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
    {
      title: 'With Discounts',
      value: stats.withDiscount.toString(),
      subtitle: `Avg ${stats.avgDiscount}% off`,
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Card className="hover:shadow-lg transition-all group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`${card.bgColor} p-2 rounded-full group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.subtitle}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

