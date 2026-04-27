// src/crm/records.js
// Generic CRUD for any CRM module (Leads, Contacts, Deals, custom, ...).
// Targets CRM API v8.
//
// Usage:
//   import { listAll, getById, insert, update, remove } from './src/crm/records.js';
//   const leads = await listAll('Leads', { fields: ['id', 'Email', 'Last_Name'] });

import { crmClient } from './client.js';
import { config } from '../config.js';
import { auditLogger } from '../utils/logger.js';
import { confirm } from '../utils/confirm.js';
import { ZohoApiError } from '../utils/errors.js';

/**
 * List a single page of records.
 * @param {string} module
 * @param {object} [opts]
 * @param {string[]} [opts.fields]
 * @param {number} [opts.page=1]
 * @param {number} [opts.perPage=200]
 * @param {string} [opts.sortBy]
 * @param {'asc'|'desc'} [opts.sortOrder]
 * @param {string} [opts.modifiedSince] - ISO timestamp
 */
export async function list(module, opts = {}) {
  const query = {
    page: opts.page ?? 1,
    per_page: Math.min(opts.perPage ?? 200, 200),
  };
  if (opts.fields?.length) query.fields = opts.fields.join(',');
  if (opts.sortBy) query.sort_by = opts.sortBy;
  if (opts.sortOrder) query.sort_order = opts.sortOrder;

  const headers = {};
  if (opts.modifiedSince) headers['If-Modified-Since'] = opts.modifiedSince;

  const result = await crmClient.request(`/${module}`, { query, headers });
  if (!result) return { data: [], info: { more_records: false, page: 1, per_page: query.per_page } };
  return result;
}

/** Auto-paginate through all records. For large modules, prefer bulk.js. */
export async function listAll(module, opts = {}) {
  const all = [];
  let page = 1;
  while (true) {
    const result = await list(module, { ...opts, page });
    all.push(...(result.data || []));
    if (!result.info?.more_records) break;
    page++;
  }
  return all;
}

/**
 * Fetch a single record by ID.
 * @returns {Promise<any | null>}
 */
export async function getById(module, id, opts = {}) {
  try {
    const query = {};
    if (opts.fields?.length) query.fields = opts.fields.join(',');
    const result = await crmClient.request(`/${module}/${id}`, { query });
    return result?.data?.[0] ?? null;
  } catch (err) {
    if (err instanceof ZohoApiError && err.status === 404) return null;
    throw err;
  }
}

/** Insert records (max 100/call). */
export async function insert(module, records, opts = {}) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('insert() requires a non-empty array');
  }
  if (records.length > 100) {
    throw new Error('insert() supports max 100 records. Use bulk.js for larger batches.');
  }
  if (config.dryRun) {
    auditLogger.info({ op: 'insert', module, count: records.length, dryRun: true });
    return records.map(() => ({ status: 'dry-run' }));
  }
  const body = { data: records, trigger: opts.trigger };
  const result = await crmClient.request(`/${module}`, { method: 'POST', body });
  auditLogger.info({ op: 'insert', module, count: records.length });
  return result?.data ?? [];
}

/** Update records (max 100/call). Each record must have `id`. */
export async function update(module, records) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('update() requires a non-empty array');
  }
  if (records.length > 100) {
    throw new Error('update() supports max 100. Use bulk.js or chunk it.');
  }
  for (const r of records) {
    if (!r.id) throw new Error('Every record passed to update() must include `id`');
  }
  if (config.dryRun) {
    auditLogger.info({ op: 'update', module, count: records.length, dryRun: true });
    return records.map((r) => ({ status: 'dry-run', id: r.id }));
  }
  const result = await crmClient.request(`/${module}`, {
    method: 'PUT',
    body: { data: records },
  });
  auditLogger.info({ op: 'update', module, count: records.length });
  return result?.data ?? [];
}

/** Upsert based on duplicate_check_fields. */
export async function upsert(module, records, duplicateCheckFields) {
  if (!duplicateCheckFields?.length) {
    throw new Error('upsert() requires duplicate_check_fields');
  }
  if (config.dryRun) {
    auditLogger.info({ op: 'upsert', module, count: records.length, dryRun: true });
    return records.map(() => ({ status: 'dry-run' }));
  }
  const result = await crmClient.request(`/${module}/upsert`, {
    method: 'POST',
    body: { data: records, duplicate_check_fields: duplicateCheckFields },
  });
  auditLogger.info({ op: 'upsert', module, count: records.length });
  return result?.data ?? [];
}

/** Delete one record (prompts unless --yes). */
export async function remove(module, id) {
  const ok = await confirm(`Delete ${module} record ${id}?`);
  if (!ok) return false;
  if (config.dryRun) {
    auditLogger.info({ op: 'delete', module, id, dryRun: true });
    return true;
  }
  await crmClient.request(`/${module}/${id}`, { method: 'DELETE' });
  auditLogger.info({ op: 'delete', module, id });
  return true;
}

/** Delete many records by ID (max 100). Prompts unless --yes. */
export async function removeMany(module, ids) {
  if (ids.length > 100) throw new Error('removeMany() supports max 100 IDs');
  const ok = await confirm(`Delete ${ids.length} ${module} records? Cannot be undone.`);
  if (!ok) return 0;
  if (config.dryRun) {
    auditLogger.info({ op: 'deleteMany', module, count: ids.length, dryRun: true });
    return ids.length;
  }
  await crmClient.request(`/${module}`, {
    method: 'DELETE',
    query: { ids: ids.join(',') },
  });
  auditLogger.info({ op: 'deleteMany', module, count: ids.length, ids });
  return ids.length;
}

/**
 * Search records using v8's word search API.
 * @param {string} module
 * @param {string} word - text to search for
 */
export async function search(module, word) {
  const result = await crmClient.request(`/${module}/search`, {
    query: { word },
  });
  return result?.data ?? [];
}
