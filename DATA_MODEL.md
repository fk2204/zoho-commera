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
| `Commission` | `Deal.Commission` | The % |
| `Commission_Amount` | `Deal.Estimated_commision` | The $ |
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

```
New Lead → Qualified → Application Sent → Application Received →
Submitted to Lenders → Offers Received → Approved → Docs Out →
Contract Signed → Funded → Dead
```

`Funded` is the trigger stage for creating Funding records.

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
