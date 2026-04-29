// scripts/automation/jobs/lead-assign.js
// Round-robin lead assignment to active sales reps.
// Currently solo — scales as team grows.

import * as crm from '../../../src/crm/index.js';
import { logger } from '../../../src/utils/logger.js';
import { config } from '../../../src/config.js';
import { getJobLastRun, markJobComplete } from '../state.js';
import { sendLeadAssigned } from '../../../src/mail/sender.js';
import * as cliq from '../../../src/cliq/index.js';

export async function run() {
  const start = Date.now();
  const results = { processed: 0, skipped: 0, errors: 0 };

  // Load all active users to find sales reps
  const users = await crm.users.listUsers('ActiveUsers');
  const reps = users.filter(u => {
    const role = u.role?.name || '';
    return role.includes('Sales Rep') || role.includes('Sales Manager');
  });

  if (reps.length === 0) {
    logger.warn('No sales reps found in system — skipping');
    return results;
  }

  logger.info({ reps: reps.length, repNames: reps.map(r => r.full_name) }, 'Sales reps loaded');

  // Get unassigned Leads (Owner not set or empty)
  const unassignedLeads = await crm.coql.queryAll(
    `SELECT id, Last_Name, First_Name, Amount, Owner, Phone, Email, Monthly_Revenue_USD, Industry, Time_in_Business_Months, State
     FROM Leads
     WHERE Owner is null
     LIMIT 200`
  );

  logger.info({ job: 'leadAssign', queried: unassignedLeads.length }, 'Job started');

  if (unassignedLeads.length === 0) {
    logger.info('No unassigned leads found');
    return results;
  }

  // Get last round-robin index from state
  let repIndex = parseInt(getJobLastRun('leadAssignIndex') || '0', 10) % reps.length;

  for (const lead of unassignedLeads) {
    try {
      const rep = reps[repIndex];
      repIndex = (repIndex + 1) % reps.length;

      const merchantName = `${lead.First_Name || ''} ${lead.Last_Name || ''}`.trim() || lead.Last_Name || 'Merchant';

      if (config.dryRun) {
        logger.info({ leadId: lead.id, merchantName, assignedTo: rep.full_name }, '[DRY RUN] Would assign lead');
        logger.info({ leadId: lead.id, repEmail: rep.email, merchantName }, '[DRY RUN] Would send lead assigned alert');
        results.processed++;
        continue;
      }

      await crm.records.update('Leads', [{ id: lead.id, Owner: rep.id }]);
      logger.info({ leadId: lead.id, merchantName, assignedTo: rep.full_name }, 'Lead assigned');

      // Notify the assigned rep via email
      if (rep.email) {
        try {
          await sendLeadAssigned(rep.email, rep.first_name || rep.full_name, merchantName, lead.Amount ?? 0, lead.Phone || null, lead.Email || null, lead.Monthly_Revenue_USD || null, lead.Industry || null, lead.Time_in_Business_Months || null, lead.State || null);
        } catch (err) {
          logger.warn({ leadId: lead.id, repEmail: rep.email, err: err.message }, 'Could not send lead assignment alert');
        }
      }

      // Post to ops channel
      try {
        const amount = lead.Amount ? `$${(lead.Amount).toLocaleString()}` : 'amount TBD';
        await cliq.postToChannel('ops-automation', `📌 **Lead Assigned** \n${merchantName} (${amount}) → ${rep.full_name}`);
      } catch (err) {
        logger.debug({ leadId: lead.id, err: err.message }, 'Could not post lead assignment to Cliq');
      }

      results.processed++;
    } catch (err) {
      logger.error({ leadId: lead.id, err: err.message }, 'Lead assign failed for record');
      results.errors++;
    }
  }

  // Persist round-robin index for next run
  markJobComplete('leadAssignIndex', String(repIndex));

  logger.info({ ...results, durationMs: Date.now() - start }, 'Lead Assign job complete');
  return results;
}
