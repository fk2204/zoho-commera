// src/crm/metadata.js
// CRM introspection: list modules, fields, layouts.
// Essential for Claude Code to "discover" the schema before writing scripts.
//
// All endpoints under /settings/ — read-only unless creating custom fields.

import { crmClient } from './client.js';

/** All modules (standard + custom) in the org. */
export async function listModules() {
  const result = await crmClient.request('/settings/modules');
  return result?.modules ?? [];
}

/** Single module's metadata (label, plural, custom-vs-standard, etc.). */
export async function getModule(apiName) {
  const result = await crmClient.request(`/settings/modules/${apiName}`);
  return result?.modules?.[0] ?? null;
}

/**
 * All fields on a module — names, types, picklist values, required, etc.
 * This is what Claude Code should call before writing record creation logic.
 *
 * @param {string} module - module api_name (e.g. 'Leads')
 */
export async function listFields(module) {
  const result = await crmClient.request('/settings/fields', {
    query: { module },
  });
  return result?.fields ?? [];
}

/** Layouts for a module (page layouts shown to different profiles). */
export async function listLayouts(module) {
  const result = await crmClient.request('/settings/layouts', {
    query: { module },
  });
  return result?.layouts ?? [];
}

/** Related lists for a module (e.g. Contacts under an Account). */
export async function listRelatedLists(module) {
  const result = await crmClient.request('/settings/related_lists', {
    query: { module },
  });
  return result?.related_lists ?? [];
}

/**
 * Create a custom field. Requires ZohoCRM.settings.ALL scope.
 * @param {string} module
 * @param {object} field - field definition (api_name, data_type, label, etc.)
 */
export async function createField(module, field) {
  return await crmClient.request('/settings/fields', {
    method: 'POST',
    query: { module },
    body: { fields: [field] },
  });
}
