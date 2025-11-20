import { useState, useEffect, useMemo } from 'react';
import { Loader2, RotateCcw, Filter, X, Trash2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { auditLogService, AuditLog } from '@/lib/supabase';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { RevertLogDialog } from '@/components/logs/RevertLogDialog';
import { DeleteLogDialog } from '@/components/logs/DeleteLogDialog';

const getActionBadgeVariant = (action: string) => {
  switch (action) {
    case 'create':
      return 'default';
    case 'update':
      return 'secondary';
    case 'delete':
      return 'destructive';
    case 'revert':
      return 'outline';
    default:
      return 'outline';
  }
};

const getEntityTypeColor = (entityType: string) => {
  switch (entityType) {
    case 'product':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'order':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'user':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'event':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

export default function Logs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingLog, setDeletingLog] = useState<AuditLog | null>(null);
  
  // Filters
  const [actionFilter, setActionFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [revertedFilter, setRevertedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const permissions = usePermissions();
  const { user } = useAuth();

  // Check if user is super admin
  const isSuperAdmin = permissions.canDeleteUsers; // Super admin is the only role that can delete users

  useEffect(() => {
    if (isSuperAdmin) {
      fetchLogs();
    }
  }, [isSuperAdmin]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const filters: {
        action?: string;
        entityType?: string;
        reverted?: boolean;
        deleted?: boolean;
        includeDeleted?: boolean;
      } = {};
      
      if (actionFilter !== 'all') {
        filters.action = actionFilter;
      }
      
      if (entityTypeFilter !== 'all') {
        filters.entityType = entityTypeFilter;
      }
      
      if (revertedFilter === 'reverted') {
        filters.reverted = true;
      } else if (revertedFilter === 'deleted') {
        filters.deleted = true;
        filters.includeDeleted = true;
      } else if (revertedFilter === 'active') {
        filters.reverted = false;
        filters.deleted = false;
      }
      // 'all' shows all non-deleted logs by default

      const data = await auditLogService.getLogs(filters);
      setLogs(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load logs: ${errorMessage}`);
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevert = (log: AuditLog) => {
    setSelectedLog(log);
    setIsRevertDialogOpen(true);
  };

  const handleRevertSuccess = () => {
    fetchLogs();
    setIsRevertDialogOpen(false);
    setSelectedLog(null);
  };

  const handleDelete = (log: AuditLog) => {
    setDeletingLog(log);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchLogs();
    setIsDeleteDialogOpen(false);
    setDeletingLog(null);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesUser = log.user_email?.toLowerCase().includes(searchLower);
        const matchesEntity = log.entity_name?.toLowerCase().includes(searchLower);
        const matchesId = log.entity_id?.toLowerCase().includes(searchLower);
        
        if (!matchesUser && !matchesEntity && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const activeFiltersCount = 
    (actionFilter !== 'all' ? 1 : 0) + 
    (entityTypeFilter !== 'all' ? 1 : 0) + 
    (revertedFilter !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const handleClearFilters = () => {
    setActionFilter('all');
    setEntityTypeFilter('all');
    setRevertedFilter('all');
    setSearchQuery('');
  };

  // Redirect non-super admins
  if (!isSuperAdmin) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            Only super administrators can view audit logs.
          </p>
        </div>
      </div>
    );
  }

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
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
          Track all actions and changes in the dashboard
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card shadow-elegant p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by user, entity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger id="action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="revert">Revert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entity Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="entityType">Entity Type</Label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger id="entityType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reverted Filter */}
            <div className="space-y-2">
              <Label htmlFor="reverted">Status</Label>
              <Select value={revertedFilter} onValueChange={setRevertedFilter}>
                <SelectTrigger id="reverted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Active</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="reverted">Reverted</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="w-fit"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-lg border border-border bg-card shadow-elegant overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow
                key={log.id}
                className="group transition-all hover:bg-muted/50"
              >
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(log.created_at)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="font-medium">{log.user_email || 'Unknown'}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getActionBadgeVariant(log.action)}>
                    {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge className={getEntityTypeColor(log.entity_type)}>
                      {log.entity_type}
                    </Badge>
                    {log.entity_name && (
                      <p className="text-xs text-muted-foreground">
                        {log.entity_name}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLog(log)}
                    className="text-xs"
                  >
                    View Details
                  </Button>
                </TableCell>
                <TableCell>
                  {log.reverted ? (
                    <Badge variant="outline" className="text-xs">
                      Reverted
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!log.deleted && !log.reverted && log.action !== 'delete' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevert(log)}
                        className="text-primary hover:text-primary"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Revert
                      </Button>
                    )}
                    {!log.deleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(log)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredLogs.length === 0 && logs.length > 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No logs match your filters</p>
            <Button
              variant="link"
              onClick={handleClearFilters}
              className="mt-2"
            >
              Clear filters
            </Button>
          </div>
        )}

        {logs.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No audit logs found</p>
          </div>
        )}
      </div>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog && !isRevertDialogOpen} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this audit log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Timestamp</Label>
                    <p className="font-medium">{formatDate(selectedLog.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">User</Label>
                    <p className="font-medium">{selectedLog.user_email || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Action</Label>
                    <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                      {selectedLog.action}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Entity Type</Label>
                    <Badge className={getEntityTypeColor(selectedLog.entity_type)}>
                      {selectedLog.entity_type}
                    </Badge>
                  </div>
                  {selectedLog.entity_name && (
                    <div>
                      <Label className="text-muted-foreground">Entity Name</Label>
                      <p className="font-medium">{selectedLog.entity_name}</p>
                    </div>
                  )}
                  {selectedLog.entity_id && (
                    <div>
                      <Label className="text-muted-foreground">Entity ID</Label>
                      <p className="font-mono text-xs">{selectedLog.entity_id}</p>
                    </div>
                  )}
                </div>

                {selectedLog.changes && (
                  <div className="space-y-2">
                    <Label>Changes</Label>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(selectedLog.changes, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedLog.metadata && (
                  <div className="space-y-2">
                    <Label>Metadata</Label>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedLog.reverted && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      This action has been reverted
                    </p>
                    {selectedLog.reverted_at && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                        Reverted at: {formatDate(selectedLog.reverted_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Revert Dialog */}
      <RevertLogDialog
        log={selectedLog}
        open={isRevertDialogOpen}
        onOpenChange={setIsRevertDialogOpen}
        onSuccess={handleRevertSuccess}
      />

      {/* Delete Dialog */}
      <DeleteLogDialog
        log={deletingLog}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}

