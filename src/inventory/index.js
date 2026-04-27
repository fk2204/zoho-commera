// src/inventory/index.js
// Zoho Inventory API v1.
//
// Notes:
//   - Under www.zohoapis.com/inventory/v1
//   - Requires `organization_id` query param

import { createAppClient } from '../client.js';
import { BASE_URLS, API_PATHS, getOrgId, config } from '../config.js';
import { auditLogger } from '../utils/logger.js';

const invClient = createAppClient({
  baseUrl: `${BASE_URLS.api}${API_PATHS.inventory}`,
  defaultQuery: () => ({ organization_id: getOrgId('inventory') }),
});

export async function listItems(opts = {}) {
  return await invClient.request('/items', {
    query: { page: opts.page ?? 1, per_page: opts.perPage ?? 200 },
  });
}

export async function getItem(itemId) {
  const result = await invClient.request(`/items/${itemId}`);
  return result?.item ?? null;
}

export async function adjustStock(itemId, adjustment) {
  if (config.dryRun) {
    auditLogger.info({ op: 'inventory.adjustStock', itemId, dryRun: true });
    return { status: 'dry-run' };
  }
  const result = await invClient.request('/inventoryadjustments', {
    method: 'POST',
    body: { line_items: [{ item_id: itemId, ...adjustment }] },
  });
  auditLogger.info({ op: 'inventory.adjustStock', itemId });
  return result;
}

export async function listSalesOrders(opts = {}) {
  return await invClient.request('/salesorders', {
    query: { page: opts.page ?? 1, per_page: opts.perPage ?? 200 },
  });
}

export async function getSalesOrder(orderId) {
  const result = await invClient.request(`/salesorders/${orderId}`);
  return result?.salesorder ?? null;
}

export async function listContacts(opts = {}) {
  return await invClient.request('/contacts', {
    query: { page: opts.page ?? 1, per_page: opts.perPage ?? 200 },
  });
}
