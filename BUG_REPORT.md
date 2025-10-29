# Bug Report & Code Review - Crest Backend

**Date:** 2024  
**Reviewer:** AI Code Analysis  
**Project:** crest-backend (E-Commerce Admin Dashboard)

## Executive Summary

This report documents **15 critical bugs** and **8 potential issues** found during a comprehensive code review of the crest-backend project. The issues range from schema mismatches to security vulnerabilities and missing error handling.

---

## 🔴 Critical Bugs

### 1. **Schema Mismatch: Order Table Missing Required Fields**

**Severity:** CRITICAL  
**Location:** `schema.sql` vs `src/lib/supabase.ts`

**Issue:**
The `Order` interface in `src/lib/supabase.ts` expects fields that don't exist in the database schema:

```typescript
// Interface expects:
interface Order {
  total_amount: number;        // ❌ Schema has: total
  currency: string;            // ❌ NOT IN SCHEMA
  shipping: any;               // ❌ NOT IN SCHEMA
  updated_at: string;          // ❌ NOT IN SCHEMA
  stripe_payment_intent_id?: string; // ❌ NOT IN SCHEMA
}
```

**Schema only has:**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL,
  total INTEGER NOT NULL,      -- ❌ Should be total_amount
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- ❌ Missing: currency, shipping, updated_at, stripe_payment_intent_id
);
```

**Impact:**
- Orders will fail to load correctly
- Frontend will crash when accessing `order.total_amount`, `order.currency`, `order.shipping`
- Export functionality will fail (line 91 in Orders.tsx)

**Fix Required:**
```sql
ALTER TABLE orders 
  ADD COLUMN total_amount INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN shipping JSONB,
  ADD COLUMN stripe_payment_intent_id TEXT,
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Migrate existing data
UPDATE orders SET total_amount = total WHERE total_amount = 0;

