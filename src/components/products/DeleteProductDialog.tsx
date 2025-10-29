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

      toast.success(t('products.deleteSuccess'));
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`${t('products.deleteError')}: ${errorMessage}`);
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
