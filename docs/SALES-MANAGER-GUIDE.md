# Sales Manager Guide

**For:** Sales managers overseeing reps, approving deals, and tracking pipeline  
**System:** Zoho Commera (CRM, WorkDrive, Cliq, Sign)  
**Last Updated:** April 2026

---

## Morning Dashboard Checklist (8:15 AM)

Start your day with this 10-minute routine to stay on top of pipeline and rep performance.

### Step 1: Confirm Automation Ran
1. Open **Cliq** → navigate to **#ops-automation** channel
2. Look for the morning summary message (typically posted by 8:10 AM)
3. Review the job summary line:
   - **Format:** `{job-name}: N updated, N skipped, N errors`
   - **Healthy:** "N updated" > 0 and "N errors" = 0
   - **Normal:** "N skipped" > 0 (idempotency working)
   - **Alert:** "N errors" > 0 → escalate to Admin immediately

**Automation jobs that run each morning:**
- `lead-assign` — assigns new leads to reps round-robin
- `funding-auto-create` — creates Funding records when Deal moves to "Funded"
- `renewal-auto-create` — creates Renewal records 24h after Funding created
- `stalled-deals-check` — flags deals inactive 7+ days

### Step 2: Run All 5 CRM Reports
1. Open **CRM** → left sidebar → **Reports**
2. Run each report below in order; take 2-3 minutes per report

| Report | Purpose | Check For |
|--------|---------|-----------|
| Pipeline by Stage | Deal value bottleneck | Where is pipeline stuck? |
| Funded This Month | Monthly revenue tracking | On track to quota? |
| Renewal Pipeline | Future revenue opportunity | How many at 50%+ paydown? |
| Rep Performance | Individual 90-day metrics | Who's top/bottom performer? |
| Stalled Deals | Deals inactive 7+ days | What needs immediate action? |

### Step 3: Review Stalled Deals
1. Open **Stalled Deals** report (from Step 2)
2. For each deal inactive 7+ days:
   - **Assign immediate follow-up:** Set Owner to rep → add task due today
   - **OR mark Dead:** Change Stage to "Dead" → document reason in Notes
3. Do not leave deals in stalled state longer than 24h

### Step 4: Check Renewal Pipeline
1. Open **Renewal Pipeline** report (from Step 2)
2. Filter for renewals at **50%+ paydown** (original funding amount paid back 50%)
3. Note which merchants are approaching renewal window
4. Alert reps: "Merchant X (Rep Y) hits 50% paydown next week — prepare renewal proposal"

---

## Running the 5 CRM Reports

Each report provides critical insight. Here's how to interpret them.

### Report 1: Pipeline by Stage

**What it shows:** Deal count and total value by Stage

**Fields to read:**
- **Stage** (left column): "Lead", "Qualified", "Submitted", "Stips Clearing", "Dead"
- **Count** (middle): number of deals in that stage
- **Total Value** (right): sum of all funding amounts in that stage

**What to look for:**
- **Bottleneck:** Which stage has highest count relative to velocity? (e.g., 20 deals stuck in "Submitted" = slow underwriting)
- **Pipeline health:** Healthy pipeline has deals distributed across stages; too many in one stage = risk
- **Dead deals:** If "Dead" stage is high, team may be setting poor-fit leads (discuss with reps)

**Action:**
- If "Stips Clearing" > 10: 3-4 deals are close to funding → prep approval batch
- If "Submitted" is growing: underwriting is slow → check with Lender contacts
- If "Lead" > 20: reps may be over-prospecting → ensure quality qualification

---

### Report 2: Funded This Month

**What it shows:** Revenue generated this month (Month-to-Date total funded amount)

**Fields to read:**
- **Month** (left): current month
- **Total Funded** (right): sum of all Deal Funded Amount fields

**What to look for:**
- **vs. Quota:** Is MTD total >= (target quota ÷ 12 months)?
- **Velocity:** If it's mid-month and at 70% of quota, on track; if at 30%, behind
- **Rep distribution:** Ideally funded deals spread across multiple reps (healthy diversification)

**Action:**
- If on track: celebrate with team
- If behind 20%+: schedule urgent meeting with top 3 reps → identify blockers
- If 1 rep is 80% of revenue: over-reliance risk → discuss pipeline with other reps

---

### Report 3: Renewal Pipeline

