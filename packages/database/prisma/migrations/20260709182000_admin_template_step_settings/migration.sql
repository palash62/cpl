ALTER TABLE `page_templates`
  ADD COLUMN `thank_you_enabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `destination_url` VARCHAR(500) NULL,
  ADD COLUMN `thank_you_pixel_html` TEXT NULL,
  ADD COLUMN `thank_you_use_campaign_pixel` BOOLEAN NOT NULL DEFAULT true;
