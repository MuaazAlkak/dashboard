import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { HeroImageSection } from '@/components/dashboard/HeroImageSection';

export default function Dashboard() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t('dashboard.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <DashboardStats />

      {/* Hero Image Section */}
      <HeroImageSection />

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle>{t('orders.title')}</CardTitle>
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
                    {t('orders.pending')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle>{t('products.title')}</CardTitle>
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
                    {t('products.lowStock')}
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
