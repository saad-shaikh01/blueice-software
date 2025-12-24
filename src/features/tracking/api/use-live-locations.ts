import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';

export const useLiveLocations = () => {
  return useQuery({
    queryKey: ['live-locations'],
    queryFn: async () => {
      const response = await client.api.tracking['live-locations'].$get();

      if (!response.ok) {
        throw new Error('Failed to fetch live locations');
      }

      const data = await response.json();
      return data.data.drivers; // Return the drivers array directly
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000, // Data is fresh for 5 seconds
  });
};
