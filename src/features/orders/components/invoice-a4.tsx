'use client';

import type { Decimal } from '@prisma/client/runtime/library';
import { format } from 'date-fns';
import { Droplet } from 'lucide-react';

interface InvoiceA4Props {
  data: {
    order: {
      id: string;
      readableId: number;
      scheduledDate: Date | string;
      deliveredAt: Date | string | null;
      status: string;
      totalAmount: string | number;
      discount: string | number;
      deliveryCharge: string | number;
      cashCollected: string | number;
      paymentMethod: string;
      customer: {
        user: {
          name: string;
          phoneNumber: string | null;
          email: string | null;
        };
        address: string;
        area: string;
        landmark: string | null;
        floorNumber: number;
        hasLift: boolean;
        cashBalance: string | number;
        creditLimit: string | number;
      };
      orderItems: Array<{
        id: string;
        quantity: number;
        priceAtTime: string | number;
        filledGiven: number;
        emptyTaken: number;
        product: {
          name: string;
          sku: string;
        };
      }>;
    };
    lastDeliveries: Array<{
      id: string;
      readableId: number;
      deliveredAt: Date | string | null;
      totalAmount: string | number;
      orderItems: Array<{
        quantity: number;
        product: {
          name: string;
        };
      }>;
    }>;
    previousBalance: string | number;
  };
}

export const InvoiceA4 = ({ data }: InvoiceA4Props) => {
  const { order, lastDeliveries, previousBalance } = data;

  // Financial calculations
  const subtotal = order.orderItems.reduce((sum, item) => {
    return sum + Number(item.priceAtTime) * item.quantity;
  }, 0);

  const currentBill = Number(order.totalAmount);
  const previousBalanceNum = Number(previousBalance);
  const totalPayable = previousBalanceNum + currentBill;
  const paymentReceived = Number(order.cashCollected);
  const netOutstanding = totalPayable - paymentReceived;

  return (
    <div className="mx-auto max-w-[210mm] bg-white p-8 text-gray-900">
      {/* Header */}
      <div className="mb-8 border-b-4 border-blue-600 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
              <Droplet className="h-10 w-10 fill-white text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-blue-600">Blue Ice</h1>
              <p className="text-sm text-gray-600">Premium Water Supply Services</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
            <p className="mt-1 text-sm text-gray-600">Invoice #{order.readableId}</p>
            <p className="text-sm text-gray-600">Date: {format(new Date(order.scheduledDate), 'dd MMM yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Company & Customer Details */}
      <div className="mb-8 grid grid-cols-2 gap-8">
        {/* Company Info */}
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">From</h3>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">Blue Ice Water Supply</p>
            <p className="mt-1 text-sm text-gray-600">Karachi, Pakistan</p>
            <p className="text-sm text-gray-600">Phone: +92 XXX XXXXXXX</p>
            <p className="text-sm text-gray-600">Email: info@blueice.com</p>
          </div>
        </div>

        {/* Customer Info */}
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Bill To</h3>
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="font-semibold text-gray-900">{order.customer.user.name}</p>
            {order.customer.user.phoneNumber && <p className="mt-1 text-sm text-gray-600">Phone: {order.customer.user.phoneNumber}</p>}
            {order.customer.user.email && <p className="text-sm text-gray-600">Email: {order.customer.user.email}</p>}
            <p className="mt-2 text-sm text-gray-600">{order.customer.address}</p>
            <p className="text-sm text-gray-600">{order.customer.area}</p>
            {order.customer.landmark && <p className="text-sm text-gray-600">Near: {order.customer.landmark}</p>}
            <p className="text-sm text-gray-600">
              Floor {order.customer.floorNumber} {order.customer.hasLift ? '(Lift Available)' : '(No Lift)'}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Order Details</h3>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Product</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">SKU</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">Rate</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.orderItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.product.name}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{item.product.sku}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">PKR {Number(item.priceAtTime).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    PKR {(Number(item.priceAtTime) * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Subtotal Section */}
        <div className="mt-4 flex justify-end">
          <div className="w-80 space-y-2 rounded-lg bg-gray-50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">PKR {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery Charge:</span>
              <span className="font-medium text-gray-900">PKR {Number(order.deliveryCharge).toFixed(2)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-green-600">- PKR {Number(order.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-300 pt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-blue-600">PKR {currentBill.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Statement - Last 4 Deliveries */}
      {lastDeliveries.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Recent Delivery History</h3>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-amber-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">Items</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {lastDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="text-sm">
                    <td className="px-4 py-2 text-gray-900">
                      {delivery.deliveredAt ? format(new Date(delivery.deliveredAt), 'dd MMM yyyy') : 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {delivery.orderItems.map((item) => `${item.quantity}x ${item.product.name}`).join(', ')}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-gray-900">PKR {Number(delivery.totalAmount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Financial Summary</h3>
        <div className="overflow-hidden rounded-lg border-2 border-blue-600 bg-gradient-to-br from-blue-50 to-white">
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <span className="text-sm font-medium text-gray-700">Previous Balance:</span>
                <span
                  className={`text-lg font-semibold ${previousBalanceNum < 0 ? 'text-red-600' : previousBalanceNum > 0 ? 'text-green-600' : 'text-gray-900'}`}
                >
                  PKR {Math.abs(previousBalanceNum).toFixed(2)}{' '}
                  {previousBalanceNum < 0 ? '(Payable)' : previousBalanceNum > 0 ? '(Advance)' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <span className="text-sm font-medium text-gray-700">Current Bill:</span>
                <span className="text-lg font-semibold text-blue-600">PKR {currentBill.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <span className="text-sm font-medium text-gray-700">Total Payable:</span>
                <span className="text-lg font-semibold text-gray-900">PKR {totalPayable.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <span className="text-sm font-medium text-gray-700">Payment Received:</span>
                <span className="text-lg font-semibold text-green-600">PKR {paymentReceived.toFixed(2)}</span>
              </div>
              <div className="-mx-6 -mb-6 mt-4 flex items-center justify-between bg-blue-600 px-6 py-4">
                <span className="text-sm font-bold uppercase text-white">Net Outstanding:</span>
                <span
                  className={`text-2xl font-bold ${netOutstanding < 0 ? 'text-green-300' : netOutstanding > 0 ? 'text-yellow-300' : 'text-white'}`}
                >
                  PKR {Math.abs(netOutstanding).toFixed(2)} {netOutstanding < 0 ? '(Overpaid)' : netOutstanding > 0 ? '(Due)' : '(Settled)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 pt-6 text-center">
        <p className="text-sm text-gray-600">Thank you for your business!</p>
        <p className="mt-1 text-xs text-gray-500">For queries, contact us at info@blueice.com or call +92 XXX XXXXXXX</p>
        <p className="mt-2 text-xs text-gray-400">This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  );
};
