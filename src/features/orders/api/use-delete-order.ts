import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ param }: { param: { id: string } }) => {
      const response = await client.api.orders[':id'].$delete({
        param,
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || 'Failed to delete order');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success('Order deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to delete order', {
        description: error.message,
      });
    },
  });
};
