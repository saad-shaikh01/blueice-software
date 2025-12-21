// prisma/seed.ts
import { PrismaClient, UserRole, ProductCategory } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Seeding...')

  // 1. Create Super Admin
  // Password "admin123" ka hash generate kar rahe hain
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@blueice.com' }, // Unique check (Email or Phone)
    update: {},
    create: {
      email: 'admin@blueice.com',
      phoneNumber: '03001234567',
      name: 'Saad Owner',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
    },
  })
  console.log(`✅ Admin Created: ${admin.name}`)

  // 2. Create Products (Inventory Base)

  // Product 1: 19L Bottle
  const waterBottle = await prisma.product.upsert({
    where: { sku: 'WAT-19L' },
    update: {},
    create: {
      name: '19L Mineral Water',
      sku: 'WAT-19L',
      basePrice: 200.00, // Standard Price
      category: ProductCategory.WATER,
      isReturnable: true,
      stockFilled: 100, // Initial Stock
      stockEmpty: 50,
    },
  })
  console.log(`✅ Product Created: ${waterBottle.name}`)

  // Product 2: Water Dispenser
  const dispenser = await prisma.product.upsert({
    where: { sku: 'DISP-STD' },
    update: {},
    create: {
      name: 'Standard Water Dispenser',
      sku: 'DISP-STD',
      basePrice: 15000.00,
      category: ProductCategory.ACCESSORY,
      isReturnable: false, // Ye wapis nahi aata
      stockFilled: 5,
    },
  })
  console.log(`✅ Product Created: ${dispenser.name}`)

  console.log('🏁 Seeding Finished!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })