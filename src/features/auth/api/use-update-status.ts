import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<(typeof client.api.auth)[':userId']['$patch'], 200>;
type RequestType = InferRequestType<(typeof client.api.auth)[':userId']['$patch']>;

export const useUpdateStatus = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.auth[':userId']['$patch']({ param, json });

      if (!response.ok) throw new Error('Failed to update Status.');

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success('Status updated.');

      queryClient.invalidateQueries({
        queryKey: ['users'],
        exact: true,
      });
    },
    onError: (error) => {
      console.error('[UPDATE_Status]: ', error);

      toast.error('Failed to update Status.');
    },
  });

  return mutation;
};
