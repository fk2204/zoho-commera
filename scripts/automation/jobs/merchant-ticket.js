// scripts/automation/jobs/merchant-ticket.js
// Creates a Desk ticket for every Deal in ("New", "Contacted / Discovery")
// that doesn't have one yet. Idempotency: checks Desk_Ticket_ID field.
// Ticket is sent to merchant email with welcome message.

import * as crm from '../../../src/crm/index.js';
import * as desk from '../../../src/desk/index.js';
import { logger, auditLogger } from '../../../src/utils/logger.js';
import { config } from '../../../src/config.js';

export async function run() {
  const start = Date.now();
  const results = { processed: 0, skipped: 0, errors: 0 };

  // Get all Deals in ("New", "Contacted / Discovery") with idempotency check
  const deals = await crm.coql.queryAll(
    `SELECT id, Deal_Name, Contact_Name, Stage, Desk_Ticket_ID
     FROM Deals
     WHERE Stage IN ('New', 'Contacted / Discovery')
     LIMIT 200`
  );

  logger.info({ job: 'merchantTicket', queried: deals.length }, 'Job started');

  // Fetch departments once at job start to get deptId for all tickets
  let departmentId = null;
  try {
    const deptResponse = await desk.listDepartments();
    if (deptResponse?.data && Array.isArray(deptResponse.data) && deptResponse.data.length > 0) {
      departmentId = deptResponse.data[0].id;
      logger.debug({ departmentId }, 'Fetched department ID from Desk');
    } else {
      logger.warn({}, 'No departments found in Desk — cannot create tickets');
      return results;
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to fetch departments from Desk');
    return results;
  }

  // Filter deals that don't have a ticket yet
  const dealsNeedingTickets = deals.filter(d => !d.Desk_Ticket_ID);

  for (const deal of dealsNeedingTickets) {
    try {
      // Skip if we can't get contact info
      if (!deal.Contact_Name?.id) {
        logger.debug({ dealId: deal.id, Deal_Name: deal.Deal_Name }, 'No contact — skipping');
        results.skipped++;
        continue;
      }

      // Fetch contact to get email
      const contact = await crm.records.getById('Contacts', deal.Contact_Name.id, {
        fields: ['id', 'First_Name', 'Last_Name', 'Email', 'Phone'],
      });

      if (!contact?.Email) {
        logger.warn({ dealId: deal.id, Deal_Name: deal.Deal_Name }, 'No email on contact — skipping');
        results.skipped++;
        continue;
      }

      const merchantName = `${contact.First_Name || ''} ${contact.Last_Name || ''}`.trim() || 'Merchant';

      const ticketData = {
        subject: `Welcome to Commera Funding — ${deal.Deal_Name}`,
        description: `Welcome to Commera Funding, ${merchantName}!\n\nWe're excited to help you explore merchant cash advance options for your business. Our team will be reaching out shortly to discuss your funding needs.\n\nDeal Reference: ${deal.id}\n\nIf you have any questions, feel free to reach out.`,
        email: contact.Email,
        departmentId: departmentId,
        priority: 'Medium',
        status: 'Open',
        cf_crm_deal_id: deal.id,
      };

      if (config.dryRun) {
        logger.info(
          { dealId: deal.id, to: contact.Email, subject: ticketData.subject },
          '[DRY RUN] Would create merchant welcome ticket'
        );
        results.processed++;
        continue;
      }

      // Create the ticket in Desk
      const ticketResponse = await desk.createTicket(ticketData);
      const ticketId = ticketResponse?.id;

      if (!ticketId) {
        logger.error({ dealId: deal.id, response: ticketResponse }, 'Ticket created but no ID returned');
        results.errors++;
        continue;
      }

      logger.info(
        { dealId: deal.id, ticketId, Deal_Name: deal.Deal_Name, merchantEmail: contact.Email },
        'Merchant welcome ticket created'
      );

      // Stamp Desk_Ticket_ID on the Deal for idempotency
      await crm.records.update('Deals', [{ id: deal.id, Desk_Ticket_ID: ticketId }]);

      auditLogger.info({ op: 'merchantTicket', dealId: deal.id, ticketId });
      results.processed++;

    } catch (err) {
      logger.error({ dealId: deal.id, err: err.message }, 'Merchant ticket creation failed for record');
      results.errors++;
    }
  }

  logger.info({ ...results, durationMs: Date.now() - start }, 'Merchant Ticket job complete');
  return results;
}
