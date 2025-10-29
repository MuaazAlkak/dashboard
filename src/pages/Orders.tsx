import { useState, useEffect, useMemo } from 'react';
import { Eye, Loader2 } from 'lucide-react';
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
import { OrderDetailsDialog } from '@/components/orders/OrderDetailsDialog';
import { OrdersAnalytics } from '@/components/orders/OrdersAnalytics';
import { OrdersChart } from '@/components/orders/OrdersChart';
import { OrdersFilters } from '@/components/orders/OrdersFilters';
import { orderService, Order } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'processing':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    case 'shipped':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800';
  }
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const { t } = useLanguage();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load orders: ${errorMessage}`);
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsDetailsDialogOpen(true);
  };

  const handleStatusUpdated = () => {
    fetchOrders();
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price / 100);
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['Order ID', 'Customer', 'Email', 'Status', 'Items', 'Total', 'Date'].join(','),
        ...filteredOrders.map(order => [
          order.id,
          order.shipping?.name || 'Guest',
          order.shipping?.email || 'N/A',
          order.status,
          order.order_items?.length || 0,
          (order.total_amount || order.total || 0) / 100,
          new Date(order.created_at).toLocaleDateString(),
        ].map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Orders exported successfully');
    } catch (error) {
      toast.error('Failed to export orders');
    }
  };

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(searchLower);
        const matchesName = order.shipping?.name?.toLowerCase().includes(searchLower);
        const matchesEmail = order.shipping?.email?.toLowerCase().includes(searchLower);
        if (!matchesId && !matchesName && !matchesEmail) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today': {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (orderDate < today) return false;
            break;
          }
          case 'week': {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (orderDate < weekAgo) return false;
            break;
          }
          case 'month': {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (orderDate < monthAgo) return false;
            break;
          }
          case 'quarter': {
            const quarterAgo = new Date();
            quarterAgo.setMonth(quarterAgo.getMonth() - 3);
            if (orderDate < quarterAgo) return false;
            break;
          }
        }
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, dateFilter]);

  const activeFiltersCount = 
    (searchQuery ? 1 : 0) + 
    (statusFilter !== 'all' ? 1 : 0) + 
    (dateFilter !== 'all' ? 1 : 0);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
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
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t('orders.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
          {t('orders.subtitle')}
        </p>
      </div>

      {/* Analytics Cards */}
      <OrdersAnalytics orders={orders} />

      {/* Filters */}
      <OrdersFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        onExport={handleExport}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={handleClearFilters}
      />

      {/* Chart */}
      <OrdersChart orders={orders} />

      {/* Orders Table */}
      <div className="rounded-lg border border-border bg-card shadow-elegant overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[100px]">{t('orders.orderId')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('orders.customer')}</TableHead>
              <TableHead>{t('orders.status')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('orders.items')}</TableHead>
              <TableHead>{t('orders.total')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('orders.date')}</TableHead>
              <TableHead className="text-right">{t('orders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => {
              const itemCount = order.order_items?.length || 0;
              const customerEmail = order.shipping?.email || 'N/A';
              const customerName = order.shipping?.name || 'Guest';
              
              return (
                <TableRow
                  key={order.id}
                  className="group transition-all hover:bg-muted/50"
                >
                  <TableCell className="font-mono text-xs sm:text-sm">
                    #{order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {customerEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-muted-foreground text-sm">
                      {itemCount} {t('orders.items')}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-sm sm:text-base">
                    {formatPrice(order.total_amount, order.currency)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(order.id)}
                      className="hover:bg-muted"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">{t('orders.view')}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredOrders.length === 0 && orders.length > 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No orders match your filters</p>
            <Button
              variant="link"
              onClick={handleClearFilters}
              className="mt-2"
            >
              Clear filters
            </Button>
          </div>
        )}

        {orders.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">{t('orders.noOrders')}</p>
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        orderId={selectedOrderId}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}
