-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'WAITING_PAYMENT', 'PAID', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'EXPIRED', 'REFUND_REQUESTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MIDTRANS', 'CASH');

-- CreateTable
CREATE TABLE "LessonOrder" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentPhone" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "syllabusId" TEXT,
    "preferredAt" TIMESTAMP(3),
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentProvider" "PaymentProvider" NOT NULL DEFAULT 'MIDTRANS',
    "snapToken" TEXT,
    "snapRedirectUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "expireAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonOrder_code_key" ON "LessonOrder"("code");

-- CreateIndex
CREATE INDEX "LessonOrder_code_idx" ON "LessonOrder"("code");

-- CreateIndex
CREATE INDEX "LessonOrder_status_paymentStatus_idx" ON "LessonOrder"("status", "paymentStatus");
