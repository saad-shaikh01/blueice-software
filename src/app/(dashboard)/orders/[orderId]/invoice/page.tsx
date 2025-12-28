'use client';

import { useState } from 'react';
import { Printer, FileText, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useGetInvoiceData } from '@/features/orders/api/use-get-invoice-data';
import { InvoiceA4 } from '@/features/orders/components/invoice-a4';
import { InvoiceThermal } from '@/features/orders/components/invoice-thermal';
import { PageLoader } from '@/components/page-loader';
import { PageError } from '@/components/page-error';

interface InvoicePageProps {
  params: {
    orderId: string;
  };
}

export default function InvoicePage({ params }: InvoicePageProps) {
  const { data: invoiceData, isLoading } = useGetInvoiceData(params.orderId);
  const [format, setFormat] = useState<'a4' | 'thermal'>('a4');

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <PageLoader />;
  if (!invoiceData) return <PageError message="Order not found" />;

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Print Button */}
      <div className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Invoice #{invoiceData.order.readableId} - {invoiceData.order.customer.user.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} size="lg">
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Format Switcher */}
      <Tabs value={format} onValueChange={(v) => setFormat(v as 'a4' | 'thermal')} className="print:hidden">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="a4" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            A4 Invoice
          </TabsTrigger>
          <TabsTrigger value="thermal" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Thermal Receipt
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Invoice Display */}
      <div className="overflow-x-auto">
        <div className={`${format === 'thermal' ? 'flex justify-center' : ''}`}>
          <div className="rounded-lg border bg-white shadow-sm print:border-none print:shadow-none">
            {format === 'a4' ? <InvoiceA4 data={invoiceData} /> : <InvoiceThermal data={invoiceData} />}
          </div>
        </div>
      </div>
    </div>
  );
}
