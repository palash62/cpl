-- AlterTable
ALTER TABLE `leads` ADD COLUMN `cta_clicked` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `funnel_events` MODIFY COLUMN `event_type` ENUM('VIEW', 'SUBMIT', 'THANK_YOU_VIEW', 'PIXEL_FIRE', 'CTA_CLICK') NOT NULL;
