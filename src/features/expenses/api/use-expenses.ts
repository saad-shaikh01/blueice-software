'use client';

import { ExpenseCategory, ExpenseStatus } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

export const useGetExpenses = () => {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await client.api.expenses.$get({
        query: {},
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const data = await response.json();
      return data;
    },
  });
};

export const useCreateExpense = () => {
  return {
    mutate: async (data: any) => {
      const response = await client.api.expenses.$post({
        json: data,
      });
      if (!response.ok) {
        throw new Error('Failed to create expense');
      }
      return await response.json();
    },
  };
};
