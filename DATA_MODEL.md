# CRM Data Model — Modules, Relationships & Field Mappings

## Module Directory

| Module | Purpose | Key Identifier |
|--------|---------|----------------|
| `Leads` | Inbound prospects before qualification | `FICO_score`, `Annual_Revenue` |
| `Contacts` | Merchants (converted from Leads) | `FICO_score` |
| `Accounts` | Businesses tied to merchants | `Monthly_Revenue`, `Date_Business_Started` |
| `Deals` | Submissions / funding applications | `Stage`, `Approved_Amount`, `Factor_Rate` |
| `Lenders` | Funding partners with criteria | `Minimum_FICO`, `Minimum_Monthly_Revenue` |
| `Offers` | Lender offers on a submission | Linked to Deal |
| `Stips` | Stipulations required by lender | Linked to Deal |
| `Fundings` | Active/historical funding records | `Funding_status`, `Paydown` |
| `Renewals` | Renewal pipeline for active fundings | `Renewal_Stage`, `Renewal_Eligible` |
| `DealHistory` | Audit trail of deal stage changes | Linked to Deal |

---

## Relationship Map

```
Lead ──(conversion)──► Contact
                           │
                           ▼
Account ◄──────────── Deal (Submission)
   │                       │
   │                       │ Stage = "Funded"
   │                       ▼
   └──────────────────► Funding ──► Renewal
                            │
                           Lender
```

### Lookup Field Reference

| Record | Field | Points To | Notes |
|--------|-------|-----------|-------|
| Deal | `Contact_Name` | Contact.id | The merchant |
| Deal | `Account_Name` | Account.id | The business |
| Deal | `Lender` | Lender.id | Assigned lender |
| Funding | `Submission` | Deal.id | Source deal |
| Funding | `Merchant` | Contact.id | Same as Deal.Contact_Name |
| Funding | `Business` | Account.id | Same as Deal.Account_Name |
| Funding | `Lender` | Lender.id | Same as Deal.Lender |
| Renewal | `Original_Funding` | Funding.id | Source funding |
| Renewal | `Merchant` | Contact.id | Same as Funding.Merchant |
| Renewal | `Business` | Account.id | Same as Funding.Business |

---

## Field Mapping: Deal → Funding (on creation)

When creating a Funding from a Funded Deal, map these fields:

| Funding Field | Source | Notes |
|---------------|--------|-------|
| `Name` | `"Funding - " + Deal.Deal_Name` | Auto-name |
| `Submission` | `Deal.id` | Lookup |
| `Merchant` | `Deal.Contact_Name.id` | Lookup |
| `Business` | `Deal.Account_Name.id` | Lookup |
| `Lender` | `Deal.Lender.id` | Lookup |
| `Funded_Amount` | `Deal.Funded_Amount` | |
| `Factor_Rate` | `Deal.Factor_Rate` | |
| `Payback_Amount` | `Deal.Payback_Amount` | |
| `Commission_Percent` | `Deal.Commission` | The % |
| `Commission_Amount` | `Deal.Estimated_commision` | The $ (note typo) |
| `Term_Months` | `Deal.Term_Months` | |
| `Payment_Frequency` | `Deal.Payment_Frequency` | |
| `Payment_Amount` | `Deal.Payment_Amount` | |
| `Holdback` | `Deal.Holdback` | |
| `Buy_Rate` | `Deal.Buy_Rate` | |
| `Sell_Rate` | `Deal.Sell_Rate` | |
| `Net_to_Merchant` | `Deal.Net_to_Merchant` | |
| `Origination_fee` | `Deal.Origination_Fee` | |
| `Funding_Date` | today | `new Date().toISOString().split('T')[0]` |
| `Funding_status` | `"Active"` | Default on creation |

---

## Field Mapping: Funding → Renewal (on creation)

When creating a Renewal from an active Funding:

