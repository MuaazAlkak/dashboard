/**
 * Audit Logger Service
 * Logs all actions and changes in the dashboard to the audit_logs table
 */

import { supabase } from './supabase';

export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'login' 
  | 'logout'
  | 'export'
  | 'import'
  | 'revert';

export type EntityType = 
  | 'product' 
  | 'order' 
  | 'user' 
  | 'event' 
  | 'settings'
  | 'auth';

export interface AuditLogData {
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  changes?: {
    before?: unknown;
    after?: unknown;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Log an action to the audit log
 */
export async function logAction(data: AuditLogData): Promise<void> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Cannot log action: No authenticated user');
      return;
    }

    // Prepare log entry
    const logEntry = {
      user_id: user.id,
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId || null,
      entity_name: data.entityName || null,
      changes: data.changes || null,
      metadata: data.metadata || null,
    };

    // Insert into audit_logs table
    const { error } = await supabase
      .from('audit_logs')
      .insert([logEntry]);

    if (error) {
      console.error('Failed to log action:', error);
      // Don't throw - logging failures shouldn't break the app
    }
  } catch (error) {
    console.error('Error in audit logger:', error);
    // Silently fail - logging shouldn't break functionality
  }
}

/**
 * Log product actions
 */
export const productLogger = {
  async created(productId: string, productName: string, productData: unknown) {
    await logAction({
      action: 'create',
      entityType: 'product',
      entityId: productId,
      entityName: productName,
      changes: { after: productData },
    });
  },

  async updated(productId: string, productName: string, before: unknown, after: unknown) {
    await logAction({
      action: 'update',
      entityType: 'product',
      entityId: productId,
      entityName: productName,
      changes: { before, after },
    });
  },

  async deleted(productId: string, productName: string, productData: unknown) {
    await logAction({
      action: 'delete',
      entityType: 'product',
      entityId: productId,
      entityName: productName,
      changes: { before: productData },
    });
  },
};

/**
 * Log order actions
 */
export const orderLogger = {
  async statusUpdated(orderId: string, oldStatus: string, newStatus: string) {
    await logAction({
      action: 'update',
      entityType: 'order',
      entityId: orderId,
      entityName: `Order #${orderId.substring(0, 8)}`,
      changes: {
        before: { status: oldStatus },
        after: { status: newStatus },
      },
    });
  },
};

/**
 * Log user actions
 */
export const userLogger = {
  async created(userId: string, userEmail: string, userData: unknown) {
    await logAction({
      action: 'create',
      entityType: 'user',
      entityId: userId,
      entityName: userEmail,
      changes: { after: userData },
    });
  },

  async roleUpdated(userId: string, userEmail: string, oldRole: string, newRole: string) {
    await logAction({
      action: 'update',
      entityType: 'user',
      entityId: userId,
      entityName: userEmail,
      changes: {
        before: { role: oldRole },
        after: { role: newRole },
      },
    });
  },

  async deleted(userId: string, userEmail: string, userData: unknown) {
    await logAction({
      action: 'delete',
      entityType: 'user',
      entityId: userId,
      entityName: userEmail,
      changes: { before: userData },
    });
  },

  async login(userId: string, userEmail: string) {
    await logAction({
      action: 'login',
      entityType: 'auth',
      entityId: userId,
      entityName: userEmail,
    });
  },

  async logout(userId: string, userEmail: string) {
    await logAction({
      action: 'logout',
      entityType: 'auth',
      entityId: userId,
      entityName: userEmail,
    });
  },
};

/**
 * Log event actions
 */
export const eventLogger = {
  async created(eventId: string, eventName: string, eventData: unknown) {
    await logAction({
      action: 'create',
      entityType: 'event',
      entityId: eventId,
      entityName: eventName,
      changes: { after: eventData },
    });
  },

  async updated(eventId: string, eventName: string, before: unknown, after: unknown) {
    await logAction({
      action: 'update',
      entityType: 'event',
      entityId: eventId,
      entityName: eventName,
      changes: { before, after },
    });
  },

  async deleted(eventId: string, eventName: string, eventData: unknown) {
    await logAction({
      action: 'delete',
      entityType: 'event',
      entityId: eventId,
      entityName: eventName,
      changes: { before: eventData },
    });
  },
};

