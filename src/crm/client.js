// src/crm/client.js
// CRM-specific client (v8). Uses the unified api.zohoapis.com gateway.
import { createAppClient } from '../client.js';
import { BASE_URLS, API_PATHS } from '../config.js';

export const crmClient = createAppClient({
  baseUrl: `${BASE_URLS.api}${API_PATHS.crm}`,  // https://www.zohoapis.com/crm/v8
});
