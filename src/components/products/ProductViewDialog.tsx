import { useEffect, useState } from 'react';
import { Loader2, Package, Tag, DollarSign, ShoppingCart, Calendar, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Product, productService } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductViewDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductViewDialog({
  product,
  open,
  onOpenChange,
}: ProductViewDialogProps) {
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (product && open) {
      fetchProductDetails();
    } else {
      setProductDetails(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, open]);

  const fetchProductDetails = async () => {
    if (!product) return;
    
    setIsLoading(true);
    try {
      // If we already have the product, use it, otherwise fetch it
      setProductDetails(product);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'SEK') => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDiscountedPrice = (price: number, discountPercentage: number) => {
    return price * (100 - discountPercentage) / 100;
  };

  const getStockBadgeVariant = (stock: number) => {
    if (stock === 0) return 'destructive';
    if (stock < 50) return 'outline';
    return 'default';
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return t('products.outOfStock');
    if (stock < 50) return t('products.lowStock');
    return t('products.inStock');
  };

  if (!product) return null;

  const lang = language as 'en' | 'ar' | 'sv';
  const displayTitle = productDetails?.title?.[lang] || productDetails?.title?.en || product.title.en;
  const displayDescription = productDetails?.description?.[lang] || productDetails?.description?.en || product.description.en;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{displayTitle}</DialogTitle>
          <DialogDescription>
            {t('products.viewDetails')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : productDetails ? (
          <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
            <div className="space-y-6">
              {/* Product Images */}
              {productDetails.images && productDetails.images.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    <h3 className="font-semibold">{t('products.images')}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {productDetails.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
                      >
                        <img
                          src={image}
                          alt={`${displayTitle} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {productDetails.images && productDetails.images.length > 0 && <Separator />}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{t('products.product')} Information</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('products.slug')}: </span>
                        <span className="font-mono">{productDetails.slug}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('products.category')}: </span>
                        <Badge variant="outline">{productDetails.category}</Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('products.stock')}: </span>
                        <Badge variant={getStockBadgeVariant(productDetails.stock)}>
                          {productDetails.stock} {t('products.units')}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('products.status')}: </span>
                        <Badge variant={getStockBadgeVariant(productDetails.stock)}>
                          {getStockStatus(productDetails.stock)}
                        </Badge>
                      </div>
                      {productDetails.featured && (
                        <div>
                          <Badge variant="default" className="bg-yellow-500">
                            {t('products.featured')}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>{t('products.pricing')}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {productDetails.discount_active && productDetails.discount_percentage && productDetails.discount_percentage > 0 ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{t('products.originalPrice')}: </span>
                            <span className="line-through text-muted-foreground">
                              {formatPrice(productDetails.price, productDetails.currency)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{t('products.discountedPrice')}: </span>
                            <span className="font-bold text-lg text-primary">
                              {formatPrice(
                                calculateDiscountedPrice(productDetails.price, productDetails.discount_percentage),
                                productDetails.currency
                              )}
                            </span>
                            <Badge variant="destructive" className="text-xs">
                              -{productDetails.discount_percentage}%
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('products.currency')}: </span>
                            <span className="font-medium">{productDetails.currency}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-muted-foreground">{t('products.price')}: </span>
                            <span className="font-bold text-lg">
                              {formatPrice(productDetails.price, productDetails.currency)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('products.currency')}: </span>
                            <span className="font-medium">{productDetails.currency}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-2">
                <h3 className="font-semibold">{t('products.description')}</h3>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                  {displayDescription || t('products.noDescription')}
                </div>
              </div>

              {/* Tags */}
              {productDetails.tags && productDetails.tags.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold">{t('products.tags')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {productDetails.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{t('products.createdAt')}</span>
                  </div>
                  <p>{formatDate(productDetails.created_at)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{t('products.updatedAt')}</span>
                  </div>
                  <p>{formatDate(productDetails.updated_at)}</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">{t('products.productNotFound')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
