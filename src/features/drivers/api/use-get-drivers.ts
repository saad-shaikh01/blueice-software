import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import { client } from '@/lib/hono';

interface UseGetDriversProps {
  search?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export const useGetDrivers = (props?: UseGetDriversProps) => {
  const searchParams = useSearchParams();

  // Use props if provided, otherwise fallback to URL params (for Drivers page)
  // If props is an empty object {}, we shouldn't fallback to URL params if we want "all drivers"
  // So we check if props is undefined.

  const search = props?.search !== undefined ? props.search : searchParams.get('search') || undefined;
  const page = props?.page !== undefined ? props.page : (searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1);
  const limit = props?.limit !== undefined ? props.limit : (searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20);
  const enabled = props?.enabled !== undefined ? props.enabled : true;

  return useQuery({
    queryKey: ['drivers', { search, page, limit }],
    queryFn: async () => {
      const response = await client.api.drivers.$get({
        query: {
          search,
          page: page.toString(),
          limit: limit.toString(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }

      return await response.json();
    },
    enabled,
  });
};
