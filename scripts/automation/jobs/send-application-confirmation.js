// scripts/automation/jobs/send-application-confirmation.js
// Sends application confirmation emails to merchants when Submissions are created.

import * as crm from '../../../src/crm/index.js';
import { logger } from '../../../src/utils/logger.js';
import { config } from '../../../src/config.js';
import { sendApplicationConfirmation, sendNewApplicationAlert } from '../../../src/mail/sender.js';

export async function run() {
  const start = Date.now();
  const results = { processed: 0, skipped: 0, errors: 0 };

  // Fetch all active deals including Date_Application_Sent for deduplication.
  // Zoho COQL does not support IS NULL on date fields, so we filter client-side.
  const allDeals = await crm.coql.queryAll(
    `SELECT id, Deal_Name, Contact_Name, Account_Name, Owner, Amount, Stage, Date_Application_Sent, Submission_Number, Industry
     FROM Deals
     WHERE Stage is not null
     LIMIT 200`
  );

  // Dedup: skip any deal that already has a Date_Application_Sent value
  const deals = allDeals.filter(d => !d.Date_Application_Sent);

  logger.info({ job: 'sendApplicationConfirmation', queried: deals.length }, 'Job started');

  for (const deal of deals) {
    try {
      // Skip if we can't get contact info
      if (!deal.Contact_Name?.id) {
        logger.debug({ dealId: deal.id, Deal_Name: deal.Deal_Name }, 'No contact - skipping');
        results.skipped++;
        continue;
      }

      // Fetch contact to get email
      const contact = await crm.records.getById('Contacts', deal.Contact_Name.id, {
        fields: ['id', 'First_Name', 'Last_Name', 'Email', 'Phone', 'Mobile'],
      });

      if (!contact?.Email) {
        logger.warn({ dealId: deal.id, Deal_Name: deal.Deal_Name }, 'No email on contact - skipping');
        results.skipped++;
        continue;
      }

      const merchantName = `${contact.First_Name || ''} ${contact.Last_Name || ''}`.trim() || 'Merchant';
      const submissionNumber = deal.Submission_Number || deal.id;

      if (config.dryRun) {
        logger.info(
          { dealId: deal.id, to: contact.Email, merchantName },
          '[DRY RUN] Would send application confirmation'
        );
        results.processed++;
        continue;
      }

      // Send confirmation to merchant
      const confirmSent = await sendApplicationConfirmation(contact.Email, merchantName, submissionNumber, deal.Amount || null);

      // Send alert to assigned rep (if available) — COQL Owner objects only have id, not email
      if (deal.Owner?.id) {
        try {
          const owner = await crm.users.getById(deal.Owner.id);
          if (owner?.email) {
            await sendNewApplicationAlert(owner.email, merchantName, submissionNumber, owner.full_name ?? deal.Owner.name, contact.Phone || contact.Mobile || null, contact.Email || null, null, deal.Industry || null);
          }
        } catch (err) {
          logger.debug({ dealId: deal.id, err: err.message }, 'Could not send rep alert');
        }
      }

      if (confirmSent) {
        // Stamp Date_Application_Sent so dedup filter excludes this deal on next run
        const today = new Date().toISOString().split('T')[0];
        await crm.records.update('Deals', [{ id: deal.id, Date_Application_Sent: today }]);
        results.processed++;
      }
    } catch (err) {
      logger.error({ dealId: deal.id, err: err.message }, 'Application confirmation failed for record');
      results.errors++;
    }
  }

  logger.info({ ...results, durationMs: Date.now() - start }, 'Send Application Confirmation job complete');
  return results;
}
