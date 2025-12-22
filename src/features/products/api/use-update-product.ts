import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';
import { UpdateProductInput } from '../schema';

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ param, json }: { param: { id: string }, json: UpdateProductInput }) => {
      const response = await client.api.products[':id'].$patch({
        param,
        json,
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || 'Failed to update product');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast.success('Product updated successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // @ts-ignore
      queryClient.invalidateQueries({ queryKey: ['product', data.data.id] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update product', {
        description: error.message,
      });
    },
  });
};
