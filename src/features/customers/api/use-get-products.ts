import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

/**
 * Hook to fetch products for bottle wallet selection
 * TODO: Create products API endpoint
 * For now, returns mock data structure
 */
export const useGetProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // TODO: Replace with actual API call when products endpoint is ready
      // const response = await client.api.products.$get();
      // if (!response.ok) throw new Error('Failed to fetch products');
      // const data = await response.json();
      // return data.data;

      // Mock data for now
      return [
        { id: '1', name: '19L Mineral Water', sku: 'MW-19L' },
        { id: '2', name: '5L Mineral Water', sku: 'MW-5L' },
        { id: '3', name: 'Dispenser (Hot & Cold)', sku: 'DISP-HC' },
      ];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
