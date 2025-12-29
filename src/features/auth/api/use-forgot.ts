import { useMutation } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<(typeof client.api.auth.forgot)['$post']>;
type RequestType = InferRequestType<(typeof client.api.auth.forgot)['$post']>;

export const useForgot = () => {
  const router = useRouter();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.auth.forgot['$post']({ json });

      const responseBody = await response.json(); // Read once

      if (!response.ok) {
        const message = typeof responseBody === 'object' && 'error' in responseBody ? responseBody.error : 'Failed to Forgot!';
        throw new Error(message); // Forward backend message
      }

      return responseBody;
    },
    onSuccess: () => {
      toast.success('Check your email for further instructions!');
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || 'Email Not Found!'); // ⬅️ send meaningful error
    },
  });

  return mutation;
};
