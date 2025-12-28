'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone,
  MapPin,
  Navigation,
  Package,
  Building2,
  Landmark,
  TrendingUp,
  AlertCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import type { Decimal } from '@prisma/client/runtime/library';
import { format } from 'date-fns';
import { UnableToDeliverDialog } from './unable-to-deliver-dialog';
import { useUnableToDeliver } from '@/features/orders/api/use-unable-to-deliver';
import { toast } from 'sonner';

interface EnhancedOrderCardProps {
  order: {
    id: string;
    readableId: number;
    totalAmount: Decimal;
    status: string;
    scheduledDate: Date;
    customer: {
      user: {
        name: string;
        phoneNumber: string | null;
      };
      route?: {
        name: string;
      } | null;
      address: string;
      area: string;
      landmark: string | null;
      floorNumber: number;
      hasLift: boolean;
      geoLat: number | null;
      geoLng: number | null;
      sequenceOrder: number | null;
      cashBalance: Decimal;
      creditLimit: Decimal;
      deliveryInstructions: string | null;
      preferredDeliveryTime: string | null;
      specialNotes: string | null;
    };
    orderItems: Array<{
      quantity: number;
      product: {
        name: string;
      };
    }>;
  };
  index?: number; // Position in list for sequence numbering
}

export const EnhancedOrderCard = ({ order, index }: EnhancedOrderCardProps) => {
  const [unableToDeliverOpen, setUnableToDeliverOpen] = useState(false);
  const { mutateAsync: unableToDeliver, isPending } = useUnableToDeliver(order.id);

  const totalBottles = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const customerBalance = Number(order.customer.cashBalance);
  const hasDebt = customerBalance < 0;

  // Calculate if customer will exceed credit limit after this order
  const totalDue = Math.abs(customerBalance) + Number(order.totalAmount);
  const creditLimitNum = Number(order.customer.creditLimit);
  const exceedsCreditLimit = hasDebt && totalDue > creditLimitNum;

  // Use sequence order from customer if available, otherwise use index
  const sequenceNumber = order.customer.sequenceOrder || (index !== undefined ? index + 1 : null);

  const handleCall = () => {
    if (order.customer.user.phoneNumber) {
      window.location.href = `tel:${order.customer.user.phoneNumber}`;
    }
  };

  const handleNavigate = () => {
    const { geoLat, geoLng, address } = order.customer;

    // Prefer coordinates for precision
    if (geoLat && geoLng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${geoLat},${geoLng}`, '_blank');
    } else {
      // Fallback to address search
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const handleUnableToDeliver = async (data: any) => {
    try {
      // TODO: If photo provided, upload to cloud storage first
      let proofPhotoUrl: string | undefined;

      if (data.proofPhoto) {
        // For now, skip photo upload - will implement in next iteration
        toast.info('Photo proof feature coming soon');
      }

      await unableToDeliver({
        reason: data.reason,
        notes: data.notes,
        action: data.action,
        rescheduleDate: data.rescheduleDate,
        proofPhotoUrl,
      });

      setUnableToDeliverOpen(false);
    } catch (error) {
      // Error already handled by mutation
      console.error('Unable to deliver error:', error);
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Header with Sequence Number */}
      <div className="flex items-center gap-3 border-b bg-gradient-to-r from-blue-50 to-white p-4">
        {sequenceNumber && (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow-lg">
            {sequenceNumber}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{order.customer.user.name}</h3>
            <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-xs">
              #{order.readableId}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{order.customer.area}</p>
            {order.customer.route && (
              <span className="text-xs text-muted-foreground">• {order.customer.route.name}</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">₨{Number(order.totalAmount).toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">{totalBottles} bottles</p>
        </div>
      </div>

      {/* Address & Delivery Details */}
      <div className="space-y-3 p-4">
        {/* Address */}
        <div className="flex items-start gap-2">
          <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-gray-500" />
          <p className="text-sm leading-tight">{order.customer.address}</p>
        </div>

        {/* Landmark - Prominent Display */}
        {order.customer.landmark && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
            <Landmark className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-900">Near: {order.customer.landmark}</p>
          </div>
        )}

        {/* Floor & Lift Info - Critical for Driver */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">
              {order.customer.floorNumber === 0 ? 'Ground Floor' : `Floor ${order.customer.floorNumber}`}
            </span>
          </div>
          {order.customer.floorNumber > 0 && !order.customer.hasLift && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <TrendingUp className="h-3 w-3" />
              Stairs Only
            </Badge>
          )}
          {order.customer.hasLift && order.customer.floorNumber > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs bg-green-100 text-green-800">
              Lift Available
            </Badge>
          )}
        </div>

        {/* Delivery Instructions - Most Important! */}
        {order.customer.deliveryInstructions && (
          <div className="rounded-md border-2 border-blue-300 bg-blue-50 p-3">
            <p className="text-sm font-semibold text-blue-900">
              📝 {order.customer.deliveryInstructions}
            </p>
          </div>
        )}

        {/* Preferred Delivery Time */}
        {order.customer.preferredDeliveryTime && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="h-4 w-4" />
            <span>Best time: {order.customer.preferredDeliveryTime}</span>
          </div>
        )}

        {/* Special Notes */}
        {order.customer.specialNotes && (
          <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs font-medium text-gray-700">⚠️ {order.customer.specialNotes}</p>
          </div>
        )}

        {/* Customer Balance Warning */}
        {hasDebt && (
          <div className="rounded-md bg-red-50 border-2 border-red-200 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-900">
                  Outstanding Balance: ₨{Math.abs(customerBalance).toFixed(0)}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  After this delivery: ₨{totalDue.toFixed(0)}
                  {exceedsCreditLimit && (
                    <span className="ml-1 font-semibold">(⚠️ Exceeds credit limit!)</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Items Summary */}
        <div className="rounded-md bg-gray-50 p-2">
          <p className="text-xs text-gray-600">
            {order.orderItems.map((item, idx) => (
              <span key={idx}>
                {item.quantity}x {item.product.name}
                {idx < order.orderItems.length - 1 && ', '}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* Unable to Deliver Button - Only for pending orders */}
      {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
        <div className="border-t bg-gray-50 px-4 pt-3 pb-2">
          <Button
            onClick={() => setUnableToDeliverOpen(true)}
            variant="outline"
            size="lg"
            className="h-14 w-full border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
          >
            <XCircle className="mr-2 h-5 w-5" />
            <span className="font-semibold">Unable to Deliver</span>
          </Button>
        </div>
      )}

      {/* Action Buttons - Extra Large for Gloves */}
      <div className="grid grid-cols-3 gap-2 border-t bg-gray-50 p-4">
        {/* Call Button */}
        <Button
          onClick={handleCall}
          disabled={!order.customer.user.phoneNumber}
          size="lg"
          variant="outline"
          className="h-16 flex-col gap-1 hover:bg-green-50 hover:border-green-300"
        >
          <Phone className="h-5 w-5 text-green-600" />
          <span className="text-xs font-medium">Call</span>
        </Button>

        {/* Navigate Button */}
        <Button
          onClick={handleNavigate}
          size="lg"
          variant="outline"
          className="h-16 flex-col gap-1 hover:bg-blue-50 hover:border-blue-300"
        >
          <Navigation className="h-5 w-5 text-blue-600" />
          <span className="text-xs font-medium">Navigate</span>
        </Button>

        {/* Complete/View Button */}
        <Link href={`/deliveries/${order.id}`} className="block">
          <Button
            size="lg"
            variant={order.status === 'COMPLETED' ? 'secondary' : 'primary'}
            className="h-16 w-full flex-col gap-1"
          >
            <Package className="h-5 w-5" />
            <span className="text-xs font-medium">
              {order.status === 'COMPLETED' ? 'View' : 'Deliver'}
            </span>
          </Button>
        </Link>
      </div>

      {/* Unable to Deliver Dialog */}
      <UnableToDeliverDialog
        orderId={order.id}
        customerName={order.customer.user.name}
        scheduledDate={order.scheduledDate}
        open={unableToDeliverOpen}
        onOpenChange={setUnableToDeliverOpen}
        onSubmit={handleUnableToDeliver}
      />
    </Card>
  );
};
