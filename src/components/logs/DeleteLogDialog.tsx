import { useState } from 'react';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
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
import { AuditLog, auditLogService } from '@/lib/supabase';
import { toast } from 'sonner';

interface DeleteLogDialogProps {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteLogDialog({
  log,
  open,
  onOpenChange,
  onSuccess,
}: DeleteLogDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!log) return;

    setIsDeleting(true);

    try {
      await auditLogService.deleteLog(log.id);

      toast.success('Audit log marked as deleted');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to delete audit log: ${errorMessage}`);
      console.error('Error deleting audit log:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!log) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Audit Log
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to delete this audit log entry? The log will be hidden from the main view but kept in the database for audit purposes.
            </p>
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
                <span className="text-muted-foreground">User:</span>
                <span className="font-medium">{log.user_email || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                This will mark the log as deleted. The log entry will be hidden but preserved in the database for audit trail purposes.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Log
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

