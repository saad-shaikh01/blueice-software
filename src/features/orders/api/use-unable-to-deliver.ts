import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<typeof client.api.orders[':id']['unable-to-deliver']['$post']>;
type RequestType = InferRequestType<typeof client.api.orders[':id']['unable-to-deliver']['$post']>['json'];

export const useUnableToDeliver = (orderId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.orders[':id']['unable-to-deliver'].$post({
        param: { id: orderId },
        json,
      });

      if (!response.ok) {
        const errorData: any = await response.json();
        throw new Error(errorData?.error || 'Failed to process request');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success('Order updated successfully');

      // Invalidate orders list to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to process request');
    },
  });

  return mutation;
};
