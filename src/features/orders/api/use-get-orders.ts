import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { client } from '@/lib/hono';
import { OrderStatus } from '@prisma/client';

export const useGetOrders = () => {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || undefined;
  const status = searchParams.get('status') as OrderStatus || undefined;
  const date = searchParams.get('date') || undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

  return useQuery({
    queryKey: ['orders', { search, status, date, page, limit }],
    queryFn: async () => {
      const response = await client.api.orders.$get({
        query: {
          search,
          status,
          date,
          page: page.toString(),
          limit: limit.toString(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      return await response.json();
    },
  });
};
