// src/utils/confirm.js
// Interactive y/N confirmation. Bypassable via --yes or CONFIRM=yes.

import readline from 'node:readline/promises';
import { stdin, stdout, argv, env } from 'node:process';

/**
 * @param {string} message
 * @param {object} [opts]
 * @param {boolean} [opts.defaultYes=false]
 * @returns {Promise<boolean>}
 */
export async function confirm(message, { defaultYes = false } = {}) {
  if (argv.includes('--yes') || argv.includes('-y')) return true;
  if (env.CONFIRM === 'yes') return true;

  if (!stdin.isTTY) {
    throw new Error(
      `Cannot prompt for confirmation in non-interactive context. ` +
      `Pass --yes to skip the prompt for: ${message}`
    );
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });
  const suffix = defaultYes ? '[Y/n]' : '[y/N]';
  try {
    const answer = (await rl.question(`${message} ${suffix} `)).trim().toLowerCase();
    if (answer === '') return defaultYes;
    return answer === 'y' || answer === 'yes';
  } finally {
    rl.close();
  }
}
