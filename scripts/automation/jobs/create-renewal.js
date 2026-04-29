// scripts/automation/jobs/create-renewal.js
// Creates a Renewal record for every Funding that doesn't have one yet.
// Idempotency: checks Renewals.Original_Funding = funding.id before creating.
// Can be called with a specific fundingId (from create-funding.js) or run against all Fundings.

import * as crm from '../../../src/crm/index.js';
import { logger } from '../../../src/utils/logger.js';
import { config } from '../../../src/config.js';

export async function run({ fundingId = null } = {}) {
  const start = Date.now();
  const results = { processed: 0, skipped: 0, errors: 0 };

  let fundings = [];

  if (fundingId) {
    // Called for a specific Funding (right after creating it)
    const record = await crm.records.getById('Fundings', fundingId, {
      fields: ['id', 'Name', 'Merchant', 'Business', 'Lender', 'Funded_Amount',
               'Factor_Rate', 'Payment_Amount', 'Payback_Amount', 'Balance_Remaining',
               'Paydown', 'Funding_Date'],
    });
    if (record) fundings = [record];
  } else {
    // Full scan — all active Fundings
    fundings = await crm.coql.queryAll(
      `SELECT id, Name, Merchant, Business, Lender, Funded_Amount,
              Factor_Rate, Payment_Amount, Payback_Amount, Balance_Remaining,
              Paydown, Funding_Date
       FROM Fundings
       WHERE Funding_status = 'Active'
       LIMIT 200`
    );
  }

  logger.info({ job: 'createRenewal', queried: fundings.length }, 'Job started');

  for (const funding of fundings) {
    try {
      // Idempotency check
      const { data: existing } = await crm.coql.query(
        `SELECT id FROM Renewals WHERE Original_Funding = '${funding.id}' LIMIT 1`
      );

      if (existing.length > 0) {
        logger.debug({ fundingId: funding.id, renewalId: existing[0].id }, 'Renewal already exists — skipping');
        results.skipped++;
        continue;
      }

      if (!funding.Merchant?.id) {
        logger.warn({ fundingId: funding.id }, 'Missing Merchant — skipping');
        results.errors++;
        continue;
      }
      if (!funding.Business?.id) {
        logger.warn({ fundingId: funding.id }, 'Missing Business — skipping');
        results.errors++;
        continue;
      }

      const renewalRecord = {
        Name: `Renewal - ${funding.Name}`,
        Original_Funding: funding.id,
        Merchant: funding.Merchant.id,
        Business: funding.Business.id,
        Original_Funded_Amount: funding.Funded_Amount ?? null,
        Original_Factor_Rate: funding.Factor_Rate ?? null,
        Original_Payment_Amount: funding.Payment_Amount ?? null,
        Original_Lender: funding.Lender?.name ?? null,
        Original_Funding_Date: funding.Funding_Date ?? null,
        Payoff_of_Original_Deal: funding.Payback_Amount ?? null,
        Current_Paydown: funding.Paydown ?? 0,
        Current_Balance_Remaining: funding.Balance_Remaining ?? null,
        Renewal_Stage: 'Eligibility Review',
      };

      if (config.dryRun) {
        logger.info({ fundingId: funding.id, renewalRecord }, '[DRY RUN] Would create Renewal');
        results.processed++;
        continue;
      }

      const response = await crm.records.insert('Renewals', [renewalRecord]);
      const renewalId = response[0]?.details?.id;

      if (!renewalId) {
        logger.error({ fundingId: funding.id, response }, 'Renewal created but no ID returned');
        results.errors++;
        continue;
      }

      logger.info({ fundingId: funding.id, renewalId }, 'Renewal created');
      results.processed++;

    } catch (err) {
      logger.error({ fundingId: funding.id, err: err.message }, 'Create Renewal failed for record');
      results.errors++;
    }
  }

  logger.info({ ...results, durationMs: Date.now() - start }, 'Create Renewal job complete');
  return results;
}
