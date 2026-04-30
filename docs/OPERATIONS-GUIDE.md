# Commera MCA Operations Guide

Your daily reference for managing funding processes, coordinating with lenders, tracking merchant repayment, and running automation safely.

---

## Processing Stipulations

**What are stips?** Conditions the lender requires before approving funding. Examples: merchant bank statements, tax returns, UCC searches, personal guarantees.

### Creating a Stipulation

1. **Open the Deal** in Zoho CRM → Stips tab → New Stip
2. **Fill required fields:**
   - **Type** — select from list: Tax Return, Bank Statements, UCC Search, Personal Guarantee, 3-Month Bank Statements, YTD P&L, Business License, Voided Check, SBA Approval, Other
   - **Due Date** — when lender needs it back
   - **Priority** — Urgent / Normal / Low
   - **Description** (optional) — specific instructions (e.g., "Last 2 years, signed")
3. **Save** — Stip appears on Deal record

### Tracking Stip Status

- **New** — Just created, waiting on merchant
- **Pending Review** — Merchant provided, lender reviewing (manually set if needed)
- **Received** — Merchant delivered, all conditions met
  - Date Received → auto-populated when Status → "Received"
  - **Deal cannot advance to Funded until all stips are Received**

### When Merchant Delivers a Stip

1. **Check the stip folder** in WorkDrive (`Stips/[DealID]/`)
2. **Update Stip record:** Status → "Received", **verify Date Received is auto-populated**
3. **Comment on Stip** if follow-up is needed (e.g., "Need notarized copy, this one is unsigned")
4. **Check all stips** before saying deal is ready for funding:
   - Open Deal → Stips tab
   - Scan Status column — all must show "Received" or N/A
   - If any "New" or "Pending Review" → remind merchant

---

## Creating Offers from Lenders

**What is an Offer?** The lender's final proposal: amount, interest rate (shown as factor rate), term, commission percentage, and expiration.

### Recording a Lender Offer

1. **Open the Deal** → Offers tab → New Offer
2. **Fill lender details:**
   - **Lender** — select from Lender module (auto-links if exists)
   - **Offered Amount** — USD, e.g., $50,000
   - **Factor Rate** — decimal (1.35 = 35% markup). Formula: `(Offered Amount + Payback Amount) / Offered Amount`
   - **Term** — months, e.g., 6
   - **Commission %** — your cut, e.g., 2.5
   - **Expiration Date** — when lender's offer expires (usually 3-5 days)
