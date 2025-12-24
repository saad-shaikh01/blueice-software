'use client';

import { Suspense, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetDriverStats } from '@/features/drivers/api/use-get-driver-stats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, Package, TrendingUp, Calendar, MapPin, Phone, Mail, Truck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, startOfMonth, endOfMonth, subDays, startOfWeek, endOfWeek } from 'date-fns';

function DriverDetailContent() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.driverId as string;

  // Date range state - default to current month
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Calculate date range based on selection
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return {
          startDate: format(now, 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd'),
        };
      case 'week':
        return {
          startDate: format(startOfWeek(now), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(now), 'yyyy-MM-dd'),
        };
      case 'month':
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
        };
      case 'custom':
        return {
          startDate: customStart,
          endDate: customEnd,
        };
      default:
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
        };
    }
  };

  const { startDate, endDate } = getDateRange();
  const { data: stats, isLoading, error } = useGetDriverStats({ driverId, startDate, endDate });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-lg font-medium text-destructive">Failed to load driver details</p>
        <Button className="mt-4" onClick={() => router.push('/drivers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Drivers
        </Button>
      </div>
    );
  }

  const { driver, summary, financial, bottles, today, allTime, recentOrders } = stats;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/drivers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{driver.user.name}</h1>
            <p className="text-muted-foreground">Driver Performance Dashboard</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={driver.user.isActive ? 'default' : 'secondary'}>
            {driver.user.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {driver.user.suspended && <Badge variant="destructive">Suspended</Badge>}
        </div>
      </div>

      {/* Driver Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{driver.user.phoneNumber}</p>
              </div>
            </div>
            {driver.user.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{driver.user.email}</p>
                </div>
              </div>
            )}
            {driver.vehicleNo && (
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle No</p>
                  <p className="font-medium">{driver.vehicleNo}</p>
                </div>
              </div>
            )}
            {driver.licenseNo && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">License No</p>
                  <p className="font-medium">{driver.licenseNo}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Period</CardTitle>
          <CardDescription>Select a date range to view statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={dateRange === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('today')}
            >
              Today
            </Button>
            <Button
              variant={dateRange === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('week')}
            >
              This Week
            </Button>
            <Button
              variant={dateRange === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('month')}
            >
              This Month
            </Button>
            <div className="flex items-center gap-2 ml-4">
              <input
                type="date"
                className="px-3 py-1.5 text-sm border rounded-md"
                value={customStart}
                onChange={(e) => {
                  setCustomStart(e.target.value);
                  setDateRange('custom');
                }}
              />
              <span className="text-sm text-muted-foreground">to</span>
              <input
                type="date"
                className="px-3 py-1.5 text-sm border rounded-md"
                value={customEnd}
                onChange={(e) => {
                  setCustomEnd(e.target.value);
                  setDateRange('custom');
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Today's Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{today.deliveries}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed orders today</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Today's Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">PKR {today.cashCollected}</div>
            <p className="text-xs text-muted-foreground mt-1">Cash collected today</p>
          </CardContent>
        </Card>
      </div>

      {/* Period Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {summary.completedOrders} completed • {summary.pendingOrders} pending
            </p>
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${summary.completionRate}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{summary.completionRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {financial.totalCashCollected}</div>
            <p className="text-xs text-muted-foreground">
              Avg: PKR {parseFloat(financial.averageCashPerDelivery).toFixed(0)} per delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filled Bottles Given</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{bottles.totalFilledGiven}</div>
            <p className="text-xs text-muted-foreground">Bottles delivered to customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empty Bottles Taken</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{bottles.totalEmptyTaken}</div>
            <p className="text-xs text-muted-foreground">
              Exchange rate: {bottles.exchangeRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* All-Time Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>All-Time Performance</CardTitle>
          <CardDescription>Lifetime statistics for this driver</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Total Deliveries</p>
              <p className="text-2xl font-bold">{allTime.totalDeliveries}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Total Cash Collected</p>
              <p className="text-2xl font-bold">PKR {allTime.totalCashCollected}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">PKR {allTime.totalRevenue}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deliveries</CardTitle>
          <CardDescription>Latest 10 completed orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No completed orders in this period</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">Order #{order.readableId}</p>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">PKR {order.cashCollected}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.deliveredAt
                          ? format(new Date(order.deliveredAt), 'MMM dd, yyyy HH:mm')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-2" />
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="text-muted-foreground">
                          Filled: {item.filledGiven} • Empty: {item.emptyTaken}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DriverDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading driver details...</p>
          </div>
        </div>
      }
    >
      <DriverDetailContent />
    </Suspense>
  );
}
