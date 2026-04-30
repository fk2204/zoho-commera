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
5. Lender Matching for all qualifying Deals
6. Create Funding for all Funded Deals that are missing one (includes steps 11-12)
7. Create Renewal for all Fundings that are missing one
8. Run Renewal Eligibility Check
9. Catch-up: fill Days_Lead_to_Fund for any Funded deals missing it (step 11)
10. Calculate Lead Assignment based on scoring and capacity
11. Commission Invoice Creation (Books) — **NEW**
12. Merchant Welcome Ticket (Desk) — **NEW**
13. Add Lead to Nurture Campaign (Campaigns) — **NEW**
14. Funding Onboarding Project (Projects) — **NEW**

**Rules:**
- Each step runs independently — one step failing does not stop the rest
- Log a summary at the end: X processed, Y skipped, Z errors
- Store last run time in `.automation-state.json`
- Each step queries only records modified since the last run time (except idempotency-checked steps which always do a full check)

---

## 15. Commission Invoice Creation (Books)

**Trigger:** `Funding.Commission_Amount > 0` AND `Funding.Books_Invoice_ID is null`  
**Runs:** Daily job (step 11 of 14)  
**Module:** Fundings → Books
**Creates:** 1 Books invoice per qualifying Funding

**Idempotency:**
- Reference number format: `"CMR-" + Funding.id` (must be unique in Books org)
- Check Books: `SELECT id FROM Invoices WHERE reference_number = 'CMR-{fundingId}'`
- Store created invoice ID in: `Funding.Books_Invoice_ID` field (prevents duplicate creation)

**Invoice Details:**
- Customer: `ZOHO_BOOKS_COMMISSION_CUSTOMER_ID` (from `.env`, typically "Commission Collection" or similar)
- Reference Number: `CMR-{Funding.id}`
- Amount: `Funding.Commission_Amount` (dollar value, not percentage)
- Description: `"Commission for Funding: " + Funding.Deal_Name or Funding.Merchant_Name`
- Status: Draft (ready for review before sending)

**Field Requirements (in CRM):**
- `Books_Invoice_ID` field on Fundings module (text/lookup, stores invoice ID)
- `Commission_Amount` field (numeric, dollar amount)

**Environment Variables Required:**
- `ZOHO_BOOKS_ORG_ID` (Books organization ID for this tenant)
- `ZOHO_BOOKS_COMMISSION_CUSTOMER_ID` (pre-configured customer in Books for collecting commissions)

**Process:**
1. Query Fundings: `SELECT id, Commission_Amount, Deal_Name, Books_Invoice_ID FROM Fundings WHERE Commission_Amount > 0 AND Books_Invoice_ID = null`
2. For each Funding:
   a. Check idempotency: does invoice with `reference_number = "CMR-{fundingId}"` already exist?
   b. If yes, update `Funding.Books_Invoice_ID` with the existing invoice ID and skip
   c. If no, create invoice in Books with fields above
   d. Store returned `invoice.invoice_id` in `Funding.Books_Invoice_ID`
   e. Log: created invoice ID

**Preconditions:**
- `Books_Invoice_ID` field exists and is writable on Fundings
- Books customer with ID `ZOHO_BOOKS_COMMISSION_CUSTOMER_ID` exists
- `ZOHO_BOOKS_ORG_ID` is set in `.env`

**Rules:**
- Never write zero or negative amounts to Books
- If Books API fails, log error + Funding ID, continue to next Funding (do not stop)
- Do not create invoice if `Funding.Commission_Amount` has no value

---

## 16. Merchant Welcome Ticket (Desk)

**Trigger:** `Deal.Stage IN ['New', 'Contacted / Discovery']` AND `Deal.Desk_Ticket_ID is null`  
**Runs:** Daily job (step 12 of 14)  
**Module:** Deals → Desk  
**Creates:** 1 Desk support ticket per qualifying Deal

**Idempotency:**
- Store created ticket ID in: `Deal.Desk_Ticket_ID` field (prevents duplicate creation)
- Check Desk: `SELECT id FROM Tickets WHERE cf_crm_deal_id = '{dealId}'` (using custom field)

**Ticket Details:**
- Subject: `"Welcome: " + Deal.Deal_Name + " (Merchant: " + Deal.Account_Name + ")"`
- Category: "New Merchant Onboarding" (or pre-configured category ID from `.env`)
- Status: Open
- Priority: Normal
- Description: Template containing:
  - Deal name, amount, stage
  - Merchant contact info (email, phone from linked Account/Contact)
  - Merchant owner (from Contact)
  - Deal link to CRM
