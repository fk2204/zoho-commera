// src/auth/oauth.js
// Zoho OAuth 2.0. ONE refresh token works across ALL Zoho One apps,
// provided you authorized the right scopes at setup time.
//
// - exchangeCodeForRefreshToken(): one-time, called by scripts/setup-oauth.js
// - getAccessToken(): hot path — caches in memory, single-flight refresh

import { config } from '../config.js';
import { readTokens, writeTokens } from './tokenStore.js';
import { logger } from '../utils/logger.js';
import { ZohoAuthError } from '../utils/errors.js';

/** @type {{ token: string, expiresAt: number } | null} */
let cachedAccessToken = null;

/** @type {Promise<string> | null} */
let refreshInFlight = null;

/**
 * Exchange a one-time auth code (from Zoho API console "Generate Code") for a
 * long-lived refresh token. Stores the token via tokenStore.
 *
 * @param {string} code
 * @param {string[]} scopes
 * @returns {Promise<{ refreshToken: string, accessToken: string }>}
 */
export async function exchangeCodeForRefreshToken(code, scopes) {
  const url = new URL(`${config.accountsDomain}/oauth/v2/token`);
  url.searchParams.set('grant_type', 'authorization_code');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('client_secret', config.clientSecret);
  url.searchParams.set('code', code);

  const res = await fetch(url, { method: 'POST' });
  const body = await res.json();

  if (!res.ok || body.error) {
    throw new ZohoAuthError(
      `Failed to exchange code: ${body.error || res.status}`,
      { response: body }
    );
  }
  if (!body.refresh_token) {
    throw new ZohoAuthError(
      'Response missing refresh_token. Code may be expired or already used.',
      { response: body }
    );
  }

  await writeTokens({
    refreshToken: body.refresh_token,
    scopes,
    createdAt: new Date().toISOString(),
  });

  cachedAccessToken = {
    token: body.access_token,
    expiresAt: Date.now() + (body.expires_in - 60) * 1000,
  };

  return {
    refreshToken: body.refresh_token,
    accessToken: body.access_token,
  };
}

/**
 * Get a valid access token. Refreshes if expired. Safe to call concurrently.
 * @returns {Promise<string>}
 */
export async function getAccessToken() {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/** Force-invalidate cached access token. Called by HTTP client on 401. */
export function invalidateAccessToken() {
  cachedAccessToken = null;
}

async function doRefresh() {
  const stored = await readTokens();
  if (!stored?.refreshToken) {
    throw new ZohoAuthError(
      'No refresh token found. Run `npm run setup:oauth` first.'
    );
  }

  const url = new URL(`${config.accountsDomain}/oauth/v2/token`);
  url.searchParams.set('grant_type', 'refresh_token');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('client_secret', config.clientSecret);
  url.searchParams.set('refresh_token', stored.refreshToken);

  logger.debug('Refreshing access token');
  const res = await fetch(url, { method: 'POST' });
  const body = await res.json();

  if (!res.ok || body.error) {
    throw new ZohoAuthError(
      `Token refresh failed: ${body.error || res.status}. ` +
      `If revoked, re-run \`npm run setup:oauth\`.`,
      { response: body }
    );
  }

  cachedAccessToken = {
    token: body.access_token,
    expiresAt: Date.now() + (body.expires_in - 60) * 1000,
  };
  logger.debug({ expiresIn: body.expires_in }, 'Access token refreshed');
  return cachedAccessToken.token;
}
