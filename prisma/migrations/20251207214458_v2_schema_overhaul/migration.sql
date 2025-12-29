/*
  Warnings:

  - You are about to drop the column `lastAlertSent` on the `budgets` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `budgets` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `BigInt`.
  - You are about to alter the column `balance` on the `financial_accounts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `BigInt`.
  - You are about to drop the column `category` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `isRecurring` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `lastProcessedDate` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `nextRecurringDate` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `recurringInterval` on the `transactions` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `transactions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `BigInt`.
  - You are about to drop the column `googleId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,categoryId,period,startDate]` on the table `budgets` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,name]` on the table `financial_accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `currency` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CHECKING', 'SAVINGS', 'CREDIT_CARD', 'CASH', 'INVESTMENT', 'CRYPTO', 'LOAN', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "RecurringStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BudgetPeriod" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'TRANSFER';

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_userId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_accountId_fkey";

-- DropIndex
DROP INDEX "budgets_userId_idx";

-- DropIndex
DROP INDEX "financial_accounts_userId_idx";

-- DropIndex
DROP INDEX "transactions_accountId_idx";

-- DropIndex
DROP INDEX "transactions_userId_idx";

-- DropIndex
DROP INDEX "users_googleId_key";

-- AlterTable
ALTER TABLE "budgets" DROP COLUMN "lastAlertSent",
ADD COLUMN     "alertThreshold" INTEGER NOT NULL DEFAULT 80,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastAlertSentAt" TIMESTAMP(3),
ADD COLUMN     "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "period" "BudgetPeriod" NOT NULL,
ADD COLUMN     "spent" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "financial_accounts" ADD COLUMN     "color" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "institution" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "type" "AccountType" NOT NULL DEFAULT 'CHECKING',
ALTER COLUMN "balance" SET DEFAULT 0,
ALTER COLUMN "balance" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "category",
DROP COLUMN "isRecurring",
DROP COLUMN "lastProcessedDate",
DROP COLUMN "nextRecurringDate",
DROP COLUMN "recurringInterval",
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "postedDate" TIMESTAMP(3),
ADD COLUMN     "recurringRuleId" TEXT,
ADD COLUMN     "transferPairId" TEXT,
ALTER COLUMN "amount" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "googleId";

-- DropTable
DROP TABLE "accounts";

-- DropEnum
DROP TYPE "RecurringInterval";

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "accentColor" TEXT NOT NULL DEFAULT '#10B981',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "budgetAlerts" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT false,
    "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT,
    "type" "TransactionType" NOT NULL,
    "parentId" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_rules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "frequency" "RecurringFrequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "dayOfMonth" INTEGER,
    "dayOfWeek" INTEGER,
    "monthOfYear" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "maxOccurrences" INTEGER,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 0,
    "nextOccurrence" TIMESTAMP(3),
    "lastOccurrence" TIMESTAMP(3),
    "lastProcessedAt" TIMESTAMP(3),
    "status" "RecurringStatus" NOT NULL DEFAULT 'ACTIVE',
    "autoPost" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "net_worth_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalAssets" BIGINT NOT NULL,
    "totalLiabilities" BIGINT NOT NULL,
    "netWorth" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "accountBreakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "net_worth_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "auth_accounts_userId_idx" ON "auth_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_accounts_provider_providerAccountId_key" ON "auth_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "categories_userId_type_isActive_idx" ON "categories"("userId", "type", "isActive");

-- CreateIndex
CREATE INDEX "categories_isSystem_idx" ON "categories"("isSystem");

-- CreateIndex
CREATE UNIQUE INDEX "categories_userId_name_type_key" ON "categories"("userId", "name", "type");

-- CreateIndex
CREATE INDEX "recurring_rules_userId_status_idx" ON "recurring_rules"("userId", "status");

-- CreateIndex
CREATE INDEX "recurring_rules_nextOccurrence_status_idx" ON "recurring_rules"("nextOccurrence", "status");

-- CreateIndex
CREATE INDEX "recurring_rules_status_nextOccurrence_idx" ON "recurring_rules"("status", "nextOccurrence");

-- CreateIndex
CREATE INDEX "net_worth_snapshots_userId_date_idx" ON "net_worth_snapshots"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "net_worth_snapshots_userId_date_key" ON "net_worth_snapshots"("userId", "date");

-- CreateIndex
CREATE INDEX "exchange_rates_fromCurrency_toCurrency_effectiveDate_idx" ON "exchange_rates"("fromCurrency", "toCurrency", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_fromCurrency_toCurrency_effectiveDate_key" ON "exchange_rates"("fromCurrency", "toCurrency", "effectiveDate");

-- CreateIndex
CREATE INDEX "budgets_userId_isActive_idx" ON "budgets"("userId", "isActive");

-- CreateIndex
CREATE INDEX "budgets_userId_period_startDate_idx" ON "budgets"("userId", "period", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_userId_categoryId_period_startDate_key" ON "budgets"("userId", "categoryId", "period", "startDate");

-- CreateIndex
CREATE INDEX "financial_accounts_userId_status_idx" ON "financial_accounts"("userId", "status");

-- CreateIndex
CREATE INDEX "financial_accounts_userId_type_idx" ON "financial_accounts"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "financial_accounts_userId_name_key" ON "financial_accounts"("userId", "name");

-- CreateIndex
CREATE INDEX "transactions_userId_date_idx" ON "transactions"("userId", "date");

-- CreateIndex
CREATE INDEX "transactions_userId_type_date_idx" ON "transactions"("userId", "type", "date");

-- CreateIndex
CREATE INDEX "transactions_userId_categoryId_date_idx" ON "transactions"("userId", "categoryId", "date");

-- CreateIndex
CREATE INDEX "transactions_accountId_date_idx" ON "transactions"("accountId", "date");

-- CreateIndex
CREATE INDEX "transactions_recurringRuleId_idx" ON "transactions"("recurringRuleId");

-- CreateIndex
CREATE INDEX "transactions_transferPairId_idx" ON "transactions"("transferPairId");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurringRuleId_fkey" FOREIGN KEY ("recurringRuleId") REFERENCES "recurring_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "net_worth_snapshots" ADD CONSTRAINT "net_worth_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