-- Drop old column (after migration)
ALTER TABLE orders DROP COLUMN total;
```

---

### 2. **Missing `order_items` Table**

**Severity:** CRITICAL  
**Location:** `schema.sql` (missing table definition)

**Issue:**
The code references `order_items` table extensively (used in 30+ places), but the table doesn't exist in `schema.sql`.

**Evidence:**
- `src/lib/supabase.ts:228` - `order_items` join query
- `src/pages/Orders.tsx:90` - accessing `order.order_items`
- `src/components/orders/OrderDetailsDialog.tsx:284` - mapping `order_items`

**Impact:**
- `orderService.getOrders()` will fail with relation doesn't exist error
- Order details cannot be displayed
- Order management is completely broken

**Fix Required:**
```sql
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
```

---

### 3. **Missing `events` Table**

**Severity:** CRITICAL  
**Location:** `schema.sql` (missing table definition)

**Issue:**
The code uses `eventService` which queries `events` table, but the table doesn't exist in `schema.sql`.

**Evidence:**
- `src/lib/supabase.ts:338-412` - Event CRUD operations
- `src/components/events/*` - Multiple event components
- `src/pages/Events.tsx` - Events page

**Impact:**
- Events feature is completely broken
- All event operations will fail

**Fix Required:**
```sql
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title JSONB NOT NULL DEFAULT '{"en": ""}',
  description JSONB DEFAULT '{"en": ""}',
  link TEXT,
  background_color TEXT NOT NULL DEFAULT '#8B5CF6',
  text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT false,
  discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### 4. **Security Vulnerability: RLS Disabled on admin_users**

**Severity:** HIGH  
**Location:** `schema.sql:72`

**Issue:**
Row Level Security is explicitly disabled on `admin_users` table:

```sql
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
```

**Impact:**
- Any authenticated user can read/modify admin user data
- Role escalation attacks possible
- Unauthorized access to admin credentials

**Fix Required:**
```sql
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own admin record" 
  ON admin_users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Only super_admins can modify admin_users" 
  ON admin_users FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );
```

---

### 5. **Broken `create_admin_user` Function**

**Severity:** HIGH  
**Location:** `schema.sql:101-115`

**Issue:**
The `create_admin_user` function always returns an error and doesn't actually create users:

```sql
CREATE OR REPLACE FUNCTION create_admin_user(...)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'success', false,
    'error', 'Use supabase.auth.signUp() instead of this function'
  );
END;
```

**Impact:**
- `AddUserDialog` component will always fail
- User creation feature is broken
- Confusing error messages for users

**Fix Required:**
Either:
1. Remove the function and update `src/lib/supabase.ts` to use `supabase.auth.signUp()` directly
2. OR implement the function properly (not recommended - auth should be client-side)

**Recommended Fix:**
Update `src/lib/supabase.ts:300-310`:
```typescript
async createUser(email: string, password: string, role: string) {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
  });
  
  if (authError) throw authError;
  if (!authData.user) throw new Error('User creation failed');

  // Add to admin_users table
  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      id: authData.user.id,
      email: authData.user.email!,
      role: role,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

**Note:** This requires `service_role` key, not `anon_key`. Consider using a Supabase Edge Function instead.

---

### 6. **No Validation for Empty Supabase Configuration**

**Severity:** MEDIUM  
**Location:** `src/lib/supabase.ts:3-6`

**Issue:**
Supabase client is created with empty strings if env vars are missing:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Impact:**
- App will fail silently or with cryptic errors
- No clear error message for missing configuration
- Difficult to debug

**Fix Required:**
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

### 7. **Insecure Auto-Admin Assignment on Login**

**Severity:** HIGH  
**Location:** `src/pages/Login.tsx:40-53`

**Issue:**
Any user who logs in automatically gets `super_admin` role if not in `admin_users` table:

```typescript
if (adminError && adminError.code === 'PGRST116') {
  // User not found in admin_users, add them
  const { error: insertError } = await supabase
    .from('admin_users')
    .insert({
      id: data.user.id,
      email: data.user.email!,
      role: 'super_admin'  // ❌ SECURITY RISK
    });
}
```

**Impact:**
- Any user can gain super_admin access by logging in
- Extreme security vulnerability
- No permission checks

**Fix Required:**
Remove auto-creation logic. Only allow pre-approved admins to access the dashboard:

```typescript
if (adminError && adminError.code === 'PGRST116') {
  toast.error('You do not have admin access. Please contact an administrator.');
  await supabase.auth.signOut();
  return;
}
```

---

### 8. **Missing Error Handling in Image Deletion**

**Severity:** MEDIUM  
**Location:** `src/lib/supabase.ts:208-218`

**Issue:**
`deleteImage` extracts filename incorrectly from URL:

```typescript
async deleteImage(imageUrl: string) {
  const urlParts = imageUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];  // ❌ May include query params
  
  const { error } = await supabase.storage
    .from('product-images')
    .remove([fileName]);
}
```

**Impact:**
- Image deletion may fail silently
- URLs with query parameters will fail to delete
- Storage cleanup won't work properly

**Fix Required:**
```typescript
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
  } catch (error: any) {
    // Handle both URL parsing errors and storage errors
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}
```

---

### 9. **SQL Injection Risk in Search Query**

**Severity:** HIGH  
**Location:** `src/lib/supabase.ts:107-116`

**Issue:**
Search query uses string concatenation without proper sanitization:

```typescript
query = query.or(
  `title->>en.ilike.%${searchTerm}%,` +  // ❌ Direct string interpolation
  `title->>ar.ilike.%${searchTerm}%,` +
  // ...
);
```

**Impact:**
- Potential SQL injection if Supabase PostgREST filters are bypassed
- Special characters in search may cause errors

**Fix Required:**
PostgREST should handle this, but validate input:

```typescript
if (filters?.search && filters.search.trim()) {
  const searchTerm = filters.search.trim();
  
  // Validate search term (prevent potential issues)
  if (searchTerm.length > 100) {
    throw new Error('Search term too long');
  }
  
  // Escape special characters properly
  const escapedSearch = searchTerm.replace(/[%_]/g, '\\$&');
  
  query = query.or(
    `title->>en.ilike.%${escapedSearch}%,` +
    // ...
  );
}
```

---

### 10. **Missing Null Checks in Product Form**

**Severity:** MEDIUM  
**Location:** `src/components/products/ProductFormDialog.tsx:146-169`

**Issue:**
Form parsing doesn't validate required fields:

```typescript
price: parseInt(formData.get('price') as string),  // ❌ NaN if empty
stock: parseInt(formData.get('stock') as string),  // ❌ NaN if empty
```

**Impact:**
- `NaN` values will be saved to database
- Database constraints may or may not catch this
- Products with invalid prices/stocks

**Fix Required:**
```typescript
const price = parseInt(formData.get('price') as string);
const stock = parseInt(formData.get('stock') as string);

if (isNaN(price) || price < 0) {
  throw new Error('Invalid price');
}
if (isNaN(stock) || stock < 0) {
  throw new Error('Invalid stock');
}

const productData = {
  // ...
  price,
  stock,
};
```

---

### 11. **Race Condition in AuthContext**

**Severity:** MEDIUM  
**Location:** `src/contexts/AuthContext.tsx:42-64`

**Issue:**
`fetchUserRole` doesn't handle race conditions - if user logs out before fetch completes:

```typescript
const fetchUserRole = async (userId: string) => {
  try {
    const role = await userService.getCurrentUserRole();  // ❌ No userId passed
    setUserRole(role);
  } catch (error) {
    console.error('Error fetching user role:', error);
    setUserRole(null);
  }
};
```

**Additional Issue:** Function accepts `userId` parameter but doesn't use it.

**Impact:**
- Stale state updates
- Wrong role displayed briefly
- Race conditions on logout

**Fix Required:**
```typescript
const fetchUserRole = async (userId: string) => {
  try {
    // Verify user is still logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return; // User logged out
    }
    
    const role = await userService.getCurrentUserRole();
    
    // Double-check user is still logged in
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.id === userId) {
      setUserRole(role);
    }
  } catch (error) {
    console.error('Error fetching user role:', error);
    setUserRole(null);
  }
};
```

---

### 12. **Missing Slug Validation**

**Severity:** MEDIUM  
**Location:** `src/components/products/ProductFormDialog.tsx:149`

**Issue:**
Slug is taken directly from form without validation:

```typescript
slug: formData.get('slug') as string,  // ❌ No validation
```

**Impact:**
- Invalid slugs (spaces, special chars) will cause URL issues
- Duplicate slugs not checked before save
- SEO problems

**Fix Required:**
```typescript
const slug = (formData.get('slug') as string).trim().toLowerCase()
  .replace(/[^a-z0-9-]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

if (!slug || slug.length < 3) {
  throw new Error('Slug must be at least 3 characters');
}

// Check for duplicates if creating new product
if (!isEditing) {
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .single();
  
  if (existing) {
    throw new Error('A product with this slug already exists');
  }
}
```

---

### 13. **No Error Handling for Translation API**

**Severity:** LOW  
**Location:** `src/components/products/ProductFormDialog.tsx:88-137`

**Issue:**
Translation errors are shown but form state isn't reset:

```typescript
} catch (error: any) {
  toast.error(`Translation failed: ${error.message}`);
} finally {
  setIsTranslating(false);  // ❌ Form may be in inconsistent state
}
```

**Impact:**
- User may see partial translations
- Form fields may have incorrect values
- No way to retry failed translations

**Fix Required:**
Save original values before translation and restore on error.

---

### 14. **Missing Type Safety in Orders Export**

**Severity:** LOW  
**Location:** `src/pages/Orders.tsx:81-107`

**Issue:**
Export assumes `order.total_amount` exists (but schema has `total`):

```typescript
order.total_amount / 100,  // ❌ Will be undefined
```

**Impact:**
- Export will show `NaN` or crash
- CSV export broken

**Fix Required:**
```typescript
(order.total_amount || order.total || 0) / 100,
```

---

### 15. **Console.log in Production Code**

**Severity:** LOW  
**Location:** `src/lib/supabase.ts:161`

**Issue:**
Debug logging left in production code:

```typescript
console.log('Update response:', { data, error, status, statusText });
```

**Impact:**
- Exposes internal data in browser console
- Performance impact (minimal)
- Unprofessional

**Fix Required:**
Remove or use proper logging service:
```typescript
if (import.meta.env.DEV) {
  console.log('Update response:', { data, error, status, statusText });
}
```

---

## ⚠️ Potential Issues & Improvements

### 16. **No Input Sanitization for Rich Text**

**Location:** Product descriptions, event descriptions

**Issue:** JSONB fields may contain user-generated content without sanitization.

**Recommendation:** Add HTML sanitization library if descriptions are rendered as HTML.

---

### 17. **Missing Pagination**

**Location:** `productService.getProducts()`, `orderService.getOrders()`

**Issue:** All records loaded at once - could be slow with large datasets.

**Recommendation:** Implement pagination with `.range()` method.

---

### 18. **No Rate Limiting**

**Location:** All API calls

**Issue:** No protection against rapid-fire requests.

**Recommendation:** Implement request throttling or use Supabase rate limiting.

---

### 19. **Missing Transaction Support**

**Location:** Product updates with image changes

**Issue:** Multiple operations not atomic (e.g., update product + delete old images).

**Recommendation:** Use Supabase transactions or edge functions for complex operations.

---

### 20. **No Caching Strategy**

**Location:** Product/order fetching

**Issue:** Data fetched on every render/refresh.

**Recommendation:** Implement React Query caching properly (already using it but may need config).

---

### 21. **Missing Unit Tests**

**Location:** Entire codebase

**Issue:** No test files found.

**Recommendation:** Add unit tests for critical functions.

---

### 22. **TypeScript Strict Mode Disabled**

**Location:** `tsconfig.json`

**Issue:**
```json
{
  "noImplicitAny": false,
  "strictNullChecks": false,
  "noUnusedLocals": false,
  "noUnusedParameters": false
}
```

**Recommendation:** Enable strict mode gradually.

---

### 23. **Missing Error Boundaries**

**Location:** React components

**Issue:** No error boundaries to catch component errors.

**Recommendation:** Add React error boundaries.

---

## 📊 Summary Statistics

- **Total Issues Found:** 23
- **Critical:** 3 (Schema mismatches)
- **High:** 4 (Security, broken features)
- **Medium:** 5 (Data validation, error handling)
- **Low:** 3 (Code quality)
- **Improvements:** 8 (Performance, best practices)

---

## 🎯 Priority Fix List

### Immediate (Before Production)

1. ✅ Fix schema mismatches (issues #1, #2, #3)
2. ✅ Fix security vulnerabilities (#4, #7)
3. ✅ Fix broken user creation (#5)
4. ✅ Add Supabase configuration validation (#6)

### High Priority (Next Sprint)

5. ✅ Fix image deletion (#8)
6. ✅ Add input validation (#10, #12)
7. ✅ Fix auth race conditions (#11)

### Medium Priority (Backlog)

8. ✅ Add error boundaries
9. ✅ Remove console.logs
10. ✅ Add pagination
11. ✅ Add unit tests

---

## ✅ Testing Recommendations

1. **Database Migration Testing:**
   - Test schema updates on staging database
   - Verify data migration for `orders.total` → `orders.total_amount`
   - Test with empty database and populated database

2. **Security Testing:**
   - Test RLS policies with different user roles
   - Test unauthorized access attempts
   - Test SQL injection attempts

3. **Integration Testing:**
   - Test complete order flow
   - Test product CRUD operations
   - Test user management flow
   - Test event creation/management

4. **Error Handling Testing:**
   - Test with invalid Supabase credentials
   - Test network failures
   - Test invalid form submissions
   - Test concurrent operations

---

## 📝 Notes

- Most issues are fixable with minimal code changes
- Schema issues require database migrations
- Security issues should be fixed immediately
- Consider adding comprehensive error logging service

---

**Report Generated:** 2024  
**Next Review Recommended:** After fixes are implemented

