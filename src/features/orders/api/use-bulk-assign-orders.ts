import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';
import { BulkAssignInput } from '../schema';

export const useBulkAssignOrders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (json: BulkAssignInput) => {
      const response = await client.api.orders['bulk-assign'].$post({
        json,
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || 'Failed to assign orders');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // @ts-ignore
      const count = data.data.count;
      toast.success(`${count} orders assigned successfully`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to assign orders', {
        description: error.message,
      });
    },
  });
};
