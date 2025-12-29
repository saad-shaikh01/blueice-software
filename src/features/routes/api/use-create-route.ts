import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

import { CreateRouteInput } from '../schema';

export const useCreateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (json: CreateRouteInput) => {
      const response = await client.api.routes.$post({
        json,
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || 'Failed to create route');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success('Route created successfully');
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to create route', {
        description: error.message,
      });
    },
  });
};
