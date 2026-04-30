# Admin Guide — Zoho Commera System

**For:** Technical leads & admins managing credentials, scheduler, and automation  
**Audience:** Filip and future ops/tech team members  
**System:** Zoho Commera (all 11 Zoho apps + automation jobs)  
**Last Updated:** April 2026

---

## Quick Reference

| Task | Command | Notes |
|------|---------|-------|
| Test all connections | `npm run test:connection` | Run weekly; alerts if any app down |
| Start scheduler | `npm run scheduler:start` | Runs daily at 08:00 local time |
| Check scheduler status | `npm run scheduler:status` | Should show "online" |
| View scheduler logs | `npm run scheduler:logs` | Last 50 lines; check for errors |
| Restart scheduler | `npm run scheduler:restart` | If crashed; restarts cleanly |
| Re-run a job | `npm run <job-name>` | All jobs are idempotent |
| Setup/upgrade OAuth | `npm run setup:oauth -- --full` | When adding new apps or scopes |
| Refresh access token | `npm run refresh-token` | Debug only; auto-refreshes normally |

---

## Part 1: Credential Locations & Renewal

**Reference:** See `CREDENTIALS.md` for complete list + how to obtain each  
**Location:** This guide assumes `C:\Users\fkozi\zoho commera` as working directory

### Credential Inventory

| Credential | File | Sensitivity | Renewal Cycle | How to Renew |
|-----------|------|-------------|----------------|-------------|
| **Client ID** | `.env` | Low | Once (rarely changes) | Zoom API Console |
| **Client Secret** | `.env` | **CRITICAL** | Once, if exposed | Zoom API Console (regenerate) |
| **Refresh Token** | `~/.zoho/tokens.json` | **CRITICAL** | Quarterly, or if scope mismatch | `npm run setup:oauth -- --full` |
| **Access Token** | In-memory | Temporary | Auto-refreshes hourly | None (automatic) |
| **SMTP User** | `.env` | Medium | Quarterly check | Zoho Mail → Settings → Accounts |
| **SMTP Password** | `.env` | **CRITICAL** | Quarterly | Zoho Mail → Settings → Connected Accounts → regenerate |
| **Org IDs** (Books, Desk, Inventory, Projects) | `.env` | Low | Once | Respective app settings |

### Quarterly Credential Checks

**Schedule:** Every 90 days, first Friday of quarter (e.g., Apr 5, Jul 5, Oct 5, Jan 5)

**Checklist:**
```bash
# 1. Test all connections
npm run test:connection

# Expected output for all 11 apps:
#   ✓ CRM: connected
#   ✓ Mail: connected
#   ✓ WorkDrive: connected
#   ✓ Cliq: connected
#   ✓ Sign: connected
#   ✓ Books: connected
#   ✓ Desk: connected
#   ✓ Inventory: connected
#   ✓ Projects: connected
#   ✓ People: connected
#   ✓ Campaigns: connected

# 2. Check for OAUTH_SCOPE_MISMATCH errors
# If you see this error:
#   ✗ CRM: OAUTH_SCOPE_MISMATCH (scopes changed in API Console)

# FIX: Re-run OAuth with full scope upgrade
npm run setup:oauth -- --full

# 3. Verify SMTP credentials work (check audit.log for email job runs)
tail -20 audit.log

# 4. Check file permissions on tokens.json
ls -l ~/.zoho/tokens.json
# Should show: -rw------- (mode 0600)

# If wrong:
chmod 0600 ~/.zoho/tokens.json
```

**When to escalate:**
- `OAUTH_SCOPE_MISMATCH` → Scopes changed in API Console without re-running OAuth
- `401 Unauthorized` → Refresh token revoked; must re-run OAuth
- `400 URL Rule` → WorkDrive specific issue; see Phase C3 fix below
- SMTP email fails in audit.log → SMTP password expired; regenerate in Zoho Mail

---

### SMTP Password Renewal

Zoho Mail app passwords expire or need rotation. Steps to rotate:

1. **Log into Zoho Mail**
   ```
   https://mail.zoho.com
   ```

