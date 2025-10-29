import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Tag, 
  FolderTree, 
  Percent, 
  ChevronDown,
  X,
  Check,
  MoreHorizontal
} from 'lucide-react';
import { Product, productService } from '@/lib/supabase';
import { toast } from 'sonner';

interface BulkActionsBarProps {
  selectedProducts: Product[];
  onClearSelection: () => void;
  onActionComplete: () => void;
}

export function BulkActionsBar({
  selectedProducts,
  onClearSelection,
  onActionComplete,
}: BulkActionsBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountActive, setDiscountActive] = useState(true);
  const [newCategory, setNewCategory] = useState('');

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await Promise.all(
        selectedProducts.map((product) => productService.deleteProduct(product.id))
      );
      toast.success(`${selectedProducts.length} products deleted successfully`);
      onActionComplete();
      onClearSelection();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to delete products: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setShowDeleteDialog(false);
    }
  };

  const handleBulkDiscount = async () => {
    setIsProcessing(true);
    try {
      await Promise.all(
        selectedProducts.map((product) =>
          productService.updateProduct(product.id, {
            discount_percentage: discountPercentage,
            discount_active: discountActive,
          })
        )
      );
      toast.success(`Discount applied to ${selectedProducts.length} products`);
      onActionComplete();
      onClearSelection();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to apply discount: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setShowDiscountDialog(false);
    }
  };

  const handleBulkCategoryChange = async () => {
    if (!newCategory) {
      toast.error('Please select a category');
      return;
    }

    setIsProcessing(true);
    try {
      await Promise.all(
        selectedProducts.map((product) =>
          productService.updateProduct(product.id, { category: newCategory })
        )
      );
      toast.success(`Category updated for ${selectedProducts.length} products`);
      onActionComplete();
      onClearSelection();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update category: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setShowCategoryDialog(false);
    }
  };

  if (selectedProducts.length === 0) return null;

  return (
    <div>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
        <div className="bg-primary text-primary-foreground shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 border-2 border-primary-foreground/20">
          <Badge variant="secondary" className="text-base font-bold px-3 py-1">
            {selectedProducts.length}
          </Badge>
          <span className="font-medium">Selected</span>

          <div className="h-6 w-px bg-primary-foreground/30" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 font-medium"
              >
                Bulk Actions
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuItem onClick={() => setShowDiscountDialog(true)}>
                <Percent className="mr-2 h-4 w-4" />
                Apply Discount
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCategoryDialog(true)}>
                <FolderTree className="mr-2 h-4 w-4" />
                Change Category
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            className="hover:bg-primary-foreground/20 rounded-full h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedProducts.length} Products?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected products from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discount Dialog */}
      <AlertDialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Discount to {selectedProducts.length} Products</AlertDialogTitle>
            <AlertDialogDescription>
              Set the discount percentage and activate it for all selected products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount Percentage (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(parseInt(e.target.value) || 0)}
                placeholder="Enter discount percentage"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={discountActive}
                onChange={(e) => setDiscountActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="active" className="cursor-pointer">
                Activate discount immediately
              </Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDiscount} disabled={isProcessing}>
              {isProcessing ? 'Applying...' : 'Apply Discount'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Change Dialog */}
      <AlertDialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Category for {selectedProducts.length} Products</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new category to apply to all selected products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="category">New Category</Label>
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger id="category" className="mt-2">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
                <SelectItem value="Home Decor">Home Decor</SelectItem>
                <SelectItem value="Traditional">Traditional</SelectItem>
                <SelectItem value="Crafts">Crafts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkCategoryChange} disabled={isProcessing}>
              {isProcessing ? 'Updating...' : 'Update Category'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
