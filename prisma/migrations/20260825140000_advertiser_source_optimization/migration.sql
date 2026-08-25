-- Advertiser source optimization: opaque source blocks + per-campaign source bids
CREATE TABLE `advertiser_source_blocks` (
    `id` VARCHAR(191) NOT NULL,
    `advertiser_id` VARCHAR(191) NOT NULL,
    `source_token` VARCHAR(64) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `advertiser_source_blocks_advertiser_id_source_token_key`(`advertiser_id`, `source_token`),
    INDEX `advertiser_source_blocks_source_token_idx`(`source_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `campaign_source_bids` (
    `id` VARCHAR(191) NOT NULL,
    `campaign_id` VARCHAR(191) NOT NULL,
    `advertiser_id` VARCHAR(191) NOT NULL,
    `source_token` VARCHAR(64) NOT NULL,
    `cpl` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `campaign_source_bids_campaign_id_source_token_key`(`campaign_id`, `source_token`),
    INDEX `campaign_source_bids_advertiser_id_source_token_idx`(`advertiser_id`, `source_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `advertiser_source_blocks`
  ADD CONSTRAINT `advertiser_source_blocks_advertiser_id_fkey`
  FOREIGN KEY (`advertiser_id`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `campaign_source_bids`
  ADD CONSTRAINT `campaign_source_bids_campaign_id_fkey`
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `campaign_source_bids`
  ADD CONSTRAINT `campaign_source_bids_advertiser_id_fkey`
  FOREIGN KEY (`advertiser_id`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
