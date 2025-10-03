import { useState } from 'react';
import { Edit, Trash2, MoreVertical, ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ProductFormDialog } from './ProductFormDialog';
import { DeleteProductDialog } from './DeleteProductDialog';
import { Product } from '@/lib/supabase';

interface ProductTableProps {
  searchQuery: string;
  categoryFilter: string;
}

// Mock data - replace with actual Supabase query
const mockProducts: Product[] = [
  {
    id: '1',
    slug: 'wireless-headphones-pro',
    title: { en: 'Wireless Headphones Pro' },
    description: { en: 'Premium wireless headphones' },
    price: 29999,
    currency: 'USD',
    stock: 150,
    category: 'Electronics',
    tags: ['audio', 'wireless'],
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    slug: 'smart-watch-fitness',
    title: { en: 'Smart Watch Fitness Tracker' },
    description: { en: 'Advanced smartwatch' },
    price: 19999,
    currency: 'USD',
    stock: 200,
    category: 'Wearables',
    tags: ['fitness', 'smartwatch'],
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'],
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    id: '3',
    slug: 'laptop-backpack-leather',
    title: { en: 'Premium Leather Laptop Backpack' },
    description: { en: 'Handcrafted leather backpack' },
    price: 14999,
    currency: 'USD',
    stock: 75,
    category: 'Accessories',
    tags: ['bags', 'leather'],
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300'],
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
  },
];

export function ProductTable({ searchQuery, categoryFilter }: ProductTableProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Filter products based on search and category
  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = product.title.en
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price / 100);
  };

  const getStockBadgeVariant = (stock: number) => {
    if (stock === 0) return 'destructive';
    if (stock < 50) return 'outline';
    return 'default';
  };

  return (
    <>
      <div className="rounded-lg border border-border bg-card shadow-elegant">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow
                key={product.id}
                className="group transition-all hover:bg-muted/50"
              >
                <TableCell>
                  <img
                    src={product.images[0]}
                    alt={product.title.en}
                    className="h-12 w-12 rounded-lg object-cover shadow-sm"
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">
                      {product.title.en}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.slug}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{product.category}</Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {formatPrice(product.price, product.currency)}
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {product.stock} units
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStockBadgeVariant(product.stock)}>
                    {product.stock === 0
                      ? 'Out of Stock'
                      : product.stock < 50
                      ? 'Low Stock'
                      : 'In Stock'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setEditingProduct(product)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeletingProduct(product)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredProducts.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <ProductFormDialog
        product={editingProduct}
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
      />

      {/* Delete Dialog */}
      <DeleteProductDialog
        product={deletingProduct}
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
      />
    </>
  );
}
