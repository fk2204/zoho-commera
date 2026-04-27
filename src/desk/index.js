// src/desk/index.js
// Zoho Desk API v1 — customer support.
//
// Notes:
//   - Lives on desk.zoho.com (NOT www.zohoapis.com)
//   - Requires `orgId` header on every call
//
// Docs: https://desk.zoho.com/DeskAPIDocument

import { createAppClient } from '../client.js';
import { BASE_URLS, getOrgId, config } from '../config.js';
import { auditLogger } from '../utils/logger.js';

const deskClient = createAppClient({
  baseUrl: BASE_URLS.desk,  // https://desk.zoho.com/api/v1
  defaultHeaders: () => ({ orgId: getOrgId('desk') }),
});

// ============================================================================
// Tickets
// ============================================================================

/** List tickets. Supports many filters; see Desk docs. */
export async function listTickets(opts = {}) {
  return await deskClient.request('/tickets', {
    query: {
      from: opts.from ?? 0,
      limit: opts.limit ?? 100,   // Desk default 10, max 100
      ...(opts.filter || {}),
    },
  });
}

export async function getTicket(ticketId) {
  return await deskClient.request(`/tickets/${ticketId}`);
}

export async function createTicket(ticket) {
  if (config.dryRun) {
    auditLogger.info({ op: 'desk.createTicket', dryRun: true });
    return { status: 'dry-run' };
  }
  const result = await deskClient.request('/tickets', {
    method: 'POST', body: ticket,
  });
  auditLogger.info({ op: 'desk.createTicket', subject: ticket.subject });
  return result;
}

export async function updateTicket(ticketId, patch) {
  if (config.dryRun) {
    auditLogger.info({ op: 'desk.updateTicket', ticketId, dryRun: true });
    return { status: 'dry-run' };
  }
  const result = await deskClient.request(`/tickets/${ticketId}`, {
    method: 'PATCH', body: patch,
  });
  auditLogger.info({ op: 'desk.updateTicket', ticketId });
  return result;
}

/** Close a ticket. */
export async function closeTicket(ticketId) {
  return await updateTicket(ticketId, { status: 'Closed' });
}

/** Add a comment to a ticket. */
export async function addComment(ticketId, content, isPublic = false) {
  return await deskClient.request(`/tickets/${ticketId}/comments`, {
    method: 'POST',
    body: { content, isPublic, contentType: 'plainText' },
  });
}

// ============================================================================
// Contacts
// ============================================================================

export async function listContacts(opts = {}) {
  return await deskClient.request('/contacts', {
    query: { from: opts.from ?? 0, limit: opts.limit ?? 100 },
  });
}

export async function searchTickets(opts) {
  return await deskClient.request('/tickets/search', {
    query: opts,
  });
}

// ============================================================================
// Departments / Agents
// ============================================================================

export async function listDepartments() {
  return await deskClient.request('/departments');
}

export async function listAgents() {
  return await deskClient.request('/agents');
}
