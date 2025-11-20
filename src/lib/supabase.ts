import { createClient } from '@supabase/supabase-js';
import { getApiUrl } from './utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types matching the schema
export interface Product {
  id: string;
  slug: string;
  title: {
    en: string;
    ar: string;
    sv: string;
  };
  description: {
    en: string;
    ar: string;
    sv: string;
  };
  price: number;
  currency: string;
  stock: number;
  category: string;
  tags: string[];
  images: string[];
  featured?: boolean;
  discount_percentage?: number;
  discount_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingInfo {
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
}

export interface Order {
  id: string;
  user_id?: string;
  total_amount: number;
  currency: string;
  status: string;
  shipping: ShippingInfo | null;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemWithProduct[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface OrderItemWithProduct extends OrderItem {
  products?: Product;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';
  created_at: string;
  last_sign_in_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: {
    en: string;
    ar: string;
    sv: string;
  };
  description?: {
    en: string;
    ar: string;
    sv: string;
  };
  link?: string;
  background_color: string;
  text_color: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  discount_percentage?: number;
  created_at: string;
  updated_at: string;
}

// Product CRUD operations
export const productService = {
  // Get all products with optional filters
  async getProducts(filters?: { search?: string; category?: string }) {
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      
      // Validate search term (prevent potential issues)
      if (searchTerm.length > 100) {
        throw new Error('Search term too long');
      }
      
      // Escape special characters properly (PostgREST should handle this, but validate input)
      const escapedSearch = searchTerm.replace(/[%_]/g, '\\$&');
      
      // Search in title (all languages), slug, description (all languages), and category
      // Use ->> to extract text from JSONB fields for case-insensitive search
      query = query.or(
        `title->>en.ilike.%${escapedSearch}%,` +
        `title->>ar.ilike.%${escapedSearch}%,` +
        `title->>sv.ilike.%${escapedSearch}%,` +
        `slug.ilike.%${escapedSearch}%,` +
        `description->>en.ilike.%${escapedSearch}%,` +
        `description->>ar.ilike.%${escapedSearch}%,` +
        `description->>sv.ilike.%${escapedSearch}%,` +
        `category.ilike.%${escapedSearch}%`
      );
    }

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Product[];
  },

  // Get single product by ID
  async getProduct(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Product;
  },

  // Add new product
  async addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  // Update product
  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select();

    if (import.meta.env.DEV) {
      console.log('Update response:', { data, error });
    }

    if (error) {
      if (import.meta.env.DEV) {
        console.error('Update error details:', error);
      }
      throw new Error(error.message || 'Failed to update product');
    }
    
    if (!data || data.length === 0) {
      throw new Error('No product was updated. Check if the product exists and you have permission to update it.');
    }
    
    return data[0] as Product;
  },

  // Delete product
  async deleteProduct(id: string) {
    // Call backend API to delete product (bypasses RLS)
    const API_URL = getApiUrl();
    
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete product: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting product via API:', error);
      
      // Fallback: Try to delete from products table directly
      // This is a fallback if the backend API is not available
      console.log('Falling back to direct table deletion...');
      const { data, error: fallbackError } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .select();

      if (fallbackError) {
        throw new Error(fallbackError.message || `Failed to delete product: ${fallbackError.code || 'Unknown error'}`);
      }

      // Check if product was actually deleted
      if (!data || data.length === 0) {
        throw new Error('Product not found or could not be deleted. You may not have permission to delete this product.');
      }

      return data[0];
    }
  },

  // Upload product image to storage
  async uploadImage(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // Delete image from storage
  async deleteImage(imageUrl: string) {
    try {
      // Extract path from full URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      // Remove query parameters if any
      const cleanFileName = fileName.split('?')[0];
      
      const { error } = await supabase.storage
        .from('product-images')
        .remove([cleanFileName]);

      if (error) throw error;
    } catch (error) {
      // Handle both URL parsing errors and storage errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete image: ${errorMessage}`);
    }
  },
};

// Order operations
export const orderService = {
  async getOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getOrder(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateOrderStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Failed to update order status');
    }
    return data[0];
  },
};

