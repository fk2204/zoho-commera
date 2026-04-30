# Phase 3: Zoho UI Manual Configuration — CORRECTED (From Actual CRM Schema)

---

## Task 1: Lead Scoring Rules (11 Categories, 43 Criteria)

**Location in Zoho CRM UI:** Setup → Automation → Scoring Rules

### Create New Scoring Rule: "MCA Lead Quality"

**Setup:**
- Name: `MCA Lead Quality`
- Module: `Leads`
- Auto-apply on create/edit: ✅ Yes
- Maximum score: `100`

### Add Scoring Criteria (11 Categories)

**Category 1: Lead Source (0-5 points)**
- Add criteria: `Lead_Source` = `Website` → 5 points
- Add criteria: `Lead_Source` = `Referral` → 3 points
- Add criteria: `Lead_Source` = `Cold Call` → 1 point
- Add criteria: `Lead_Source` = `Other` → 0 points

**Category 2: Business Type (0-8 points)**
- Add criteria: `Industry` NOT IN [Construction, Liquor, Cannabis, Non-Profit] AND `Entity_type` ≠ `Sole Proprietorship` → 8 points
- Add criteria: `Industry` NOT IN [Construction, Liquor, Cannabis, Non-Profit] AND `Entity_type` = `Sole Proprietorship` → 5 points
- Add criteria: `Industry` IN [Construction, Liquor, Cannabis, Non-Profit] → 2 points

**Category 3: Business Age (0-6 points)**
- Add criteria: `Date_Business_Started` ≤ (90 days ago) → 0 points
- Add criteria: `Date_Business_Started` between (90 days ago AND 2 years ago) → 3 points
- Add criteria: `Date_Business_Started` > (2 years ago) → 6 points

**Category 4: Time in Business (TIB) — Owner (0-5 points)**
- Add criteria: `Time_in_Business_Months` ≥ 60 → 5 points
- Add criteria: `Time_in_Business_Months` between (24 AND 60) → 3 points
- Add criteria: `Time_in_Business_Months` < 24 → 1 point

**Category 5: Monthly Revenue (0-12 points)**
- Add criteria: `Monthly_Revenue_USD` ≥ 50000 → 12 points
- Add criteria: `Monthly_Revenue_USD` between (25000 AND 50000) → 8 points
- Add criteria: `Monthly_Revenue_USD` between (10000 AND 25000) → 4 points
- Add criteria: `Monthly_Revenue_USD` < 10000 → 1 point

**Category 6: Credit Score / FICO (0-8 points)**
- Add criteria: `FICO_score` ≥ 700 → 8 points
- Add criteria: `FICO_score` between (650 AND 700) → 5 points
- Add criteria: `FICO_score` between (600 AND 650) → 2 points
- Add criteria: `FICO_score` < 600 → 0 points

**Category 7: Funding Need / Amount (0-10 points)**
- Add criteria: `Requested_Amount` between (50000 AND 250000) → 10 points
- Add criteria: `Requested_Amount` between (25000 AND 50000) → 7 points
- Add criteria: `Requested_Amount` between (10000 AND 25000) → 4 points
- Add criteria: `Requested_Amount` < 10000 → 1 point
- Add criteria: `Requested_Amount` > 250000 → 8 points

**Category 8: Industry Growth Sector (0-4 points)**
- Add criteria: `Industry` IN [E-commerce, SaaS, Fitness, Healthcare Services] → 4 points
- Add criteria: `Industry` IN [Retail, Food Service, Professional Services] → 2 points
- Add criteria: `Industry` IN [Manufacturing, Transportation, Construction] → 1 point

**Category 9: Geographic Location (0-3 points)**
- Add criteria: `State` IN [CA, TX, NY, FL] → 3 points
- Add criteria: `Country` = `United States` → 2 points
- Add criteria: No location info → 0 points

**Category 10: Website / Digital Presence (0-2 points)**
- Add criteria: `Website` is not empty → 2 points
- Add criteria: `Website` is empty → 0 points

**Category 11: Immediate Urgency (0-3 points)**
- Add criteria: `Created_Time` < 24 hours ago → 3 points
- Add criteria: `Created_Time` between (1 AND 7 days) ago → 1 point
- Add criteria: `Created_Time` > 7 days ago → 0 points

