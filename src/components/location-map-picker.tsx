'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

// Fix for default marker icon in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationMapPickerProps {
  lat?: number | null;
  lng?: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
  height?: string;
}

function LocationMarker({
  position,
  onPositionChange,
}: {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return <Marker position={position} icon={icon} />;
}

export const LocationMapPicker = ({ lat, lng, onLocationSelect, height = '400px' }: LocationMapPickerProps) => {
  // Default to Karachi, Pakistan if no coordinates provided
  const defaultLat = 24.8607;
  const defaultLng = 67.0011;

  const [position, setPosition] = useState<[number, number]>([lat || defaultLat, lng || defaultLng]);
  const [isClient, setIsClient] = useState(false);

  // Only render map on client side (avoid SSR issues with Leaflet)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update position when props change
  useEffect(() => {
    if (lat && lng) {
      setPosition([lat, lng]);
    }
  }, [lat, lng]);

  const handleLocationSelect = (newLat: number, newLng: number) => {
    setPosition([newLat, newLng]);
    onLocationSelect(newLat, newLng);
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-muted" style={{ height }}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <MapPin className="size-8" />
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border" style={{ height }}>
      <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} onPositionChange={handleLocationSelect} />
      </MapContainer>
      <div className="absolute left-3 top-3 z-[1000] rounded-md bg-white p-2 font-mono text-xs shadow-md dark:bg-gray-800">
        Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
      </div>
    </div>
  );
};
