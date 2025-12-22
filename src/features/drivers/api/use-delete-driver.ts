import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

export const useDeleteDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ param }: { param: { id: string } }) => {
      const response = await client.api.drivers[':id'].$delete({
        param,
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || 'Failed to delete driver');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success('Driver deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to delete driver', {
        description: error.message,
      });
    },
  });
};
