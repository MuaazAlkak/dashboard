import { useState, useEffect } from 'react';
import { Edit, Trash2, MoreVertical, ExternalLink, Loader2 } from 'lucide-react';
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
import { Product, productService } from '@/lib/supabase';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

interface ProductTableProps {
  searchQuery: string;
  categoryFilter: string;
}

export function ProductTable({ searchQuery, categoryFilter }: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const permissions = usePermissions();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch products from Supabase
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await productService.getProducts({
        search: debouncedSearch,
        category: categoryFilter,
      });
      setProducts(data);
    } catch (error: any) {
      toast.error(`Failed to load products: ${error.message}`);
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, categoryFilter]);

  const handleProductUpdated = () => {
    fetchProducts();
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-card py-12 shadow-elegant">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card shadow-elegant overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[60px] sm:w-[80px]">Image</TableHead>
              <TableHead className="min-w-[150px]">Product</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="min-w-[100px]">Price</TableHead>
              <TableHead className="hidden sm:table-cell">Stock</TableHead>
              <TableHead className="hidden lg:table-cell">Status</TableHead>
              {(permissions.canEditProducts || permissions.canDeleteProducts) && (
                <TableHead className="w-[60px] sm:w-[80px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow
                key={product.id}
                className="group transition-all hover:bg-muted/50"
              >
                <TableCell>
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title.en}
                      className="h-10 w-10 rounded-lg object-cover shadow-sm sm:h-12 sm:w-12"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted sm:h-12 sm:w-12" />
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground text-sm sm:text-base">
                      {product.title.en}
                    </p>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {product.slug}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1 md:hidden">
                      <Badge variant="outline" className="text-xs">{product.category}</Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline">{product.category}</Badge>
                </TableCell>
                <TableCell className="font-medium text-sm sm:text-base">
                  {formatPrice(product.price, product.currency)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-muted-foreground text-sm">
                    {product.stock} units
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge variant={getStockBadgeVariant(product.stock)}>
                    {product.stock === 0
                      ? 'Out of Stock'
                      : product.stock < 50
                      ? 'Low Stock'
                      : 'In Stock'}
                  </Badge>
                </TableCell>
                {(permissions.canEditProducts || permissions.canDeleteProducts) && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {permissions.canEditProducts && (
                          <DropdownMenuItem
                            onClick={() => setEditingProduct(product)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {permissions.canDeleteProducts && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingProduct(product)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {products.length === 0 && (
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
        onSuccess={handleProductUpdated}
      />

      {/* Delete Dialog */}
      <DeleteProductDialog
        product={deletingProduct}
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        onSuccess={handleProductUpdated}
      />
    </>
  );
}
