import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminUser } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ShieldCheck,
  Shield,
  Edit,
  Eye,
  Mail,
  Calendar,
  Clock,
  Activity,
} from 'lucide-react';
import { UserActivityIndicator } from './UserActivityIndicator';

interface UserDetailsDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'super_admin':
      return ShieldCheck;
    case 'admin':
      return Shield;
    case 'editor':
      return Edit;
    default:
      return Eye;
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

const getRoleDescription = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'Full system access including user management';
    case 'admin':
      return 'Can manage products, orders, and events';
    case 'editor':
      return 'Can edit products and view orders';
    case 'viewer':
      return 'Read-only access to dashboard';
    default:
      return '';
  }
};

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
  currentUserId,
}: UserDetailsDialogProps) {
  if (!user) return null;

  const RoleIcon = getRoleIcon(user.role);
  const isCurrentUser = user.id === currentUserId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RoleIcon className="h-5 w-5" />
                {user.email}
                {isCurrentUser && (
                  <Badge variant="outline" className="ml-2">
                    You
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Role */}
              <div className="flex items-start gap-3">
                <div className="w-24 text-sm text-muted-foreground">Role:</div>
                <div>
                  <Badge variant={getRoleBadgeVariant(user.role) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                    {getRoleLabel(user.role)}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getRoleDescription(user.role)}
                  </p>
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-center gap-3">
                <div className="w-24 text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created:
                </div>
                <div className="text-sm">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  <span className="text-muted-foreground ml-2">
                    ({Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago)
                  </span>
                </div>
              </div>

              {/* Last Sign In */}
              <div className="flex items-center gap-3">
                <div className="w-24 text-sm text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activity:
                </div>
                <div>
                  <UserActivityIndicator lastSignInAt={user.last_sign_in_at} />
                  {user.last_sign_in_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last sign in: {new Date(user.last_sign_in_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* User ID */}
              <div className="flex items-start gap-3">
                <div className="w-24 text-sm text-muted-foreground">User ID:</div>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                  {user.id}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {user.role === 'super_admin' && (
                  <>
                    <PermissionItem label="User Management" granted />
                    <PermissionItem label="System Settings" granted />
                    <PermissionItem label="Full Products Access" granted />
                    <PermissionItem label="Full Orders Access" granted />
                    <PermissionItem label="Events Management" granted />
                    <PermissionItem label="Analytics & Reports" granted />
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <PermissionItem label="User Management" granted={false} />
                    <PermissionItem label="System Settings" granted={false} />
                    <PermissionItem label="Full Products Access" granted />
                    <PermissionItem label="Full Orders Access" granted />
                    <PermissionItem label="Events Management" granted />
                    <PermissionItem label="Analytics & Reports" granted />
                  </>
                )}
                {user.role === 'editor' && (
                  <>
                    <PermissionItem label="User Management" granted={false} />
                    <PermissionItem label="System Settings" granted={false} />
                    <PermissionItem label="Edit Products" granted />
                    <PermissionItem label="View Orders" granted />
                    <PermissionItem label="Events Management" granted={false} />
                    <PermissionItem label="Analytics & Reports" granted={false} />
                  </>
                )}
                {user.role === 'viewer' && (
                  <>
                    <PermissionItem label="User Management" granted={false} />
                    <PermissionItem label="System Settings" granted={false} />
                    <PermissionItem label="View Products" granted />
                    <PermissionItem label="View Orders" granted />
                    <PermissionItem label="Events Management" granted={false} />
                    <PermissionItem label="Analytics & Reports" granted={false} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PermissionItem({ label, granted }: { label: string; granted: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${granted ? 'bg-green-500' : 'bg-gray-300'}`} />
      <span className={`text-sm ${granted ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}