3. **Status** starts at "Pending Review" (you haven't presented to merchant yet)
4. **Save**

### When Offer Status Changes

- **Pending Review** → created, reviewing internally
- **Presented** — shown to merchant, waiting for response
  - Set this when you email merchant the offer
  - In notes: "Email sent to [merchant email] on [date]"
- **Accepted** — merchant signed (move Deal → Offers Received)
  - Copy offer PDF to WorkDrive (`Offers/[DealID]/`)
  - Update Deal Approved Amount, Factor Rate, Commission % fields
- **Declined** — lender retracted or merchant said no
  - Document reason in notes

### Multiple Offers on One Deal

**Typical workflow:**
1. Deal → Submitted to Lenders (3-5 lenders receive application)
2. Wait 24-48 hours
3. Offers arrive (1-3 offers usually)
4. Create 2-3 Offer records
5. Present best offer to merchant
6. Merchant accepts → move to Offers Received
7. Other lenders' offers → mark Declined (inform lender)

---

## Lender Coordination Workflow

### Before Submitting to Lenders

**Checklist before sending application:**
- [ ] All stips at Deal level are collected
- [ ] Lender Match is determined (automated, check Deal.Lender overnight)
- [ ] Approved Amount estimate in Deal (for budget preview)
- [ ] Merchant email confirmed (for offer delivery)
- [ ] Contact on file (for lender follow-up)

### Submitting Application

1. **Download submission package** from WorkDrive (`[DealID]/Submission/`)
   - Includes: merchant personal guarantee, business documents, financials
2. **Email to lender** with subject: `MCA Application — [Merchant Name] — $[Amount Requested]`
3. **Back in Zoho:** Deal → **Stage → "Submitted to Lenders"** (triggers email to lender, updates Deal timestamp)
4. **Expected response:** 24-72 hours

### Lender Rejects Application

If lender returns error (bad docs, missing signature, etc.):
1. **Note rejection reason** in Deal Comments
2. **Fix documents** — re-upload to WorkDrive Submission/ folder
3. **Re-submit** — email lender again with corrected package
4. **If pattern repeats** — contact merchant directly to verify docs are correct (sometimes merchant provides bad versions)

### Lender Goes Silent (> 3 days)

1. **Send follow-up email** to lender (cc: manager)
2. **Log in Deal Comments** — "Follow-up sent [date], waiting response"
3. **If no response in 24 more hours** — escalate to manager or try alternate lender

---

## Managing Fundings & Renewals

### Funding Created Automatically

When Deal → **Funded**, the automation creates a Funding record with:
- Merchant linked
- Funding Amount = Deal Approved Amount
- Payback Amount = Approved Amount × Factor Rate
- Funded Date = today
- Status = Active
- Paydown = $0

**You don't create Fundings manually** — the automation does it. But you manage them daily.

### Tracking Daily Paydown

**Every morning**, check Fundings with Status = Active:
1. **Open Fundings module** → Filter: Status = Active, sort by Funded Date DESC
2. **For each Funding:**
   - Contact merchant: "How much have you paid back?" (phone call or email)
   - Update **Paydown** field with amount merchant has sent
   - Update **Last Payment Date** if merchant paid this month
3. **Example:** Merchant owes $68,750 (payback), has paid $25,000 so far
   - Paydown = $25,000
   - Remaining balance = $68,750 - $25,000 = $43,750
   - Payoff date estimate: $43,750 ÷ (avg daily payment) = estimate

### Automatic Renewal Eligibility

When Paydown ≥ 50% of Payback Amount:
- Automation creates a **Renewal** record automatically
- Merchant receives email: "Congrats, you may qualify for additional funding"
- Your job: **follow up with merchant** (call, not email)
  - Confirm merchant wants to refinance
  - Confirm revenue still strong
  - If yes → create new Deal for renewal funding

### Renewal Stages

- **Eligible** — meets criteria (50% payoff), waiting on merchant decision
- **Declined** — merchant not interested or revenue dropped
- **Approved** — merchant approved for refinance
- **Funded** — new funding delivered to merchant account

**Track Renewals separately** — they generate commissions and repeat the entire funnel (stips → offers → funding).

---

## Running Automation Manually

**The scheduler runs automatically daily at 8:00 AM.** But you can run any job on-demand if data is urgent or if merchant just submitted something.

### Running the Full Automation Sequence

```bash
cd C:\Users\fkozi\zoho commera
npm run run
```

This runs all 14 jobs in sequence:
1. sendApplicationConfirmation
2. tibBand
3. payback
4. commission
5. matchLenders
6. createFunding
7. createRenewal
8. renewalCheck
9. daysToFund
10. ledAssign
11. commissionInvoice
12. merchantTicket
13. addToNurture
14. fundingProject

**Typical output:**
```
2026-04-30 08:00:15 [info] Scheduler active. Next run: 2026-05-01 08:00:00
2026-04-30 08:00:16 [info] sendApplicationConfirmation: 3 processed, 0 skipped, 0 errors (124ms)
2026-04-30 08:00:18 [info] tibBand: 5 processed, 2 skipped, 0 errors (156ms)
...
2026-04-30 08:02:45 [info] fundingProject: 1 processed, 0 skipped, 0 errors (89ms)
2026-04-30 08:02:46 [info] All jobs complete. Total: 47 processed, 8 skipped, 0 errors (151s)
```

- **processed** = records that matched trigger criteria and were updated
- **skipped** = records already processed (idempotency — won't repeat)
- **errors** = records that hit an error and were skipped (investigate in audit.log)

### Running a Single Job

If only one record needs processing:

```bash
npm run commission-invoice
npm run merchant-ticket
npm run add-to-nurture
npm run funding-project
```

Or original 10 jobs (if they have npm scripts):

```bash
npm run send-confirmation
npm run tib-band
npm run calculate-payback
npm run calculate-commission
npm run match-lenders
# ... etc
```

### Dry-Run Mode (Safe Testing)

**Never run automation on production data without testing first.**

```bash
cross-env DRY_RUN=true npm run run
```

With `DRY_RUN=true`:
- All queries execute normally (reads from CRM)
- No writes happen (log only)
- No emails sent
- `audit.log` shows what WOULD have happened

**Use this when:**
- You just added new records to CRM and want to see if automation catches them
- You changed a field and want to verify automation uses it correctly
- You want to test before the 8 AM scheduler runs

---

## What to Do When Automation Errors

### Expected vs. Unexpected Errors

**Expected errors** (normal, not a problem):
- 0 processed + 0 errors = no records matched trigger (e.g., "no new leads" at 11 AM)
- N skipped > 0 = some records already processed (idempotency working correctly)
- 0 processed + 0 errors + 0 skipped = data looks complete, nothing to do

**Unexpected errors** (investigate immediately):
- processed > 0 AND errors > 0 = some records succeeded, some failed
- errors > 0 AND processed = 0 = something is broken
- Duplicate errors (same job failing repeatedly across 3 runs)

### Quick Diagnosis

1. **Check the Cliq message** in `#ops-automation` channel:
   - Shows which job errored and how many
   - Example: `fundingProject: 0 processed, 0 skipped, 1 error`

2. **Read `audit.log`** for details:
   ```bash
   tail -n 50 audit.log | grep fundingProject
   ```
   Example output:
   ```json
   {"time":"2026-04-30T08:02:44.123Z","op":"fundingProject","recordId":"fcf123abc","result":"error","message":"Project creation failed: MANDATORY_FIELD_MISSING","field":"project_name","raw":"Missing required field: project_name"}
   ```

3. **Find the problem record:**
   - Note the `recordId` from audit.log
   - Open Zoho CRM → Fundings → search by ID `fcf123abc`
   - Check the fields automation uses
   - Compare to what's in DATA_MODEL.md

### Common Errors & Fixes

| Error | Meaning | Fix |
|-------|---------|-----|
| `MANDATORY_FIELD_MISSING` | Automation tried to write a required field but it's empty | Fill the field in CRM, re-run |
| `INVALID_DATA` | Field value format is wrong (e.g., text in number field) | Correct field value in CRM, re-run |
| `RATE_LIMIT_EXCEEDED` | Hit Zoho API quota (usually temporary) | Wait 1 hour, automation will retry at next 8 AM run |
| `OAUTH_SCOPE_MISMATCH` | OAuth token doesn't have permission for this app | Run `npm run setup:oauth -- --full`, re-run automation |
| `DUPLICATE_DATA` | Idempotency stamp already set (normal, safe to ignore) | Not an error — record already processed, idempotency working |

### Re-Running After Fixing

**All automation jobs are idempotent.** Safe to re-run after fixing root cause.

1. Fix the problem in CRM (fill missing field, correct value, etc.)
2. Run the job again:
   ```bash
   npm run commission-invoice
   ```
3. Check audit.log for success:
   ```
   {"time":"2026-04-30T09:15:22.456Z","op":"commissionInvoice","recordId":"fcf123abc","result":"success","message":"Invoice created","invoiceId":"inv123"}
   ```
4. If still fails → document the error and contact Admin (may require API investigation)

### When to Contact Admin

**Only if:**
- Error code not in table above
- Same job fails 3 times in a row after fixes
- Error message suggests API bug (e.g., "internal server error", "unknown field")
- Scheduler crashed (Cliq channel goes silent for > 1 day)

**Info to provide Admin:**
- Which job errored
- Record ID from audit.log
- Error message (copy/paste from audit.log)
- What you fixed before re-running

---

## Scheduler Status & Alerts

### Daily Checklist

**Every morning at 8:15 AM**, verify automation ran:

1. **Check Cliq** — `#ops-automation` channel should have 14-job summary from ~8:00 AM
   - Example: `[08:00] Automation complete. 47 processed, 8 skipped, 0 errors`
   - If channel is SILENT (no message) → scheduler may have crashed

2. **Verify specific jobs** you care about:
   - Open audit.log: `tail -n 100 audit.log | grep merchantTicket`
   - Should show entries from today's 8:00 AM run
   - If nothing → scheduler didn't run or job failed

3. **Check new records in CRM:**
   - Zoho Desk: Any new tickets from welcome automation?
   - Zoho Books: Any new invoices from commission automation?
   - Zoho Campaigns: Any leads added to mailing lists?

### If Scheduler is Silent (No 8 AM Run)

**Step 1: Check if scheduler is online**
```bash
npm run scheduler:status
```

Expected output:
```
┌─────────┬──────┬──────────┬────────┬─────────┬────────┬─────────┐
│ id      │ name │ mode     │ status │ restart │ uptime │ command │
├─────────┼──────┼──────────┼────────┼─────────┼────────┼─────────┤
│ 0       │ commera-scheduler │ fork │ online │ 2      │ 3d     │ node    │
└─────────┴──────┴──────────┴────────┴─────────┴────────┴─────────┘
```

If status = **online** → scheduler is running, next 8 AM run will happen  
If status = **stopped** or missing → need to restart:
```bash
npm run scheduler:start
```

**Step 2: Check if the machine was off at 8 AM**
- Windows Task Manager → check system uptime
- If machine rebooted after 8 AM yesterday, scheduler missed yesterday's run
- Next run will be tomorrow at 8 AM
- **Workaround:** Manually run `npm run run` now

**Step 3: Check logs for errors**
```bash
npm run scheduler:logs
```

Shows last 50 lines from scheduler logs. Look for:
- `Scheduler active` = working normally
- `error` or `Error` = something crashed
- Timestamps → was 8 AM run attempted?

### If a Single Job Fails Repeatedly

1. **Run dry-run to see what would process:**
   ```bash
   cross-env DRY_RUN=true npm run [job-name]
   ```

2. **Check for pattern:**
   - Same record failing? → Fix that record in CRM
   - All records failing? → API permission or data structure problem
   - Random records? → Inconsistent data (investigate each case)

3. **Document & escalate:**
   - If you can't fix in 10 minutes → contact Admin with error details

---

## Tips for Success

- **Automate = less typing.** Let the jobs do the work, you focus on exceptions
- **Stips first, offers second.** Don't present offer if merchant hasn't delivered stips
- **Commission % matters.** Affects your revenue. Set correctly per lender agreement
- **Daily paydown calls.** Prevents surprises. Merchant may have paid more than they told you
- **Renewal = repeat sales.** When merchant hits 50% payoff, they're a hot lead again
- **Audit.log is your friend.** When something seems wrong, check audit.log first (shows everything)

