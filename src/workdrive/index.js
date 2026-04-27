// src/workdrive/index.js
// Zoho WorkDrive API v1 — file storage.
//
// Notes:
//   - Under www.zohoapis.com/workdrive/api/v1
//   - Uses JSON:API spec format ({ data: { type, attributes, ... } })
//
// Docs: https://workdrive.zoho.com/apidocs/v1

import { createAppClient } from '../client.js';
import { BASE_URLS, API_PATHS } from '../config.js';

const wdClient = createAppClient({
  baseUrl: `${BASE_URLS.api}${API_PATHS.workdrive}`,
});

/** List the user's accessible teams. */
export async function listTeams() {
  return await wdClient.request('/users/me/teams');
}

/** List workspaces in a team. */
export async function listWorkspaces(teamId) {
  return await wdClient.request(`/teams/${teamId}/workspaces`);
}

/** List files/folders in a workspace or folder. */
export async function listFiles(parentId) {
  return await wdClient.request(`/files/${parentId}/files`);
}

/** Get a file's metadata. */
export async function getFile(fileId) {
  return await wdClient.request(`/files/${fileId}`);
}

/** Create a folder. */
export async function createFolder(parentId, name) {
  return await wdClient.request('/files', {
    method: 'POST',
    body: {
      data: {
        attributes: { name, parent_id: parentId },
        type: 'files',
      },
    },
  });
}

/**
 * Note: file upload uses multipart/form-data and a different domain
 * (upload.zohoworkdrive.com). Implement as a separate helper when needed.
 */