| Renewal Field | Source | Notes |
|---------------|--------|-------|
| `Name` | `"Renewal - " + Funding.Name` | Auto-name |
| `Original_Funding` | `Funding.id` | Lookup |
| `Merchant` | `Funding.Merchant.id` | Lookup |
| `Business` | `Funding.Business.id` | Lookup |
| `Original_Funded_Amount` | `Funding.Funded_Amount` | |
| `Original_Factor_Rate` | `Funding.Factor_Rate` | |
| `Original_Payment_Amount` | `Funding.Payment_Amount` | |
| `Original_Lender` | `Funding.Lender.name` | Text — store name not ID |
| `Original_Funding_Date` | `Funding.Funding_Date` | |
| `Payoff_of_Original_Deal` | `Funding.Payback_Amount` | |
| `Current_Paydown` | `Funding.Paydown` | |
| `Current_Balance_Remaining` | `Funding.Balance_Remaining` | |
| `Renewal_Stage` | `"Eligibility Review"` | Default on creation |

---

## Deal Stage Pipeline

14 stages in sequence:

| # | Stage | Probability | Trigger |
|---|-------|-------------|---------|
| 1 | New | 5% | Deal created |
| 2 | Contacted / Discovery | 10% | Contact made |
| 3 | Application Sent | 15% | App sent to merchant |
| 4 | Application Received | 25% | Merchant returned app |
| 5 | Docs Requested | 30% | Request docs |
| 6 | Docs Received / File Built | 40% | Docs received |
| 7 | Submitted to Lenders | 50% | Submitted to lender(s) |
| 8 | Offers Received | 65% | Lender offers in |
| 9 | Offer Presented | 70% | Presented to merchant |
| 10 | Contract Sent | 80% | Waiting on signature |
| 11 | Contract Signed | 90% | Contract signed |
| 12 | Stips Clearing | 95% | Final docs clearing |
| 13 | Funded | 100% | **TRIGGER: Create Funding** |
| 14 | Dead | 0% | Deal closed lost |

`Funded` is the trigger stage for creating Funding records. Updates cascade: Date_Funded, Days_Lead_to_Fund, Business history.

---

## Lender Matching Criteria

When matching a Deal to Lenders, check these fields from the **Lender** record:

| Lender Field | Deal/Account/Contact Field | Match Condition |
|-------------|---------------------------|-----------------|
| `Minimum_FICO` | `Contact.FICO_score` | FICO_score >= Minimum_FICO |
| `Minimum_Monthly_Revenue` | `Account.Monthly_Revenue` | Monthly_Revenue >= Minimum_Monthly_Revenue |
| `Minimum_Time_in_Business_Months` | calculated from `Account.Date_Business_Started` | TIB months >= minimum |
| `Minimum_Funding_Amount` | `Deal.Approved_Amount` | Approved_Amount >= Minimum_Funding_Amount |
| `Maximum_Funding_Amount` | `Deal.Approved_Amount` | Approved_Amount <= Maximum_Funding_Amount |
| `Excluded_Industries` | `Account.Industry` | Industry NOT in Excluded_Industries |
| `Excluded_states` | `Account.Billing_State` | State NOT in Excluded_states |
| `Funds_Sole_Props` | `Account.Account_Type` (if applicable) | Must be true if sole prop |
| `Lender_Status` | — | Must be `"Active"` |

Sort matched lenders by `Priority_Rank` ascending (lower = higher priority).

---

## Accounts Funding History

When a Funding is created from a Funded Deal, these Account fields are auto-updated:

| Field | Logic | Notes |
|-------|-------|-------|
| `Total_Times_Funded` | Increment by 1 | Counts all fundings |
| `Total_Funded_Amount_Lifetime` | Add Deal.Funded_Amount | Cumulative total |
| `First_Funded_Date` | Set on first funding | Never overwritten |
| `Last_Funded_Date` | Set to today | Updated every funding |
| `Merchant_Quality_Rating` | Default: "New" | Set by user or automation |

---

## Picklists

### Lead Status
`New` (default), `Attempted Contact`, `Contacted`, `Qualified — Ready to Convert`, `Not Qualified — Nurture`, `Do Not Contact`

