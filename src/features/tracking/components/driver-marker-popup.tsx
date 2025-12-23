'use client';

import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Clock, Navigation, Battery, Gauge } from 'lucide-react';

interface DriverLocation {
  id: string;
  userId: string;
  currentLat: number;
  currentLng: number;
  lastLocationUpdate: string;
  isOnDuty: boolean;
  isMoving: boolean;
  speed: number | null;
  heading: number | null;
  batteryLevel: number | null;
  accuracy: number | null;
  user: {
    name: string;
    phone: string;
  };
}

interface DriverMarkerPopupProps {
  driver: DriverLocation;
}

export function DriverMarkerPopup({ driver }: DriverMarkerPopupProps) {
  const lastUpdateTime = new Date(driver.lastLocationUpdate);
  const timeAgo = formatDistanceToNow(lastUpdateTime, { addSuffix: true });

  return (
    <div className="p-2 min-w-[250px]">
      {/* Driver Info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{driver.user.name}</h3>
            <p className="text-xs text-muted-foreground">{driver.user.phone}</p>
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
            <div className="font-medium">{driver.isMoving ? 'Moving' : 'Idle'}</div>
          </div>
        </div>

        {/* Speed */}
        {driver.speed !== null && (
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">Speed</div>
              <div className="font-medium">{Math.round(driver.speed)} km/h</div>
            </div>
          </div>
        )}

        {/* Battery */}
        {driver.batteryLevel !== null && (
          <div className="flex items-center gap-2">
            <Battery className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">Battery</div>
              <div className="font-medium">{driver.batteryLevel}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Accuracy */}
      {driver.accuracy !== null && (
        <div className="mt-3 pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            GPS Accuracy: <span className="font-medium text-foreground">±{Math.round(driver.accuracy)}m</span>
          </div>
        </div>
      )}

      {/* Coordinates */}
      <div className="mt-2 pt-2 border-t">
        <div className="text-xs text-muted-foreground">
          Coordinates: {driver.currentLat.toFixed(6)}, {driver.currentLng.toFixed(6)}
        </div>
      </div>
    </div>
  );
}
