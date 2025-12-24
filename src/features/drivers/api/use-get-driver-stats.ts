import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';

interface UseGetDriverStatsProps {
  driverId: string;
  startDate?: string;
  endDate?: string;
}

export const useGetDriverStats = ({ driverId, startDate, endDate }: UseGetDriverStatsProps) => {
  return useQuery({
    queryKey: ['driver-stats', driverId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await client.api.drivers[':id'].stats.$get({
        param: { id: driverId },
        query: startDate || endDate ? { startDate, endDate } : undefined,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch driver statistics');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!driverId,
  });
};
