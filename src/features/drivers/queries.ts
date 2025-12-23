import { Prisma, UserRole, OrderStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/authenticate';

export async function createDriver(data: {
  name: string;
  phoneNumber: string;
  email: string | null;
  password: string;
  vehicleNo?: string | null;
  licenseNo?: string | null;
}) {
  const { name, phoneNumber, email, password, vehicleNo, licenseNo } = data;
  const hashedPassword = await hashPassword(password);

  return await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        phoneNumber,
        email,
        password: hashedPassword,
        role: UserRole.DRIVER,
      },
    });

    const driverProfile = await tx.driverProfile.create({
      data: {
        userId: user.id,
        vehicleNo,
        licenseNo,
      },
      include: {
        user: true,
      },
    });

    return driverProfile;
  });
}

export async function getDrivers(params: {
  search?: string;
  page: number;
  limit: number;
}) {
  const { search, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.DriverProfileWhereInput = search
    ? {
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { phoneNumber: { contains: search } } },
          { vehicleNo: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [drivers, total, cashCollectedStats] = await Promise.all([
    db.driverProfile.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            isActive: true,
            suspended: true,
          },
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    }),
    db.driverProfile.count({ where }),
    // Single query to get cash collected for all drivers at once
    db.order.groupBy({
      by: ['driverId'],
      where: {
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        status: OrderStatus.COMPLETED,
        driverId: { not: null },
      },
      _sum: {
        cashCollected: true,
      },
    }),
  ]);

  // Create a map of driverId -> cashCollected for O(1) lookup
  const cashCollectedMap = new Map(
    cashCollectedStats.map((stat) => [stat.driverId, stat._sum.cashCollected?.toString() || '0'])
  );

  // Merge the stats with driver data
  const driversWithStats = drivers.map((driver) => ({
    ...driver,
    cashCollectedToday: cashCollectedMap.get(driver.id) || '0',
  }));

  return {
    drivers: driversWithStats,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDriver(id: string) {
  return await db.driverProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          isActive: true,
          suspended: true,
        },
      },
    },
  });
}

export async function getDriverByUserId(userId: string) {
  return await db.driverProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          isActive: true,
          suspended: true,
        },
      },
    },
  });
}

export async function updateDriver(
  id: string,
  data: Partial<{
    name: string;
    phoneNumber: string;
    email: string | null;
    vehicleNo: string | null;
    licenseNo: string | null;
  }>
) {
  const { name, phoneNumber, email, ...profileData } = data;

  return await db.$transaction(async (tx) => {
    const profile = await tx.driverProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!profile) throw new Error('Driver not found');

    // Update User
    if (name || phoneNumber || email !== undefined) {
      await tx.user.update({
        where: { id: profile.userId },
        data: {
          ...(name && { name }),
          ...(phoneNumber && { phoneNumber }),
          ...(email !== undefined && { email }),
        },
      });
    }

    // Update Profile
    const updatedProfile = await tx.driverProfile.update({
      where: { id },
      data: profileData,
      include: {
        user: true,
      },
    });

    return updatedProfile;
  });
}

export async function deleteDriver(id: string) {
  return await db.$transaction(async (tx) => {
    const profile = await tx.driverProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!profile) throw new Error('Driver not found');

    await tx.driverProfile.delete({
      where: { id },
    });

    await tx.user.delete({
      where: { id: profile.userId },
    });

    return true;
  });
}
