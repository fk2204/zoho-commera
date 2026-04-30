# Phase 3: Manual Zoho UI Configuration Tasks

Complete these 8 tasks in Zoho CRM manually. Code automation (Phases 1-2) is already done.

---

## Task 1: Lead Scoring Rules
**Location:** Setup → Automation → Scoring Rules
- Create rule: "MCA Lead Quality"
- Add 11 categories with 43 criteria (see detailed guide for exact criteria)
- Auto-apply on Lead create/edit
- Max score: 100 points

---

## Task 2: Blueprint for Deal Pipeline
**Location:** Setup → Process Management → Blueprint → Deals
- Configure 14 stages with required fields per transition
- Enforce stage progression (prevent skipping)
- Required fields: Deal_Name, Contact_Name, Amount, FICO, etc.

---

## Task 3: Define Offers Module
**Location:** Setup → Modules & Fields → Offers
- Add fields: Lender, Deal, Factor_Rate, Offered_Amount, Repayment_Term, Commission_Pct, Status, Date_Offered, Date_Expires, Notes
- Set up Related List on Deals module

---

## Task 4: Define Stips Module
**Location:** Setup → Modules & Fields → Stips
- Add fields: Deal, Lender, Stip_Name, Status, Date_Requested, Due_Date, Date_Received, Document_Type, Severity, Notes
- Set up Related List on Deals module

---

## Task 5: Define DealHistory Module
**Location:** Setup → Modules & Fields → DealHistory
- Option A (Manual): Add fields for stage change tracking
- Option B (Better): Use native Audit Trail in Setup → Organization Settings

---

## Task 6: Verify Commissions Module API Name
**Location:** Setup → Modules & Fields → Modules List
- Find "Commissions" module
- Note the exact API Name
- Document it (you'll need it for Phase 4)

---

## Task 7: Create 5 Core CRM Reports
**Location:** Reports → Create Report

1. **Pipeline by Stage** — Deals grouped by Stage, sorted by Amount
2. **Funded This Month** — Deals with Stage=Funded this month, grouped by Owner
3. **Renewal Pipeline** — Renewals with Status=Eligible, sorted by age
4. **Rep Performance** — Deals by Owner, sum Funded_Amount, avg Days_Lead_to_Fund
5. **Stalled Deals** — Deals with no activity > 7 days, sorted by Days_in_Stage

---

## Task 8: Zoho Sign Contract Template
**Location:** Zoho Sign → Templates
- Create template: "MCA Funding Agreement"
- Add signature fields: Merchant Signature, Merchant Name (print), Date Signed
- Pre-fill fields: Funding Amount, Factor Rate, Payback Amount
- Configure automated actions on completion

---

## When Done
All manual tasks complete when:
- ✅ New Leads auto-score in real-time
- ✅ Blueprint blocks stage skips and missing required fields
- ✅ Offers and Stips appear as related lists on Deals
- ✅ 5 reports are accessible and showing data
- ✅ Commissions module API name is documented
- ✅ Zoho Sign contract template ready to send

Then proceed to **Phase 4: Commission Module Automation**
