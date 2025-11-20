import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Users,
  AlertCircle
} from 'lucide-react';
import { productService, orderService, Order } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  lowStockProducts: number;
  totalRevenue: number;
  productsWithDiscount: number;
  outOfStockProducts: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [products, ordersData] = await Promise.all([
        productService.getProducts(),
        orderService.getOrders(),
      ]);

      const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock < 50).length;
      const outOfStockProducts = products.filter((p) => p.stock === 0).length;
      const productsWithDiscount = products.filter(
        (p) => p.discount_active && p.discount_percentage && p.discount_percentage > 0
      ).length;

      const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0);

      setOrders(ordersData);
      setStats({
        totalProducts: products.length,
        totalOrders: ordersData.length,
        lowStockProducts,
        totalRevenue,
        productsWithDiscount,
        outOfStockProducts,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get the most common currency from orders, or default to SEK
  const getPrimaryCurrency = () => {
    if (orders.length === 0) return 'SEK';
    
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

  const formatCurrency = (amount: number) => {
    const currency = getPrimaryCurrency();
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  // Calculate statCards with proper currency formatting
  const statCards = useMemo(() => [
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Products on Sale',
      value: stats?.productsWithDiscount || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Low Stock Items',
      value: stats?.lowStockProducts || 0,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Out of Stock',
      value: stats?.outOfStockProducts || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ], [stats, orders]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`${card.bgColor} p-2 rounded-full`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

