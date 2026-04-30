# Commera Sales Rep Guide

Welcome to Commera's CRM. This guide covers the daily workflow for managing leads, converting them to deals, and closing sales.

---

## Daily Morning Routine (8:15 AM)

After our overnight automation runs, start your day with these four checks:

1. **Check Cliq `#ops-automation` for alerts**
   - Read the channel feed from the last 12 hours
   - Look for deal status changes, lead assignments, lender matches
   - If something looks stuck or delayed, flag it

2. **Review the "Stalled Deals" report**
   - Open CRM → Reports → Stalled Deals
   - Filters for deals with zero activity in the last 7+ days
   - These are your priority recovery targets
   - Call/email each merchant to move them forward

3. **Check emails from applications@commerafunding.com**
   - New lead assignments arrive here with full merchant details
   - Deal alerts (e.g., "ready for final approval") arrive here
   - Read these emails immediately — they're time-sensitive

4. **Prioritize A+ Leads (Score 90+)**
   - Open CRM → Leads → filter by Lead Score ≥ 90
   - These are hot leads — call within 2 minutes of assignment
   - They have strong financials and high closing probability

---

## Creating a New Lead

When you get a new merchant on the phone or via application, create a lead in CRM.

### Step 1: Open New Lead Form
- Click **CRM** → **Leads** → **+ New Lead**
- You'll see required fields marked with red asterisks

### Step 2: Fill Required Fields

**Merchant Info:**
- **First Name** — Merchant's first name
- **Last Name** — Merchant's last name
- **Phone or Email** — At least one contact method (both is better)

**Business Financials:**
- **Monthly Revenue (USD)** — Average monthly card/ACH revenue
- **FICO Score** — Merchant's personal FICO score (300–850)
- **Industry** — Business category (Restaurants, Retail, Services, etc.)
- **Entity Type** — Sole Proprietor, LLC, Corporation, Partnership
- **Date Business Started** — When they opened (YYYY-MM-DD format)
- **Existing MCA Positions** — Number of existing merchant cash advances they currently owe
- **Requested Amount** — How much funding they want to borrow (USD)

### Step 3: Fill Optional Fields (High-Value Leads)

If this is a strong prospect, also fill:
- **Lead Source** — How you found them (Referral, Google, Social Media, Inbound, etc.)
- **Urgency** — High / Medium / Low (affects callback timing)
- **NSFs Last 3 Months** — Number of non-sufficient funds (bounced checks)
- **Negative Days Last 3 Months** — Days when bank balance dropped below zero

### Step 4: Save and Wait for Lead Score

- Click **Save**
- The system calculates Lead Score within 1 minute
- Check the **Lead Score** field — it appears automatically

### Lead Score Tiers (How Urgent?)

| Score | Action | Timing |
|-------|--------|--------|
| 90+ | Call immediately | Within 2 minutes |
| 70–89 | Schedule callback | Within 15 minutes |
| 50–69 | Add to daily queue | Within 1 hour |
| <50 | Lower priority | Next business day |

---

## Converting a Lead to a Deal

Once you've discussed terms with the merchant and they're interested, convert the lead into a deal.

### Step 1: Open the Lead
- Go to **CRM** → **Leads**
- Click on the lead name

### Step 2: Click Convert

- Look for the **Convert** button (usually top-right of the form)
- Click it
- The system will auto-create three linked records:
  - **Contact** — The merchant's personal contact
  - **Account** — The merchant's business account
  - **Deal** — The funding opportunity

### Step 3: Fill Account Fields

After conversion, the Account record opens. Fill in:
- **Monthly Revenue** — Confirm the amount from the lead
- **Date Business Started** — Confirm their business start date
- **Industry** — Confirm the business type
- **Billing State** — The state where their business operates

### Step 4: Fill Deal Fields

Then move to the **Deal** record. Fill in:
- **Stage** — Set to "New"
- **Amount** — Usually equals the Requested Amount from the lead
- **Deal Status** — Leave as default (will be managed by automation)

### Step 5: Save

- Click **Save**
- The deal is now in the pipeline

### Lender Matching Runs Overnight

- At 8:00 AM the next morning, our automation runs lender matching
- Check the **Deal.Lender** field in the afternoon
- The system auto-assigns the best lender based on FICO band, revenue, and amount
- If no lender matched, escalate to Admin (might be edge case)

