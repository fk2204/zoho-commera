// scripts/setup-oauth.js
// One-time OAuth bootstrap. Exchanges an auth code for a refresh token.
//
// Usage:
//   npm run setup:oauth              -> CORE scopes (CRM, Mail, WorkDrive, Cliq, Sign)
//   npm run setup:oauth -- --minimal -> just CRM + profile
//   npm run setup:oauth -- --full    -> all apps the framework supports

import readline from 'node:readline/promises';
import { stdin, stdout, argv } from 'node:process';
import { exchangeCodeForRefreshToken } from '../src/auth/oauth.js';
import {
  MINIMAL_SCOPES, MINIMAL_SCOPES_STRING,
  CORE_SCOPES, CORE_SCOPES_STRING,
  FULL_SCOPES, FULL_SCOPES_STRING,
} from '../src/auth/scopes.js';
import { config } from '../src/config.js';

let preset, scopes, scopesString;
if (argv.includes('--minimal')) {
  preset = 'MINIMAL'; scopes = MINIMAL_SCOPES; scopesString = MINIMAL_SCOPES_STRING;
} else if (argv.includes('--full')) {
  preset = 'FULL'; scopes = FULL_SCOPES; scopesString = FULL_SCOPES_STRING;
} else {
  preset = 'CORE'; scopes = CORE_SCOPES; scopesString = CORE_SCOPES_STRING;
}

console.log(`
═══════════════════════════════════════════════════════════════
  Zoho OAuth Setup — ${preset} (${scopes.length} scopes)
═══════════════════════════════════════════════════════════════

This is a one-time setup. It exchanges a short-lived auth code
for a long-lived refresh token, stored at:

  ${config.tokenStorePath}

Presets:
  --minimal  CRM + profile only
  --core     CRM, Mail, WorkDrive, Cliq, Sign  (default)
  --full     Adds Books, Desk, Projects, People, Inventory, Campaigns

Steps:
  1. Go to https://api-console.zoho.com
  2. Open your Self Client → "Generate Code" tab
  3. Paste these scopes EXACTLY into the Scope field:

${formatScopes(scopesString)}

  4. Set Time Duration to 10 minutes, click Create
  5. Copy the code and paste it below

If consent fails because you don't have certain apps in your plan,
retry with --minimal and add scopes piecemeal as you enable apps.

═══════════════════════════════════════════════════════════════
`);

const rl = readline.createInterface({ input: stdin, output: stdout });
const code = (await rl.question('Paste your auth code: ')).trim();
rl.close();

if (!code) {
  console.error('No code provided. Aborting.');
  process.exit(1);
}

try {
  const { refreshToken } = await exchangeCodeForRefreshToken(code, scopes);
  console.log(`
✓ Success! Refresh token saved to ${config.tokenStorePath}
✓ Scoped to: ${scopes.length} scopes (${preset})
✓ File mode: 0600 (user read/write only)

Next:  npm run test:connection
`);
  void refreshToken;
} catch (err) {
  console.error(`
✗ Setup failed: ${err.message}

Common causes:
  • Code expired (only valid 3-10 min — generate a new one)
  • Code already used (codes are single-use)
  • Wrong client ID/secret in .env
  • Scope rejected — try --minimal and add scopes later
  • Wrong DC — pinned to US: ${config.accountsDomain}
`);
  if (err.response) console.error('Response:', JSON.stringify(err.response, null, 2));
  process.exit(1);
}

function formatScopes(s) {
  const lines = [];
  let line = '     ';
  for (const part of s.split(',')) {
    if (line.length + part.length + 1 > 70) {
      lines.push(line);
      line = '     ';
    }
    line += (line === '     ' ? '' : ',') + part;
  }
  if (line.trim()) lines.push(line);
  return lines.join('\n');
}