**What it shows:** All active Fundings and their paydown status

**Fields to read:**
- **Merchant** (left): company name
- **Original Funded Amount** (middle-left): initial funding given
- **Paydown (%)**
  - **0-25%:** Early stage, not ready for renewal conversation
  - **50%+:** Ready for renewal discussion
  - **90%+:** Renewal should be in "Submitted" stage now
- **Days Since Funded** (right): aging of original deal

**What to look for:**
- **At 50-75% paydown:** Open renewal proposal conversations; prep deal in CRM
- **At 90%+ paydown:** Should already be in "Stips Clearing" or "Funded" stage; if not, escalate
- **Oldest fundings (300+ days):** If below 50% paydown, merchant may be in distress → reach out directly

**Action:**
- Create list of merchants at 50%+ paydown
- Email reps: "X, Y, Z merchants eligible for renewal — open proposals this week"
- For any at 90%+ NOT in pipeline: call rep immediately — "Why isn't Merchant Z being renewed?"

---

### Report 4: Rep Performance

**What it shows:** Individual rep metrics for last 90 days

**Fields to read:**
- **Rep Name** (left)
- **Count of Funded Deals** (middle-left): how many deals funded in 90 days
- **Total Funded Amount** (middle): sum of funded dollars (productivity)
- **Avg Days to Fund** (right): average time from Deal creation to "Funded" stage

**Interpreting the metrics:**

| Metric | High | Low | Meaning |
|--------|------|-----|---------|
| **Count** | 8+ deals | 2-3 deals | Rep is closing many deals OR rep is new/struggling |
| **Total $ Amount** | $200K+ | <$50K | High-value deals or small deals |
| **Avg Days to Fund** | 15 days | 35+ days | Fast converter (efficient process) OR slow (underwriting delays) |

**Healthy rep profile:**
- **Count:** 4-6 deals per 90 days
- **Total Amount:** $80K-$150K (depends on avg deal size)
- **Avg Days:** 20-25 days to fund

**Action:**
- **Top performer (high count, low avg days):** recognize in team meeting, ask to mentor others
- **High dollar performer (high total amount, fewer deals):** likely closing bigger deals, valuable
- **Low performer (count < 2 or avg days > 40):** schedule 1-on-1 → identify blocker (prospecting, qualification, underwriting issue)
- **New rep (low metrics):** expected first 30 days; by day 90 should show improvement

---

### Report 5: Stalled Deals

**What it shows:** All deals inactive (no status update) for 7+ days

**Fields to read:**
- **Deal Name** (left): merchant + funding amount
- **Current Stage** (middle-left)
- **Days Inactive** (middle-right): how long since last activity
- **Owner** (right): assigned rep

**What to look for:**
- **Days Inactive 7-14:** Gentle nudge needed (rep may have forgotten, lender delayed response)
- **Days Inactive 15+:** Immediate escalation (deal likely abandoned or merchant issue)
- **Stage analysis:**
  - If in "Submitted": likely underwriting delay → follow up with Lender
  - If in "Qualified": rep may not have moved forward → reassign or discuss blocker
  - If in "Stips Clearing": missing stips or lender sign-off → escalate to Admin/Lender

**Action:**
- Add task to rep's queue: "Call Merchant X — stalled 10 days, clarify status"
- If stalled 20+ days: move to "Dead" and document reason (e.g., "Merchant declined", "Rep unresponsive")
- Do not let deals sit inactive > 30 days without decision

---

## Reviewing Rep Performance

Use the **Rep Performance** report (above) combined with this framework to give constructive feedback.

### Weekly Review Cadence

**Every Friday at 4 PM:**
1. Run the **Rep Performance** report
2. Compare this week vs. last week (are fundlings accelerating?)
3. Identify top 2 and bottom 2 performers
4. Schedule brief 1-on-1s with bottom performers for Monday

### Key Conversations

**With top performers:**
```
"X, you've funded 6 deals in 90 days with avg 18 days to fund.
That's well above team average. How are you qualifying leads so well?
Can you share your process with the team at next meeting?"
```

**With middle performers:**
```
"Y, you're at 4 deals / 22 avg days to fund.
That's solid. What's one thing we could do to get you to 5+ deals/quarter?
More leads? Better qualification? Faster underwriting?"
```

