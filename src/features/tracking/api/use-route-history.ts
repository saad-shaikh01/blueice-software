import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

export const useRouteHistory = (driverId: string, date: string, enabled = true) => {
  return useQuery({
    queryKey: ['route-history', driverId, date],
    queryFn: async () => {
      const response = await client.api.tracking[':driverId']['route-history'].$get({
        param: { driverId },
        query: { date },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch route history');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: enabled && !!driverId && !!date,
  });
};
