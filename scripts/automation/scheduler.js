// scripts/automation/scheduler.js
// Runs all automation jobs daily at 8:00 AM local time.
// Keep this process running in the background.
// Usage: node scripts/automation/scheduler.js

import { logger } from '../../src/utils/logger.js';
import { runAll } from './run-all.js';

function msUntilNextRun(hour = 8) {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next - now;
}

function formatMs(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

async function scheduleNext() {
  const delay = msUntilNextRun(8);
  const nextRun = new Date(Date.now() + delay);

  logger.info({ nextRun: nextRun.toISOString(), in: formatMs(delay) }, 'Next automation run scheduled');
  console.log(`Scheduler active. Next run: ${nextRun.toLocaleString()} (in ${formatMs(delay)})`);

  setTimeout(async () => {
    logger.info('Scheduled automation run starting');
    try {
      await runAll();
    } catch (err) {
      logger.error({ err: err.message }, 'Scheduled run failed');
    }
    scheduleNext();
  }, delay);
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Scheduler stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Scheduler stopped');
  process.exit(0);
});

logger.info('Automation scheduler started');
scheduleNext();
