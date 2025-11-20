import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Product, productService } from '@/lib/supabase';
import { productLogger } from '@/lib/auditLogger';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeleteProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
  onSuccess,
}: DeleteProductDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useLanguage();

  const handleDelete = async () => {
    if (!product) return;

    setIsDeleting(true);

    try {
      // Log the deletion before deleting
      const productName = product.title?.en || product.title?.sv || product.title?.ar || 'Product';
      await productLogger.deleted(product.id, productName, product);
      
      // Delete product from database
      await productService.deleteProduct(product.id);
      
      // Optionally delete images from storage
      // Note: This is optional, you might want to keep images for historical purposes
      // for (const imageUrl of product.images) {
      //   try {
      //     await productService.deleteImage(imageUrl);
      //   } catch (error) {
      //     console.error('Failed to delete image:', error);
      //   }
      // }

      toast.success(t('products.deleteSuccess') || 'Product deleted successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Error deleting product:', error);
      let errorMessage = 'Unknown error';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (error?.code) {
        errorMessage = `Error code: ${error.code}`;
      }
      
      toast.error(`${t('products.deleteError') || 'Failed to delete product'}: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!product) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('products.deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('products.deleteConfirmMessage')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('products.deleting')}
              </>
            ) : t('products.delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
