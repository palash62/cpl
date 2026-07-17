-- Snapshot CPL/bid on each lead so campaign bid edits do not rewrite historical values.
ALTER TABLE `leads` ADD COLUMN `cpl` DECIMAL(10, 2) NULL;

-- Default backfill from current campaign CPL.
UPDATE `leads` l
INNER JOIN `campaigns` c ON c.id = l.campaign_id
SET l.cpl = c.cpl
WHERE l.cpl IS NULL;

-- Prefer ledger debit amount for PAID leads (true charged spend).
UPDATE `leads` l
INNER JOIN `ledger_entries` le
  ON le.reference_id = l.id
 AND le.reference_type = 'lead'
 AND le.type = 'DEBIT'
SET l.cpl = ROUND(le.amount, 2)
WHERE l.status = 'PAID';
