// scripts/automation/jobs/days-to-fund.js
// Calculates Days_Lead_to_Fund = calendar days from deal creation to funding for funded deals.
// Only updates records where Days_Lead_to_Fund is null.

import * as crm from '../../../src/crm/index.js';
import { logger } from '../../../src/utils/logger.js';
import { config } from '../../../src/config.js';

export async function run() {
  const start = Date.now();
  const results = { processed: 0, skipped: 0, errors: 0 };

  // Note: Deals module does not have Created_Time field in the API.
  // Days_Lead_to_Fund is calculated when Funding is created (from Deal.Stage_Modified_Time when first entering pipeline).
  // This job is a placeholder for future logic if a creation timestamp becomes available.

  // Note: COQL doesn't support "is null" checks, only "is not null"
  // We query all Funded deals and filter in-memory
  const { data: allFundedDeals = [] } = await crm.coql.query(
    `SELECT id, Deal_Name, Date_Funded, Days_Lead_to_Fund
     FROM Deals
     WHERE Stage = 'Funded' AND Date_Funded is not null
     LIMIT 200`
  );
  const deals = allFundedDeals.filter(d => !d.Days_Lead_to_Fund);

  logger.info({ job: 'daysToFund', queried: deals.length }, 'Job started');

  if (deals.length > 0) {
    logger.warn(
      { dealCount: deals.length },
      'Days_Lead_to_Fund calculation requires Deal creation timestamp (not available in API). ' +
      'This field is populated when Funding records are created in create-funding.js. ' +
      'Skipping catch-up for now.'
    );
  }

  logger.info({ ...results, durationMs: Date.now() - start }, 'Days to Fund job complete');
  return results;
}
