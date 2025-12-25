import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/hono';
import { toast } from 'sonner';

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await client.api.expenses.$post({
        json: data,
      });

      if (!response.ok) {
        throw new Error('Failed to create expense');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success('Expense created successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: () => {
      toast.error('Failed to create expense');
    },
  });
};
