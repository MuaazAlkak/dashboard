import { useState, useEffect } from 'react';
import { Plus, Search, Filter, X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductFormDialog } from '@/components/products/ProductFormDialog';
import { ExportButton } from '@/components/products/ExportButton';
import { usePermissions } from '@/hooks/usePermissions';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKeyboardShortcuts, getShortcutDisplay } from '@/hooks/useKeyboardShortcuts';
import { productService, Product } from '@/lib/supabase';
import { toast } from 'sonner';

export default function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const permissions = usePermissions();
  const { t } = useLanguage();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const shortcuts = [
    {
      key: 'n',
      ctrlKey: true,
      action: () => {
        if (permissions.canCreateProducts) {
          setIsAddDialogOpen(true);
          toast.info('Opening new product dialog');
        }
      },
      description: 'Create new product',
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        document.getElementById('product-search')?.focus();
        toast.info('Search focused');
      },
      description: 'Focus search',
    },
    {
      key: '/',
      ctrlKey: true,
      action: () => setShowShortcuts(true),
      description: 'Show keyboard shortcuts',
    },
    {
      key: 'Escape',
      action: () => {
        setSearchQuery('');
        setCategoryFilter('all');
        toast.info('Filters cleared');
      },
      description: 'Clear filters',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t('products.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
            {t('products.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Keyboard className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Keyboard Shortcuts</DialogTitle>
                <DialogDescription>
                  Use these keyboard shortcuts to navigate faster
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge variant="secondary" className="font-mono">
                      {getShortcutDisplay(shortcut)}
                    </Badge>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <ExportButton products={products} />

          {permissions.canCreateProducts && (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-gradient-primary shadow-glow hover:opacity-90 w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('products.addProduct')}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="product-search"
            placeholder={t('products.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t('products.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.category')}</SelectItem>
            <SelectItem value="Clothing">Clothing</SelectItem>
            <SelectItem value="Accessories">Accessories</SelectItem>
            <SelectItem value="Home Decor">Home Decor</SelectItem>
            <SelectItem value="Traditional">Traditional</SelectItem>
            <SelectItem value="Crafts">Crafts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <ProductTable
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
      />

      {/* Add Product Dialog */}
      <ProductFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
