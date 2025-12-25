import { db } from '@/lib/db';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function getComprehensiveDashboardData(params?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const { startDate = startOfDay(new Date()), endDate = endOfDay(new Date()) } = params || {};

  // Previous period for comparison
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const prevStartDate = subDays(startDate, daysDiff);
  const prevEndDate = subDays(endDate, daysDiff);

  const [
    // Overview KPIs
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalDrivers,

    // Previous period for comparison
    prevRevenue,
    prevOrders,

    // Order breakdown
    ordersByStatus,
    ordersByPaymentMethod,

    // Cash management
    cashStats,
    pendingHandovers,

    // Driver performance
    driverPerformance,

    // Bottle inventory
    bottleStats,
    productInventory,

    // Revenue trends (last 30 days)
    revenueTrend,

    // Order trends (last 30 days)
    orderTrend,

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
    // Total Revenue (current period)
    db.order.aggregate({
      where: {
        scheduledDate: { gte: startDate, lte: endDate },
        status: OrderStatus.COMPLETED,
      },
      _sum: { totalAmount: true, cashCollected: true },
    }),

    // Total Orders (current period)
    db.order.count({
      where: {
        scheduledDate: { gte: startDate, lte: endDate },
      },
    }),

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

    // Orders by status
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

    // Revenue trend (last 30 days)
    db.$queryRaw`
      SELECT
        DATE("scheduledDate") as date,
        SUM("totalAmount") as revenue,
        COUNT(*) as orders
      FROM "Order"
      WHERE "scheduledDate" >= ${subDays(endDate, 30)}
        AND "scheduledDate" <= ${endDate}
        AND status = ${OrderStatus.COMPLETED}::"OrderStatus"
      GROUP BY DATE("scheduledDate")
      ORDER BY date ASC
    `,

    // Order trend by status (last 30 days)
    db.$queryRaw`
      SELECT
        DATE("scheduledDate") as date,
        status,
        COUNT(*) as count
      FROM "Order"
      WHERE "scheduledDate" >= ${subDays(endDate, 30)}
        AND "scheduledDate" <= ${endDate}
      GROUP BY DATE("scheduledDate"), status
      ORDER BY date ASC
    `,

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
  const currentRevenue = parseFloat(totalRevenue._sum.totalAmount?.toString() || '0');
  const previousRevenue = parseFloat(prevRevenue._sum.totalAmount?.toString() || '0');
  const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  const ordersChange = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0;

  return {
    overview: {
      totalRevenue: currentRevenue,
      revenueChange,
      totalOrders,
      ordersChange,
      totalCustomers,
      totalDrivers,
      newCustomers,
      avgOrderValue: totalOrders > 0 ? currentRevenue / totalOrders : 0,
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
      revenue: (revenueTrend as any[]).map((t) => ({
        date: format(new Date(t.date), 'MMM dd'),
        revenue: parseFloat(t.revenue?.toString() || '0'),
        orders: Number(t.orders || 0),
      })),
      orders: (orderTrend as any[]).reduce((acc: any[], curr) => {
        const existing = acc.find((item) => item.date === format(new Date(curr.date), 'MMM dd'));
        if (existing) {
          existing[curr.status] = Number(curr.count || 0);
        } else {
          acc.push({
            date: format(new Date(curr.date), 'MMM dd'),
            [curr.status]: Number(curr.count || 0),
          });
        }
        return acc;
      }, []),
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
  };
}
