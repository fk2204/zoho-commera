// src/crm/bulk.js
// Bulk Read API (v8) for >100 records.
//
// Flow:
//   1. POST /bulk/v8/read       → create job, get id
//   2. GET  /bulk/v8/read/{id}  → poll until status = COMPLETED
//   3. GET  /bulk/v8/read/{id}/result → download zipped CSV

import { createAppClient } from '../client.js';
import { BASE_URLS } from '../config.js';
import { logger } from '../utils/logger.js';
import { ZohoError } from '../utils/errors.js';
import { getAccessToken } from '../auth/oauth.js';

// Bulk lives at /crm/bulk/v8 (sibling path to /crm/v8)
const bulkClient = createAppClient({
  baseUrl: `${BASE_URLS.api}/crm/bulk/v8`,
});

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Run a bulk read job end-to-end. Returns the unzipped CSV text.
 *
 * @param {string} module
 * @param {object} [opts]
 * @param {string[]} [opts.fields]
 * @param {object} [opts.criteria]
 * @param {number} [opts.page=1]
 * @returns {Promise<string>}
 */
export async function bulkRead(module, opts = {}) {
  const job = {
    query: {
      module: { api_name: module },
      page: opts.page ?? 1,
    },
  };
  if (opts.fields?.length) job.query.fields = opts.fields;
  if (opts.criteria) job.query.criteria = opts.criteria;

  logger.info({ module }, 'Creating bulk read job');
  const created = await bulkClient.request('/read', { method: 'POST', body: job });
  const jobId = created?.data?.[0]?.details?.id;
  if (!jobId) {
    throw new ZohoError('Bulk job did not return a job ID', { response: created });
  }
  logger.info({ jobId }, 'Bulk job created, polling');

  const start = Date.now();
  while (true) {
    if (Date.now() - start > POLL_TIMEOUT_MS) {
      throw new ZohoError(`Bulk job ${jobId} timed out after 30 min`);
    }
    await sleep(POLL_INTERVAL_MS);
    const status = await bulkClient.request(`/read/${jobId}`);
    const state = status?.data?.[0]?.state;
    logger.debug({ jobId, state }, 'Bulk status');
    if (state === 'COMPLETED') break;
    if (state === 'FAILED') {
      throw new ZohoError(`Bulk job ${jobId} failed`, { response: status });
    }
  }

  // Download is binary, so we use raw fetch
  const token = await getAccessToken();
  const url = `${BASE_URLS.api}/crm/bulk/v8/read/${jobId}/result`;
  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  if (!res.ok) throw new ZohoError(`Failed to download bulk result: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return await unzipFirstCsv(buf);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function unzipFirstCsv(buf) {
  try {
    const { default: unzipper } = await import('unzipper');
    const directory = await unzipper.Open.buffer(buf);
    const csvFile = directory.files.find((f) => f.path.endsWith('.csv'));
    if (!csvFile) throw new ZohoError('Bulk result ZIP contained no CSV');
    const content = await csvFile.buffer();
    return content.toString('utf8');
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      throw new ZohoError(
        'Bulk read requires the `unzipper` package: npm i unzipper'
      );
    }
    throw err;
  }
}