**With struggling performers:**
```
"Z, I see 2 funded deals in 90 days vs. team average of 4.
What's your biggest blocker right now?
Is it: lead volume, qualification rate, or time in underwriting?
Let's solve this together."
```

### Metrics to Watch Monthly

| Metric | Healthy | At Risk | Action |
|--------|---------|---------|--------|
| **Avg Days to Fund (team)** | 20-25 days | 35+ days | Review underwriting delays |
| **Funded Deal Count (rep)** | 4-6 per 90 days | <2 per 90 days | 1-on-1, identify blocker |
| **Total Funded $ (team)** | On pace to quota | Behind 20%+ | All-hands strategy session |
| **Dead Deal %** | <10% of pipeline | >15% | Discuss lead quality with reps |

---

## Approving Deals for Funding

Your approval is the final gate before money flows. Follow this checklist strictly.

### When to Approve

A deal is ready for approval when it reaches stage **"Stips Clearing"** (lender approved, all requirements met).

### Pre-Approval Checklist

Before moving a deal to "Funded", verify ALL items:

**☐ Contract signed and in WorkDrive**
- Go to Deal → WorkDrive tab
- Verify **signed contract** file exists and is labeled "Contract - SIGNED"
- If contract missing: return to "Submitted", ask rep to upload

**☐ All stips cleared**
- Go to Deal → Stips module (left sidebar)
- View all Stips rows
- Verify **ALL** rows show Status = **"Received"** (not "Pending", not "Awaiting")
- If any stip pending: stay in "Stips Clearing", do not approve yet
- If all received: good to proceed

**☐ Lender confirmed funding date**
- Go to Deal → Notes field
- Look for recent comment from Lender contact confirming: "Funding scheduled for DATE"
- If not present: email Lender asking: "Can you confirm funding date for Merchant X?"
- Wait for confirmation before approving

