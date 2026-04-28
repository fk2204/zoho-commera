// scripts/automation/jobs/renewal-check.js
// Checks all active Fundings for renewal eligibility (Paydown >= 50).
// Sets Renewal_Eligible = true on Funding and updates linked Renewal to "Eligible" stage.

import * as crm from '../../../src/crm/index.js';
import { logger } from '../../../src/utils/logger.js';
import { config } from '../../../src/config.js';

export async function run() {
  const start = Date.now();
  const results = { processed: 0, skipped: 0, errors: 0 };

  const today = new Date().toISOString().split('T')[0];

  // Find active Fundings at 50%+ paydown that aren't marked eligible yet
  const { data: fundings } = await crm.coql.query(
    `SELECT id, Name, Paydown, Renewal_Eligible
     FROM Fundings
     WHERE Funding_status = 'Active'
     AND Paydown >= 50
     LIMIT 200`
  );

  logger.info({ job: 'renewalCheck', queried: fundings.length }, 'Job started');

  for (const funding of fundings) {
    try {
      if (funding.Renewal_Eligible === true) {
        results.skipped++;
        continue;
      }

      if (config.dryRun) {
        logger.info({ fundingId: funding.id, paydown: funding.Paydown }, '[DRY RUN] Would mark Renewal_Eligible');
        results.processed++;
        continue;
      }

      // Mark Funding as eligible
      await crm.records.update('Fundings', [{
        id: funding.id,
        Renewal_Eligible: true,
        Renewal_Eligible_Date: today,
      }]);

      // Find and update the linked Renewal record
      const { data: renewals } = await crm.coql.query(
        `SELECT id, Renewal_Stage FROM Renewals WHERE Original_Funding = '${funding.id}' LIMIT 1`
      );

      if (renewals.length > 0) {
        await crm.records.update('Renewals', [{
          id: renewals[0].id,
          Renewal_Stage: 'Eligible',
          Eligible_Date: today,
        }]);
        logger.info({ fundingId: funding.id, renewalId: renewals[0].id, paydown: funding.Paydown }, 'Marked eligible');
      } else {
        logger.warn({ fundingId: funding.id }, 'No Renewal record found for eligible Funding');
      }

      results.processed++;
    } catch (err) {
      logger.error({ fundingId: funding.id, err: err.message }, 'Renewal check failed for record');
      results.errors++;
    }
  }

  logger.info({ ...results, durationMs: Date.now() - start }, 'Renewal check job complete');
  return results;
}
