'use client';

import { useState } from 'react';
import { useComprehensiveDashboard } from '@/features/dashboard/api/use-comprehensive-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Truck,
  AlertCircle,
  XCircle,
  Clock,
  BarChart3,
  Activity,
  Minus,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function ComprehensiveDashboard() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return {
          startDate: format(startOfDay(now), 'yyyy-MM-dd'),
          endDate: format(endOfDay(now), 'yyyy-MM-dd'),
        };
      case 'week':
        return {
          startDate: format(subDays(now, 7), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd'),
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
    }
  };

  const { startDate, endDate } = getDateRange();
  const { data, isLoading } = useComprehensiveDashboard({ startDate, endDate });

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Intelligence Dashboard</h1>
          <p className="text-muted-foreground">Complete business overview and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Activity className="mr-1 h-3 w-3" />
            Live Data
          </Badge>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={dateRange === 'today' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('today')}
            >
              Today
            </Button>
            <Button
              variant={dateRange === 'week' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('week')}
            >
              Last 7 Days
            </Button>
            <Button
              variant={dateRange === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('month')}
            >
              This Month
            </Button>
            <div className="flex items-center gap-2 ml-4">
              <Input
                type="date"
                className="w-40 h-8 text-xs"
                value={customStart}
                onChange={(e) => {
                  setCustomStart(e.target.value);
                  setDateRange('custom');
                }}
              />
              <span className="text-xs">to</span>
              <Input
                type="date"
                className="w-40 h-8 text-xs"
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

      {/* Overview KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              PKR {data?.overview.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {getTrendIcon(data?.overview.revenueChange || 0)}
              <span className={getTrendColor(data?.overview.revenueChange || 0)}>
                {Math.abs(data?.overview.revenueChange || 0).toFixed(1)}% vs previous period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.totalOrders}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {getTrendIcon(data?.overview.ordersChange || 0)}
              <span className={getTrendColor(data?.overview.ordersChange || 0)}>
                {Math.abs(data?.overview.ordersChange || 0).toFixed(1)}% vs previous period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{data?.overview.newCustomers} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              PKR {data?.overview.avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per completed order</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Order Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
            <CardDescription>Daily revenue performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data?.trends.revenue || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0088FE"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status Trend (Last 30 Days)</CardTitle>
            <CardDescription>Order completion and status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.trends.orders || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="COMPLETED" fill="#00C49F" name="Completed" />
                <Bar dataKey="PENDING" fill="#FFBB28" name="Pending" />
                <Bar dataKey="CANCELLED" fill="#FF8042" name="Cancelled" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Order Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Current period breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data?.orderStats.byStatus || []}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {(data?.orderStats.byStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {(data?.orderStats.byStatus || []).map((stat, index) => (
                  <div key={stat.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span>{stat.status}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{stat.count} orders</div>
                      <div className="text-xs text-muted-foreground">
                        PKR {stat.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Revenue by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={data?.orderStats.byPaymentMethod || []}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="method" width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {(data?.orderStats.byPaymentMethod || []).map((stat) => (
                  <div key={stat.method} className="flex items-center justify-between text-sm">
                    <span>{stat.method}</span>
                    <div className="text-right">
                      <div className="font-medium">{stat.count} orders</div>
                      <div className="text-xs text-muted-foreground">
                        PKR {stat.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Management */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Management Overview</CardTitle>
          <CardDescription>Cash collection and handover status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Cash Collected</span>
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                PKR {data?.cashManagement.totalCashCollected.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {data?.cashManagement.cashOrders} cash orders
              </p>
            </div>

            <div className="p-4 border rounded-lg border-yellow-200 bg-yellow-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Pending Handovers</span>
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {data?.cashManagement.pendingHandovers.count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                PKR {data?.cashManagement.pendingHandovers.amount.toLocaleString()} pending
              </p>
            </div>

            <div className="p-4 border rounded-lg border-green-200 bg-green-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Verified Cash</span>
                <CheckCircle className="h-4 w-4 text-green-700" />
              </div>
              <div className="text-2xl font-bold text-green-700">
                PKR {data?.cashManagement.verifiedCash?.toLocaleString() ?? '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Safely received
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Collection Rate</span>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {(data?.cashManagement?.cashOrders || 0) > 0
                  ? (((data?.cashManagement.totalCashCollected || 0) / (data?.overview.totalRevenue || 1)) * 100).toFixed(1)
                  : '0'}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Of total revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Driver Performance</CardTitle>
          <CardDescription>Top 10 drivers by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data?.driverPerformance || []).slice(0, 10).map((driver, index) => (
              <div key={driver.driverId} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{driver.driverName}</span>
                    <span className="text-sm font-semibold">
                      PKR {driver.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{driver.completedOrders} orders</span>
                    <span>PKR {driver.cashCollected.toLocaleString()} cash</span>
                  </div>
                  <div className="mt-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(driver.revenue / (data?.driverPerformance[0]?.revenue || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottle Inventory */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bottle Movement</CardTitle>
            <CardDescription>Filled vs Empty bottle tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Filled Given</div>
                  <div className="text-2xl font-bold text-green-600">
                    {data?.bottleStats.filledGiven}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Empty Taken</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {data?.bottleStats.emptyTaken}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg border-red-200 bg-red-50/50">
                  <div className="text-sm text-muted-foreground mb-1">Damaged</div>
                  <div className="text-2xl font-bold text-red-600">
                    {data?.bottleStats.damagedReturned}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Net Difference</div>
                  <div className="text-2xl font-bold">
                    {data?.bottleStats.netDifference}
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Exchange Rate</span>
                  <span className="font-semibold">
                    {data?.bottleStats.filledGiven
                      ? ((data?.bottleStats.emptyTaken / data?.bottleStats.filledGiven) * 100).toFixed(1)
                      : '0'}%
                  </span>
                </div>
                <div className="h-4 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{
                      width: `${data?.bottleStats.filledGiven
                        ? ((data?.bottleStats.emptyTaken / data?.bottleStats.filledGiven) * 100)
                        : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>Current stock levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(data?.inventory || []).map((product) => (
                <div key={product.id} className="flex items-center justify-between text-sm p-2 border rounded">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Filled: {product.stockFilled} • Empty: {product.stockEmpty}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">PKR {product.totalValue.toLocaleString()}</div>
                    <Badge
                      variant={product.stockFilled < 20 ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {product.stockFilled < 20 ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Analytics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>By revenue this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(data?.customerAnalytics.topCustomers || []).map((customer, index) => (
                <div key={customer.customerId} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{customer.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {customer.orderCount} orders
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    PKR {customer.totalRevenue.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
            <CardDescription>By customer type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.customerAnalytics.byType || []}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {(data?.customerAnalytics.byType || []).map((_entry: unknown, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Exceptions */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Failed Orders */}
        {data?.alerts.failedOrders && data.alerts.failedOrders.length > 0 && (
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-base text-red-900 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Failed Orders ({data.alerts.failedOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.alerts.failedOrders.map((order) => (
                  <div key={order.id} className="text-xs p-2 bg-white rounded border">
                    <div className="font-medium">Order #{order.readableId}</div>
                    <div className="text-muted-foreground">{order.customerName}</div>
                    <div className="font-semibold mt-1">PKR {order.amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Low Stock Products */}
        {data?.alerts.lowStockProducts && data.alerts.lowStockProducts.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader>
              <CardTitle className="text-base text-yellow-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Low Stock Alert ({data.alerts.lowStockProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.alerts.lowStockProducts.map((product) => (
                  <div key={product.id} className="text-xs p-2 bg-white rounded border">
                    <div className="font-medium">{product.name}</div>
                    <div className="flex justify-between mt-1">
                      <span>Filled: {product.stockFilled}</span>
                      <span>Empty: {product.stockEmpty}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* High Credit Customers */}
        {data?.alerts.highCreditCustomers && data.alerts.highCreditCustomers.length > 0 && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="text-base text-orange-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Credit Limit Alert ({data.alerts.highCreditCustomers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.alerts.highCreditCustomers.map((customer) => (
                  <div key={customer.id} className="text-xs p-2 bg-white rounded border">
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-muted-foreground">{customer.phone}</div>
                    <div className="flex justify-between mt-1">
                      <span>Used: PKR {Math.abs(customer.balance).toLocaleString()}</span>
                      <Badge variant="destructive" className="text-xs">
                        {customer.utilizationPercent.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
