// scripts/test-connection.js
// Sanity check across Zoho One apps. Probes each configured app.
// Apps without an org ID (or scope) are skipped, not failed.
//
// Run: npm run test:connection

import { getProfile } from '../src/one/profile.js';
import { crmClient } from '../src/crm/client.js';
import { records } from '../src/crm/index.js';
import { config } from '../src/config.js';

const tests = [];
const probe = (name, requiresOrgId, fn) =>
  tests.push({ name, requiresOrgId, fn });

// ---- Always-on ----
probe('Auth + Profile', null, async () => {
  const p = await getProfile();
  return `✓ ${p.Display_Name} <${p.Email}>`;
});

probe('CRM v8 — modules', null, async () => {
  const r = await crmClient.request('/settings/modules');
  const apiNames = (r?.modules || []).filter((m) => m.api_supported).map((m) => m.api_name);
  return `✓ ${apiNames.length} modules (e.g. ${apiNames.slice(0, 5).join(', ')})`;
});

probe('CRM v8 — records', null, async () => {
  const page = await records.list('Leads', { fields: ['id'], perPage: 1 });
  return `✓ Leads readable (${page.data?.length ?? 0} on first page)`;
});

probe('Cliq', null, async () => {
  const { listChannels } = await import('../src/cliq/index.js');
  const r = await listChannels();
  return `✓ ${r?.length ?? 0} channel(s)`;
});

probe('WorkDrive', null, async () => {
  const { listTeams } = await import('../src/workdrive/index.js');
  try {
    const r = await listTeams();
    return `✓ ${r?.data?.length ?? 0} team(s)`;
  } catch (err) {
    // Known Zoho-side config issue: URL Rule not configured in WorkDrive settings
    if (err.message?.includes('URL Rule is not configured')) {
      return '○ URL Rule not configured (Zoho WorkDrive settings — see ZOHO_LIMITATIONS.md)';
    }
    throw err;
  }
});

probe('Sign — templates', null, async () => {
  const { listTemplates } = await import('../src/sign/index.js');
  const r = await listTemplates();
  return `✓ ${r?.templates?.length ?? 0} template(s)`;
});

probe('Mail — SMTP', null, async () => {
  if (!process.env.ZOHO_SMTP_USER || !process.env.ZOHO_SMTP_PASS) {
    return null; // handled as skip below
  }
  const nodemailer = (await import('nodemailer')).default;
  const t = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: { user: process.env.ZOHO_SMTP_USER, pass: process.env.ZOHO_SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });
  await t.verify();
  return `✓ SMTP connected (${process.env.ZOHO_SMTP_USER})`;
});

// ---- Per-app (require org ID) ----
probe('Books', 'books', async () => {
  const { listInvoices } = await import('../src/books/index.js');
  const r = await listInvoices({ perPage: 1 });
  return `✓ ${r?.invoices?.length ?? 0} invoice(s) on first page`;
});

probe('Inventory', 'inventory', async () => {
  const { listItems } = await import('../src/inventory/index.js');
  const r = await listItems({ perPage: 1 });
  return `✓ ${r?.items?.length ?? 0} item(s) on first page`;
});

probe('Desk', 'desk', async () => {
  const { listDepartments } = await import('../src/desk/index.js');
  const r = await listDepartments();
  return `✓ ${r?.data?.length ?? 0} department(s)`;
});

probe('Projects', 'projects', async () => {
  const { listProjects } = await import('../src/projects/index.js');
  const r = await listProjects();
  return `✓ ${r?.projects?.length ?? 0} project(s)`;
});

// ---- Run ----

console.log('\nZoho One connection test\n');
let passed = 0, failed = 0, skipped = 0;

for (const { name, requiresOrgId, fn } of tests) {
  if (requiresOrgId && !config.orgIds[requiresOrgId]) {
    console.log(`  ○ ${name.padEnd(28)} skipped (no ZOHO_${requiresOrgId.toUpperCase()}_ORG_ID)`);
    skipped++;
    continue;
  }
  try {
    const result = await fn();
    if (result === null) {
      console.log(`  ○ ${name.padEnd(28)} skipped (no SMTP credentials)`);
      skipped++;
      continue;
    }
    if (result.startsWith('○')) {
      console.log(`  ${result}`);
      skipped++;
    } else {
      console.log(`  ${result.startsWith('✓') ? '' : '✓ '}${name.padEnd(28)} ${result}`);
      passed++;
    }
  } catch (err) {
    // Common case: scope not granted — show clearly, don't crash.
    const msg = err.response?.code === 'OAUTH_SCOPE_MISMATCH'
      ? 'scope not granted (re-run setup:oauth with --full)'
      : err.message;
    console.log(`  ✗ ${name.padEnd(28)} ${msg}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed, ${skipped} skipped\n`);
process.exit(failed > 0 ? 1 : 0);
