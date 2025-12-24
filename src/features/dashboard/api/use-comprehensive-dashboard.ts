import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';

interface UseComprehensiveDashboardProps {
  startDate?: string;
  endDate?: string;
}

export const useComprehensiveDashboard = (params: UseComprehensiveDashboardProps = {}) => {
  const { startDate, endDate } = params;

  return useQuery({
    queryKey: ['comprehensive-dashboard', startDate, endDate],
    queryFn: async () => {
      const response = await client.api.dashboard.comprehensive.$get({
        query: {
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comprehensive dashboard data');
      }

      const data = await response.json();
      return data.data;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every minute
  });
};
