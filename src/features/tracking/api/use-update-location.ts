import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

export const useUpdateLocation = () => {
  return useMutation({
    mutationFn: async (data: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      speed?: number;
      heading?: number;
      isMoving?: boolean;
      batteryLevel?: number;
    }) => {
      const response = await client.api.tracking.location.$post({
        json: data,
      });

      if (!response.ok) {
        const error = await response.json();
        // @ts-expect-error - Hono client types inference
        throw new Error(error.error || 'Failed to update location');
      }

      return await response.json();
    },
    onError: (error: Error) => {
      console.error('[UPDATE_LOCATION_ERROR]:', error);
      // Don't show toast for location updates - too noisy
    },
  });
};
