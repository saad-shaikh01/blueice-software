import { ExpenseCategory, ExpenseStatus, Prisma } from '@prisma/client';

import { db } from '@/lib/db';

interface GetExpensesParams {
  driverId?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export async function getExpenses(params: GetExpensesParams) {
  const { driverId, category, status, startDate, endDate, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.ExpenseWhereInput = {
    ...(driverId && { driverId }),
    ...(category && { category }),
    ...(status && { status }),
    ...(startDate &&
      endDate && {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }),
  };

  const [expenses, total] = await Promise.all([
    db.expense.findMany({
      where,
      skip,
      take: limit,
      include: {
        spentByUser: {
          select: {
            name: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        approvedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    }),
    db.expense.count({ where }),
  ]);

  return {
    expenses,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createExpense(data: any & { spentByUserId: string }) {
  // If spentByUserId corresponds to a driver, automatically link it
  let driverId = data.driverId;

  if (!driverId) {
    const driverProfile = await db.driverProfile.findUnique({
      where: { userId: data.spentByUserId },
    });
    if (driverProfile) {
      driverId = driverProfile.id;
    }
  }

  // Auto-approve if created by Admin (logic handled in route handler or here)
  // For now, default is PENDING for drivers, APPROVED for admins?
  // Let's handle status in the route based on role.

  return await db.expense.create({
    data: {
      ...data,
      driverId,
    },
  });
}

export async function updateExpense(id: string, data: any) {
  return await db.expense.update({
    where: { id },
    data,
  });
}

export async function deleteExpense(id: string) {
  return await db.expense.delete({
    where: { id },
  });
}
