'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Navigation } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

import { Button } from '@/components/ui/button';

interface DeliveryMapCoreProps {
  orders: any[];
  driverLocation?: { lat: number; lng: number } | null;
}

// Function to create a numbered marker icon
const createNumberIcon = (number: number, isCompleted: boolean) => {
  const color = isCompleted ? '#22c55e' : '#3b82f6'; // Green if done, Blue if pending

  return L.divIcon({
    className: 'custom-number-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">
        ${number}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

const createDriverIcon = () => {
  return L.divIcon({
    className: 'driver-marker',
    html: `
      <div style="
        background-color: #f59e0b;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export default function DeliveryMapCore({ orders, driverLocation }: DeliveryMapCoreProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Leaflet icon fix
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
    setMounted(true);
  }, []);

  if (!mounted) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;

  // Filter orders with valid coordinates
  const validOrders = orders.filter(o => o.customer.geoLat && o.customer.geoLng);

  // Calculate center: Driver location > First Order > Default Karachi
  const center: [number, number] = driverLocation
    ? [driverLocation.lat, driverLocation.lng]
    : validOrders.length > 0
      ? [validOrders[0].customer.geoLat, validOrders[0].customer.geoLng]
      : [24.8607, 67.0011];

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border shadow-sm">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Driver Location */}
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={createDriverIcon()}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* Order Markers */}
        {validOrders.map((order, index) => (
          <Marker
            key={order.id}
            position={[order.customer.geoLat, order.customer.geoLng]}
            icon={createNumberIcon(index + 1, order.status === 'COMPLETED')}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-sm">#{index + 1}. {order.customer.user.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{order.customer.address}</p>
                <div className="flex gap-2">
                   <Button
                    size="sm"
                    className="h-8 w-full text-xs"
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.customer.geoLat},${order.customer.geoLng}`, '_blank')}
                   >
                     <Navigation className="mr-1 h-3 w-3" /> Navigate
                   </Button>
                   {/* Link to order details could go here */}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
