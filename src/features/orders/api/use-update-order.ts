import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';
import { UpdateOrderInput } from '../schema';

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ param, json }: { param: { id: string }, json: UpdateOrderInput }) => {
      const response = await client.api.orders[':id'].$patch({
        param,
        json,
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || 'Failed to update order');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast.success('Order updated successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // @ts-ignore
      queryClient.invalidateQueries({ queryKey: ['order', data.data.id] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update order', {
        description: error.message,
      });
    },
  });
};
