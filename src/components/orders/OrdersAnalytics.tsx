import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Clock,
  CheckCircle,
  XCircle,
  Package,
  TrendingDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { Order } from '@/lib/supabase';

interface OrdersAnalyticsProps {
  orders: Order[];
}

export function OrdersAnalytics({ orders }: OrdersAnalyticsProps) {
  const analytics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const totalOrders = orders.length;
    
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(order => 
      new Date(order.created_at) >= today
    ).length;

    // Calculate this week's revenue
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekRevenue = orders
      .filter(order => new Date(order.created_at) >= weekAgo)
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);

    // Calculate growth compared to last week
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const lastWeekRevenue = orders
      .filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= twoWeeksAgo && orderDate < weekAgo;
      })
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);

    const growthRate = lastWeekRevenue > 0 
      ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
      : 0;

    return {
      totalRevenue,
      totalOrders,
      statusCounts,
      averageOrderValue,
      todayOrders,
      weekRevenue,
      growthRate,
    };
  }, [orders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SEK',
    }).format(amount / 100);
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics.totalRevenue),
      change: `${analytics.growthRate >= 0 ? '+' : ''}${analytics.growthRate.toFixed(1)}%`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      trend: analytics.growthRate >= 0 ? 'up' : 'down',
    },
    {
      title: 'Total Orders',
      value: analytics.totalOrders.toString(),
      subtitle: `${analytics.todayOrders} today`,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Average Order',
      value: formatCurrency(analytics.averageOrderValue),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Pending Orders',
      value: (analytics.statusCounts['pending'] || 0).toString(),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Completed',
      value: (analytics.statusCounts['delivered'] || 0).toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Cancelled',
      value: (analytics.statusCounts['cancelled'] || 0).toString(),
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{card.value}</div>
                  {card.change && (
                    <Badge 
                      variant={card.trend === 'up' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {card.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {card.change}
                    </Badge>
                  )}
                </div>
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

