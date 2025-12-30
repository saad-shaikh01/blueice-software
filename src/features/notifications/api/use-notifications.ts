
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/hono';

export const useGetNotifications = (page = 1) => {
  return useQuery({
    queryKey: ['notifications', page],
    queryFn: async () => {
      const response = await client.api.notifications.$get({ query: { page: page.toString() } });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    // Refetch every minute to keep fresh (since push might fail)
    refetchInterval: 60000,
  });
};

export const useGetUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const response = await client.api.notifications.unread.$get();
      if (!response.ok) throw new Error('Failed to fetch unread count');
      return response.json();
    },
    refetchInterval: 30000,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await client.api.notifications[':id'].read.$patch({ param: { id } });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await client.api.notifications['read-all'].$patch();
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
