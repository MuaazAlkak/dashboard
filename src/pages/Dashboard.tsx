import { Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  {
    title: 'Total Products',
    value: '248',
    change: '+12.5%',
    icon: Package,
    color: 'text-primary',
  },
  {
    title: 'Total Orders',
    value: '1,429',
    change: '+8.2%',
    icon: ShoppingCart,
    color: 'text-accent',
  },
  {
    title: 'Total Users',
    value: '892',
    change: '+15.3%',
    icon: Users,
    color: 'text-primary',
  },
  {
    title: 'Revenue',
    value: '$48,293',
    change: '+23.1%',
    icon: TrendingUp,
    color: 'text-accent',
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
          Welcome back! Here's an overview of your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            className="group relative overflow-hidden border-border bg-gradient-card shadow-elegant transition-all hover:shadow-glow animate-scale-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stat.value}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-medium text-primary">{stat.change}</span>{' '}
                from last month
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary opacity-0 transition-opacity group-hover:opacity-100" />
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      Order #{1000 + i}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      2 items • $299.99
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle>Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                'Wireless Headphones',
                'Smart Watch',
                'Laptop Backpack',
                'Coffee Maker',
              ].map((product, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-foreground">{product}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {5 + i} units
                    </p>
                  </div>
                  <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                    Low
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
