import { useMutation } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<(typeof client.api.auth.token)['$post']>;
type RequestType = InferRequestType<(typeof client.api.auth.token)['$post']>;

export const useToken = () => {
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.auth.token['$post']({ json });

      if (!response.ok) throw new Error('token is not added');

      return await response.json();
    },
    onSuccess: (response) => {
      if ('data' in response) {
        localStorage.setItem('fcmToken', response.data); // ✅ Save the token
        console.log('✅ FCM token saved to localStorage:');
      }
    },
    onError: () => {
      toast.error('Email or Password is incorrect!');
    },
  });

  return mutation;
};
