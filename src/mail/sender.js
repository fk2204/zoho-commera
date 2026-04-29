// Email sender service for Commera automation
// Sends emails via Zoho SMTP (REST API Mail service was returning 500 errors)

import { sendEmailViaSMTP } from './smtp.js';
import { logger } from '../utils/logger.js';
import { templates } from './email-templates.js';
import { config } from '../config.js';

const FROM_EMAIL = process.env.ZOHO_SMTP_USER || 'applications@commerafunding.com';

/**
 * Send application confirmation to merchant
 * @param {string} merchantEmail - Merchant's email
 * @param {string} merchantName - Merchant's name
 * @param {string} submissionNumber - Application reference number
 * @param {number} [requestedAmount] - Amount the merchant applied for
 */
export async function sendApplicationConfirmation(merchantEmail, merchantName, submissionNumber, requestedAmount) {
  if (!merchantEmail) {
    logger.warn({ merchantName }, 'No email for merchant - skipping confirmation');
    return false;
  }

  if (config.dryRun) {
    logger.info({ to: merchantEmail, merchantName, submissionNumber }, '[DRY RUN] Would send application confirmation');
    return true;
  }

  const template = templates.applicationConfirmation(merchantName, submissionNumber, requestedAmount);
  const sent = await sendEmailViaSMTP(FROM_EMAIL, merchantEmail, template.subject, template.content);

  if (sent) {
    logger.info({ to: merchantEmail, merchantName, submissionNumber }, 'Application confirmation sent via SMTP');
  } else {
    logger.error({ to: merchantEmail }, 'Failed to send application confirmation');
  }

  return sent;
}

/**
 * Send new application alert to sales rep
 * @param {string} repEmail - Sales rep's email
 * @param {string} merchantName - Merchant's name
 * @param {string} submissionNumber - Application reference
 * @param {string} repName - Rep's name
 * @param {string} [merchantPhone] - Merchant's phone number
 * @param {string} [merchantEmail] - Merchant's email address
 * @param {number} [monthlyRevenue] - Merchant's monthly revenue
 * @param {string} [industry] - Merchant's industry
 */
export async function sendNewApplicationAlert(repEmail, merchantName, submissionNumber, repName, merchantPhone, merchantEmail, monthlyRevenue, industry) {
  if (!repEmail) {
    logger.warn({ merchantName }, 'No email for rep - skipping alert');
    return false;
  }

  if (config.dryRun) {
    logger.info({ to: repEmail, merchantName, submissionNumber }, '[DRY RUN] Would send new application alert');
    return true;
  }

  const template = templates.newApplicationAlert(merchantName, submissionNumber, repName, merchantPhone, merchantEmail, monthlyRevenue, industry);
  const sent = await sendEmailViaSMTP(FROM_EMAIL, repEmail, template.subject, template.content);

  if (sent) {
    logger.info({ to: repEmail, merchantName, submissionNumber }, 'New application alert sent via SMTP');
  } else {
    logger.error({ to: repEmail }, 'Failed to send new application alert');
  }

  return sent;
}

/**
 * Send funding approval confirmation to merchant
 * @param {string} merchantEmail - Merchant's email
 * @param {string} merchantName - Merchant's name
 * @param {number} fundingAmount - Funded amount
 * @param {string} fundingDate - Expected funding date (YYYY-MM-DD)
 * @param {number} [factorRate] - Factor rate applied to the advance
 * @param {number} [totalRepayment] - Total repayment amount
 * @param {number} [dailyPayment] - Estimated daily payment amount
 */
export async function sendFundingConfirmation(merchantEmail, merchantName, fundingAmount, fundingDate, factorRate, totalRepayment, dailyPayment) {
  if (!merchantEmail) {
    logger.warn({ merchantName }, 'No email for merchant - skipping funding confirmation');
    return false;
  }

  if (config.dryRun) {
    logger.info({ to: merchantEmail, merchantName, amount: fundingAmount }, '[DRY RUN] Would send funding confirmation');
    return true;
  }

  const template = templates.fundingConfirmation(merchantName, fundingAmount, fundingDate, factorRate, totalRepayment, dailyPayment);
  const sent = await sendEmailViaSMTP(FROM_EMAIL, merchantEmail, template.subject, template.content);

  if (sent) {
    logger.info({ to: merchantEmail, merchantName, amount: fundingAmount }, 'Funding confirmation sent via SMTP');
  } else {
    logger.error({ to: merchantEmail }, 'Failed to send funding confirmation');
  }

  return sent;
}

/**
 * Send lead assignment notification to sales rep
 * @param {string} repEmail - Rep's email
 * @param {string} repName - Rep's name
 * @param {string} merchantName - Merchant's name
 * @param {number} leadAmount - Requested funding amount
 * @param {string} [merchantPhone] - Merchant's phone number
 * @param {string} [merchantEmail] - Merchant's email address
 * @param {number} [monthlyRevenue] - Merchant's monthly revenue
 * @param {string} [industry] - Merchant's industry
 * @param {number} [timeInBusiness] - Months the merchant has been in business
 * @param {string} [businessState] - State where the business is located
 */
