'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLiveLocations } from '../api/use-live-locations';
import { DriverMarkerPopup } from './driver-marker-popup';
import { Loader2 } from 'lucide-react';

// Fix default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom driver marker icons based on status
const createDriverIcon = (isOnDuty: boolean, isMoving: boolean) => {
  const color = isOnDuty ? (isMoving ? '#22c55e' : '#3b82f6') : '#94a3b8';

  return L.divIcon({
    className: 'custom-driver-marker',
    html: `
      <div style="position: relative;">
        <div style="
          width: 32px;
          height: 32px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        ${
          isMoving
            ? `<div style="
                position: absolute;
                top: -2px;
                right: -2px;
                width: 12px;
                height: 12px;
                background-color: #22c55e;
                border: 2px solid white;
                border-radius: 50%;
                animation: pulse 2s infinite;
              "></div>`
            : ''
        }
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface LiveMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export function LiveMap({ center = [33.6844, 73.0479], zoom = 12, height = '600px' }: LiveMapProps) {
  const { data: drivers, isLoading, error } = useLiveLocations();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-destructive bg-destructive/10" style={{ height }}>
        <div className="text-center">
          <p className="text-sm font-medium text-destructive">Failed to load live locations</p>
          <p className="text-xs text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-muted/20" style={{ height }}>
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading live locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border shadow-sm" style={{ height }}>
      {/* Legend */}
      <div className="absolute top-4 right-4 z-[1000] bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 space-y-2 text-xs">
        <div className="font-semibold mb-2 text-sm">Driver Status</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Moving (On Duty)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Idle (On Duty)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          <span>Off Duty</span>
        </div>
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="font-medium">Total Drivers: {drivers?.length || 0}</div>
          <div className="text-muted-foreground">
            On Duty: {drivers?.filter((d) => d.isOnDuty).length || 0}
          </div>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {drivers?.map((driver) => (
          <Marker
            key={driver.id}
            position={[driver.currentLat, driver.currentLng]}
            icon={createDriverIcon(driver.isOnDuty, driver.isMoving)}
          >
            <Popup maxWidth={300} className="custom-popup">
              <DriverMarkerPopup driver={driver} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
