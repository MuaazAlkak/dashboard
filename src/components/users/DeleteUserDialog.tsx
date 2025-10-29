import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AdminUser, userService } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DeleteUserDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      await userService.deleteUser(user.id);
      toast.success(`User ${user.email} has been deleted`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to delete user: ${errorMessage}`);
      console.error('Error deleting user:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete User
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="bg-muted p-3 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Email:</span>
                <span className="text-sm text-foreground">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Role:</span>
                <Badge variant="outline">{user.role}</Badge>
              </div>
            </div>
            <p className="text-destructive font-medium">
              ⚠️ This will permanently remove the user's access to the admin dashboard.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

