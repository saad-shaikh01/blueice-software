import { client } from '@/lib/hono';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

export const useGetCustomers = () => {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

  return useQuery({
    queryKey: ['customers', { search, page, limit }],
    queryFn: async () => {
      const response = await client.api.customers.$get({
        query: {
          search,
          page: page.toString(),
          limit: limit.toString(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      return await response.json();
    },
  });
};
