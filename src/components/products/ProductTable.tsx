import { useState, useEffect } from 'react';
import { Edit, Trash2, MoreVertical, ExternalLink, Loader2, Copy } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ProductFormDialog } from './ProductFormDialog';
import { DeleteProductDialog } from './DeleteProductDialog';
import { ProductViewDialog } from './ProductViewDialog';
import { BulkActionsBar } from './BulkActionsBar';
import { Product, productService } from '@/lib/supabase';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductTableProps {
  searchQuery: string;
  categoryFilter: string;
}

export function ProductTable({ searchQuery, categoryFilter }: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const permissions = usePermissions();
  const { t } = useLanguage();

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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load products: ${errorMessage}`);
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, categoryFilter]);

  const handleProductUpdated = () => {
    fetchProducts();
    setSelectedProducts([]);
  };

  const formatPrice = (price: number, currency: string = 'SEK') => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
    }).format(price);
  };

  const calculateDiscountedPrice = (price: number, discountPercentage: number) => {
    return price * (100 - discountPercentage) / 100;
  };

  const getStockBadgeVariant = (stock: number) => {
    if (stock === 0) return 'destructive';
    if (stock < 50) return 'outline';
    return 'default';
  };

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts((prev) =>
      prev.find((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products);
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      const duplicatedProduct = {
        ...product,
        slug: `${product.slug}-copy-${Date.now()}`,
        title: {
          en: `${product.title.en} (Copy)`,
          ar: `${product.title.ar} (نسخة)`,
          sv: `${product.title.sv} (Kopia)`,
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (duplicatedProduct as any).id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (duplicatedProduct as any).created_at;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (duplicatedProduct as any).updated_at;
      
      await productService.addProduct(duplicatedProduct);
      toast.success('Product duplicated successfully');
      fetchProducts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to duplicate product: ${errorMessage}`);
    }
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
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[60px] sm:w-[80px]">{t('products.image')}</TableHead>
              <TableHead className="min-w-[150px]">{t('products.product')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('products.category')}</TableHead>
              <TableHead className="min-w-[100px]">{t('products.price')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('products.stock')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('products.status')}</TableHead>
              {(permissions.canEditProducts || permissions.canDeleteProducts) && (
                <TableHead className="w-[60px] sm:w-[80px]">{t('products.actions')}</TableHead>
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
                  <Checkbox
                    checked={selectedProducts.some((p) => p.id === product.id)}
                    onCheckedChange={() => toggleProductSelection(product)}
                  />
                </TableCell>
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
                  {product.discount_active && product.discount_percentage && product.discount_percentage > 0 ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-bold">
                          {formatPrice(calculateDiscountedPrice(product.price, product.discount_percentage), product.currency)}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          -{product.discount_percentage}%
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(product.price, product.currency)}
                      </span>
                    </div>
                  ) : (
                    formatPrice(product.price, product.currency)
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-muted-foreground text-sm">
                    {product.stock} units
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge variant={getStockBadgeVariant(product.stock)}>
                    {product.stock === 0
                      ? t('products.outOfStock')
                      : product.stock < 50
                      ? t('products.lowStock')
                      : t('products.inStock')}
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
                        <DropdownMenuItem onClick={() => setViewingProduct(product)}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {t('orders.view')}
                        </DropdownMenuItem>
                        {permissions.canEditProducts && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setEditingProduct(product)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              {t('products.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicateProduct(product)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                          </>
                        )}
                        {permissions.canDeleteProducts && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingProduct(product)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('products.delete')}
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
            <p className="text-muted-foreground">{t('products.noProducts')}</p>
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

      {/* View Dialog */}
      <ProductViewDialog
        product={viewingProduct}
        open={!!viewingProduct}
        onOpenChange={(open) => !open && setViewingProduct(null)}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedProducts={selectedProducts}
        onClearSelection={() => setSelectedProducts([])}
        onActionComplete={handleProductUpdated}
      />
    </>
  );
}
