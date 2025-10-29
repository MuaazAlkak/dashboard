import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

interface UserActivityIndicatorProps {
  lastSignInAt?: string;
}

export function UserActivityIndicator({ lastSignInAt }: UserActivityIndicatorProps) {
  if (!lastSignInAt) {
    return (
      <div className="flex items-center gap-2">
        <Circle className="h-2 w-2 fill-gray-400 text-gray-400" />
        <span className="text-xs text-muted-foreground">Never</span>
      </div>
    );
  }

  const lastSignIn = new Date(lastSignInAt);
  const now = new Date();
  const diffMs = now.getTime() - lastSignIn.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  let status: 'online' | 'recent' | 'away' | 'offline';
  let statusText: string;
  let statusColor: string;

  if (diffMinutes < 5) {
    status = 'online';
    statusText = 'Online';
    statusColor = 'text-green-500 fill-green-500';
  } else if (diffHours < 24) {
    status = 'recent';
    statusText = diffHours === 0 ? 'Just now' : `${diffHours}h ago`;
    statusColor = 'text-blue-500 fill-blue-500';
  } else if (diffDays < 7) {
    status = 'away';
    statusText = `${diffDays}d ago`;
    statusColor = 'text-yellow-500 fill-yellow-500';
  } else {
    status = 'offline';
    statusText = lastSignIn.toLocaleDateString();
    statusColor = 'text-gray-400 fill-gray-400';
  }

  return (
    <div className="flex items-center gap-2">
      <Circle className={`h-2 w-2 ${statusColor} animate-pulse`} />
      <span className="text-xs text-muted-foreground">{statusText}</span>
    </div>
  );
}

