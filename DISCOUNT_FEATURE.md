# Product Discount Feature Documentation

## Overview
This document describes the product discount feature that has been added to the admin dashboard. This feature allows administrators to set individual discounts for each product directly from the Products tab in the dashboard.

## Features

### 1. Individual Product Discounts
- Each product can have its own discount percentage (0-100%)
- Discounts can be activated or deactivated with a toggle switch
- Discount is independent of event-based discounts
- Product discounts take priority over event discounts in the storefront

### 2. Admin Dashboard Controls
Administrators can manage product discounts through the product edit dialog:

- **Discount Percentage**: Set a percentage discount from 0% to 100%
- **Activate Discount Toggle**: Enable or disable the discount
- **Visual Preview**: See the discounted price when editing a product (for existing products)

### 3. Product Table Display
The products table shows:
- Original price with strikethrough (when discount is active)
- Discounted price in primary color
- Discount badge showing the percentage off

## Database Schema Changes

### New Fields Added to `products` Table

```sql
discount_percentage INTEGER DEFAULT 0 
  CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
discount_active BOOLEAN DEFAULT false
```

### Field Descriptions

- **discount_percentage**: The percentage discount for the product (0-100)
  - Type: Integer
  - Default: 0
  - Constraints: Must be between 0 and 100
  
- **discount_active**: Whether the discount is currently active
  - Type: Boolean
  - Default: false
  - Controls whether the discount is applied in the storefront

## Migration Instructions

### For New Installations
If you're setting up a fresh database, simply run the updated `schema.sql` file which includes the new discount fields.

### For Existing Databases
Run the migration script located at `migrations/add_product_discount.sql`:

```sql
-- Run this in your Supabase SQL Editor
-- File: migrations/add_product_discount.sql

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0 
CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_active BOOLEAN DEFAULT false;
```

## Usage Guide

### Setting a Product Discount

1. Navigate to the **Products** tab in the admin dashboard
2. Click the **More** menu (three dots) on any product
3. Select **Edit** from the dropdown
4. Scroll to the **Product Discount** section
5. Enter a discount percentage (0-100)
6. Toggle the **Activate Discount** switch to enable the discount
7. Click **Update** to save changes

### How Discounts Work

#### Priority System
When both product discount and event discount are available:
1. **Product discount** is applied first (if active)
2. **Event discount** is used as fallback (if no active product discount)

#### Activation Requirements
For a product discount to be applied:
- `discount_percentage` must be greater than 0
- `discount_active` must be set to `true`

#### Price Calculation
```
Discounted Price = Original Price × (100 - discount_percentage) / 100
```

Example:
- Original Price: 10000 (100.00 SEK)
- Discount: 20%
- Discounted Price: 8000 (80.00 SEK)

### Viewing Discounts

#### Admin Dashboard
- Products with active discounts show:
  - Discounted price in primary color (bold)
  - Original price with strikethrough
  - Red badge showing discount percentage

#### Storefront
- Product cards display:
  - Discount badge in top-left corner
  - Discounted price (in red)
  - Original price with strikethrough
  
- Product detail pages show:
  - Large discount badge
  - Discounted price
  - Original price crossed out

## Files Modified

### Backend (crest-backend)
1. **schema.sql** - Added discount fields to products table
2. **src/lib/supabase.ts** - Updated Product interface
3. **src/components/products/ProductFormDialog.tsx** - Added discount UI controls
4. **src/components/products/ProductTable.tsx** - Added discount display
5. **migrations/add_product_discount.sql** - New migration script

### Frontend (syrian-essence-shop)
1. **src/types/product.ts** - Updated Product interface
2. **src/components/ProductCard.tsx** - Added discount_active check
3. **src/pages/ProductDetail.tsx** - Added discount_active check

## Technical Details

### TypeScript Interface
```typescript
export interface Product {
  // ... other fields
  discount_percentage?: number;  // 0-100
  discount_active?: boolean;     // true/false
}
```

### React State Management
The ProductFormDialog component uses:
- `discountActive` state to manage the toggle
- Form data to capture discount percentage
- Both values are saved to Supabase when the form is submitted

### UI Components Used
- `Switch` - For activating/deactivating discount
- `Input[type=number]` - For discount percentage entry
- `Badge` - For displaying discount information
- `Percent` icon - Visual indicator for discount section

## Testing Checklist

- [ ] Run migration script on existing database
- [ ] Create a new product with discount
- [ ] Edit existing product to add discount
- [ ] Toggle discount on/off
- [ ] Verify discount displays correctly in product table
- [ ] Verify discount displays correctly on storefront product cards
- [ ] Verify discount displays correctly on product detail page
- [ ] Test with various discount percentages (0%, 50%, 100%)
- [ ] Verify product discount overrides event discount
- [ ] Test with different currencies

## Future Enhancements

Potential improvements for future versions:
- Time-based discount activation/deactivation
- Bulk discount application to multiple products
- Discount scheduling (start/end dates)
- Category-wide discount application
- Discount analytics and reporting
- Minimum quantity requirements for discounts

## Support

For issues or questions regarding this feature, please check:
1. Database migration was successful
2. All files were updated correctly
3. No linter errors in modified files
4. Supabase is connected and accessible

## Version History

- **v1.0** (Initial Release)
  - Added discount_percentage and discount_active fields
  - Created discount UI in admin dashboard
  - Updated storefront to display discounts
  - Created migration script for existing databases

