import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';
import { UpdateCustomerInput } from '../schema';

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ param, json }: { param: { id: string }, json: UpdateCustomerInput }) => {
      const response = await client.api.customers[':id'].$patch({
        param,
        json,
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || 'Failed to update customer');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast.success('Customer updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      // @ts-ignore
      queryClient.invalidateQueries({ queryKey: ['customer', data.data.id] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update customer', {
        description: error.message,
      });
    },
  });
};
