import { ShoppingCart } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const mockOrders = [
  {
    id: '1001',
    user: 'John Doe',
    email: 'john@example.com',
    status: 'delivered',
    total: 29999,
    items: 2,
    date: '2024-01-15',
  },
  {
    id: '1002',
    user: 'Jane Smith',
    email: 'jane@example.com',
    status: 'processing',
    total: 49998,
    items: 3,
    date: '2024-01-16',
  },
  {
    id: '1003',
    user: 'Bob Johnson',
    email: 'bob@example.com',
    status: 'pending',
    total: 14999,
    items: 1,
    date: '2024-01-17',
  },
];

const statusColors = {
  pending: 'outline',
  processing: 'default',
  shipped: 'default',
  delivered: 'default',
  cancelled: 'destructive',
} as const;

export default function Orders() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Orders</h1>
        <p className="mt-2 text-muted-foreground">
          Manage and track customer orders (placeholder)
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-elegant">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockOrders.map((order) => (
              <TableRow
                key={order.id}
                className="group transition-all hover:bg-muted/50"
              >
                <TableCell className="font-medium">#{order.id}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{order.user}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusColors[order.status]}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {order.items} items
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  {formatPrice(order.total)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(order.date).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          Orders Module Coming Soon
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect to Supabase to enable full order management functionality
        </p>
      </div>
    </div>
  );
}
