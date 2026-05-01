# Commera Funding — Zoho One Complete Manual Setup Guide

**Role:** Zoho One Expert + MCA Business Owner  
**Version:** 3.0 — April 2026  
**Status:** Print this. Work through it top to bottom. Check every box.

---

> **How to use this guide:**  
> This is split into 5 parts. Do them in order.  
> - **Part 1 (Sections 1–14):** Foundation — modules, fields, picklists, users. Nothing works until this is done.  
> - **Part 2 (Sections 15–25):** CRM Configuration — scoring, blueprint, rules, views.  
> - **Part 3 (Sections 26–35):** App Setup — Books, Desk, Mail, Campaigns, Sign, Projects, etc.  
> - **Part 4 (Section 36):** Data Entry — lenders.  
> - **Part 5 (Sections 37–40):** Go Live — automation start, verification, operations, upgrades.  
>
> `API_Name_Like_This` = exact spelling including case. One character wrong = broken COQL query.

---

# PART 1 — FOUNDATION

---

## SECTION 1 — MODULE INVENTORY: Verify What Already Exists

Navigate: `CRM → Setup → Modules and Fields → Module List`

| Module | Expected Status | Action if Missing |
|--------|----------------|------------------|
| Leads | ✅ Built-in | Cannot be missing |
| Contacts | ✅ Built-in | Cannot be missing |
| Accounts | ✅ Built-in | Cannot be missing |
| Deals | ✅ Built-in | Cannot be missing |
| Lenders | ❓ Custom | Create it (Section 10) |
| Offers | ❓ Custom | Create it (Section 11) |
| Stips | ❓ Custom | Create it (Section 11) |
| Fundings | ❓ Custom | Create it (Section 8) |
| Renewals | ❓ Custom | Create it (Section 9) |
| Commissions | ❓ Custom | Create it (Section 22) |
| DealHistory | Optional | Use native Audit Trail instead (Section 24) |

Write down which modules already exist: ______________________

---

## SECTION 2 — PICKLISTS: The Most Critical Configuration

**Why this is first:** Automation jobs run COQL queries with exact string matching:  
`WHERE Funding_status = 'Active'` — if your picklist says `"Active — Performing"` → 0 records processed.  
Everything runs but nothing happens. Silently broken.

For each picklist below: `Setup → Modules and Fields → [Module] → Fields → [Field] → Edit → Options`

---

### 2.1 — Deals: Stage (14 values — exact order and spelling critical)

| Value | Probability | Code Uses? |
|-------|------------|-----------|
| `New` | 5% | ✅ merchant-ticket.js queries this |
| `Contacted / Discovery` | 10% | ✅ merchant-ticket.js queries this |
| `Application Sent` | 15% | |
| `Application Received` | 25% | |
| `Docs Requested` | 30% | |
| `Docs Received / File Built` | 40% | |
| `Submitted to Lenders` | 50% | |
| `Offers Received` | 65% | |
| `Offer Presented` | 70% | |
| `Contract Sent` | 80% | |
| `Contract Signed` | 90% | |
| `Stips Clearing` | 95% | |
| `Funded` | 100% | ✅ create-funding.js triggers on this |
| `Dead` | 0% | |

**Set "Funded" as the trigger for Funding creation. If it's named anything else, no Fundings are ever created.**

---

### 2.2 — Deals: Dead Reason (17 values — required by Blueprint)

| Value |
|-------|
| `Not Qualified — Revenue too low` |
| `Not Qualified — Time in business too short` |
| `Not Qualified — Too many positions` |
| `Not Qualified — Industry restriction` |
| `Not Qualified — State restriction` |
| `Declined by All Lenders` |
| `Merchant Ghosted / No Response` |
| `Merchant Chose Competitor` |
| `Merchant Declined All Offers` |
| `Merchant Changed Mind — No Longer Needs Funding` |
| `Bank Statements Too Weak (NSFs / Negatives)` |
| `FICO Too Low` |
| `Active Bankruptcy` |
| `Tax Lien Issue` |
| `Incomplete Documentation — Merchant Won't Provide` |
| `Duplicate / Already in System` |
| `Other` |

---

### 2.3 — Leads: Lead Status

| Value | Notes |
|-------|-------|
| `New` | Default on creation |
| `Attempted Contact` | |
| `Contacted` | |
| `Qualified — Ready to Convert` | |
| `Not Qualified — Nurture` | |
| `Do Not Contact` | ✅ **add-to-nurture.js excludes this exactly** |

---

### 2.4 — Leads: Lead Source

| Value |
|-------|
| `UCC List` |
| `Aged Lead` |
| `Live Transfer` |
| `Referral — Merchant` |
| `Referral — Partner` |
| `Website Form` |
| `Google Ads` |
| `Facebook Ads` |
| `LinkedIn` |
| `Cold Call` |
| `Email Campaign` |
| `Walk-in` |
| `Other` |

---

### 2.5 — Industry (used on Leads AND Accounts — same values both places)

**Core Industries:**  
`Restaurants & Food Service`, `Retail Stores`, `E-Commerce & Online Retail`, `Healthcare & Medical Practices`, `HVAC / Plumbing / Electrical`, `Auto Repair & Body Shops`, `Roofing & Restoration`, `Janitorial & Facility Services`, `Professional Services`, `Manufacturing`

**Additional Industries:**  
`Trucking & Transportation`, `Construction — General`, `Construction — Specialty Trades`, `Beauty / Salon / Spa`, `Gas Station / C-Store`, `Hotel / Hospitality`, `Gym / Fitness`, `Wholesale / Distribution`, `Legal Services`, `Real Estate Services`, `Technology / SaaS`, `Landscaping & Lawn Care`, `Daycare & Childcare`, `Dental & Orthodontics`, `Veterinary`, `Staffing Agency`

**Restricted (must start with exactly this prefix — scoring penalizes -50 points):**  
`RESTRICTED — Cannabis`, `RESTRICTED — Adult Entertainment`, `RESTRICTED — Gambling`, `RESTRICTED — Firearms Dealer`, `RESTRICTED — Nonprofit`

**Catch-all:** `Other`

---

### 2.6 — Entity Type (Leads AND Accounts)

| Value |
|-------|
| `LLC` |
| `C-Corp` |
| `S-Corp` |
| `Sole Proprietorship` |
| `Partnership` |
| `Non-Profit` |
| `Other` |

---

### 2.7 — Urgency (Leads module)

| Value |
|-------|
| `ASAP (24-48 hours)` |
| `This Week` |
| `Next 2 Weeks` |
| `This Month` |
| `Just Exploring` |

---

### 2.8 — Existing MCA Positions (Leads module)

| Value |
|-------|
| `0 — Clean` |
| `1 — One position` |
| `2 — Two positions` |
| `3 — Three positions` |
| `4+ — Stacked` |

---

### 2.9 — Payment Frequency (Deals + Fundings)

| Value |
|-------|
| `Daily` |
| `Weekly` |
| `Bi-Weekly` |
| `Monthly` |

---

### 2.10 — Funding Status (Fundings module)

| Value | Code Uses? |
|-------|-----------|
| `Active` | ✅ YES — funding-project.js and renewal-check.js query this exact value. This MUST exist as-is. |
| `Active — Slow Pay` | No — ops tracking |
| `Active — On Hold` | No — ops tracking |
| `Paid Off — Complete` | No — ops tracking |
| `Defaulted` | No — ops tracking |
| `In Collections` | No — ops tracking |
| `Settled` | No — ops tracking |
| `Bought Out by Another Lender` | No — ops tracking |

**Default value:** `Active`

---

### 2.11 — Renewal Stage (Renewals module)

| Value | Code Uses? |
|-------|-----------|
| `Eligibility Review` | ✅ YES — set on Renewal creation |
| `Eligible` | ✅ YES — set when Paydown ≥ 50% |
| `Eligible — Not Contacted` | No |
| `Contacted — No Answer` | No |
| `Contacted — Interested` | No |
| `Contacted — Not Ready Yet` | No |
| `Contacted — Not Interested` | No |
| `Application Sent` | No |
| `Application Received` | No |
| `Submitted to Lenders` | No |
| `Offers Received` | No |
| `Offer Presented` | No |
| `Contract Sent` | No |
| `Contract Signed` | No |
| `Funded` | No |
| `Dead` | No |

---

### 2.12 — Lender Status (Lenders module)

| Value | Code Uses? |
|-------|-----------|
| `Active` | ✅ YES — lender matching queries this exact value |
| `Paused` | No |
| `Terminated` | No |
| `Pending Approval` | No |

---

### 2.13 — FICO Band (Leads + Contacts — formula field, read-only)

| Value |
|-------|
| `A+ (720+)` |
| `A (680-719)` |
| `B (640-679)` |
| `C (600-639)` |
| `D (550-599)` |
| `Sub (<550)` |

---

### 2.14 — TIB Band (Accounts module)

| Value |
|-------|
| `2+ Years` |
| `1-2 Years` |
| `6-12 Months` |
| `4-6 Months` |
| `Under 4 Months` |

---

### 2.15 — Use of Funds (Leads + Deals)

| Value |
|-------|
| `Working Capital` |
| `Equipment Purchase` |
| `Inventory` |
| `Expansion / Build-out` |
| `Payroll` |
| `Taxes` |
| `Consolidation of Existing MCAs` |
| `Marketing` |
| `Real Estate` |
| `Emergency / Unexpected` |
| `Other` |

---

### 2.16 — Offer Status (Offers module)

| Value | When to Use |
|-------|------------|
| `Pending Review` | Default — lender sent offer, reviewing internally |
| `Presented` | Shown to merchant, waiting for response |
| `Accepted` | Merchant agreed to this offer |
| `Declined` | Merchant or lender declined |
| `Expired` | Offer time window passed |

---

### 2.17 — Stip Type (Stips module)

These are the exact stip types in MCA underwriting:

| Value |
|-------|
| `Bank Statements — 3 Months` |
| `Bank Statements — 6 Months` |
| `Tax Returns — 1 Year` |
| `Tax Returns — 2 Years` |
| `Voided Check` |
| `Driver's License / Photo ID` |
| `Business License` |
| `Proof of Ownership` |
| `Lease Agreement` |
| `YTD Profit & Loss` |
| `UCC Search` |
| `Personal Guarantee` |
| `SBA Approval Letter` |
| `Other` |

---

### 2.18 — Stip Status (Stips module)

| Value |
|-------|
| `Requested` |
| `Pending Review` |
| `Received` |
| `Approved` |
| `Rejected — Resubmit` |

---

### 2.19 — Stip Priority (Stips module)

| Value |
|-------|
| `Urgent` |
| `Normal` |
| `Low` |

---

### 2.20 — Merchant Quality Rating (Accounts module)

| Value |
|-------|
| `New` |
| `Good` |
| `Excellent` |
| `Problem Payer` |
| `Do Not Fund Again` |

---

### 2.21 — Commission Type (Commissions module)

| Value |
|-------|
| `ISO Commission (from Lender)` |
| `Rep Commission (to Sales Rep)` |
| `Sub-Broker Commission (to Partner)` |
| `Manager Override` |
| `Referral Fee` |
| `Clawback` |

---

### 2.22 — Commission Status (Commissions module)

| Value |
|-------|
| `Pending` |
| `Approved` |
| `Paid` |
| `Partially Paid` |
| `Clawed Back` |
| `In Dispute` |
| `Cancelled` |

---

## SECTION 3 — CRM USERS & ROLES: Set Up Before Everything Else

**Why this comes first:** Blueprint approval gates require named roles. Lead assignment requires active CRM users. Without roles, the manager approval on "Contract Sent" cannot be enforced.

