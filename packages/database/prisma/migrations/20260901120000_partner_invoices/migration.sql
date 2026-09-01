-- Partner monthly settlement invoices
CREATE TABLE `partner_invoices` (
    `id` VARCHAR(191) NOT NULL,
    `invoice_number` VARCHAR(191) NOT NULL,
    `period_month` VARCHAR(191) NOT NULL,
    `amount_due` DECIMAL(12, 2) NOT NULL,
    `snapshot` JSON NOT NULL,
    `bill_from` JSON NOT NULL,
    `bill_to` JSON NOT NULL,
    `emailed_at` DATETIME(3) NULL,
    `email_error` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `partner_invoices_invoice_number_key`(`invoice_number`),
    UNIQUE INDEX `partner_invoices_period_month_key`(`period_month`),
    INDEX `partner_invoices_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
