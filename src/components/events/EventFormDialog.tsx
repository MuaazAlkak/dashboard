import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Event, eventService } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface EventFormDialogProps {
  event?: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  prefilledDate?: Date | null;
}

export function EventFormDialog({
  event,
  open,
  onOpenChange,
  onSuccess,
  prefilledDate,
}: EventFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title_en: '',
    title_ar: '',
    title_sv: '',
    description_en: '',
    description_ar: '',
    description_sv: '',
    link: '',
    background_color: '#FF5733',
    text_color: '#FFFFFF',
    start_date: '',
    end_date: '',
    discount_percentage: 0,
    is_active: true,
  });

  useEffect(() => {
    if (prefilledDate && !event) {
      // Prefill dates when adding event from calendar
      const startDate = new Date(prefilledDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(prefilledDate);
      endDate.setHours(23, 59, 59, 999);
      
      setFormData(prev => ({
        ...prev,
        start_date: startDate.toISOString().slice(0, 16),
        end_date: endDate.toISOString().slice(0, 16),
      }));
    } else if (event) {
      setFormData({
        title_en: event.title.en,
        title_ar: event.title.ar,
        title_sv: event.title.sv,
        description_en: event.description?.en || '',
        description_ar: event.description?.ar || '',
        description_sv: event.description?.sv || '',
        link: event.link || '',
        background_color: event.background_color,
        text_color: event.text_color,
        start_date: event.start_date.split('T')[0],
        end_date: event.end_date.split('T')[0],
        discount_percentage: event.discount_percentage || 0,
        is_active: event.is_active,
      });
    } else if (!event && !prefilledDate) {
      // Reset to defaults when adding new event without prefilled date
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFormData({
        title_en: '',
        title_ar: '',
        title_sv: '',
        description_en: '',
        description_ar: '',
        description_sv: '',
        link: '',
        background_color: '#FF5733',
        text_color: '#FFFFFF',
        start_date: today,
        end_date: nextWeek,
        discount_percentage: 0,
        is_active: true,
      });
    }
  }, [event, prefilledDate, open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const eventData = {
        title: {
          en: formData.title_en,
          ar: formData.title_ar,
          sv: formData.title_sv,
        },
        description: {
          en: formData.description_en,
          ar: formData.description_ar,
          sv: formData.description_sv,
        },
        link: formData.link || undefined,
        background_color: formData.background_color,
        text_color: formData.text_color,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        discount_percentage: formData.discount_percentage > 0 ? formData.discount_percentage : undefined,
        is_active: formData.is_active,
      };

      if (event) {
        await eventService.updateEvent(event.id, eventData);
        toast.success('Event updated successfully');
      } else {
        await eventService.createEvent(eventData);
        toast.success('Event created successfully');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to ${event ? 'update' : 'create'} event: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto event-form-dialog">
        <DialogHeader>
          <DialogTitle>{event ? t('dialog.editEvent') : t('dialog.addEvent')}</DialogTitle>
          <DialogDescription>
            {t('dialog.eventDetails')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title (English) */}
          <div className="space-y-2">
            <Label htmlFor="title_en">{t('dialog.titleEnglish')} *</Label>
            <Input
              id="title_en"
              type="text"
              value={formData.title_en}
              onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
              placeholder="Summer Sale"
              required
              disabled={isLoading}
            />
          </div>

          {/* Title (Arabic) */}
          <div className="space-y-2">
            <Label htmlFor="title_ar">{t('dialog.titleArabic')} *</Label>
            <Input
              id="title_ar"
              type="text"
              value={formData.title_ar}
              onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
              placeholder="تخفيضات الصيف"
              required
              disabled={isLoading}
              dir="rtl"
            />
          </div>

          {/* Title (Swedish) */}
          <div className="space-y-2">
            <Label htmlFor="title_sv">{t('dialog.titleSwedish')} *</Label>
            <Input
              id="title_sv"
              type="text"
              value={formData.title_sv}
              onChange={(e) => setFormData({ ...formData, title_sv: e.target.value })}
              placeholder="Sommarrea"
              required
              disabled={isLoading}
            />
          </div>

          {/* Description (English) */}
          <div className="space-y-2">
            <Label htmlFor="description_en">{t('dialog.descriptionEnglish')}</Label>
            <Input
              id="description_en"
              type="text"
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              placeholder="Up to 50% off"
              disabled={isLoading}
            />
          </div>

          {/* Description (Arabic) */}
          <div className="space-y-2">
            <Label htmlFor="description_ar">{t('dialog.descriptionArabic')}</Label>
            <Input
              id="description_ar"
              type="text"
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              placeholder="خصم يصل إلى 50٪"
              disabled={isLoading}
              dir="rtl"
            />
          </div>

          {/* Description (Swedish) */}
          <div className="space-y-2">
            <Label htmlFor="description_sv">{t('dialog.descriptionSwedish')}</Label>
            <Input
              id="description_sv"
              type="text"
              value={formData.description_sv}
              onChange={(e) => setFormData({ ...formData, description_sv: e.target.value })}
              placeholder="Upp till 50% rabatt"
              disabled={isLoading}
            />
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label htmlFor="link">{t('dialog.link')}</Label>
            <Input
              id="link"
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://example.com/sale"
              disabled={isLoading}
            />
          </div>

          {/* Discount Percentage */}
          <div className="space-y-2">
            <Label htmlFor="discount_percentage">{t('dialog.discountPercentage')}</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="discount_percentage"
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                placeholder="0"
                disabled={isLoading}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter a percentage (0-100) for discount events
            </p>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label htmlFor="background_color">{t('dialog.backgroundColor')}</Label>
            <div className="flex gap-2">
              <Input
                id="background_color"
                type="color"
                value={formData.background_color}
                onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                className="w-20 h-10"
                disabled={isLoading}
              />
              <Input
                type="text"
                value={formData.background_color}
                onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                placeholder="#FF5733"
                className="flex-1"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Text Color */}
          <div className="space-y-2">
            <Label htmlFor="text_color">{t('dialog.textColor')}</Label>
            <div className="flex gap-2">
              <Input
                id="text_color"
                type="color"
                value={formData.text_color}
                onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                className="w-20 h-10"
                disabled={isLoading}
              />
              <Input
                type="text"
                value={formData.text_color}
                onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                placeholder="#FFFFFF"
                className="flex-1"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Color Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="p-4 rounded-lg border border-border text-center"
              style={{
                backgroundColor: formData.background_color,
                color: formData.text_color,
              }}
            >
              <p className="font-bold text-lg">
                {formData.title_en || 'Event Title'}
              </p>
              <p className="text-sm mt-1">
                {formData.description_en || 'Event description'}
              </p>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="start_date">{t('dialog.startDate')}</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="end_date">{t('dialog.endDate')}</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
              disabled={isLoading}
              min={formData.start_date}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between space-y-2">
            <div className="space-y-1">
              <Label htmlFor="is_active">{t('dialog.active')}</Label>
              <p className="text-xs text-muted-foreground">
                Event will only show if active and within date range
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              disabled={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('dialog.saving')}
                </>
              ) : (
                t('dialog.saveEvent')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

