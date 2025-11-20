import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';

import { Order } from '@/lib/supabase';

interface OrdersChartProps {
  orders: Order[];
}

export function OrdersChart({ orders }: OrdersChartProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useLanguage();
  
  // Get the most common currency from orders, or default to SEK
  const getPrimaryCurrency = () => {
    const currencyCounts = orders.reduce((acc, order) => {
      const currency = order.currency?.toUpperCase() || 'SEK';
      acc[currency] = (acc[currency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonCurrency = Object.entries(currencyCounts).reduce((a, b) => 
      a[1] > b[1] ? a : b, ['SEK', 0] as [string, number]
    )[0];

    return mostCommonCurrency;
  };

  const primaryCurrency = useMemo(() => getPrimaryCurrency(), [orders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: primaryCurrency,
    }).format(amount);
  };

  const chartData = useMemo(() => {
    // Get last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    return last7Days.map(date => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= date && orderDate < nextDay;
      });

      const revenue = dayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        orders: dayOrders.length,
        revenue: revenue / 100,
      };
    });
  }, [orders]);

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);
  const maxOrders = Math.max(...chartData.map(d => d.orders), 1);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('orders.last7DaysPerformance') || 'Last 7 Days Performance'}
              </div>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
        <div className="space-y-4">
          {chartData.map((day, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">{day.date}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">
                    {day.orders} orders
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(day.revenue)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {/* Orders bar */}
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(day.orders / maxOrders) * 100}%` }}
                    />
                  </div>
                </div>
                {/* Revenue bar */}
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-muted-foreground">Orders Count</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <span className="text-muted-foreground">Revenue</span>
          </div>
        </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

