import { PrismaClient, UserRole, CustomerType, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Cleanup (Optional - be careful in prod, but safe for testing)
  // await prisma.auditLog.deleteMany();
  // await prisma.orderItem.deleteMany();
  // await prisma.order.deleteMany();
  // await prisma.customerBottleWallet.deleteMany();
  // await prisma.ledger.deleteMany();
  // await prisma.customerProductPrice.deleteMany();
  // await prisma.customerProfile.deleteMany();
  // await prisma.driverProfile.deleteMany();
  // await prisma.route.deleteMany();
  // await prisma.product.deleteMany();
  // await prisma.user.deleteMany();
  // console.log('🧹 Cleaned up database');

  // 2. Create Users (Admin, Manager, Drivers)
  const password = await hashPassword('password123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@blueice.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@blueice.com',
      phoneNumber: '03000000000',
      password,
      role: UserRole.SUPER_ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@blueice.com' },
    update: {},
    create: {
      name: 'Manager One',
      email: 'manager@blueice.com',
      phoneNumber: '03000000001',
      password,
      role: UserRole.ADMIN,
    },
  });

  // Drivers
  const driver1 = await prisma.user.upsert({
    where: { email: 'ali@blueice.com' },
    update: {},
    create: {
      name: 'Ali Driver',
      email: 'ali@blueice.com',
      phoneNumber: '03000000002',
      password,
      role: UserRole.DRIVER,
      driverProfile: {
        create: {
          vehicleNo: 'KHI-1234',
          licenseNo: 'LIC-5678',
        },
      },
    },
  });

  const driver2 = await prisma.user.upsert({
    where: { email: 'bilal@blueice.com' },
    update: {},
    create: {
      name: 'Bilal Driver',
      email: 'bilal@blueice.com',
      phoneNumber: '03000000003',
      password,
      role: UserRole.DRIVER,
      driverProfile: {
        create: {
          vehicleNo: 'LEA-9090',
          licenseNo: 'LIC-1122',
        },
      },
    },
  });

  console.log('👥 Users created');

  // 3. Create Products
  const products = [
    { name: '19L Mineral Water', sku: 'MW-19L', basePrice: 200, isReturnable: true, stockFilled: 500, stockEmpty: 100 },
    { name: '12L Mineral Water', sku: 'MW-12L', basePrice: 150, isReturnable: true, stockFilled: 200, stockEmpty: 50 },
    { name: '6L Mineral Water', sku: 'MW-6L', basePrice: 100, isReturnable: true, stockFilled: 200, stockEmpty: 20 },
    { name: '1.5L Carton (12 pcs)', sku: 'MW-1.5L-CTN', basePrice: 600, isReturnable: false, stockFilled: 100, stockEmpty: 0 },
    { name: '500ml Carton (24 pcs)', sku: 'MW-500ML-CTN', basePrice: 700, isReturnable: false, stockFilled: 100, stockEmpty: 0 },
    { name: 'Water Dispenser', sku: 'DISP-STD', basePrice: 15000, isReturnable: false, stockFilled: 10, stockEmpty: 0 },
  ];

  const dbProducts = [];
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    dbProducts.push(product);
  }
  console.log('💧 Products created');

  // 4. Create Routes
  const routesData = [
    { name: 'Morning - DHA Phase 6', description: 'Early morning deliveries' },
    { name: 'Afternoon - Clifton', description: 'Office deliveries' },
    { name: 'Evening - Gulshan', description: 'Residential deliveries' },
  ];

  const dbRoutes = [];
  for (const r of routesData) {
    const route = await prisma.route.create({
      data: r,
    });
    dbRoutes.push(route);
  }
  console.log('🚚 Routes created');

  // 5. Create Customers
  const customerTypes = [CustomerType.RESIDENTIAL, CustomerType.COMMERCIAL, CustomerType.CORPORATE];
  const areas = ['DHA', 'Clifton', 'Gulshan', 'North Nazimabad', 'PECHS'];

  const dbCustomers = [];
  for (let i = 1; i <= 20; i++) {
    const routeIndex = i % dbRoutes.length;
    const typeIndex = i % customerTypes.length;
    const areaIndex = i % areas.length;

    const customerUser = await prisma.user.create({
      data: {
        name: `Customer ${i}`,
        phoneNumber: `030011100${i.toString().padStart(2, '0')}`,
        email: `customer${i}@example.com`,
        password,
        role: UserRole.CUSTOMER,
        customerProfile: {
          create: {
            type: customerTypes[typeIndex],
            area: areas[areaIndex],
            address: `House ${i}, Street ${i}, ${areas[areaIndex]}`,
            routeId: dbRoutes[routeIndex].id,
            sequenceOrder: i,
            deliveryDays: [1, 4], // Mon, Thu
            creditLimit: 5000,
            cashBalance: 0,
          },
        },
      },
      include: { customerProfile: true },
    });

    if (customerUser.customerProfile) {
        dbCustomers.push(customerUser.customerProfile);
    }
  }
  console.log('🏠 Customers created');

  // 6. Create Orders (Past & Future)
  const today = new Date();

  // Create some past completed orders (last 10 days)
  for (let i = 0; i < 30; i++) {
    const customer = dbCustomers[i % dbCustomers.length];
    const driver = i % 2 === 0 ? driver1 : driver2;
    const daysAgo = Math.floor(Math.random() * 10) + 1;
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    const product = dbProducts[0]; // 19L Water
    const qty = Math.floor(Math.random() * 5) + 1;
    const total = Number(product.basePrice) * qty;

    // Simulate completion logic manually here for seed
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        driverId: driver.driverProfile?.id,
        scheduledDate: date,
        status: OrderStatus.COMPLETED,
        totalAmount: total,
        deliveredAt: date,
        orderItems: {
          create: {
            productId: product.id,
            quantity: qty,
            priceAtTime: product.basePrice,
            filledGiven: qty,
            emptyTaken: qty,
          }
        }
      }
    });

    // Create Ledger & Wallet update for this past order
    await prisma.ledger.create({
      data: {
        customerId: customer.id,
        amount: -total,
        description: `Order #${order.readableId} Completed (Seed)`,
        balanceAfter: Number(customer.cashBalance) - total,
        referenceId: order.id,
      }
    });

    // Update customer balance (in memory accumulation would be better but simple decrement works if sequential)
    await prisma.customerProfile.update({
      where: { id: customer.id },
      data: { cashBalance: { decrement: total } }
    });

    // Bottle wallet
    await prisma.customerBottleWallet.upsert({
      where: {
        customerId_productId: {
          customerId: customer.id,
          productId: product.id
        }
      },
      update: {}, // Assuming net 0 change (filledGiven = emptyTaken)
      create: {
        customerId: customer.id,
        productId: product.id,
        balance: 0
      }
    });
  }

  // Create Today's Pending Orders
  for (let i = 0; i < 5; i++) {
    const customer = dbCustomers[i];
    // Assign driver to some
    const driver = i < 3 ? driver1 : null;

    await prisma.order.create({
      data: {
        customerId: customer.id,
        driverId: driver?.driverProfile?.id,
        scheduledDate: today,
        status: driver ? OrderStatus.PENDING : OrderStatus.SCHEDULED,
        totalAmount: 400, // 2 bottles approx
        orderItems: {
          create: {
            productId: dbProducts[0].id,
            quantity: 2,
            priceAtTime: dbProducts[0].basePrice,
          }
        }
      }
    });
  }

  // Create Future Scheduled Orders
  for (let i = 5; i < 10; i++) {
    const customer = dbCustomers[i];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await prisma.order.create({
      data: {
        customerId: customer.id,
        scheduledDate: tomorrow,
        status: OrderStatus.SCHEDULED,
        totalAmount: 600, // 3 bottles
        orderItems: {
          create: {
            productId: dbProducts[0].id,
            quantity: 3,
            priceAtTime: dbProducts[0].basePrice,
          }
        }
      }
    });
  }

  console.log('📦 Orders created');
  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