2. **Navigate to Connected Accounts**
   ```
   Settings → Connected Accounts (or Account Security)
   ```

3. **Find "zoho-commera-smtp" app password**
   Look in the "Connected Apps" or "App Passwords" section

4. **Regenerate the password**
   - Click the app password row
   - Click "Regenerate" or "Delete" → create new
   - Zoho shows a one-time 16-32 character password

5. **Update `.env` immediately**
   ```bash
   # Open .env
   nano .env
   
   # Find this line:
   ZOHO_SMTP_PASS=xxxxxxxxxxxxxxxx
   
   # Replace with new password (copy from Zoho immediately)
   ZOHO_SMTP_PASS=[new-password-from-zoho]
   
   # Save and exit (Ctrl+O, Ctrl+X)
   ```

6. **Verify it works**
   ```bash
   # Run the send-application-confirmation job (safe, idempotent)
   npm run send-app-confirmation
   
   # Check audit.log for successful email sends
   tail -20 audit.log | grep -i email
   ```

**⚠️ Critical:** Do NOT use your main Zoho password as SMTP password. Always use an app-specific password from Zoho Mail settings.

---

### OAuth Scope Upgrades (Adding New Apps)

When adding a new Zoho app that wasn't in the original OAuth setup:

**Before upgrading, verify:**
1. You have access to the app in your Zoho One subscription
2. You know which scopes you need (check `src/auth/scopes.js`)
3. You're ready to be interrupted by a browser OAuth flow

**Steps:**
```bash
# 1. Add the new app's base URL to src/config.js
# (See "Adding a New App" section in CLAUDE.md for pattern)

# 2. Add scopes to src/auth/scopes.js

# 3. Upgrade OAuth to include new scopes
npm run setup:oauth -- --full

# 4. Follow the terminal prompts:
#    - Copy the scope URL
#    - Open browser to Zoho API Console
#    - Click "Generate Token"
#    - Copy the auth code
#    - Paste back into terminal
#
#    This generates a NEW refresh token with all new scopes.

# 5. Test all connections
npm run test:connection

# 6. Restart the scheduler to use new credentials
npm run scheduler:restart
```

---

## Part 2: Monitoring the Scheduler

The automation scheduler runs every morning at 08:00 local machine time. This section covers how to monitor, troubleshoot, and restart it.

### Scheduler Status Checks (Daily)

**Run at 9:00 AM to confirm morning run completed:**

```bash
# Check if scheduler is running
npm run scheduler:status

# Expected output:
# ┌─────┬────────────────┬─────────┬────────┬──────┬───────────┐
# │ id  │ name           │ version │ mode   │ ↺    │ status    │
# ├─────┼────────────────┼─────────┼────────┼──────┼───────────┤
# │ 0   │ commera-scheduler │ N/A  │ fork   │ 12   │ online    │
# └─────┴────────────────┴─────────┴────────┴──────┴───────────┘
```

**Status meanings:**
- `online` ✅ — Scheduler is running, last run succeeded
- `errored` ⚠️ — Last run crashed; check logs immediately
- `stopped` ❌ — Not running; restart with `npm run scheduler:start`

**If status is `online`, scheduler ran successfully this morning.** Next check the logs for errors.

### Viewing Scheduler Logs

```bash
# View last 50 lines (includes current run + previous run)
npm run scheduler:logs

# Format: one line per automation job completed
# Example:
# [2026-04-30 08:00:15] lead-assign: 3 updated, 2 skipped, 0 errors
# [2026-04-30 08:01:22] commission-invoice: 0 updated, 0 skipped, 0 errors
# [2026-04-30 08:02:15] merchant-ticket: 1 updated, 0 skipped, 0 errors
```

**What to look for:**
- All jobs completed without errors
- Times are roughly 08:00–09:00 each morning
- No `FATAL`, `ERROR`, or `401` lines

**If you see errors:**
- `401 Unauthorized` → Access token refresh failed; run `npm run test:connection`
- `RATE_LIMIT_EXCEEDED` → Hit Zoho quota; job will retry tomorrow
- Job name missing → That job didn't run; check automation-state.json

### Restarting the Scheduler

If scheduler crashed or is stuck:

