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
  if (score >= 550) return 'D';
  return 'Sub';
}
```

**Bands:**
- `A+`: 720+
- `A`: 680-719
- `B`: 640-679
- `C`: 600-639
- `D`: 550-599
- `Sub`: <550

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

## 8. Email Notifications to Merchants & Sales Reps

**Status:** ✅ READY — Using Zoho Mail SMTP via nodemailer

**Triggers:**

1. **New Application Submitted** (Daily Job)
   - When: Deal/Submission created in CRM (checked each morning)
   - To Merchant: Confirmation email with submission details
   - To Sales Rep: Alert that new application received (assigned rep only)
   - Via: `scripts/automation/jobs/send-application-confirmation.js`

2. **Funding Approved** (When Funding Created)
   - When: Funding record created from Funded Deal
   - To Merchant: Confirmation with funding amount and expected funding date
   - Via: `src/mail/sender.js::sendFundingConfirmation()` called from create-funding.js

3. **Renewal Eligible** (Future - When Paydown ≥ 50%)
   - When: Funding hits 50% paydown in renewal-check job
   - To Merchant: Notification of renewal eligibility with potential amount
   - Via: `src/mail/sender.js::sendRenewalEligible()` (ready to integrate)

**Email Templates:** All defined in `src/mail/email-templates.js`
- Application confirmation with submission number
- New application alert for assigned sales rep
- Funding confirmation with amount and date
- Renewal eligibility notification

**Sender Email:** `applications@commerafunding.com` (configurable via `ZOHO_SMTP_USER`)

**Transport:** Zoho Mail SMTP via nodemailer
- Host: `smtp.zoho.com`
- Port: `465` (SSL)
- Credentials: `ZOHO_SMTP_USER` and `ZOHO_SMTP_PASS` from `.env`

**Implementation Status:**
- ✅ Email templates built (`src/mail/email-templates.js`)
- ✅ SMTP transporter module (`src/mail/smtp.js`)
- ✅ Sender service using SMTP (`src/mail/sender.js`)
- ✅ Automation job complete (`send-application-confirmation.js`)
- ✅ Dry-run mode verified (14 confirmations tested)
- ✅ Full suite tested (8 jobs, 0 errors)
- ⏳ Awaiting: SMTP credentials in `.env`

**Next Step:** Add `ZOHO_SMTP_USER` and `ZOHO_SMTP_PASS` to `.env`, then live email sending works immediately.

---

## 9. Lead Scoring ⚠️ NOT AVAILABLE VIA API

**Status:** Disabled — `Lead_Scores` field is write-protected (reserved for Zoho Scoring Rules)

**Alternative:** Configure Scoring Rules in Zoho UI:
1. Setup → Automation → Scoring Rules
2. Create new rule on Leads module
3. Set 11 categories / 43 criteria as defined below

**Manual Score calculation (for reference, implement in Zoho UI Scoring Rules):** 11 categories / 43 criteria

1. **Monthly Revenue** (0-100k)
   - >= $100k: +40 | >= $50k: +25 | >= $30k: +15 | >= $15k: +5 | >= $10k: 0 | < $10k: -10

2. **FICO Score**
   - >= 720: +25 | >= 680: +20 | >= 650: +15 | >= 600: +10 | >= 550: +5 | 1-549: -10 | 0: 0

3. **Time in Business (months)**
   - >= 24: +20 | >= 12: +10 | >= 6: +5 | >= 4: 0 | < 4: -5

4. **Existing MCA Positions**
   - "0 — Clean": +30 | "1 — One position": +15 | "2 — Two positions": +5 | "3 — Three positions": -10 | "4+ — Stacked": -20

5. **Requested Amount**
   - >= $100k: +15 | >= $50k: +10 | >= $25k: +5 | else: 0

6. **Industry** (negative scoring)
   - Contains "RESTRICTED": -50

7. **Lead Source** (conversion probability)
   - "Referral — Merchant": +20 | "Referral — Partner": +15 | "Website Form": +10 | "Live Transfer": +10 | "Google Ads": +5 | "UCC List": +5

8. **NSFs Last 3 Months** (bank health)
   - 0: +10 | 1-3: 0 | 4-7: -5 | 8-12: -15 | > 12: -25

9. **Urgency** (buying signal)
   - "ASAP (24-48 hours)": +15 | "This Week": +10 | "Next 2 Weeks": +5 | "This Month": 0 | "Just Exploring": -5

10. **Negative Days Last 3 Months** (bank health)
    - 0: +5 | 1-3: 0 | 4-7: -5 | > 7: -15

11. **Entity Type**
    - LLC|C-Corp|S-Corp: +5 | Sole Proprietorship: -5

**Score Tiers:**
- 90+: A+ Lead → Call within 2 min
- 70-89: A Lead → Call within 15 min
- 50-69: B Lead → Call within 1 hour
- 30-49: C Lead → Call within 4 hours
- 10-29: D Lead → Call when free
- < 10: F Lead → Restricted industry or very weak

**Scope:** All Leads where `Lead_Status != 'Do Not Contact'`

---

## 10. TIB Band Classification

**Trigger:** Daily job  
**Module:** Accounts  
**Target field:** `TIB_Band` (check `read_only` flag at startup)

Calculate months from `Date_Business_Started` to today:

```js
function getTibBand(dateStarted) {
  const start = new Date(dateStarted);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());

  if (months >= 24) return '2+ Years';
  if (months >= 12) return '1-2 Years';
  if (months >= 6) return '6-12 Months';
  if (months >= 4) return '4-6 Months';
  return 'Under 4 Months';
}
```

**Scope:** All Accounts where `Date_Business_Started is not null`

**Note:** If `TIB_Band` is read-only (formula field), job logs warning and skips. Calculations become formula-driven.

---

## 11. Days Lead to Fund

**Trigger:** Daily job + on demand (catch-up)  
**Module:** Deals  
**Target field:** `Days_Lead_to_Fund` (writable Number)

```
Days_Lead_to_Fund = calendar days from Deal.Created_Time to Deal.Date_Funded
```

Calculated when Funding is created (in Step 4), and back-filled for any Funded deals missing this field.

```js
const created = new Date(deal.Created_Time);
const funded = new Date(deal.Date_Funded);
const days = Math.round((funded - created) / 86400000);
```

**Scope:** All Deals where `Stage = 'Funded'` AND `Date_Funded is not null` AND `Days_Lead_to_Fund is null`

---

## 12. Business Funding History Update

**Trigger:** When Funding record is created from a Funded Deal  
**Module:** Accounts  
**Fields updated:**
- `Total_Times_Funded`: incremented by 1
- `Total_Funded_Amount_Lifetime`: sum of all funded amounts
- `First_Funded_Date`: set on first funding (not overwritten)
- `Last_Funded_Date`: updated to today

**Process:**
1. Create Funding record
2. Query Account: `SELECT id, Total_Times_Funded, Total_Funded_Amount_Lifetime, First_Funded_Date`
3. Calculate: `timesF = (current || 0) + 1`, `totalAmt = (current || 0) + Deal.Funded_Amount`
4. Update Account with new values

---

## 14. Daily Automation Job

**Schedule:** Every morning at 8:00 AM  
**Runs in order:**

1. Send Application Confirmation emails (step 8 — ✅ READY via SMTP)
2. Calculate TIB Bands on Accounts (step 10)
3. Calculate Payback for all qualifying Deals
4. Calculate Commission for all qualifying Deals
5. Create Funding for all Funded Deals that are missing one (includes steps 11-12)
6. Create Renewal for all Fundings that are missing one
7. Run Renewal Eligibility Check
8. Catch-up: fill Days_Lead_to_Fund for any Funded deals missing it (step 11)

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
