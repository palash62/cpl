-- Separate referral earnings from campaign spend (main wallet balance).
ALTER TABLE `wallets`
  ADD COLUMN `referral_balance` DECIMAL(12, 4) NOT NULL DEFAULT 0,
  ADD COLUMN `referral_hold_balance` DECIMAL(12, 4) NOT NULL DEFAULT 0;
