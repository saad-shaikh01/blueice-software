/**
 * Geocoding utilities using OpenStreetMap's Nominatim API
 * Free and no API key required (with fair usage limits)
 */

export interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

/**
 * Forward geocoding: Convert address to coordinates
 * @param address - Full address string (e.g., "Gulshan Block 4, Karachi")
 * @param countryCode - Optional country code for better results (e.g., "pk" for Pakistan)
 * @returns Coordinates and formatted address
 */
export async function geocodeAddress(address: string, countryCode: string = 'pk'): Promise<GeocodingResult | null> {
  if (!address || address.trim().length < 3) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      addressdetails: '1',
      limit: '1',
      countrycodes: countryCode,
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        'User-Agent': 'Blue Ice CRM Water Supply App', // Required by Nominatim
      },
    });

    if (!response.ok) {
      console.error('Geocoding API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name,
        address: result.address,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocoding: Convert coordinates to address
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Address information
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: {
        'User-Agent': 'Blue Ice CRM Water Supply App',
      },
    });

    if (!response.ok) {
      console.error('Reverse geocoding API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data && data.lat && data.lon) {
      return {
        lat: parseFloat(data.lat),
        lon: parseFloat(data.lon),
        display_name: data.display_name,
        address: data.address,
      };
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Format address from geocoding result
 * @param result - Geocoding result
 * @returns Formatted address string
 */
export function formatAddress(result: GeocodingResult): string {
  const { address } = result;
  if (!address) {
    return result.display_name;
  }

  const parts = [address.road, address.suburb, address.city, address.state].filter(Boolean);

  return parts.join(', ') || result.display_name;
}

/**
 * Extract area/locality from geocoding result
 * @param result - Geocoding result
 * @returns Area name
 */
export function extractArea(result: GeocodingResult): string {
  return result.address?.suburb || result.address?.city || '';
}
