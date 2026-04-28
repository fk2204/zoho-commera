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

---

## Read-Only Fields — Never Try to Write

| Module | Field | Type | Notes |
|--------|-------|------|-------|
| Leads | `FICO_Band` | formula | Auto-calculated from FICO_score |
| Contacts | `FICO_Band` | formula | Auto-calculated from FICO_score |
| Accounts | `TIB_Band` | formula | Auto-calculated from Date_Business_Started |
| Accounts | `Time_in_Business_Months` | formula | Auto-calculated from Date_Business_Started |

For FICO band logic in Node.js: compute it in memory from `FICO_score`, use it for decisions — never write it back.

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
