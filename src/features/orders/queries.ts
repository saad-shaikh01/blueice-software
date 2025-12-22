import { Prisma, OrderStatus } from '@prisma/client';
import { db } from '@/lib/db';

export async function getOrders(params: {
  search?: string;
  status?: OrderStatus;
  customerId?: string;
  driverId?: string;
  date?: string;
  page: number;
  limit: number;
}) {
  const { search, status, customerId, driverId, date, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.OrderWhereInput = {
    AND: [
      search
        ? {
            OR: [
              { customer: { user: { name: { contains: search, mode: 'insensitive' } } } },
              { readableId: { equals: parseInt(search) || -1 } },
            ],
          }
        : {},
      status ? { status } : {},
      customerId ? { customerId } : {},
      driverId ? { driverId } : {},
      date ? { scheduledDate: { equals: new Date(date) } } : {},
    ],
  };

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        customer: {
          include: {
            user: { select: { name: true, phoneNumber: true } },
          },
        },
        driver: {
          include: {
            user: { select: { name: true } },
          },
        },
        orderItems: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    }),
    db.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getOrder(id: string) {
  return await db.order.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          user: true,
        },
      },
      driver: {
        include: {
          user: true,
        },
      },
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function createOrder(data: {
  customerId: string;
  driverId?: string | null;
  scheduledDate: Date;
  status: OrderStatus;
  deliveryCharge: number;
  discount: number;
  items: { productId: string; quantity: number; price?: number }[];
}) {
  const { items, ...orderData } = data;

  // Calculate total
  // We need to fetch product prices if not provided
  const productIds = items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalAmount = new Prisma.Decimal(0);

  const orderItemsData = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);

    const price = item.price !== undefined ? new Prisma.Decimal(item.price) : product.basePrice;
    const amount = price.mul(item.quantity);
    totalAmount = totalAmount.add(amount);

    return {
      productId: item.productId,
      quantity: item.quantity,
      priceAtTime: price,
    };
  });

  // Add delivery charge, subtract discount
  totalAmount = totalAmount.add(new Prisma.Decimal(orderData.deliveryCharge)).sub(new Prisma.Decimal(orderData.discount));

  return await db.order.create({
    data: {
      ...orderData,
      deliveryCharge: new Prisma.Decimal(orderData.deliveryCharge),
      discount: new Prisma.Decimal(orderData.discount),
      totalAmount,
      orderItems: {
        create: orderItemsData,
      },
    },
    include: {
      orderItems: true,
    },
  });
}

