'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

interface DeliveryMapProps {
  orders: any[];
  driverLocation?: { lat: number; lng: number } | null;
  height?: string;
}

const DeliveryMapCore = dynamic(() => import('./delivery-map-core'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-lg" />,
});

export const DeliveryMap = ({ orders, driverLocation, height = '500px' }: DeliveryMapProps) => {
  return (
    <div style={{ height }} className="w-full">
      <DeliveryMapCore orders={orders} driverLocation={driverLocation} />
    </div>
  );
};
