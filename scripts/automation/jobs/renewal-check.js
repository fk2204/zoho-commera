// scripts/automation/jobs/renewal-check.js
// Checks all active Fundings for renewal eligibility (Paydown >= 50).
// Sets Renewal_Eligible = true on Funding and updates linked Renewal to "Eligible" stage.

import * as crm from '../../../src/crm/index.js';
import { logger } from '../../../src/utils/logger.js';
import { config } from '../../../src/config.js';
import { sendRenewalEligible, sendRenewalOpportunity } from '../../../src/mail/sender.js';

export async function run() {
  const start = Date.now();
  const results = { processed: 0, skipped: 0, errors: 0 };

  const today = new Date().toISOString().split('T')[0];

  // Find active Fundings at 50%+ paydown that aren't marked eligible yet
  const { data: fundings } = await crm.coql.query(
    `SELECT id, Name, Paydown, Renewal_Eligible, Merchant, Owner
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
        logger.info({ fundingId: funding.id, merchantId: funding.Merchant?.id }, '[DRY RUN] Would send renewal eligible email to merchant');
        logger.info({ fundingId: funding.id, repId: funding.Owner?.id }, '[DRY RUN] Would send renewal opportunity alert to rep');
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
        `SELECT id, Renewal_Stage, Original_Funded_Amount, Original_Factor_Rate FROM Renewals WHERE Original_Funding = '${funding.id}' LIMIT 1`
      );

      // Calculate renewal amount: original funded amount * factor rate (same as original deal)
      let renewalAmount = 0;
      if (renewals[0]) {
        const origAmount = renewals[0].Original_Funded_Amount ?? 0;
        const origFactor = renewals[0].Original_Factor_Rate ?? 0;
        if (origAmount > 0 && origFactor > 0) {
          renewalAmount = Math.round(origAmount * origFactor * 100) / 100;
        }
      }

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

      // Notify merchant of renewal eligibility
      if (funding.Merchant?.id) {
        try {
          const contact = await crm.records.getById('Contacts', funding.Merchant.id, {
            fields: ['id', 'First_Name', 'Last_Name', 'Email'],
          });
          if (contact?.Email) {
            const merchantName = `${contact.First_Name || ''} ${contact.Last_Name || ''}`.trim() || 'Merchant';
            await sendRenewalEligible(contact.Email, merchantName, renewalAmount);
          } else {
            logger.warn({ fundingId: funding.id, contactId: funding.Merchant.id }, 'No email on merchant contact - skipping renewal email');
          }
        } catch (err) {
          logger.warn({ fundingId: funding.id, err: err.message }, 'Could not send merchant renewal email');
        }
      }

      // Notify assigned rep of renewal opportunity — Owner lookup includes email directly
      if (funding.Owner?.email) {
        try {
          const merchantName = funding.Name || 'Merchant';
          await sendRenewalOpportunity(funding.Owner.email, funding.Owner.full_name || funding.Owner.name, merchantName, renewalAmount);
        } catch (err) {
          logger.warn({ fundingId: funding.id, err: err.message }, 'Could not send rep renewal alert');
        }
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
