-- AlterTable
ALTER TABLE `advertiser_optin_pages` ADD COLUMN `cpa_offer_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `advertiser_optin_pages` ADD CONSTRAINT `advertiser_optin_pages_cpa_offer_id_fkey` FOREIGN KEY (`cpa_offer_id`) REFERENCES `cpa_offers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
