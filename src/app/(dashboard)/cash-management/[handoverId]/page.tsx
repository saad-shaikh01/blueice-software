'use client';

import { Suspense, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';
import { useVerifyCashHandover } from '@/features/cash-management/api/use-verify-cash-handover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Package,
  Clock,
  User,
  Phone,
  Calendar,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { CashHandoverStatus } from '@prisma/client';

function CashHandoverDetailContent() {
  const params = useParams();
  const router = useRouter();
  const handoverId = params.handoverId as string;

  const [verificationStatus, setVerificationStatus] = useState<
    'VERIFIED' | 'REJECTED' | 'ADJUSTED'
  >(CashHandoverStatus.VERIFIED);
  const [adminNotes, setAdminNotes] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');

  const { mutate: verifyHandover, isPending } = useVerifyCashHandover();

  const { data: handover, isLoading, error } = useQuery({
    queryKey: ['cash-handover', handoverId],
    queryFn: async () => {
      const response = await client.api['cash-management'][':id'].$get({
        param: { id: handoverId },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch handover details');
      }

      const data = await response.json();
      return data.data;
    },
  });

  const handleVerify = () => {
    verifyHandover({
      id: handoverId,
      status: verificationStatus,
      adminNotes: adminNotes || undefined,
      adjustmentAmount:
        verificationStatus === CashHandoverStatus.ADJUSTED && adjustmentAmount
          ? parseFloat(adjustmentAmount)
          : undefined,
    }, {
      onSuccess: () => {
        router.push('/cash-management');
      }
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

  if (error || !handover) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-medium text-destructive">Failed to load handover details</p>
        <Button className="mt-4" onClick={() => router.push('/cash-management')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cash Management
        </Button>
      </div>
    );
  }

  const discrepancy = parseFloat(handover.discrepancy.toString());
  const hasDiscrepancy = Math.abs(discrepancy) > 0.01;
  const isPendingHandover = handover.status === CashHandoverStatus.PENDING;

  const getStatusBadge = (status: CashHandoverStatus) => {
    switch (status) {
      case CashHandoverStatus.PENDING:
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case CashHandoverStatus.VERIFIED:
        return <Badge className="bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Verified</Badge>;
      case CashHandoverStatus.REJECTED:
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      case CashHandoverStatus.ADJUSTED:
        return <Badge variant="outline"><AlertCircle className="mr-1 h-3 w-3" />Adjusted</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/cash-management')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Cash Handover #{handover.readableId}
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(handover.date), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>
        {getStatusBadge(handover.status)}
      </div>

      {/* Driver Information */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Driver Name</p>
                <p className="font-medium">{handover.driver.user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{handover.driver.user.phoneNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Submitted At</p>
                <p className="font-medium">
                  {format(new Date(handover.submittedAt), 'MMM dd, HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Cash</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {handover.expectedCash.toString()}</div>
            <p className="text-xs text-muted-foreground">
              From {handover.cashOrders} cash orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Cash</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {handover.actualCash.toString()}</div>
            <p className="text-xs text-muted-foreground">Handed over by driver</p>
          </CardContent>
        </Card>

        <Card
          className={
            hasDiscrepancy
              ? discrepancy > 0
                ? 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20'
                : 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
              : 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={`text-sm font-medium ${
                hasDiscrepancy
                  ? discrepancy > 0
                    ? 'text-yellow-900 dark:text-yellow-100'
                    : 'text-red-900 dark:text-red-100'
                  : 'text-green-900 dark:text-green-100'
              }`}
            >
              Discrepancy
            </CardTitle>
            {hasDiscrepancy ? (
              <AlertCircle
                className={`h-4 w-4 ${discrepancy > 0 ? 'text-yellow-600' : 'text-red-600'}`}
              />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                hasDiscrepancy
                  ? discrepancy > 0
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {hasDiscrepancy
                ? `PKR ${Math.abs(discrepancy).toFixed(2)}`
                : 'Perfect Match'}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasDiscrepancy ? (discrepancy > 0 ? 'Cash shortage' : 'Cash excess') : 'No discrepancy'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order & Bottle Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Orders:</span>
              <span className="font-medium">{handover.totalOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed Orders:</span>
              <span className="font-medium">{handover.completedOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cash Orders:</span>
              <span className="font-medium">{handover.cashOrders}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bottle Exchange</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Filled Bottles Given:</span>
              <span className="font-medium text-green-600">{handover.bottlesGiven}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Empty Bottles Taken:</span>
              <span className="font-medium text-blue-600">{handover.bottlesTaken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Net Difference:</span>
              <span className="font-medium">
                {handover.bottlesGiven - handover.bottlesTaken}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shift Information */}
      {(handover.shiftStart || handover.shiftEnd) && (
        <Card>
          <CardHeader>
            <CardTitle>Shift Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {handover.shiftStart && (
              <div>
                <p className="text-sm text-muted-foreground">Shift Start</p>
                <p className="font-medium">
                  {format(new Date(handover.shiftStart), 'HH:mm')}
                </p>
              </div>
            )}
            {handover.shiftEnd && (
              <div>
                <p className="text-sm text-muted-foreground">Shift End</p>
                <p className="font-medium">
                  {format(new Date(handover.shiftEnd), 'HH:mm')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Driver Notes */}
      {handover.driverNotes && (
        <Card>
          <CardHeader>
            <CardTitle>
              <FileText className="inline-block mr-2 h-5 w-5" />
              Driver Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{handover.driverNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Admin Notes (if already verified) */}
      {handover.adminNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Notes</CardTitle>
            <CardDescription>
              Verified by admin on {format(new Date(handover.verifiedAt!), 'MMM dd, yyyy HH:mm')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{handover.adminNotes}</p>
            {handover.adjustmentAmount && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Adjustment Amount:</p>
                <p className="text-lg font-bold">PKR {handover.adjustmentAmount.toString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verification Form (only if pending) */}
      {isPending && (
        <Card>
          <CardHeader>
            <CardTitle>Verify Cash Handover</CardTitle>
            <CardDescription>Review and verify the driver's cash submission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Verification Decision</Label>
              <Select
                value={verificationStatus}
                onValueChange={(value) =>
                  setVerificationStatus(
                    value as
                      | 'VERIFIED'
                      | 'REJECTED'
                      | 'ADJUSTED'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CashHandoverStatus.VERIFIED}>
                    <CheckCircle className="inline-block mr-2 h-4 w-4 text-green-600" />
                    Verify - Accept as submitted
                  </SelectItem>
                  <SelectItem value={CashHandoverStatus.ADJUSTED}>
                    <AlertCircle className="inline-block mr-2 h-4 w-4 text-yellow-600" />
                    Adjust - Accept with adjustments
                  </SelectItem>
                  <SelectItem value={CashHandoverStatus.REJECTED}>
                    <XCircle className="inline-block mr-2 h-4 w-4 text-red-600" />
                    Reject - Send back for correction
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {verificationStatus === CashHandoverStatus.ADJUSTED && (
              <div className="space-y-2">
                <Label>Adjustment Amount (PKR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the final accepted amount if different from submitted
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Admin Notes</Label>
              <Textarea
                placeholder="Add notes about your verification decision..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>

            <Separator />

            <div className="flex gap-4">
              <Button
                onClick={handleVerify}
                disabled={isPending}
                className="flex-1"
                variant={
                  verificationStatus === CashHandoverStatus.VERIFIED
                    ? 'primary'
                    : verificationStatus === CashHandoverStatus.REJECTED
                      ? 'destructive'
                      : 'outline'
                }
              >
                {isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : verificationStatus === CashHandoverStatus.VERIFIED ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify Cash Handover
                  </>
                ) : verificationStatus === CashHandoverStatus.REJECTED ? (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Cash Handover
                  </>
                ) : (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Accept with Adjustment
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CashHandoverDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading handover details...</p>
          </div>
        </div>
      }
    >
      <CashHandoverDetailContent />
    </Suspense>
  );
}
