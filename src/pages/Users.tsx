import { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, Shield, ShieldCheck, Eye, Edit, UserCog, Info, Trash2, MoreVertical, Network, LayoutGrid } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddUserDialog } from '@/components/users/AddUserDialog';
import { EditUserRoleDialog } from '@/components/users/EditUserRoleDialog';
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog';
import { UserDetailsDialog } from '@/components/users/UserDetailsDialog';
import { UsersStats } from '@/components/users/UsersStats';
import { UsersFilters } from '@/components/users/UsersFilters';
import { UserActivityIndicator } from '@/components/users/UserActivityIndicator';
import { UserAvatar } from '@/components/users/UserAvatar';
import { UsersWorkflowView } from '@/components/users/UsersWorkflowView';
import { userService, AdminUser } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  
  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'workflow'>('workflow');
  
  const { user: currentUser } = useAuth();
  const permissions = usePermissions();
  const { t } = useLanguage();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load users: ${errorMessage}`);
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

  const handleViewDetails = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleUserDeleted = () => {
    fetchUsers();
    setSelectedUser(null);
  };

  const handleExport = () => {
    const csvContent = [
      ['Email', 'Role', 'Created At', 'Last Sign In'],
      ...filteredUsers.map(user => [
        user.email,
        user.role,
        new Date(user.created_at).toLocaleString(),
        user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never',
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Users exported successfully');
  };

  // Filtered users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      if (searchQuery && !user.email.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Role filter
      if (roleFilter !== 'all' && user.role !== roleFilter) {
        return false;
      }

      // Activity filter
      if (activityFilter !== 'all') {
        const now = new Date();
        const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;

        switch (activityFilter) {
          case 'active_7d':
            if (!lastSignIn || (now.getTime() - lastSignIn.getTime()) > 7 * 24 * 60 * 60 * 1000) {
              return false;
            }
            break;
          case 'active_30d':
            if (!lastSignIn || (now.getTime() - lastSignIn.getTime()) > 30 * 24 * 60 * 60 * 1000) {
              return false;
            }
            break;
          case 'inactive':
            if (!lastSignIn || (now.getTime() - lastSignIn.getTime()) <= 30 * 24 * 60 * 60 * 1000) {
              return false;
            }
            break;
          case 'never_signed_in':
            if (lastSignIn) {
              return false;
            }
            break;
        }
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, activityFilter]);

  const activeFiltersCount = [
    searchQuery !== '',
    roleFilter !== 'all',
    activityFilter !== 'all',
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setActivityFilter('all');
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
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t('users.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
            Manage admin users and their permissions
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-border bg-card p-1">
            <Button
              variant={viewMode === 'workflow' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('workflow')}
              className="h-8"
            >
              <Network className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Workflow</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Table</span>
            </Button>
          </div>
          
          {permissions.canCreateUsers && (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-gradient-primary shadow-glow hover:opacity-90 flex-1 sm:flex-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t('users.addUser')}</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <UsersStats users={users} isLoading={isLoading} />

      {/* Filters - Only show in table view */}
      {viewMode === 'table' && (
        <UsersFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          activityFilter={activityFilter}
          onActivityFilterChange={setActivityFilter}
          onClearFilters={handleClearFilters}
          onExport={handleExport}
          activeFiltersCount={activeFiltersCount}
        />
      )}

      {/* Workflow View */}
      {viewMode === 'workflow' && (
        <UsersWorkflowView
          users={filteredUsers}
          onViewDetails={handleViewDetails}
          onEditRole={handleEditRole}
          onDeleteUser={handleDeleteUser}
          currentUserId={currentUser?.id}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Users Table */}
      {viewMode === 'table' && (
        <div className="rounded-lg border border-border bg-card shadow-elegant overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[200px]">User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden lg:table-cell">Activity</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const isCurrentUser = user.id === currentUser?.id;
              return (
                <TableRow
                  key={user.id}
                  className="group transition-all hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar email={user.email} role={user.role} size="md" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm sm:text-base">
                          {user.email}
                        </p>
                        {isCurrentUser && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            You
                          </Badge>
                        )}
                      </div>
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
                  <TableCell className="hidden lg:table-cell">
                    <UserActivityIndicator lastSignInAt={user.last_sign_in_at} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                          <Info className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {isSuperAdmin && !isCurrentUser && (
                          <>
                            <DropdownMenuItem onClick={() => handleEditRole(user)}>
                              <UserCog className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredUsers.length === 0 && !isLoading && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              {activeFiltersCount > 0 ? 'No users match your filters' : 'No users found'}
            </p>
            {activeFiltersCount > 0 && (
              <Button
                variant="link"
                onClick={handleClearFilters}
                className="mt-2"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
        </div>
      )}

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

      {/* Delete User Dialog */}
      <DeleteUserDialog
        user={selectedUser}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleUserDeleted}
      />

      {/* User Details Dialog */}
      <UserDetailsDialog
        user={selectedUser}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
