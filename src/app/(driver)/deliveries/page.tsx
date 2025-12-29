'use client';

import { format } from 'date-fns';
import { Suspense, useEffect, useState } from 'react';

import { PageLoader } from '@/components/page-loader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentDriver } from '@/features/driver-view/api/use-current-driver';
import { DriverStats } from '@/features/driver-view/components/driver-stats';
import { EnhancedOrderCard } from '@/features/driver-view/components/enhanced-order-card';
import { LoadSheet } from '@/features/driver-view/components/load-sheet';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import { useGetOrders } from '@/features/orders/api/use-get-orders';
import { DriverLocationTracker } from '@/features/tracking/components/driver-location-tracker';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { cacheTodaysOrders, getCachedOrders } from '@/lib/offline-storage';

function DeliveriesContent() {
  const { data: driver, isLoading: isLoadingDriver } = useCurrentDriver();
  const isOnline = useOnlineStatus();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [cachedOrders, setCachedOrders] = useState<any[]>([]);

  const { data: ordersData, isLoading: isLoadingOrders } = useGetOrders({
    driverId: driver?.id,
    date: today,
  });

  // Cache orders when online
  useEffect(() => {
    if (isOnline && ordersData?.orders) {
      cacheTodaysOrders(ordersData.orders).catch((error) => {
        console.error('Failed to cache orders:', error);
      });
    }
  }, [isOnline, ordersData]);

  // Load cached orders when offline
  useEffect(() => {
    if (!isOnline) {
      getCachedOrders()
        .then((cached) => {
          setCachedOrders(cached);
        })
        .catch((error) => {
          console.error('Failed to load cached orders:', error);
        });
    }
  }, [isOnline]);

  if (isLoadingDriver || isLoadingOrders) return <PageLoader />;
  if (!driver) return <div className="p-4">You are not registered as a driver.</div>;

  // Use cached orders when offline, otherwise use fresh data
  const orders = isOnline ? ordersData?.orders || [] : cachedOrders;

  const pendingOrders = orders.filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <DriverStats />
      <DriverLocationTracker />
      <div className="flex gap-2">
        <ExpenseForm />
      </div>
      <LoadSheet orders={pendingOrders} />

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">To Do ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Done ({completedOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-4">
          {pendingOrders.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No pending deliveries</p>
          ) : (
            pendingOrders.map((order: any, index: number) => <EnhancedOrderCard key={order.id} order={order} index={index} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4 space-y-4">
          {completedOrders.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No completed deliveries today</p>
          ) : (
            completedOrders.map((order: any) => <EnhancedOrderCard key={order.id} order={order} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DeliveriesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <DeliveriesContent />
    </Suspense>
  );
}
