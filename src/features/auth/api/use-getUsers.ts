import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

interface useGetUsersProps {
  search?: string | null;
}

export const useGetUsers = ({ search }: useGetUsersProps) => {
  const query = useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      const response = await client.api.auth.users.$get({
        query: {
          search: search ?? undefined,
        },
      });

      if (!response.ok) return null;

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
