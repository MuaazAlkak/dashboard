import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ShieldCheck, Shield, Edit, Eye, Activity } from 'lucide-react';
import { AdminUser } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

interface UsersStatsProps {
  users: AdminUser[];
  isLoading?: boolean;
}

export function UsersStats({ users, isLoading }: UsersStatsProps) {
  const stats = useMemo(() => {
    const total = users.length;
    const superAdmins = users.filter(u => u.role === 'super_admin').length;
    const admins = users.filter(u => u.role === 'admin').length;
    const editors = users.filter(u => u.role === 'editor').length;
    const viewers = users.filter(u => u.role === 'viewer').length;
    
    // Calculate recently active (signed in within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyActive = users.filter(u => 
      u.last_sign_in_at && new Date(u.last_sign_in_at) >= sevenDaysAgo
    ).length;

    return {
      total,
      superAdmins,
      admins,
      editors,
      viewers,
      recentlyActive,
    };
  }, [users]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: 'Total Users',
      value: stats.total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Super Admins',
      value: stats.superAdmins,
      icon: ShieldCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Admins',
      value: stats.admins,
      icon: Shield,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Editors',
      value: stats.editors,
      icon: Edit,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Viewers',
      value: stats.viewers,
      icon: Eye,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
    {
      title: 'Recently Active',
      value: stats.recentlyActive,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index}
            className="overflow-hidden transition-all hover:shadow-lg hover:scale-105 animate-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

