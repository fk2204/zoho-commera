// scripts/automation/state.js
// Tracks last run time per job in .automation-state.json (gitignored).
// Used to query only records modified since the last run.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, '../../.automation-state.json');

const DEFAULT_STATE = {
  lastRun: null,
  jobs: {
    payback: null,
    commission: null,
    createFunding: null,
    createRenewal: null,
    renewalCheck: null,
    matchLenders: null,
  },
};

export function readState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return { ...DEFAULT_STATE };
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function getJobLastRun(jobName) {
  const state = readState();
  return state.jobs?.[jobName] ?? null;
}

export function markJobComplete(jobName) {
  const state = readState();
  if (!state.jobs) state.jobs = {};
  state.jobs[jobName] = new Date().toISOString();
  state.lastRun = new Date().toISOString();
  writeState(state);
}
