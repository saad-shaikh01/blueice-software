import { CashHandoverStatus, OrderStatus, PaymentMethod, Prisma } from '@prisma/client';

import { db } from '@/lib/db';

// --------------------------------------------------------
// 1. DRIVER FUNCTIONS - End of Day Cash Handover
// --------------------------------------------------------

/**
 * Calculate expected cash for a driver on a specific date
 */
export async function calculateExpectedCash(driverId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db.order.aggregate({
    where: {
      driverId,
      scheduledDate: { gte: startOfDay, lte: endOfDay },
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.CASH,
    },
    _sum: {
      cashCollected: true,
    },
  });

  return result._sum.cashCollected?.toString() || '0';
}

/**
 * Get driver's day summary for cash handover
 */
export async function getDriverDaySummary(driverId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const [ordersData, cashData, bottleData] = await Promise.all([
    // Order counts
    db.order.groupBy({
      by: ['status'],
      where: {
        driverId,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
      },
      _count: { id: true },
    }),

    // Cash orders
    db.order.findMany({
      where: {
        driverId,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        status: OrderStatus.COMPLETED,
        paymentMethod: PaymentMethod.CASH,
      },
      select: {
        id: true,
        readableId: true,
        cashCollected: true,
        customer: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),

    // Bottle summary
    db.orderItem.aggregate({
      where: {
        order: {
          driverId,
          scheduledDate: { gte: startOfDay, lte: endOfDay },
          status: OrderStatus.COMPLETED,
        },
      },
      _sum: {
        filledGiven: true,
        emptyTaken: true,
      },
    }),
  ]);

  const totalOrders = ordersData.reduce((acc, curr) => acc + curr._count.id, 0);
  const completedOrders = ordersData.find((o) => o.status === OrderStatus.COMPLETED)?._count.id || 0;
  const cashOrders = cashData.length;

  // Calculate expenses paid from cash on hand for this driver today
  const expenses = await db.expense.aggregate({
    where: {
      driverId,
      date: { gte: startOfDay, lte: endOfDay },
      paymentMethod: 'CASH_ON_HAND',
      status: { not: 'REJECTED' },
    },
    _sum: { amount: true },
  });

  const expensesAmount = parseFloat(expenses._sum.amount?.toString() || '0');
  const grossCash = cashData.reduce((acc, order) => acc + parseFloat(order.cashCollected.toString()), 0);
  const expectedCash = grossCash - expensesAmount;

  return {
    totalOrders,
    completedOrders,
    cashOrders,
    grossCash: grossCash.toFixed(2),
    expensesAmount: expensesAmount.toFixed(2),
    expectedCash: expectedCash.toFixed(2),
    bottlesGiven: bottleData._sum.filledGiven || 0,
    bottlesTaken: bottleData._sum.emptyTaken || 0,
    ordersPaidInCash: cashData.map((order) => ({
      id: order.id,
      readableId: order.readableId,
      customerName: order.customer.user.name,
      amount: order.cashCollected.toString(),
    })),
  };
}

/**
 * Submit cash handover (Driver action)
 */
export async function submitCashHandover(data: {
  driverId: string;
  date: Date;
  actualCash: number;
  driverNotes?: string;
  shiftStart?: Date;
  shiftEnd?: Date;
}) {
  const { driverId, date, actualCash, driverNotes, shiftStart, shiftEnd } = data;

  // Get day summary
  const summary = await getDriverDaySummary(driverId, date);
  const expectedCash = parseFloat(summary.expectedCash);
  const discrepancy = expectedCash - actualCash;

  // Check if handover already exists
  const existing = await db.cashHandover.findUnique({
    where: {
      driverId_date: {
        driverId,
        date: new Date(date.toDateString()),
      },
    },
  });

  if (existing) {
    // Update existing handover if still PENDING
    if (existing.status !== CashHandoverStatus.PENDING) {
      throw new Error('Cannot update verified handover');
    }

    return await db.cashHandover.update({
      where: { id: existing.id },
      data: {
        actualCash,
        discrepancy,
        driverNotes,
        shiftStart,
        shiftEnd,
        expectedCash,
        totalOrders: summary.totalOrders,
        completedOrders: summary.completedOrders,
        cashOrders: summary.cashOrders,
        bottlesGiven: summary.bottlesGiven,
        bottlesTaken: summary.bottlesTaken,
        updatedAt: new Date(),
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                name: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });
  }

  // Create new handover
  return await db.cashHandover.create({
    data: {
      driverId,
      date: new Date(date.toDateString()),
      expectedCash,
      actualCash,
      discrepancy,
      driverNotes,
      shiftStart,
      shiftEnd,
      totalOrders: summary.totalOrders,
      completedOrders: summary.completedOrders,
      cashOrders: summary.cashOrders,
      bottlesGiven: summary.bottlesGiven,
      bottlesTaken: summary.bottlesTaken,
      status: CashHandoverStatus.PENDING,
    },
    include: {
      driver: {
        include: {
          user: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
        },
      },
    },
  });
}

// --------------------------------------------------------
// 2. ADMIN FUNCTIONS - Cash Verification & Management
// --------------------------------------------------------

/**
 * Get all cash handovers with filters
 */
export async function getCashHandovers(params: {
  status?: CashHandoverStatus;
  driverId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const { status, driverId, startDate, endDate, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.CashHandoverWhereInput = {
    ...(status && { status }),
    ...(driverId && { driverId }),
    ...(startDate &&
      endDate && {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }),
  };

  const [handovers, total] = await Promise.all([
    db.cashHandover.findMany({
      where,
      skip,
      take: limit,
      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
      orderBy: [{ date: 'desc' }, { submittedAt: 'desc' }],
    }),
    db.cashHandover.count({ where }),
  ]);

  return {
    handovers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get single cash handover details
 */
export async function getCashHandover(id: string) {
  const handover = await db.cashHandover.findUnique({
    where: { id },
    include: {
      driver: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!handover) return null;

  // Calculate potential "Hidden Expenses" (Pending) for this date range
  const startOfDay = new Date(handover.date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(handover.date);
  endOfDay.setHours(23, 59, 59, 999);

  const pendingExpenses = await db.expense.aggregate({
    where: {
      driverId: handover.driverId,
      date: { gte: startOfDay, lte: endOfDay },
      paymentMethod: 'CASH_ON_HAND',
      status: 'PENDING',
    },
    _sum: { amount: true },
  });

  const pendingExpenseAmount = parseFloat(pendingExpenses._sum.amount?.toString() || '0');

  // "Gross Cash" is essentially (Expected Net + Expenses Deducted)
  // But wait, the stored `expectedCash` was calculated as (Gross - All Non-Rejected Expenses).
  // If we want to show "Gross", we need to add back the expenses that were deducted.

  // Let's fetch ALL expenses for that day to reconstruct Gross
  const allExpenses = await db.expense.aggregate({
    where: {
      driverId: handover.driverId,
      date: { gte: startOfDay, lte: endOfDay },
      paymentMethod: 'CASH_ON_HAND',
      status: { not: 'REJECTED' },
    },
    _sum: { amount: true },
  });

  const totalDeductedExpenses = parseFloat(allExpenses._sum.amount?.toString() || '0');
  const grossCash = parseFloat(handover.expectedCash.toString()) + totalDeductedExpenses;

  return {
    ...handover,
    grossCash: grossCash.toFixed(2),
    pendingExpenseAmount: pendingExpenseAmount.toFixed(2),
  };
}

/**
 * Verify cash handover (Admin action)
 */
export async function verifyCashHandover(data: {
  id: string;
  verifiedBy: string;
  status: 'VERIFIED' | 'REJECTED' | 'ADJUSTED';
  adminNotes?: string;
  adjustmentAmount?: number;
}) {
  const { id, verifiedBy, status, adminNotes, adjustmentAmount } = data;

  const handover = await db.cashHandover.findUnique({ where: { id } });
  if (!handover) throw new Error('Cash handover not found');

  if (handover.status !== CashHandoverStatus.PENDING) {
    throw new Error('Only pending handovers can be verified');
  }

  return await db.cashHandover.update({
    where: { id },
    data: {
      status,
      verifiedBy,
      verifiedAt: new Date(),
      adminNotes,
      adjustmentAmount: adjustmentAmount ? adjustmentAmount : undefined,
    },
    include: {
      driver: {
        include: {
          user: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get cash management dashboard statistics
 */
export async function getCashDashboardStats(date?: Date) {
  const today = date || new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const [handoverStats, todayCashOrders, pendingHandovers, discrepancies] = await Promise.all([
    // Handover status breakdown
    db.cashHandover.groupBy({
      by: ['status'],
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      _count: { id: true },
      _sum: {
        expectedCash: true,
        actualCash: true,
        discrepancy: true,
      },
    }),

    // Today's cash orders
    db.order.aggregate({
      where: {
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        status: OrderStatus.COMPLETED,
        paymentMethod: PaymentMethod.CASH,
      },
      _sum: {
        cashCollected: true,
      },
      _count: { id: true },
    }),

    // Pending handovers count
    db.cashHandover.count({
      where: {
        status: CashHandoverStatus.PENDING,
      },
    }),

    // Large discrepancies (> 500 PKR)
    db.cashHandover.count({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        discrepancy: { gt: 500 },
      },
    }),
  ]);

  const pending = handoverStats.find((s) => s.status === CashHandoverStatus.PENDING);
  const verified = handoverStats.find((s) => s.status === CashHandoverStatus.VERIFIED);
  const rejected = handoverStats.find((s) => s.status === CashHandoverStatus.REJECTED);

  return {
    today: {
      totalCashOrders: todayCashOrders._count.id,
      totalCashCollected: todayCashOrders._sum.cashCollected?.toString() || '0',
    },
    handovers: {
      pending: pending?._count.id || 0,
      pendingAmount: pending?._sum.actualCash?.toString() || '0',
      verified: verified?._count.id || 0,
      verifiedAmount: verified?._sum.actualCash?.toString() || '0',
      rejected: rejected?._count.id || 0,
      totalDiscrepancy: handoverStats.reduce((acc, s) => acc + parseFloat(s._sum.discrepancy?.toString() || '0'), 0),
    },
    alerts: {
      pendingHandovers,
      largeDiscrepancies: discrepancies,
    },
  };
}

/**
 * Get driver's handover history
 */
export async function getDriverHandoverHistory(driverId: string, limit = 10) {
  return await db.cashHandover.findMany({
    where: { driverId },
    take: limit,
    orderBy: { date: 'desc' },
    include: {
      driver: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get cash collection trends
 */
export async function getCashCollectionTrends(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const trends = await db.cashHandover.groupBy({
    by: ['date'],
    where: {
      date: { gte: startDate },
      status: CashHandoverStatus.VERIFIED,
    },
    _sum: {
      actualCash: true,
      expectedCash: true,
      discrepancy: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  return trends.map((t) => ({
    date: t.date,
    actualCash: t._sum.actualCash?.toString() || '0',
    expectedCash: t._sum.expectedCash?.toString() || '0',
    discrepancy: t._sum.discrepancy?.toString() || '0',
  }));
}
