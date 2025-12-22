import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import { client } from '@/lib/hono';

export const useGetProducts = () => {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || undefined;

  return useQuery({
    queryKey: ['products', { search }],
    queryFn: async () => {
      const response = await client.api.products.$get({
        query: { search },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const { data } = await response.json();
      return data;
    },
  });
};