export async function sendLeadAssigned(repEmail, repName, merchantName, leadAmount, merchantPhone, merchantEmail, monthlyRevenue, industry, timeInBusiness, businessState) {
  if (!repEmail) {
    logger.warn({ repName, merchantName }, 'No email for rep - skipping lead assignment alert');
    return false;
  }

  if (config.dryRun) {
    logger.info({ to: repEmail, repName, merchantName, leadAmount }, '[DRY RUN] Would send lead assigned alert');
    return true;
  }

  const template = templates.leadAssigned(repName, merchantName, leadAmount, merchantPhone, merchantEmail, monthlyRevenue, industry, timeInBusiness, businessState);
  const sent = await sendEmailViaSMTP(FROM_EMAIL, repEmail, template.subject, template.content);

  if (sent) {
    logger.info({ to: repEmail, repName, merchantName }, 'Lead assigned alert sent via SMTP');
  } else {
    logger.error({ to: repEmail }, 'Failed to send lead assigned alert');
  }

  return sent;
}

/**
 * Send renewal eligibility notification
 * @param {string} merchantEmail - Merchant's email
 * @param {string} merchantName - Merchant's name
 * @param {number} renewalAmount - Potential renewal amount
 * @param {number} [originalAmount] - Original funded amount
 * @param {number} [paydownPercent] - Percentage of original advance paid down
 */
export async function sendRenewalEligible(merchantEmail, merchantName, renewalAmount, originalAmount, paydownPercent) {
  if (!merchantEmail) {
    logger.warn({ merchantName }, 'No email for merchant - skipping renewal notification');
    return false;
  }

  if (config.dryRun) {
    logger.info({ to: merchantEmail, merchantName }, '[DRY RUN] Would send renewal eligibility notification');
    return true;
  }

  const template = templates.renewalEligible(merchantName, renewalAmount, originalAmount, paydownPercent);
  const sent = await sendEmailViaSMTP(FROM_EMAIL, merchantEmail, template.subject, template.content);

  if (sent) {
    logger.info({ to: merchantEmail, merchantName }, 'Renewal eligibility notification sent via SMTP');
  } else {
    logger.error({ to: merchantEmail }, 'Failed to send renewal notification');
  }

  return sent;
}

/**
 * Send internal funding alert to rep/manager
 * @param {string} repEmail - Rep's email
 * @param {string} repName - Rep's name
 * @param {string} merchantName - Merchant's name
 * @param {number} fundedAmount - Amount funded
 * @param {string} fundingDate - Funding date (YYYY-MM-DD)
 * @param {number} [commissionAmount] - Rep's commission for this deal
 * @param {string} [lenderName] - Name of the lender who funded the deal
 */
export async function sendFundingAlert(repEmail, repName, merchantName, fundedAmount, fundingDate, commissionAmount, lenderName) {
  if (!repEmail) {
    logger.warn({ repName, merchantName }, 'No email for rep - skipping funding alert');
    return false;
  }

  if (config.dryRun) {
    logger.info({ to: repEmail, repName, merchantName, amount: fundedAmount }, '[DRY RUN] Would send funding alert');
    return true;
  }

  const template = templates.fundingAlert(repName, merchantName, fundedAmount, fundingDate, commissionAmount, lenderName);
  const sent = await sendEmailViaSMTP(FROM_EMAIL, repEmail, template.subject, template.content);

  if (sent) {
    logger.info({ to: repEmail, repName, merchantName, amount: fundedAmount }, 'Funding alert sent via SMTP');
  } else {
    logger.error({ to: repEmail }, 'Failed to send funding alert');
  }

  return sent;
}

/**
 * Send renewal opportunity alert to rep
 * @param {string} repEmail - Rep's email
 * @param {string} repName - Rep's name
 * @param {string} merchantName - Merchant's name
 * @param {number} renewalAmount - Potential renewal amount
 * @param {string} [merchantPhone] - Merchant's phone number
 * @param {string} [actualFundingDate] - Date the merchant was originally funded
 * @param {number} [paydownPercent] - Percentage of original advance paid down
 */
export async function sendRenewalOpportunity(repEmail, repName, merchantName, renewalAmount, merchantPhone, actualFundingDate, paydownPercent) {
  if (!repEmail) {
    logger.warn({ repName, merchantName }, 'No email for rep - skipping renewal opportunity alert');
    return false;
  }

  if (config.dryRun) {
    logger.info({ to: repEmail, repName, merchantName, amount: renewalAmount }, '[DRY RUN] Would send renewal opportunity alert');
    return true;
  }

  const template = templates.renewalOpportunity(repName, merchantName, renewalAmount, merchantPhone, actualFundingDate, paydownPercent);
  const sent = await sendEmailViaSMTP(FROM_EMAIL, repEmail, template.subject, template.content);

  if (sent) {
    logger.info({ to: repEmail, repName, merchantName, amount: renewalAmount }, 'Renewal opportunity alert sent via SMTP');
  } else {
    logger.error({ to: repEmail }, 'Failed to send renewal opportunity alert');
  }

  return sent;
}
