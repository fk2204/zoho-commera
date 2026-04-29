// scripts/automation/jobs/lead-score.js
// Scores all Leads using 11 categories / 43 criteria from spec.
// Score ranges: 90+=A+, 70-89=A, 50-69=B, 30-49=C, 10-29=D, <10=F.

import * as crm from '../../../src/crm/index.js';
import { logger } from '../../../src/utils/logger.js';
import { config } from '../../../src/config.js';

function calculateScore(lead) {
  let score = 0;

  // 1. Monthly Revenue (highest weight)
  const revenue = lead.Monthly_Revenue_USD || 0;
  if (revenue >= 100000) score += 40;
  else if (revenue >= 50000) score += 25;
  else if (revenue >= 30000) score += 15;
  else if (revenue >= 15000) score += 5;
  else if (revenue >= 10000) score += 0;
  else score -= 10;

  // 2. FICO Score
  const fico = lead.FICO_score || 0;
  if (fico >= 720) score += 25;
  else if (fico >= 680) score += 20;
  else if (fico >= 650) score += 15;
  else if (fico >= 600) score += 10;
  else if (fico >= 550) score += 5;
  else if (fico > 0) score -= 10;

  // 3. Time in Business (Months)
  const tib = lead.Time_in_Business_Months || 0;
  if (tib >= 24) score += 20;
  else if (tib >= 12) score += 10;
  else if (tib >= 6) score += 5;
  else if (tib >= 4) score += 0;
  else score -= 5;

  // 4. Existing MCA Positions
  const positions = lead.Existing_MCA_Positions || '';
  if (positions === '0 — Clean') score += 30;
  else if (positions === '1 — One position') score += 15;
  else if (positions === '2 — Two positions') score += 5;
  else if (positions === '3 — Three positions') score -= 10;
  else if (positions === '4+ — Stacked') score -= 20;

  // 5. Requested Amount
  const requested = lead.Requested_Amount || 0;
  if (requested >= 100000) score += 15;
  else if (requested >= 50000) score += 10;
  else if (requested >= 25000) score += 5;

  // 6. Industry (negative scoring)
  const industry = lead.Industry || '';
  if (industry.includes('RESTRICTED')) score -= 50;

  // 7. Lead Source (conversion probability)
  const source = lead.Lead_Source || '';
  if (source === 'Referral — Merchant') score += 20;
  else if (source === 'Referral — Partner') score += 15;
  else if (source === 'Website Form') score += 10;
  else if (source === 'Live Transfer') score += 10;
  else if (source === 'Google Ads') score += 5;
  else if (source === 'UCC List') score += 5;

  // 8. NSFs (Bank Health)
  const nsfs = lead.NSFs_Last_3_Months || 0;
  if (nsfs === 0) score += 10;
  else if (nsfs <= 3) score += 0;
  else if (nsfs <= 7) score -= 5;
  else if (nsfs <= 12) score -= 15;
  else score -= 25;

  // 9. Urgency (Buying Signal)
  const urgency = lead.Urgency || '';
  if (urgency === 'ASAP (24-48 hours)') score += 15;
  else if (urgency === 'This Week') score += 10;
  else if (urgency === 'Next 2 Weeks') score += 5;
  else if (urgency === 'This Month') score += 0;
  else if (urgency === 'Just Exploring') score -= 5;

  // 10. Negative Days (Bank Health) — field not available in Leads; skip this category
  // Note: Negative_Days_Last_3_Months exists on Accounts, not Leads

  // 11. Entity Type
  const entity = lead.Entity_type || '';
  if (entity === 'LLC' || entity === 'C-Corp' || entity === 'S-Corp') score += 5;
  else if (entity === 'Sole Proprietorship') score -= 5;

  return score;
}

export async function run() {
  const start = Date.now();
  const results = { processed: 0, skipped: 0, errors: 0 };

  const leads = await crm.coql.queryAll(
    `SELECT id, Last_Name, Lead_Status, Monthly_Revenue_USD, FICO_score,
            Time_in_Business_Months, Existing_MCA_Positions, Requested_Amount,
            Industry, Lead_Source, NSFs_Last_3_Months, Urgency,
            Entity_type, Lead_Scores
     FROM Leads
     WHERE Lead_Status != 'Do Not Contact'
     LIMIT 200`
  );

  logger.info({ job: 'leadScore', queried: leads.length }, 'Job started');

  for (const lead of leads) {
    try {
      const expected = calculateScore(lead);
      const current = lead.Lead_Scores || 0;

      if (current === expected) {
        results.skipped++;
        continue;
      }

      if (config.dryRun) {
        logger.info({ leadId: lead.id, Last_Name: lead.Last_Name, score: expected }, '[DRY RUN] Would set Lead_Scores');
        results.processed++;
        continue;
      }

      await crm.records.update('Leads', [{ id: lead.id, Lead_Scores: expected }]);
      logger.info({ leadId: lead.id, Last_Name: lead.Last_Name, score: expected }, 'Lead_Scores set');
      results.processed++;
    } catch (err) {
      logger.error({ leadId: lead.id, err: err.message }, 'Lead score failed for record');
      results.errors++;
    }
  }

  logger.info({ ...results, durationMs: Date.now() - start }, 'Lead Score job complete');
  return results;
}
