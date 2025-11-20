import { useState } from 'react';
import { Loader2, RotateCcw, AlertTriangle } from 'lucide-react';
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
import { AuditLog, auditLogService, productService, orderService, userService, eventService } from '@/lib/supabase';
import { toast } from 'sonner';

interface RevertLogDialogProps {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RevertLogDialog({
  log,
  open,
  onOpenChange,
  onSuccess,
}: RevertLogDialogProps) {
  const [isReverting, setIsReverting] = useState(false);

  const handleRevert = async () => {
    if (!log || log.reverted) return;

    setIsReverting(true);

    try {
      // Revert the action based on entity type and action
      if (log.entity_type === 'product' && log.entity_id) {
        if (log.action === 'create') {
          // Delete the created product
          await productService.deleteProduct(log.entity_id);
        } else if (log.action === 'update' && log.changes?.before) {
          // Restore previous values
          await productService.updateProduct(log.entity_id, log.changes.before);
        }
        // Note: Can't revert deletes as the data is gone
      } else if (log.entity_type === 'order' && log.entity_id) {
        if (log.action === 'update' && log.changes?.before) {
          // Restore previous status
          await orderService.updateOrderStatus(log.entity_id, log.changes.before.status);
        }
      } else if (log.entity_type === 'user' && log.entity_id) {
        if (log.action === 'update' && log.changes?.before) {
          // Restore previous role
          await userService.updateUserRole(log.entity_id, log.changes.before.role);
        }
      } else if (log.entity_type === 'event' && log.entity_id) {
        if (log.action === 'create') {
          // Delete the created event
          await eventService.deleteEvent(log.entity_id);
        } else if (log.action === 'update' && log.changes?.before) {
          // Restore previous values
          await eventService.updateEvent(log.entity_id, log.changes.before);
        }
      }

      // Mark log as reverted
      await auditLogService.markAsReverted(log.id);

      toast.success('Action reverted successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to revert action: ${errorMessage}`);
      console.error('Error reverting action:', error);
    } finally {
      setIsReverting(false);
    }
  };

  if (!log) return null;

  const canRevert = !log.reverted && log.action !== 'delete' && log.changes?.before;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Revert Action
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to revert this action? This will undo the changes made.
            </p>
            {!canRevert && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {log.action === 'delete' 
                    ? 'Delete actions cannot be reverted as the data has been permanently removed.'
                    : 'This action cannot be reverted because the previous state is not available.'}
                </p>
              </div>
            )}
            <div className="bg-muted p-3 rounded-md space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Action:</span>
                <span className="font-medium capitalize">{log.action}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Entity:</span>
                <span className="font-medium">{log.entity_type} - {log.entity_name || log.entity_id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isReverting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevert}
            disabled={isReverting || !canRevert}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isReverting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reverting...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Revert Action
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

