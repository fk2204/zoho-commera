// src/crm/coql.js
// COQL = Zoho's SQL-like query language for CRM. v8 endpoint.
//
// Strongly preferred over filtered GETs:
//   - Server-side filtering (faster)
//   - JOINs across modules
//   - Aggregate functions
//   - Counts as a single API credit regardless of records scanned
//
// Limits: max 200 rows/call, 2000 chars query, SELECT only.
// Docs: https://www.zoho.com/crm/developer/docs/api/v8/COQL-Overview.html

import { crmClient } from './client.js';
import { ZohoApiError } from '../utils/errors.js';

/**
 * Run a COQL query (one page).
 * @param {string} sql
 * @returns {Promise<{ data: any[], info: { more_records: boolean, count: number } }>}
 */
export async function query(sql) {
  try {
    const result = await crmClient.request('/coql', {
      method: 'POST',
      body: { select_query: sql },
    });
    if (!result) return { data: [], info: { more_records: false, count: 0 } };
    return result;
  } catch (err) {
    if (err instanceof ZohoApiError && err.response?.code === 'INVALID_QUERY') {
      throw new ZohoApiError(
        `COQL syntax error: ${err.response.message}\nQuery:\n${sql}`,
        { ...err, response: err.response }
      );
    }
    throw err;
  }
}

/**
 * Auto-paginate a COQL query. Query MUST include LIMIT and MUST NOT include OFFSET.
 * @param {string} sql
 */
export async function queryAll(sql) {
  if (/\boffset\b/i.test(sql)) {
    throw new Error('queryAll() manages OFFSET; remove it from your query');
  }
  const limitMatch = sql.match(/\blimit\s+(\d+)\b/i);
  if (!limitMatch) {
    throw new Error('queryAll() requires an explicit LIMIT (max 200)');
  }
  const limit = parseInt(limitMatch[1], 10);

  const all = [];
  let offset = 0;
  while (true) {
    const paged = `${sql} OFFSET ${offset}`;
    const result = await query(paged);
    all.push(...(result.data || []));
    if (!result.info?.more_records) break;
    offset += limit;
  }
  return all;
}
