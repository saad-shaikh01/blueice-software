import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';

export const useGetActiveDrivers = () => {
  return useQuery({
    queryKey: ['active-drivers'],
    queryFn: async () => {
      const response = await client.api.tracking.$get();

      if (!response.ok) {
        throw new Error('Failed to fetch active drivers');
      }

      return await response.json();
    },
    refetchInterval: 30000, // Poll every 30s as fallback
  });
};