### Activate the Rule
- Click Save
- Toggle: Auto-apply = ON

---

## Task 2: Blueprint for Deal Pipeline (14 Stages)

**Location:** Setup → Process Management → Blueprint → Deals

**Module:** Deals

**Stages (in API names):** New → Lead Review → Submitted to Lenders → Awaiting Offer Response → Evaluating Offer → Contract Sent → Awaiting Signature → Docs Requested → Docs Received → Underwriting → Final Approval → Funded (end) / Dead (end)

**Required fields per stage transition:**
- New → Lead Review: `Deal_Name`, `Contact_Name`, `Account_Name`
- Lead Review → Submitted: `Contact_Name.FICO_Score`, `Account_Name.Monthly_Revenue`
- Submitted → Awaiting Offer: `Lender`, `Approved_Amount`
- Awaiting Offer → Evaluating: `Date_First_Offer_Received`
- Evaluating → Contract Sent: `Factor_Rate`, `Commission`
- Contract Sent → Awaiting Signature: `Date_Contract_Signed`
- Awaiting Signature → Docs Requested: none
- Docs Requested → Docs Received: none
- Docs Received → Underwriting: `Date_Docs_Received`
- Underwriting → Final Approval: `Payback_Amount`
- Final Approval → Funded: `Approved_Amount`, `Commission` verified
- To Funded: `Date_Funded`, `Funded_Amount` required

**Publish when complete.**

---

## Task 3: Offers Module (ALREADY EXISTS - Just Verify)

**Location:** Setup → Modules & Fields → Offers

**Existing fields (verified):**
- `Name` (Offer Name)
- `Owner` (Offer Owner)
- `Submission` (Lookup → Deals) ✓
- `Lender` (Lookup → Lenders) ✓
- `Factor_Rate` (Double) ✓
- `Offered_Amount` (Currency) ✓
- `Term_Months` (Integer) ✓
- `Commission` (Double) ✓
- `Offer_status` (Picklist) ✓
- `Offer_Received_Date` (Date) ✓
- `Offer_Expiration_Date` (Date) ✓

**Related List:** Already set up on Deals (link: Submission)

**No action needed - module already complete.**

---

## Task 4: Stips Module (ALREADY EXISTS - Just Verify)

**Location:** Setup → Modules & Fields → Stips

**Existing fields (verified):**
- `Name` (Stip Name) ✓
- `Owner` (Stip Owner) ✓
- `Submission` (Lookup → Deals) ✓
- `Lender` (Lookup → Lenders) ✓
- `Stip_Type` (Picklist) ✓
- `Stip_Status` (Picklist) ✓
- `Requested_Date` (Date) ✓
- `Due_Date` (Date) ✓
- `Received_Date` (Date) ✓
- `Priority` (Picklist) ✓
- `Note` (Text Area) ✓

**Related List:** Already set up on Deals (link: Submission)

**No action needed - module already complete.**

---

## Task 5: DealHistory Module (ALREADY EXISTS - Use Native Audit Trail)

**Location:** Setup → Organization Settings → Audit Trail

**This module already exists** but stores stage transition history automatically.

**Recommendation:** Use native Zoho Audit Trail instead of manual tracking.

**Enable field-level tracking on:**
- `Deals.Stage`
- `Deals.Owner`
- `Deals.Lender`
- `Deals.Date_Funded`

Go to: Setup → Organization Settings → Audit Trail → Enable

**No action needed - module already exists.**

---

## Task 6: Commissions Module (DOES NOT EXIST - Create It)

**Location:** Setup → Modules & Fields

### Create New Module: "Commissions"

**Steps:**
1. Click "+ New Module"
2. Module Name: `Commissions`
3. API Name: `Commissions` (auto-generated)
4. Add fields below

**Fields to add:**

