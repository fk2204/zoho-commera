// src/books/index.js
// Zoho Books API v3 — accounting.
//
// Notes:
//   - Lives under www.zohoapis.com/books/v3
//   - Requires `organization_id` query param on every call
//
// Docs: https://www.zoho.com/books/api/v3/

import { createAppClient } from '../client.js';
import { BASE_URLS, API_PATHS, getOrgId, config } from '../config.js';
import { auditLogger } from '../utils/logger.js';
import { confirm } from '../utils/confirm.js';

const booksClient = createAppClient({
  baseUrl: `${BASE_URLS.api}${API_PATHS.books}`,  // https://www.zohoapis.com/books/v3
  defaultQuery: () => ({ organization_id: getOrgId('books') }),
});

// ============================================================================
// Invoices
// ============================================================================

export async function listInvoices(opts = {}) {
  return await booksClient.request('/invoices', {
    query: {
      page: opts.page ?? 1,
      per_page: opts.perPage ?? 200,
      ...(opts.filter || {}),
    },
  });
}

export async function getInvoice(invoiceId) {
  const result = await booksClient.request(`/invoices/${invoiceId}`);
  return result?.invoice ?? null;
}

export async function createInvoice(invoice) {
  if (config.dryRun) {
    auditLogger.info({ op: 'books.createInvoice', dryRun: true });
    return { status: 'dry-run' };
  }
  const result = await booksClient.request('/invoices', {
    method: 'POST', body: invoice,
  });
  auditLogger.info({ op: 'books.createInvoice', customer: invoice.customer_id });
  return result?.invoice;
}

export async function markInvoiceSent(invoiceId) {
  return await booksClient.request(`/invoices/${invoiceId}/status/sent`, {
    method: 'POST',
  });
}

export async function emailInvoice(invoiceId, body = {}) {
  return await booksClient.request(`/invoices/${invoiceId}/email`, {
    method: 'POST', body,
  });
}

// ============================================================================
// Contacts (customers + vendors)
// ============================================================================

export async function listContacts(opts = {}) {
  return await booksClient.request('/contacts', {
    query: {
      page: opts.page ?? 1,
      per_page: opts.perPage ?? 200,
      ...(opts.filter || {}),
    },
  });
}

export async function getContact(contactId) {
  const result = await booksClient.request(`/contacts/${contactId}`);
  return result?.contact ?? null;
}

export async function createContact(contact) {
  if (config.dryRun) {
    auditLogger.info({ op: 'books.createContact', dryRun: true });
    return { status: 'dry-run' };
  }
  const result = await booksClient.request('/contacts', {
    method: 'POST', body: contact,
  });
  auditLogger.info({ op: 'books.createContact', name: contact.contact_name });
  return result?.contact;
}

// ============================================================================
// Items (products/services)
// ============================================================================

export async function listItems(opts = {}) {
  return await booksClient.request('/items', {
    query: {
      page: opts.page ?? 1,
      per_page: opts.perPage ?? 200,
    },
  });
}

// ============================================================================
// Bills (vendor bills)
// ============================================================================

export async function listBills(opts = {}) {
  return await booksClient.request('/bills', {
    query: {
      page: opts.page ?? 1,
      per_page: opts.perPage ?? 200,
    },
  });
}

// ============================================================================
// Expenses
// ============================================================================

export async function listExpenses(opts = {}) {
  return await booksClient.request('/expenses', {
    query: {
      page: opts.page ?? 1,
      per_page: opts.perPage ?? 200,
    },
  });
}

export async function createExpense(expense) {
  if (config.dryRun) {
    auditLogger.info({ op: 'books.createExpense', dryRun: true });
    return { status: 'dry-run' };
  }
  const result = await booksClient.request('/expenses', {
    method: 'POST', body: expense,
  });
  auditLogger.info({ op: 'books.createExpense' });
  return result?.expense;
}