- Custom field `cf_crm_deal_id`: `Deal.id` (for linking back to CRM)

**Field Requirements (in CRM):**
- `Desk_Ticket_ID` field on Deals module (text/lookup, stores ticket ID)

**Field Requirements (in Desk):**
- Custom field `cf_crm_deal_id` on Ticket layout (text, stores Deal.id for bi-directional linking)

**Environment Variables Required:**
- `ZOHO_DESK_ORG_ID` (Desk organization ID for this tenant)
- Optional: `ZOHO_DESK_ONBOARDING_CATEGORY_ID` (pre-configured ticket category; if not set, use "New Merchant Onboarding")

**Process:**
1. Query Deals: `SELECT id, Deal_Name, Account_Name, Stage, Amount, Contact_Name FROM Deals WHERE Stage IN ('New', 'Contacted / Discovery') AND Desk_Ticket_ID = null`
2. For each Deal:
   a. Check idempotency: does Desk ticket with `cf_crm_deal_id = "{dealId}"` exist?
   b. If yes, update `Deal.Desk_Ticket_ID` with the existing ticket ID and skip
   c. If no, create ticket in Desk with fields above
   d. Store returned `ticket.id` in `Deal.Desk_Ticket_ID`
   e. Log: created ticket ID

**Preconditions:**
- `Desk_Ticket_ID` field exists and is writable on Deals
- Custom field `cf_crm_deal_id` exists on Desk Ticket layout
- `ZOHO_DESK_ORG_ID` is set in `.env`

**Rules:**
- If Desk API fails, log error + Deal ID, continue to next Deal (do not stop)
- Include merchant contact info in ticket description (helps support team)
- Link bidirectionally: Desk ticket stores Deal ID; Deal stores Ticket ID
- Only create for New or Contacted / Discovery stages (not Qualified, Funded, etc.)

---

## 17. Add Lead to Nurture Campaign (Campaigns)

**Trigger:** `Lead.Email is not null` AND `Lead.Campaigns_Added is null` AND `Lead.Lead_Status != 'Do Not Contact'`  
**Runs:** Daily job (step 13 of 14)  
**Module:** Leads → Campaigns  
**Action:** Add lead to mailing list based on Lead_Scores

**Mailing List Selection:**
- `Lead_Scores >= 70` → Add to: `ZOHO_CAMPAIGNS_LIST_HOT` (hottest leads, nurture with premium content)
- `Lead_Scores 30-69` → Add to: `ZOHO_CAMPAIGNS_LIST_NURTURE` (general nurture, educational content)
- `Lead_Scores < 30` → Add to: `ZOHO_CAMPAIGNS_LIST_LOW` (low engagement, stay-in-touch content)

