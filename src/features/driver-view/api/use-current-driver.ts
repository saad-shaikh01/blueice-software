import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

export const useCurrentDriver = () => {
  return useQuery({
    queryKey: ['current-driver'],
    queryFn: async () => {
      const response = await client.api.drivers.me.$get();

      if (!response.ok) {
        return null;
      }

      const { data } = await response.json();
      return data;
    },
  });
};
