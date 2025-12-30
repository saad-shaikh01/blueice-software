'use client';

import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import { PageLoader } from '@/components/page-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetDriverLedger } from '@/features/driver-view/api/use-get-driver-ledger';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function DriverLedgerPage() {
  const { data: ledger, isLoading } = useGetDriverLedger();

  if (isLoading) return <PageLoader />;
  if (!ledger) return <div>No ledger data found</div>;

  const currentBalance = parseFloat(ledger.currentBalance);
  // Negative Balance = Debt (I owe company)
  // Positive Balance = Credit (Company owes me)
  const isDebt = currentBalance < 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/deliveries">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-bold">My Wallet (Hisaab)</h1>
      </div>

      {/* Main Balance Card */}
      <Card className={cn(
        "border-2",
        isDebt ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "border-green-500 bg-green-50 dark:bg-green-950/20"
      )}>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {isDebt ? "You Owe Company" : "Company Owes You"}
          </span>
          <span className={cn(
            "text-4xl font-extrabold mt-2",
            isDebt ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"
          )}>
            {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(Math.abs(currentBalance))}
          </span>
          {isDebt && (
            <div className="mt-4 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
              Please deposit cash to clear
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
        {ledger.transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No recent transactions</p>
        ) : (
          ledger.transactions.map((tx: any) => {
            const amount = parseFloat(tx.amount);
            const isDebit = amount < 0; // Shortage/Debt

            return (
              <Card key={tx.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "mt-1 rounded-full p-2",
                      isDebit ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                    )}>
                      {isDebit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.createdAt), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-bold",
                      isDebit ? "text-red-600" : "text-green-600"
                    )}>
                      {isDebit ? '-' : '+'}{new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(Math.abs(amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bal: {new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(parseFloat(tx.balanceAfter))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
