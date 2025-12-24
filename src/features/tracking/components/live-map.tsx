'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetActiveDrivers } from '../api/use-get-active-drivers';

interface LiveMapProps {
  initialCenter?: { lat: number; lng: number };
}

const containerStyle = {
  width: '100%',
  height: '600px'
};

const defaultCenter = {
  lat: 24.8607,
  lng: 67.0011 // Karachi
};

export const LiveMap = ({ initialCenter }: LiveMapProps) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const { data: driversData, refetch, isRefetching } = useGetActiveDrivers();

  const [center, setCenter] = useState(initialCenter || defaultCenter);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (!isLoaded) return <div className="h-[600px] flex items-center justify-center bg-muted"><Loader2 className="animate-spin" /></div>;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="shadow-md bg-white hover:bg-gray-100 text-black"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 bg-white p-2 rounded-lg shadow-md max-w-xs">
        <h3 className="font-semibold text-sm mb-1">Active Drivers: {driversData?.count || 0}</h3>
        <p className="text-xs text-muted-foreground">
          Last updated: {driversData?.lastUpdate ? new Date(driversData.lastUpdate).toLocaleTimeString() : 'Never'}
        </p>
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
      >
        {driversData?.drivers?.map((driver: any) => (
          <Marker
            key={driver.driverId}
            position={{ lat: driver.latitude, lng: driver.longitude }}
            onClick={() => setSelectedDriver(driver)}
            icon={{
              url: driver.isOnDuty ? '/marker-active.png' : '/marker-inactive.png',
              scaledSize: new window.google.maps.Size(32, 32)
            }}
          />
        ))}

        {selectedDriver && (
          <InfoWindow
            position={{ lat: selectedDriver.latitude, lng: selectedDriver.longitude }}
            onCloseClick={() => setSelectedDriver(null)}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-base">{selectedDriver.name}</h3>
              <p className="text-sm text-gray-600">{selectedDriver.vehicleNo}</p>
              <div className="mt-2 border-t pt-2">
                <p className="text-xs">Status: <span className={selectedDriver.isOnDuty ? "text-green-600 font-medium" : "text-gray-500"}>{selectedDriver.isOnDuty ? 'On Duty' : 'Off Duty'}</span></p>
                {selectedDriver.currentOrder && (
                  <div className="mt-1 bg-blue-50 p-1 rounded">
                    <p className="text-xs font-medium text-blue-800">Current Task:</p>
                    <p className="text-xs">Order #{selectedDriver.currentOrder.readableId}</p>
                    <p className="text-xs text-gray-500">{selectedDriver.currentOrder.customerName}</p>
                  </div>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </Card>
  );
};
