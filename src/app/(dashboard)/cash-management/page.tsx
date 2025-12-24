'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetCashHandovers } from '@/features/cash-management/api/use-get-cash-handovers';
import { useGetCashStats } from '@/features/cash-management/api/use-get-cash-stats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { CashHandoverStatus } from '@prisma/client';

function CashManagementContent() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<CashHandoverStatus | undefined>();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = useGetCashStats();
  const {
    data: handovers,
    isLoading: handoversLoading,
  } = useGetCashHandovers({
    status: statusFilter,
    startDate,
    endDate,
    page,
    limit: 20,
  });

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
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cash Management</h1>
        <p className="text-muted-foreground">Monitor and verify driver cash handovers</p>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Collected Today</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                PKR {stats?.today.totalCashCollected || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.today.totalCashOrders || 0} cash orders
              </p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Pending Handovers
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats?.handovers.pending || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                PKR {stats?.handovers.pendingAmount || '0'} pending
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
                Verified Today
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats?.handovers.verified || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                PKR {stats?.handovers.verifiedAmount || '0'} verified
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">
                Total Discrepancy
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                PKR {stats?.handovers.totalDiscrepancy?.toFixed(2) || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.alerts.largeDiscrepancies || 0} large discrepancies
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <Filter className="inline-block mr-2 h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusFilter || 'all'}
                onValueChange={(value) =>
                  setStatusFilter(value === 'all' ? undefined : (value as CashHandoverStatus))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={CashHandoverStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={CashHandoverStatus.VERIFIED}>Verified</SelectItem>
                  <SelectItem value={CashHandoverStatus.REJECTED}>Rejected</SelectItem>
                  <SelectItem value={CashHandoverStatus.ADJUSTED}>Adjusted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStatusFilter(undefined);
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Handovers List */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Handovers</CardTitle>
          <CardDescription>
            {handovers?.pagination.total || 0} total handovers found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {handoversLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : handovers?.handovers.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No handovers found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters or wait for drivers to submit their cash
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {handovers?.handovers.map((handover: any) => {
                  const discrepancy = parseFloat(handover.discrepancy.toString());
                  const hasDiscrepancy = Math.abs(discrepancy) > 0.01;

                  return (
                    <div
                      key={handover.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              {handover.driver.user.name}
                            </h3>
                            {getStatusBadge(handover.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {handover.driver.user.phoneNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Date: {format(new Date(handover.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/cash-management/${handover.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Expected Cash</p>
                          <p className="font-medium">PKR {handover.expectedCash.toString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Actual Cash</p>
                          <p className="font-medium">PKR {handover.actualCash.toString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Discrepancy</p>
                          <p
                            className={`font-medium ${
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
                              : 'Perfect'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Orders</p>
                          <p className="font-medium">
                            {handover.completedOrders} / {handover.totalOrders}
                          </p>
                        </div>
                      </div>

                      {handover.driverNotes && (
                        <div className="mt-3 p-2 bg-muted rounded text-sm">
                          <p className="font-medium mb-1">Driver Notes:</p>
                          <p className="text-muted-foreground">{handover.driverNotes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {handovers && handovers.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {handovers.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page === handovers.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CashManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading cash management...</p>
          </div>
        </div>
      }
    >
      <CashManagementContent />
    </Suspense>
  );
}