// User management operations
export const userService = {
  // Get all admin users with their roles
  async getUsers(): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as AdminUser[];
  },

  // Get current user's role
  async getCurrentUserRole(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) return null;
    return data?.role || null;
  },

  // Create new admin user
  async createUser(email: string, password: string, role: string) {
    // Call backend API to create user (uses admin API, doesn't sign in)
    const API_URL = getApiUrl();
    
    // Warn in production if API URL is not set
    if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
      console.error('VITE_API_URL is not set in production. User creation will fail.');
    }
    
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to create user: ${response.statusText}`);
      }

      const result = await response.json();
      return result.user;
    } catch (error) {
      console.error('Error creating user via API:', error);
      throw error;
    }
  },

  // Update user role
  async updateUserRole(userId: string, role: string) {
    // Call backend API to update user role
    const API_URL = getApiUrl();
    
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update user role: ${response.statusText}`);
      }

      const result = await response.json();
      return result.user;
    } catch (error) {
      console.error('Error updating user role via API:', error);
      
      // Fallback: Try to update admin_users table directly
      // This is a fallback if the backend API is not available
      console.log('Falling back to direct table update...');
      const { data, error: fallbackError } = await supabase
        .from('admin_users')
        .update({ role })
        .eq('id', userId)
        .select();

      if (fallbackError) {
        throw fallbackError;
      }
      
      return data;
    }
  },

  // Delete user
  async deleteUser(userId: string) {
    // Call backend API to delete user from Auth and Database
    const API_URL = getApiUrl();
    
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `Failed to delete user: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting user via API:', error);
      
      // Re-throw the error instead of falling back
      // The backend API is required for proper user deletion (removes from auth.users)
      // Falling back to admin_users deletion would leave orphaned auth users
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete user. Please ensure the backend server is running.');
    }
  },
};

// Event operations
export const eventService = {
  // Get all events
  async getEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data as Event[];
  },

  // Get single event by ID
  async getEvent(id: string) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Event;
  },

  // Create new event
  async createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Failed to create event');
    }
    return data[0] as Event;
  },

  // Update event
  async updateEvent(id: string, updates: Partial<Omit<Event, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Failed to update event');
    }
    return data[0] as Event;
  },

  // Delete event
  async deleteEvent(id: string) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Toggle event active status
  async toggleEventStatus(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('events')
      .update({ is_active: isActive })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Failed to toggle event status');
    }
    return data[0] as Event;
  },
};

// Settings operations
export const settingsService = {
  // Get shipping fee enabled setting
  async getShippingFeeEnabled(): Promise<boolean> {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'shipping_fee_enabled')
      .single();

    if (error) {
      // If settings table doesn't exist or setting not found, default to true
      console.warn('Failed to fetch shipping fee setting, defaulting to enabled:', error);
      return true;
    }

    // Handle both boolean and string values
    const value = data?.value;
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value === 'true';
    }
    return true; // Default to enabled
  },

  // Update shipping fee enabled setting
  async setShippingFeeEnabled(enabled: boolean): Promise<void> {
    const { data, error } = await supabase
      .from('settings')
      .upsert(
        {
          key: 'shipping_fee_enabled',
          value: enabled,
        },
        {
          onConflict: 'key',
        }
      )
      .select();

    if (error) throw error;
  },
};

// Audit Log operations
export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  changes: unknown;
  metadata: unknown;
  reverted: boolean;
  reverted_at: string | null;
  reverted_by: string | null;
  deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
}

export const auditLogService = {
  // Get all audit logs
  async getLogs(filters?: {
    action?: string;
    entityType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    reverted?: boolean;
    deleted?: boolean;
    includeDeleted?: boolean;
  }) {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    // By default, exclude deleted logs unless explicitly requested
    if (filters?.includeDeleted !== true) {
      query = query.eq('deleted', false);
    }

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters?.reverted !== undefined) {
      query = query.eq('reverted', filters.reverted);
    }

    if (filters?.deleted !== undefined) {
      query = query.eq('deleted', filters.deleted);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as AuditLog[];
  },

  // Get single audit log by ID
  async getLog(id: string) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AuditLog;
  },

  // Mark log as reverted
  async markAsReverted(logId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('audit_logs')
      .update({
        reverted: true,
        reverted_at: new Date().toISOString(),
        reverted_by: user?.id || null,
      })
      .eq('id', logId)
      .select()
      .single();

    if (error) throw error;
    return data as AuditLog;
  },

  // Soft delete audit log (mark as deleted instead of actually deleting)
  async deleteLog(logId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('audit_logs')
      .update({
        deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user?.id || null,
      })
      .eq('id', logId)
      .select()
      .single();

    if (error) throw error;
    return data as AuditLog;
  },
};