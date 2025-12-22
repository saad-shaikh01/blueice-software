'use client';

import { Suspense } from 'react';
import { useGetOrders } from '@/features/orders/api/use-get-orders';
import { OrderTable } from '@/features/orders/components/order-list';
import { columns, Order } from '@/features/orders/components/columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

function OrdersContent() {
  const { data, isLoading } = useGetOrders();
  // @ts-ignore
  const orders: Order[] = (data?.orders as Order[]) || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <Button asChild>
           <Link href="/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Link>
        </Button>
      </div>
      <OrderTable columns={columns} data={orders} isLoading={isLoading} />
    </div>
  );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OrdersContent />
        </Suspense>
    )
}
