// src/projects/index.js
// Zoho Projects v3 API.
//
// Notes:
//   - Lives on projectsapi.zoho.com
//   - URL pattern: /restapi/portal/{portal_id}/projects/{project_id}/...
//   - portal_id (= portalId) goes in the path, not a header
//
// Docs: https://projects.zoho.com/api-docs

import { createAppClient } from '../client.js';
import { BASE_URLS, getOrgId, config } from '../config.js';
import { auditLogger } from '../utils/logger.js';

const projectsClient = createAppClient({
  baseUrl: BASE_URLS.projects,  // https://projectsapi.zoho.com/restapi
});

const portalId = () => getOrgId('projects');

// ============================================================================
// Portals
// ============================================================================

export async function listPortals() {
  return await projectsClient.request('/portals/');
}

// ============================================================================
// Projects
// ============================================================================

export async function listProjects() {
  return await projectsClient.request(`/portal/${portalId()}/projects/`);
}

export async function getProject(projectId) {
  return await projectsClient.request(`/portal/${portalId()}/projects/${projectId}/`);
}

export async function createProject(project) {
  if (config.dryRun) {
    auditLogger.info({ op: 'projects.create', dryRun: true });
    return { status: 'dry-run' };
  }
  const result = await projectsClient.request(`/portal/${portalId()}/projects/`, {
    method: 'POST', body: project,
  });
  auditLogger.info({ op: 'projects.create', name: project.name });
  return result;
}

// ============================================================================
// Tasks
// ============================================================================

export async function listTasks(projectId) {
  return await projectsClient.request(
    `/portal/${portalId()}/projects/${projectId}/tasks/`
  );
}

export async function createTask(projectId, task) {
  if (config.dryRun) {
    auditLogger.info({ op: 'projects.createTask', projectId, dryRun: true });
    return { status: 'dry-run' };
  }
  const result = await projectsClient.request(
    `/portal/${portalId()}/projects/${projectId}/tasks/`,
    { method: 'POST', body: task }
  );
  auditLogger.info({ op: 'projects.createTask', projectId, name: task.name });
  return result;
}

export async function updateTask(projectId, taskId, patch) {
  if (config.dryRun) {
    auditLogger.info({ op: 'projects.updateTask', taskId, dryRun: true });
    return { status: 'dry-run' };
  }
  return await projectsClient.request(
    `/portal/${portalId()}/projects/${projectId}/tasks/${taskId}/`,
    { method: 'POST', body: patch }
  );
}