### 3.1 — Create Roles

Navigate: `Setup → Users and Control → Roles → + New Role`

Create these three roles in order:

| Role Name | Reports To | Notes |
|-----------|-----------|-------|
| `Admin` | CEO | Full access |
| `Sales Manager` | Admin | Approves Blueprint contracts, views all reps |
| `Sales Representative` | Sales Manager | Manages own leads and deals only |

### 3.2 — Create Profiles (Permission Sets)

Navigate: `Setup → Users and Control → Profiles → + New Profile`

**Profile: Sales Rep — Standard**
- Leads: Create, Read, Edit own records
- Contacts: Create, Read, Edit own records
- Accounts: Create, Read, Edit own records
- Deals: Create, Read, Edit own records — **cannot delete**
- Fundings: Read only — cannot edit (automation manages these)
- Renewals: Read only
- Lenders: Read only
- Reports: Run reports, cannot create
- Commission fields: **Hidden** (reps should not see other reps' commission rates)

**Profile: Sales Manager — Standard**
- All modules: Full read/write
- Can approve Blueprint transitions
- Can view all reports including Rep Performance
- Can delete Deals (staged exit only)
- Can reassign leads

**Profile: Admin — Full Access**
- Everything

### 3.3 — Create User Accounts

Navigate: `Setup → Users and Control → Users → + New User`

For each team member:
- **First Name, Last Name, Email** (this email receives CRM notifications)
- **Role:** Select from roles above
- **Profile:** Select from profiles above
- **Time Zone:** Set correctly — this affects when "today" is calculated in automation

**Sales Rep email addresses must be real, working inboxes.** When automation assigns a lead, it emails the rep. If the email bounces, assignment succeeds silently but rep never sees it.

After creating users, note their Zoho User IDs. The lead-assign automation uses these for round-robin assignment.

---

## SECTION 4 — LEADS MODULE: Fields

Navigate: `Setup → Modules and Fields → Leads → Fields → + New Field`

### 4.1 — Fields to Verify (Built-In)

| API Name | Type | Notes |
|---------|------|-------|
| `First_Name` | Text | Built-in |
| `Last_Name` | Text | Built-in |
| `Email` | Email | Built-in — required for Campaigns |
| `Phone` | Phone | Built-in |
| `Lead_Source` | Picklist | Set values per Section 2.4 |
| `Lead_Status` | Picklist | Set values per Section 2.3 |
| `Industry` | Picklist | Set values per Section 2.5 |
| `Website` | URL | Built-in |
| `State` | Text | Built-in |
| `Country` | Text | Built-in |
| `Created_Time` | DateTime | Built-in — system field, read-only |
| `Owner` | User Lookup | Built-in — modified by lead-assign automation |

### 4.2 — Custom Fields to Create

| Field Label | API Name | Type | Notes |
|-------------|---------|------|-------|
| FICO Score | `FICO_score` | Number (Integer) | Min 300, Max 850. Exact name matters — lowercase 's' |
| FICO Band | `FICO_Band` | Formula (Picklist result) | Auto from FICO_score — read-only |
| Monthly Revenue (USD) | `Monthly_Revenue_USD` | Currency | Most important scoring field |
| Requested Amount | `Requested_Amount` | Currency | How much they want |
| Date Business Started | `Date_Business_Started` | Date | Used for TIB calculation |
| Time in Business (Months) | `Time_in_Business_Months` | Formula (Integer) | MONTHS_BETWEEN(TODAY(), Date_Business_Started) — read-only |
| Entity Type | `Entity_Type` | Picklist | Section 2.6 |
| Existing MCA Positions | `Existing_MCA_Positions` | Picklist | Section 2.8 — major scoring signal |
| Urgency | `Urgency` | Picklist | Section 2.7 |
| NSFs Last 3 Months | `NSFs_Last_3_Months` | Number (Integer) | Bank health — scoring |
| Negative Days Last 3 Months | `Negative_Days_Last_3_Months` | Number (Integer) | Bank health — scoring |
| Use of Funds | `Use_of_Funds` | Picklist | Section 2.15 |
| Campaigns Added | `Campaigns_Added` | Date | **AUTO-SET by automation** — never edit manually |
| Lead Score | `Lead_Scores` | Number (Integer) | **READ-ONLY** — managed by Zoho Scoring Rules |

### 4.3 — FICO Band Formula Field

When creating `FICO_Band` as a formula field:
- **Field Type:** Formula
- **Return Type:** Text
- **Formula:**
```
IF(FICO_score >= 720, "A+ (720+)",
  IF(FICO_score >= 680, "A (680-719)",
    IF(FICO_score >= 640, "B (640-679)",
      IF(FICO_score >= 600, "C (600-639)",
        IF(FICO_score >= 550, "D (550-599)", "Sub (<550)")))))
```

### 4.4 — Time in Business Formula

When creating `Time_in_Business_Months`:
- **Field Type:** Formula
- **Return Type:** Number (Integer)
- **Formula:** `MONTHS_BETWEEN(TODAY(), Date_Business_Started)`

### 4.5 — Add Fields to Layout

After creating all fields:  
`Setup → Modules and Fields → Leads → Layouts → Standard Layout`

Organize fields on the form in logical sections:
- **Identity:** First Name, Last Name, Email, Phone
- **Lead Info:** Lead Source, Lead Status, Urgency
- **Business:** Industry, Entity Type, Date Business Started, Time in Business Months
- **Financials:** Monthly Revenue (USD), FICO Score, FICO Band, Existing MCA Positions
- **Bank Health:** NSFs Last 3 Months, Negative Days Last 3 Months
- **Request:** Requested Amount, Use of Funds
- **Automation Markers:** Campaigns Added, Lead Score (read-only, show for reference)

---

## SECTION 5 — CONTACTS MODULE: Fields

Navigate: `Setup → Modules and Fields → Contacts → Fields`

Contacts = converted leads who became merchants. Financial fields must mirror Leads exactly — the Lead Conversion mapping (Section 14) copies these fields across on conversion.

### 5.1 — Custom Fields to Create on Contacts

| Field Label | API Name | Type | Notes |
|-------------|---------|------|-------|
| FICO Score | `FICO_score` | Number (Integer) | **Must be identical to Leads.FICO_score** |
| FICO Band | `FICO_Band` | Formula | Same formula as Leads |
| Monthly Revenue (USD) | `Monthly_Revenue_USD` | Currency | |
| Date Business Started | `Date_Business_Started` | Date | |
| Entity Type | `Entity_Type` | Picklist | Same as Leads |
| NSFs Last 3 Months | `NSFs_Last_3_Months` | Number | |
| Negative Days Last 3 Months | `Negative_Days_Last_3_Months` | Number | |
| Use of Funds | `Use_of_Funds` | Picklist | Same as Leads |

**Why these must match Leads exactly:** On Lead conversion, Zoho copies field values from Lead → Contact. The API names must be identical for this mapping to work without manual re-entry by reps.

---

## SECTION 6 — ACCOUNTS MODULE: Fields

Navigate: `Setup → Modules and Fields → Accounts → Fields`

Accounts = the businesses. Automation updates these fields when Fundings are created.

### 6.1 — Custom Fields to Create

| Field Label | API Name | Type | Notes |
|-------------|---------|------|-------|
| Monthly Revenue | `Monthly_Revenue` | Currency | Used in lender matching — note: no `_USD` suffix |
| Date Business Started | `Date_Business_Started` | Date | |
| Industry | `Industry` | Picklist | Section 2.5 |
| Entity Type | `Entity_Type` | Picklist | Section 2.6 — or verify `Account_Type` exists |
| TIB Band | `TIB_Band` | Picklist | Section 2.14 — **AUTO-UPDATED daily by tib-band job** |
| Billing State | `Billing_State` | Text | Used in lender matching (excluded states) |
| Total Times Funded | `Total_Times_Funded` | Number (Integer) | **AUTO-UPDATED** — never edit manually |
| Total Funded Amount Lifetime | `Total_Funded_Amount_Lifetime` | Currency | **AUTO-UPDATED** |
| First Funded Date | `First_Funded_Date` | Date | **AUTO-UPDATED** — set on first funding, NEVER overwritten |
| Last Funded Date | `Last_Funded_Date` | Date | **AUTO-UPDATED** on each funding |
| Merchant Quality Rating | `Merchant_Quality_Rating` | Picklist | Section 2.20 — set manually based on history |

---

## SECTION 7 — DEALS MODULE: Complete Field Setup

Navigate: `Setup → Modules and Fields → Deals → Fields`

### 7.1 — Complete Required Field List

| Field Label | API Name | Type | Notes |
|-------------|---------|------|-------|
| Stage | `Stage` | Picklist | Section 2.1 — 14 exact values |
| Amount | `Amount` | Currency | Deal size estimate |
| Approved Amount | `Approved_Amount` | Currency | Final lender-approved amount — triggers Payback calc |
| Funded Amount | `Funded_Amount` | Currency | Actual wire amount — may differ from Approved |
| Factor Rate | `Factor_Rate` | Decimal | e.g., 1.35 — triggers Payback calc |
| Payback Amount | `Payback_Amount` | Currency | **AUTO-CALCULATED:** Approved_Amount × Factor_Rate |
| Commission (%) | `Commission` | Decimal | Your % commission on this deal |
| Estimated Commission ($) | `Estimated_commision` | Currency | **⚠️ TYPO IS INTENTIONAL — one 's' in commision** — auto-calculated |
| Date Funded | `Date_Funded` | Date | Required by Blueprint |
| Days Lead to Fund | `Days_Lead_to_Fund` | Number (Integer) | **AUTO-CALCULATED** |
| Lender | `Lender` | Lookup → Lenders | Which lender funded |
| Contact Name | `Contact_Name` | Lookup → Contacts | The merchant owner |
| Account Name | `Account_Name` | Lookup → Accounts | The business |
| Dead Reason | `Dead_Reason` | Picklist | Section 2.2 — required by Blueprint |
| Date Application Sent | `Date_Application_Sent` | Date | **AUTO-SET** by send-application-confirmation job |
| Date Contract Signed | `Date_Contract_Signed` | Date | Required by Blueprint |
| Date First Offer Received | `Date_First_Offer_Received` | Date | Required by Blueprint |
| Date Docs Received | `Date_Docs_Received` | Date | Required by Blueprint |
| Term Months | `Term_Months` | Number (Integer) | |
| Payment Frequency | `Payment_Frequency` | Picklist | Section 2.9 |
| Payment Amount | `Payment_Amount` | Currency | Periodic payment |
| Holdback | `Holdback` | Decimal | % withheld from daily revenue |
| Buy Rate | `Buy_Rate` | Decimal | Lender's rate to you |
| Sell Rate | `Sell_Rate` | Decimal | Rate you charge merchant |
| Net to Merchant | `Net_to_Merchant` | Currency | After fees and payoff |
| Origination Fee | `Origination_Fee` | Currency | Upfront fee |
| Use of Funds | `Use_of_Funds` | Picklist | Section 2.15 |
| Desk Ticket ID | `Desk_Ticket_ID` | Single Line Text | **AUTO-SET** by merchant-ticket job |

### 7.2 — Related Lists on Deals Layout

After creating all fields, add these Related Lists to the Deals page layout:

`Setup → Modules and Fields → Deals → Layouts → [Layout] → Related Lists → Add`

| Related List | Module | Link Field |
|-------------|--------|-----------|
| Offers | Offers | `Submission` |
| Stips | Stips | `Submission` |
| Fundings | Fundings | `Submission` |
| Notes | (built-in) | — |
| Emails | (built-in) | — |
| Activities / Tasks | (built-in) | — |

Without these related lists on the layout, reps cannot see linked Offers and Stips from the Deal page.

### 7.3 — Deal Layout Organization

Organize the Deal form layout with these sections:
- **Deal Header:** Stage, Amount, Approved Amount, Funded Amount
- **Terms:** Factor Rate, Payback Amount, Commission (%), Estimated Commission ($)
- **Payment:** Term Months, Payment Frequency, Payment Amount, Holdback
- **Parties:** Contact Name, Account Name, Lender
- **Rates:** Buy Rate, Sell Rate, Net to Merchant, Origination Fee
- **Dates:** Date Funded, Date Application Sent, Date Contract Signed, Date First Offer Received
- **Classification:** Dead Reason, Use of Funds, Days Lead to Fund
- **Automation Markers:** Desk Ticket ID, Date Application Sent (auto)

---

## SECTION 8 — FUNDINGS MODULE: Create + Fields

If the Fundings module doesn't exist: `Setup → Modules and Fields → + New Module → "Fundings"`

### 8.1 — Add All Required Fields

| Field Label | API Name | Type | Notes |
|-------------|---------|------|-------|
| Name | `Name` | Auto-name | "Funding - [Deal Name]" |
| Submission | `Submission` | Lookup → Deals | Source deal |
| Merchant | `Merchant` | Lookup → Contacts | |
| Business | `Business` | Lookup → Accounts | |
| Lender | `Lender` | Lookup → Lenders | |
| Merchant Name | `Merchant_Name` | Single Line Text | Display convenience |
| Funded Amount | `Funded_Amount` | Currency | |
| Factor Rate | `Factor_Rate` | Decimal | |
| Payback Amount | `Payback_Amount` | Currency | |
| Commission (%) | `Commission_Percent` | Decimal | |
| Commission ($) | `Commission_Amount` | Currency | **Used to create Books invoice** |
| Term Months | `Term_Months` | Number | |
| Payment Frequency | `Payment_Frequency` | Picklist | Section 2.9 |
| Payment Amount | `Payment_Amount` | Currency | |
| Holdback | `Holdback` | Decimal | |
| Buy Rate | `Buy_Rate` | Decimal | |
| Sell Rate | `Sell_Rate` | Decimal | |
| Net to Merchant | `Net_to_Merchant` | Currency | |
| Origination Fee | `Origination_fee` | Currency | ⚠️ **lowercase 'f'** |
| Funding Date | `Funding_Date` | Date | |
| Funding Status | `Funding_status` | Picklist | ⚠️ **lowercase 's'** — Section 2.10 — default: `Active` |
| Paydown | `Paydown` | Number (Integer) | % paid off — update when merchant makes payments |
| Balance Remaining | `Balance_Remaining` | Currency | Outstanding amount |
| Last Payment Date | `Last_Payment_Date` | Date | Update when merchant pays — ops tracking |
| Renewal Eligible | `Renewal_Eligible` | Checkbox | **AUTO-SET** when Paydown ≥ 50 |
| Renewal Eligible Date | `Renewal_Eligible_Date` | Date | **AUTO-SET** |
| Books Invoice ID | `Books_Invoice_ID` | Single Line Text | **AUTO-SET** — idempotency marker |
| Projects Project ID | `Projects_Project_ID` | Single Line Text | **AUTO-SET** — stores id_string not numeric id |

### 8.2 — Related Lists on Fundings Layout

Add: Renewals (linked via `Original_Funding`)

---

## SECTION 9 — RENEWALS MODULE: Create + Fields

If missing: `Setup → Modules and Fields → + New Module → "Renewals"`

### 9.1 — Add Fields

| Field Label | API Name | Type | Notes |
|-------------|---------|------|-------|
| Name | `Name` | Auto-name | "Renewal - [Funding Name]" |
| Original Funding | `Original_Funding` | Lookup → Fundings | |
| Merchant | `Merchant` | Lookup → Contacts | |
| Business | `Business` | Lookup → Accounts | |
| Original Funded Amount | `Original_Funded_Amount` | Currency | |
| Original Factor Rate | `Original_Factor_Rate` | Decimal | |
| Original Payment Amount | `Original_Payment_Amount` | Currency | |
| Original Lender | `Original_Lender` | Single Line Text | Store lender name as text |
| Original Funding Date | `Original_Funding_Date` | Date | |
| Payoff of Original Deal | `Payoff_of_Original_Deal` | Currency | |
| Current Paydown | `Current_Paydown` | Number | |
| Current Balance Remaining | `Current_Balance_Remaining` | Currency | |
| Renewal Stage | `Renewal_Stage` | Picklist | Section 2.11 — default: `Eligibility Review` |
| Eligible Date | `Eligible_Date` | Date | **AUTO-SET** by renewal-check job |
| Renewal Approved Amount | `Renewal_Approved_Amount` | Currency | |

---

## SECTION 10 — LENDERS MODULE: Create + Fields

If missing: `Setup → Modules and Fields → + New Module → "Lenders"`

### 10.1 — Add Fields

All fields below are read by lender matching automation. Names must be exact.

| Field Label | API Name | Type | Notes |
|-------------|---------|------|-------|
| Lender Name | `Name` | Auto-name | Full legal name |
| Lender Status | `Lender_Status` | Picklist | Section 2.12 — default: `Active` |
| Minimum FICO | `Minimum_FICO` | Number (Integer) | |
| Minimum Monthly Revenue | `Minimum_Monthly_Revenue` | Currency | |
| Minimum TIB Months | `Minimum_Time_in_Business_Months` | Number (Integer) | |
| Minimum Funding Amount | `Minimum_Funding_Amount` | Currency | |
| Maximum Funding Amount | `Maximum_Funding_Amount` | Currency | |
| Excluded Industries | `Excluded_Industries` | Text Area | Comma-separated — matching checks if Account.Industry is in this list |
| Excluded States | `Excluded_states` | Text Area | ⚠️ **lowercase 's'** — comma-separated state abbreviations |
| Funds Sole Props | `Funds_Sole_Props` | Checkbox | Will they fund Sole Proprietors? |
| Priority Rank | `Priority_Rank` | Number (Integer) | Lower = preferred — automation picks lowest matching rank |
| Commission Rate (%) | `Commission_Rate` | Decimal | Your standard % with this lender |
| Contact Name | `Contact_Name` | Text | Your rep at this lender |
| Contact Email | `Contact_Email` | Email | |
| Contact Phone | `Contact_Phone` | Phone | |
| Notes | `Notes` | Text Area | Special terms, restrictions, preferences |

---

## SECTION 11 — OFFERS + STIPS MODULES: Create + Verify

### 11.1 — Offers Module

If it doesn't exist: `Setup → Modules and Fields → + New Module → "Offers"`

**Fields:**

| Field Label | API Name | Type |
|-------------|---------|------|
| Submission | `Submission` | Lookup → Deals |
| Lender | `Lender` | Lookup → Lenders |
| Factor Rate | `Factor_Rate` | Decimal |
| Offered Amount | `Offered_Amount` | Currency |
| Term Months | `Term_Months` | Number |
| Commission (%) | `Commission` | Decimal |
| Offer Status | `Offer_status` | Picklist — Section 2.16 |
| Offer Received Date | `Offer_Received_Date` | Date |
| Offer Expiration Date | `Offer_Expiration_Date` | Date |
| Notes | `Notes` | Text Area |

Add Offers as a Related List on Deals layout (Section 7.2).

### 11.2 — Stips Module

If it doesn't exist: `Setup → Modules and Fields → + New Module → "Stips"`

**Fields:**

| Field Label | API Name | Type |
|-------------|---------|------|
| Submission | `Submission` | Lookup → Deals |
| Lender | `Lender` | Lookup → Lenders |
| Stip Type | `Stip_Type` | Picklist — Section 2.17 |
| Stip Status | `Stip_Status` | Picklist — Section 2.18 |
| Priority | `Priority` | Picklist — Section 2.19 |
| Requested Date | `Requested_Date` | Date |
| Due Date | `Due_Date` | Date |
| Received Date | `Received_Date` | Date |
| Notes | `Note` | Text Area |

Add Stips as a Related List on Deals layout.

---

## SECTION 12 — CUSTOM FIELDS SUMMARY: The Automation-Critical Ones

These fields are written by automation. If they don't exist, the job silently skips or crashes.

### Written by automation — never edit manually:

| Module | API Name | Written By |
|--------|---------|-----------|
| Leads | `Campaigns_Added` | add-to-nurture.js |
| Deals | `Desk_Ticket_ID` | merchant-ticket.js |
| Deals | `Date_Application_Sent` | send-application-confirmation.js |
| Deals | `Days_Lead_to_Fund` | create-funding.js |
| Deals | `Estimated_commision` | commission.js ⚠️ one 's' |
| Fundings | `Books_Invoice_ID` | commission-invoice.js |
| Fundings | `Projects_Project_ID` | funding-project.js |
| Fundings | `Renewal_Eligible` | renewal-check.js |
| Fundings | `Renewal_Eligible_Date` | renewal-check.js |
| Accounts | `Total_Times_Funded` | create-funding.js |
| Accounts | `Total_Funded_Amount_Lifetime` | create-funding.js |
| Accounts | `First_Funded_Date` | create-funding.js |
| Accounts | `Last_Funded_Date` | create-funding.js |
| Accounts | `TIB_Band` | tib-band.js |

---

## SECTION 13 — ZOHO DESK: Custom Field on Ticket Layout

Navigate: `Zoho Desk → Setup → Layouts → Tickets → [Default Layout] → Custom Fields → + Add Field`

| Field Label | API Name | Type | Notes |
|-------------|---------|------|-------|
| CRM Deal ID | `cf_crm_deal_id` | Single Line Text | merchant-ticket.js writes Deal.id here for bidirectional lookup |

**Verify:** Open any Ticket — the field must appear in the form.

---

## SECTION 14 — LEAD CONVERSION FIELD MAPPING

**Why this is critical:** When a rep clicks "Convert" on a Lead to create a Contact + Account + Deal, Zoho copies field values. Without configuring the mapping, FICO score, Monthly Revenue, and other key fields are blank on the Contact after conversion — and reps have to re-enter everything manually.

Navigate: `Setup → Modules and Fields → Leads → Lead Conversion → Map Conversion Fields`

### Lead → Contact Mapping

| Lead Field (API Name) | Contact Field (API Name) |
|----------------------|------------------------|
| `FICO_score` | `FICO_score` |
| `FICO_Band` | `FICO_Band` |
| `Monthly_Revenue_USD` | `Monthly_Revenue_USD` |
| `Date_Business_Started` | `Date_Business_Started` |
| `Entity_Type` | `Entity_Type` |
| `NSFs_Last_3_Months` | `NSFs_Last_3_Months` |
| `Negative_Days_Last_3_Months` | `Negative_Days_Last_3_Months` |
| `Use_of_Funds` | `Use_of_Funds` |

### Lead → Account Mapping

| Lead Field (API Name) | Account Field (API Name) |
|----------------------|------------------------|
| `Monthly_Revenue_USD` | `Monthly_Revenue` |
| `Date_Business_Started` | `Date_Business_Started` |
| `Industry` | `Industry` |
| `Entity_Type` | `Entity_Type` |
| `State` | `Billing_State` |

### Lead → Deal Mapping

| Lead Field (API Name) | Deal Field (API Name) |
|----------------------|---------------------|
| `Requested_Amount` | `Amount` |
| `Use_of_Funds` | `Use_of_Funds` |

**Test:** Create a test Lead with all fields filled → Convert → open the new Contact and Account → verify fields are populated.

---

# PART 2 — CRM CONFIGURATION

---

## SECTION 15 — LEAD SCORING RULES: The Revenue Engine

**Why:** Without this, `Lead_Scores = 0` for every lead. Campaign segmentation is meaningless. Reps can't prioritize. The 70/30 thresholds in automation are calibrated to this exact scoring model.

Navigate: `Setup → Automation → Scoring Rules → + New Rule`

**Setup:**
- Name: `MCA Lead Quality`
- Module: `Leads`
- Auto-apply on Create and Edit: ✅ ON
- Leave Maximum Score blank (Zoho allows above 100 and below 0)

---

**CATEGORY 1: Monthly Revenue** (most important — highest weight)

| Criteria | Action |
|----------|--------|
| `Monthly_Revenue_USD` ≥ 100,000 | Award 40 points |
| `Monthly_Revenue_USD` ≥ 50,000 AND < 100,000 | Award 25 points |
| `Monthly_Revenue_USD` ≥ 30,000 AND < 50,000 | Award 15 points |
| `Monthly_Revenue_USD` ≥ 15,000 AND < 30,000 | Award 5 points |
| `Monthly_Revenue_USD` ≥ 10,000 AND < 15,000 | Award 0 points |
| `Monthly_Revenue_USD` < 10,000 | Deduct 10 points |

*Revenue is the #1 predictor of MCA fundability. A $100K/month business can support a $100K advance. $8K/month cannot. Weight this aggressively.*

---

**CATEGORY 2: FICO Score**

| Criteria | Action |
|----------|--------|
| `FICO_score` ≥ 720 | Award 25 points |
| `FICO_score` ≥ 680 AND < 720 | Award 20 points |
| `FICO_score` ≥ 650 AND < 680 | Award 15 points |
| `FICO_score` ≥ 600 AND < 650 | Award 10 points |
| `FICO_score` ≥ 550 AND < 600 | Award 5 points |
| `FICO_score` ≥ 1 AND < 550 | Deduct 10 points |
| `FICO_score` = 0 (not provided) | Award 0 points |

---

**CATEGORY 3: Time in Business Months**

| Criteria | Action |
|----------|--------|
| `Time_in_Business_Months` ≥ 24 | Award 20 points |
| `Time_in_Business_Months` ≥ 12 AND < 24 | Award 10 points |
| `Time_in_Business_Months` ≥ 6 AND < 12 | Award 5 points |
| `Time_in_Business_Months` ≥ 4 AND < 6 | Award 0 points |
| `Time_in_Business_Months` < 4 | Deduct 5 points |

---

**CATEGORY 4: Existing MCA Positions** (second strongest signal — use it)

| Criteria | Action |
|----------|--------|
| `Existing_MCA_Positions` = `0 — Clean` | Award 30 points |
| `Existing_MCA_Positions` = `1 — One position` | Award 15 points |
| `Existing_MCA_Positions` = `2 — Two positions` | Award 5 points |
| `Existing_MCA_Positions` = `3 — Three positions` | Deduct 10 points |
| `Existing_MCA_Positions` = `4+ — Stacked` | Deduct 20 points |

*Stacked merchants (4+ positions) are nearly unfundable. Most lenders stop at 3. A clean merchant at 0 positions is your best lead regardless of other scores.*

---

**CATEGORY 5: Requested Amount**

| Criteria | Action |
|----------|--------|
| `Requested_Amount` ≥ 100,000 | Award 15 points |
| `Requested_Amount` ≥ 50,000 AND < 100,000 | Award 10 points |
| `Requested_Amount` ≥ 25,000 AND < 50,000 | Award 5 points |
| `Requested_Amount` < 25,000 | Award 0 points |

---

**CATEGORY 6: Industry** (negative scoring for restricted)

| Criteria | Action |
|----------|--------|
| `Industry` contains `RESTRICTED` | Deduct 50 points |

*This single rule effectively disqualifies restricted industries regardless of other scores. A cannabis shop making $200K/month: -50 + up to +40 = still negative. Correct.*

---

**CATEGORY 7: Lead Source** (conversion probability)

| Criteria | Action |
|----------|--------|
| `Lead_Source` = `Referral — Merchant` | Award 20 points |
| `Lead_Source` = `Referral — Partner` | Award 15 points |
| `Lead_Source` = `Website Form` | Award 10 points |
| `Lead_Source` = `Live Transfer` | Award 10 points |
| `Lead_Source` = `Google Ads` | Award 5 points |
| `Lead_Source` = `UCC List` | Award 5 points |

*Referral leads close at 3x the rate of cold sources.*

---

**CATEGORY 8: NSFs Last 3 Months** (bank health indicator)

| Criteria | Action |
|----------|--------|
| `NSFs_Last_3_Months` = 0 | Award 10 points |
| `NSFs_Last_3_Months` ≥ 1 AND ≤ 3 | Award 0 points |
| `NSFs_Last_3_Months` ≥ 4 AND ≤ 7 | Deduct 5 points |
| `NSFs_Last_3_Months` ≥ 8 AND ≤ 12 | Deduct 15 points |
| `NSFs_Last_3_Months` > 12 | Deduct 25 points |

*More than 7 NSFs in 3 months = chronic cash flow problems. Lenders see this in bank statements and will reject outright.*

---

**CATEGORY 9: Urgency** (buying signal strength)

| Criteria | Action |
|----------|--------|
| `Urgency` = `ASAP (24-48 hours)` | Award 15 points |
| `Urgency` = `This Week` | Award 10 points |
| `Urgency` = `Next 2 Weeks` | Award 5 points |
| `Urgency` = `This Month` | Award 0 points |
| `Urgency` = `Just Exploring` | Deduct 5 points |

---

**CATEGORY 10: Negative Days Last 3 Months** (bank health)

| Criteria | Action |
|----------|--------|
| `Negative_Days_Last_3_Months` = 0 | Award 5 points |
| `Negative_Days_Last_3_Months` ≥ 1 AND ≤ 3 | Award 0 points |
| `Negative_Days_Last_3_Months` ≥ 4 AND ≤ 7 | Deduct 5 points |
| `Negative_Days_Last_3_Months` > 7 | Deduct 15 points |

---

**CATEGORY 11: Entity Type**

| Criteria | Action |
|----------|--------|
| `Entity_Type` IN [LLC, C-Corp, S-Corp] | Award 5 points |
| `Entity_Type` = `Sole Proprietorship` | Deduct 5 points |

---

### Score Tiers (automation uses these thresholds):

| Score | Tier | Campaign | Response Time |
|-------|------|----------|--------------|
| 70+ | Hot | Hot Leads list | Call within 15 min |
| 30–69 | Nurture | Nurture Sequence | Call within 4 hours |
| < 30 | Low | Low Priority | Follow up when free |
| Negative | Disqualified | Excluded from campaigns | Review before contacting |

### Activate and Test

1. Click **Save**
2. Toggle **Auto-apply = ON**
3. Create a test Lead: Revenue $60K, FICO 720, 0 MCA positions, Referral source, 0 NSFs
4. Save — `Lead_Scores` should auto-populate within 60 seconds (expect ~90–100 for this profile)
5. If stays at 0: check Auto-apply toggle is ON

---

## SECTION 16 — DEAL PIPELINE BLUEPRINT

**Why:** Without Blueprint, reps can move deals to Funded without filling FICO scores. Commissions calculate on $0. Lender matching fails on empty data. Blueprint enforces data discipline at every stage gate.

Navigate: `Setup → Process Management → Blueprint → + Create Blueprint`
- **Module:** Deals
- **Name:** `MCA Funding Pipeline`
- **Field:** Stage

### Stage Transitions and Required Fields

| From Stage | To Stage | Required Before Advancing |
|-----------|---------|--------------------------|
| New | Contacted / Discovery | `Phone`, `Lead_Source` |
| Contacted / Discovery | Application Sent | `Monthly_Revenue_USD` (Contact), `FICO_score` (Contact), `Entity_Type` |
| Application Sent | Application Received | *(none — acknowledgment)* |
| Application Received | Docs Requested | `Date_Business_Started`, `Existing_MCA_Positions` |
| Docs Requested | Docs Received / File Built | *(none)* |
| Docs Received / File Built | Submitted to Lenders | `Lender`, `Approved_Amount` |
| Submitted to Lenders | Offers Received | `Date_First_Offer_Received` |
| Offers Received | Offer Presented | `Factor_Rate`, `Commission` |
| Offer Presented | Contract Sent | **Manager Approval Required** (see below) |
| Contract Sent | Contract Signed | `Date_Contract_Signed` |
| Contract Signed | Stips Clearing | *(none)* |
| Stips Clearing | Funded | `Funded_Amount`, `Date_Funded` |
| Any Stage | Dead | `Dead_Reason` — never let deals die without a reason |

### Manager Approval Gate

For **Offer Presented → Contract Sent**:
- Blueprint Action: **Approval Required**
- Approver: **Sales Manager role**

*This is where your margin is set. Every contract commits to a commission rate. Manager oversight prevents reps from accepting poor rates.*

### Publish and Test

Click **Publish**. Test: open a Deal → try to advance Stage without filling required fields → should block with error message.

---

## SECTION 17 — VALIDATION RULES: Prevent Bad Data

Bad data breaks automation silently. A FICO of `999` passes through every job without error but matches no lender. Validation rules block bad entry at the source.

Navigate: `Setup → Automation → Validation Rules → [Module] → + New Rule`

### Leads Module Validation Rules

**Rule 1: FICO Score Range**
- Condition: `FICO_score is not empty` AND (`FICO_score < 300` OR `FICO_score > 850`)
- Error Message: "FICO Score must be between 300 and 850"

**Rule 2: Monthly Revenue Non-Negative**
- Condition: `Monthly_Revenue_USD is not empty` AND `Monthly_Revenue_USD < 0`
- Error Message: "Monthly Revenue cannot be negative"

**Rule 3: Business Start Date Not Future**
- Condition: `Date_Business_Started is not empty` AND `Date_Business_Started > TODAY()`
- Error Message: "Business Start Date cannot be in the future"

**Rule 4: NSFs Non-Negative**
- Condition: `NSFs_Last_3_Months is not empty` AND `NSFs_Last_3_Months < 0`
- Error Message: "NSFs cannot be negative"

### Deals Module Validation Rules

**Rule 1: Factor Rate Range**
- Condition: `Factor_Rate is not empty` AND (`Factor_Rate < 1.0` OR `Factor_Rate > 3.0`)
- Error Message: "Factor Rate must be between 1.0 and 3.0"

**Rule 2: Commission Reasonable**
- Condition: `Commission is not empty` AND (`Commission < 0` OR `Commission > 25`)
- Error Message: "Commission % must be between 0 and 25"

**Rule 3: Funded Amount Positive**
- Condition: `Funded_Amount is not empty` AND `Funded_Amount <= 0`
- Error Message: "Funded Amount must be greater than zero"

---

## SECTION 18 — DUPLICATE CHECK RULES: Data Hygiene

Without duplicate rules, the same merchant can appear in CRM multiple times. They get added to Campaigns twice, matched to lenders twice, and issued two welcome tickets.

Navigate: `Setup → Modules and Fields → [Module] → Duplicate Rules → + New Rule`

### Leads: Duplicate Check

**Rule Name:** `Duplicate Lead Check`
- **Condition 1:** `Email` is an exact match with another Lead
- **Action:** Show warning — "A Lead with this email already exists. Check before saving."
- (Warning only — don't block. Rep may be intentionally re-creating.)

**Rule 2:** `Phone` + `Last_Name` both match → same warning

### Contacts: Duplicate Check

**Rule Name:** `Duplicate Contact Check`
- **Condition:** `Email` exact match with another Contact
- **Action:** Show warning

### Accounts: Duplicate Check

**Rule Name:** `Duplicate Business Check`
- **Condition:** `Account_Name` exact match AND `Billing_State` exact match
- **Action:** Show warning

---

## SECTION 19 — WORKFLOW RULES: Real-Time Notifications

The automation system handles most notifications at 8 AM. But some alerts need to fire instantly, not wait 24 hours. These four workflow rules are the exception.

Navigate: `Setup → Automation → Workflow Rules → [Module] → + New Rule`

**Note:** These rules send emails only. They do NOT replace automation job logic.

---

### Workflow 1: New Lead Assigned — Instant Rep Notification

**Module:** Leads  
**Rule Name:** `Lead Assigned — Notify Rep`  
**Trigger:** Record Edit — when `Owner` field changes  
**Condition:** `Lead_Status` ≠ `Do Not Contact`  
**Action:** Email — Send to Lead Owner

Email subject: `New Lead Assigned: {Lead_Name} — Score: {Lead_Scores}`  
Email body:
```
You have a new lead assigned:

Merchant: {First_Name} {Last_Name}
Phone: {Phone}
Email: {Email}
Monthly Revenue: {Monthly_Revenue_USD}
FICO Score: {FICO_score}
Lead Score: {Lead_Scores}
Industry: {Industry}

Log in to CRM to view: [Deal Link]
```

*Why immediate:* A rep won't see a daily 8 AM summary until the next morning. A Hot Lead (score 70+) needs a call within 15 minutes — not 24 hours.

---

### Workflow 2: Deal Funded — Celebration to Whole Team

**Module:** Deals  
**Rule Name:** `Deal Funded — Team Alert`  
**Trigger:** Record Edit — when `Stage` changes to `Funded`  
**Action:** Cliq Message to `#deals-funded` channel

Message:  
`🎉 {Owner.Full_Name} just funded {Account_Name} — ${Funded_Amount}! 🎉`

---

### Workflow 3: Stalled Deal Warning

**Module:** Deals  
**Rule Name:** `Stalled Deal — Manager Alert`  
**Trigger:** Time-Based — 7 days after `Modified_Time` with no Stage change  
**Condition:** `Stage` NOT IN [Funded, Dead]  
**Action:** Email to Deal Owner + Sales Manager

Subject: `⚠️ Stalled Deal: {Deal_Name} — {Stage} for 7 Days`

---

### Workflow 4: Renewal Eligible — Rep Notification

**Module:** Fundings  
**Rule Name:** `Renewal Eligible — Notify Rep`  
**Trigger:** Record Edit — when `Renewal_Eligible` changes to `true`  
**Action:** Email to the Deal Owner (via Submission → Deal.Owner)

Subject: `RENEWAL ELIGIBLE: {Merchant_Name} has reached 50% paydown`  
Body: Include original funded amount, current paydown, eligible date.

---

## SECTION 20 — VALIDATION LAYOUT: CRM Page Layouts per Role

Different roles should see different fields. Reps don't need to see commission rates. Managers need all fields.

Navigate: `Setup → Modules and Fields → Deals → Layouts → + New Layout`

### Create "Sales Rep — Deal Layout"

Fields to **HIDE from reps:**
- `Commission (%)` — reps shouldn't negotiate commission rates
- `Buy_Rate` — your cost structure, confidential
- `Net_to_Merchant` — calculated field showing your margin
- `Books_Invoice_ID` — automation marker, confusing for reps
- `Desk_Ticket_ID` — automation marker

Assign this layout to the Sales Representative profile.

### Create "Manager — Deal Layout"

Full layout — all fields visible including commission, rates, automation markers.

Assign to Sales Manager and Admin profiles.

---

## SECTION 21 — DUPLICATE RULES CONTINUED: Kanban / Canvas View

Set up a visual pipeline view that reps use every morning.

Navigate: `CRM → Deals → View Dropdown → + Create View → Kanban`

**Kanban Setup:**
- **Name:** `Pipeline Board`
- **Group By:** Stage
- **Card Fields to Show:**
  - Deal Name (primary)
  - Account Name (merchant)
  - Amount
  - Owner (rep)
  - Modified Time (days since last update)
- **Filter:** Stage ≠ Dead
- **Sort within column:** Amount descending

**Why reps need this:** The list view is rows. The Kanban shows the pipeline as columns. Reps can see at a glance how many deals are in each stage, spot stalled deals (no update date), and drag cards to advance stages.

Set this as the **Default View** for Sales Rep profile.

---

## SECTION 22 — MACROS FOR SALES REPS: One-Click Actions

Macros let reps perform multi-step actions with one click. These three save 10+ minutes per rep per day.

Navigate: `Setup → Automation → Macros → + New Macro`

### Macro 1: Quick Follow-Up Task

**Name:** `Set Follow-Up Tomorrow`  
**Applies to:** Deals  
**Actions:**
1. Create Task: Title = "Follow up: {Deal_Name}", Due Date = Tomorrow, Priority = High
2. Add Note: "Follow-up task created on {DATE}"

### Macro 2: Application Sent

**Name:** `Mark Application Sent`  
**Applies to:** Deals  
**Actions:**
1. Update field: Stage = `Application Sent`
2. Update field: Date_Application_Sent = TODAY()
3. Create Task: Title = "Follow up: confirm merchant received application", Due = 2 days from now

### Macro 3: Deal Review Package

**Name:** `Quick Deal Summary`  
**Applies to:** Deals  
**Actions:**
1. Sends email to Deal Owner with a summary of all Deal fields
2. Good for manager review calls

**How to use:** On any Deal record, click the Macro button (wrench icon) → select the macro.

---

## SECTION 23 — COMMISSIONS MODULE: Create

Navigate: `Setup → Modules and Fields → + New Module`

- **Module Name:** `Commissions`
- **Singular Label:** `Commission`

### Add Fields

| Field Label | API Name | Type | Required |
|-------------|---------|------|---------|
| Rep | `Rep` | Lookup → Users | Yes |
| Deal | `Submission` | Lookup → Deals | Yes |
| Funding | `Funding` | Lookup → Fundings | No |
| Commission Amount | `Commission_Amount` | Currency | Yes |
| Commission Type | `Commission_Type` | Picklist (Section 2.21) | Yes |
| Period | `Period` | Single Line Text | No — e.g., "May 2026" |
| Status | `Status` | Picklist (Section 2.22) | Yes |
| Notes | `Notes` | Text Area | No |

### CRITICAL: Document the Auto-Generated API Name

After creating:  
`Setup → Modules and Fields → Modules List → find your Commissions module`

Write the exact API name here: ________________

**It might be `Commissions` or `Commisions` (Zoho sometimes typos auto-generated names).** Give this to your developer — the code must reference it exactly.

---

## SECTION 24 — 5 CORE CRM REPORTS

Navigate: `CRM → Reports → + Create Report`

---

### Report 1: Pipeline by Stage

- **Module:** Deals | **Type:** Summary
- **Columns:** `Deal_Name`, `Stage`, `Amount`, `Owner`, `Contact_Name`, `Created_Time`
- **Filter:** `Stage` ≠ `Dead`
- **Group By:** `Stage` | **Sort:** `Amount` descending
- **Name:** `Pipeline by Stage`

*What it tells you: Where is your money sitting? Which stage is the bottleneck? Run this every morning. A stage with 10+ deals is where your growth is stuck.*

---

### Report 2: Funded This Month

- **Module:** Deals | **Type:** Tabular
- **Columns:** `Deal_Name`, `Contact_Name`, `Account_Name`, `Approved_Amount`, `Funded_Amount`, `Date_Funded`, `Days_Lead_to_Fund`, `Owner`
- **Filters:** `Stage` = `Funded` AND `Date_Funded` ≥ first day of this month
- **Group By:** `Owner` | **Name:** `Funded This Month`

*Monthly revenue by rep. Compare to quota Friday afternoon.*

---

### Report 3: Renewal Pipeline

- **Module:** Renewals | **Type:** Tabular
- **Columns:** `Name`, `Merchant`, `Renewal_Approved_Amount`, `Renewal_Stage`, `Eligible_Date`
- **Filter:** `Renewal_Stage` = `Eligible`
- **Sort:** `Eligible_Date` ascending
- **Name:** `Renewal Pipeline`

*Your warmest pipeline. Renewals close at 3x the rate of new deals.*

---

### Report 4: Rep Performance — 90 Days

- **Module:** Deals | **Type:** Summary
- **Columns:** `Owner`, COUNT of Deals, SUM of `Funded_Amount`, AVG of `Days_Lead_to_Fund`
- **Filters:** `Stage` = `Funded` AND `Date_Funded` ≥ 90 days ago
- **Group By:** `Owner` | **Sort:** SUM of `Funded_Amount` descending
- **Name:** `Rep Performance — 90 Days`

*Run Friday. Anyone under 2 funded deals in 90 days needs a Monday 1-on-1.*

---

### Report 5: Stalled Deals

- **Module:** Deals | **Type:** Tabular
- **Columns:** `Deal_Name`, `Stage`, `Owner`, `Contact_Name`, `Amount`, `Modified_Time`
- **Filters:** `Stage` NOT IN [`Funded`, `Dead`] AND `Modified_Time` < 7 days ago
- **Sort:** `Modified_Time` ascending (oldest first)
- **Name:** `Stalled Deals`

*Deals dying quietly. Call every deal on this list by noon. No exceptions.*

---

### Dashboard

`CRM → Home → Dashboards → + New Dashboard → "Daily Operations"`

Add all 5 reports. Set as your Home page default.

---

## SECTION 25 — AUDIT TRAIL SETUP

Navigate: `Setup → Organization Settings → Audit Trail → Enable`

Enable field-level tracking on Deals for:
- `Stage` — every stage movement with timestamp and user
- `Owner` — reassignments
- `Lender` — lender changes
- `Date_Funded` — when funded

*Without this, a Deal can move from Stage 1 to Stage 13 with no history. For compliance and dispute resolution — this is non-negotiable.*

---

# PART 3 — APP SETUP

---

## SECTION 26 — ZOHO MAIL: Email Account + SMTP + Deliverability

This section covers three things that must all be done for emails to reach merchants without going to spam.

---

### 26.1 — Create the Sending Email Account

If `applications@commerafunding.com` doesn't exist in Zoho Mail:

Navigate: `Zoho Mail → Admin Console → Add Account`

- **Email Address:** `applications@commerafunding.com`
- **Account Type:** Business Account
- **Display Name:** `Commera Funding`

This is the email address automation uses for all outbound merchant emails.

---

### 26.2 — Generate SMTP App Password

Navigate: `Zoho Mail → https://mail.zoho.com → Settings (gear icon) → Accounts → Connected Accounts → App Passwords`

1. Click **+ Generate New App Password**
2. Name it: `zoho-commera-smtp`
3. The password shows **ONCE** — copy it immediately
4. Open `C:\Users\fkozi\zoho commera\.env`
5. Set:
```
ZOHO_SMTP_USER=applications@commerafunding.com
ZOHO_SMTP_PASS=[the app password you just copied]
```

**Do NOT use your main Zoho account password as SMTP_PASS. Always use an app-specific password.**

---

### 26.3 — Email Deliverability: SPF Record (DNS)

Without an SPF record, your automation emails go to spam. This is a DNS change.

Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) for `commerafunding.com`.

**Add a TXT record:**
- **Host:** `@` (or `commerafunding.com`)
- **Value:** `v=spf1 include:zoho.com ~all`
- **TTL:** 3600

If you already have an SPF record, add `include:zoho.com` to the existing record. You can only have one SPF record per domain.

---

### 26.4 — Email Deliverability: DKIM (DNS + Zoho Mail)

DKIM cryptographically signs your emails. Without it, many corporate spam filters will block Commera emails.

**Step 1: Enable DKIM in Zoho Mail**
Navigate: `Zoho Mail → Admin Console → Domains → [commerafunding.com] → DKIM → Enable DKIM`

Zoho will generate a DKIM public key and show you a CNAME record to add.

**Step 2: Add the CNAME to your DNS**
- **Host:** Something like `zoho._domainkey` (Zoho tells you exactly)
- **Type:** CNAME
- **Value:** (Zoho provides the target)

**Step 3: Verify**
Back in Zoho Mail → DKIM → click **Verify**. Should show green checkmark within 24-48 hours (DNS propagation time).

---

### 26.5 — Email Deliverability: DMARC Record (DNS)

DMARC tells email servers what to do with unauthenticated email claiming to be from your domain.

**Add a TXT record:**
- **Host:** `_dmarc` (results in `_dmarc.commerafunding.com`)
- **Value:** `v=DMARC1; p=quarantine; rua=mailto:dmarc@commerafunding.com; pct=100`

**What this does:**
- `p=quarantine` — suspicious emails go to spam (not rejected — safer to start with quarantine)
- `rua=` — DMARC reports go to this address (create a mailbox or use a free service)
- After 30 days with no issues, upgrade to `p=reject` for maximum protection

---

### 26.6 — Email Signature Setup

Navigate: `Zoho Mail → Settings → Signatures → + Create Signature`

Create a signature for `applications@commerafunding.com`:

```
—
Commera Funding
Phone: [office number]
Email: applications@commerafunding.com
www.commerafunding.com

This email may contain confidential information. If you received this in error, please delete it.
```

---

### 26.7 — Test Email Sending

After setting credentials in `.env`:

```bash
cd "C:\Users\fkozi\zoho commera"

# Dry run first (no actual emails sent)
DRY_RUN=true npm run send-app-confirmation

# Live test
npm run send-app-confirmation

# Check audit.log for success
tail -20 audit.log
```

Expected: `"Application confirmation sent via SMTP"` for each merchant in CRM.

If you see `"Invalid login"`: regenerate the SMTP app password and update `.env`.  
If emails go to spam: SPF/DKIM not propagated yet. Wait 24-48 hours.

---

## SECTION 27 — ZOHO BOOKS: Configuration

### 27.1 — Verify Organization ID

Navigate: `Zoho Books → Settings → Organizations`

Copy the Organization ID. Verify it matches:
```
ZOHO_BOOKS_ORG_ID=[organization ID]
```

### 27.2 — Create "Commission Collection" Customer

Navigate: `Books → Contacts → + New Customer`

- **Customer Name:** `Commission Collection`
- **Customer Type:** Business
- **Currency:** USD
- Click **Save**

After saving:
1. URL shows: `.../contacts/[CUSTOMER_ID]`
2. Copy the long number at end of URL
3. Add to `.env`:
```
ZOHO_BOOKS_COMMISSION_CUSTOMER_ID=[number from URL]
```

### 27.3 — Set Invoice Number Prefix

Navigate: `Books → Settings → Preferences → General → Invoice Number Prefix`

Set prefix to: `CMR-`

**Critical:** commission-invoice.js creates invoices with reference `CMR-{FundingID}`. It queries Books to check if this reference already exists (idempotency). Different prefix = broken idempotency = duplicate invoices.

### 27.4 — Default Payment Terms

Navigate: `Books → Settings → Preferences → Customer Payment Terms`

Set: `Due on Receipt`

### 27.5 — Chart of Accounts

Navigate: `Books → Accountant → Chart of Accounts → + New Account`

| Account Name | Account Type |
|-------------|--------------|
| ISO Commission Income | Income |
| Rep Commission Payable | Liability |
| Marketing Expenses | Expense |
| Software & SaaS | Expense |

### 27.6 — Add Your Business Bank Account

Navigate: `Books → Banking → + Add Bank Account`

Connect your business checking account where commissions are received. This enables you to match commission invoices against actual bank deposits and track receivables vs. collected.

---

## SECTION 28 — ZOHO DESK: Configuration

### 28.1 — Verify Organization ID

Navigate: `Desk → Setup → Developer Space → API`

Copy the Organization ID. Verify it matches:
```
ZOHO_DESK_ORG_ID=[organization ID]
```

### 28.2 — Create "New Merchant Onboarding" Category

Navigate: `Desk → Setup → Categories → + New Category`

- **Category Name:** `New Merchant Onboarding`
- **Description:** Automated welcome tickets created when new merchant deals are received

After saving, note the Category ID from the URL. Add to `.env`:
```
ZOHO_DESK_ONBOARDING_CATEGORY_ID=[ID from URL]
```

### 28.3 — Configure Incoming Email for Desk

Navigate: `Desk → Setup → Channels → Email → + Add Email`

Add `support@commerafunding.com` (or your support email). Emails sent to this address automatically create Desk tickets. This is separate from the automation tickets — it's for merchant-initiated support requests.

### 28.4 — SLA Policy for Merchant Tickets

Navigate: `Desk → Setup → SLA → + New SLA`

**SLA Name:** `Merchant Onboarding SLA`  
**Applies to:** Category = New Merchant Onboarding  
**Response Time:** 2 hours  
**Resolution Time:** 48 hours  
**Escalation:** Email Sales Manager if SLA breached

### 28.5 — Ticket Views

Navigate: `Desk → Views → + Add View`

**View 1: New Merchant Tickets Today**
- Filter: Category = New Merchant Onboarding AND Created Time = Today
- Purpose: All tickets created by automation this morning

**View 2: Open Onboarding — 7+ Days**
- Filter: Status = Open AND Created Time < 7 days ago AND Category = New Merchant Onboarding
- Purpose: Escalation queue — any unresolved ticket over a week is a problem

### 28.6 — Auto-Assignment Rule

Navigate: `Desk → Setup → Assignment Rules → + New Rule`

- **Name:** `Merchant Onboarding Auto-Assign`
- **Condition:** Category = New Merchant Onboarding
- **Action:** Assign to [team or agent] handling merchant onboarding

### 28.7 — Ticket Response Templates

Navigate: `Desk → Setup → Reply Templates → + New Template`

**Template 1: Welcome Response**
```
Hi {Contact.First_Name},

Welcome to Commera Funding! Your application is in our system and being processed.

Your next step: Our team will contact you within 1 business day to discuss your funding options.

Questions? Reply to this ticket or call us at [phone].

Thank you for choosing Commera.
```

**Template 2: Stips Request**
```
Hi {Contact.First_Name},

To move forward with your funding application, we need the following documents:

[List stips here]

Please upload or email these documents by {Due_Date}.

Our team is standing by to help. Reply here or call [phone].
```

---

## SECTION 29 — ZOHO CAMPAIGNS: Configuration

### 29.1 — Verify Sending Domain

Navigate: `Campaigns → Settings → Email Authentication`

Add and verify `commerafunding.com` as your sending domain. Campaigns will provide DNS records to add (similar to Section 26.3-26.4). Without domain verification, Campaigns emails show as "sent on behalf of" and get filtered as spam.

### 29.2 — Create 3 Mailing Lists

Navigate: `Campaigns → Mailing Lists → + Add Mailing List`

| List Name | Target Score | Purpose |
|-----------|-------------|---------|
| `Commera — Hot Leads` | 70+ | Urgent outreach, close fast |
| `Commera — Nurture Sequence` | 30-69 | Education and warming |
| `Commera — Low Priority` | < 30 | Stay-in-touch, monthly |

After creating each:
1. Open the list detail page
2. Copy the **List Key** from URL or settings
3. Add to `.env`:
```
ZOHO_CAMPAIGNS_LIST_HOT=[Hot Leads list key]
ZOHO_CAMPAIGNS_LIST_NURTURE=[Nurture Sequence list key]
ZOHO_CAMPAIGNS_LIST_LOW=[Low Priority list key]
```

### 29.3 — CAN-SPAM Compliance (Legal Requirement)

Every email campaign must include:

1. **Physical mailing address** — add to your account footer  
   Navigate: `Campaigns → Settings → Organization → Footer Settings`  
   Add: `Commera Funding, [Street Address], [City, State, ZIP]`

2. **Unsubscribe link** — Zoho adds this automatically to all Campaigns emails. Do not remove it from any template.

3. **From Name:** `Commera Funding` (not a personal name for marketing emails)

4. **From Address:** Must be `applications@commerafunding.com` or another verified domain address

### 29.4 — Double Opt-In (Recommended)

Navigate: `Campaigns → Mailing Lists → [each list] → Settings → Subscription Confirmation → Require Confirmation`

Enable double opt-in for all 3 lists. Leads receive a confirmation email before being added. This reduces spam complaints, improves deliverability, and ensures compliance.

**Note:** When double opt-in is on, leads added by automation get a confirmation email before appearing in the list. They are not added until they confirm.

### 29.5 — Build Email Sequences (Autoresponders)

Navigate: `Campaigns → Autoresponders → + Create`

**Hot Leads sequence (4 emails, every 2 days):**
1. Day 0: Personalized application invitation — "Your custom funding offer is ready"
2. Day 2: "[First_Name], funding could hit your account in 48 hours"
3. Day 4: "Quick 10-minute call to lock in your rate?"
4. Day 6: Final — "Our last contact attempt on this offer"

**Nurture sequence (6 emails, weekly):**
1. Week 1: "How merchant cash advances work — and what makes us different"
2. Week 2: Success story from their industry vertical
3. Week 3: "What lenders actually look for when reviewing bank statements"
4. Week 4: Funding estimate calculator — "Here's what you might qualify for"
5. Week 5: "Ready when you are — no pressure, no sales pitch"
6. Week 6: Re-engagement — "Is this still relevant for you?"

**Low Priority (monthly newsletter):**
- Industry updates, market conditions, interest rate commentary
- Educational content, not sales
- One CTA: "Check your current funding eligibility"

### 29.6 — Unsubscribe Handling

When a lead unsubscribes from Campaigns:
- They are automatically removed from all Campaigns lists
- Do NOT manually re-add them (legal violation — CAN-SPAM)
- Optionally set up automation: when unsubscribe occurs → update `Lead_Status = 'Do Not Contact'` in CRM

---

## SECTION 30 — ZOHO SIGN: MCA Contract Template

Navigate: `Zoho Sign → Templates → + Create Template`

### Upload Document

1. Upload your MCA Funding Agreement (PDF)
2. Template Name: `MCA Funding Agreement`

### Add Signature Fields (Required)

- **Merchant Signature** — Required
- **Merchant Printed Name** — Required
- **Date Signed** — Auto-Fill

### Add Pre-Fill Fields From CRM

| Contract Field | CRM Source |
|---------------|-----------|
| Merchant Name | Contact.First_Name + Last_Name |
| Business Name | Account.Account_Name |
| Funding Amount | Deal.Approved_Amount |
| Factor Rate | Deal.Factor_Rate |
| Payback Amount | Deal.Payback_Amount |
| Payment Amount | Deal.Payment_Amount |
| Payment Frequency | Deal.Payment_Frequency |
| Funding Date | Deal.Date_Funded |

### Post-Signing Actions

1. Send copy to: merchant email + sales rep email
2. Notify: when viewed + when signed
3. Store signed PDF in WorkDrive: `Active Deals/[DealID]/Contracts/`

### Reminder Settings

Navigate: `Template Settings → Reminders`

- First reminder: 2 days after sent (if not signed)
- Second reminder: 4 days after sent
- Expiry: 7 days

*Without reminders, merchants forget. Contracts sit unsigned for weeks.*

### Branding

Navigate: `Sign → Settings → Email Branding`

Add Commera logo to Sign emails so merchants recognize the email when it arrives.

### Publish and Test

Click **Publish**. Send a test to your own email with a dummy deal. Verify all fields auto-populate correctly.

---

## SECTION 31 — ZOHO PROJECTS: Setup

### 31.1 — Verify Portal ID

Navigate: `Projects → Settings → Portal Settings`

Confirm the Portal ID matches `.env`:
```
ZOHO_PROJECTS_PORTAL_ID=[portal ID]
```

### 31.2 — Create Onboarding Task Template

Navigate: `Projects → Templates → + New Template`

- **Template Name:** `Merchant Onboarding`
- Add 6 tasks:

| Task | Due Offset |
|------|-----------|
| Collect signed contract | Day +1 |
| Verify bank account for ACH | Day +1 |
| Confirm first payment date with merchant | Day +2 |
| Send welcome kit to merchant | Day +3 |
| Follow up: confirm funds received | Day +5 |
| Schedule 30-day check-in call | Day +30 |

### 31.3 — Project Notifications

Navigate: `Projects → Settings → Notifications`

Enable email notifications for:
- Task assigned to me
- Task due today
- Project created (notify project owner)

---

## SECTION 32 — ZOHO PEOPLE: Staff Setup

Navigate: `Zoho People → Employee → + Add Employee`

For each team member:
- Name, Email, Department, Designation
- **Sales Reps:** Designation = `Sales Representative`, Department = `Sales`
- **Managers:** Designation = `Sales Manager`, Department = `Sales`
- **Admin:** Designation = `Admin`

### Working Hours

Navigate: `People → Attendance → Shift Setup`

Create shift: 8:00 AM — 6:00 PM your timezone. Assign to all employees.

### Leave Policies (Optional)

Navigate: `People → Leave → Leave Types → + New Leave Type`

If you want HR tracking:
- `Vacation` — 10 days/year
- `Sick Leave` — 5 days/year
- `Personal Day` — 2 days/year

---

## SECTION 33 — ZOHO INVENTORY: Verify Configuration

Zoho Inventory is wired in the code at `src/inventory/index.js` and its org ID is in `.env`. Even if you're not actively using Inventory for stock tracking, verify it's connected.

Navigate: `Zoho Inventory → Settings → Organizations`

Copy the Organization ID. Verify it matches:
```
ZOHO_INVENTORY_ORG_ID=[organization ID]
```

Run: `npm run test:connection` — Inventory should show `✓ connected`.

If you plan to use Inventory for tracking funded deal documentation inventory or equipment financing, the module is ready for additional automation.

---

## SECTION 34 — CLIQ CHANNELS SETUP

Navigate: `Zoho Cliq → Channels → + Create Channel`

| Channel Name | Purpose | Members | Posting |
|-------------|---------|---------|---------|
| `#ops-automation` | System notifications — 8 AM automation summary | All staff | Automation only — reps read-only |
| `#deals-funded` | Celebration when deals close | All staff | Anyone |
| `#renewals-pipeline` | Renewal eligibility alerts | Sales Manager + Senior Reps | Automation + Manager |
| `#lender-matching` | Daily match results | Sales team | Automation |
| `#deal-[merchant]` | Deal-specific discussion | As needed (per deal) | Anyone on the deal |

**After creating `#ops-automation`:** Verify the channel name in the code matches exactly. Check: `scripts/automation/jobs/create-funding.js` for the exact Cliq channel name used.

### Channel Etiquette Rules (Post to each channel's description)

For `#ops-automation`: "Automated notifications only. Do not post here. If you see an error, take it to your manager or Admin."

---

## SECTION 35 — WORKDRIVE FOLDER STRUCTURE

Navigate: `Zoho WorkDrive → Teams → [Your Team] → + Create Folder`

```
Commera Deals/
├── Active Deals/
│   └── [DealID — Merchant Name]/
│       ├── Application/          ← merchant-submitted application form
│       ├── Bank Statements/       ← 3-6 month statements
│       ├── Tax Returns/           ← 1-2 years
│       ├── Stips/                 ← lender stipulation documents
│       ├── Offers/                ← lender offer sheets
│       └── Contracts/             ← unsigned and signed contract versions
├── Funded Deals/
│   └── [DealID — Merchant Name]/
│       ├── Signed Contract/       ← final signed MCA agreement
│       ├── Wire Confirmation/     ← bank wire receipt
│       └── Funding Agreement/     ← executed agreement
├── Renewals/
│   └── [RenewalID — Merchant Name]/
└── Templates/
    ├── MCA Funding Agreement Template.pdf
    ├── Merchant Welcome Package.pdf
    └── Stips Checklist Template.pdf
```

**After creating the structure:**
- Move any existing deal documents into the correct folders
- Share the `Active Deals` folder with your sales team
- Share the `Templates` folder as read-only for all staff

*This folder structure gives you an auditable paper trail for every deal. When a lender asks for verification or a merchant disputes — every document is here, organized by deal ID.*

---

# PART 4 — DATA ENTRY

---

## SECTION 36 — LENDERS: Enter Your Lender Data

**Most operationally critical data entry in this guide.** Without lenders in the system, lender matching returns 0 results for every deal. Nothing gets submitted anywhere.

Navigate: `CRM → Lenders → + New Lender`

For each lender partner, fill every field from Section 10.1. Missing criteria = wrong matches.

### Priority Ranking Strategy

| Rank | Who Gets It | Why |
|------|------------|-----|
| 1–2 | Best 2 lenders | Fastest funding, best rates, strongest relationship — automation sends deals here first |
| 3–5 | Good secondaries | Use for specific niches (large deals, specific industries) |
| 6–8 | Specialty lenders | Bad credit, restricted industries, very large or very small |
| 9+ | Backups | Only when nothing else matches |

When multiple lenders match a deal, automation picks the lowest Priority_Rank. Update rankings monthly based on approval rates and offer quality.

### Minimum Lender Portfolio Before Going Live

You need **at least 3 active lenders** before starting automation. Without them, every deal returns "no lenders matched" and nothing submits.

Recommended starting portfolio:
- **Rank 1:** General lender — FICO 580+, $10K revenue, most industries, most states
- **Rank 2:** Premium lender — FICO 650+, $25K revenue, better factor rates
- **Rank 3:** Specialty lender — handles Sole Props, 2-3 stacked positions, restricted industries

### What to Fill for Each Lender

Go through every field in Section 10.1. Key fields that break matching if wrong:

- `Lender_Status` must be exactly `Active`
- `Excluded_Industries` must contain the exact industry strings from your picklist (e.g., `RESTRICTED — Cannabis`)
- `Excluded_states` uses state abbreviations (e.g., `ND, SD, VT`) — lowercase field name

---

# PART 5 — GO LIVE

---

## SECTION 37 — START THE AUTOMATION ENGINE

**Only after completing Sections 1–36.** Starting before custom fields exist causes jobs to crash on first record.

### Pre-Launch Verification

Run each of these and confirm they pass before proceeding:

```bash
# Verify all 11 Zoho apps connect
npm run test:connection
# Expected: ✓ connected for all 11 apps

# Dry run — no writes, just verify jobs can load and query
npm run run:dry
# Expected: all 14 jobs show 0 errors
# (0 processed is expected if CRM is empty)
```

If `test:connection` shows any `OAUTH_SCOPE_MISMATCH`:
```bash
npm run setup:oauth -- --full
# Follow prompts to re-authorize all scopes
```

### Start the Scheduler

```bash
# First live run — watch for errors
npm run run

# Check results
tail -30 audit.log

# Start the daily scheduler
npm run scheduler:start

# Verify it's running
npm run scheduler:status
# Should show: status = online

# Persist through machine reboots
npm run scheduler:save
pm2 startup
# Copy and run the command it outputs
```

**The automation now runs every day at 8:00 AM automatically.**

---

## SECTION 38 — FULL VERIFICATION CHECKLIST

Print this page. Check every box before marking setup complete.

### Part 1: Foundation

**Picklists**
- [ ] Deals: Stage — 14 exact values including `Funded` and `New`
- [ ] Deals: Dead Reason — 17 values
- [ ] Leads: Lead Status — includes `Do Not Contact` exactly
- [ ] Leads: Lead Source — 13 values
- [ ] Industry — all values including `RESTRICTED —` prefix format
- [ ] Entity Type — 7 values
- [ ] Urgency — 5 values
- [ ] Existing MCA Positions — 5 values
- [ ] Funding Status — includes `Active` exactly as first/default value
- [ ] Renewal Stage — includes `Eligibility Review` and `Eligible`
- [ ] Lender Status — includes `Active` exactly
- [ ] Offer Status, Stip Type, Stip Status, Stip Priority set

**Users & Roles**
- [ ] Roles created: Admin, Sales Manager, Sales Representative
- [ ] Profiles created with correct permissions
- [ ] All team members have CRM user accounts with real working email addresses
- [ ] Sales Manager assigned to approve Blueprint

**Module Fields**
- [ ] Leads: all 14 custom fields including NSFs, Negative Days, Urgency
- [ ] Contacts: FICO + financial fields match Leads API names exactly
- [ ] Accounts: all 11 fields including funding history fields
- [ ] Deals: all 24 fields including `Estimated_commision` (one 's')
- [ ] Fundings: module created, all 25 fields, `Funding_status` has `Active`
- [ ] Renewals: module created, all 15 fields
- [ ] Lenders: module created, all 15 fields
- [ ] Offers: all fields, related list on Deals layout
- [ ] Stips: all fields, related list on Deals layout
- [ ] All fields added to page layouts (visible on forms)
- [ ] Desk: `cf_crm_deal_id` on Ticket layout

**Lead Conversion Mapping**
- [ ] Lead → Contact: FICO, Revenue, Date Business Started mapped
- [ ] Lead → Account: Revenue, Date Business Started, Industry, State mapped
- [ ] Test: create Lead, convert, verify Contact and Account have correct values

### Part 2: CRM Configuration

- [ ] Lead Scoring Rule "MCA Lead Quality" active, auto-apply ON
- [ ] Test Lead auto-scores correctly (Hot profile should score 70+)
- [ ] Blueprint "MCA Funding Pipeline" published
- [ ] Blueprint blocks stage advancement without required fields
- [ ] Manager approval gate on Contract Sent works
- [ ] Validation rules created for FICO, Revenue, Factor Rate
- [ ] Duplicate check rules on Leads, Contacts, Accounts
- [ ] 4 Workflow Rules created (lead assigned, deal funded, stalled, renewal)
- [ ] Kanban view on Deals set as default for Sales Rep profile
- [ ] Page layouts per role configured
- [ ] 3 Macros created for reps
- [ ] Commissions module created, API name documented: ________________
- [ ] 5 Reports created, Dashboard set
- [ ] Audit Trail enabled on Deals

### Part 3: App Setup

- [ ] Zoho Mail: `applications@commerafunding.com` exists
- [ ] Zoho Mail: SMTP app password generated, in `.env`
- [ ] DNS: SPF record added for `commerafunding.com`
- [ ] DNS: DKIM CNAME record added and verified in Zoho Mail
- [ ] DNS: DMARC record added
- [ ] Email signature created for applications@ account
- [ ] Books: Commission Collection customer created
- [ ] Books: `ZOHO_BOOKS_COMMISSION_CUSTOMER_ID` in `.env`
- [ ] Books: Invoice prefix = `CMR-`
- [ ] Books: Bank account connected
- [ ] Desk: Organization ID correct in `.env`
- [ ] Desk: New Merchant Onboarding category created
- [ ] Desk: `ZOHO_DESK_ONBOARDING_CATEGORY_ID` in `.env`
- [ ] Desk: SLA policy configured
- [ ] Desk: Auto-assignment rule active
- [ ] Campaigns: Sending domain verified
- [ ] Campaigns: 3 mailing lists created
- [ ] Campaigns: All 3 list keys in `.env`
- [ ] Campaigns: CAN-SPAM footer with physical address
- [ ] Campaigns: Email sequences created for all 3 lists
- [ ] Sign: MCA contract template created and published
- [ ] Sign: Test send verified (fields pre-fill from Deal data)
- [ ] Sign: Reminder schedule configured
- [ ] Projects: Portal ID correct in `.env`
- [ ] Projects: Onboarding task template created
- [ ] Cliq: 4 channels created
- [ ] WorkDrive: Folder structure created
- [ ] People: All reps added

### Part 4: Data Entry

- [ ] Minimum 3 lenders entered with all matching criteria fields
- [ ] All lenders: `Lender_Status = Active`
- [ ] Priority ranks assigned strategically

### Part 5: Automation

- [ ] `npm run test:connection` → all 11 apps ✓ connected
- [ ] `npm run run:dry` → 0 errors
- [ ] `npm run run` → first live run, audit.log shows no errors
- [ ] `npm run scheduler:start` done
- [ ] `npm run scheduler:status` → online
- [ ] `npm run scheduler:save` + `pm2 startup` done

---

## SECTION 39 — DAILY OPERATIONS PLAYBOOK

Print this page. This is your team's daily workflow.

### Every Morning (8:15 AM — 10 minutes)

1. Check Cliq `#ops-automation` — did 8 AM automation complete without errors?
2. If errors: `tail -20 audit.log` → fix CRM data → re-run affected job: `npm run [job-name]`
3. Open Dashboard → **Stalled Deals** — call every deal on this list before 10 AM
4. Check **Renewal Pipeline** — any at 50%+ paydown? Assign those to your best closer today
5. Quick review: **Pipeline by Stage** — where is money stuck?

### Sales Reps: Every Lead Check

When you get a Lead assigned (email arrives):
- Score 70+: Call within 15 minutes
- Score 30-69: Call within 4 hours
- Score < 30: Call when free, can let campaign nurture

### Every Friday (4:00 PM — 20 minutes)

1. Run **Rep Performance — 90 Days** report
2. Top performers: recognize in Cliq `#deals-funded`
3. Anyone under 2 funded deals in 90 days: 1-on-1 Monday morning
4. Review stalled deals over 14 days: force decision (advance or kill)
5. Check audit.log errors from the week: `grep '"result":"error"' audit.log | tail -20`

### First Monday of Each Month

1. `npm run test:connection` — verify all 11 apps still connect
2. Review Campaigns metrics — open rate, click rate, unsubscribes
3. Review lender portfolio — any to add, deactivate, or re-rank?
4. Check renewal pipeline conversion rate — are eligible merchants actually renewing?

### Every Quarter (First Friday of Quarter)

1. Rotate SMTP App Password in Zoho Mail → update `.env` → test
2. `npm run setup:oauth -- --full` — refresh OAuth token
3. Review and update Lender Priority Rankings based on 90-day performance data
4. Audit Lead Scoring criteria — do the thresholds still match your default rates?
5. Review workflow notification rules — still relevant?

---

## SECTION 40 — EXPERT UPGRADE RECOMMENDATIONS

Once the system is running smoothly (first 30 days), consider these upgrades in order of ROI.

---

### Upgrade 1: Zoho Analytics — Executive Intelligence

`CRM → Setup → Marketplace → Zoho Analytics → Install`

Build dashboards for:
- Revenue trend by month (funded amounts over rolling 12 months)
- Pipeline velocity by rep (average days per stage transition)
- Rep commission forecast (based on current pipeline + close probability)
- Lender approval rate + offer quality by lender
- Default rate by industry, FICO band, TIB band (identify your risk profile)

*ROI: You see bottlenecks in 30 seconds instead of running 5 reports manually. One hour of Zoho Analytics setup replaces 4 hours/week of manual Excel.*

---

### Upgrade 2: Web-to-Lead Form — Inbound Capture

`CRM → Setup → Developer Space → Webforms → + New Form`

Form fields: Business name, owner name, email, phone, monthly revenue, FICO estimate, requested amount, industry, time in business, urgency.

Embed on pricing page. Every submission → Lead → instant scoring → 8 AM campaign queue.

*ROI: Eliminates manual Lead entry for inbound traffic. Reps only manually enter cold outreach.*

---

### Upgrade 3: Zoho SalesIQ — Live Chat Qualification

`Setup → Marketplace → SalesIQ → Install`

Configure:
- Trigger chat on pricing page after 45 seconds
- Bot pre-qualifies: revenue, FICO estimate, funding need
- Auto-creates Lead in CRM from chat conversation

*ROI: Live chat leads convert at 3-5x higher rates than form submissions. Active interest = now.*

---

### Upgrade 4: Zoho Sign Webhook — Auto-Advance Deal Stage

When a merchant signs a contract, the Deal stage should advance automatically to `Contract Signed` without rep involvement.

`Sign → Settings → Webhooks → Add on "Document Signed"`

Requires a small Node.js listener endpoint (or Zoho Flow action) that:
1. Receives the Sign event with document ID
2. Finds the Deal by Sign template match
3. Updates Stage to `Contract Signed` and `Date_Contract_Signed` to today

*ROI: Eliminates the #1 deal stall — contracts sitting signed for 3-5 days while reps forget to advance the stage.*

---

### Upgrade 5: Proactive Renewal Outreach

Once you have 10+ funded deals, add this to your Monday routine:

1. Open **Renewal Pipeline**
2. Filter: `Current_Paydown` between 40-49% (these hit 50% within 30-60 days)
3. Pre-assign to your best closer **today** — before automation sends the renewal notification
4. Send a soft warm-up email from marketing: "Checking in — how are things going with the business?"

*ROI: Pre-warmed merchants at 50% paydown close renewals at 50%+ rate. Cold contacts at exactly 50% close at 20%. Time the outreach before they know they qualify.*

---

### Upgrade 6: Lender Performance Tracking (Monthly)

Build a custom report tracking per lender over 90 days:
- Deals submitted vs. approved (approval rate %)
- Average factor rate offered
- Average days from submission to first offer
- Total funded amount via this lender

`CRM → Reports → Create Report → Deals + Lenders`

Review monthly. Actions:
- Lender under 30% approval rate: call your rep — something changed in their criteria
- Lender over 5-day offer time: deprioritize `Priority_Rank`
- Lenders unused for 90+ days: mark `Paused`, free up the slot for new partners

---

## QUICK REFERENCE: EVERY EXACT API FIELD NAME

Print this table. When configuring rules, writing reports, or debugging automation:

### Leads Module
| Label | API Name | Gotcha |
|-------|---------|--------|
| FICO Score | `FICO_score` | lowercase s |
| FICO Band | `FICO_Band` | read-only formula |
| Monthly Revenue | `Monthly_Revenue_USD` | includes _USD suffix |
| Time in Business | `Time_in_Business_Months` | read-only formula |
| Entity Type | `Entity_Type` | |
| Existing MCA Positions | `Existing_MCA_Positions` | |
| NSFs Last 3 Months | `NSFs_Last_3_Months` | |
| Negative Days Last 3 Months | `Negative_Days_Last_3_Months` | |
| Campaigns Added | `Campaigns_Added` | auto-set — never edit |
| Lead Score | `Lead_Scores` | read-only — Zoho-managed |

### Deals Module
| Label | API Name | Gotcha |
|-------|---------|--------|
| Stage | `Stage` | 14 exact string values |
| Approved Amount | `Approved_Amount` | |
| Funded Amount | `Funded_Amount` | |
| Factor Rate | `Factor_Rate` | |
| Payback Amount | `Payback_Amount` | auto-calculated |
| Commission (%) | `Commission` | percentage value |
| Estimated Commission ($) | `Estimated_commision` | **TYPO: one 's'** |
| Date Funded | `Date_Funded` | |
| Days Lead to Fund | `Days_Lead_to_Fund` | auto-calculated |
| Desk Ticket ID | `Desk_Ticket_ID` | auto-set |
| Date Application Sent | `Date_Application_Sent` | auto-set |
| Net to Merchant | `Net_to_Merchant` | |
| Term Months | `Term_Months` | |
| Origination Fee | `Origination_Fee` | capital F |

### Fundings Module
| Label | API Name | Gotcha |
|-------|---------|--------|
| Funding Status | `Funding_status` | **lowercase s** |
| Paydown | `Paydown` | integer percent |
| Balance Remaining | `Balance_Remaining` | |
| Commission (%) | `Commission_Percent` | |
| Commission ($) | `Commission_Amount` | |
| Origination Fee | `Origination_fee` | **lowercase f** |
| Renewal Eligible | `Renewal_Eligible` | checkbox — auto-set |
| Renewal Eligible Date | `Renewal_Eligible_Date` | auto-set |
| Books Invoice ID | `Books_Invoice_ID` | auto-set |
| Projects Project ID | `Projects_Project_ID` | auto-set — id_string not numeric |

### Renewals Module
| Label | API Name | Gotcha |
|-------|---------|--------|
| Original Funding | `Original_Funding` | lookup to Fundings |
| Renewal Stage | `Renewal_Stage` | `Eligibility Review` or `Eligible` |
| Eligible Date | `Eligible_Date` | auto-set |

### Lenders Module
| Label | API Name | Gotcha |
|-------|---------|--------|
| Lender Status | `Lender_Status` | must be `Active` |
| Minimum FICO | `Minimum_FICO` | |
| Minimum Monthly Revenue | `Minimum_Monthly_Revenue` | |
| Minimum TIB Months | `Minimum_Time_in_Business_Months` | |
| Min Funding Amount | `Minimum_Funding_Amount` | |
| Max Funding Amount | `Maximum_Funding_Amount` | |
| Excluded Industries | `Excluded_Industries` | |
| Excluded States | `Excluded_states` | **lowercase s** |
| Funds Sole Props | `Funds_Sole_Props` | |
| Priority Rank | `Priority_Rank` | lower = preferred |

### Accounts Module
| Label | API Name | Gotcha |
|-------|---------|--------|
| Monthly Revenue | `Monthly_Revenue` | no _USD suffix |
| TIB Band | `TIB_Band` | auto-updated |
| Total Times Funded | `Total_Times_Funded` | auto-updated |
| Total Funded Amount | `Total_Funded_Amount_Lifetime` | auto-updated |
| First Funded Date | `First_Funded_Date` | auto-updated, never overwritten |
| Last Funded Date | `Last_Funded_Date` | auto-updated |

---

**Guide complete — Version 3.0**

Work through Parts 1–5 in order.  
All manual setup is covered here. Once done, the automation handles everything.

**Key references:**  
- Automation code & architecture: `C:\Users\fkozi\zoho commera\CLAUDE.md`  
- Business logic & formulas: `C:\Users\fkozi\zoho-commera-repo\BUSINESS_LOGIC.md`  
- Operations reference: `C:\Users\fkozi\zoho-commera-repo\docs\OPERATIONS-GUIDE.md`  
- Admin & troubleshooting: `C:\Users\fkozi\zoho-commera-repo\docs\ADMIN-GUIDE.md`
