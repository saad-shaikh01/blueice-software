import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

export const useGetDriverStats = () => {
  return useQuery({
    queryKey: ['driver-stats'],
    queryFn: async () => {
      const response = await client.api.drivers.me.stats.$get();
      if (!response.ok) throw new Error('Failed to fetch stats');
      const { data } = await response.json();
      return data;
    },
  });
};
