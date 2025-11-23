import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { heroImageService } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeroImage {
  name: string;
  url: string;
  created_at: string;
}

export function HeroImageSection() {
  const { t } = useLanguage();
  const [images, setImages] = useState<HeroImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all hero images on component mount
  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const fetchedImages = await heroImageService.listImages();
      setImages(fetchedImages);
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) =>
        heroImageService.uploadImage(file)
      );
      await Promise.all(uploadPromises);
      toast.success(`Successfully uploaded ${files.length} image(s)`);
      await loadImages(); // Reload images after upload
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (fileName: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    setIsDeleting(fileName);
    try {
      await heroImageService.deleteImage(fileName);
      toast.success('Image deleted successfully');
      await loadImages(); // Reload images after deletion
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Card className="border-border bg-gradient-card shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Hero Image Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Upload Hero Images
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary"
          >
            <div className="text-center">
              {isUploading ? (
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              ) : (
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {isUploading ? 'Uploading...' : 'Click to upload images'}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to 10MB (Multiple files supported)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Images Grid */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Uploaded Images ({images.length})
          </label>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No images uploaded yet. Upload your first hero image above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {images.map((image) => (
                <div
                  key={image.name}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleDeleteImage(image.name)}
                    disabled={isDeleting === image.name}
                  >
                    {isDeleting === image.name ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

