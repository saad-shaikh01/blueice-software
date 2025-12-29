import { CustomerType, Prisma, UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/authenticate';

interface CreateCustomerData {
  // User fields
  name: string;
  phoneNumber: string;
  email: string | null;
  password: string;

  // CustomerProfile fields
  manualCode?: string | null;
  area: string;
  address: string;
  landmark?: string | null;
  floorNumber: number;
  hasLift: boolean;
  geoLat?: number | null;
  geoLng?: number | null;
  routeId?: string | null;
  sequenceOrder?: number | null;
  type: CustomerType;
  deliveryDays: number[];
  defaultProductId?: string | null;
  defaultQuantity: number;
  creditLimit: string;
  openingCashBalance: string;
  openingBottleBalance: number;
  productId?: string | null;
}

/**
 * Create a new customer with migration support
 * Handles both new signups (opening balance = 0) and legacy data migration (opening balance > 0)
 *
 * @param data - Customer creation data
 * @returns Created customer with profile
 */
export async function createCustomerWithProfile(data: CreateCustomerData) {
  const {
    name,
    phoneNumber,
    email,
    password,
    manualCode,
    area,
    address,
    landmark,
    floorNumber,
    hasLift,
    geoLat,
    geoLng,
    routeId,
    sequenceOrder,
    type,
    deliveryDays,
    defaultProductId,
    defaultQuantity,
    creditLimit,
    openingCashBalance,
    openingBottleBalance,
    productId,
  } = data;

  const hashedPassword = await hashPassword(password);

  // Convert string amounts to Prisma.Decimal
  const openingCashDecimal = new Prisma.Decimal(openingCashBalance);
  const creditLimitDecimal = new Prisma.Decimal(creditLimit);

  // Check if this is a migration (opening balances > 0)
  const isMigration = openingCashDecimal.greaterThan(0) || openingBottleBalance > 0;

  // Use Prisma transaction to ensure data integrity
  return await db.$transaction(async (tx) => {
    // 1. Create User
    const user = await tx.user.create({
      data: {
        name,
        phoneNumber,
        email,
        password: hashedPassword,
        role: UserRole.CUSTOMER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
      },
    });

    // 2. Create CustomerProfile
    const customerProfile = await tx.customerProfile.create({
      data: {
        userId: user.id,
        manualCode,
        area,
        address,
        landmark,
        floorNumber,
        hasLift,
        geoLat,
        geoLng,
        routeId,
        sequenceOrder,
        type,
        deliveryDays,
        defaultProductId,
        defaultQuantity,
        creditLimit: creditLimitDecimal,
        cashBalance: openingCashDecimal, // Set initial cash balance
        openingCashBalance: openingCashDecimal,
        openingBottleBalance,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
          },
        },
        route: true,
      },
    });

    // 3. If Migration: Create Opening Balance Ledger Entry
    if (isMigration && openingCashDecimal.greaterThan(0)) {
      await tx.ledger.create({
        data: {
          customerId: customerProfile.id,
          amount: openingCashDecimal,
          description: 'Opening Balance Migration',
          balanceAfter: openingCashDecimal,
          referenceId: null,
        },
      });
    }

    // 4. If Migration: Create Opening Bottle Wallet Entry
    if (isMigration && openingBottleBalance > 0 && productId) {
      // Verify product exists
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Invalid product ID for bottle wallet');
      }

      await tx.customerBottleWallet.create({
        data: {
          customerId: customerProfile.id,
          productId: productId,
          balance: openingBottleBalance,
        },
      });
    }

    return customerProfile;
  });
}

/**
 * Get customer profile with recent order history (for invoice context)
 *
 * @param customerId - Customer profile ID
 * @returns Customer profile with last 5 orders
 */
export async function getCustomerWithOrderHistory(customerId: string) {
  const customer = await db.customerProfile.findUnique({
    where: { id: customerId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          suspended: true,
        },
      },
      route: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      orders: {
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
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
      },
      bottleWallets: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      },
      ledgers: {
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  return customer;
}

/**
 * Get all customers with filtering and pagination
 */
export async function getCustomers(params: {
  search?: string;
  area?: string;
  type?: CustomerType;
  routeId?: string;
  page: number;
  limit: number;
}) {
  const { search, area, type, routeId, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.CustomerProfileWhereInput = {
    AND: [
      search
        ? {
            OR: [
              { user: { name: { contains: search, mode: 'insensitive' } } },
              { user: { phoneNumber: { contains: search } } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
              { address: { contains: search, mode: 'insensitive' } },
              { manualCode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      area ? { area: { equals: area, mode: 'insensitive' } } : {},
      type ? { type } : {},
      routeId ? { routeId } : {},
    ],
  };

  const [customers, total] = await Promise.all([
    db.customerProfile.findMany({
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
        route: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    }),
    db.customerProfile.count({ where }),
  ]);

  return {
    customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update customer profile
 */
export async function updateCustomerProfile(
  customerId: string,
  data: Partial<{
    name: string;
    phoneNumber: string;
    email: string | null;
    manualCode: string | null;
    area: string;
    address: string;
    landmark: string | null;
    floorNumber: number;
    hasLift: boolean;
    geoLat: number | null;
    geoLng: number | null;
    routeId: string | null;
    sequenceOrder: number | null;
    type: CustomerType;
    deliveryDays: number[];
    defaultProductId: string | null;
    defaultQuantity: number;
    creditLimit: string;
  }>
) {
  const { name, phoneNumber, email, creditLimit, ...profileData } = data;

  return await db.$transaction(async (tx) => {
    const profile = await tx.customerProfile.findUnique({
      where: { id: customerId },
      select: { userId: true },
    });

    if (!profile) {
      throw new Error('Customer not found');
    }

    // Update user if user fields are provided
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

    // Update customer profile
    const updatedProfile = await tx.customerProfile.update({
      where: { id: customerId },
      data: {
        ...profileData,
        ...(creditLimit && { creditLimit: new Prisma.Decimal(creditLimit) }),
      } as Prisma.CustomerProfileUncheckedUpdateInput,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        route: true,
      },
    });

    return updatedProfile;
  });
}

/**
 * Delete customer
 * Warning: This will delete the user and profile.
 * If there are related orders/financials, this might fail due to DB constraints.
 */
export async function deleteCustomer(customerId: string) {
  return await db.$transaction(async (tx) => {
    const profile = await tx.customerProfile.findUnique({
      where: { id: customerId },
      select: { userId: true },
    });

    if (!profile) {
      throw new Error('Customer not found');
    }

    // Delete customer profile first
    await tx.customerProfile.delete({
      where: { id: customerId },
    });

    // Delete user
    await tx.user.delete({
      where: { id: profile.userId },
    });

    return true;
  });
}
