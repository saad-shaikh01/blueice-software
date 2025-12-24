import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';

export const useGetCashStats = () => {
  return useQuery({
    queryKey: ['cash-dashboard-stats'],
    queryFn: async () => {
      const response = await client.api['cash-management'].stats.$get();

      if (!response.ok) {
        throw new Error('Failed to fetch cash statistics');
      }

      const data = await response.json();
      return data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