```bash
# 1. Stop the scheduler
npm run scheduler:stop

# Wait a few seconds for process cleanup
sleep 3

# 2. Start it again
npm run scheduler:start

# 3. Verify it's running
npm run scheduler:status

# 4. Watch logs to confirm next run
npm run scheduler:logs

# 5. If it keeps crashing, check the error log
cat logs/scheduler-error.log
```

### Persisting Scheduler Across Reboots

If the machine reboots, the scheduler may not auto-start. **After a reboot, run:**

```bash
npm run scheduler:save
```

This configures PM2 to auto-start the scheduler on machine boot.

**Verify persistence:**
```bash
# Check if scheduler starts on reboot
pm2 startup
# Should output: "Command to copy/paste to enable PM2 autostart"
```

---

## Part 3: Running `test:connection` Checks

### What It Does

`test:connection` probes every configured Zoho app to verify credentials are valid and OAuth tokens can be refreshed. Run it:
- **Weekly** (Monday morning, as part of weekly ops check)
- **After credential changes** (new SMTP password, OAuth upgrade)
- **When automation jobs start failing** (diagnose auth issues)

### Command & Output

```bash
npm run test:connection

# Output format (for all 11 apps):
# Testing CRM...
# ✓ CRM: connected
#
# Testing Mail...
# ✓ Mail: connected
#
# ... (continues for all 11 apps) ...
```

### Interpreting Results

**✓ Connected**
```
✓ CRM: connected
```
✅ This app is working. Token refreshed, no errors.

**⚠️ Skipped (No Org ID)**
```
⚠️ Books: skipped (no org ID — set ZOHO_BOOKS_ORG_ID in .env)
```
⚠️ Credential exists but `.env` is missing the org ID. Fix by:
```bash
# Add to .env:
ZOHO_BOOKS_ORG_ID=[copy from Zoho Books → Settings → Organizations]

# Then re-run:
npm run test:connection
```

**✗ OAUTH_SCOPE_MISMATCH**
```
✗ CRM: OAUTH_SCOPE_MISMATCH
   Error: Your app requested [CRM.Contacts.ALL] but only [CRM.Leads.ALL] was authorized
```
❌ The refresh token doesn't have the scope being requested. **Fix:**
```bash
# Scopes were added to src/auth/scopes.js but refresh token not updated
npm run setup:oauth -- --full

# This mints a NEW refresh token with all scopes
```

**✗ 401 Unauthorized**
```
✗ CRM: 401 Unauthorized
   Error: invalid_grant (Refresh token has expired)
```
❌ Refresh token was revoked (you manually revoked it, or Zoho expired it after 6 months of inactivity). **Fix:**
```bash
# Must re-run OAuth from scratch
npm run setup:oauth -- --full

# Follow terminal prompts to authorize and get new refresh token
```

**✗ 400 Bad Request (URL Rule)**
```
✗ WorkDrive: 400 Bad Request
   Error: URL Rule violation
```
❌ WorkDrive API rule violation. Rare, usually means the account type changed. **Fix:**
```bash
# See Phase C3 in PHASE-3-MANUAL-SETUP.md for WorkDrive workaround
# (Can also be ignored if WorkDrive automation not in use)
```

**✗ Rate Limit Exceeded**
```
✗ Inventory: 429 Too Many Requests (Rate Limit Exceeded)
```
⚠️ Hit quota. Not a credential issue; test again later. If persistent:
- Inventory quota is ~1,000 calls/day on basic plan
- Wait 24 hours for quota reset
- Or upgrade Zoho plan

### Summary: What Each Status Means

| Status | Meaning | Action |
|--------|---------|--------|
| ✓ connected | OK | No action needed |
| ⚠️ skipped (no org ID) | Missing org ID in `.env` | Add org ID to `.env`, re-test |
| ✗ OAUTH_SCOPE_MISMATCH | Scopes not authorized | Run `npm run setup:oauth -- --full` |
| ✗ 401 Unauthorized | Refresh token invalid | Run `npm run setup:oauth -- --full` |
| ✗ 400 URL Rule | API rule violation | Check PHASE-3-MANUAL-SETUP.md § C3 |
| ✗ 429 Rate Limit | Hit quota | Wait 24h for reset |

---

## Part 4: Reading `audit.log`

The `audit.log` file records every write and delete operation across all 11 Zoho apps. Use it to:
- Verify operations actually ran
- Confirm no duplicates were created
- Debug automation errors

### Log Location & Format

```
Location:  C:\Users\fkozi\zoho commera\audit.log
Format:    JSON, one line per operation
Rotation:  Gitignored (not version controlled)
```

### Log Entry Structure

Each line is a JSON object:

```json
{
  "time": "2026-04-30T08:15:22.341Z",
  "app": "CRM",
  "module": "Deals",
  "op": "create",
  "recordId": "5678901234567890123",
  "recordName": "Acme Corp Funding Round 2",
  "result": "success",
  "message": null,
  "duration": 245
}
```

**Fields:**
- `time` — ISO timestamp (UTC)
- `app` — Zoho app name (CRM, Mail, Books, etc.)
- `module` — CRM module or app resource
- `op` — Operation: `create`, `update`, `delete`, `bulk_update`, `send_email`
- `recordId` — ID of record affected
- `recordName` — Human-readable name/subject
- `result` — `success` or `error`
- `message` — Error details if `result === error`
- `duration` — Milliseconds the operation took

### Reading Recent Entries

```bash
# View last 20 operations
tail -20 audit.log

# View last 20 operations, formatted nicely
tail -20 audit.log | jq '.'

# View only operations from today
grep "2026-04-30" audit.log | tail -10

# Count operations by type
grep -o '"op":"[^"]*' audit.log | sort | uniq -c

# Find errors
grep '"result":"error"' audit.log
```

### Debugging with `audit.log`

**Verify a job ran:**
```bash
# Did commission-invoice run today?
grep "commission-invoice" audit.log | tail -5

# What records did it touch?
grep "commission-invoice\|commission" audit.log | grep "2026-04-30"
```

**Check for duplicates:**
```bash
# Did we create the same record twice?
grep '"op":"create"' audit.log | grep "Acme Corp" | wc -l

# If count > 1, investigate:
grep '"op":"create"' audit.log | grep "Acme Corp"
```

**Debug an error:**
```bash
# What failed today?
grep '"result":"error"' audit.log | tail -5

# Get details
grep '"result":"error"' audit.log | jq '.message'
```

---

## Part 5: Re-Running a Failed Job

All automation jobs are **idempotent** — safe to re-run without creating duplicates. Use this when:
- A job crashed yesterday
- You fixed an issue in CRM data
- You want to backfill records

### List of Automation Jobs

Run with: `npm run <job-name>`

| Job | What It Does | Schedule |
|-----|--------------|----------|
| `send-app-confirmation` | Email applicants confirmation link | Daily, 08:00 |
| `lead-assign` | Assign new leads to sales reps round-robin | Daily, 08:00 |
| `lead-score` | Score leads 1–5 based on business metrics | Daily, 08:00 |
| `tib-band` | Categorize leads by business tier (startup, growth, etc.) | Daily, 08:00 |
| `days-to-fund` | Calculate days from application to funding | Daily, 08:00 |
| `match-lenders` | Match Deals to Lenders based on criteria | Daily, 08:00 |
| `commission-invoice` | Create invoices for commissions earned | Daily, 08:00 |
| `merchant-ticket` | Create Desk tickets for merchant escalations | Daily, 08:00 |
| `add-to-nurture` | Add inactive leads to nurture campaigns | Daily, 08:00 |
| `funding-project` | Auto-create Projects when funding approved | On-demand* |
| `create-funding` | Auto-create Funding records from Deals | On-demand* |
| `renewal-check` | Check for merchants eligible for renewal | On-demand* |

*On-demand jobs are triggered by manual CRM state changes (e.g., move Deal to "Funded"). Use the commands below to force re-run.

### Re-Running a Job

```bash
# Run a single job
npm run <job-name>

# Example: re-run commission-invoice if it failed yesterday
npm run commission-invoice

# It will:
# 1. Query CRM for deals modified since last run
# 2. Process each one (skip if already processed)
# 3. Log results to audit.log
# 4. Display summary

# Example output:
# ✓ commission-invoice
#   Processed 3 deals
#   Created 2 new invoices
#   Skipped 1 (already invoiced)
#   Errors: 0
#   Duration: 3.2s
```

### Idempotency Guarantee

Each job tracks state in `.automation-state.json`:

```json
{
  "commission-invoice": {
    "lastRun": "2026-04-30T08:15:00.000Z",
    "processed": ["5678901234567890123"]
  }
}
```

**How it works:**
1. Job queries CRM for records modified since `lastRun`
2. For each record, checks if ID already in `processed`
3. If already processed, skips with "duplicate check" log
4. If new, processes and adds to `processed`
5. Safe to re-run: duplicate records skipped

**Example:**
```bash
# Ran commission-invoice on Apr 30 morning
# It processed Deal #123, #124

# Machine crashed at 8:30 AM
# No more jobs ran

# Run it again Apr 30 afternoon
npm run commission-invoice

# Output:
# Querying for deals modified since 2026-04-30 08:00:00...
# Found 2 deals: #123, #124
# Processing #123... already processed (skip)
# Processing #124... already processed (skip)
# Result: 0 updated, 2 skipped, 0 errors
```

### Force Re-Process (Dangerous)

If you absolutely need to re-process a record you already processed:

```bash
# Edit .automation-state.json
nano .automation-state.json

# Remove the record ID from the "processed" array
# Example:
# Before: "processed": ["5678901234567890123", "9876543210987654321"]
# After:  "processed": ["9876543210987654321"]

# Save, then re-run
npm run commission-invoice
```

⚠️ **Warning:** This can create duplicates if the original operation partially succeeded. Only use if you're certain the record needs re-processing.

---

## Part 6: Upgrading OAuth Scopes

When you add a new Zoho app or need additional scopes, you must upgrade the refresh token. This process is safe and mints a new token.

### When to Upgrade

- Adding a new Zoho app (e.g., "We're turning on Zoho Campaigns now")
- Scope mismatch error appears in `test:connection`
- New automation job needs a scope not currently authorized

### Steps

```bash
# 1. Verify the new app is in src/config.js and scopes in src/auth/scopes.js
# (See "Adding a New App" section in CLAUDE.md for pattern)

# 2. Start the OAuth flow with --full (all scopes)
npm run setup:oauth -- --full

# Terminal will show:
#   Go to: https://accounts.zoho.com/oauth/v2/auth?client_id=...&scope=...
#   Then you will be redirected to a page that asks to authorize.
#   Copy the authorization code from the page and paste here.

# 3. Copy the URL into your browser
# 4. Log in with your Zoho account
# 5. Click "ACCEPT" to authorize all scopes
# 6. You'll be redirected to a success page with an authorization code
# 7. Copy the code and paste into the terminal prompt

# 8. Terminal will show:
#   ✓ Token saved to ~/.zoho/tokens.json
#   ✓ Refresh token valid until 2027-04-30

# 9. Restart the scheduler to use new credentials
npm run scheduler:restart

# 10. Test connections
npm run test:connection
```

### Troubleshooting OAuth Flow

**"Error: app not in my subscription"**
```
You have not purchased this app in your Zoho One subscription.
```
✅ Normal. Drop to a smaller scope tier:
```bash
npm run setup:oauth               # CORE preset (CRM, Mail, WorkDrive, Cliq, Sign)
npm run setup:oauth -- --minimal  # Minimal preset (CRM + profile only)
```

**"Scope XXX already authorized"**
✅ Normal warning. The token already has that scope, so it's being re-authorized. Continue.

**"Error: redirect_uri_mismatch"**
❌ OAuth configuration mismatch. **Fix:**
1. Go to https://api-console.zoho.com
2. Click "Self Client"
3. Verify **Redirect URLs** includes `http://localhost` (should be there by default)
4. Try again: `npm run setup:oauth -- --full`

