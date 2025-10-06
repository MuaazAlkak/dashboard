import { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Product, productService } from '@/lib/supabase';

interface ProductFormDialogProps {
  product?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ProductFormDialog({
  product,
  open,
  onOpenChange,
  onSuccess,
}: ProductFormDialogProps) {
  const isEditing = !!product;
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form state when dialog opens/closes or product changes
  useEffect(() => {
    if (open) {
      setUploadedImages(product?.images || []);
    } else {
      setUploadedImages([]);
    }
  }, [open, product]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    const newImageUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await productService.uploadImage(file);
        newImageUrls.push(url);
      }
      setUploadedImages([...uploadedImages, ...newImageUrls]);
      toast.success(`${newImageUrls.length} image(s) uploaded successfully`);
    } catch (error: any) {
      toast.error(`Failed to upload images: ${error.message}`);
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const productData = {
        slug: formData.get('slug') as string,
        title: {
          en: formData.get('title') as string,
          ar: formData.get('title-ar') as string || '',
          sv: formData.get('title-sv') as string || '',
        },
        description: {
          en: formData.get('description') as string,
          ar: formData.get('description-ar') as string || '',
          sv: formData.get('description-sv') as string || '',
        },
        price: parseInt(formData.get('price') as string),
        currency: formData.get('currency') as string,
        stock: parseInt(formData.get('stock') as string),
        category: formData.get('category') as string,
        tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
        images: uploadedImages,
        featured: false,
      };

      if (isEditing && product) {
        await productService.updateProduct(product.id, productData);
        toast.success('Product updated successfully');
      } else {
        await productService.addProduct(productData);
        toast.success('Product created successfully');
      }

      onSuccess?.();
      onOpenChange(false);
      setUploadedImages([]);
    } catch (error: any) {
      toast.error(`Failed to save product: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your product information'
              : 'Fill in the details to create a new product'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pb-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Product Name (English) */}
            <div className="space-y-2">
              <Label htmlFor="title">Product Name (English)</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Wireless Headphones"
                defaultValue={product?.title.en}
                required
              />
            </div>

            {/* Product Name (Arabic) */}
            <div className="space-y-2">
              <Label htmlFor="title-ar">Product Name (Arabic)</Label>
              <Input
                id="title-ar"
                name="title-ar"
                placeholder="اسم المنتج بالعربية"
                defaultValue={product?.title.ar}
                dir="rtl"
              />
            </div>

            {/* Product Name (Swedish) */}
            <div className="space-y-2">
              <Label htmlFor="title-sv">Product Name (Swedish)</Label>
              <Input
                id="title-sv"
                name="title-sv"
                placeholder="Produktnamn på svenska"
                defaultValue={product?.title.sv}
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="e.g., wireless-headphones"
                defaultValue={product?.slug}
                required
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price (in smallest unit)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                placeholder="e.g., 29900 for 299.00 SEK"
                defaultValue={product?.price}
                required
              />
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                placeholder="e.g., 100"
                defaultValue={product?.stock}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" defaultValue={product?.category || ''}>
                <SelectTrigger id="category">
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

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select name="currency" defaultValue={product?.currency || 'SEK'}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEK">SEK</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description (English) */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (English)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Product description..."
              rows={2}
              defaultValue={product?.description.en}
            />
          </div>

          {/* Description (Arabic) */}
          <div className="space-y-2">
            <Label htmlFor="description-ar">Description (Arabic)</Label>
            <Textarea
              id="description-ar"
              name="description-ar"
              placeholder="وصف المنتج بالعربية"
              rows={2}
              defaultValue={product?.description.ar}
              dir="rtl"
            />
          </div>

          {/* Description (Swedish) */}
          <div className="space-y-2">
            <Label htmlFor="description-sv">Description (Swedish)</Label>
            <Textarea
              id="description-sv"
              name="description-sv"
              placeholder="Produktbeskrivning på svenska"
              rows={2}
              defaultValue={product?.description.sv}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              name="tags"
              placeholder="e.g., handmade, traditional, premium"
              defaultValue={product?.tags.join(', ')}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Product Images</Label>
            
            {/* Uploaded Images Preview */}
            {uploadedImages.length > 0 && (
              <div className="mb-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {uploadedImages.map((imageUrl, index) => (
                  <div key={index} className="relative">
                    <img
                      src={imageUrl}
                      alt={`Product ${index + 1}`}
                      className="h-20 w-full rounded-lg object-cover sm:h-24"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border p-4 transition-colors hover:border-primary sm:p-6"
            >
              <div className="text-center">
                {isUploadingImages ? (
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary sm:h-8 sm:w-8" />
                ) : (
                  <Upload className="mx-auto h-6 w-6 text-muted-foreground sm:h-8 sm:w-8" />
                )}
                <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                  {isUploadingImages ? 'Uploading...' : 'Click to upload images'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG up to 10MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={isUploadingImages}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploadingImages}
              className="bg-gradient-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
