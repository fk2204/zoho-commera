# Business Logic — Automation Specifications

Every automation in this project is defined here. Before writing any script, read the relevant section. If a rule is not here, ask the user — do not invent it.

---

## 1. Payback Calculation

**Trigger:** Deal has `Approved_Amount` AND `Factor_Rate` set  
**Runs:** On demand + as part of daily job  
**Module:** Deals

```
Payback_Amount = Approved_Amount × Factor_Rate
```

**Rules:**
- Only calculate if both fields are non-null and > 0
- Only update if current `Payback_Amount` differs from calculated value (avoid unnecessary writes)
- Never overwrite if Deal.Stage is `Funded` (funding already happened — don't change post-fact)

---

## 2. Commission Calculation

**Trigger:** Deal has `Funded_Amount` AND `Commission` (the %) set  
**Runs:** On demand + as part of daily job  
**Module:** Deals

```
Estimated_commision = Funded_Amount × (Commission / 100)
```

**Rules:**
- `Commission` field = percentage (e.g. `2.5` means 2.5%)
- `Estimated_commision` field = dollar amount (note the typo — that is the actual field name)
- Only update if calculated value differs from current `Estimated_commision`

---

## 3. FICO Band Classification

**Used by:** Lender matching, lead scoring, reporting  
**Module:** Leads, Contacts  
**Field:** `FICO_score` (writable integer) → compute band in memory

`FICO_Band` on Leads/Contacts is a **read-only formula field** — never write to it.  
Compute in Node.js when needed:

```js
function getFicoBand(score) {
  if (score >= 720) return 'A+';
  if (score >= 680) return 'A';
  if (score >= 640) return 'B';
  if (score >= 600) return 'C';
  return 'D';
}
```

---

## 4. Create Funding from Funded Deal

**Trigger:** `Deal.Stage = "Funded"` AND no Funding record with `Submission = Deal.id` exists  
**Runs:** Daily job + on demand  
**Creates:** 1 Funding record per Deal

**Idempotency check (mandatory before creating):**
```
COQL: SELECT id FROM Fundings WHERE Submission = '{dealId}' LIMIT 1
```
If result has records → skip, already created.

**Field mapping:** See `DATA_MODEL.md` → "Field Mapping: Deal → Funding"

**After creating Funding:**
- Log the new Funding ID
- Immediately trigger: Create Renewal from this Funding (step 5)

---

## 5. Create Renewal from Funding

**Trigger:** Funding record exists AND no Renewal with `Original_Funding = Funding.id` exists  
**Runs:** After every Funding creation + daily job  
**Creates:** 1 Renewal record per Funding

**Idempotency check (mandatory before creating):**
```
COQL: SELECT id FROM Renewals WHERE Original_Funding = '{fundingId}' LIMIT 1
```
If result has records → skip.

**Field mapping:** See `DATA_MODEL.md` → "Field Mapping: Funding → Renewal"

**Initial state:** `Renewal_Stage = "Eligibility Review"`, not yet eligible

---

## 6. Renewal Eligibility Check

**Trigger:** Daily scheduled job  
**Module:** Fundings  
**Condition:** `Paydown >= 50` AND `Renewal_Eligible = false` (or null)

**Action:**
```
Set Funding.Renewal_Eligible = true
Set Funding.Renewal_Eligible_Date = today
```

**Then:** Find the linked Renewal (`Original_Funding = Funding.id`) and update:
```
Set Renewal.Renewal_Stage = "Eligible"
Set Renewal.Eligible_Date = today
```

**Rules:**
- Only flip to eligible — never flip back to false automatically
- If `Renewal_Eligible` is already `true`, skip (idempotent)

---

## 7. Lender Matching

**Trigger:** On demand (manual run or button equivalent)  
**Module:** Deals  
**Input:** A Deal with `Contact_Name` and `Account_Name` populated

**Process:**
1. Fetch Deal + linked Contact (for FICO_score) + linked Account (for Monthly_Revenue, Date_Business_Started, Industry, Billing_State)
2. Fetch all Lenders where `Lender_Status = "Active"`
3. For each Lender, run all match criteria (see `DATA_MODEL.md` → "Lender Matching Criteria")
4. Return ranked list sorted by `Priority_Rank` ascending
5. Optionally write the top match to `Deal.Lender`

**Rules:**
- Never auto-assign a lender without logging the match result first
- If no lenders match, log the reason (which criteria failed) — do not silently return empty
- Time in Business: calculate from `Date_Business_Started` to today in months

```js
function getTimInBusinessMonths(dateStarted) {
  const start = new Date(dateStarted);
  const now = new Date();
  return (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
}
```

---

## 8. Daily Automation Job

**Schedule:** Every morning at 8:00 AM  
**Runs in order:**

1. Calculate Payback for all qualifying Deals
2. Calculate Commission for all qualifying Deals
3. Create Funding for all Funded Deals that are missing one
4. Create Renewal for all Fundings that are missing one
5. Run Renewal Eligibility Check

**Rules:**
- Each step runs independently — one step failing does not stop the rest
- Log a summary at the end: X processed, Y skipped, Z errors
- Store last run time in `.automation-state.json`
- Each step queries only records modified since the last run time (except idempotency-checked steps which always do a full check)

---

## Error Handling Rules

| Situation | Action |
|-----------|--------|
| One record fails in a batch | Log the error + record ID, continue with rest |
| An entire step fails | Log the failure, continue to next step |
| Funding already exists | Skip silently — this is expected, not an error |
| Renewal already exists | Skip silently — this is expected, not an error |
| COQL returns empty | Log "no records found", continue |
| CRM API returns non-200 | Log full response, mark step as failed, continue |
| Missing required field on record | Log which field, skip the record, flag for manual review |