**"Authorization code expired"**
❌ Took too long to copy/paste the code. **Fix:**
```bash
# Re-run OAuth flow
npm run setup:oauth -- --full

# When you see the authorization page, copy code QUICKLY (it expires in 5 min)
```

### Scope Tiers (Which to Choose)

| Tier | Apps Included | Command | Use When |
|------|---------------|---------|----------|
| **minimal** | CRM + profile | `setup:oauth -- --minimal` | Testing, or if Zoho plan limited |
| **core** (default) | CRM, Mail, WorkDrive, Cliq, Sign | `setup:oauth` | Default setup, covers most automations |
| **full** | All 11 apps | `setup:oauth -- --full` | Running all automation jobs, have full Zoho One |

---

## Part 7: Adding a New Zoho App

If you need to integrate a Zoho app not yet in the system (e.g., Zoho Analytics, Zoho Recruit):

### Pattern & Checklist

Follow the pattern in `src/cliq/index.js` (it's the cleanest example):

1. **Add base URL to `src/config.js`**
   ```javascript
   // In BASE_URLS object:
   myapp: 'https://www.zohoapis.com/myapp/v1',
   ```

2. **Add scopes to `src/auth/scopes.js`**
   ```javascript
   // In SCOPES object:
   MyApp: ['MyApp.Records.READ', 'MyApp.Records.CREATE'],
   ```

3. **Create `src/myapp/index.js`**
   ```javascript
   import { createAppClient } from '../client.js';
   import { BASE_URLS } from '../config.js';

   const client = createAppClient({
     baseUrl: BASE_URLS.myapp,
     defaultHeaders: () => ({}), // Add org ID if needed
   });

   export async function listRecords() {
     return await client.request('/records');
   }

   export async function createRecord(data) {
     return await client.request('/records', { method: 'POST', body: data });
   }
   ```

4. **Upgrade OAuth**
   ```bash
   npm run setup:oauth -- --full
   ```

5. **Test**
   ```bash
   npm run test:connection
   ```

### Need Help?

Ask Claude Code: "Add Zoho [AppName] integration following the pattern in `src/cliq/index.js`"

---

## Troubleshooting Reference

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Scheduler shows `stopped` | PM2 process crashed | `npm run scheduler:restart` |
| Scheduler shows `errored` | Job failed yesterday | Check `npm run scheduler:logs` |
| `npm run test:connection` shows 401 | Access token can't refresh | Run `npm run setup:oauth -- --full` |
| `npm run test:connection` shows OAUTH_SCOPE_MISMATCH | Scopes don't match | Run `npm run setup:oauth -- --full` |
| Jobs not running at 08:00 | Scheduler not started OR time wrong | Check `pm2 status`, verify machine time |
| SMTP emails failing | Password expired | Regenerate in Zoho Mail, update `.env` |
| Org ID missing error | `.env` missing org ID | Add `ZOHO_[APP]_ORG_ID=...` to `.env` |
| Job re-run creates duplicates | Idempotency broken | Check `.automation-state.json`, contact dev |

---

## Emergency Contacts

**For this system:**
- **Primary:** Filip (creator & maintainer)
- **On-call:** Check project Cliq channel #ops-automation

**For Zoho issues:**
- **API Console:** https://api-console.zoho.com
- **Support:** https://accounts.zoho.com/support
- **Status:** https://status.zoho.com

---

## Key Documents

Keep these bookmarked for reference:

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` (this repo) | Architecture & conventions |
| `CREDENTIALS.md` (this repo) | Where credentials live, how to renew |
| `BUSINESS_LOGIC.md` (this repo) | Automation rules & formulas |
| `ZOHO_LIMITATIONS.md` (this repo) | API limitations & workarounds |
| https://api-console.zoho.com | Manage OAuth clients & scopes |
| https://accounts.zoho.com/home#sessions/userauthtoken | Revoke leaked tokens |

---

## Changelog

| Date | Change | Impact |
|------|--------|--------|
| 2026-04-30 | Created ADMIN-GUIDE | Initial ops documentation |
| TBD | — | — |

---

**Last reviewed:** 2026-04-30  
**Next review:** 2026-07-30 (quarterly)  
**Maintain by:** Filip (Tech Lead)
