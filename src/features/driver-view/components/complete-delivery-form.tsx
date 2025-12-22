'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';
import { OrderStatus, PaymentMethod } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageLoader } from '@/components/page-loader';
import { PageError } from '@/components/page-error';

import { useUpdateOrder } from '@/features/orders/api/use-update-order';
import { useGetOrder } from '@/features/orders/api/use-get-order';

interface CompleteDeliveryFormProps {
  orderId: string;
}

export const CompleteDeliveryForm = ({ orderId }: CompleteDeliveryFormProps) => {
  const router = useRouter();
  const { data: order, isLoading: isLoadingOrder } = useGetOrder(orderId);
  const { mutate: updateOrder, isPending } = useUpdateOrder();

  const form = useForm({
    defaultValues: {
      cashCollected: 0,
      paymentMethod: PaymentMethod.CASH,
      items: [] as any[],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    if (order) {
      form.reset({
        cashCollected: Number(order.totalAmount),
        paymentMethod: PaymentMethod.CASH,
        items: order.orderItems.map((item: any) => ({
          productId: item.productId,
          productName: item.product.name, // For display
          quantity: item.quantity,
          filledGiven: item.quantity, // Default to ordered qty
          emptyTaken: item.quantity, // Default to ordered qty (assumption: replacement)
        })),
      });
    }
  }, [order, form]);

  const onSubmit = (data: any) => {
    updateOrder({
      param: { id: orderId },
      json: {
        status: OrderStatus.COMPLETED,
        cashCollected: data.cashCollected,
        paymentMethod: data.paymentMethod,
        items: data.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          filledGiven: item.filledGiven,
          emptyTaken: item.emptyTaken,
        })),
      },
    }, {
      onSuccess: () => router.push('/deliveries'),
    });
  };

  if (isLoadingOrder) return <PageLoader />;
  if (!order) return <PageError message="Order not found" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Complete Delivery #{order.readableId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold">{order.customer.user.name}</p>
            <p className="text-sm text-muted-foreground">{order.customer.address}</p>
            <a href={`tel:${order.customer.user.phoneNumber}`} className="text-sm text-blue-600 block mt-1">
              {order.customer.user.phoneNumber}
            </a>
          </div>

          <div className="flex justify-between items-center border-t pt-4">
             <span className="font-medium">Total to Collect:</span>
             <span className="text-xl font-bold">
                {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(Number(order.totalAmount))}
             </span>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="cashCollected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Cash Collected</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(PaymentMethod).map((method) => (
                          <SelectItem key={method} value={method}>
                            {method.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bottle Exchange</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-[80px]">Filled</TableHead>
                    <TableHead className="w-[80px]">Empty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell className="font-medium">
                        {field.productName}
                        <div className="text-xs text-muted-foreground">Qty: {field.quantity}</div>
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.filledGiven`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.emptyTaken`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={isPending || order.status === 'COMPLETED'}>
            {isPending ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
            {order.status === 'COMPLETED' ? 'Already Completed' : 'Confirm Delivery'}
          </Button>
        </form>
      </Form>
    </div>
  );
};
