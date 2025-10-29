import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { userService, AdminUser } from '@/lib/supabase';

interface EditUserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onSuccess?: () => void;
}

export function EditUserRoleDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditUserRoleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'viewer');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      await userService.updateUserRole(user.id, selectedRole);
      toast.success('User role updated successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update user role: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset selected role when user changes
  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User Role</DialogTitle>
          <DialogDescription>
            Change the role for {user.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Email (Read-only) */}
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              {user.email}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={selectedRole} 
              onValueChange={setSelectedRole}
              disabled={isLoading}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">
                  Super Admin - Full access
                </SelectItem>
                <SelectItem value="admin">
                  Admin - Manage products, orders, users
                </SelectItem>
                <SelectItem value="editor">
                  Editor - Manage products and orders
                </SelectItem>
                <SelectItem value="viewer">
                  Viewer - Read-only access
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || selectedRole === user.role}
              className="bg-gradient-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

