import { OrderStatus } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import { client } from '@/lib/hono';

interface UseGetOrdersProps {
  driverId?: string;
  status?: OrderStatus;
  date?: string;
}

export const useGetOrders = (props?: UseGetOrdersProps) => {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || undefined;
  const status = props?.status || (searchParams.get('status') as OrderStatus) || undefined;
  const date = props?.date || searchParams.get('date') || undefined;
  const driverId = props?.driverId || searchParams.get('driverId') || undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

  return useQuery({
    queryKey: ['orders', { search, status, date, driverId, page, limit }],
    queryFn: async () => {
      const response = await client.api.orders.$get({
        query: {
          search,
          status,
          date,
          driverId,
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
