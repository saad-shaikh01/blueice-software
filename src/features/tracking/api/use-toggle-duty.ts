import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/hono';
import { toast } from 'sonner';

export const useToggleDuty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ driverId, isOnDuty }: { driverId: string; isOnDuty: boolean }) => {
      const response = await client.api.tracking[':driverId']['duty-status'].$patch({
        param: { driverId },
        json: { isOnDuty },
      });

      if (!response.ok) {
        const error = await response.json();
          // @ts-expect-error - Hono client types inference
        throw new Error(error.error || 'Failed to update duty status');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['live-locations'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