export async function updateOrder(
  id: string,
  data: Partial<{
    customerId: string;
    driverId: string | null;
    scheduledDate: Date;
    status: OrderStatus;
    deliveryCharge: number;
    discount: number;
    deliveredAt: Date | null;
    cashCollected: number;
    items: {
      id?: string;
      productId: string;
      quantity: number;
      price?: number;
      filledGiven?: number;
      emptyTaken?: number;
    }[];
  }>
) {
  const { items, ...orderData } = data;

  return await db.$transaction(async (tx) => {
    // Fetch existing order to check status transition
    const existingOrder = await tx.order.findUnique({ where: { id } });
    if (!existingOrder) throw new Error('Order not found');

    // Update basic fields
    if (Object.keys(orderData).length > 0) {
      await tx.order.update({
        where: { id },
        data: {
          ...orderData,
          ...(orderData.deliveryCharge !== undefined && {
            deliveryCharge: new Prisma.Decimal(orderData.deliveryCharge),
          }),
          ...(orderData.discount !== undefined && {
            discount: new Prisma.Decimal(orderData.discount),
          }),
          ...(orderData.cashCollected !== undefined && {
            cashCollected: new Prisma.Decimal(orderData.cashCollected),
          }),
        },
      });
    }

    // Update items if provided
    if (items) {
      // Fetch products to recalc total
      const productIds = items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let totalAmount = new Prisma.Decimal(0);

      await tx.orderItem.deleteMany({ where: { orderId: id } });

      const newItems = items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);

        const price = item.price !== undefined ? new Prisma.Decimal(item.price) : product.basePrice;
        const amount = price.mul(item.quantity);
        totalAmount = totalAmount.add(amount);

        return {
          orderId: id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: price,
          filledGiven: item.filledGiven || 0,
          emptyTaken: item.emptyTaken || 0,
        };
      });

      await tx.orderItem.createMany({ data: newItems });

      // Recalculate order total
      // We need existing delivery/discount if not provided in update
      // We can use orderData or fallback to existingOrder
      const deliveryCharge = orderData.deliveryCharge !== undefined ? new Prisma.Decimal(orderData.deliveryCharge) : existingOrder.deliveryCharge;
      const discount = orderData.discount !== undefined ? new Prisma.Decimal(orderData.discount) : existingOrder.discount;

      const finalTotal = totalAmount.add(deliveryCharge).sub(discount);

      await tx.order.update({
        where: { id },
        data: {
          totalAmount: finalTotal,
        },
      });
    }

    // Business Logic: Handle Completion
    if (orderData.status === OrderStatus.COMPLETED && existingOrder.status !== OrderStatus.COMPLETED) {
      const updatedOrder = await tx.order.findUnique({ where: { id } });
      if (!updatedOrder) throw new Error('Order not found after update');

      const customer = await tx.customerProfile.findUnique({ where: { id: updatedOrder.customerId } });
      if (!customer) throw new Error('Customer not found');

      // 1. Create Ledger Entry & Update Cash Balance
      // Debit amount (Increase debt or decrease advance)
      const amount = updatedOrder.totalAmount;
      // Use cashCollected if provided, otherwise 0?
      // If we are updating status to COMPLETED, we expect cashCollected to be set if paid.
      // We read it from updatedOrder because it was updated in step 1.
      const cashCollected = updatedOrder.cashCollected; // Decimal

      // Ledger 1: Sale (Debit)
      const afterSaleBalance = customer.cashBalance.sub(amount);
      await tx.ledger.create({
        data: {
          customerId: updatedOrder.customerId,
          amount: amount.neg(),
          description: `Order #${updatedOrder.readableId} Sale`,
          balanceAfter: afterSaleBalance,
          referenceId: id,
        },
      });

      // Ledger 2: Payment (Credit)
      let finalBalance = afterSaleBalance;
      if (cashCollected.gt(0)) {
        finalBalance = finalBalance.add(cashCollected);
        await tx.ledger.create({
          data: {
            customerId: updatedOrder.customerId,
            amount: cashCollected,
            description: `Order #${updatedOrder.readableId} Payment`,
            balanceAfter: finalBalance,
            referenceId: id,
          },
        });
      }

      await tx.customerProfile.update({
        where: { id: updatedOrder.customerId },
        data: { cashBalance: finalBalance },
      });

      // 2. Update Bottle Wallets & Stock
      const orderItems = await tx.orderItem.findMany({ where: { orderId: id } });

      for (const item of orderItems) {
        const netChange = item.filledGiven - item.emptyTaken;

        const wallet = await tx.customerBottleWallet.findUnique({
          where: {
            customerId_productId: {
              customerId: updatedOrder.customerId,
              productId: item.productId,
            },
          },
        });

        if (wallet) {
          await tx.customerBottleWallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: netChange } },
          });
        } else {
          await tx.customerBottleWallet.create({
            data: {
              customerId: updatedOrder.customerId,
              productId: item.productId,
              balance: netChange,
            },
          });
        }

        // 3. Update Inventory
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockFilled: { decrement: item.filledGiven },
            stockEmpty: { increment: item.emptyTaken },
          },
        });
      }
    }

    return await tx.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });
  });
}

export async function deleteOrder(id: string) {
  // Check if completed?
  // For now just delete.
  return await db.order.delete({
    where: { id },
  });
}

export async function bulkAssignOrders(data: { orderIds: string[]; driverId: string }) {
  return await db.order.updateMany({
    where: {
      id: { in: data.orderIds },
    },
    data: {
      driverId: data.driverId,
      status: OrderStatus.PENDING,
    },
  });
}
