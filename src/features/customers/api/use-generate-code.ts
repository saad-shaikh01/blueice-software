import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

/**
 * Hook to generate next available customer code
 * Returns auto-generated code like C-1001, C-1002, etc.
 */
export const useGenerateCode = () => {
  return useQuery({
    queryKey: ['customers', 'generate-code'],
    queryFn: async () => {
      const response = await client.api.customers['generate-code'].$get();

      if (!response.ok) {
        throw new Error('Failed to generate customer code');
      }

      const data = await response.json();
      return data.data;
    },
  });
};

/**
 * Hook to check if a customer code already exists
 * @param code - Customer code to check
 */
export const useCheckCode = (code: string) => {
  return useQuery({
    queryKey: ['customers', 'check-code', code],
    queryFn: async () => {
      const response = await client.api.customers['check-code'][':code'].$get({
        param: { code },
      });

      if (!response.ok) {
        throw new Error('Failed to check customer code');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!code && code.length > 0,
  });
};
