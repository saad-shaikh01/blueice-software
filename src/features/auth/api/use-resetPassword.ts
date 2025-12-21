import { useMutation } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<(typeof client.api.auth.reset)[':resetToken']['$post']>;
type RequestType = InferRequestType<(typeof client.api.auth.reset)[':resetToken']['$post']>;

export const useReset = () => {
  const router = useRouter();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.auth.reset[':resetToken']['$post']({ param, json });

      const responseBody = await response.json(); // Read once

      if (!response.ok) {
        const message =
          typeof responseBody === 'object' && 'error' in responseBody
            ? responseBody.error
            : 'Failed to Reset!';
        throw new Error(message); // Forward backend message
      }

      return responseBody;
    },
    onSuccess: () => {
      toast.success('Password Changed Successfully');
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || 'Password Not Changed'); // ⬅️ send meaningful error
    },
  });

  return mutation;
};
