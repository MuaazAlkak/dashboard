import { useState, useEffect } from 'react';
import { Plus, Loader2, Shield, ShieldCheck, Eye, Edit, UserCog } from 'lucide-react';
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
import { AddUserDialog } from '@/components/users/AddUserDialog';
import { EditUserRoleDialog } from '@/components/users/EditUserRoleDialog';
import { userService, AdminUser } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'super_admin':
      return <ShieldCheck className="h-4 w-4" />;
    case 'admin':
      return <Shield className="h-4 w-4" />;
    case 'editor':
      return <Edit className="h-4 w-4" />;
    default:
      return <Eye className="h-4 w-4" />;
  }
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'default';
    case 'admin':
      return 'default';
    case 'editor':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    case 'editor':
      return 'Editor';
    case 'viewer':
      return 'Viewer';
    default:
      return role;
  }
};

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const permissions = usePermissions();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error: any) {
      toast.error(`Failed to load users: ${error.message}`);
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentUserRole = async () => {
    const role = await userService.getCurrentUserRole();
    setCurrentUserRole(role);
  };

  useEffect(() => {
    fetchUsers();
    fetchCurrentUserRole();
  }, []);

  const handleUserAdded = () => {
    fetchUsers();
  };

  const handleEditRole = (user: AdminUser) => {
    setSelectedUser(user);
    setIsEditRoleDialogOpen(true);
  };

  const handleRoleUpdated = () => {
    fetchUsers();
    setSelectedUser(null);
  };

  const isSuperAdmin = currentUserRole === 'super_admin';

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Admin Users</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
            Manage admin users and their permissions
          </p>
        </div>
        {permissions.canCreateUsers && (
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gradient-primary shadow-glow hover:opacity-90 w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-border bg-card shadow-elegant overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[200px]">User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell">Last Sign In</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="group transition-all hover:bg-muted/50"
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground text-sm sm:text-base">
                      {user.email}
                    </p>
                    {user.id === currentUser?.id && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={getRoleBadgeVariant(user.role)}
                    className="flex items-center gap-1 w-fit"
                  >
                    {getRoleIcon(user.role)}
                    <span className="hidden sm:inline">{getRoleLabel(user.role)}</span>
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleDateString()
                    : 'Never'}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                {isSuperAdmin && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRole(user)}
                      className="hover:bg-muted"
                    >
                      <UserCog className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Edit Role</span>
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {users.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
      </div>

      {/* Add User Dialog */}
      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleUserAdded}
      />

      {/* Edit User Role Dialog */}
      <EditUserRoleDialog
        open={isEditRoleDialogOpen}
        onOpenChange={setIsEditRoleDialogOpen}
        user={selectedUser}
        onSuccess={handleRoleUpdated}
      />
    </div>
  );
}
