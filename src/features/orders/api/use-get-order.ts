import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';

export const useGetOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await client.api.orders[':id'].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!id,
  });
};
