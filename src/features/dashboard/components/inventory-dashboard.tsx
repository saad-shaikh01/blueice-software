'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

export const InventoryDashboard = () => {
  // We can reuse the products API to get stock levels
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // Fetch products without limit as current schema doesn't support pagination
      const response = await client.api.products.$get({
        query: {}
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      return data.data;
    },
  });

  // We can reuse orders API to get pending orders
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders', { status: 'PENDING' }],
    queryFn: async () => {
      const response = await client.api.orders.$get({
        query: { status: 'PENDING', limit: '5' }
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      return data;
    },
  });

  if (isLoadingProducts || isLoadingOrders) {
    return <DashboardSkeleton />;
  }

  const lowStockProducts = products?.filter((p) => p.stockFilled < 20) || [];
  // @ts-ignore
  const pendingOrders = ordersData?.orders || [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Dashboard</h1>
        <p className="text-muted-foreground">Overview of stock levels and pending orders</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Stock Alert Card */}
        <Card className={lowStockProducts.length > 0 ? "border-yellow-200 bg-yellow-50/50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Products with less than 20 filled units</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <Package className="h-4 w-4" />
                <span>All stock levels are healthy</span>
              </div>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-background/50 rounded border">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                    </div>
                    <Badge variant="destructive">
                      {product.stockFilled} Left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Orders Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Pending Orders
            </CardTitle>
            <CardDescription>Orders waiting for driver assignment</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingOrders.length === 0 ? (
              <p className="text-muted-foreground">No pending orders</p>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order: any) => (
                  <div key={order.id} className="flex flex-col gap-1 p-2 border rounded">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">Order #{order.readableId}</span>
                      <Badge variant="secondary">{order.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.customer.user.name} • {format(new Date(order.scheduledDate), 'MMM dd')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