**Field Requirements (in CRM):**
- `Campaigns_Added` field on Leads module (date, stores today's date when lead added to campaign)
- `Lead_Scores` field on Leads module (read-only, set by Zoho Scoring Rules — never write to this)
- `Lead_Status` field (picklist)

**Environment Variables Required:**
- `ZOHO_CAMPAIGNS_LIST_HOT` (Campaigns list key for high-score leads, e.g., "hot_leads_2025")
- `ZOHO_CAMPAIGNS_LIST_NURTURE` (Campaigns list key for mid-score leads, e.g., "nurture_funnel_2025")
- `ZOHO_CAMPAIGNS_LIST_LOW` (Campaigns list key for low-score leads, e.g., "stay_in_touch_2025")

**Process:**
1. Query Leads: `SELECT id, Email, Lead_Scores, Campaigns_Added, Lead_Status FROM Leads WHERE Email != null AND Campaigns_Added = null AND Lead_Status != 'Do Not Contact'`
2. For each Lead:
   a. Determine tier based on `Lead_Scores`:
      - `>= 70` → list key = `ZOHO_CAMPAIGNS_LIST_HOT`
      - `30-69` → list key = `ZOHO_CAMPAIGNS_LIST_NURTURE`
      - `< 30` → list key = `ZOHO_CAMPAIGNS_LIST_LOW`
   b. Add lead to Campaigns list using Campaigns API: `POST /lists/{listKey}/contacts`
      - Body: `{ "email": Lead.Email, "first_name": Lead.First_Name, "last_name": Lead.Last_Name }`
   c. Update `Lead.Campaigns_Added = today` (idempotency marker)
   d. Log: added lead ID to which list

**Idempotency:**
- `Campaigns_Added` field stores date of addition — prevents re-adding
- Campaigns API: if contact already in list, returns success (idempotent)
- If update to `Campaigns_Added` fails but contact was added, manually set the field

**Preconditions:**
- `Campaigns_Added` field exists and is writable on Leads
- `Lead_Scores` field is readable (read-only, computed by Zoho)
- 3 Campaigns lists exist with list keys in `.env`
- All 3 `.env` variables set: `ZOHO_CAMPAIGNS_LIST_HOT`, `ZOHO_CAMPAIGNS_LIST_NURTURE`, `ZOHO_CAMPAIGNS_LIST_LOW`

**Important Notes:**
- `Lead_Scores` is READ-ONLY — never attempt to write to it (managed by Zoho Scoring Rules)
- Score tiers are for segmentation, not filtering — a single lead gets added to exactly one list
- Leads with `Lead_Status = 'Do Not Contact'` are excluded (respects user preference)
- If a lead is already in multiple lists (e.g., manually added), do not remove — just mark `Campaigns_Added`

**Rules:**
- If Campaigns API fails, log error + Lead ID, continue to next Lead (do not stop)
- If multiple lists have the same key, Campaigns API will deduplicate
- Contact addition to list is based on email — if lead changes email, manually update Campaigns

---

## 18. Funding Onboarding Project (Projects)

**Trigger:** `Funding.Funding_Status = 'Active'` AND `Funding.Projects_Project_ID is null`  
**Runs:** Daily job (step 14 of 14)  
**Module:** Fundings → Projects  
**Creates:** 1 Projects project + 6 standard tasks per qualifying Funding

**Idempotency:**
- Store created project ID in: `Funding.Projects_Project_ID` field (stores `project.id_string`, NOT `project.id`)
- Check Projects: `SELECT id FROM Projects WHERE name = 'Onboarding: {Funding.id_string}'` or similar unique identifier

**Project Details:**
- Name: `"Onboarding: " + Funding.id_string + " (" + Funding.Merchant_Name + ")"`
- Description: `"Merchant onboarding for Funding [id] - Amount: $[amount] - Started: [today]"`
- Status: In Progress
- Start Date: Today
- Owner/Lead: Assigned to deal owner or configurable team member

**6 Standard Tasks (created on project, in order):**

| Task | Description | Due (days from today) |
|------|-------------|----------------------|
| 1. Collect signed contract | Review and file signed contract from merchant | +1 |
| 2. Verify bank account for ACH | Confirm merchant ACH details for funding disbursement | +1 |
| 3. Confirm first payment date with merchant | Schedule and confirm first payment date for repayment schedule | +2 |
| 4. Send welcome kit to merchant | Deliver welcome package (physical or digital) with resources | +3 |
| 5. Follow up: confirm funds received | Verify merchant received funding and no issues with deposit | +5 |
| 6. Schedule 30-day check-in call | Book and confirm 30-day check-in call with merchant | +30 |

**Task Creation Details:**
- All tasks assigned to same owner as project
- Status: Not Started (for all tasks initially)
- Priority: Normal
- Milestone: "Onboarding" (if available, optional)

**Field Requirements (in CRM):**
- `Projects_Project_ID` field on Fundings module (text/lookup, stores `project.id_string` — **not** `project.id`)

**Environment Variables Required:**
- `ZOHO_PROJECTS_PORTAL_ID` (Projects portal ID for this tenant)

**Process:**
1. Query Fundings: `SELECT id, id_string, Funding_Status, Merchant_Name, Amount FROM Fundings WHERE Funding_Status = 'Active' AND Projects_Project_ID = null`
2. For each Funding:
   a. Check idempotency: does project with matching `name` or `Funding.id_string` exist?
   b. If yes, update `Funding.Projects_Project_ID` with the existing project's `id_string` and skip
   c. If no, create project in Projects with fields above
   d. Store returned `project.id_string` (not `project.id`) in `Funding.Projects_Project_ID`
   e. Create 6 tasks on the project with due dates as specified
   f. Log: created project ID + 6 task count

**Preconditions:**
- `Projects_Project_ID` field exists and is writable on Fundings
- Field stores `project.id_string` (string identifier), not `project.id` (numeric)
- `ZOHO_PROJECTS_PORTAL_ID` is set in `.env`
- Projects portal exists and is accessible

**Rules:**
- Use `id_string` (the unique string identifier), not `id` (numeric) — Projects API returns both, store the string version
- If Projects API fails, log error + Funding ID, continue to next Funding (do not stop)
- All 6 tasks are mandatory — if any fail, log error but continue
- Due dates are calendar days from today — use `new Date().setDate(today.getDate() + offset)`
- Task order matters (tasks are created in sequence 1-6)

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
