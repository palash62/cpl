-- CreateTable
CREATE TABLE `cpa_offer_clicks` (
    `id` VARCHAR(191) NOT NULL,
    `offer_id` VARCHAR(191) NOT NULL,
    `advertiser_id` VARCHAR(191) NOT NULL,
    `sub_id` VARCHAR(191) NULL,
    `src` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cpa_offer_clicks_offer_id_created_at_idx`(`offer_id`, `created_at`),
    INDEX `cpa_offer_clicks_advertiser_id_idx`(`advertiser_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `cpa_offer_conversions`
    ADD COLUMN `advertiser_id` VARCHAR(191) NULL,
    ADD COLUMN `click_record_id` VARCHAR(191) NULL,
    ADD INDEX `cpa_offer_conversions_advertiser_id_created_at_idx`(`advertiser_id`, `created_at`),
    ADD INDEX `cpa_offer_conversions_click_record_id_idx`(`click_record_id`);

-- CreateTable
CREATE TABLE `advertiser_global_postbacks` (
    `id` VARCHAR(191) NOT NULL,
    `advertiser_id` VARCHAR(191) NOT NULL,
    `type` ENUM('S2S', 'IMAGE', 'HTML') NOT NULL DEFAULT 'S2S',
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'INACTIVE',
    `endpoint` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `advertiser_global_postbacks_advertiser_id_key`(`advertiser_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cpa_postback_deliveries` (
    `id` VARCHAR(191) NOT NULL,
    `conversion_id` VARCHAR(191) NOT NULL,
    `target` ENUM('ADMIN_PARALLEL', 'ADVERTISER_GLOBAL') NOT NULL,
    `url` TEXT NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `http_status` INTEGER NULL,
    `error` TEXT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `cpa_postback_deliveries_conversion_id_idx`(`conversion_id`),
    INDEX `cpa_postback_deliveries_status_created_at_idx`(`status`, `created_at`),
    UNIQUE INDEX `cpa_postback_deliveries_conversion_id_target_key`(`conversion_id`, `target`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cpa_offer_clicks` ADD CONSTRAINT `cpa_offer_clicks_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `cpa_offers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cpa_offer_clicks` ADD CONSTRAINT `cpa_offer_clicks_advertiser_id_fkey` FOREIGN KEY (`advertiser_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cpa_offer_conversions` ADD CONSTRAINT `cpa_offer_conversions_advertiser_id_fkey` FOREIGN KEY (`advertiser_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cpa_offer_conversions` ADD CONSTRAINT `cpa_offer_conversions_click_record_id_fkey` FOREIGN KEY (`click_record_id`) REFERENCES `cpa_offer_clicks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `advertiser_global_postbacks` ADD CONSTRAINT `advertiser_global_postbacks_advertiser_id_fkey` FOREIGN KEY (`advertiser_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cpa_postback_deliveries` ADD CONSTRAINT `cpa_postback_deliveries_conversion_id_fkey` FOREIGN KEY (`conversion_id`) REFERENCES `cpa_offer_conversions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
