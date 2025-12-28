import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';

export const useGetInvoiceData = (id: string) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await client.api.orders[':id'].invoice.$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice data');
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!id,
  });
};
