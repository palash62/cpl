-- AlterTable
ALTER TABLE `leads` ADD COLUMN `is_test` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `leads_campaign_id_is_test_created_at_idx` ON `leads`(`campaign_id`, `is_test`, `created_at`);
