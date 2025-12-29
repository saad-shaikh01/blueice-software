'use client';

import { formatDistanceToNow } from 'date-fns';
import { Battery, Clock, Gauge, Navigation, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DriverLocation {
  driverId: string;
  name: string;
  phoneNumber: string;
  imageUrl: string | null;
  vehicleNo: string | null;
  latitude: number;
  longitude: number;
  lastUpdate: string | null;
  isOnDuty: boolean;
  currentOrder: unknown;
}

interface DriverMarkerPopupProps {
  driver: DriverLocation;
}

export function DriverMarkerPopup({ driver }: DriverMarkerPopupProps) {
  const lastUpdateTime = driver.lastUpdate ? new Date(driver.lastUpdate) : null;
  const timeAgo = lastUpdateTime ? formatDistanceToNow(lastUpdateTime, { addSuffix: true }) : 'N/A';

  return (
    <div className="min-w-[250px] p-2">
      {/* Driver Info */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{driver.name}</h3>
            <p className="text-xs text-muted-foreground">{driver.phoneNumber}</p>
          </div>
        </div>
        <Badge variant={driver.isOnDuty ? 'default' : 'secondary'} className="text-xs">
          {driver.isOnDuty ? 'On Duty' : 'Off Duty'}
        </Badge>
      </div>

      <Separator className="my-2" />

      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Last Update */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-muted-foreground">Last Update</div>
            <div className="font-medium">{timeAgo}</div>
          </div>
        </div>

        {/* Movement Status */}
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-muted-foreground">Status</div>
            {/* Movement status not available in aggregated view, simplifying */}
            <div className="font-medium">{driver.isOnDuty ? 'Active' : 'Idle'}</div>
          </div>
        </div>
      </div>

      {/* Coordinates */}
      <div className="mt-2 border-t pt-2">
        <div className="text-xs text-muted-foreground">
          Coordinates: {driver.latitude.toFixed(6)}, {driver.longitude.toFixed(6)}
        </div>
      </div>
    </div>
  );
}
