// scripts/automation/run-all.js
// Runs all automation jobs in sequence. Each job is independent — one failing does not stop the rest.
// Usage:
//   node scripts/automation/run-all.js              (live run)
//   DRY_RUN=true node scripts/automation/run-all.js (dry run — no writes)

import { logger } from '../../src/utils/logger.js';
import { markJobComplete } from './state.js';
import { run as sendApplicationConfirmation } from './jobs/send-application-confirmation.js';
import { run as leadScore } from './jobs/lead-score.js';
import { run as tibBand } from './jobs/tib-band.js';
import { run as payback } from './jobs/payback.js';
import { run as commission } from './jobs/commission.js';
import { run as createFunding } from './jobs/create-funding.js';
import { run as createRenewal } from './jobs/create-renewal.js';
import { run as renewalCheck } from './jobs/renewal-check.js';
import { run as daysToFund } from './jobs/days-to-fund.js';
import { run as matchLenders } from './jobs/match-lenders.js';
import { run as leadAssign } from './jobs/lead-assign.js';

const JOBS = [
  { name: 'sendApplicationConfirmation', fn: sendApplicationConfirmation, stateKey: 'sendApplicationConfirmation' },
  // { name: 'leadScore',     fn: leadScore,     stateKey: 'leadScore' }, // DISABLED: Lead_Scores field is write-protected (Scoring Rules not available in Professional edition)
  { name: 'tibBand',       fn: tibBand,       stateKey: 'tibBand' },
  { name: 'payback',       fn: payback,       stateKey: 'payback' },
  { name: 'commission',    fn: commission,    stateKey: 'commission' },
  { name: 'matchLenders',  fn: matchLenders,  stateKey: 'matchLenders' },
  { name: 'createFunding', fn: createFunding, stateKey: 'createFunding' },
  { name: 'createRenewal', fn: createRenewal, stateKey: 'createRenewal' },
  { name: 'renewalCheck',  fn: renewalCheck,  stateKey: 'renewalCheck' },
  { name: 'daysToFund',    fn: daysToFund,    stateKey: 'daysToFund' },
  { name: 'leadAssign',    fn: leadAssign,    stateKey: 'leadAssignIndex' },
];

export async function runAll() {
  const runStart = Date.now();
  const dryRun = process.env.DRY_RUN === 'true';
  const summary = {};

  logger.info({ dryRun, jobs: JOBS.map(j => j.name) }, '=== Automation run started ===');

  for (const job of JOBS) {
    logger.info({ job: job.name }, `--- Running: ${job.name} ---`);
    try {
      const result = await job.fn();
      summary[job.name] = { status: 'ok', ...result };
      if (!dryRun) markJobComplete(job.stateKey);
    } catch (err) {
      logger.error({ job: job.name, err: err.message }, `Job ${job.name} failed entirely`);
      summary[job.name] = { status: 'failed', error: err.message };
    }
  }

  const totalMs = Date.now() - runStart;

  logger.info({ summary, totalMs }, '=== Automation run complete ===');

  // Print human-readable summary
  console.log('\n========== RUN SUMMARY ==========');
  for (const [job, result] of Object.entries(summary)) {
    if (result.status === 'failed') {
      console.log(`  ${job}: FAILED — ${result.error}`);
    } else {
      console.log(`  ${job}: ${result.processed} updated, ${result.skipped} skipped, ${result.errors} errors`);
    }
  }
  console.log(`  Total time: ${(totalMs / 1000).toFixed(1)}s`);
  console.log('==================================\n');

  return summary;
}

// Run directly when called as a script
runAll().catch(err => {
  logger.error({ err: err.message }, 'Fatal error in run-all');
  process.exit(1);
});
