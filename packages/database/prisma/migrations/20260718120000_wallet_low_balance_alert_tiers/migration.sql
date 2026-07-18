-- Required by Wallet.lowBalanceAlertTiers used for advertiser low-balance alerts.
ALTER TABLE `wallets` ADD COLUMN `low_balance_alert_tiers` JSON NOT NULL;
UPDATE `wallets` SET `low_balance_alert_tiers` = CAST('[]' AS JSON) WHERE `low_balance_alert_tiers` IS NULL;
