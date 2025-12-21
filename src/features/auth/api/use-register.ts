import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<(typeof client.api.auth.register)['$post']>;
type RequestType = InferRequestType<(typeof client.api.auth.register)['$post']>;

export const useRegister = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.auth.register['$post']({ json });

      const responseBody = await response.json(); // Read once

      if (!response.ok) {
        const message =
          typeof responseBody === 'object' && 'error' in responseBody
            ? responseBody.error
            : 'Failed to register!';
        throw new Error(message); // Forward backend message
      }

      return responseBody;
    },
    onSuccess: () => {
      router.refresh();

      queryClient.invalidateQueries({
        queryKey: ['current'],
      });
    },
    onError: (error) => {
      console.error('[REGISTER]: ', error);

      toast.error(error.message || 'Failed to register!'); // ⬅️ send meaningful error
    },
  });

  return mutation;
};
