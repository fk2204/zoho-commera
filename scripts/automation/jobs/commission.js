// scripts/automation/jobs/commission.js
// Calculates Estimated_commision = Funded_Amount × (Commission / 100) for all qualifying Deals.
// Commission field = percentage (e.g. 2.5 = 2.5%).
// Estimated_commision field = dollar amount (note: intentional typo in Zoho field name).

import * as crm from '../../../src/crm/index.js';
import { logger } from '../../../src/utils/logger.js';
import { config } from '../../../src/config.js';

export async function run() {
  const start = Date.now();
  const results = { processed: 0, skipped: 0, errors: 0 };

  const deals = await crm.coql.queryAll(
    `SELECT id, Deal_Name, Funded_Amount, Commission, Estimated_commision
     FROM Deals
     WHERE Funded_Amount is not null AND Commission is not null
     LIMIT 200`
  );

  logger.info({ job: 'commission', queried: deals.length }, 'Job started');

  const updates = [];

  for (const deal of deals) {
    try {
      const funded = deal.Funded_Amount;
      const pct = deal.Commission;

      if (!funded || !pct || funded <= 0 || pct <= 0) {
        results.skipped++;
        continue;
      }

      const expected = Math.round(funded * (pct / 100) * 100) / 100;
      const current = deal.Estimated_commision;

      if (current === expected) {
        results.skipped++;
        continue;
      }

      if (config.dryRun) {
        logger.info({ dealId: deal.id, Deal_Name: deal.Deal_Name, expected }, '[DRY RUN] Would set Estimated_commision');
        results.processed++;
        continue;
      }

      updates.push({ id: deal.id, Estimated_commision: expected });
      logger.info({ dealId: deal.id, Deal_Name: deal.Deal_Name, commission: expected }, 'Commission queued');

      // Sync commission to linked Funding record(s) — find by Submission = Deal.id
      try {
        const { data: fundings } = await crm.coql.query(
          `SELECT id FROM Fundings WHERE Submission = '${deal.id}' LIMIT 1`
        );
        if (fundings.length > 0) {
          await crm.records.update('Fundings', [{
            id: fundings[0].id,
            Commission_Amount: expected,
          }]);
          logger.debug({ fundingId: fundings[0].id, commission: expected }, 'Funding commission synced');
        }
      } catch (err) {
        logger.debug({ dealId: deal.id, err: err.message }, 'Could not sync commission to Funding');
      }

      results.processed++;
    } catch (err) {
      logger.error({ dealId: deal.id, err: err.message }, 'Commission failed for record');
      results.errors++;
    }
  }

  try {
    for (let i = 0; i < updates.length; i += 100) {
      if (!config.dryRun) await crm.records.update('Deals', updates.slice(i, i + 100));
    }
  } catch (err) {
    logger.error({ err: err.message, count: updates.length }, 'Batch Deal commission write failed');
    results.errors += updates.length;
  }

  logger.info({ ...results, durationMs: Date.now() - start }, 'Commission job complete');
  return results;
}