**☐ Funded Amount and Date Funded populated**
- Go to Deal → scroll to Fields
- **Funded Amount** field: must be > 0 (e.g., $25,000)
- **Date Funded** field: must be filled with funding date (or use today's date if funding immediately)
- If either missing: ask rep to populate before you approve

### Approval Process

Once all 4 items checked:

1. Open Deal record
2. Click **Stage** dropdown (top right)
3. Select **"Funded"**
4. Click **Save**

**What happens automatically (within 24 hours):**
- ✅ Funding record created (tracks paydown)
- ✅ Renewal record created (24h later, for future renewal tracking)
- ✅ Celebration email sent to rep
- ✅ Merchant notification email sent (if configured)

### Rejection / Hold

If any checklist item fails:

1. **Don't approve** — keep Stage at "Stips Clearing"
2. **Add task** to rep: "Contract missing from WorkDrive — upload signed copy"
3. **Set due date** to tomorrow
4. **Comment on deal:** "Held pending contract upload"
5. **Follow up next day** to confirm fix, then re-approve

---

## Managing Lead Assignment

Leads flow into your CRM automatically. Here's how they're assigned and how to adjust.

### Lead Assignment Process

**Every morning at 8:00 AM:**
- `lead-assign` automation job runs
- All new leads (created since yesterday 8 AM) are assigned **round-robin** to active reps
- Rep receives email immediately: "New Lead: Merchant X (Industry: Retail)"

**Round-robin means:**
- Rep 1 gets first lead, Rep 2 gets second, Rep 3 gets third, etc.
- Cycles through all active reps fairly
- Ensures no one rep is overloaded

### Manual Reassignment

If a lead is assigned to the wrong rep or needs to be rebalanced:

1. Open **CRM** → **Leads** module
2. Find the Lead record
3. Click **Owner** field (right side, top)
4. Select different Rep from dropdown
5. Click **Save**

**Example scenarios for reassignment:**
- Lead is geo-specific (New York) → assign to East Coast rep
- Rep called in sick → reassign their new leads to backup rep
- Lead is former customer of Rep Y → assign to Rep Y for relationship

### Lead Qualification Metrics

From the **Pipeline by Stage** report, track:
- **Leads assigned per day:** healthy = 3-5 per day
- **Lead → Qualified conversion:** healthy = 30-40% convert within 7 days
- **Leads aging:** if >10 leads in "Lead" stage >14 days old, reps not following up

**Action:** If conversion low, ask reps: "Are you qualifying or just passing on all leads?"

---

## Interpreting Automation Summaries

Every morning, Cliq **#ops-automation** channel gets a summary. Here's what it means.

### Message Format

```
lead-assign: 4 updated, 0 skipped, 0 errors
funding-auto-create: 2 updated, 1 skipped, 0 errors
renewal-auto-create: 0 updated, 2 skipped, 0 errors
stalled-deals-check: 8 updated, 15 skipped, 0 errors
```

### Interpreting Each Job

#### lead-assign: 4 updated, 0 skipped, 0 errors
- **4 updated:** 4 new leads were assigned to reps this morning ✅
- **0 skipped:** no duplicates detected (idempotency working)
- **0 errors:** all assignments successful ✅

**Action:** None — healthy

---

#### funding-auto-create: 2 updated, 1 skipped, 0 errors
- **2 updated:** 2 Deals moved to "Funded" → 2 Funding records created ✅
- **1 skipped:** 1 Deal already had Funding (duplicate prevention) ✅
- **0 errors:** both Funding creations successful ✅

**Action:** None — healthy. Check Cliq for celebration (2 deals funded!)

---

#### renewal-auto-create: 0 updated, 2 skipped, 0 errors
- **0 updated:** no new Renewals created (no Funding records were 24h old yesterday)
- **2 skipped:** 2 Fundings already have Renewal records
- **0 errors:** no failures ✅

**Action:** None — healthy. Low volume is normal (depends on how many funded 24h ago)

---

#### stalled-deals-check: 8 updated, 15 skipped, 0 errors
- **8 updated:** 8 deals flagged as "Stalled" (inactive 7+ days) ✅
- **15 skipped:** 15 deals already flagged from yesterday (not re-flagging)
- **0 errors:** flagging successful ✅

**Action:** Review the 8 newly flagged deals, assign follow-up tasks

---

### Error Scenarios

#### Example: funding-auto-create: 0 updated, 0 skipped, 1 error
- **Problem:** 1 Funding record FAILED to create
- **Cause:** Usually missing required field on Deal (Funded Amount, Owner, etc.)
- **Action:** 
  1. Check #ops-automation for error details
  2. Open Deal record that failed
  3. Verify all required fields populated
  4. Contact Admin if you can't identify issue
  5. Job will retry automatically tomorrow

#### Example: lead-assign: 0 updated, 0 skipped, 5 errors
- **Problem:** 5 lead assignments FAILED
- **Cause:** Likely inactive reps in the round-robin list, or CRM permissions issue
- **Action:**
  1. Contact Admin immediately
  2. Ask: "Which reps are inactive? Are there permission issues?"
  3. Do not proceed with manual assignments until fixed
  4. Job will retry automatically tomorrow

### All Zeros (0, 0, 0)

```
renewal-auto-create: 0 updated, 0 skipped, 0 errors
```

- **Meaning:** No new Funding records qualified for Renewal creation (none were exactly 24h old)
- **Normal?** YES — this is expected on days with low funding volume
- **Action:** None required

---

## Quick Reference

### Daily Checklist
- [ ] Check #ops-automation summary (8:15 AM)
- [ ] Run 5 CRM reports (8:20 AM)
- [ ] Review Stalled Deals (8:30 AM)
- [ ] Check Renewal Pipeline (8:35 AM)
- [ ] Assign follow-ups as needed (8:40 AM)

### Weekly Checklist (Friday 4 PM)
- [ ] Run Rep Performance report
- [ ] Identify top 2 / bottom 2 performers
- [ ] Schedule 1-on-1s with struggling reps

### When Approving Deals
- [ ] Contract signed in WorkDrive
- [ ] All stips Status = "Received"
- [ ] Lender confirmed funding date
- [ ] Funded Amount and Date Funded fields filled
- [ ] Move to "Funded" → automation handles rest

### Escalation Path
- **Report issue:** Comment on Deal or Cliq #ops-automation
- **Need immediate help:** Contact Admin
- **Questions about process:** Check this guide or ask senior manager

---

## Support

**Questions about:**
- **CRM reports or deals:** Check "Running the 5 CRM Reports" section above
- **Rep performance:** Review "Reviewing Rep Performance" section
- **Automation failures:** Review "Interpreting Automation Summaries" section
- **System issues:** Contact Admin in Cliq #ops-automation

**Last updated:** April 2026  
**Version:** 1.0
