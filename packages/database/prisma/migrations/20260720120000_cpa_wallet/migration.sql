-- AlterEnum
ALTER TYPE "PayoutKind" ADD VALUE 'CPA';

-- CreateEnum
CREATE TYPE "CpaEarningStatus" AS ENUM ('PENDING', 'AVAILABLE');

-- CreateTable
CREATE TABLE "cpa_wallets" (
    "id" TEXT NOT NULL,
    "advertiser_id" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "hold_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cpa_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cpa_earnings" (
    "id" TEXT NOT NULL,
    "advertiser_id" TEXT NOT NULL,
    "conversion_id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "available_at" TIMESTAMP(3) NOT NULL,
    "status" "CpaEarningStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cpa_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cpa_wallets_advertiser_id_key" ON "cpa_wallets"("advertiser_id");

-- CreateIndex
CREATE UNIQUE INDEX "cpa_earnings_conversion_id_key" ON "cpa_earnings"("conversion_id");

-- CreateIndex
CREATE INDEX "cpa_earnings_advertiser_id_created_at_idx" ON "cpa_earnings"("advertiser_id", "created_at");

-- CreateIndex
CREATE INDEX "cpa_earnings_advertiser_id_status_available_at_idx" ON "cpa_earnings"("advertiser_id", "status", "available_at");

-- AddForeignKey
ALTER TABLE "cpa_wallets" ADD CONSTRAINT "cpa_wallets_advertiser_id_fkey" FOREIGN KEY ("advertiser_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cpa_earnings" ADD CONSTRAINT "cpa_earnings_advertiser_id_fkey" FOREIGN KEY ("advertiser_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cpa_earnings" ADD CONSTRAINT "cpa_earnings_conversion_id_fkey" FOREIGN KEY ("conversion_id") REFERENCES "cpa_offer_conversions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cpa_earnings" ADD CONSTRAINT "cpa_earnings_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "cpa_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
