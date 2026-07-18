-- CreateTable
CREATE TABLE `cpa_offers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `network` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `preview_url` TEXT NOT NULL,
    `tracking_url` TEXT NOT NULL,
    `payout` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'ARCHIVED') NOT NULL DEFAULT 'PAUSED',
    `postback_token` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cpa_offers_postback_token_key`(`postback_token`),
    INDEX `cpa_offers_status_created_at_idx`(`status`, `created_at`),
    INDEX `cpa_offers_network_idx`(`network`),
    INDEX `cpa_offers_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cpa_offer_conversions` (
    `id` VARCHAR(191) NOT NULL,
    `offer_id` VARCHAR(191) NOT NULL,
    `click_id` VARCHAR(191) NULL,
    `payout` DECIMAL(10, 2) NULL,
    `raw_query` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cpa_offer_conversions_offer_id_created_at_idx`(`offer_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cpa_offer_conversions` ADD CONSTRAINT `cpa_offer_conversions_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `cpa_offers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
