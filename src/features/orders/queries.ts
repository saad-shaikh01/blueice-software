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
        },
      });
    }

    // Update items if provided
    if (items) {
      // Strategy: Delete all and recreate? Or partial update?
      // Since items is "optional" in input, if it's provided, we assume it's the NEW list.
      // Easiest to delete existing and create new to handle removals.
      // But we lose "id" reference if we do that (might matter for history).
      // Let's do delete/create for simplicity now.

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
      const currentOrder = await tx.order.findUnique({ where: { id } });
      if (!currentOrder) throw new Error('Order not found');

      const deliveryCharge = orderData.deliveryCharge !== undefined ? new Prisma.Decimal(orderData.deliveryCharge) : currentOrder.deliveryCharge;
      const discount = orderData.discount !== undefined ? new Prisma.Decimal(orderData.discount) : currentOrder.discount;

      const finalTotal = totalAmount.add(deliveryCharge).sub(discount);

      await tx.order.update({
        where: { id },
        data: {
          totalAmount: finalTotal,
        },
      });
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
