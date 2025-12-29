'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useGetDriverStats } from '../api/use-get-driver-stats';

export const DriverStats = () => {
  const { data: stats, isLoading } = useGetDriverStats();

  if (isLoading) return <StatsSkeleton />;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-4 text-center">
          <span className="text-2xl font-bold">{stats.pendingOrders}</span>
          <span className="text-xs text-muted-foreground">Pending</span>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-4 text-center">
          <span className="text-2xl font-bold">{stats.completedOrders}</span>
          <span className="text-xs text-muted-foreground">Completed</span>
        </CardContent>
      </Card>
      <Card className="col-span-2 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="flex items-center justify-between p-4">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Cash Collected</span>
          <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(Number(stats.cashCollected))}
          </span>
        </CardContent>
      </Card>
    </div>
  );
};

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="col-span-2 h-16 w-full" />
    </div>
  );
}
