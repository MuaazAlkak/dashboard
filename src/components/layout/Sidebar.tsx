import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users,
  Calendar,
  Settings,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'canViewDashboard' },
  { name: 'Products', href: '/products', icon: Package, permission: 'canViewProducts' },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, permission: 'canViewOrders' },
  { name: 'Events', href: '/events', icon: Calendar, permission: 'canViewEvents' },
  { name: 'Users', href: '/users', icon: Users, permission: 'canViewUsers' },
  { name: 'Settings', href: '/settings', icon: Settings, permission: 'canViewSettings' },
];

export function Sidebar({ collapsed, onToggle, mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const permissions = usePermissions();

  // Filter navigation based on permissions
  const filteredNavigation = navigation.filter(item => {
    if (item.permission === 'canViewDashboard') return true; // Dashboard is always visible
    return permissions[item.permission as keyof typeof permissions];
  });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-all duration-300',
        'lg:translate-x-0',
        collapsed ? 'w-16' : 'w-64',
        // Mobile menu
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <h1 className="bg-gradient-primary bg-clip-text text-xl font-bold text-transparent">
              Admin
            </h1>
          )}
          <button
            onClick={onToggle}
            className={cn(
              'rounded-lg p-2 hover:bg-sidebar-accent transition-colors hidden lg:block',
              collapsed && 'mx-auto'
            )}
          >
            <ChevronLeft
              className={cn(
                'h-5 w-5 text-sidebar-foreground transition-transform',
                collapsed && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive
                    ? 'bg-gradient-primary text-white shadow-glow'
                    : 'text-sidebar-foreground',
                  collapsed && 'lg:justify-center'
                )
              }
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          {!collapsed && (
            <div className="text-xs text-muted-foreground">
              <p>E-Commerce Admin</p>
              <p className="mt-1">v1.0.0</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
