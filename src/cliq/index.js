// src/cliq/index.js
// Zoho Cliq API v2 — team chat.
//
// Most useful pattern: send notifications from scripts. ("Run nightly sync,
// post results to #ops-bot.")
//
// Docs: https://www.zoho.com/cliq/help/restapi/v2/

import { createAppClient } from '../client.js';
import { BASE_URLS } from '../config.js';
import { auditLogger } from '../utils/logger.js';

const cliqClient = createAppClient({
  baseUrl: BASE_URLS.cliq,  // https://cliq.zoho.com/api/v2
});

// ============================================================================
// Messages
// ============================================================================

/**
 * Send a message to a channel (by unique name, e.g. "ops-bot").
 * @param {string} channelName - the @-name of the channel
 * @param {string|object} message - text, or rich message object with `text`/`card`/`buttons`
 */
export async function postToChannel(channelName, message) {
  const body = typeof message === 'string' ? { text: message } : message;
  const result = await cliqClient.request(
    `/channelsbyname/${encodeURIComponent(channelName)}/message`,
    { method: 'POST', body }
  );
  auditLogger.info({ op: 'cliq.postToChannel', channel: channelName });
  return result;
}

/**
 * Send a direct message to a user (by email or zuid).
 * @param {string} userIdOrEmail
 * @param {string|object} message
 */
export async function postToUser(userIdOrEmail, message) {
  const body = typeof message === 'string' ? { text: message } : message;
  const result = await cliqClient.request(
    `/buddies/${encodeURIComponent(userIdOrEmail)}/message`,
    { method: 'POST', body }
  );
  auditLogger.info({ op: 'cliq.postToUser', user: userIdOrEmail });
  return result;
}

// ============================================================================
// Channels
// ============================================================================

/** List channels you're a member of. */
export async function listChannels() {
  const result = await cliqClient.request('/channels');
  return result?.channels ?? [];
}

/** Get a channel by unique name. */
export async function getChannel(channelName) {
  const result = await cliqClient.request(
    `/channelsbyname/${encodeURIComponent(channelName)}`
  );
  return result;
}

// ============================================================================
// Users
// ============================================================================

/** List users in your org. */
export async function listUsers() {
  const result = await cliqClient.request('/users');
  return result?.users ?? [];
}

// ============================================================================
// Convenience: rich message helpers
// ============================================================================

/**
 * Build a rich card message. Handy for status reports.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} [opts.text]
 * @param {Array<{ label: string, value: string }>} [opts.fields]
 * @param {string} [opts.color]  - 'green' | 'red' | 'yellow' | 'blue'
 */
export function buildCard({ title, text, fields, color }) {
  const card = { title };
  if (text) card.text = text;
  if (color) card.theme = color;
  if (fields?.length) {
    card.slides = [{
      type: 'table',
      title: '',
      data: { headers: ['Field', 'Value'], rows: fields.map((f) => [f.label, f.value]) },
    }];
  }
  return { card };
}
