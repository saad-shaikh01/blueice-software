import { db } from '@/lib/db';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export async function getComprehensiveDashboardData(params?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const { startDate = startOfDay(new Date()), endDate = endOfDay(new Date()) } = params || {};
  const today = startOfDay(new Date());

  // Determine Historical vs Live Periods
  const isHistoricalOnly = endDate < today;
  const isLiveOnly = startDate >= today;
  const isHybrid = !isHistoricalOnly && !isLiveOnly;

  // Split dates for hybrid approach
  const historicalEnd = isHybrid ? subDays(today, 1) : endDate;
  const liveStart = isHybrid ? today : startDate;

  // 1. Fetch Historical Stats (from DailyStats)
  let historicalRevenue = 0;
  let historicalOrders = 0;
  let historicalTrends: { date: Date; revenue: number; orders: number }[] = [];
  let historicalOrderBreakdown: Record<string, number> = {};

  if (!isLiveOnly) {
    const dailyStats = await db.dailyStats.findMany({
      where: {
        date: {
          gte: startDate,
          lte: historicalEnd,
        },
      },
      orderBy: { date: 'asc' },
    });

    for (const stat of dailyStats) {
      const revenue = Number(stat.totalRevenue);
      historicalRevenue += revenue;
      historicalOrders += stat.ordersCompleted; // Use ordersCompleted as primary metric for history

      historicalTrends.push({
        date: stat.date,
        revenue,
        orders: stat.ordersCompleted,
      });

      // Aggregate status breakdown from DailyStats columns
      historicalOrderBreakdown[OrderStatus.COMPLETED] = (historicalOrderBreakdown[OrderStatus.COMPLETED] || 0) + stat.ordersCompleted;
      historicalOrderBreakdown[OrderStatus.CANCELLED] = (historicalOrderBreakdown[OrderStatus.CANCELLED] || 0) + stat.ordersCancelled;
      historicalOrderBreakdown[OrderStatus.PENDING] = (historicalOrderBreakdown[OrderStatus.PENDING] || 0) + stat.ordersPending;
      historicalOrderBreakdown[OrderStatus.RESCHEDULED] = (historicalOrderBreakdown[OrderStatus.RESCHEDULED] || 0) + stat.ordersRescheduled;
    }
  }

  // 2. Fetch Live Stats (from Order table) - Only if needed
  let liveRevenue = 0;
  let liveOrders = 0;
  let liveTrends: { date: Date; revenue: number; orders: number }[] = [];
  let liveOrderBreakdown: Record<string, number> = {};

  if (!isHistoricalOnly) {
    // Live Revenue
    const revenueAgg = await db.order.aggregate({
      where: {
        scheduledDate: { gte: liveStart, lte: endDate },
        status: OrderStatus.COMPLETED,
      },
      _sum: { totalAmount: true },
    });
    liveRevenue = Number(revenueAgg._sum.totalAmount || 0);

    // Live Order Count (Completed)
    const ordersAgg = await db.order.count({
      where: {
        scheduledDate: { gte: liveStart, lte: endDate },
        status: OrderStatus.COMPLETED,
      },
    });
    liveOrders = ordersAgg;

    // Live Revenue Trend (Group by Date)
    // Even for a single day (today), we want it in the trend array
    // If range is multiple live days (e.g. future?), this query handles it.
    const liveTrendRaw = await db.$queryRaw`
      SELECT
        DATE("scheduledDate") as date,
        SUM("totalAmount") as revenue,
        COUNT(*) as orders
      FROM "Order"
      WHERE "scheduledDate" >= ${liveStart}
        AND "scheduledDate" <= ${endDate}
        AND status = ${OrderStatus.COMPLETED}::"OrderStatus"
      GROUP BY DATE("scheduledDate")
      ORDER BY date ASC
    `;

    liveTrends = (liveTrendRaw as any[]).map((t) => ({
      date: new Date(t.date),
      revenue: Number(t.revenue || 0),
      orders: Number(t.orders || 0),
    }));

    // Live Order Status Breakdown
    const statusGroups = await db.order.groupBy({
      by: ['status'],
      where: {
        scheduledDate: { gte: liveStart, lte: endDate },
      },
      _count: { id: true },
    });

    for (const group of statusGroups) {
      liveOrderBreakdown[group.status] = group._count.id;
    }
  }

  // 3. Combine Data
  const totalRevenue = historicalRevenue + liveRevenue;
  const totalOrders = historicalOrders + liveOrders; // Note: This is "Completed Orders" + "Completed Orders".
  // Wait, the KPI usually shows "Total Orders" (all statuses) or just Completed?
  // Previous implementation: db.order.count({ where: { scheduledDate... } }) -> All statuses.
  // DailyStats.ordersCompleted is only completed.
  // DailyStats also has ordersPending, ordersCancelled.
  // Let's perform a better sum for "Total Orders" KPI if we want it to match "All Statuses".
  let historicalTotalOrdersAllStatus = 0;
  if (!isLiveOnly) {
     // Re-fetch or re-calculate if we want ALL statuses
     // DailyStats has: ordersCompleted + ordersCancelled + ordersPending + ordersRescheduled
     // Let's approximate Total Volume = Sum of all these.
     // Reuse the loop above?
     // Let's refine step 1 loop.
  }

  // Re-run historical loop with better accumulation
  historicalRevenue = 0;
  historicalOrders = 0; // Completed only
  let historicalTotalVolume = 0; // All statuses
  historicalTrends = [];
  historicalOrderBreakdown = {};

  if (!isLiveOnly) {
    const dailyStats = await db.dailyStats.findMany({
      where: {
        date: {
          gte: startDate,
          lte: historicalEnd,
        },
      },
      orderBy: { date: 'asc' },
    });

    for (const stat of dailyStats) {
      const revenue = Number(stat.totalRevenue);
      historicalRevenue += revenue;
      historicalOrders += stat.ordersCompleted;
      historicalTotalVolume += (stat.ordersCompleted + stat.ordersCancelled + stat.ordersPending + stat.ordersRescheduled);

      historicalTrends.push({
        date: stat.date,
        revenue,
        orders: stat.ordersCompleted,
      });

      historicalOrderBreakdown[OrderStatus.COMPLETED] = (historicalOrderBreakdown[OrderStatus.COMPLETED] || 0) + stat.ordersCompleted;
      historicalOrderBreakdown[OrderStatus.CANCELLED] = (historicalOrderBreakdown[OrderStatus.CANCELLED] || 0) + stat.ordersCancelled;
      historicalOrderBreakdown[OrderStatus.PENDING] = (historicalOrderBreakdown[OrderStatus.PENDING] || 0) + stat.ordersPending;
      historicalOrderBreakdown[OrderStatus.RESCHEDULED] = (historicalOrderBreakdown[OrderStatus.RESCHEDULED] || 0) + stat.ordersRescheduled;
    }
  }

  // Re-run Live fetch for Total Volume
  let liveTotalVolume = 0;
  if (!isHistoricalOnly) {
     liveTotalVolume = await db.order.count({
        where: { scheduledDate: { gte: liveStart, lte: endDate } }
     });
  }

  const finalTotalRevenue = historicalRevenue + liveRevenue;
  const finalTotalOrders = historicalTotalVolume + liveTotalVolume;

  // Previous period for comparison (Keep this as raw for now to ensure accuracy, or optimize later)
  const prevDaysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const prevStartDate = subDays(startDate, prevDaysDiff);
  const prevEndDate = subDays(endDate, prevDaysDiff);

  const [
    // Overview KPIs
    totalCustomers,
    totalDrivers,

    // Previous period revenue
    prevRevenue,
    prevOrders,

    // Order breakdown (Detailed - keeping raw for payment method etc as DailyStats doesn't have it)
    // Note: We aggregated status breakdown above, but we need it for the specific chart which expects { status, count, amount }.
    // DailyStats doesn't have Amount per Status, only Total Amount.
    // So for "Orders by Status" list (with amounts), we might still need raw queries OR accept that history won't have amounts per status?
    // The Dashboard UI shows: Status Name | Order Count | Total Revenue.
    // If we want high performance, we drop the "Amount per Status" for history and just show counts?
    // Or we stick to Raw Query for the "Order Stats" section (Pie Chart) because it's usually over the selected period?
    // The prompt asked to "Fetch Historical Data (Trends, Past Revenue, Order Counts)".
    // It didn't explicitly forbid raw queries for detailed breakdowns.
    // Let's optimize the TRENDS and KPIs. The "Pie Chart" query is relatively light compared to trends over 30 days.
    // But wait, if selected period is 30 days, grouping by status is same cost as trends.
    // Let's stick to the plan: Hybrid for Trends/Revenue. Keep others raw for correctness/detail.

    ordersByStatus, // We will use this for the Pie Chart to ensure we have Amounts.
    ordersByPaymentMethod,

    // Cash management
    cashStats,
    pendingHandovers,

    // Driver performance
    driverPerformance,

    // Bottle inventory
    bottleStats,
    productInventory,

    // Customer analytics
    newCustomers,
    customersByType,
    topCustomers,

    // Route performance
    routePerformance,

    // Exceptions and alerts
    failedOrders,
    lowStockProducts,
    highCreditCustomers,
  ] = await Promise.all([
    // Total Active Customers
    db.customerProfile.count({
      where: { user: { isActive: true } },
    }),

    // Total Active Drivers
    db.driverProfile.count({
      where: { user: { isActive: true } },
    }),

    // Previous period revenue
    db.order.aggregate({
      where: {
        scheduledDate: { gte: prevStartDate, lte: prevEndDate },
        status: OrderStatus.COMPLETED,
      },
      _sum: { totalAmount: true },
    }),

    // Previous period orders
    db.order.count({
      where: {
        scheduledDate: { gte: prevStartDate, lte: prevEndDate },
      },
    }),

    // Orders by status (Raw query to get amounts, efficient enough with index)
    db.order.groupBy({
      by: ['status'],
      where: {
        scheduledDate: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
      _sum: { totalAmount: true },
    }),

    // Orders by payment method
    db.order.groupBy({
      by: ['paymentMethod'],
      where: {
        scheduledDate: { gte: startDate, lte: endDate },
        status: OrderStatus.COMPLETED,
      },
      _count: { id: true },
      _sum: { cashCollected: true },
    }),

    // Cash management stats
    db.order.aggregate({
      where: {
        scheduledDate: { gte: startDate, lte: endDate },
        status: OrderStatus.COMPLETED,
        paymentMethod: PaymentMethod.CASH,
      },
      _sum: { cashCollected: true },
      _count: { id: true },
    }),

    // Pending cash handovers
    db.$queryRaw`
      SELECT COUNT(*) as count, SUM("actualCash") as amount
      FROM "CashHandover"
      WHERE status = 'PENDING'
    `,

    // Driver performance
    db.order.groupBy({
      by: ['driverId'],
      where: {
        scheduledDate: { gte: startDate, lte: endDate },
        status: OrderStatus.COMPLETED,
        driverId: { not: null },
      },
      _count: { id: true },
      _sum: { cashCollected: true, totalAmount: true },
    }),

    // Bottle statistics
    db.orderItem.aggregate({
      where: {
        order: {
          scheduledDate: { gte: startDate, lte: endDate },
          status: OrderStatus.COMPLETED,
        },
      },
      _sum: { filledGiven: true, emptyTaken: true, quantity: true },
    }),

    // Product inventory levels
    db.product.findMany({
      select: {
        id: true,
        name: true,
        stockFilled: true,
        stockEmpty: true,
        basePrice: true,
      },
      orderBy: { name: 'asc' },
    }),

    // New customers (current period)
    db.customerProfile.count({
      where: {
        user: {
          createdAt: { gte: startDate, lte: endDate },
        },
      },
    }),

    // Customers by type
    db.customerProfile.groupBy({
      by: ['type'],
      _count: { id: true },
    }),

    // Top customers by revenue
    db.order.groupBy({
      by: ['customerId'],
      where: {
        scheduledDate: { gte: startDate, lte: endDate },
        status: OrderStatus.COMPLETED,
      },
      _sum: { totalAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 10,
    }),

    // Route performance
    db.$queryRaw`
      SELECT
        r.name as "routeName",
        COUNT(o.id) as count,
        SUM(o."totalAmount") as revenue
      FROM "Order" o
      JOIN "CustomerProfile" c ON o."customerId" = c.id
      JOIN "Route" r ON c."routeId" = r.id
      WHERE o."scheduledDate" >= ${startDate}
        AND o."scheduledDate" <= ${endDate}
        AND o.status = ${OrderStatus.COMPLETED}::"OrderStatus"
      GROUP BY r.name
      ORDER BY revenue DESC
    `,

    // Failed/Cancelled orders
    db.order.findMany({
      where: {
        scheduledDate: { gte: startDate, lte: endDate },
        status: { in: [OrderStatus.CANCELLED] },
      },
      select: {
        id: true,
        readableId: true,
        customer: {
          select: {
            user: { select: { name: true } },
          },
        },
        scheduledDate: true,
        totalAmount: true,
      },
      take: 10,
      orderBy: { scheduledDate: 'desc' },
    }),

    // Low stock products (< 20)
    db.product.findMany({
      where: {
        stockFilled: { lt: 20 },
      },
      select: {
        id: true,
        name: true,
        stockFilled: true,
        stockEmpty: true,
      },
      orderBy: { stockFilled: 'asc' },
    }),

    // High credit customers (approaching limit)
    db.customerProfile.findMany({
      where: {
        cashBalance: { lt: 0 },
      },
      select: {
        id: true,
        user: { select: { name: true, phoneNumber: true } },
        cashBalance: true,
        creditLimit: true,
      },
      orderBy: { cashBalance: 'asc' },
      take: 10,
    }),
  ]);

  // Combine Trends
  const combinedRevenueTrend = [...historicalTrends, ...liveTrends].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Combine Order Trends (Breakdown by status for Stacked Bar Chart)
  // We need to merge historicalOrderBreakdown (which was simple aggregate) into daily breakdown?
  // Wait, step 1 aggregated ONLY TOTALS into breakdown. It didn't keep per-day status breakdown.
  // To populate "Order Status Trend (Last 30 Days)" chart, we need PER DAY status.
  // The DailyStats table has columns for this!
  // Let's refetch Historical Trends properly with status columns.

  const combinedOrderTrends: any[] = [];

  if (!isLiveOnly) {
    const dailyStats = await db.dailyStats.findMany({
      where: {
        date: { gte: startDate, lte: historicalEnd },
      },
      orderBy: { date: 'asc' },
    });

    dailyStats.forEach(stat => {
      combinedOrderTrends.push({
        date: format(stat.date, 'MMM dd'),
        [OrderStatus.COMPLETED]: stat.ordersCompleted,
        [OrderStatus.PENDING]: stat.ordersPending,
        [OrderStatus.CANCELLED]: stat.ordersCancelled,
        [OrderStatus.RESCHEDULED]: stat.ordersRescheduled,
      });
    });
  }

  // Fetch Live Order Status Trend (Group by Date and Status)
  if (!isHistoricalOnly) {
    const liveOrderTrendRaw = await db.$queryRaw`
      SELECT
        DATE("scheduledDate") as date,
        status,
        COUNT(*) as count
      FROM "Order"
      WHERE "scheduledDate" >= ${liveStart}
        AND "scheduledDate" <= ${endDate}
      GROUP BY DATE("scheduledDate"), status
      ORDER BY date ASC
    `;

    // Merge live trends into combined array
    (liveOrderTrendRaw as any[]).forEach((curr) => {
        const dateStr = format(new Date(curr.date), 'MMM dd');
        let existing = combinedOrderTrends.find(i => i.date === dateStr);
        if (!existing) {
            existing = { date: dateStr };
            combinedOrderTrends.push(existing);
        }
        existing[curr.status] = Number(curr.count || 0);
    });
  }

  // Get driver details for performance
  const driverIds = driverPerformance.map((d) => d.driverId).filter(Boolean) as string[];
  const drivers = await db.driverProfile.findMany({
    where: { id: { in: driverIds } },
    select: {
      id: true,
      user: { select: { name: true } },
    },
  });

  // Get customer details for top customers
  const customerIds = topCustomers.map((c) => c.customerId);
  const customers = await db.customerProfile.findMany({
    where: { id: { in: customerIds } },
    select: {
      id: true,
      user: { select: { name: true } },
    },
  });

  // Calculate percentages and comparisons
  const currentRevenueValue = finalTotalRevenue;
  const previousRevenueValue = parseFloat(prevRevenue._sum.totalAmount?.toString() || '0');
  const revenueChange = previousRevenueValue > 0 ? ((currentRevenueValue - previousRevenueValue) / previousRevenueValue) * 100 : 0;
  const ordersChange = prevOrders > 0 ? ((finalTotalOrders - prevOrders) / prevOrders) * 100 : 0;

  return {
    overview: {
      totalRevenue: currentRevenueValue,
      revenueChange,
      totalOrders: finalTotalOrders,
      ordersChange,
      totalCustomers,
      totalDrivers,
      newCustomers,
      avgOrderValue: finalTotalOrders > 0 ? currentRevenueValue / finalTotalOrders : 0,
    },
    orderStats: {
      byStatus: ordersByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
        amount: parseFloat(s._sum.totalAmount?.toString() || '0'),
      })),
      byPaymentMethod: ordersByPaymentMethod.map((p) => ({
        method: p.paymentMethod,
        count: p._count.id,
        amount: parseFloat(p._sum.cashCollected?.toString() || '0'),
      })),
    },
    cashManagement: {
      totalCashCollected: parseFloat(cashStats._sum.cashCollected?.toString() || '0'),
      cashOrders: cashStats._count.id,
      pendingHandovers: Array.isArray(pendingHandovers) && pendingHandovers[0]
        ? {
          count: Number(pendingHandovers[0].count || 0),
          amount: parseFloat(pendingHandovers[0].amount?.toString() || '0'),
        }
        : { count: 0, amount: 0 },
    },
    driverPerformance: driverPerformance
      .map((d) => {
        const driver = drivers.find((dr) => dr.id === d.driverId);
        return {
          driverId: d.driverId || '',
          driverName: driver?.user.name || 'Unknown',
          completedOrders: d._count.id,
          cashCollected: parseFloat(d._sum.cashCollected?.toString() || '0'),
          revenue: parseFloat(d._sum.totalAmount?.toString() || '0'),
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
    bottleStats: {
      filledGiven: bottleStats._sum.filledGiven || 0,
      emptyTaken: bottleStats._sum.emptyTaken || 0,
      netDifference: (bottleStats._sum.filledGiven || 0) - (bottleStats._sum.emptyTaken || 0),
      totalQuantity: bottleStats._sum.quantity || 0,
    },
    inventory: productInventory.map((p) => ({
      id: p.id,
      name: p.name,
      stockFilled: p.stockFilled,
      stockEmpty: p.stockEmpty,
      basePrice: parseFloat(p.basePrice.toString()),
      totalValue: p.stockFilled * parseFloat(p.basePrice.toString()),
    })),
    trends: {
      revenue: combinedRevenueTrend.map((t) => ({
        date: format(new Date(t.date), 'MMM dd'),
        revenue: t.revenue,
        orders: t.orders,
      })),
      orders: combinedOrderTrends,
    },
    customerAnalytics: {
      byType: customersByType.map((c) => ({
        type: c.type,
        count: c._count.id,
      })),
      topCustomers: topCustomers
        .map((c) => {
          const customer = customers.find((cu) => cu.id === c.customerId);
          return {
            customerId: c.customerId,
            customerName: customer?.user.name || 'Unknown',
            totalRevenue: parseFloat(c._sum.totalAmount?.toString() || '0'),
            orderCount: c._count.id,
          };
        })
        .slice(0, 10),
    },
    alerts: {
      failedOrders: failedOrders.map((o) => ({
        id: o.id,
        readableId: o.readableId,
        customerName: o.customer.user.name,
        date: o.scheduledDate,
        amount: parseFloat(o.totalAmount.toString()),
      })),
      lowStockProducts: lowStockProducts,
      highCreditCustomers: highCreditCustomers.map((c) => ({
        id: c.id,
        name: c.user.name,
        phone: c.user.phoneNumber,
        balance: parseFloat(c.cashBalance.toString()),
        creditLimit: parseFloat(c.creditLimit.toString()),
        utilizationPercent: Math.abs(parseFloat(c.cashBalance.toString())) / parseFloat(c.creditLimit.toString()) * 100,
      })),
    },
    routePerformance: (routePerformance as any[]).map((r) => ({
      name: r.routeName,
      count: Number(r.count),
      revenue: parseFloat(r.revenue?.toString() || '0'),
    })),
  };
}
