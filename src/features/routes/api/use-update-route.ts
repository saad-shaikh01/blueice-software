import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';
import { UpdateRouteInput } from '../schema';

export const useUpdateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ param, json }: { param: { id: string }, json: UpdateRouteInput }) => {
      const response = await client.api.routes[':id'].$patch({
        param,
        json,
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || 'Failed to update route');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast.success('Route updated successfully');
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      // @ts-ignore
      queryClient.invalidateQueries({ queryKey: ['route', data.data.id] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update route', {
        description: error.message,
      });
    },
  });
};
