// src/campaigns/index.js
// Zoho Campaigns API v1.1 — email marketing.
//
// Notes:
//   - Lives on campaigns.zoho.com
//   - Most read endpoints accept resfmt=JSON for clean JSON output
//
// Docs: https://www.zoho.com/campaigns/help/developers/

import { createAppClient } from '../client.js';
import { BASE_URLS, config } from '../config.js';
import { auditLogger } from '../utils/logger.js';

const campaignsClient = createAppClient({
  baseUrl: BASE_URLS.campaigns,  // https://campaigns.zoho.com/api/v1.1
  defaultQuery: { resfmt: 'JSON' },
});

/** List recent campaigns. */
export async function listCampaigns(opts = {}) {
  return await campaignsClient.request('/getcampaigns', {
    query: {
      range: opts.range ?? 100,
      fromindex: opts.fromIndex ?? 1,
      ...(opts.status ? { status: opts.status } : {}),
    },
  });
}

/** Get details on one campaign by key. */
export async function getCampaign(campaignKey) {
  return await campaignsClient.request('/recentcampaigns', {
    query: { campaignkey: campaignKey },
  });
}

/** Send a campaign immediately. */
export async function sendCampaign(campaignKey) {
  if (config.dryRun) {
    auditLogger.info({ op: 'campaigns.send', campaignKey, dryRun: true });
    return { status: 'dry-run' };
  }
  const result = await campaignsClient.request('/sendcampaign', {
    method: 'POST',
    query: { campaignkey: campaignKey },
  });
  auditLogger.info({ op: 'campaigns.send', campaignKey });
  return result;
}

/** List mailing lists. */
export async function listMailingLists(opts = {}) {
  return await campaignsClient.request('/getmailinglists', {
    query: { range: opts.range ?? 100, fromindex: opts.fromIndex ?? 1 },
  });
}

/** Add subscriber(s) to a list. */
export async function addSubscribers(listKey, contactInfo) {
  if (config.dryRun) {
    auditLogger.info({ op: 'campaigns.addSubscribers', listKey, dryRun: true });
    return { status: 'dry-run' };
  }
  const result = await campaignsClient.request('/json/listsubscribe', {
    method: 'POST',
    query: { listkey: listKey, contactinfo: JSON.stringify(contactInfo) },
  });
  auditLogger.info({ op: 'campaigns.addSubscribers', listKey });
  return result;
}
