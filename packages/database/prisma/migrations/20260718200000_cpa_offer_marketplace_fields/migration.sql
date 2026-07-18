-- AlterTable
ALTER TABLE `cpa_offers`
  ADD COLUMN `thumbnail_url` TEXT NULL,
  ADD COLUMN `advertiser_label` VARCHAR(191) NOT NULL DEFAULT 'Platform',
  ADD COLUMN `revenue` DECIMAL(10, 2) NULL;

-- Backfill revenue from payout for existing rows
UPDATE `cpa_offers` SET `revenue` = `payout` WHERE `revenue` IS NULL;

-- Make revenue required
ALTER TABLE `cpa_offers` MODIFY `revenue` DECIMAL(10, 2) NOT NULL;
