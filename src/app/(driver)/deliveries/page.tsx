'use client';

import { Suspense } from 'react';
import { useCurrentDriver } from '@/features/driver-view/api/use-current-driver';
import { useGetOrders } from '@/features/orders/api/use-get-orders';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { PageLoader } from '@/components/page-loader';
import { Order } from '@/features/orders/components/columns';
import { DriverStats } from '@/features/driver-view/components/driver-stats';
import { LoadSheet } from '@/features/driver-view/components/load-sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function DeliveriesContent() {
  const { data: driver, isLoading: isLoadingDriver } = useCurrentDriver();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: ordersData, isLoading: isLoadingOrders } = useGetOrders({
    driverId: driver?.id,
    date: today,
  });

  if (isLoadingDriver || isLoadingOrders) return <PageLoader />;
  if (!driver) return <div className="p-4">You are not registered as a driver.</div>;

  // @ts-ignore
  const orders: Order[] = (ordersData?.orders as Order[]) || [];

  const pendingOrders = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');

  const OrderCard = ({ order }: { order: Order }) => (
    <Link href={`/deliveries/${order.id}`} className="block">
      <Card className="active:bg-muted transition-colors">
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <p className="font-bold">#{order.readableId}</p>
            <p className="text-sm font-medium">{order.customer.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(order.scheduledDate), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>
              {order.status}
            </Badge>
            <span className="text-xs font-medium">
              {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(Number(order.totalAmount))}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-6">
      <DriverStats />
      <LoadSheet orders={pendingOrders} />

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">To Do ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Done ({completedOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
           {pendingOrders.length === 0 ? <p className="text-muted-foreground text-center py-4">No pending tasks</p> :
             pendingOrders.map(order => <OrderCard key={order.id} order={order} />)
           }
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-4">
           {completedOrders.length === 0 ? <p className="text-muted-foreground text-center py-4">No completed tasks today</p> :
             completedOrders.map(order => <OrderCard key={order.id} order={order} />)
           }
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
