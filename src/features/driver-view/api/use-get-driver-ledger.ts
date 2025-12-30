
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';

export const useGetDriverLedger = () => {
  return useQuery({
    queryKey: ['driver-ledger'],
    queryFn: async () => {
      const response = await client.api.drivers['me']['ledger'].$get();
      if (!response.ok) {
        throw new Error('Failed to fetch ledger');
      }
      const { data } = await response.json();
      return data;
    },
  });
};
