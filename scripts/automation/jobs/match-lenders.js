// scripts/automation/jobs/match-lenders.js
// Matches qualified lenders to a Deal based on FICO, revenue, TIB, industry, state, amount.
// Assigns the top-ranked matching lender to the Deal.
// Can be run on a specific dealId or all unassigned Deals in qualifying stages.

import * as crm from '../../../src/crm/index.js';
import { logger } from '../../../src/utils/logger.js';
import { config } from '../../../src/config.js';

function getTimInBusinessMonths(dateStarted) {
  if (!dateStarted) return 0;
  const start = new Date(dateStarted);
  const now = new Date();
  return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
}

function getFicoBand(score) {
  if (!score) return null;
  if (score >= 720) return 'A+';
  if (score >= 680) return 'A';
  if (score >= 640) return 'B';
  if (score >= 600) return 'C';
  return 'D';
}

function lenderMatchesDeal(lender, deal, contact, account) {
  const reasons = [];

  if (lender.Lender_Status !== 'Active') return { match: false, reasons: ['Lender not active'] };

  const fico = contact?.FICO_score ?? 0;
  if (lender.Minimum_FICO && fico < lender.Minimum_FICO) {
    reasons.push(`FICO ${fico} below minimum ${lender.Minimum_FICO}`);
  }

  const revenue = account?.Monthly_Revenue ?? 0;
  if (lender.Minimum_Monthly_Revenue && revenue < lender.Minimum_Monthly_Revenue) {
    reasons.push(`Revenue $${revenue} below minimum $${lender.Minimum_Monthly_Revenue}`);
  }

  const tib = getTimInBusinessMonths(account?.Date_Business_Started);
  if (lender.Minimum_Time_in_Business_Months && tib < lender.Minimum_Time_in_Business_Months) {
    reasons.push(`TIB ${tib} months below minimum ${lender.Minimum_Time_in_Business_Months}`);
  }

  const amount = deal.Approved_Amount ?? 0;
  if (lender.Minimum_Funding_Amount && amount < lender.Minimum_Funding_Amount) {
    reasons.push(`Amount $${amount} below minimum $${lender.Minimum_Funding_Amount}`);
  }
  if (lender.Maximum_Funding_Amount && amount > lender.Maximum_Funding_Amount) {
    reasons.push(`Amount $${amount} above maximum $${lender.Maximum_Funding_Amount}`);
  }

  const industry = account?.Industry;
  const excluded = lender.Excluded_Industries ?? [];
  if (industry && excluded.includes(industry)) {
    reasons.push(`Industry "${industry}" is excluded`);
  }

  const state = account?.Billing_State;
  const excludedStates = lender.Excluded_states ?? [];
  if (state && excludedStates.includes(state)) {
    reasons.push(`State "${state}" is excluded`);
  }

  return { match: reasons.length === 0, reasons };
}

export async function run({ dealId = null } = {}) {
  const start = Date.now();
  const results = { processed: 0, skipped: 0, errors: 0 };

  // Fetch all active lenders once
  const lenders = await crm.records.listAll('Lenders', {
    fields: ['id', 'Name', 'Lender_Status', 'Minimum_FICO', 'Minimum_Monthly_Revenue',
             'Minimum_Time_in_Business_Months', 'Minimum_Funding_Amount', 'Maximum_Funding_Amount',
             'Excluded_Industries', 'Excluded_states', 'Priority_Rank', 'Funds_Sole_Props'],
  });
  const activeLenders = lenders.filter(l => l.Lender_Status === 'Active');
  logger.info({ activeLenders: activeLenders.length }, 'Lenders loaded');

  // Determine which deals to process
  let deals = [];
  if (dealId) {
    const deal = await crm.records.getById('Deals', dealId, {
      fields: ['id', 'Deal_Name', 'Stage', 'Contact_Name', 'Account_Name', 'Lender', 'Approved_Amount'],
    });
    if (deal) deals = [deal];
  } else {
    const { data } = await crm.coql.query(
      `SELECT id, Deal_Name, Stage, Contact_Name, Account_Name, Lender, Approved_Amount
       FROM Deals
       WHERE Stage != 'Funded' AND Stage != 'Dead' AND Lender = null
       LIMIT 200`
    );
    deals = data;
  }

  logger.info({ job: 'matchLenders', queried: deals.length }, 'Job started');

  for (const deal of deals) {
    try {
      if (!deal.Contact_Name?.id || !deal.Account_Name?.id) {
        logger.warn({ dealId: deal.id, Deal_Name: deal.Deal_Name }, 'Missing Contact or Account — skipping');
        results.skipped++;
        continue;
      }

      // Fetch related records for matching criteria
      const [contact, account] = await Promise.all([
        crm.records.getById('Contacts', deal.Contact_Name.id, {
          fields: ['id', 'FICO_score'],
        }),
        crm.records.getById('Accounts', deal.Account_Name.id, {
          fields: ['id', 'Monthly_Revenue', 'Date_Business_Started', 'Industry', 'Billing_State'],
        }),
      ]);

      // Run matching
      const matches = [];
      for (const lender of activeLenders) {
        const { match, reasons } = lenderMatchesDeal(lender, deal, contact, account);
        if (match) {
          matches.push(lender);
        } else {
          logger.debug({ dealId: deal.id, lender: lender.Name, reasons }, 'Lender did not match');
        }
      }

      if (matches.length === 0) {
        logger.warn({
          dealId: deal.id,
          Deal_Name: deal.Deal_Name,
          fico: contact?.FICO_score,
          ficoBand: getFicoBand(contact?.FICO_score),
          revenue: account?.Monthly_Revenue,
        }, 'No lenders matched — manual review needed');
        results.skipped++;
        continue;
      }

      // Sort by Priority_Rank (lower = higher priority), pick top
      matches.sort((a, b) => (a.Priority_Rank ?? 999) - (b.Priority_Rank ?? 999));
      const topLender = matches[0];

      logger.info({
        dealId: deal.id,
        Deal_Name: deal.Deal_Name,
        topLender: topLender.Name,
        totalMatches: matches.length,
        allMatches: matches.map(l => l.Name),
      }, 'Lenders matched');

      if (config.dryRun) {
        logger.info({ dealId: deal.id, lender: topLender.Name }, '[DRY RUN] Would assign lender');
        results.processed++;
        continue;
      }

      await crm.records.update('Deals', [{ id: deal.id, Lender: topLender.id }]);
      logger.info({ dealId: deal.id, lenderId: topLender.id, lenderName: topLender.Name }, 'Lender assigned');
      results.processed++;

    } catch (err) {
      logger.error({ dealId: deal.id, err: err.message }, 'Lender match failed for record');
      results.errors++;
    }
  }

  logger.info({ ...results, durationMs: Date.now() - start }, 'Match Lenders job complete');
  return results;
}
