import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';
import { CreateOrderInput } from '../schema';

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (json: CreateOrderInput) => {
      const response = await client.api.orders.$post({
        json,
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || 'Failed to create order');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success('Order created successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to create order', {
        description: error.message,
      });
    },
  });
};
