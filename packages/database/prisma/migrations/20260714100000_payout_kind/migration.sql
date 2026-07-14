-- CreateEnum
CREATE TYPE "PayoutKind" AS ENUM ('PUBLISHER', 'REFERRAL');

-- AlterTable
ALTER TABLE "payouts" ADD COLUMN "kind" "PayoutKind" NOT NULL DEFAULT 'PUBLISHER';
