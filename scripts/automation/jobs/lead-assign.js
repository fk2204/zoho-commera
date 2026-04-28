// scripts/automation/jobs/lead-assign.js
// Round-robin lead assignment to active sales reps.
// Currently solo — scales as team grows.

import * as crm from '../../../src/crm/index.js';
import { logger } from '../../../src/utils/logger.js';
import { config } from '../../../src/config.js';
import { getJobLastRun, markJobComplete } from '../state.js';

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
  const { data: unassignedLeads } = await crm.coql.query(
    `SELECT id, Last_Name, Owner
     FROM Leads
     WHERE Owner = '' OR Owner is null
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

      if (config.dryRun) {
        logger.info({ leadId: lead.id, Last_Name: lead.Last_Name, assignedTo: rep.full_name }, '[DRY RUN] Would assign lead');
        results.processed++;
        continue;
      }

      await crm.records.update('Leads', [{ id: lead.id, Owner: rep.id }]);
      logger.info({ leadId: lead.id, Last_Name: lead.Last_Name, assignedTo: rep.full_name }, 'Lead assigned');
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
