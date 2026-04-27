// src/mail/index.js
// Zoho Mail API.
//
// Notes:
//   - Lives on mail.zoho.com
//   - Most calls are scoped to an account ID — fetch your default with getAccounts()
//
// Docs: https://www.zoho.com/mail/help/api/

import { createAppClient } from '../client.js';
import { BASE_URLS, config } from '../config.js';
import { auditLogger } from '../utils/logger.js';

const mailClient = createAppClient({
  baseUrl: BASE_URLS.mail,  // https://mail.zoho.com/api
});

/** List Mail accounts the user has access to. */
export async function getAccounts() {
  return await mailClient.request('/accounts');
}

/** Send an email. accountId from getAccounts(). */
export async function sendEmail(accountId, { to, subject, content, cc, bcc, attachments } = {}) {
  if (config.dryRun) {
    auditLogger.info({ op: 'mail.send', to, subject, dryRun: true });
    return { status: 'dry-run' };
  }
  const body = {
    fromAddress: undefined,  // defaults to account's primary
    toAddress: to,
    ccAddress: cc,
    bccAddress: bcc,
    subject,
    content,
    mailFormat: 'html',
    askReceipt: 'no',
    attachments,
  };
  const result = await mailClient.request(`/accounts/${accountId}/messages`, {
    method: 'POST', body,
  });
  auditLogger.info({ op: 'mail.send', to, subject });
  return result;
}

/** Search messages. */
export async function searchMessages(accountId, opts = {}) {
  return await mailClient.request(`/accounts/${accountId}/messages/view`, {
    query: {
      limit: opts.limit ?? 50,
      start: opts.start ?? 1,
      ...(opts.search ? { searchKey: opts.search } : {}),
    },
  });
}

/** List folders for an account. */
export async function listFolders(accountId) {
  return await mailClient.request(`/accounts/${accountId}/folders`);
}
