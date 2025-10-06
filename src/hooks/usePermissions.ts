import { useAuth } from '@/contexts/AuthContext';

export type Role = 'super_admin' | 'admin' | 'editor' | 'viewer';

export interface Permissions {
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canViewProducts: boolean;
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canViewOrders: boolean;
  canEditOrders: boolean;
  canViewEvents: boolean;
  canCreateEvents: boolean;
  canEditEvents: boolean;
  canDeleteEvents: boolean;
  canViewSettings: boolean;
  canEditSettings: boolean;
}

const rolePermissions: Record<Role, Permissions> = {
  super_admin: {
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewProducts: true,
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canViewOrders: true,
    canEditOrders: true,
    canViewEvents: true,
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: true,
    canViewSettings: true,
    canEditSettings: true,
  },
  admin: {
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: false,
    canViewProducts: true,
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canViewOrders: true,
    canEditOrders: true,
    canViewEvents: true,
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: true,
    canViewSettings: true,
    canEditSettings: false,
  },
  editor: {
    canViewUsers: true,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewProducts: true,
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: false,
    canViewOrders: true,
    canEditOrders: false,
    canViewEvents: true,
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: false,
    canViewSettings: false,
    canEditSettings: false,
  },
  viewer: {
    canViewUsers: true,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewProducts: true,
    canCreateProducts: false,
    canEditProducts: false,
    canDeleteProducts: false,
    canViewOrders: true,
    canEditOrders: false,
    canViewEvents: true,
    canCreateEvents: false,
    canEditEvents: false,
    canDeleteEvents: false,
    canViewSettings: false,
    canEditSettings: false,
  },
};

export function usePermissions(): Permissions {
  const { userRole } = useAuth();
  
  if (!userRole || !(userRole in rolePermissions)) {
    // Return minimal permissions for unauthenticated users
    return {
      canViewUsers: false,
      canCreateUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canViewProducts: false,
      canCreateProducts: false,
      canEditProducts: false,
      canDeleteProducts: false,
      canViewOrders: false,
      canEditOrders: false,
      canViewEvents: false,
      canCreateEvents: false,
      canEditEvents: false,
      canDeleteEvents: false,
      canViewSettings: false,
      canEditSettings: false,
    };
  }

  return rolePermissions[userRole as Role];
}

export function useRole(): Role | null {
  const { userRole } = useAuth();
  return userRole as Role | null;
}
