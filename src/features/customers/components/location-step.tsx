'use client';

import { Building2, MapPin, Navigation, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { EnhancedLocationMapPicker } from '@/components/enhanced-location-map-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { CreateCustomerInput } from '@/features/customers/schema';
import { useGetRoutes } from '@/features/routes/api/use-get-routes';
import { useDebounce } from '@/hooks/use-debounce';
import { geocodeAddress } from '@/lib/geocoding';

interface Route {
  id: string;
  name: string;
}

export const LocationStep = () => {
  const form = useFormContext<CreateCustomerInput>();
  const { data: routesData } = useGetRoutes();
  const routes = (routesData?.routes as Route[]) || [];

  const [isGeocoding, setIsGeocoding] = useState(false);

  // Watch form fields
  const geoLat = form.watch('geoLat');
  const geoLng = form.watch('geoLng');
  const area = form.watch('area');
  const address = form.watch('address');

  // Debounce address changes to avoid too many API calls
  const debouncedArea = useDebounce(area, 800);
  const debouncedAddress = useDebounce(address, 800);

  // Auto-geocode when address changes
  useEffect(() => {
    const performGeocoding = async () => {
      // Only geocode if we have at least area or address
      const searchQuery = debouncedAddress || debouncedArea;

      if (!searchQuery || searchQuery.trim().length < 3) {
        return;
      }

      setIsGeocoding(true);

      try {
        const result = await geocodeAddress(searchQuery);

        if (result) {
          // Update coordinates
          form.setValue('geoLat', result.lat, { shouldValidate: true });
          form.setValue('geoLng', result.lon, { shouldValidate: true });

          // Optionally update area if it was empty
          if (!area && result.address?.suburb) {
            form.setValue('area', result.address.suburb);
          }
        }
      } catch (error) {
        console.error('Geocoding failed:', error);
      } finally {
        setIsGeocoding(false);
      }
    };

    performGeocoding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedArea, debouncedAddress]);

  const handleLocationSelect = (lat: number, lng: number) => {
    form.setValue('geoLat', lat, { shouldValidate: true });
    form.setValue('geoLng', lng, { shouldValidate: true });
  };

  const handleAddressReverse = (reversedAddress: string, reversedArea: string) => {
    // Only update if fields are empty to avoid overwriting user input
    if (!address && reversedAddress) {
      form.setValue('address', reversedAddress);
    }
    if (!area && reversedArea) {
      form.setValue('area', reversedArea);
    }
  };

  const handleManualGeocode = async () => {
    const searchQuery = address || area;

    if (!searchQuery) {
      return;
    }

    setIsGeocoding(true);

    try {
      const result = await geocodeAddress(searchQuery);

      if (result) {
        form.setValue('geoLat', result.lat, { shouldValidate: true });
        form.setValue('geoLng', result.lon, { shouldValidate: true });
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="size-5" />
            Address Information
          </CardTitle>
          <CardDescription>Enter the customer&apos;s delivery location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area / Locality *</FormLabel>
                <FormControl>
                  <Input placeholder="Gulshan Block 4" {...field} />
                </FormControl>
                <FormDescription>Used for route grouping and filtering</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Address *</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="House 123, Street 5, Gulshan-e-Iqbal" {...field} className="flex-1" />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleManualGeocode}
                    disabled={isGeocoding || (!address && !area)}
                    title="Find this location on map"
                  >
                    {isGeocoding ? <Sparkles className="size-4 animate-pulse" /> : <Navigation className="size-4" />}
                  </Button>
                </div>
                <FormDescription>
                  {isGeocoding ? (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <Sparkles className="size-3 animate-pulse" />
                      Finding location on map...
                    </span>
                  ) : (
                    'Type address and map will auto-update'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="landmark"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nearby Landmark (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Near Madina Masjid" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>Helps drivers locate the address easily</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="floorNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Floor Number</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>0 = Ground floor</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasLift"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-between space-y-2 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Lift Available</FormLabel>
                    <FormDescription>Affects delivery charges for upper floors</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
            <Building2 className="size-5" />
            GPS Coordinates (Optional)
          </CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">Pin exact location for driver navigation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="geoLat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="24.9056"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="geoLng"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="67.0822"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Interactive Map</Label>
            <EnhancedLocationMapPicker
              lat={geoLat ?? undefined}
              lng={geoLng ?? undefined}
              onLocationSelect={handleLocationSelect}
              onAddressReverse={handleAddressReverse}
              height="400px"
              enableSearch={true}
              enableDragging={true}
              enableReverseGeocoding={true}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Route</CardTitle>
          <CardDescription>Assign customer to a delivery route</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="routeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Route</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a route" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Drivers follow this route for delivery</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sequenceOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sequence Number (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g. 10"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </FormControl>
                <FormDescription>Order in which driver visits (1, 2, 3...)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};
