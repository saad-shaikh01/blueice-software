'use client';

import { ExpenseStatus } from '@prisma/client';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { useGetExpenses } from '../api/use-expenses';

export const ExpensesTable = () => {
  const { data, isLoading } = useGetExpenses();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // @ts-ignore
  const expenses = data?.expenses || [];

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Spent By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No expenses found
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense: any) => (
              <TableRow key={expense.id}>
                <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  <Badge variant="outline">{expense.category}</Badge>
                </TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>PKR {expense.amount}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      expense.status === ExpenseStatus.APPROVED
                        ? 'default' // was 'success', checking ShadCN default variants. 'default' is usually black/primary.
                        : expense.status === ExpenseStatus.REJECTED
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {expense.status}
                  </Badge>
                </TableCell>
                <TableCell>{expense.spentByUser?.name}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
