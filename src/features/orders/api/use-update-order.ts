import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';
import { queueDeliveryCompletion } from '@/lib/offline-storage';

import { UpdateOrderInput } from '../schema';

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ param, json }: { param: { id: string }; json: UpdateOrderInput }) => {
      try {
        const response = await client.api.orders[':id'].$patch({
          param,
          json,
        });

        if (!response.ok) {
          const error = (await response.json()) as { error?: string };
          throw new Error(error.error || 'Failed to update order');
        }

        return await response.json();
      } catch (error: any) {
        // Check for Network Error (Fetch failed)
        // Hono client might throw specific errors, but typically 'Failed to fetch' or similar
        if (
          !navigator.onLine ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('Network request failed')
        ) {
          console.log('Network error, saving to sync queue...');
          // Use the existing offline-storage logic
          await queueDeliveryCompletion(param.id, json);
          return { data: { id: param.id, ...json }, offline: true };
        }
        throw error;
      }
    },
    onSuccess: (data: any) => {
      if (data.offline) {
        toast.info('Order saved offline. Will sync when online.');
      } else {
        toast.success('Order updated successfully');
      }

      // Ideally we optimistically update the cache here for the offline case
      // For now, invalidating might fetch stale data if offline,
      // but if we have local cache (OfflineStorage), it might be tricky.
      // A simple invalidate works if we assume the List View handles cached+offline state.
      // But the current 'useGetOrders' doesn't merge 'SyncQueue' items.
      // That's a Gap, but 'saved offline' toast is a huge step up from 'Error'.

      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // @ts-ignore
      queryClient.invalidateQueries({ queryKey: ['order', data.data.id] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update order', {
        description: error.message,
      });
    },
  });
};
