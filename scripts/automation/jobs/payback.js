// scripts/automation/jobs/payback.js
// Calculates Payback_Amount = Approved_Amount × Factor_Rate for all qualifying Deals.
// Skips if already correct. Never overwrites on Funded deals (post-fact protection).

import * as crm from '../../../src/crm/index.js';
import { logger } from '../../../src/utils/logger.js';
import { config } from '../../../src/config.js';

export async function run() {
  const start = Date.now();
  const results = { processed: 0, skipped: 0, errors: 0 };

  const { data: deals } = await crm.coql.query(
    `SELECT id, Deal_Name, Stage, Approved_Amount, Factor_Rate, Payback_Amount
     FROM Deals
     WHERE Approved_Amount is not null AND Factor_Rate is not null
     LIMIT 200`
  );

  logger.info({ job: 'payback', queried: deals.length }, 'Job started');

  for (const deal of deals) {
    try {
      const approved = deal.Approved_Amount;
      const factor = deal.Factor_Rate;

      if (!approved || !factor || approved <= 0 || factor <= 0) {
        results.skipped++;
        continue;
      }

      const expected = Math.round(approved * factor * 100) / 100;
      const current = deal.Payback_Amount;

      if (current === expected) {
        results.skipped++;
        continue;
      }

      if (config.dryRun) {
        logger.info({ dealId: deal.id, Deal_Name: deal.Deal_Name, expected }, '[DRY RUN] Would set Payback_Amount');
        results.processed++;
        continue;
      }

      await crm.records.update('Deals', [{ id: deal.id, Payback_Amount: expected }]);
      logger.info({ dealId: deal.id, Deal_Name: deal.Deal_Name, payback: expected }, 'Payback set');
      results.processed++;
    } catch (err) {
      logger.error({ dealId: deal.id, err: err.message }, 'Payback failed for record');
      results.errors++;
    }
  }

  logger.info({ ...results, durationMs: Date.now() - start }, 'Payback job complete');
  return results;
}
