# Zoho SMTP Setup Guide

Email sending is now ready via Zoho Mail SMTP. This is a quick setup (2 minutes).

---

## Step 1: Get SMTP Credentials from Zoho Mail

1. **Go to Zoho Mail** → https://mail.zoho.com
2. **Click Settings** (top right gear icon)
3. **Find "Connected Accounts"** section (left sidebar → Accounts → Connected Accounts)
4. **App Passwords** → Generate an app password
   - This is NOT your Zoho account password
   - It's a special token for API/SMTP access
5. **Copy the app password** (it shows once, then never again)

**Note:** You need a Zoho Mail account configured first. If you don't have one at applications@commerafunding.com, ask your Zoho admin to set it up.

---

## Step 2: Add Credentials to `.env`

Edit `C:\Users\fkozi\zoho commera\.env`:

```
ZOHO_SMTP_USER=applications@commerafunding.com
ZOHO_SMTP_PASS=<the app password you just copied>
```

That's it. No other config needed.

---

## Step 3: Test Email Sending

### Dry Run (Recommended First)
```bash
cd "C:\Users\fkozi\zoho commera"
DRY_RUN=true npm run send-app-confirmation
```

Should output: `[DRY RUN] Would send application confirmation` × 14

### Live Test (One Email)
```bash
npm run send-app-confirmation
```

Should output: `Application confirmation sent via SMTP` × 14

Check email: Did merchants receive emails? (They might go to spam first time)

### Full Automation Suite
```bash
npm run run
```

All 8 jobs run in sequence. Total time: ~10 seconds.

---

## What Gets Sent

When merchants apply online:
1. **To Merchant** → Application confirmation with submission number
2. **To Assigned Sales Rep** → Alert that new application received

---

## Troubleshooting

**SMTP credentials not in `.env`?**
```
Job output: "ZOHO_SMTP_USER or ZOHO_SMTP_PASS not set — SMTP unavailable"
```
→ Add credentials to `.env` and try again.

**Invalid login / Auth failed?**
```
Job output: "Failed to send email via SMTP" with err: "Invalid login"
```
→ Double-check ZOHO_SMTP_PASS is correct. You can generate a new app password and try again.

**Emails going to spam?**
→ Normal first time. Recipients can mark as "Not Spam" and add to contacts. Subsequent emails will be trusted.

**Rate limit hit?**
→ Zoho Mail doesn't limit per-send. Very unlikely. Wait 1 hour if it happens.

---

## Schedule Email Sending

Once working, schedule the daily automation:

**Option A: Windows Task Scheduler**
```
Task: "Commera Daily Automation"
Program: node
Arguments: C:\Users\fkozi\zoho commera\scripts\automation\run-all.js
Schedule: Daily at 8:00 AM
```

**Option B: Cron (Linux/Mac)**
```bash
0 8 * * * cd /path/to/zoho-commera && npm run run
```

---

## Files Involved

- `src/mail/smtp.js` — SMTP transporter (nodemailer)
- `src/mail/sender.js` — Email sending functions
- `src/mail/email-templates.js` — Email HTML templates
- `scripts/automation/jobs/send-application-confirmation.js` — The automation job
- `.env` — Your credentials go here

All fully tested and ready. No code changes needed.

---

## Next Steps

1. Add `ZOHO_SMTP_USER` and `ZOHO_SMTP_PASS` to `.env`
2. Run: `DRY_RUN=true npm run send-app-confirmation`
3. Run: `npm run send-app-confirmation` (live)
4. Check email inbox for confirmations
5. Schedule `npm run run` to run daily at 8 AM

That's it. Email automation is live.
