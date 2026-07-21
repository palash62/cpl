-- AlterTable
ALTER TABLE `cpa_offer_clicks` ADD COLUMN `lead_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `cpa_offer_clicks_lead_id_idx` ON `cpa_offer_clicks`(`lead_id`);

-- AddForeignKey
ALTER TABLE `cpa_offer_clicks` ADD CONSTRAINT `cpa_offer_clicks_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
