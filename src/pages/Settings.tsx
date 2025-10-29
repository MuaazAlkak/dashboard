import { Settings as SettingsIcon, Moon, Sun, Bell, Globe, ShoppingBag, TrendingUp, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/components/ThemeProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appearance */}
        <Card className="border-border bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-primary" />
              {t('settings.appearance')}
            </CardTitle>
            <CardDescription>
              {t('settings.themeDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.theme')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.themeDesc')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? 'dark' : 'light')
                  }
                />
                <Moon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card className="border-border bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {t('settings.language')}
            </CardTitle>
            <CardDescription>
              {t('settings.languageDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">{t('settings.dashboardLanguage')}</Label>
              <select
                id="language"
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value as 'en' | 'ar' | 'sv');
                  toast.success('Language changed successfully');
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="en">English</option>
                <option value="ar">العربية (Arabic)</option>
                <option value="sv">Svenska (Swedish)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t('settings.defaultCurrency')}</Label>
              <select
                id="currency"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="SEK">SEK - Swedish Krona</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">{t('settings.timezone')}</Label>
              <select
                id="timezone"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="UTC">UTC</option>
                <option value="Europe/Stockholm">Europe/Stockholm</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="America/New_York">America/New York</option>
              </select>
            </div>
            <Button onClick={handleSave} className="w-full">
              {t('settings.savePreferences')}
            </Button>
          </CardContent>
        </Card>

        {/* Store Info */}
        <Card className="border-border bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              {t('settings.storeInfo')}
            </CardTitle>
            <CardDescription>
              {t('settings.storeInfoDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">{t('settings.storeName')}</Label>
              <Input
                id="store-name"
                placeholder="My E-Commerce Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-email">{t('settings.contactEmail')}</Label>
              <Input
                id="store-email"
                type="email"
                placeholder="contact@store.com"
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              {t('settings.updateStoreInfo')}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {t('settings.notifications')}
            </CardTitle>
            <CardDescription>
              {t('settings.notificationsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.lowStockAlerts')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.lowStockAlertsDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.newOrderNotifications')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.newOrderNotificationsDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.orderStatusUpdates')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.orderStatusUpdatesDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.productReviews')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.productReviewsDesc')}
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card className="border-border bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              {t('settings.inventory')}
            </CardTitle>
            <CardDescription>
              {t('settings.inventoryDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="low-stock">{t('settings.lowStockThreshold')}</Label>
              <Input
                id="low-stock"
                type="number"
                placeholder="10"
                defaultValue="10"
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.lowStockThresholdDesc')}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.autoHideOutOfStock')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.autoHideOutOfStockDesc')}
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.trackInventory')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.trackInventoryDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Button onClick={handleSave} className="w-full">
              {t('common.save')}
            </Button>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card className="border-border bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              {t('settings.email')}
            </CardTitle>
            <CardDescription>
              {t('settings.emailDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.orderConfirmation')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.orderConfirmationDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.shippingUpdates')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.shippingUpdatesDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.deliveryConfirmation')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.deliveryConfirmationDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply-to">{t('settings.replyToEmail')}</Label>
              <Input
                id="reply-to"
                type="email"
                placeholder="support@store.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Analytics & Reports */}
        <Card className="border-border bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('settings.analytics')}
            </CardTitle>
            <CardDescription>
              {t('settings.analyticsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.dailySalesReport')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.dailySalesReportDesc')}
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.weeklyPerformanceReport')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.weeklyPerformanceReportDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.exportDataAccess')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.exportDataAccessDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-day">{t('settings.reportDay')}</Label>
              <select
                id="report-day"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="monday">Monday</option>
                <option value="friday">Friday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
