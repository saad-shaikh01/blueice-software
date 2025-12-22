import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';
import { CreateDriverInput } from '../schema';

export const useCreateDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (json: CreateDriverInput) => {
      const response = await client.api.drivers.$post({
        json: {
          ...json,
          email: json.email ?? undefined,
        },
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || 'Failed to create driver');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success('Driver created successfully');
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to create driver', {
        description: error.message,
      });
    },
  });
};
