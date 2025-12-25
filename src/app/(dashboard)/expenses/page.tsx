import { ExpenseForm } from '@/features/expenses/components/expense-form';
import { ExpensesTable } from '@/features/expenses/components/expenses-table';

export default function ExpensesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Manage and track company expenses</p>
        </div>
        <ExpenseForm />
      </div>

      <ExpensesTable />
    </div>
  );
}
