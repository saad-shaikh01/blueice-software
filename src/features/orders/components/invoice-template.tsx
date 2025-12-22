import { format } from 'date-fns';
import { OrderStatus } from '@prisma/client';

// Define a rigorous type matching the getOrder query result
interface InvoiceOrder {
  id: string;
  readableId: number;
  scheduledDate: string | Date;
  status: OrderStatus;
  totalAmount: string | number;
  discount: string | number;
  deliveryCharge: string | number;
  customer: {
    address: string;
    area: string;
    user: {
      name: string;
      phoneNumber: string;
      email: string | null;
    };
    cashBalance: string | number; // Decimal comes as string or number depending on transform
  };
  orderItems: Array<{
    quantity: number;
    priceAtTime: string | number;
    product: {
      name: string;
      sku: string;
    };
  }>;
}

interface InvoiceTemplateProps {
  order: InvoiceOrder;
}

export const InvoiceTemplate = ({ order }: InvoiceTemplateProps) => {
  const total = Number(order.totalAmount);
  const discount = Number(order.discount);
  const delivery = Number(order.deliveryCharge);
  // Calculate subtotal from items to show breakdown
  const subtotal = order.orderItems.reduce((acc, item) => acc + (Number(item.priceAtTime) * item.quantity), 0);

  // Previous Balance (Current Customer Balance)
  // Note: This is the current live balance. If order is completed, it effectively includes this order's debt.
  const currentBalance = Number(order.customer.cashBalance);

  return (
    <div className="mx-auto max-w-[800px] bg-white p-8 text-black print:p-0">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between border-b pb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-600">BLUE ICE</h1>
          <p className="text-sm text-gray-500">Premium Water Delivery</p>
          <div className="mt-2 text-sm text-gray-600">
            <p>123 Industrial Estate</p>
            <p>Karachi, Pakistan</p>
            <p>Tel: 0300-1234567</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold">INVOICE</h2>
          <p className="mt-1 text-gray-500">#{order.readableId}</p>
          <p className="text-sm text-gray-600">
            Date: {format(new Date(order.scheduledDate), 'PP')}
          </p>
          <div className="mt-2 inline-block rounded-md bg-gray-100 px-3 py-1 text-sm font-medium">
            {order.status}
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8">
        <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Bill To</h3>
        <div className="text-base">
          <p className="font-bold">{order.customer.user.name}</p>
          <p>{order.customer.address}</p>
          <p>{order.customer.area}</p>
          <p>{order.customer.user.phoneNumber}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="mb-8 w-full">
        <thead>
          <tr className="border-b-2 border-gray-300 text-left text-sm font-semibold uppercase text-gray-600">
            <th className="py-3">Item</th>
            <th className="py-3 text-right">Qty</th>
            <th className="py-3 text-right">Price</th>
            <th className="py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {order.orderItems.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-4">
                <div className="font-medium">{item.product.name}</div>
                <div className="text-xs text-gray-500">{item.product.sku}</div>
              </td>
              <td className="py-4 text-right">{item.quantity}</td>
              <td className="py-4 text-right">
                {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(Number(item.priceAtTime))}
              </td>
              <td className="py-4 text-right font-medium">
                {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(Number(item.priceAtTime) * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mb-8 flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(subtotal)}</span>
          </div>

          {delivery > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery Charge</span>
              <span>{new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(delivery)}</span>
            </div>
          )}

          {discount > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>Discount</span>
              <span>-{new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(discount)}</span>
            </div>
          )}

          <div className="border-t border-gray-300 pt-2 flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(total)}</span>
          </div>

          <div className="border-t border-gray-300 pt-2 mt-4">
             <div className="flex justify-between text-sm font-medium text-gray-500">
                <span>Account Balance</span>
                <span className={currentBalance < 0 ? 'text-red-600' : 'text-green-600'}>
                    {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(currentBalance)}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t pt-8 text-center text-xs text-gray-500">
        <p>Thank you for your business!</p>
        <p className="mt-1">Generated via Blue Ice CRM</p>
      </div>
    </div>
  );
};
