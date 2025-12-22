'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetOrder } from '@/features/orders/api/use-get-order';
import { InvoiceTemplate } from '@/features/orders/components/invoice-template';
import { PageLoader } from '@/components/page-loader';
import { PageError } from '@/components/page-error';

interface InvoicePageProps {
  params: {
    orderId: string;
  };
}

export default function InvoicePage({ params }: InvoicePageProps) {
  const { data: order, isLoading } = useGetOrder(params.orderId);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <PageLoader />;
  if (!order) return <PageError message="Order not found" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold tracking-tight">Order Invoice</h1>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Invoice
        </Button>
      </div>

      <div className="rounded-lg border bg-white shadow-sm print:border-none print:shadow-none">
        <InvoiceTemplate order={order} />
      </div>
    </div>
  );
}
