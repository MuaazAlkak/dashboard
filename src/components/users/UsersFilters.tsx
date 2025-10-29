import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UsersFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  activityFilter: string;
  onActivityFilterChange: (value: string) => void;
  onClearFilters: () => void;
  onExport: () => void;
  activeFiltersCount: number;
}

export function UsersFilters({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  activityFilter,
  onActivityFilterChange,
  onClearFilters,
  onExport,
  activeFiltersCount,
}: UsersFiltersProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters & Search</h3>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <>
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} active
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-8 px-2"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="h-8"
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="user-search" className="text-xs">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="user-search"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Role Filter */}
        <div className="space-y-2">
          <Label htmlFor="role-filter" className="text-xs">Role</Label>
          <Select value={roleFilter} onValueChange={onRoleFilterChange}>
            <SelectTrigger id="role-filter">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity Filter */}
        <div className="space-y-2">
          <Label htmlFor="activity-filter" className="text-xs">Activity</Label>
          <Select value={activityFilter} onValueChange={onActivityFilterChange}>
            <SelectTrigger id="activity-filter">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="active_7d">Active (7 days)</SelectItem>
              <SelectItem value="active_30d">Active (30 days)</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="never_signed_in">Never Signed In</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

