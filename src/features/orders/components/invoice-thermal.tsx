'use client';

import { format } from 'date-fns';
import type { Decimal } from '@prisma/client/runtime/library';

interface InvoiceThermalProps {
  data: {
    order: {
      id: string;
      readableId: number;
      scheduledDate: Date;
      deliveredAt: Date | null;
      status: string;
      totalAmount: Decimal;
      discount: Decimal;
      deliveryCharge: Decimal;
      cashCollected: Decimal;
      paymentMethod: string;
      customer: {
        user: {
          name: string;
          phone: string | null;
        };
        address: string;
        area: string;
        cashBalance: Decimal;
      };
      orderItems: Array<{
        id: string;
        quantity: number;
        priceAtTime: Decimal;
        filledGiven: number;
        emptyTaken: number;
        product: {
          name: string;
        };
      }>;
    };
    lastDeliveries: Array<{
      id: string;
      readableId: number;
      deliveredAt: Date | null;
      totalAmount: Decimal;
    }>;
    previousBalance: Decimal;
  };
}

export const InvoiceThermal = ({ data }: InvoiceThermalProps) => {
  const { order, lastDeliveries, previousBalance } = data;

  // Financial calculations
  const currentBill = Number(order.totalAmount);
  const previousBalanceNum = Number(previousBalance);
  const totalPayable = previousBalanceNum + currentBill;
  const paymentReceived = Number(order.cashCollected);
  const netOutstanding = totalPayable - paymentReceived;

  return (
    <div className="mx-auto w-[80mm] bg-white p-2 font-mono text-[11px] text-black">
      {/* Header */}
      <div className="border-b-2 border-dashed border-gray-800 pb-2 text-center">
        <div className="text-xl font-bold">BLUE ICE</div>
        <div className="text-[9px]">Premium Water Supply</div>
        <div className="mt-1 text-[9px]">Karachi, Pakistan</div>
        <div className="text-[9px]">Ph: +92 XXX XXXXXXX</div>
      </div>

      {/* Invoice Info */}
      <div className="mt-2 border-b border-dashed border-gray-600 pb-2">
        <div className="flex justify-between">
          <span>Invoice #:</span>
          <span className="font-bold">{order.readableId}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{format(new Date(order.scheduledDate), 'dd/MM/yyyy')}</span>
        </div>
        <div className="flex justify-between">
          <span>Time:</span>
          <span>{format(new Date(order.scheduledDate), 'HH:mm')}</span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mt-2 border-b border-dashed border-gray-600 pb-2">
        <div className="font-bold">{order.customer.user.name}</div>
        {order.customer.user.phone && <div className="text-[9px]">Ph: {order.customer.user.phone}</div>}
        <div className="text-[9px]">{order.customer.area}</div>
      </div>

      {/* Items */}
      <div className="mt-2">
        <div className="border-b border-gray-800 pb-1 font-bold">
          <div className="flex justify-between">
            <span>ITEM</span>
            <span>QTY x RATE = AMT</span>
          </div>
        </div>
        {order.orderItems.map((item) => (
          <div key={item.id} className="border-b border-dotted border-gray-400 py-1">
            <div className="font-semibold">{item.product.name}</div>
            <div className="flex justify-between text-[10px]">
              <span>
                {item.quantity} x {Number(item.priceAtTime).toFixed(0)}
              </span>
              <span className="font-bold">{(Number(item.priceAtTime) * item.quantity).toFixed(2)}</span>
            </div>
            {(item.filledGiven > 0 || item.emptyTaken > 0) && (
              <div className="text-[9px] text-gray-700">
                Filled: {item.filledGiven} | Empty: {item.emptyTaken}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-2 border-t-2 border-gray-800 pt-2">
        {Number(order.deliveryCharge) > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>Delivery Charge:</span>
            <span>{Number(order.deliveryCharge).toFixed(2)}</span>
          </div>
        )}
        {Number(order.discount) > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>Discount:</span>
            <span>-{Number(order.discount).toFixed(2)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between border-t border-dashed border-gray-600 pt-1 text-sm font-bold">
          <span>BILL TOTAL:</span>
          <span>PKR {currentBill.toFixed(2)}</span>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="mt-2 border-t-2 border-double border-gray-800 pt-2">
        <div className="text-center text-[10px] font-bold">ACCOUNT STATEMENT</div>
        <div className="mt-1 space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span>Prev Balance:</span>
            <span className={previousBalanceNum < 0 ? 'font-bold' : ''}>
              {Math.abs(previousBalanceNum).toFixed(2)} {previousBalanceNum < 0 ? 'DR' : previousBalanceNum > 0 ? 'CR' : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Current Bill:</span>
            <span>{currentBill.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total Due:</span>
            <span>{totalPayable.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid:</span>
            <span>-{paymentReceived.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-gray-800 pt-1 text-sm font-bold">
            <span>BALANCE:</span>
            <span className={netOutstanding > 0 ? 'text-black' : ''}>
              {Math.abs(netOutstanding).toFixed(2)} {netOutstanding > 0 ? 'DR' : netOutstanding < 0 ? 'CR' : 'OK'}
            </span>
          </div>
        </div>
      </div>

      {/* Last 4 Deliveries */}
      {lastDeliveries.length > 0 && (
        <div className="mt-2 border-t border-dashed border-gray-600 pt-2">
          <div className="text-center text-[9px] font-bold">RECENT DELIVERIES</div>
          <div className="mt-1 space-y-[2px] text-[9px]">
            {lastDeliveries.map((delivery) => (
              <div key={delivery.id} className="flex justify-between">
                <span>{delivery.deliveredAt ? format(new Date(delivery.deliveredAt), 'dd/MM') : 'N/A'}</span>
                <span>PKR {Number(delivery.totalAmount).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 border-t-2 border-dashed border-gray-800 pt-2 text-center">
        <div className="text-[10px] font-bold">THANK YOU!</div>
        <div className="mt-1 text-[8px]">info@blueice.com</div>
        <div className="mt-2 text-[8px]">
          {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
        </div>
      </div>
    </div>
  );
};
