'use client';

import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';

import { reverseGeocode } from '@/lib/geocoding';

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

interface EnhancedLocationMapPickerProps {
  lat?: number | null;
  lng?: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressReverse?: (address: string, area: string) => void;
  height?: string;
  enableReverseGeocoding?: boolean;
  enableSearch?: boolean;
  enableDragging?: boolean;
}

// Map controller for handling search and fly-to functionality
interface MapControllerProps {
  lat?: number | null;
  lng?: number | null;
  enableSearch?: boolean;
  onLocationSelect: (lat: number, lng: number) => void;
  enableReverseGeocoding?: boolean;
  onAddressReverse?: (address: string, area: string) => void;
}

function MapController({ lat, lng, enableSearch = true, onLocationSelect, enableReverseGeocoding, onAddressReverse }: MapControllerProps) {
  const map = useMap();
  const searchControlRef = useRef<any>(null);

  // Add search control
  useEffect(() => {
    if (!enableSearch || searchControlRef.current) return;

    const provider = new OpenStreetMapProvider({
      params: {
        countrycodes: 'pk', // Limit to Pakistan for better results
        addressdetails: 1,
      },
    });

    // @ts-ignore - leaflet-geosearch types are incomplete
    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: false, // We'll handle markers ourselves
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: false,
      searchLabel: 'Search for a location...',
    });

    map.addControl(searchControl);
    searchControlRef.current = searchControl;

    // Listen for search result
    map.on('geosearch/showlocation', async (e: any) => {
      const { x, y, label } = e.location;
      onLocationSelect(y, x); // Leaflet uses [lat, lng]

      // Optionally reverse geocode to get structured address
      if (enableReverseGeocoding && onAddressReverse) {
        const result = await reverseGeocode(y, x);
        if (result) {
          const area = result.address?.suburb || result.address?.city || '';
          onAddressReverse(label, area);
        }
      }
    });

    return () => {
      if (searchControlRef.current) {
        map.removeControl(searchControlRef.current);
        searchControlRef.current = null;
      }
    };
  }, [map, enableSearch, onLocationSelect, enableReverseGeocoding, onAddressReverse]);

  // Fly to coordinates when they change externally
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 16, {
        duration: 0.8,
        easeLinearity: 0.25,
      });
    }
  }, [lat, lng, map]);

  return null;
}

// Draggable marker component
interface DraggableMarkerProps {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
  enableDragging?: boolean;
  enableReverseGeocoding?: boolean;
  onAddressReverse?: (address: string, area: string) => void;
}

function DraggableMarker({
  position,
  onPositionChange,
  enableDragging = true,
  enableReverseGeocoding,
  onAddressReverse,
}: DraggableMarkerProps) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const handleDragEnd = async () => {
      const newPos = marker.getLatLng();
      onPositionChange(newPos.lat, newPos.lng);

      // Optionally reverse geocode when marker is dragged
      if (enableReverseGeocoding && onAddressReverse) {
        const result = await reverseGeocode(newPos.lat, newPos.lng);
        if (result) {
          const formattedAddress = [result.address?.road, result.address?.suburb, result.address?.city].filter(Boolean).join(', ');

          const area = result.address?.suburb || result.address?.city || '';

          onAddressReverse(formattedAddress || result.display_name, area);
        }
      }
    };

    marker.on('dragend', handleDragEnd);

    return () => {
      marker.off('dragend', handleDragEnd);
    };
  }, [onPositionChange, enableReverseGeocoding, onAddressReverse]);

  return <Marker position={position} icon={icon} draggable={enableDragging} ref={markerRef} />;
}

export const EnhancedLocationMapPicker = ({
  lat,
  lng,
  onLocationSelect,
  onAddressReverse,
  height = '400px',
  enableReverseGeocoding = false,
  enableSearch = true,
  enableDragging = true,
}: EnhancedLocationMapPickerProps) => {
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
    <div className="space-y-2">
      {/* Instructions */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/20">
        <p className="font-medium text-blue-900 dark:text-blue-100">Smart Location Picker</p>
        <ul className="mt-1 space-y-0.5 text-xs text-blue-700 dark:text-blue-300">
          {enableSearch && <li>• Use the search box to find a location by name or address</li>}
          {enableDragging && <li>• Drag the marker to fine-tune the exact position</li>}
          <li>• The address field above will auto-update as you move the marker</li>
        </ul>
      </div>

      {/* Map */}
      <div className="relative overflow-hidden rounded-lg border" style={{ height }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} zoomControl={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController
            lat={lat}
            lng={lng}
            enableSearch={enableSearch}
            onLocationSelect={handleLocationSelect}
            enableReverseGeocoding={enableReverseGeocoding}
            onAddressReverse={onAddressReverse}
          />

          <DraggableMarker
            position={position}
            onPositionChange={handleLocationSelect}
            enableDragging={enableDragging}
            enableReverseGeocoding={enableReverseGeocoding}
            onAddressReverse={onAddressReverse}
          />
        </MapContainer>

        {/* Coordinates Display */}
        <div className="absolute bottom-3 left-3 z-[1000] rounded-md bg-white/90 px-3 py-1.5 font-mono text-xs shadow-md backdrop-blur-sm dark:bg-gray-800/90">
          <span className="font-semibold">Location:</span> {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </div>
      </div>
    </div>
  );
};
