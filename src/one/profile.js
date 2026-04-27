// src/one/profile.js
// Zoho One user profile from accounts.zoho.com.

import { config } from '../config.js';
import { getAccessToken } from '../auth/oauth.js';

/** Fetch the authenticated user's profile. */
export async function getProfile() {
  const token = await getAccessToken();
  const url = `${config.accountsDomain}/oauth/user/info`;
  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
  return await res.json();
}
