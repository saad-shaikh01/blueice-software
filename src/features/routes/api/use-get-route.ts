import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

export const useGetRoute = (id: string) => {
  return useQuery({
    queryKey: ['route', id],
    queryFn: async () => {
      const response = await client.api.routes[':id'].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!id,
  });
};
