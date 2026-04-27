// src/people/index.js
// Zoho People API — HR.
//
// Notes:
//   - Lives on people.zoho.com
//   - Form-based API: most operations pass through `/forms/{formName}/...`
//
// Docs: https://www.zoho.com/people/api/

import { createAppClient } from '../client.js';
import { BASE_URLS, config } from '../config.js';
import { auditLogger } from '../utils/logger.js';

const peopleClient = createAppClient({
  baseUrl: BASE_URLS.people,  // https://people.zoho.com/people/api
});

// ============================================================================
// Employees
// ============================================================================

/**
 * Fetch all records from an employee form (default: 'P_EmployeeView').
 * The Zoho People data model is form-based — HR data lives in named forms.
 */
export async function getEmployees(opts = {}) {
  const formName = opts.form ?? 'P_EmployeeView';
  return await peopleClient.request(`/forms/${formName}/getRecords`, {
    query: {
      sIndex: opts.startIndex ?? 1,
      rCount: opts.count ?? 200,
    },
  });
}

/** Get a single employee record. */
export async function getEmployee(recordId, formName = 'P_EmployeeView') {
  return await peopleClient.request(`/forms/${formName}/getDataByID`, {
    query: { recordId },
  });
}

// ============================================================================
// Attendance
// ============================================================================

/** Get attendance entries for an employee. */
export async function getAttendance(empMail, opts = {}) {
  return await peopleClient.request('/attendance/getUserReport', {
    query: {
      sdate: opts.startDate,
      edate: opts.endDate,
      empMail,
    },
  });
}

// ============================================================================
// Leave
// ============================================================================

export async function getLeaveBalance(emailId) {
  return await peopleClient.request('/leave/getLeaveTypeDetails', {
    query: { userId: emailId },
  });
}

// ============================================================================
// Generic form access
// ============================================================================

/** Submit a record into any People form. */
export async function submitToForm(formName, fields) {
  if (config.dryRun) {
    auditLogger.info({ op: 'people.submitToForm', formName, dryRun: true });
    return { status: 'dry-run' };
  }
  const result = await peopleClient.request(`/forms/${formName}/insertRecord`, {
    method: 'POST',
    body: { inputData: JSON.stringify(fields) },
  });
  auditLogger.info({ op: 'people.submitToForm', formName });
  return result;
}