### Lead Source
`UCC List`, `Aged Lead`, `Live Transfer`, `Referral — Merchant`, `Referral — Partner`, `Website Form`, `Google Ads`, `Facebook Ads`, `LinkedIn`, `Cold Call`, `Email Campaign`, `Walk-in`, `Other`

### Industry
**Core:** Restaurants & Food Service, Retail Stores, E-Commerce & Online Retail, Healthcare & Medical Practices, HVAC / Plumbing / Electrical, Auto Repair & Body Shops, Roofing & Restoration, Janitorial & Facility Services, Professional Services, Manufacturing

**Additional:** Trucking & Transportation, Construction — General, Construction — Specialty Trades, Beauty / Salon / Spa, Gas Station / C-Store, Hotel / Hospitality, Gym / Fitness, Wholesale / Distribution, Legal Services, Real Estate Services, Technology / SaaS, Landscaping & Lawn Care, Daycare & Childcare, Dental & Orthodontics, Veterinary, Staffing Agency

**Restricted:** RESTRICTED — Cannabis, RESTRICTED — Adult Entertainment, RESTRICTED — Gambling, RESTRICTED — Firearms Dealer, RESTRICTED — Nonprofit

**Catch-all:** Other

### Entity Type
`LLC`, `C-Corp`, `S-Corp`, `Sole Proprietorship`, `Partnership`, `Non-Profit`, `Other`

### Use of Funds
`Working Capital`, `Equipment Purchase`, `Inventory`, `Expansion / Build-out`, `Payroll`, `Taxes`, `Consolidation of Existing MCAs`, `Marketing`, `Real Estate`, `Emergency / Unexpected`, `Other`

### Urgency
`ASAP (24-48 hours)`, `This Week`, `Next 2 Weeks`, `This Month`, `Just Exploring`

### Existing MCA Positions
`0 — Clean`, `1 — One position`, `2 — Two positions`, `3 — Three positions`, `4+ — Stacked`

### FICO Band
`A+ (720+)`, `A (680-719)`, `B (640-679)`, `C (600-639)`, `D (550-599)`, `Sub (<550)`

### TIB Band
`2+ Years`, `1-2 Years`, `6-12 Months`, `4-6 Months`, `Under 4 Months`

### Payment Frequency
`Daily`, `Weekly`, `Bi-Weekly`, `Monthly`

### Lender Status
`Active`, `Paused`, `Terminated`, `Pending Approval`

### Funding Status
`Active — Performing`, `Active — Slow Pay`, `Active — On Hold`, `Paid Off — Complete`, `Defaulted`, `In Collections`, `Settled`, `Bought Out by Another Lender`

### Renewal Stage
`Future — Not Yet Eligible`, `Eligible — Not Contacted`, `Contacted — No Answer`, `Contacted — Interested`, `Contacted — Not Ready Yet`, `Contacted — Not Interested`, `Application Sent`, `Application Received`, `Submitted to Lenders`, `Offers Received`, `Offer Presented`, `Contract Sent`, `Contract Signed`, `Funded`, `Dead`

### Commission Type
`ISO Commission (from Lender)`, `Rep Commission (to Sales Rep)`, `Sub-Broker Commission (to Partner)`, `Manager Override`, `Referral Fee`, `Clawback`

### Commission Status
`Pending`, `Approved`, `Paid`, `Partially Paid`, `Clawed Back`, `In Dispute`, `Cancelled`

### Dead Reason
`Not Qualified — Revenue too low`, `Not Qualified — Time in business too short`, `Not Qualified — Too many positions`, `Not Qualified — Industry restriction`, `Not Qualified — State restriction`, `Declined by All Lenders`, `Merchant Ghosted / No Response`, `Merchant Chose Competitor`, `Merchant Declined All Offers`, `Merchant Changed Mind — No Longer Needs Funding`, `Bank Statements Too Weak (NSFs / Negatives)`, `FICO Too Low`, `Active Bankruptcy`, `Tax Lien Issue`, `Incomplete Documentation — Merchant Won't Provide`, `Duplicate / Already in System`, `Other`
