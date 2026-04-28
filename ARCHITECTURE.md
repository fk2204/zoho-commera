# Automation Architecture & Decision Framework

## Core Principle

All automation runs as **Node.js scripts on this machine** calling the **Zoho CRM REST API**.  
No Deluge. No Zoho UI clicks. No webhooks. No external servers.

---

## How Automation Works (Polling Model)

Since we can't receive push events from Zoho without a public server, we **poll** for changes:

```
Every morning at 8am (or on demand):
  ┌─────────────────────────────────┐
  │  Read .automation-state.json    │  ← when did we last run?
  │  Query CRM for changed records  │  ← modified since last run
  │  Apply business logic           │  ← calculations, creates
  │  Write results back to CRM      │  ← updates, inserts
  │  Update .automation-state.json  │  ← record this run time
  └─────────────────────────────────┘
```

**State file** (`.automation-state.json`, gitignored):
```json
{
  "lastRun": "2026-04-27T08:00:00.000Z",
  "jobs": {
    "payback": "2026-04-27T08:00:00.000Z",
    "commission": "2026-04-27T08:00:00.000Z",
    "createFunding": "2026-04-27T08:00:00.000Z",
    "createRenewal": "2026-04-27T08:00:00.000Z",
    "renewalCheck": "2026-04-27T08:00:00.000Z"
  }
}
```

---

## Script Structure

```
scripts/
  automation/
    state.js              ← read/write .automation-state.json
    jobs/
      payback.js          ← job 1
      commission.js       ← job 2
      create-funding.js   ← job 3 (most critical)
      create-renewal.js   ← job 4
      renewal-check.js    ← job 5
      match-lenders.js    ← on-demand only
    run-all.js            ← runs all jobs once (used by scheduler + manual)
    scheduler.js          ← schedules run-all.js daily at 8am
```

Each job file exports a single async function:
```js
export async function run(sinceDate) {
  // query, process, update
  return { processed: N, skipped: N, errors: N };
}
```

---

## Decision Framework — When to Act vs When to Ask

### Claude Code MUST ask the user before:
- Building any feature not defined in `BUSINESS_LOGIC.md`
- Choosing between two implementation approaches
- Any operation that modifies more than 10 records
- Changing existing script logic (not adding new)
- Anything irreversible (delete, stage change, financial field update)

### Claude Code CAN proceed without asking:
- Adding a new script that follows existing patterns
- Running `DRY_RUN=true` tests
- Reading/querying CRM data
- Writing documentation
- Adding logging/error handling

### Claude Code MUST STOP and report when:
- An API returns an unexpected error code
- A field doesn't exist on a module (verify before assuming typo)
- CRM data doesn't match what's expected from `DATA_MODEL.md`
- A step produces 0 results when records were expected

---

## Build Protocol — Every New Script

Follow this exact sequence. No skipping steps.

```
Step 1: VERIFY
  - Check field names with metadata.listFields(module)
  - Confirm read_only status for any field you plan to write
  - Check ZOHO_LIMITATIONS.md for known issues with this module

Step 2: QUERY FIRST
  - Run COQL query in isolation, log results
  - Confirm the data looks right before writing anything

Step 3: DRY RUN
  - Run with DRY_RUN=true
  - Review logged output — does it show the right records?
  - Confirm counts make sense

Step 4: ONE RECORD
  - Run against a single known test record
  - Read the record back from CRM to verify the write worked
  - Confirm field values are exactly what was intended

Step 5: BATCH
  - Only after step 4 succeeds
  - Run against full dataset
  - Log summary (processed / skipped / errors)
```

---

## Idempotency Rule

Every script that creates records MUST check first:

```js
// Before creating a Funding:
const existing = await crm.coql.query(
  `SELECT id FROM Fundings WHERE Submission = '${dealId}' LIMIT 1`
);
if (existing.data.length > 0) {
  logger.info({ dealId }, 'Funding already exists — skipping');
  return { skipped: true };
}
// Now safe to create
```

This makes every script safe to run multiple times without creating duplicates.

---

## Error Isolation Rule

Never let one record's failure stop the batch:

```js
const results = { processed: 0, skipped: 0, errors: 0 };

for (const record of records) {
  try {
    await processRecord(record);
    results.processed++;
  } catch (err) {
    logger.error({ recordId: record.id, err: err.message }, 'Record failed');
    results.errors++;
    // continue to next record
  }
}

return results;
```

---

## Verify Writes Rule

After any update, read the record back and confirm:

```js
await crm.records.update('Deals', [{ id, Payback_Amount: payback }]);

// Verify
const updated = await crm.records.getById('Deals', id);
if (updated.Payback_Amount !== payback) {
  logger.error({ id, expected: payback, got: updated.Payback_Amount }, 'Write did not stick');
}
```

---

## Token Management Rule

One token per script run. Never call `getAccessToken()` inside a loop.

```js
// CORRECT — get once at top of script
const token = await getAccessToken();

// WRONG — rate limit will trigger
for (const record of records) {
  const token = await getAccessToken(); // triggers refresh on every iteration
}
```

---

## Logging Standard

Every script must log:
- Start: what job is running, how many records queried
- Per record (debug level): record ID + action taken
- Per error: record ID + full error message
- End summary: `{ processed, skipped, errors, durationMs }`

```js
logger.info({ job: 'payback', queried: records.length }, 'Job started');
// ...
logger.info({ processed, skipped, errors, durationMs }, 'Job complete');
```

---

## Scheduling

The scheduler uses Node.js `setTimeout` with daily recalculation — no external packages needed:

```js
function msUntilNextRun(hour = 8) {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next - now;
}

function scheduleNext() {
  setTimeout(async () => {
    await runAll();
    scheduleNext(); // reschedule for tomorrow
  }, msUntilNextRun(8));
}
```

Run `node scripts/automation/scheduler.js` in the background to activate daily automation.  
For manual runs: `node scripts/automation/run-all.js`
