'use client';

import { ExpenseStatus } from '@prisma/client';
import { format } from 'date-fns';
import { Check, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useGetExpenses } from '../api/use-expenses';
import { useUpdateExpense } from '../api/use-update-expense';

export const ExpensesTable = () => {
  const { data, isLoading } = useGetExpenses();
  const { mutate: updateStatus, isPending } = useUpdateExpense();

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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
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
                <TableCell className="max-w-[200px] truncate" title={expense.description}>{expense.description}</TableCell>
                <TableCell>PKR {expense.amount}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      expense.status === ExpenseStatus.APPROVED
                        ? 'default'
                        : expense.status === ExpenseStatus.REJECTED
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {expense.status}
                  </Badge>
                </TableCell>
                <TableCell>{expense.spentByUser?.name}</TableCell>
                <TableCell className="text-right">
                  {expense.status === ExpenseStatus.PENDING && (
                    <div className="flex justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                              onClick={() => updateStatus({ id: expense.id, status: ExpenseStatus.APPROVED })}
                              disabled={isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Approve</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => updateStatus({ id: expense.id, status: ExpenseStatus.REJECTED })}
                              disabled={isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Reject</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
