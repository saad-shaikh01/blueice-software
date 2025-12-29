import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

import { UpdateDriverInput } from '../schema';

export const useUpdateDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ param, json }: { param: { id: string }; json: UpdateDriverInput }) => {
      const response = await client.api.drivers[':id'].$patch({
        param,
        json,
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || 'Failed to update driver');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast.success('Driver updated successfully');
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      // @ts-ignore
      queryClient.invalidateQueries({ queryKey: ['driver', data.data.id] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update driver', {
        description: error.message,
      });
    },
  });
};
