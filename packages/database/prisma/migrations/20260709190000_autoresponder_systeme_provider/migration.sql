-- Add Systeme.io to autoresponder provider enum (required for advertiser integrations).
ALTER TABLE `advertiser_autoresponders`
  MODIFY `provider` ENUM('WEBHOOK', 'MAILCHIMP', 'AWEBER', 'GETRESPONSE', 'SYSTEME') NOT NULL;
