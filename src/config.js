// src/config.js
// Centralized config. Loaded once at startup; validates required env vars.
// US data center is pinned here — single point of change if you migrate.

import 'dotenv/config';
import { homedir } from 'node:os';
import { join } from 'node:path';

function required(name) {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    throw new Error(
      `Missing required env var: ${name}. ` +
      `Did you copy .env.example to .env and fill it in?`
    );
  }
  return v.trim();
}

function optional(name, defaultValue = undefined) {
  const v = process.env[name];
  return v && v.trim() !== '' ? v.trim() : defaultValue;
}

/** Per-app base URLs. US data center. */
export const BASE_URLS = Object.freeze({
  api:        'https://www.zohoapis.com',
  accounts:   'https://accounts.zoho.com',
  desk:       'https://desk.zoho.com/api/v1',
  cliq:       'https://cliq.zoho.com/api/v2',
  projects:   'https://projectsapi.zoho.com/restapi',
  sign:       'https://sign.zoho.com/api/v1',
  mail:       'https://mail.zoho.com/api',
  campaigns:  'https://campaigns.zoho.com/api/v1.1',
  people:     'https://people.zoho.com/people/api',
});

/** App paths under the unified api.zohoapis.com gateway. */
export const API_PATHS = Object.freeze({
  crm:       '/crm/v8',
  books:     '/books/v3',
  inventory: '/inventory/v1',
  workdrive: '/workdrive/api/v1',
});

export const config = Object.freeze({
  clientId:     required('ZOHO_CLIENT_ID'),
  clientSecret: required('ZOHO_CLIENT_SECRET'),

  apiDomain:      BASE_URLS.api,
  accountsDomain: BASE_URLS.accounts,

  // Per-app org IDs — only required when that app is actually used.
  orgIds: Object.freeze({
    books:     optional('ZOHO_BOOKS_ORG_ID'),
    inventory: optional('ZOHO_INVENTORY_ORG_ID'),
    desk:      optional('ZOHO_DESK_ORG_ID'),
    projects:  optional('ZOHO_PROJECTS_PORTAL_ID'),
  }),

  tokenStorePath:
    optional('ZOHO_TOKEN_STORE_PATH') ||
    join(homedir(), '.zoho', 'tokens.json'),

  logLevel: optional('LOG_LEVEL', 'info'),
  dryRun:   process.env.DRY_RUN === 'true',
});

/** Get an org ID for an app, or throw a helpful error if not configured. */
export function getOrgId(app) {
  const id = config.orgIds[app];
  if (!id) {
    throw new Error(
      `Zoho ${app} requires an org ID. Set ZOHO_${app.toUpperCase()}_ORG_ID in .env. ` +
      `See .env.example for where to find it.`
    );
  }
  return id;
}
