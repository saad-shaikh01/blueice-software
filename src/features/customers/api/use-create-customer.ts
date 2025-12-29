import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { CreateCustomerInput } from '@/features/customers/schema';
import { client } from '@/lib/hono';

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerInput) => {
      const response = await client.api.customers.$post({
        json: {
          ...data,
          email: data.email ?? undefined,
          manualCode: data.manualCode ?? undefined,
          landmark: data.landmark ?? undefined,
        },
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || 'Failed to create customer');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast.success('Customer created successfully', {
        description: data.message || 'Customer has been added to the system',
      });

      // Invalidate customers list to refresh data
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to create customer', {
        description: error.message,
      });
    },
  });
};
