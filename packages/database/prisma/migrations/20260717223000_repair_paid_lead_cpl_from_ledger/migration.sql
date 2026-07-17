-- Re-lock PAID lead CPL from advertiser ledger debits.
-- Fixes rows that were backfilled from the live campaign bid after a bid edit.
UPDATE `leads` l
INNER JOIN `ledger_entries` le
  ON le.reference_id = l.id
 AND le.reference_type = 'lead'
 AND le.type = 'DEBIT'
SET l.cpl = ROUND(le.amount, 2)
WHERE l.status = 'PAID';
