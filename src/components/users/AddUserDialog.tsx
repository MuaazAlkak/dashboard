import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { userService } from '@/lib/supabase';
import { userLogger } from '@/lib/auditLogger';
import { useLanguage } from '@/contexts/LanguageContext';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;

    try {
      const newUser = await userService.createUser(email, password, role);
      
      // Log the creation
      if (newUser?.id) {
        try {
          await userLogger.created(newUser.id, email, { email, role });
        } catch (logError) {
          // Don't fail user creation if logging fails
          console.error('Failed to log user creation:', logError);
        }
      }
      
      toast.success('User created successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to create user: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dialog.addUser')}</DialogTitle>
          <DialogDescription>
            {t('dialog.addUserDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('dialog.email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              required
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">{t('dialog.password')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              minLength={6}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {t('dialog.passwordMin')}
            </p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">{t('dialog.role')}</Label>
            <Select name="role" defaultValue="viewer" required>
              <SelectTrigger id="role" disabled={isLoading}>
                <SelectValue placeholder={t('dialog.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">
                  {t('dialog.superAdmin')}
                </SelectItem>
                <SelectItem value="admin">
                  {t('dialog.admin')}
                </SelectItem>
                <SelectItem value="editor">
                  {t('dialog.editor')}
                </SelectItem>
                <SelectItem value="viewer">
                  {t('dialog.viewer')}
                </SelectItem>
              </SelectContent>
            </Select>
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
                  {t('dialog.creating')}
                </>
              ) : (
                t('dialog.createUser')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

