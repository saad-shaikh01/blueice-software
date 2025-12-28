import { PrismaClient, UserRole, CustomerType, OrderStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  CUSTOMERS_COUNT: 1000,
  PAST_DAYS: 60,
  FUTURE_DAYS: 7,
  ORDERS_PER_DAY_AVG: 50,
};

async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Cleanup
  console.log('🧹 Cleaning database...');
  await prisma.auditLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.dailyStats.deleteMany();
  await prisma.driverPerformanceMetrics.deleteMany();
  await prisma.cashHandover.deleteMany();
  await prisma.customerBottleWallet.deleteMany();
  await prisma.ledger.deleteMany();
  await prisma.customerProductPrice.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.driverProfile.deleteMany();
  await prisma.routeAssignment.deleteMany();
  await prisma.route.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Static Users (Admin, Manager, Drivers)
  const password = await hashPassword('password123');

  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@blueice.com',
      phoneNumber: '03000000000',
      password,
      role: UserRole.SUPER_ADMIN,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Manager One',
      email: 'manager@blueice.com',
      phoneNumber: '03000000001',
      password,
      role: UserRole.ADMIN,
    },
  });

  // Create 10 Drivers
  const drivers = [];
  for (let i = 0; i < 10; i++) {
    const driver = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: `driver${i}@blueice.com`,
        phoneNumber: `030000000${(i + 2).toString().padStart(2, '0')}`,
        password,
        role: UserRole.DRIVER,
        driverProfile: {
          create: {
            vehicleNo: faker.vehicle.vrm(),
            licenseNo: faker.string.alphanumeric(8).toUpperCase(),
            isOnDuty: true,
          },
        },
      },
      include: { driverProfile: true },
    });
    drivers.push(driver);
  }
  console.log(`✅ Created Admin, Manager, and ${drivers.length} Drivers`);

  // 3. Create Products
  const productsData = [
    { name: '19L Mineral Water', sku: 'MW-19L', basePrice: 200, isReturnable: true, stockFilled: 5000, stockEmpty: 1000 },
    { name: '12L Mineral Water', sku: 'MW-12L', basePrice: 150, isReturnable: true, stockFilled: 2000, stockEmpty: 500 },
    { name: '6L Mineral Water', sku: 'MW-6L', basePrice: 100, isReturnable: true, stockFilled: 2000, stockEmpty: 200 },
    { name: '1.5L Carton (12 pcs)', sku: 'MW-1.5L-CTN', basePrice: 600, isReturnable: false, stockFilled: 1000, stockEmpty: 0 },
  ];

  const products = [];
  for (const p of productsData) {
    products.push(await prisma.product.create({ data: p }));
  }
  const mainProduct = products[0]; // 19L
  console.log('✅ Created Products');

  // 4. Create Routes
  const areaNames = ['DHA Phase 6', 'Clifton Block 2', 'Gulshan-e-Iqbal', 'North Nazimabad', 'PECHS Block 6', 'Bahria Town'];
  const routes = [];
  for (const name of areaNames) {
    routes.push(await prisma.route.create({
      data: {
        name,
        description: `Deliveries for ${name}`,
        defaultDriverId: drivers[Math.floor(Math.random() * drivers.length)].driverProfile?.id,
      },
    }));
  }
  console.log('✅ Created Routes');

  // 5. Create Customers (Batching for speed if possible, but nested writes require loops)
  console.log(`⏳ Creating ${CONFIG.CUSTOMERS_COUNT} Customers...`);
  const customers = [];

  // We'll do chunks to avoid memory issues if count is huge, but 1000 is fine.
  for (let i = 0; i < CONFIG.CUSTOMERS_COUNT; i++) {
    const route = routes[Math.floor(Math.random() * routes.length)];
    const type = faker.helpers.arrayElement(Object.values(CustomerType));

    // Generate valid PK phoneNumber
    const phone = faker.string.numeric(11);

    const customer = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        phoneNumber: `03${phone.substring(2)}`, // Ensure roughly PK format
        email: faker.internet.email(),
        password,
        role: UserRole.CUSTOMER,
        customerProfile: {
          create: {
            type,
            area: route.name,
            address: faker.location.streetAddress(),
            routeId: route.id,
            creditLimit: 5000,
            cashBalance: faker.number.int({ min: -2000, max: 1000 }), // Negative means they owe us (credit used)
          },
        },
      },
      include: { customerProfile: true },
    });

    if (customer.customerProfile) customers.push(customer.customerProfile);

    if (i % 100 === 0) process.stdout.write('.');
  }
  console.log('\n✅ Customers created');

  // 6. Generate Orders (Past, Present, Future)
  console.log(`⏳ Generating Orders (Past ${CONFIG.PAST_DAYS} days + Future)...`);

  const today = new Date();
  const allOrders = [];

  // 6a. Historical Orders (Past 60 days)
  for (let d = CONFIG.PAST_DAYS; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);

    // Daily Stats Accumulators
    let dailyRevenue = 0;
    let dailyCash = 0;
    let ordersCompleted = 0;
    let bottlesDelivered = 0;
    let bottlesReturned = 0;
    let bottlesDamaged = 0;

    const ordersCount = faker.number.int({ min: 30, max: 70 }); // Random volume per day

    for (let i = 0; i < ordersCount; i++) {
      const customer = faker.helpers.arrayElement(customers);
      const driver = faker.helpers.arrayElement(drivers);
      const product = mainProduct;
      const quantity = faker.number.int({ min: 1, max: 5 });
      const totalAmount = Number(product.basePrice) * quantity;

      // Determine Status based on date
      let status: OrderStatus = OrderStatus.COMPLETED;
      if (d === 0) {
        // Today: Mix of Pending/Completed
        const randomStatus = faker.helpers.arrayElement([OrderStatus.COMPLETED, OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.SCHEDULED]);
        status = randomStatus;
      }

      // Some cancellations
      if (Math.random() > 0.95) status = OrderStatus.CANCELLED;

      const orderData: any = {
        customerId: customer.id,
        driverId: driver.driverProfile?.id,
        scheduledDate: date,
        status,
        totalAmount,
        paymentMethod: PaymentMethod.CASH,
        orderItems: {
          create: {
            productId: product.id,
            quantity,
            priceAtTime: product.basePrice,
            filledGiven: status === OrderStatus.COMPLETED ? quantity : 0,
            emptyTaken: status === OrderStatus.COMPLETED ? quantity : 0, // Usually 1:1
            damagedReturned: status === OrderStatus.COMPLETED && Math.random() > 0.95 ? 1 : 0, // 5% chance of damage
          }
        }
      };

      if (status === OrderStatus.COMPLETED) {
        orderData.deliveredAt = date;
        orderData.cashCollected = totalAmount; // Full payment

        // Update stats
        dailyRevenue += totalAmount;
        dailyCash += totalAmount;
        ordersCompleted++;
        bottlesDelivered += quantity;
        bottlesReturned += quantity;
        if (orderData.orderItems.create.damagedReturned > 0) {
            bottlesDamaged += orderData.orderItems.create.damagedReturned;
        }
      }

      await prisma.order.create({ data: orderData });
    }

    // Generate DailyStats for this day (only if past)
    if (d > 0) {
      await prisma.dailyStats.create({
        data: {
          date: date,
          totalRevenue: dailyRevenue,
          cashCollected: dailyCash,
          ordersCompleted,
          ordersPending: 0,
          ordersCancelled: Math.floor(ordersCount * 0.05),
          bottlesDelivered,
          bottlesReturned,
          bottlesDamaged, // New field
          bottleNetChange: bottlesDelivered - bottlesReturned,
          driversActive: drivers.length,
          newCustomers: Math.floor(Math.random() * 5),
        }
      });
    }

    if (d % 10 === 0) process.stdout.write('.');
  }

  // 6b. Future Orders
  console.log('\n⏳ Generating Future Orders...');
  for (let d = 1; d <= CONFIG.FUTURE_DAYS; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);

    for (let i = 0; i < 30; i++) {
        const customer = faker.helpers.arrayElement(customers);
        await prisma.order.create({
            data: {
                customerId: customer.id,
                scheduledDate: date,
                status: OrderStatus.SCHEDULED,
                totalAmount: Number(mainProduct.basePrice) * 2,
                orderItems: {
                    create: {
                        productId: mainProduct.id,
                        quantity: 2,
                        priceAtTime: mainProduct.basePrice
                    }
                }
            }
        });
    }
  }

  console.log('\n✅ Orders & Stats created');
  console.log('✅ Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
