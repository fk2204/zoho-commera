// scripts/refresh-token.js
// Force a fresh access token. Useful for debugging.
// Run: npm run refresh-token

import { invalidateAccessToken, getAccessToken } from '../src/auth/oauth.js';

async function main() {
  invalidateAccessToken();
  console.log('→ Forcing token refresh...');
  const token = await getAccessToken();
  console.log(`✓ Got fresh access token (length=${token.length}, ends with ...${token.slice(-6)})`);
  console.log('  Token is in-memory only — not written to disk.');
}

main().catch((err) => {
  console.error('✗ Refresh failed:', err.message);
  if (err.response) console.error('Response:', JSON.stringify(err.response, null, 2));
  process.exit(1);
});
