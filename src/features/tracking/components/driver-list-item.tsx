'use client';

import { formatDistanceToNow } from 'date-fns';
import { Battery, Car, Clock, MapPin, Navigation } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  isMoving?: boolean;
  batteryLevel?: number;
  currentOrder: unknown;
}

interface DriverListItemProps {
  driver: DriverLocation;
  isSelected?: boolean;
  onClick: () => void;
}

export function DriverListItem({ driver, isSelected, onClick }: DriverListItemProps) {
  const lastUpdateTime = driver.lastUpdate ? new Date(driver.lastUpdate) : null;
  const timeAgo = lastUpdateTime ? formatDistanceToNow(lastUpdateTime, { addSuffix: true }) : 'N/A';

  // Calculate battery status
  const batteryLevel = driver.batteryLevel ?? 100;
  const batteryColor = batteryLevel > 50 ? 'text-green-500' : batteryLevel > 20 ? 'text-yellow-500' : 'text-red-500';

  // Movement status
  const isMoving = driver.isMoving ?? false;
  const movementColor = isMoving ? 'text-green-500' : 'text-gray-400';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border p-3 text-left transition-all hover:border-primary hover:bg-accent/50',
        isSelected && 'border-primary bg-accent ring-2 ring-primary/20',
      )}
    >
      {/* Header: Name + Status Badge */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{driver.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{driver.phoneNumber}</p>
        </div>
        <Badge variant={driver.isOnDuty ? 'default' : 'secondary'} className="shrink-0 text-xs">
          {driver.isOnDuty ? 'On Duty' : 'Off Duty'}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="space-y-1.5">
        {/* Vehicle */}
        {driver.vehicleNo && (
          <div className="flex items-center gap-2 text-xs">
            <Car className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{driver.vehicleNo}</span>
          </div>
        )}

        {/* Movement + Battery */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Navigation className={cn('h-3.5 w-3.5', movementColor)} />
            <span className={movementColor}>{isMoving ? 'Moving' : 'Idle'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Battery className={cn('h-3.5 w-3.5', batteryColor)} />
            <span className={batteryColor}>{batteryLevel}%</span>
          </div>
        </div>

        {/* Last Update */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{timeAgo}</span>
        </div>

        {/* Coordinates */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">
            {driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Active pulse indicator if moving */}
      {isMoving && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="relative h-2 w-2">
              <div className="absolute h-2 w-2 animate-ping rounded-full bg-green-500 opacity-75"></div>
              <div className="relative h-2 w-2 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
          </div>
        </div>
      )}
    </button>
  );
}
