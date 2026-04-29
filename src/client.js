// src/client.js
// Generalized HTTP client. Different Zoho apps live on different domains
// (Commerce on commerce.zoho.com, Desk on desk.zoho.com, CRM on
// www.zohoapis.com, etc.) — this client takes any URL and handles auth,
// retry, and error parsing uniformly.
//
// App modules wrap this with their own base URL and default headers:
//
//   import { createAppClient } from './client.js';
//   const desk = createAppClient({
//     baseUrl: 'https://desk.zoho.com/api/v1',
//     defaultHeaders: () => ({ orgId: getOrgId('desk') }),
//   });
//   const tickets = await desk.request('/tickets');

import { getAccessToken, invalidateAccessToken } from './auth/oauth.js';
import { logger } from './utils/logger.js';
import { ZohoApiError, ZohoRateLimitError } from './utils/errors.js';

const MAX_RETRIES = 4;
const BASE_BACKOFF_MS = 500;

/**
 * Low-level fetch with auth, retry, backoff. Most callers should use
 * createAppClient() instead of calling this directly.
 *
 * @param {string} fullUrl - fully-qualified URL
 * @param {object} [opts]
 * @param {string} [opts.method='GET']
 * @param {Record<string, string|number>} [opts.query]
 * @param {any} [opts.body] - JSON-stringified
 * @param {Record<string, string>} [opts.headers]
 * @param {boolean} [opts._retried401]
 * @returns {Promise<any>}
 */
export async function zohoRequest(fullUrl, opts = {}) {
  const {
    method = 'GET',
    query,
    body,
    headers = {},
    _retried401 = false,
  } = opts;

  const url = new URL(fullUrl);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const token = await getAccessToken();
  const finalHeaders = {
    'Authorization': `Zoho-oauthtoken ${token}`,
    'Accept': 'application/json',
    ...headers,
  };
  if (body !== undefined && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.debug({ method, url: url.pathname, attempt }, 'API request');
      const reqController = new AbortController();
      const reqTimeoutId = setTimeout(() => reqController.abort(), 30_000);
      let res;
      try {
        res = await fetch(url, {
          method,
          headers: finalHeaders,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: reqController.signal,
        });
      } finally {
        clearTimeout(reqTimeoutId);
      }

      if (res.status === 204) return null;

      // 401: token expired/revoked — refresh once, retry once.
      if (res.status === 401 && !_retried401) {
        logger.warn('Got 401, invalidating token and retrying once');
        invalidateAccessToken();
        return zohoRequest(fullUrl, { ...opts, _retried401: true });
      }

      const text = await res.text();
      const parsed = text ? safeJson(text) : null;

      // Rate limit
      if (res.status === 429 || isRateLimitBody(parsed)) {
        const retryAfter = parseRetryAfter(res.headers.get('Retry-After'));
        if (attempt < MAX_RETRIES) {
          const delay = retryAfter ?? backoff(attempt);
          logger.warn({ delay, attempt }, 'Rate limited, backing off');
          await sleep(delay);
          continue;
        }
        throw new ZohoRateLimitError('Rate limit exceeded after retries', {
          status: res.status, response: parsed,
        });
      }

      // 5xx: retry with backoff
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        const delay = backoff(attempt);
        logger.warn({ status: res.status, delay, attempt }, 'Server error, retrying');
        await sleep(delay);
        continue;
      }

      if (!res.ok) {
        throw new ZohoApiError(
          `Zoho API error ${res.status}: ${extractErrorMessage(parsed)}`,
          { status: res.status, response: parsed }
        );
      }

      return parsed;
    } catch (err) {
      if (err instanceof ZohoApiError && !(err instanceof ZohoRateLimitError)) {
        throw err;
      }
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        const delay = backoff(attempt);
        logger.warn({ err: err.message, delay, attempt }, 'Request failed, retrying');
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/**
 * Create a client scoped to a specific Zoho app's base URL with optional
 * default headers (e.g. orgId for Desk, X-com-zoho-store-organizationid for
 * Commerce).
 *
 * @param {object} opts
 * @param {string} opts.baseUrl
 * @param {Record<string,string> | (() => Record<string,string>)} [opts.defaultHeaders]
 * @param {Record<string,string|number> | (() => Record<string,string|number>)} [opts.defaultQuery]
 */
export function createAppClient({ baseUrl, defaultHeaders, defaultQuery }) {
  const resolveDefaults = (val) =>
    typeof val === 'function' ? val() : (val || {});

  return {
    /**
     * @param {string} path - path starting with `/`
     * @param {object} [opts] - same as zohoRequest
     */
    request(path, opts = {}) {
      const url = `${baseUrl}${path}`;
      return zohoRequest(url, {
        ...opts,
        headers: { ...resolveDefaults(defaultHeaders), ...(opts.headers || {}) },
        query: { ...resolveDefaults(defaultQuery), ...(opts.query || {}) },
      });
    },
    baseUrl,
  };
}

// ---- Helpers ----

function backoff(attempt) {
  const base = BASE_BACKOFF_MS * Math.pow(2, attempt);
  return base + Math.floor(Math.random() * BASE_BACKOFF_MS);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function safeJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}

function parseRetryAfter(header) {
  if (!header) return null;
  const seconds = parseInt(header, 10);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const date = Date.parse(header);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return null;
}

function isRateLimitBody(body) {
  if (!body || typeof body !== 'object') return false;
  if (body.code === 'RATE_LIMIT_EXCEEDED' || body.code === 4820 || body.code === '4820') return true;
  return false;
}

function extractErrorMessage(body) {
  if (!body) return 'unknown';
  if (typeof body === 'string') return body;
  if (body.message) return body.code ? `${body.code}: ${body.message}` : body.message;
  if (Array.isArray(body.data)) {
    const first = body.data.find((d) => d.status === 'error') || body.data[0];
    if (first?.message) return `${first.code || 'error'}: ${first.message}`;
  }
  return JSON.stringify(body).slice(0, 500);
}
