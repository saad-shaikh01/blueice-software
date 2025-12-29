import { Package } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LoadSheetProps {
  orders: any[]; // Using any for simplicity here, ideally typed
}

export const LoadSheet = ({ orders }: LoadSheetProps) => {
  const pendingOrders = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');

  const totals = pendingOrders.reduce((acc: any, order) => {
    order.orderItems.forEach((item: any) => {
      const productName = item.product.name;
      if (!acc[productName]) {
        acc[productName] = { quantity: 0 };
      }
      acc[productName].quantity += item.quantity;
    });
    return acc;
  }, {});

  if (pendingOrders.length === 0) return null;

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5 text-blue-600" />
          Load Sheet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(totals).map(([name, stats]: [string, any]) => (
            <div key={name} className="flex items-center justify-between border-b border-blue-200 pb-1 last:border-0 dark:border-blue-800">
              <span className="text-sm font-medium">{name}</span>
              <span className="text-lg font-bold">{stats.quantity}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Total {pendingOrders.length} stops remaining.</p>
      </CardContent>
    </Card>
  );
};
