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

function DeliveriesContent() {
  const { data: driver, isLoading: isLoadingDriver } = useCurrentDriver();

  const { data: ordersData, isLoading: isLoadingOrders } = useGetOrders({
    driverId: driver?.id,
  });

  if (isLoadingDriver || isLoadingOrders) return <PageLoader />;
  if (!driver) return <div className="p-4">You are not registered as a driver.</div>;

  // @ts-ignore
  const orders: Order[] = (ordersData?.orders as Order[]) || [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">My Deliveries</h2>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">No orders assigned.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/deliveries/${order.id}`} className="block">
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
          ))}
        </div>
      )}
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
