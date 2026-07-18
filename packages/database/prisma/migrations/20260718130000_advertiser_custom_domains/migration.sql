-- CreateTable
CREATE TABLE `advertiser_domains` (
    `id` VARCHAR(191) NOT NULL,
    `advertiser_id` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `verified_at` DATETIME(3) NULL,
    `last_checked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `advertiser_domains_domain_key`(`domain`),
    INDEX `advertiser_domains_advertiser_id_idx`(`advertiser_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `advertiser_domains` ADD CONSTRAINT `advertiser_domains_advertiser_id_fkey` FOREIGN KEY (`advertiser_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `advertiser_optin_pages` ADD COLUMN `custom_domain_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `advertiser_optin_pages_custom_domain_id_idx` ON `advertiser_optin_pages`(`custom_domain_id`);

-- AddForeignKey
ALTER TABLE `advertiser_optin_pages` ADD CONSTRAINT `advertiser_optin_pages_custom_domain_id_fkey` FOREIGN KEY (`custom_domain_id`) REFERENCES `advertiser_domains`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
