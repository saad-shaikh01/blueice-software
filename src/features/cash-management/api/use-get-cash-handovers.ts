import { CashHandoverStatus } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

interface UseGetCashHandoversProps {
  status?: CashHandoverStatus;
  driverId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const useGetCashHandovers = (params: UseGetCashHandoversProps = {}) => {
  const { status, driverId, startDate, endDate, page = 1, limit = 20 } = params;

  return useQuery({
    queryKey: ['cash-handovers', status, driverId, startDate, endDate, page, limit],
    queryFn: async () => {
      const response = await client.api['cash-management'].$get({
        query: {
          ...(status && { status }),
          ...(driverId && { driverId }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          page: page.toString(),
          limit: limit.toString(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cash handovers');
      }

      return await response.json();
    },
  });
};
