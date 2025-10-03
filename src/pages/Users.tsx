import { Users as UsersIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Customer',
    orders: 5,
    joined: '2023-12-01',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Customer',
    orders: 12,
    joined: '2023-11-15',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Customer',
    orders: 3,
    joined: '2024-01-05',
  },
];

export default function Users() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Users</h1>
        <p className="mt-2 text-muted-foreground">
          Manage customer accounts (placeholder)
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-elegant">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockUsers.map((user) => (
              <TableRow
                key={user.id}
                className="group transition-all hover:bg-muted/50"
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {user.orders} orders
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.joined).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center">
        <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          User Management Coming Soon
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect to Supabase to enable full user management functionality
        </p>
      </div>
    </div>
  );
}
