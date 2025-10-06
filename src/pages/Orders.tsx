import { useState, useEffect } from 'react';
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
import { orderService } from '@/lib/supabase';
import { toast } from 'sonner';

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
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (error: any) {
      toast.error(`Failed to load orders: ${error.message}`);
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
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
          Manage and track customer orders
        </p>
      </div>

      {/* Orders Table */}
      <div className="rounded-lg border border-border bg-card shadow-elegant overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[100px]">Order ID</TableHead>
              <TableHead className="hidden sm:table-cell">Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
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
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
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
                      <span className="hidden sm:inline">View</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {orders.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No orders found</p>
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