---

## Moving a Deal Through the Pipeline

Every deal moves through 14 stages. Understanding the gates helps you know what's required.

### The 14 Stages

1. **New** — Just created, discovery phase starting
2. **Contacted** — You've called the merchant
3. **Discovery** — Gathering detailed financials, understanding their needs
4. **Application Sent** — Sent formal application to merchant
5. **Application Received** — Merchant returned signed application
6. **Documents Requested** — Asking for bank statements, tax returns, etc.
7. **Documents Received** — Got the documentation from merchant
8. **Submitted to Lender** — Sent full application to our lender
9. **Lender Review** — Lender is evaluating
10. **Pre-Approved** — Lender approved terms
11. **Contract Sent** — Sent term sheet & contract to merchant
12. **Contract Signed** — Merchant signed and returned contract
13. **Funded** — Money wired to merchant account
14. **Dead** — Deal fell through or merchant declined

### Blueprint Field Requirements

Zoho uses **Blueprints** to enforce required fields at each stage. This means:
- You **cannot advance to the next stage** without filling required fields
- If you try to advance and a field is missing, you'll see an error message
- The error will tell you exactly what's missing

**Example:** To move from "New" to "Contacted," you might need to fill:
- Phone number (if email-only before)
- Notes on first contact

### Key Workflow Gates (What Blocks You?)

**Moving to "Submitted to Lenders":**
- ✅ FICO Score must be filled
- ✅ Monthly Revenue must be filled
- ✅ Lender must be assigned

**Moving to "Contract Sent":**
- ✅ Factor Rate must be filled (what the lender will charge)
- ✅ Commission % must be filled (your commission)
- ✅ Approved Amount must be filled (what lender approved)

**Moving to "Funded":**
- ✅ Date Funded must be filled (the funding date)
- ✅ Funded Amount must be filled (actual amount wired)
- **This stage triggers automation** — notifications go out, deal is marked complete

### How to Move a Deal Forward

1. Open the deal
2. Scroll down to find the **Stage** field
3. Click **Edit** or the field itself
4. Select the next stage from the dropdown
5. Fill any required fields that appear (the Blueprint will show them)
6. Click **Save**
7. If fields are missing, the system won't let you save — fill them and try again

---

## Understanding FICO Bands & Lender Matching

Our lender network is organized by FICO score bands. The system auto-matches based on this.

### FICO Bands (Auto-Calculated, Read-Only)

The **FICO Band** field appears on the Deal record. It's calculated automatically from the merchant's FICO Score:

| Band | FICO Range | Lender Availability | Notes |
|------|-----------|-------------------|-------|
| **A+** | 720–850 | 8–10 lenders | Best rates, fastest approval |
| **A** | 680–719 | 5–8 lenders | Good options, standard approval |
| **B** | 640–679 | 2–5 lenders | Limited options, slower approval |
| **C** | 600–639 | 1–2 lenders | Very limited, specialty lenders only |
| **D** | Below 600 | Specialty only | Highest rates, slowest approval |

### How Lender Matching Works

- At **8:00 AM daily**, automation runs **lender matching**
- The system looks at:
  - Merchant's FICO Band
  - Monthly Revenue vs. loan amount (affordability)
  - Existing MCA positions (debt level)
- Matches the deal to the best available lender for that band
- Result appears in the **Deal.Lender** field

### Checking Lender Match

1. Open the deal
2. Scroll to find the **Lender** field
3. It will show the matched lender (e.g., "CapitalWave Lending")
4. If blank, lender matching hasn't run yet or no lender matched

### If No Lender Matches

This is rare. If the **Lender** field is blank after 24 hours:
- Contact **Admin** — might be a system configuration issue
- Possible reasons:
  - FICO too low for all lenders
  - Requested amount is outside all lender limits
  - Existing MCA positions too high
  - Industry not served by available lenders

### Running Lender Matching Manually

- Normally this runs at 8:00 AM automatically
- If you need it to run immediately (e.g., after updating FICO Score):
  - Ask your **Admin** to manually trigger it
  - Include the deal name and your reason
  - Automation will re-match within minutes

---

## Notifications You'll Receive

Our automation sends notifications to keep you in the loop. Here's what to expect:

### Email Notifications

**New Lead Assigned**
- **Subject:** "New Lead Assigned: [Merchant Name]"
- **Content:** Full merchant details, FICO score, revenue, urgency flag
- **Action:** Call within the timeframe based on lead score (see Daily Routine above)

**Deal Funded**
- **Subject:** "Deal Funded: [Merchant Name]"
- **Content:** Merchant name, funded amount, estimated commission
- **Action:** Send welcome email to merchant, start renewal tracking

**Renewal Eligible**
- **Subject:** "[Merchant Name] is 50% Paid — Renewal Eligible"
- **Content:** Merchant name, original amount, payoff schedule
- **Action:** **Call immediately** — renewals are high-priority revenue opportunities
- **Timing:** You'll get this 50% through the repayment term

### Cliq Notifications (Real-Time)

**Channel: `#ops-automation`** (Read-Only for Reps)

- Real-time deal updates (stage changes, lender matches)
- Lead assignment announcements
- System alerts (automation ran, lender matching complete)
- Do NOT post here — this is automated alerts only

---

## Using Cliq for Communication

Cliq is our team messaging system. Here's the etiquette:

### `#ops-automation` Channel (Automated, Read-Only)

- **Purpose:** System notifications and deal alerts
- **Who posts:** Automation system only
- **Your role:** Read the alerts, act on them
- **Don't post here** — reserved for automated messages

### Creating Deal-Specific Channels

For deals requiring team discussion:
1. Click **+ Create Channel**
2. Name it clearly: `#deal-[merchant-name]` (e.g., `#deal-pizzeria-joe`)
3. Invite relevant team members (sales manager, underwriter, etc.)
4. Use for:
   - Sharing documents (bank statements, contracts)
   - Discussing underwriting concerns
   - Coordinating approvals

### Tagging Your Manager

When a deal is ready for final approval:
- Post in the deal channel: `@sales-manager Ready for final sign-off`
- Include:
  - Merchant name
  - Proposed amount
  - FICO score
  - Monthly revenue
  - Any special notes

- Don't move the deal to "Contract Sent" until manager approves

---

## Quick Reference: Common Tasks

### I have a new lead on the phone. What do I do?
1. Create new lead in CRM (fill required fields)
2. Let the system calculate Lead Score
3. Check score — if 90+, start discovery call immediately
4. Fill optional fields if they're a strong prospect
5. Move to phone conversation

### The merchant is ready to move forward. What next?
1. Open the lead record
2. Click **Convert** to turn it into a Deal
3. Fill Account fields (revenue, industry, state, business start date)
4. Set Deal Stage to "New"
5. Set Deal Amount
6. Check back tomorrow for lender assignment

### The deal is stuck. What do I do?
1. Open the CRM Stalled Deals report
2. Filter for deals with zero activity > 7 days
3. Call the merchant directly
4. Move them to the next stage (ask what's needed)
5. If they need docs, send request via email
6. Update the deal stage when documents arrive

### The deal is ready to send to lender. What are the requirements?
1. Open the deal
2. Verify you can move to "Submitted to Lenders" stage
3. Required fields:
   - FICO Score (filled)
   - Monthly Revenue (filled)
   - Lender (auto-assigned, check Deal.Lender field)
4. Try to move the stage — if blocked, see error message for what's missing
5. Fill missing fields and try again

### Merchant says they're ready to sign. What do I do?
1. Verify all required fields are filled
2. Try moving deal to "Contract Sent" stage
3. Get approval from @sales-manager in deal-specific channel
4. Lender will send contract; you relay to merchant
5. Once signed, move to "Contract Signed"
6. Finance team handles funding

### A merchant should be renewing soon. How do I know when?
- You'll get an email: `[Merchant] is 50% Paid — Renewal Eligible`
- Call them immediately — renewals close faster than new deals
- Create a new Lead/Deal for the renewal
- Reference the original deal number in notes

---

## Need Help?

- **Process questions:** Ask your Sales Manager
- **System issues (Cliq/CRM down, data wrong):** Contact Admin
- **Lender questions:** Ask your Sales Manager
- **Lead assignment issues:** Check your email — assignments come from applications@commerafunding.com

---

**Last Updated:** 2026-04-30

Good luck out there. Close deals, help merchants succeed.
