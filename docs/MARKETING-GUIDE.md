# Marketing Guide: Managing Campaigns & Lead Nurture

This guide is for marketing staff managing email campaigns, lead nurture sequences, and mailing lists in Zoho Campaigns.

---

## 1. Setting Up Mailing Lists in Zoho Campaigns

Mailing lists are the foundation of email campaigns. They segment leads by score band so you can send targeted, relevant messages to each group.

### Creating Your Lists

1. **Log in to Zoho Campaigns**
   - Navigate to https://campaigns.zoho.com
   - Sign in with your Zoho account

2. **Create New Mailing Lists**
   - From the main menu: **Mailing Lists** → **+ Add Mailing List**
   - Create three lists (one for each score band):

     | List Name | Target Score | Purpose |
     |-----------|--------------|---------|
     | **Hot Leads** | 70+ | High-readiness prospects, urgent follow-up |
     | **Nurture Sequence** | 30-69 | Mid-tier leads, primary marketing focus |
     | **Low Priority** | <30 | Early-stage leads, long-term development |

3. **Retrieve List Keys**
   - After creating each list, open the list detail page
   - Find the **List Key** — a long alphanumeric string
   - Copy and share these keys with your Admin
   - Admin will configure them in `.env` so the system can add leads automatically

### List Key Example
```
List Key: 1234567890abcdef1234567890abcdef
```
(This is what you'll give the Admin for automated list assignment.)

---

## 2. Building Lead Nurture Sequences

Once you have your three mailing lists, create email sequences tailored to each score band. The automation system automatically moves leads between lists daily at 8 AM based on their current score.

### Automation Overview

- **Runs daily at 8 AM** — System evaluates each lead's current score
- **Moves leads to correct list** — Hot, Nurture, or Low Priority
- **Respects existing assignments** — Won't duplicate if already added
- **No manual intervention needed** — Fully automated

### Building Email Sequences

In **Zoho Campaigns** → **Autoresponders**, create sequences for each list:

#### Hot Leads (Score 70+)
**Goal:** Close quickly. Move leads to sales immediately.
- **Cadence:** 2-day follow-up cycle
- **Email 1:** Day 0 — "Ready to Help You Scale" (benefits-focused)
- **Email 2:** Day 2 — "Quick Question: Funding Timeline?" (qualifying call-to-action)
- **Email 3:** Day 4 — "One-on-One Strategy Session" (sales handoff)
- **Total Duration:** 4 days then hand to Sales
- **Tone:** Urgent, personal, action-oriented

#### Nurture Sequence (Score 30-69)
**Goal:** Build trust, educate, and move leads upmarket over 30-60 days.
- **Cadence:** Weekly emails for 6-8 weeks
- **Week 1:** Welcome + Success Stories
- **Week 2:** How MCA Funding Works (education)
- **Week 3:** Case Study — Company Like Yours (social proof)
- **Week 4:** Funding Options Breakdown (comparison)
- **Week 5:** "Ready for a Conversation?" (qualification)
- **Week 6+:** Targeted offers based on response (or re-nurture)
- **Total Duration:** 30-60 days depending on engagement
- **Tone:** Educational, helpful, consultative

#### Low Priority (Score <30)
**Goal:** Maintain relationship, trigger when profile improves.
- **Cadence:** Monthly newsletter + triggered emails
- **Monthly:** Industry updates, product changes, company news
- **Triggered on:** Score increase to 30+ (move to Nurture)
- **Tone:** Informational, low-pressure, helpful
- **Note:** Leads stay here until score improves; don't push sales hard

### Sequence Best Practices

- **Subject lines:** Personalize with {FirstName}, ask questions, avoid hype
- **Content:** Solve problems, share case studies, address objections
- **Call-to-action:** Clear next step (schedule call, reply with question, view resource)
- **Unsubscribe link:** Always include (legal requirement)
- **Test before sending:** Send test emails to yourself first
- **Monitor metrics:** Track open rate, click rate, unsubscribe rate

---

## 3. Understanding Lead Scoring

Lead scores tell you how ready a lead is to buy. They're calculated automatically when lead data changes in the CRM. Higher scores = better fit and higher urgency = more ready.

### What Goes Into Scoring?

The scoring model evaluates:

- **Monthly Revenue** — Higher revenue = more likely to fund
- **FICO Credit Score** — Better credit = more bankable
- **Time in Business** — Longer established = lower risk
- **Existing MCA Positions** — More positions = more debt = higher need
- **Requested Funding Amount** — Amount vs. revenue ratio
- **Urgency** — How soon they need funds
- **Lead Source** — Where they came from
- **Industry** — Some industries are better fits

### Score Ranges

| Score | Band | Readiness | Recommended Action |
|-------|------|-----------|-------------------|
| 70+ | Hot | Very High | Immediate sales outreach |
| 50-69 | Nurture (upper) | Moderate-High | Weekly education, monthly calls |
| 30-49 | Nurture (lower) | Moderate | Weekly emails, low-touch |
| <30 | Low Priority | Low | Monthly newsletter only |

### Where Scoring is Configured

- Scoring rules are set up in **Zoho CRM** → **Setup** → **Automation** → **Scoring Rules**
- Marketing staff don't need to modify scoring (Admin manages this)
- But you should understand what drives scores so you can speak intelligently with leads

---

## 4. Adding Leads to Campaigns

The system automatically adds leads to the correct mailing list daily at 8 AM. However, if you need to add a lead immediately (don't wait 24 hours), here's what to do.

### Automatic Daily Addition

- System runs every day at **8 AM** (Zoho time zone)
- Evaluates each lead's current score
- Adds to Hot/Nurture/Low Priority list automatically
- **No manual action needed**

### Checking if a Lead is Already Added

Before manually adding a lead:

1. Open the lead in **Zoho CRM**
2. Look for a field called **Campaigns_Added** or **Last_Campaign_Add_Date**
3. If it has a date → Lead is already added, don't add again
4. If it's empty → Lead hasn't been added yet

### Manually Adding a Lead (Immediate)

If you need to add a lead today (don't wait for 8 AM automation):

1. Open the lead in **Zoho CRM**
2. Note their current **Lead Score**
3. Determine which list they belong to (Hot/Nurture/Low Priority)
4. **Contact Admin:** Ask to run:
   ```
   npm run add-to-nurture
   ```
   This adds all pending leads immediately (respects the same rules as daily automation)

5. Or manually add in **Zoho Campaigns**:
   - Go to **Mailing Lists** → select the list → **+ Add Subscribers**
   - Upload CSV or paste email addresses
   - (Admin can provide a template)

### Important Rules

- **Never add twice:** If `Campaigns_Added` has a date, don't re-add manually
- **Respect the score band:** Don't put a score-30 lead in the Hot list
- **Use automation first:** Manual additions are the exception, not the rule
- **Update the date:** After adding, note the date so you don't duplicate later

---

## 5. Campaign Performance & Next Steps

### Metrics to Track

When campaigns are running, monitor:

- **Open Rate** — % of leads who opened the email
- **Click Rate** — % of leads who clicked a link
- **Unsubscribe Rate** — % who opted out (keep below 0.5%)
- **Conversion Rate** — % who scheduled a call / filled out form
- **List Growth** — New leads added weekly

### When to Adjust

- **Low open rate** (<25%)? Try different subject lines
- **Low click rate** (<5%)? Call-to-action may be weak
- **High unsubscribe** (>1%)? Content not relevant or too frequent
- **No conversions** after 3 emails? Lead may not be ready (move to nurture)

### Lead Scoring Changes & Re-segmentation

- Leads move automatically based on score changes
- If a Low Priority lead scores 70+, they move to Hot next automation cycle (8 AM)
- If a Nurture lead stops responding, their score may drop; they'll move to Low Priority
- **No action needed** — The system handles re-segmentation

---

## 6. Marketing & Sales Handoff

When a Hot Lead is ready for sales:

1. **Email sends** → "One-on-One Strategy Session" (from Hot sequence)
2. **Sales gets notified** — Admin sets up Zoho notification
3. **Mark as Engaged** — If they click/respond, update status in CRM
4. **Hand to Sales** — Sales team owns follow-up from here
5. **Keep email flowing** — Unless they unsubscribe, nurture sequence continues until they convert/disqualify

---

## 7. Quick Reference: List Setup Checklist

Use this checklist when first setting up campaigns:

- [ ] Created **Hot Leads** list (70+)
- [ ] Created **Nurture Sequence** list (30-69)
- [ ] Created **Low Priority** list (<30)
- [ ] Copied list keys from each list detail page
- [ ] Gave list keys to Admin for `.env` configuration
- [ ] Created autoresponders for each list in **Zoho Campaigns**
- [ ] Tested email sequences with test account
- [ ] Verified daily automation is running at 8 AM
- [ ] Documented any custom email templates
- [ ] Trained team on when/how to manually add leads

---

## 8. Common Questions

**Q: How often can I email a lead?**
A: Hot Leads get 2 emails every 2 days (aggressive). Nurture gets 1 per week (comfortable). Low Priority gets 1 per month. Adjust based on engagement.

**Q: What if a lead unsubscribes?**
A: They're removed from all lists immediately. Respect this — don't try to re-add them. (Legal requirement: CAN-SPAM Act)

**Q: Can I send a custom email to one lead?**
A: Yes. In Campaigns, use **One-off Campaigns** to send a single email. But don't remove them from their sequence.

**Q: When do leads stop getting emails?**
A: When they unsubscribe, convert to customer, or after 60 days of no engagement (you can set this in autoresponder settings).

**Q: How do I know if automation is actually running?**
A: Check the **Campaigns_Added** field on a few leads each morning. If dates updated at 8 AM, automation is working.

---

## 9. Support & Next Steps

- **Questions about Zoho Campaigns?** Contact Admin or check Zoho Help
- **Lead data looks wrong?** Check if they were added to CRM with correct fields
- **Automation didn't run?** Ping Admin to check logs
- **Need a new campaign sequence?** Design it, share with Admin for review, then set up in Campaigns

---

**Last Updated:** April 2026
**Owner:** Marketing Team
**Related Docs:** Admin Guide, Technical Setup
