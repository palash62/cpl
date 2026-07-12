ALTER TABLE `wallets`
  MODIFY `balance` DECIMAL(12, 4) NOT NULL DEFAULT 0,
  MODIFY `hold_balance` DECIMAL(12, 4) NOT NULL DEFAULT 0;

ALTER TABLE `ledger_entries`
  MODIFY `amount` DECIMAL(12, 4) NOT NULL,
  MODIFY `balance_after` DECIMAL(12, 4) NOT NULL;

ALTER TABLE `payouts`
  MODIFY `amount` DECIMAL(12, 4) NOT NULL;

ALTER TABLE `platform_fees`
  MODIFY `fee_amount` DECIMAL(10, 4) NOT NULL;
