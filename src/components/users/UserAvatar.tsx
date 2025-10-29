import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  email: string;
  role: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ email, role, size = 'md', className }: UserAvatarProps) {
  // Get initials from email
  const initials = email
    .split('@')[0]
    .split(/[._-]/)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Role-based color scheme
  const getRoleColor = () => {
    switch (role) {
      case 'super_admin':
        return 'bg-gradient-to-br from-purple-500 to-purple-700 text-white';
      case 'admin':
        return 'bg-gradient-to-br from-blue-500 to-blue-700 text-white';
      case 'editor':
        return 'bg-gradient-to-br from-green-500 to-green-700 text-white';
      default:
        return 'bg-gradient-to-br from-gray-400 to-gray-600 text-white';
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className={cn(getRoleColor(), 'font-semibold')}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

