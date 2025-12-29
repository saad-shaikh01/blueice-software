import { CashHandoverStatus } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

export const useVerifyCashHandover = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      status: 'VERIFIED' | 'REJECTED' | 'ADJUSTED';
      adminNotes?: string;
      adjustmentAmount?: number;
    }) => {
      const { id, ...rest } = data;
      const response = await client.api['cash-management'][':id'].verify.$patch({
        param: { id },
        json: rest,
      });

      if (!response.ok) {
        const error = await response.json();
        // @ts-expect-error - Hono client types inference
        throw new Error(error.error || 'Failed to verify cash handover');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Cash handover verified successfully');
      queryClient.invalidateQueries({ queryKey: ['cash-handovers'] });
      queryClient.invalidateQueries({ queryKey: ['cash-dashboard-stats'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
