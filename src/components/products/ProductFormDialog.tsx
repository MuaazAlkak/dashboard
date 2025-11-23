import { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2, Languages, Percent } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Product, productService, supabase } from '@/lib/supabase';
import { productLogger } from '@/lib/auditLogger';
import { translateProductFields } from '@/lib/translator';

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
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState<'en' | 'ar' | 'sv'>('en');
  const [discountActive, setDiscountActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form state when dialog opens/closes or product changes
  useEffect(() => {
    if (open) {
      setUploadedImages(product?.images || []);
      setDiscountActive(product?.discount_active || false);
    } else {
      setUploadedImages([]);
      setDiscountActive(false);
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to upload images: ${errorMessage}`);
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

  const handleAutoTranslate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsTranslating(true);

    try {
      const form = e.currentTarget.closest('form');
      if (!form) return;

      const formData = new FormData(form);
      const titleSource = formData.get(`title-${sourceLanguage}`) as string || formData.get('title') as string;
      const descSource = formData.get(`description-${sourceLanguage}`) as string || formData.get('description') as string;

      if (!titleSource || titleSource.trim() === '') {
        toast.error(`Please enter a title in ${sourceLanguage.toUpperCase()} first`);
        setIsTranslating(false);
        return;
      }

      toast.info('Translating... This may take a few seconds');

      const translations = await translateProductFields(
        {
          title: titleSource,
          description: descSource,
        },
        sourceLanguage
      );

      // Update form fields with translations
      const titleEn = form.querySelector('[name="title"]') as HTMLInputElement;
      const titleAr = form.querySelector('[name="title-ar"]') as HTMLInputElement;
      const titleSv = form.querySelector('[name="title-sv"]') as HTMLInputElement;
      const descEn = form.querySelector('[name="description"]') as HTMLTextAreaElement;
      const descAr = form.querySelector('[name="description-ar"]') as HTMLTextAreaElement;
      const descSv = form.querySelector('[name="description-sv"]') as HTMLTextAreaElement;

      if (titleEn) titleEn.value = translations.title.en;
      if (titleAr) titleAr.value = translations.title.ar;
      if (titleSv) titleSv.value = translations.title.sv;
      if (descEn) descEn.value = translations.description.en;
      if (descAr) descAr.value = translations.description.ar;
      if (descSv) descSv.value = translations.description.sv;

      toast.success('Translation completed!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Translation failed: ${errorMessage}`);
      // Form fields remain unchanged on error - user can retry or edit manually
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      // Validate and normalize slug
      const rawSlug = (formData.get('slug') as string).trim().toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      if (!rawSlug || rawSlug.length < 3) {
        throw new Error('Slug must be at least 3 characters');
      }

      // Check for duplicate slugs if creating new product
      if (!isEditing) {
        const { data: existingBySlug } = await supabase
          .from('products')
          .select('id')
          .eq('slug', rawSlug)
          .maybeSingle();
        
        if (existingBySlug) {
          throw new Error('A product with this slug already exists');
        }
      }

      // Validate price
      const price = parseFloat(formData.get('price') as string);
      if (isNaN(price) || price < 0) {
        throw new Error('Invalid price. Please enter a valid number.');
      }

      // Validate stock
      const stock = parseInt(formData.get('stock') as string);
      if (isNaN(stock) || stock < 0) {
        throw new Error('Invalid stock. Please enter a valid number.');
      }

      const discountPercentage = parseInt(formData.get('discount_percentage') as string) || 0;
      
      const productData = {
        slug: rawSlug,
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
        price,
        currency: 'SEK', // Always SEK
        stock,
        category: formData.get('category') as string,
        tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
        images: uploadedImages,
        featured: false,
        discount_percentage: discountPercentage,
        discount_active: discountActive,
      };

      if (isEditing && product) {
        // Get current product data for logging
        const currentProduct = await productService.getProduct(product.id);
        await productService.updateProduct(product.id, productData);
        
        // Log the update
        const productName = productData.title.en || productData.title.sv || productData.title.ar || 'Product';
        await productLogger.updated(product.id, productName, currentProduct, productData);
        
        toast.success('Product updated successfully');
      } else {
        const newProduct = await productService.addProduct(productData);
        
        // Log the creation
        const productName = productData.title.en || productData.title.sv || productData.title.ar || 'Product';
        await productLogger.created(newProduct.id, productName, productData);
        
        toast.success('Product created successfully');
      }

      onSuccess?.();
      onOpenChange(false);
      setUploadedImages([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to save product: ${errorMessage}`);
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
          {/* Auto-Translation Section */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Auto-Translate</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Fill in the title and description in one language, then click translate to automatically fill the other languages.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Label className="text-sm">Translate from:</Label>
              <Select value={sourceLanguage} onValueChange={(value: 'en' | 'ar' | 'sv') => setSourceLanguage(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="sv">Swedish</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={handleAutoTranslate}
                disabled={isTranslating || isLoading}
                variant="secondary"
                className="gap-2"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <Languages className="h-4 w-4" />
                    Translate
                  </>
                )}
              </Button>
            </div>
          </div>

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
              <Label htmlFor="price">Price (SEK)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                placeholder="e.g., 29.99 for 29.99 SEK"
                defaultValue={product?.price}
                required
                min="0"
                step="0.01"
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
                  <SelectItem value="Flags">Flags</SelectItem>
                  <SelectItem value="Scarves">Scarves</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
                  <SelectItem value="Traditional">Traditional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Currency - Hidden, always SEK */}
            <input type="hidden" name="currency" value="SEK" />
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

          {/* Discount Section */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Product Discount</h3>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Discount Percentage */}
              <div className="space-y-2">
                <Label htmlFor="discount_percentage">Discount Percentage</Label>
                <div className="relative">
                  <Input
                    id="discount_percentage"
                    name="discount_percentage"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    defaultValue={product?.discount_percentage || 0}
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Set a discount percentage (0-100%)
                </p>
              </div>

              {/* Discount Active Toggle */}
              <div className="space-y-2">
                <Label htmlFor="discount_active">Activate Discount</Label>
                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    id="discount_active"
                    checked={discountActive}
                    onCheckedChange={setDiscountActive}
                  />
                  <span className="text-sm text-muted-foreground">
                    {discountActive ? 'Discount is active' : 'Discount is inactive'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Toggle to activate or deactivate the discount
                </p>
              </div>
            </div>

            {/* Discount Preview */}
            {discountActive && product && (
              <div className="rounded-md bg-primary/10 p-3 border border-primary/20">
                <p className="text-sm font-medium">Discount Preview:</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-primary">
                    {new Intl.NumberFormat('sv-SE', {
                      style: 'currency',
                      currency: 'SEK',
                    }).format((product.price * (100 - (parseInt(document.getElementById('discount_percentage')?.['value'] || '0') || 0))) / 100)}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {new Intl.NumberFormat('sv-SE', {
                      style: 'currency',
                      currency: 'SEK',
                    }).format(product.price)}
                  </span>
                </div>
              </div>
            )}
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
