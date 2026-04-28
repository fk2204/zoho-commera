// scripts/automation/jobs/create-funding.js
// Creates a Funding record for every Deal with Stage = "Funded" that doesn't have one yet.
// Idempotency: checks Fundings.Submission = deal.id before creating.
// After creating Funding, triggers create-renewal for that funding.

import * as crm from '../../../src/crm/index.js';
import { logger } from '../../../src/utils/logger.js';
import { config } from '../../../src/config.js';
import { sendFundingConfirmation } from '../../../src/mail/sender.js';
import { run as createRenewal } from './create-renewal.js';

export async function run() {
  const start = Date.now();
  const results = { processed: 0, skipped: 0, errors: 0 };

  // Get all Funded deals with the fields we need to build a Funding record
  // Note: Created_Time is not available in Deals; using Stage_Modified_Time as proxy
  const { data: deals } = await crm.coql.query(
    `SELECT id, Deal_Name, Stage, Contact_Name, Account_Name, Lender,
            Funded_Amount, Factor_Rate, Payback_Amount, Commission, Estimated_commision,
            Term_Months, Payment_Frequency, Payment_Amount, Holdback,
            Buy_Rate, Sell_Rate, Net_to_Merchant, Origination_Fee, Date_Funded
     FROM Deals
     WHERE Stage = 'Funded'
     LIMIT 200`
  );

  logger.info({ job: 'createFunding', queried: deals.length }, 'Job started');

  for (const deal of deals) {
    try {
      // Idempotency check — does a Funding already exist for this Deal?
      const { data: existing } = await crm.coql.query(
        `SELECT id FROM Fundings WHERE Submission = '${deal.id}' LIMIT 1`
      );

      if (existing.length > 0) {
        logger.debug({ dealId: deal.id, fundingId: existing[0].id }, 'Funding already exists — skipping');
        results.skipped++;
        continue;
      }

      // Validate required fields before attempting create
      if (!deal.Contact_Name?.id) {
        logger.warn({ dealId: deal.id, Deal_Name: deal.Deal_Name }, 'Missing Contact_Name — skipping');
        results.errors++;
        continue;
      }
      if (!deal.Account_Name?.id) {
        logger.warn({ dealId: deal.id, Deal_Name: deal.Deal_Name }, 'Missing Account_Name — skipping');
        results.errors++;
        continue;
      }

      const today = new Date().toISOString().split('T')[0];

      const fundingRecord = {
        Name: `Funding - ${deal.Deal_Name}`,
        Submission: deal.id,
        Merchant: deal.Contact_Name.id,
        Business: deal.Account_Name.id,
        Funding_Date: today,
        Funding_status: 'Active',
        Funded_Amount: deal.Funded_Amount ?? null,
        Factor_Rate: deal.Factor_Rate ?? null,
        Payback_Amount: deal.Payback_Amount ?? null,
        Commission: deal.Commission ?? null,
        Commission_Amount: deal.Estimated_commision ?? null,
        Term_Months: deal.Term_Months ?? null,
        Payment_Frequency: deal.Payment_Frequency ?? null,
        Payment_Amount: deal.Payment_Amount ?? null,
        Holdback: deal.Holdback ?? null,
        Buy_Rate: deal.Buy_Rate ?? null,
        Sell_Rate: deal.Sell_Rate ?? null,
        Net_to_Merchant: deal.Net_to_Merchant ?? null,
        Origination_fee: deal.Origination_Fee ?? null,
      };

      // Only add Lender if it exists on the Deal
      if (deal.Lender?.id) fundingRecord.Lender = deal.Lender.id;

      if (config.dryRun) {
        logger.info({ dealId: deal.id, Deal_Name: deal.Deal_Name, fundingRecord }, '[DRY RUN] Would create Funding');
        results.processed++;
        continue;
      }

      const response = await crm.records.insert('Fundings', [fundingRecord]);
      const fundingId = response[0]?.details?.id;

      if (!fundingId) {
        logger.error({ dealId: deal.id, response }, 'Funding created but no ID returned');
        results.errors++;
        continue;
      }

      logger.info({ dealId: deal.id, fundingId, Deal_Name: deal.Deal_Name }, 'Funding created');

      // Send funding confirmation email to merchant
      if (deal.Contact_Name?.id) {
        try {
          const contact = await crm.records.getById('Contacts', deal.Contact_Name.id, {
            fields: ['id', 'First_Name', 'Last_Name', 'Email'],
          });
          if (contact?.Email) {
            const merchantName = `${contact.First_Name || ''} ${contact.Last_Name || ''}`.trim() || 'Merchant';
            await sendFundingConfirmation(contact.Email, merchantName, deal.Funded_Amount, today);
          }
        } catch (err) {
          logger.warn({ dealId: deal.id, err: err.message }, 'Failed to send funding confirmation email');
        }
      }

      // Update Business (Account) funding history
      const { data: [biz] } = await crm.coql.query(
        `SELECT id, Total_Times_Funded, Total_Funded_Amount_Lifetime, First_Funded_Date
         FROM Accounts WHERE id = '${deal.Account_Name.id}' LIMIT 1`
      );

      if (biz) {
        const timesF = (biz.Total_Times_Funded || 0) + 1;
        const totalAmt = (biz.Total_Funded_Amount_Lifetime || 0) + (deal.Funded_Amount || 0);
        const bizUpdate = {
          id: biz.id,
          Total_Times_Funded: timesF,
          Total_Funded_Amount_Lifetime: totalAmt,
          Last_Funded_Date: today,
        };
        if (!biz.First_Funded_Date) bizUpdate.First_Funded_Date = today;
        await crm.records.update('Accounts', [bizUpdate]);
        logger.debug({ accountId: biz.id, timesF, totalAmt }, 'Business funding history updated');
      }

      // Update Deal with Date_Funded (Days_Lead_to_Fund calculated separately in catch-up job)
      const dealUpdate = { id: deal.id };
      if (!deal.Date_Funded) dealUpdate.Date_Funded = today;
      if (Object.keys(dealUpdate).length > 1) {
        await crm.records.update('Deals', [dealUpdate]);
        logger.debug({ dealId: deal.id }, 'Deal Date_Funded set');
      }

      results.processed++;

      // Immediately create Renewal for this new Funding
      await createRenewal({ fundingId, skipQuery: false });

    } catch (err) {
      logger.error({ dealId: deal.id, err: err.message }, 'Create Funding failed for record');
      results.errors++;
    }
  }

  logger.info({ ...results, durationMs: Date.now() - start }, 'Create Funding job complete');
  return results;
}
