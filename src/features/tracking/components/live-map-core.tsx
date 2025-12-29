'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

import { useLiveLocations } from '../api/use-live-locations';
import { DriverMarkerPopup } from './driver-marker-popup';

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
  batteryLevel?: number | null;
  speed?: number | null;
  currentOrder: unknown;
}

interface LiveMapCoreProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  selectedDriverId?: string | null;
  onDriverSelect?: (driverId: string | null) => void;
  fitAllTrigger?: number;
  drivers: DriverLocation[];
}

// Map controller component for handling fly-to and fit bounds
interface MapControllerProps {
  selectedDriverId: string | null;
  drivers: DriverLocation[];
  fitAllTrigger: number;
}

function MapController({ selectedDriverId, drivers, fitAllTrigger }: MapControllerProps) {
  const map = useMap();
  const prevSelectedDriverRef = useRef<string | null>(null);

  // Fly to selected driver
  useEffect(() => {
    if (selectedDriverId && selectedDriverId !== prevSelectedDriverRef.current) {
      const driver = drivers.find((d) => d.driverId === selectedDriverId);
      if (driver) {
        map.flyTo([driver.latitude, driver.longitude], 16, {
          duration: 0.8,
          easeLinearity: 0.25,
        });
      }
      prevSelectedDriverRef.current = selectedDriverId;
    }
  }, [selectedDriverId, drivers, map]);

  // Fit all drivers
  useEffect(() => {
    if (fitAllTrigger > 0 && drivers.length > 0) {
      const bounds = L.latLngBounds(drivers.map((d) => [d.latitude, d.longitude]));
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
        duration: 0.8,
      });
    }
  }, [fitAllTrigger, drivers, map]);

  // Initial fit bounds on mount
  useEffect(() => {
    if (drivers.length > 0) {
      const bounds = L.latLngBounds(drivers.map((d) => [d.latitude, d.longitude]));
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  return null;
}

// Custom driver marker icons based on status
const createDriverIcon = (isOnDuty: boolean, isMoving: boolean, isSelected: boolean) => {
  const color = isOnDuty ? (isMoving ? '#22c55e' : '#3b82f6') : '#94a3b8';
  const borderColor = isSelected ? '#f59e0b' : 'white';
  const borderWidth = isSelected ? '4px' : '3px';

  return L.divIcon({
    className: 'custom-driver-marker',
    html: `
      <div style="position: relative;">
        <div style="
          width: 32px;
          height: 32px;
          background-color: ${color};
          border: ${borderWidth} solid ${borderColor};
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          ${isSelected ? 'transform: scale(1.15);' : ''}
          transition: all 0.2s ease;
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
        ${
          isSelected
            ? `<div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 48px;
                height: 48px;
                border: 2px solid #f59e0b;
                border-radius: 50%;
                animation: ripple 1.5s infinite;
                pointer-events: none;
              "></div>`
            : ''
        }
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      </style>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function LiveMapCore({
  center = [33.6844, 73.0479],
  zoom = 12,
  height = '600px',
  selectedDriverId = null,
  onDriverSelect,
  fitAllTrigger = 0,
  drivers,
}: LiveMapCoreProps) {
  const [mounted, setMounted] = useState(false);
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    // Fix default marker icons in Leaflet
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
    setMounted(true);
  }, []);

  // Auto-open popup when driver is selected
  useEffect(() => {
    if (selectedDriverId && markerRefs.current[selectedDriverId]) {
      markerRefs.current[selectedDriverId].openPopup();
    }
  }, [selectedDriverId]);

  // Memoize driver stats
  const driverStats = useMemo(() => {
    const total = drivers.length;
    const onDuty = drivers.filter((d) => d.isOnDuty).length;
    const moving = drivers.filter((d) => d.isOnDuty && d.isMoving).length;
    return { total, onDuty, moving };
  }, [drivers]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border shadow-sm">
      {/* Legend */}
      <div className="absolute right-4 top-4 z-[1000] space-y-2 rounded-lg bg-white p-3 text-xs shadow-lg dark:bg-gray-900">
        <div className="mb-2 text-sm font-semibold">Driver Status</div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span>Moving (On Duty)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
          <span>Idle (On Duty)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-400"></div>
          <span>Off Duty</span>
        </div>
        <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
          <div className="font-medium">Total: {driverStats.total}</div>
          <div className="text-muted-foreground">On Duty: {driverStats.onDuty}</div>
          <div className="text-muted-foreground">Moving: {driverStats.moving}</div>
        </div>
      </div>

      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} className="z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Map Controller for fly-to and fit bounds */}
        <MapController selectedDriverId={selectedDriverId} drivers={drivers} fitAllTrigger={fitAllTrigger} />

        {/* Driver Markers */}
        {drivers.map((driver) => (
          <Marker
            key={driver.driverId}
            position={[driver.latitude, driver.longitude]}
            icon={createDriverIcon(driver.isOnDuty, driver.isMoving ?? false, selectedDriverId === driver.driverId)}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[driver.driverId] = ref;
              }
            }}
            eventHandlers={{
              click: () => {
                onDriverSelect?.(driver.driverId);
              },
            }}
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
