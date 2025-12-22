import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';

export const useGetCustomer = (id: string) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const response = await client.api.customers[':id'].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer');
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!id,
  });
};