| Field Label | API Name | Type | Required |
|---|---|---|---|
| Rep | Rep | Lookup (Users) | Yes |
| Deal | Submission | Lookup (Deals) | Yes |
| Funding | Funding | Lookup (Fundings) | No |
| Commission Amount | Commission_Amount | Currency | Yes |
| Commission Type | Commission_Type | Picklist | Yes |
| Commission Type options: | | | |
| | | ISO Commission | |
| | | Rep Commission | |
| Period | Period | Text | No |
| Status | Status | Picklist | Yes |
| Status options: | | | |
| | | Pending | |
| | | Paid | |
| | | Voided | |
| Notes | Notes | Text Area | No |

### Save Module

**Document the API Name:** Write it down for Phase 4 automation code.

---

## Task 7: Create 5 Core CRM Reports

**Location:** Reports → Create Report

### Report 1: "Pipeline by Stage"

**Module:** Deals

**Columns:** `Deal_Name`, `Stage`, `Amount`, `Owner`, `Contact_Name`, `Created_Time`

**Filters:** `Stage` ≠ Dead

**Group By:** `Stage`

**Sort:** `Amount` (descending)

---

### Report 2: "Funded This Month"

**Module:** Deals

**Columns:** `Deal_Name`, `Contact_Name`, `Account_Name`, `Approved_Amount`, `Funded_Amount`, `Date_Funded`, `Days_Lead_to_Fund`, `Owner`

**Filters:** 
- `Stage` = Funded 
- `Date_Funded` ≥ (first day of this month)

**Group By:** `Owner`

---

### Report 3: "Renewal Pipeline"

**Module:** Renewals

**Columns:** `Name`, `Merchant`, `Renewal_Approved_Amount`, `Renewal_Stage`, `Eligible_Date`

**Filters:** `Renewal_Stage` = Eligible

**Sort:** `Eligible_Date` (ascending)

---

### Report 4: "Rep Performance"

**Module:** Deals

**Columns:** `Owner.full_name`, COUNT (Deals Closed), SUM(`Funded_Amount`), AVG(`Days_Lead_to_Fund`)

**Filters:** `Stage` = Funded, `Date_Funded` ≥ (last 90 days)

**Group By:** `Owner`

**Sort:** SUM(`Funded_Amount`) (descending)

---

### Report 5: "Stalled Deals"

**Module:** Deals

**Columns:** `Deal_Name`, `Stage`, `Owner`, `Contact_Name`, `Amount`, `Modified_Time`

**Filters:** 
- `Stage` NOT IN [Funded, Dead]
- `Modified_Time` < (7 days ago)

**Sort:** `Modified_Time` (ascending)

---

## Task 8: Zoho Sign Template

**Location:** Zoho Sign → Templates → Create Template

1. Click "+ Create Template"
2. Upload your MCA Funding Agreement (PDF/DOC)
3. Add signature fields:
   - Merchant Signature (required)
   - Merchant Name (print) (required)
   - Date Signed (auto-fill)
4. Add info fields (pre-fill):
   - Merchant Name → `Contact_Name.First_Name` + `Contact_Name.Last_Name`
   - Business Name → `Account_Name.Account_Name`
   - Funding Amount → `Submission.Approved_Amount`
   - Factor Rate → `Submission.Factor_Rate`
   - Payback Amount → `Submission.Payback_Amount`
5. Set signing order: Merchant first
6. Post-sign actions: Send copies to merchant + rep email
7. Save template

---

## Verification Checklist

- [ ] Lead Scoring: New Lead → auto-score appears
- [ ] Blueprint: Try advancing without required fields → blocked
- [ ] Offers: Visible as Related List on Deals ✓ (already done)
- [ ] Stips: Visible as Related List on Deals ✓ (already done)
- [ ] DealHistory: Audit Trail enabled ✓ (already exists)
- [ ] Commissions: Module created, API Name documented
- [ ] 5 Reports: Created and showing data
- [ ] Zoho Sign: Template created and ready

---

## Summary

**Already Complete (3/8):**
- Offers module (fully wired)
- Stips module (fully wired)
- DealHistory (native Audit Trail)

**Action Required (5/8):**
- Lead Scoring Rules (UI configuration)
- Blueprint (UI configuration)
- Commissions module (create + document API name)
- 5 Reports (create in Zoho)
- Zoho Sign template (create + test)

Phase 3 complete when all 5 action items are done.
