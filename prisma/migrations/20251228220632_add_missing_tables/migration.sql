/*
  Warnings:

  - You are about to alter the column `creditLimit` on the `CustomerProfile` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - A unique constraint covering the columns `[manualCode]` on the table `CustomerProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NONBINARY');

-- CreateEnum
CREATE TYPE "CancellationReason" AS ENUM ('CUSTOMER_NOT_HOME', 'HOUSE_LOCKED', 'CUSTOMER_REFUSED', 'WRONG_ADDRESS', 'CUSTOMER_REQUESTED', 'PAYMENT_ISSUE', 'WEATHER_CONDITION', 'VEHICLE_BREAKDOWN', 'SECURITY_ISSUE', 'CUSTOMER_NOT_REACHABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "CashHandoverStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'ADJUSTED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('FUEL', 'VEHICLE_MAINTENANCE', 'PLANT_OPERATIONS', 'SALARY', 'MEALS', 'SUPPLIES', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExpensePaymentMethod" AS ENUM ('CASH_ON_HAND', 'COMPANY_CASH', 'BANK_TRANSFER');

-- AlterTable
ALTER TABLE "CustomerProfile" ADD COLUMN     "defaultProductId" TEXT,
ADD COLUMN     "defaultQuantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "deliveryInstructions" TEXT,
ADD COLUMN     "manualCode" TEXT,
ADD COLUMN     "openingBottleBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "openingCashBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "preferredDeliveryTime" TEXT,
ADD COLUMN     "specialNotes" TEXT,
ALTER COLUMN "creditLimit" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "DriverProfile" ADD COLUMN     "isOnDuty" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLocationUpdate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancellationReason" "CancellationReason",
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "cashCollected" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "driverNotes" TEXT,
ADD COLUMN     "originalScheduledDate" DATE,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
ADD COLUMN     "proofPhotoUrl" TEXT,
ADD COLUMN     "rescheduledToDate" DATE;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "damagedReturned" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "defaultDriverId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "resetPasswordExpire" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;

-- CreateTable
CREATE TABLE "RouteAssignment" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "RouteAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashHandover" (
    "id" TEXT NOT NULL,
    "readableId" SERIAL NOT NULL,
    "driverId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shiftStart" TIMESTAMP(3),
    "shiftEnd" TIMESTAMP(3),
    "expectedCash" DECIMAL(10,2) NOT NULL,
    "actualCash" DECIMAL(10,2) NOT NULL,
    "discrepancy" DECIMAL(10,2) NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "completedOrders" INTEGER NOT NULL DEFAULT 0,
    "cashOrders" INTEGER NOT NULL DEFAULT 0,
    "bottlesGiven" INTEGER NOT NULL DEFAULT 0,
    "bottlesTaken" INTEGER NOT NULL DEFAULT 0,
    "status" "CashHandoverStatus" NOT NULL DEFAULT 'PENDING',
    "driverNotes" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "adjustmentAmount" DECIMAL(10,2),
    "receiptUrl" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashHandover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverLocationHistory" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "isMoving" BOOLEAN NOT NULL DEFAULT false,
    "batteryLevel" INTEGER,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverLocationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyStats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cashCollected" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "creditGiven" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ordersCompleted" INTEGER NOT NULL DEFAULT 0,
    "ordersCancelled" INTEGER NOT NULL DEFAULT 0,
    "ordersRescheduled" INTEGER NOT NULL DEFAULT 0,
    "ordersPending" INTEGER NOT NULL DEFAULT 0,
    "bottlesDelivered" INTEGER NOT NULL DEFAULT 0,
    "bottlesReturned" INTEGER NOT NULL DEFAULT 0,
    "bottlesDamaged" INTEGER NOT NULL DEFAULT 0,
    "bottleNetChange" INTEGER NOT NULL DEFAULT 0,
    "newCustomers" INTEGER NOT NULL DEFAULT 0,
    "activeCustomers" INTEGER NOT NULL DEFAULT 0,
    "driversActive" INTEGER NOT NULL DEFAULT 0,
    "totalDistance" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverPerformanceMetrics" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "ordersAssigned" INTEGER NOT NULL DEFAULT 0,
    "ordersCompleted" INTEGER NOT NULL DEFAULT 0,
    "ordersCancelled" INTEGER NOT NULL DEFAULT 0,
    "ordersRescheduled" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bottlesGiven" INTEGER NOT NULL DEFAULT 0,
    "bottlesTaken" INTEGER NOT NULL DEFAULT 0,
    "bottleDiscrepancy" INTEGER NOT NULL DEFAULT 0,
    "bottleAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "totalBilled" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cashCollected" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "creditGiven" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "collectionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageDeliveryTime" INTEGER,
    "totalDistance" DOUBLE PRECISION,
    "workingHours" DOUBLE PRECISION,
    "customerComplaints" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverPerformanceMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT,
    "receiptUrl" TEXT,
    "spentByUserId" TEXT NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'APPROVED',
    "approvedById" TEXT,
    "driverId" TEXT,
    "paymentMethod" "ExpensePaymentMethod" NOT NULL DEFAULT 'CASH_ON_HAND',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashHandover_date_idx" ON "CashHandover"("date");

-- CreateIndex
CREATE INDEX "CashHandover_status_idx" ON "CashHandover"("status");

-- CreateIndex
CREATE INDEX "CashHandover_driverId_date_idx" ON "CashHandover"("driverId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CashHandover_driverId_date_key" ON "CashHandover"("driverId", "date");

-- CreateIndex
CREATE INDEX "DriverLocationHistory_driverId_timestamp_idx" ON "DriverLocationHistory"("driverId", "timestamp");

-- CreateIndex
CREATE INDEX "DriverLocationHistory_timestamp_idx" ON "DriverLocationHistory"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStats_date_key" ON "DailyStats"("date");

-- CreateIndex
CREATE INDEX "DailyStats_date_idx" ON "DailyStats"("date");

-- CreateIndex
CREATE INDEX "DriverPerformanceMetrics_date_idx" ON "DriverPerformanceMetrics"("date");

-- CreateIndex
CREATE INDEX "DriverPerformanceMetrics_performanceScore_idx" ON "DriverPerformanceMetrics"("performanceScore");

-- CreateIndex
CREATE UNIQUE INDEX "DriverPerformanceMetrics_driverId_date_key" ON "DriverPerformanceMetrics"("driverId", "date");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- CreateIndex
CREATE INDEX "Expense_spentByUserId_idx" ON "Expense"("spentByUserId");

-- CreateIndex
CREATE INDEX "Expense_driverId_idx" ON "Expense"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_manualCode_key" ON "CustomerProfile"("manualCode");

-- CreateIndex
CREATE INDEX "CustomerProfile_routeId_idx" ON "CustomerProfile"("routeId");

-- CreateIndex
CREATE INDEX "Order_scheduledDate_status_idx" ON "Order"("scheduledDate", "status");

-- CreateIndex
CREATE INDEX "Order_driverId_scheduledDate_idx" ON "Order"("driverId", "scheduledDate");

-- CreateIndex
CREATE INDEX "Order_customerId_status_idx" ON "Order"("customerId", "status");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_defaultDriverId_fkey" FOREIGN KEY ("defaultDriverId") REFERENCES "DriverProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteAssignment" ADD CONSTRAINT "RouteAssignment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteAssignment" ADD CONSTRAINT "RouteAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashHandover" ADD CONSTRAINT "CashHandover_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverLocationHistory" ADD CONSTRAINT "DriverLocationHistory_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverPerformanceMetrics" ADD CONSTRAINT "DriverPerformanceMetrics_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_spentByUserId_fkey" FOREIGN KEY ("spentByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
