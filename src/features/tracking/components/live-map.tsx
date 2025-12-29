'use client';

import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

import { useLiveLocations } from '../api/use-live-locations';
import { DriverSidebar } from './driver-sidebar';

interface LiveMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  showSidebar?: boolean;
}

const LiveMapCore = dynamic(() => import('./live-map-core'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg border bg-muted/20">
      <Skeleton className="h-full w-full" />
    </div>
  ),
});

export function LiveMap({ showSidebar = true, ...mapProps }: LiveMapProps) {
  const { data: drivers, isLoading, error } = useLiveLocations();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [fitAllTrigger, setFitAllTrigger] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleDriverSelect = (driver: { driverId: string }) => {
    setSelectedDriverId(driver.driverId);
  };

  const handleFitAllDrivers = () => {
    setFitAllTrigger((prev) => prev + 1);
    setSelectedDriverId(null);
  };

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-destructive bg-destructive/10"
        style={{ height: mapProps.height || '600px' }}
      >
        <div className="text-center">
          <p className="text-sm font-medium text-destructive">Failed to load live locations</p>
          <p className="text-xs text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !drivers) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-muted/20" style={{ height: mapProps.height || '600px' }}>
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading live locations...</p>
        </div>
      </div>
    );
  }

  if (!showSidebar) {
    return (
      <LiveMapCore
        {...mapProps}
        drivers={drivers}
        selectedDriverId={selectedDriverId}
        onDriverSelect={setSelectedDriverId}
        fitAllTrigger={fitAllTrigger}
      />
    );
  }

  return (
    <div className="flex h-full w-full gap-0">
      {/* Driver Sidebar */}
      <DriverSidebar
        drivers={drivers as any}
        selectedDriverId={selectedDriverId}
        onDriverSelect={handleDriverSelect}
        onFitAllDrivers={handleFitAllDrivers}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Map */}
      <div className="flex-1">
        <LiveMapCore
          {...mapProps}
          drivers={drivers}
          selectedDriverId={selectedDriverId}
          onDriverSelect={setSelectedDriverId}
          fitAllTrigger={fitAllTrigger}
        />
      </div>
    </div>
  );
}
