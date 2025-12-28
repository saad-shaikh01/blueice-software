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
  AlertCircle,
  XCircle,
  Clock,
  BarChart3,
  Activity,
  Minus,
  CheckCircle,
  Droplet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
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

// Custom Glass Tooltip
const GlassTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-sm border-white/40">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any, index: number) => (
          <p key={index} style={{ color: p.color }} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
  const { data, isLoading, isError } = useComprehensiveDashboard({ startDate, endDate });

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64 glass" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 glass" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96 glass" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-6 items-center justify-center h-96 glass-card">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load dashboard data</h2>
        <p className="text-muted-foreground">Please check your connection and try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-300">
            Overview
          </h1>
          <p className="text-muted-foreground font-medium">Business Intelligence & Analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs glass border-primary/20 text-primary">
            <Activity className="mr-1 h-3 w-3 animate-pulse" />
            Live Updates
          </Badge>
        </div>
      </div>

      {/* Date Range Filter - Floating Glass Bar */}
      <Card className="glass-card border-white/40 sticky top-4 z-20">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['today', 'week', 'month'].map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateRange(range as any)}
                className={`capitalize ${dateRange === range ? 'bg-primary/80 backdrop-blur-sm' : 'hover:bg-white/20'}`}
              >
                {range === 'week' ? 'Last 7 Days' : range === 'month' ? 'This Month' : 'Today'}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white/30 dark:bg-black/20 p-1 rounded-lg">
            <Input
              type="date"
              className="w-36 h-8 text-xs border-none bg-transparent focus-visible:ring-0"
              value={customStart}
              onChange={(e) => {
                setCustomStart(e.target.value);
                setDateRange('custom');
              }}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              className="w-36 h-8 text-xs border-none bg-transparent focus-visible:ring-0"
              value={customEnd}
              onChange={(e) => {
                setCustomEnd(e.target.value);
                setDateRange('custom');
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Overview KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="p-2 rounded-full bg-green-100/50 dark:bg-green-900/30">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-500">
              PKR {data?.overview.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs mt-1 font-medium">
              {getTrendIcon(data?.overview.revenueChange || 0)}
              <span className={getTrendColor(data?.overview.revenueChange || 0)}>
                {Math.abs(data?.overview.revenueChange || 0).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs prev</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <div className="p-2 rounded-full bg-blue-100/50 dark:bg-blue-900/30">
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data?.overview.totalOrders}</div>
            <div className="flex items-center gap-1 text-xs mt-1 font-medium">
              {getTrendIcon(data?.overview.ordersChange || 0)}
              <span className={getTrendColor(data?.overview.ordersChange || 0)}>
                {Math.abs(data?.overview.ordersChange || 0).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs prev</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
            <div className="p-2 rounded-full bg-purple-100/50 dark:bg-purple-900/30">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data?.overview.totalCustomers}</div>
            <div className="flex items-center gap-1 text-xs mt-1 text-muted-foreground">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                +{data?.overview.newCustomers} New
              </Badge>
              <span>this period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
            <div className="p-2 rounded-full bg-orange-100/50 dark:bg-orange-900/30">
              <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              PKR {data?.overview.avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per completed order</p>
          </CardContent>
        </Card>
      </div>

      {/* Profitability & Asset Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Net Profit Card */}
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              PKR {(data?.overview.netProfit || 0).toLocaleString()}
            </div>
            <div className="flex justify-between items-center mt-2 text-xs">
              <span className="text-emerald-800 font-medium">
                Revenue: PKR {(data?.overview.totalRevenue || 0).toLocaleString()}
              </span>
              <span className="text-red-600 font-medium">
                Exp: PKR {(data?.overview.totalExpenses || 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Market Receivables Card */}
        <Card className="border-orange-200 bg-orange-50/50 cursor-pointer hover:bg-orange-100/50 transition-colors" onClick={() => window.location.href = '/customers?filter=debt'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Market Receivables</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              PKR {(data?.overview.totalReceivables || 0).toLocaleString()}
            </div>
            <p className="text-xs text-orange-800 mt-1">
              Total Outstanding (Udhaar) in Market
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Click to view details</p>
          </CardContent>
        </Card>

        {/* Bottles with Customers Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Bottles with Customers</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {(data?.bottleStats.netDifference || 0).toLocaleString()}
            </div>
            <div className="flex justify-between items-center mt-2 text-xs">
              <span className="text-green-700">
                Sent: {(data?.bottleStats.filledGiven || 0).toLocaleString()}
              </span>
              <span className="text-blue-700">
                Ret: {(data?.bottleStats.emptyTaken || 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Order Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue performance (Last 30 Days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data?.trends.revenue || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: 'currentColor' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'currentColor' }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip content={<GlassTooltip />} cursor={{ fill: 'transparent' }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0088FE"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Completion vs Cancellations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.trends.orders || []} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: 'currentColor' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Legend iconType="circle" />
                <Bar dataKey="COMPLETED" fill="#00C49F" name="Completed" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="PENDING" fill="#FFBB28" name="Pending" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="CANCELLED" fill="#FF8042" name="Cancelled" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Order Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current period breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/2 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.orderStats.byStatus || []}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {(data?.orderStats.byStatus || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<GlassTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-3">
                {(data?.orderStats.byStatus || []).map((stat, index) => (
                  <div key={stat.status} className="flex items-center justify-between text-sm group">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full ring-2 ring-transparent group-hover:ring-offset-1 transition-all"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{stat.status}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{stat.count}</div>
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

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Revenue source breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Using native HTML progress bars styled with Tailwind for a change */}
              {(data?.orderStats.byPaymentMethod || []).map((stat, index) => {
                 const total = data?.orderStats.byPaymentMethod.reduce((acc, curr) => acc + curr.amount, 0) || 1;
                 const percent = (stat.amount / total) * 100;
                 return (
                  <div key={stat.method} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium flex items-center gap-2">
                        <span className={`w-1 h-4 rounded-full ${index % 2 === 0 ? 'bg-blue-500' : 'bg-teal-500'}`} />
                        {stat.method}
                      </span>
                      <span className="font-mono text-muted-foreground">{stat.count} orders</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${index % 2 === 0 ? 'bg-blue-500' : 'bg-teal-500'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold w-20 text-right">
                        {Math.round(percent)}%
                      </span>
                    </div>
                    <p className="text-xs text-right text-muted-foreground">
                      PKR {stat.amount.toLocaleString()}
                    </p>
                  </div>
                 )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Management */}
      <Card className="glass-card bg-gradient-to-br from-white/60 to-emerald-50/30 dark:from-slate-900/60 dark:to-emerald-900/10">
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
          <CardDescription>Collection & Handover Status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-xl bg-white/40 dark:bg-black/40 border border-white/20 flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collected</span>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(data?.cashManagement.totalCashCollected || 0)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">From {data?.cashManagement.cashOrders} orders</p>
            </div>

            <div className="p-4 rounded-xl bg-white/40 dark:bg-black/40 border border-yellow-500/20 flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute right-0 top-0 p-2 opacity-10">
                <Clock className="h-16 w-16 text-yellow-500" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Handover</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {data?.cashManagement.pendingHandovers.count}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                  Action Needed
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                PKR {(data?.cashManagement.pendingHandovers.amount || 0).toLocaleString()} waiting
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/40 dark:bg-black/40 border border-green-500/20 flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verified</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                  PKR {data?.cashManagement.verifiedCash?.toLocaleString() ?? '0'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Safely deposited</p>
            </div>

            <div className="p-4 rounded-xl bg-white/40 dark:bg-black/40 border border-blue-500/20 flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collection Rate</span>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {(data?.cashManagement?.cashOrders || 0) > 0
                    ? (((data?.cashManagement.totalCashCollected || 0) / (data?.overview.totalRevenue || 1)) * 100).toFixed(1)
                    : '0'}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Cash vs Total Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver & Inventory Split */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Top Drivers</CardTitle>
            <CardDescription>Performance Leaderboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data?.driverPerformance || []).slice(0, 5).map((driver, index) => (
                <div key={driver.driverId} className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow-md ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-900' :
                    index === 2 ? 'bg-amber-600 text-white' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{driver.driverName}</span>
                      <Badge variant="outline" className="text-xs">
                        PKR {driver.revenue.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="w-full h-1.5 bg-secondary/30 rounded-full overflow-hidden">
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

        <div className="space-y-6">
          <Card className="glass-card bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-200/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-blue-500" />
                Bottle Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 text-center divide-x divide-white/20">
                <div className="p-2">
                  <div className="text-xs text-muted-foreground uppercase">Given</div>
                  <div className="text-xl font-bold text-blue-600">{data?.bottleStats.filledGiven}</div>
                </div>
                <div className="p-2">
                  <div className="text-xs text-muted-foreground uppercase">Returned</div>
                  <div className="text-xl font-bold text-teal-600">{data?.bottleStats.emptyTaken}</div>
                </div>
                <div className="p-2">
                  <div className="text-xs text-muted-foreground uppercase">Loss/Net</div>
                  <div className={`text-xl font-bold ${data?.bottleStats.netDifference > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                    {data?.bottleStats.netDifference}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                 <div className="flex justify-between text-xs mb-1">
                    <span>Return Rate</span>
                    <span className="font-bold">{data?.bottleStats.filledGiven ? ((data?.bottleStats.emptyTaken / data?.bottleStats.filledGiven) * 100).toFixed(1) : 0}%</span>
                 </div>
                 <div className="h-2 w-full bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-teal-400" style={{ width: `${data?.bottleStats.filledGiven ? ((data?.bottleStats.emptyTaken / data?.bottleStats.filledGiven) * 100) : 0}%` }} />
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle>Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  {(data?.inventory || []).filter(p => p.stockFilled < 50).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Inventory looks healthy!</div>
                  ) : (
                    (data?.inventory || []).filter(p => p.stockFilled < 50).map(product => (
                        <div key={product.id} className="flex items-center justify-between p-2 rounded bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{product.name}</span>
                                <span className="text-xs text-red-600 dark:text-red-400">Only {product.stockFilled} left</span>
                            </div>
                            <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 hover:bg-red-100">Restock</Button>
                        </div>
                    ))
                  )}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customer Segments & Alerts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card md:col-span-2">
            <CardHeader>
                <CardTitle>Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(data?.customerAnalytics.topCustomers || []).slice(0, 6).map((c, i) => (
                        <div key={c.customerId} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                    {c.customerName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{c.customerName}</p>
                                    <p className="text-xs text-muted-foreground">{c.orderCount} Orders</p>
                                </div>
                            </div>
                            <span className="font-mono font-semibold text-sm">
                                {new Intl.NumberFormat('en-PK', { compactDisplay: 'short', notation: "compact", style: 'currency', currency: 'PKR' }).format(c.totalRevenue)}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        <Card className="glass-card border-red-200/50 dark:border-red-900/50">
            <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Critical Alerts
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {data?.alerts.failedOrders.slice(0,3).map(order => (
                        <div key={order.id} className="p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-xs">
                            <div className="flex justify-between font-semibold text-red-700 dark:text-red-300">
                                <span>Order #{order.readableId}</span>
                                <span>Failed</span>
                            </div>
                            <div className="flex justify-between mt-1 text-red-600/80">
                                <span>{order.customerName}</span>
                                <span>PKR {order.amount}</span>
                            </div>
                        </div>
                    ))}
                    {data?.alerts.highCreditCustomers.slice(0,3).map(c => (
                        <div key={c.id} className="p-2 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 text-xs">
                             <div className="flex justify-between font-semibold text-orange-700 dark:text-orange-300">
                                <span>{c.name}</span>
                                <span>Credit Limit</span>
                            </div>
                            <div className="mt-1 text-orange-600/80">
                                Used: {c.utilizationPercent.toFixed(0)}%
                            </div>
                        </div>
                    ))}
                    {!data?.alerts.failedOrders.length && !data?.alerts.highCreditCustomers.length && (
                        <div className="text-center py-4 text-green-600 flex flex-col items-center">
                            <CheckCircle className="h-8 w-8 mb-2 opacity-50" />
                            <span className="text-sm">All systems normal</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
