import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Users,
  AlertCircle
} from 'lucide-react';
import { productService, orderService } from '@/lib/supabase';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [products, orders] = await Promise.all([
        productService.getProducts(),
        orderService.getOrders(),
      ]);

      const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock < 50).length;
      const outOfStockProducts = products.filter((p) => p.stock === 0).length;
      const productsWithDiscount = products.filter(
        (p) => p.discount_active && p.discount_percentage && p.discount_percentage > 0
      ).length;

      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
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

  const statCards = [
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
      value: `${(stats?.totalRevenue || 0) / 100} SEK`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ];

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

