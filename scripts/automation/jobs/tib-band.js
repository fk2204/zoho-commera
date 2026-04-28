// scripts/automation/jobs/tib-band.js
// Calculates TIB_Band (Time in Business Band) on Accounts from Date_Business_Started.
// TIB_Band field must be writable — checks read-only flag at startup.

import * as crm from '../../../src/crm/index.js';
import { logger } from '../../../src/utils/logger.js';
import { config } from '../../../src/config.js';

function getTibBand(dateStarted) {
  if (!dateStarted) return null;
  const start = new Date(dateStarted);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

  if (months >= 24) return '2+ Years';
  if (months >= 12) return '1-2 Years';
  if (months >= 6) return '6-12 Months';
  if (months >= 4) return '4-6 Months';
  return 'Under 4 Months';
}

export async function run() {
  const start = Date.now();
  const results = { processed: 0, skipped: 0, errors: 0 };

  // Check if TIB_Band is writable before proceeding
  const fields = await crm.metadata.listFields('Accounts');
  const tibField = fields.find(f => f.api_name === 'TIB_Band');

  if (!tibField) {
    logger.warn('TIB_Band field not found in Accounts — aborting');
    return results;
  }

  if (tibField.read_only) {
    logger.warn({ field: 'TIB_Band', read_only: true }, 'TIB_Band is read-only in Accounts — skipping (must be set via Zoho UI or formula)');
    return results;
  }

  const { data: accounts } = await crm.coql.query(
    `SELECT id, Account_Name, Date_Business_Started, TIB_Band
     FROM Accounts
     WHERE Date_Business_Started is not null
     LIMIT 200`
  );

  logger.info({ job: 'tibBand', queried: accounts.length }, 'Job started');

  for (const account of accounts) {
    try {
      const expected = getTibBand(account.Date_Business_Started);
      const current = account.TIB_Band;

      if (current === expected) {
        results.skipped++;
        continue;
      }

      if (config.dryRun) {
        logger.info({ accountId: account.id, Account_Name: account.Account_Name, expected }, '[DRY RUN] Would set TIB_Band');
        results.processed++;
        continue;
      }

      await crm.records.update('Accounts', [{ id: account.id, TIB_Band: expected }]);
      logger.info({ accountId: account.id, Account_Name: account.Account_Name, tibBand: expected }, 'TIB_Band set');
      results.processed++;
    } catch (err) {
      logger.error({ accountId: account.id, err: err.message }, 'TIB Band failed for record');
      results.errors++;
    }
  }

  logger.info({ ...results, durationMs: Date.now() - start }, 'TIB Band job complete');
  return results;
}
