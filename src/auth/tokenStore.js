// src/auth/tokenStore.js
// Read/write the refresh token to disk with strict permissions (0600).
//
// Intentionally NOT in `.env`. Refresh tokens are long-lived and `.env` files
// have a long history of accidental leaks. Keeping it in a separate
// mode-0600 file outside the repo keeps `git status` and `cat .env` safe.

import { readFile, writeFile, mkdir, chmod, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { config } from '../config.js';

/**
 * @typedef {Object} StoredTokens
 * @property {string} refreshToken
 * @property {string[]} scopes
 * @property {string} createdAt
 */

/** @returns {Promise<StoredTokens | null>} */
export async function readTokens() {
  try {
    const raw = await readFile(config.tokenStorePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

/** @param {StoredTokens} tokens */
export async function writeTokens(tokens) {
  await mkdir(dirname(config.tokenStorePath), { recursive: true, mode: 0o700 });
  await writeFile(
    config.tokenStorePath,
    JSON.stringify(tokens, null, 2),
    { mode: 0o600 }
  );
  await chmod(config.tokenStorePath, 0o600);
}

export async function clearTokens() {
  try {
    await unlink(config.tokenStorePath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}
