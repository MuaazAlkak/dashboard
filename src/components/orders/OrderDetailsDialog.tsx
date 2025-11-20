import { useEffect, useState } from 'react';
import { Loader2, Package, User, CreditCard, MapPin, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { orderService, Order, OrderItemWithProduct } from '@/lib/supabase';
import { sendOrderStatusUpdateEmail } from '@/lib/emailService';
import { orderLogger } from '@/lib/auditLogger';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

interface OrderDetailsDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated?: () => void;
}

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

export function OrderDetailsDialog({
  orderId,
  open,
  onOpenChange,
  onStatusUpdated,
}: OrderDetailsDialogProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const permissions = usePermissions();

  useEffect(() => {
    if (orderId && open) {
      fetchOrderDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, open]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    setIsLoading(true);
    try {
      const data = await orderService.getOrder(orderId);
      setOrder(data);
      setNewStatus(data.status);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load order details: ${errorMessage}`);
      console.error('Error fetching order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!orderId || !newStatus || newStatus === order?.status) return;

    setIsUpdatingStatus(true);
    const oldStatus = order?.status;
    
    try {
      // Update order status in database
      await orderService.updateOrderStatus(orderId, newStatus);
      
      // Log the status update
      await orderLogger.statusUpdated(orderId, oldStatus, newStatus);
      
      // Send email notification if order has shipping email
      if (order?.shipping?.email) {
        try {
          await sendOrderStatusUpdateEmail({
            orderId,
            newStatus,
            oldStatus,
          });
          toast.success('Order status updated and email notification sent');
        } catch (emailError) {
          // Log email error but don't fail the status update
          console.error('Failed to send email notification:', emailError);
          toast.success('Order status updated successfully (email notification failed)');
        }
      } else {
        toast.success('Order status updated successfully');
      }
      
      await fetchOrderDetails();
      onStatusUpdated?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update order status: ${errorMessage}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!orderId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            View and manage order information
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : order ? (
          <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
            <div className="space-y-6">
              {/* Order Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>Order ID</span>
                  </div>
                  <p className="font-mono text-sm">{order.id}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Order Date</span>
                  </div>
                  <p className="text-sm">{formatDate(order.created_at)}</p>
                </div>
              </div>

              {/* Status Management */}
              <div className="space-y-3">
                <Label>Order Status</Label>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusBadgeClass(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  {permissions.canEditOrders && (
                    <>
                      <Select 
                        value={newStatus} 
                        onValueChange={setNewStatus}
                        disabled={isUpdatingStatus}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      {newStatus !== order.status && (
                        <Button
                          onClick={handleStatusUpdate}
                          disabled={isUpdatingStatus}
                          size="sm"
                        >
                          {isUpdatingStatus ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            'Update Status'
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Payment Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <h3 className="font-semibold">Payment Information</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <span className="font-medium">{order.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-semibold text-lg">
                      {formatPrice(order.total_amount, order.currency)}
                    </span>
                  </div>
                  {order.stripe_payment_intent_id && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Intent:</span>
                      <span className="font-mono text-xs">{order.stripe_payment_intent_id}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Shipping Information */}
              {order.shipping && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <h3 className="font-semibold">Shipping Information</h3>
                    </div>
                    <div className="space-y-2 text-sm bg-muted/50 p-4 rounded-lg">
                      {(order.shipping.fullName || order.shipping.name) && (
                        <div>
                          <span className="text-muted-foreground">Name: </span>
                          <span className="font-medium">{order.shipping.fullName || order.shipping.name}</span>
                        </div>
                      )}
                      {order.shipping.email && (
                        <div>
                          <span className="text-muted-foreground">Email: </span>
                          <span>{order.shipping.email}</span>
                        </div>
                      )}
                      {order.shipping.phone && (
                        <div>
                          <span className="text-muted-foreground">Phone: </span>
                          <span>{order.shipping.phone}</span>
                        </div>
                      )}
                      {order.shipping.address && (
                        <div>
                          <span className="text-muted-foreground">Address: </span>
                          <div className="mt-1">
                            <div>{order.shipping.address}</div>
                            <div>
                              {order.shipping.postalCode && `${order.shipping.postalCode} `}
                              {order.shipping.city}
                            </div>
                            {order.shipping.country && <div>{order.shipping.country}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Order Items */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <h3 className="font-semibold">Order Items</h3>
                </div>
                <div className="space-y-3">
                  {order.order_items && order.order_items.length > 0 ? (
                    order.order_items.map((item: OrderItemWithProduct) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 border border-border rounded-lg bg-card"
                      >
                        {item.products?.images?.[0] && (
                          <img
                            src={item.products.images[0]}
                            alt={item.products.title?.en || 'Product'}
                            className="h-16 w-16 rounded-md object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {item.products?.title?.en || 'Product'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPrice(item.unit_price, order.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Subtotal: {formatPrice(item.unit_price * item.quantity, order.currency)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No items found for this order
                    </p>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Order not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


