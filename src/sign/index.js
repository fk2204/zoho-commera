// src/sign/index.js
// Zoho Sign API v1 — e-signatures.
//
// Notes:
//   - Lives on sign.zoho.com (NOT www.zohoapis.com)
//   - Document creation uses multipart/form-data; helper here uses JSON for
//     metadata operations. For actual file upload, see uploadDocument().
//
// Docs: https://www.zoho.com/sign/api/

import { createAppClient } from '../client.js';
import { BASE_URLS, config } from '../config.js';
import { auditLogger } from '../utils/logger.js';
import { getAccessToken } from '../auth/oauth.js';

const signClient = createAppClient({
  baseUrl: BASE_URLS.sign,  // https://sign.zoho.com/api/v1
});

export async function listDocuments(opts = {}) {
  return await signClient.request('/requests', {
    query: { page_context: JSON.stringify({
      row_count: opts.perPage ?? 100,
      start_index: opts.startIndex ?? 1,
    })},
  });
}

export async function getDocument(requestId) {
  return await signClient.request(`/requests/${requestId}`);
}

/** List templates. */
export async function listTemplates() {
  return await signClient.request('/templates');
}

/**
 * Send a document for signature using a template. Quick path —
 * for ad-hoc documents, use uploadDocument() to upload a PDF first.
 */
export async function sendFromTemplate(templateId, data) {
  if (config.dryRun) {
    auditLogger.info({ op: 'sign.sendFromTemplate', templateId, dryRun: true });
    return { status: 'dry-run' };
  }
  const result = await signClient.request(`/templates/${templateId}/createdocument`, {
    method: 'POST', body: data,
  });
  auditLogger.info({ op: 'sign.sendFromTemplate', templateId });
  return result;
}

/**
 * Upload a PDF and create a sign request. Uses multipart/form-data,
 * which our generic client doesn't handle, so we go raw here.
 */
export async function uploadDocument(pdfBuffer, fileName, requestData) {
  const token = await getAccessToken();
  const form = new FormData();
  form.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), fileName);
  form.append('data', JSON.stringify(requestData));

  const res = await fetch(`${BASE_URLS.sign}/requests`, {
    method: 'POST',
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Sign upload failed: ${res.status}`);
  auditLogger.info({ op: 'sign.uploadDocument', fileName });
  return await res.json();
}
