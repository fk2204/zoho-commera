// src/crm/users.js
// CRM user management. Used for owner assignment, activity attribution, etc.

import { crmClient } from './client.js';

/**
 * List CRM users.
 * @param {object} [opts]
 * @param {'AllUsers'|'ActiveUsers'|'DeactiveUsers'|'AdminUsers'} [opts.type='ActiveUsers']
 */
export async function listUsers(opts = {}) {
  const result = await crmClient.request('/users', {
    query: { type: opts.type ?? 'ActiveUsers' },
  });
  return result?.users ?? [];
}

/** Find a user by email. Returns null if not found. */
export async function findUserByEmail(email) {
  const users = await listUsers();
  return users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

/** Get the currently authenticated user (the one whose token we hold). */
export async function getCurrentUser() {
  const result = await crmClient.request('/users', { query: { type: 'CurrentUser' } });
  return result?.users?.[0] ?? null;
}
