import { useMutation } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<(typeof client.api.auth)['profile']['$patch'], 200>;
type RequestType = InferRequestType<(typeof client.api.auth)['profile']['$patch']>;

export const useUpdateProfile = () => {
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ form }) => {
      const response = await client.api.auth['profile']['$patch']({ form });

      if (!response.ok) throw new Error('Failed to update Profile.');

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success('Profile updated.');
    },
    onError: (error) => {
      console.error('[UPDATE_Profile]: ', error);

      toast.error('Failed to update Profile.');
    },
  });

  return mutation;
};
