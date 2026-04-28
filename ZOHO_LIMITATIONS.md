# Zoho Hard Limits — Proven Facts

These are confirmed through direct testing. Do not re-test or work around. Accept them and build accordingly.

---

## API Cannot Do

| What | Why | Alternative |
|------|-----|-------------|
| Create custom functions | No endpoint exists — UI only | Build as Node.js scripts instead |
| Deploy workflow rules fully | API can list/read but not reliably create full rules | Use UI for rules, Node.js for logic |
| Write to formula fields | Zoho rejects writes silently or with error | Read-only — let CRM calculate them |
| Expand Blueprint stages | UI only | Document steps for manual execution |
| Send emails via Mail API | `getAccounts()` returns 500 "Internal Error" consistently | Email templates ready in code; awaiting Mail API fix by Zoho support |

---

## Read-Only Fields — Never Try to Write

| Module | Field | Type | Notes |
|--------|-------|------|-------|
| Leads | `FICO_Band` | formula | Auto-calculated from FICO_score |
| Leads | `Lead_Scores` | write-protected | Reserved for Zoho Scoring Rules (Professional+ only); only 0/null accepted |
| Contacts | `FICO_Band` | formula | Auto-calculated from FICO_score |
| Accounts | `TIB_Band` | formula | Auto-calculated from Date_Business_Started |
| Accounts | `Time_in_Business_Months` | formula | Auto-calculated from Date_Business_Started |

For FICO band logic in Node.js: compute it in memory from `FICO_score`, use it for decisions — never write it back.

**Lead Scoring:** The `Lead_Scores` field cannot be written via API. If Scoring Rules are needed, configure them in Zoho UI: Setup → Automation → Scoring Rules → Create new rule on Leads module. Manual scoring via API is not possible in Professional Edition.

---

## Field Name Gotchas

| Module | Field | Gotcha |
|--------|-------|--------|
| Deals | `Estimated_commision` | Typo is intentional — this is the actual API name |
| Deals | `Commission` | This is the **percentage** (e.g. 2.5 for 2.5%) |
| Deals | `Estimated_commision` | This is the calculated **dollar amount** |
| Fundings | `Funding_status` | Lowercase 's' — not `Funding_Status` |
| Fundings | `Paydown` | Integer (not `Paydown_Percent`) |
| Renewals | `Original_Funding` | Lookup to Fundings module |

---

## Token Rate Limits

- Calling `getAccessToken()` (which triggers refresh) rapidly causes `Access Denied: too many requests`
- **Rule:** One `getAccessToken()` call per script run. Store the token in a variable, reuse it.
- If you hit rate limit: wait 60 seconds before retrying — do not loop.

---

## COQL Limits

- Max 200 rows per query
- No subqueries
- No `INSERT`, `UPDATE`, `DELETE` — SELECT only
- Always paginate with `queryAll()` — never assume one page is complete
- `OFFSET` must be added by the caller (`queryAll()` handles this automatically)

---

## Module Name Accuracy

These module API names are exact — spelling and case matter:

```
Leads, Contacts, Accounts, Deals, Lenders, Offers, Stips,
Fundings, Renewals, DealHistory, Calls, Activities
```

`Commisions` — note the typo. The actual module API name must be verified with `metadata.listModules()` before use.

---

## What Was Tried and Failed

| Attempt | Result | Lesson |
|---------|--------|--------|
| POST to `/crm/v8/settings/automation/functions` with `script` field | `NOT_ALLOWED` — permission denied | Cannot deploy function code via API |
| POST function without `module` field | `MANDATORY_NOT_FOUND` | Module is required but still can't set script |
| Rapid token refresh in tests | `Access Denied: too many requests` | Rate limit — one refresh per script run |
| GET `/accounts` from Mail API | **500 Internal Error (consistent, all attempts fail)** | Mail API appears broken or not available on this account — contact Zoho support |

---

## Email Sending — Switched to SMTP

**Status:** ✅ FIXED — Now using Zoho Mail SMTP instead of broken REST API

The Zoho Mail REST API endpoint was returning 500 errors, but Zoho Mail also supports SMTP. Implemented nodemailer-based SMTP transport (like the Commera app).

**What's Working:**
- ✅ Email template system (`src/mail/email-templates.js`)
- ✅ Email sender via SMTP (`src/mail/sender.js`)
- ✅ SMTP transporter module (`src/mail/smtp.js`)
- ✅ Automation job complete (`scripts/automation/jobs/send-application-confirmation.js`)
- ✅ Dry-run mode verified (14 confirmations would send)
- ✅ Full automation suite tested (8 jobs, 0 errors)

**Configuration Required:**
```
ZOHO_SMTP_USER=    # Email address (usually applications@commerafunding.com)
ZOHO_SMTP_PASS=    # App password (NOT account password)
```

Get these from: Zoho Mail → Settings → Connected Accounts → App Passwords

Once credentials are added to `.env`, email sending works immediately — no code changes needed.
