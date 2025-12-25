'use client';

import { Suspense, useState } from 'react';
import { useDriverDaySummary } from '@/features/cash-management/api/use-driver-day-summary';
import { useSubmitCashHandover } from '@/features/cash-management/api/use-submit-cash-handover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Package,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

function CashHandoverContent() {
  const { data: summary, isLoading, error } = useDriverDaySummary();
  const { mutate: submitHandover, isPending } = useSubmitCashHandover();

  const [actualCash, setActualCash] = useState('');
  const [driverNotes, setDriverNotes] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!actualCash || parseFloat(actualCash) < 0) {
      return;
    }

    submitHandover({
      date: format(new Date(), 'yyyy-MM-dd'),
      actualCash: parseFloat(actualCash),
      driverNotes: driverNotes || undefined,
      shiftStart: shiftStart || undefined,
      shiftEnd: shiftEnd || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-medium text-destructive">Failed to load day summary</p>
        <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
      </div>
    );
  }

  const expectedCash = parseFloat(summary?.expectedCash || '0');
  const enteredCash = parseFloat(actualCash || '0');
  const discrepancy = expectedCash - enteredCash;
  const hasDiscrepancy = Math.abs(discrepancy) > 0.01;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">End of Day - Cash Handover</h1>
        <p className="text-muted-foreground">Submit your daily cash collection</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.completedOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              out of {summary?.totalOrders || 0} assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Orders Count</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(summary?.cashOrders) ? summary.cashOrders.length : 0}</div>
            <p className="text-xs text-muted-foreground">
              orders paid in cash
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
              Expected Cash
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              PKR {expectedCash.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              from cash orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottle Exchange Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Bottle Exchange Summary</CardTitle>
          <CardDescription>Today's bottle delivery and collection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Filled Bottles Given</p>
                <p className="text-2xl font-bold text-green-600">{summary?.bottlesGiven || 0}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Empty Bottles Taken</p>
                <p className="text-2xl font-bold text-blue-600">{summary?.bottlesTaken || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Orders Breakdown */}
      {summary?.ordersPaidInCash && summary.ordersPaidInCash.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cash Orders Breakdown</CardTitle>
            <CardDescription>All orders paid in cash today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {summary.ordersPaidInCash.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Order #{order.readableId}</p>
                    <p className="text-sm text-muted-foreground">{order.customerName}</p>
                  </div>
                  <Badge variant="secondary">PKR {order.amount}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash Handover Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Submit Cash Handover</CardTitle>
            <CardDescription>
              Enter the actual cash amount you are handing over
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Shift Times */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shiftStart">Shift Start Time (Optional)</Label>
                <Input
                  id="shiftStart"
                  type="time"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shiftEnd">Shift End Time (Optional)</Label>
                <Input
                  id="shiftEnd"
                  type="time"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Actual Cash Amount */}
            <div className="space-y-2">
              <Label htmlFor="actualCash">
                Actual Cash Amount <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium">PKR</span>
                <Input
                  id="actualCash"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  required
                  className="text-lg font-medium"
                />
              </div>
            </div>

            {/* Discrepancy Warning */}
            {actualCash && hasDiscrepancy && (
              <div
                className={`p-4 rounded-lg border ${
                  discrepancy > 0
                    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900'
                    : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className={`h-5 w-5 mt-0.5 ${
                      discrepancy > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}
                  />
                  <div>
                    <p className="font-medium">
                      {discrepancy > 0 ? 'Cash Shortage Detected' : 'Cash Excess Detected'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Discrepancy: PKR {Math.abs(discrepancy).toFixed(2)}{' '}
                      {discrepancy > 0 ? 'short' : 'excess'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please explain the discrepancy in the notes below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Driver Notes */}
            <div className="space-y-2">
              <Label htmlFor="driverNotes">
                Notes {hasDiscrepancy && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="driverNotes"
                placeholder="Add any notes or explanations (required if there's a discrepancy)"
                value={driverNotes}
                onChange={(e) => setDriverNotes(e.target.value)}
                rows={4}
                required={hasDiscrepancy}
              />
            </div>

            {/* Summary Before Submit */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expected Cash:</span>
                <span className="font-bold">PKR {expectedCash.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Actual Cash:</span>
                <span className="font-bold">
                  PKR {enteredCash.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Discrepancy:</span>
                <span
                  className={`font-bold ${
                    hasDiscrepancy
                      ? discrepancy > 0
                        ? 'text-yellow-600'
                        : 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {hasDiscrepancy
                    ? `PKR ${Math.abs(discrepancy).toFixed(2)} ${
                        discrepancy > 0 ? 'short' : 'excess'
                      }`
                    : 'Perfect Match'}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" size="lg" className="w-full" disabled={isPending || !actualCash}>
              {isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit Cash Handover
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
            <FileText className="inline-block mr-2 h-4 w-4" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 dark:text-blue-100 space-y-2">
          <p>• Count your cash carefully before submitting</p>
          <p>• Once submitted, it will be sent to admin for verification</p>
          <p>• You can resubmit if still pending verification</p>
          <p>• Always explain any discrepancies in the notes</p>
          <p>• Keep your cash secure until handover is verified</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CashHandoverPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading cash handover...</p>
          </div>
        </div>
      }
    >
      <CashHandoverContent />
    </Suspense>
  );
}
