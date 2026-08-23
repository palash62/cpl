-- AlterTable
CREATE INDEX `leads_ip_idx` ON `leads`(`ip`);

-- AlterTable
CREATE INDEX `leads_ip_created_at_idx` ON `leads`(`ip`, `created_at`);

-- CreateTable
CREATE TABLE `lead_fraud_intelligence` (
    `id` VARCHAR(191) NOT NULL,
    `lead_id` VARCHAR(191) NOT NULL,
    `contextual_risk_score` INTEGER NOT NULL,
    `contextual_risk_level` VARCHAR(191) NOT NULL,
    `signals` JSON NOT NULL,
    `explanation` JSON NOT NULL,
    `ip_context` JSON NULL,
    `device_context` JSON NULL,
    `computed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lead_fraud_intelligence_lead_id_key`(`lead_id`),
    INDEX `lead_fraud_intelligence_contextual_risk_score_idx`(`contextual_risk_score`),
    INDEX `lead_fraud_intelligence_contextual_risk_level_idx`(`contextual_risk_level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lead_fraud_intelligence` ADD CONSTRAINT `lead_fraud_intelligence_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
