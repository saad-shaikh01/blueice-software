
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';
import { ExpenseStatus } from '@prisma/client';

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ExpenseStatus }) => {
      const response = await client.api.expenses[':id'].$patch({
        param: { id },
        json: { status },
      });

      if (!response.ok) {
        throw new Error('Failed to update expense status');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success('Expense updated successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (error) => {
      toast.error('Failed to update expense');
      console.error(error);
    },
  });
};
