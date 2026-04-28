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
 */
export async function sendApplicationConfirmation(merchantEmail, merchantName, submissionNumber) {
  if (!merchantEmail) {
    logger.warn({ merchantName }, 'No email for merchant - skipping confirmation');
    return false;
  }

  if (config.dryRun) {
    logger.info({ to: merchantEmail, merchantName, submissionNumber }, '[DRY RUN] Would send application confirmation');
    return true;
  }

  const template = templates.applicationConfirmation(merchantName, submissionNumber);
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
 */
export async function sendNewApplicationAlert(repEmail, merchantName, submissionNumber, repName) {
  if (!repEmail) {
    logger.warn({ merchantName }, 'No email for rep - skipping alert');
    return false;
  }

  if (config.dryRun) {
    logger.info({ to: repEmail, merchantName, submissionNumber }, '[DRY RUN] Would send new application alert');
    return true;
  }

  const template = templates.newApplicationAlert(merchantName, submissionNumber, repName);
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
 */
export async function sendFundingConfirmation(merchantEmail, merchantName, fundingAmount, fundingDate) {
  if (!merchantEmail) {
    logger.warn({ merchantName }, 'No email for merchant - skipping funding confirmation');
    return false;
  }

  if (config.dryRun) {
    logger.info({ to: merchantEmail, merchantName, amount: fundingAmount }, '[DRY RUN] Would send funding confirmation');
    return true;
  }

  const template = templates.fundingConfirmation(merchantName, fundingAmount, fundingDate);
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
 */
export async function sendLeadAssigned(repEmail, repName, merchantName, leadAmount) {
  if (!repEmail) {
    logger.warn({ repName, merchantName }, 'No email for rep - skipping lead assignment alert');
    return false;
  }

  if (config.dryRun) {
    logger.info({ to: repEmail, repName, merchantName, leadAmount }, '[DRY RUN] Would send lead assigned alert');
    return true;
  }

  const template = templates.leadAssigned(repName, merchantName, leadAmount);
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
 */
export async function sendRenewalEligible(merchantEmail, merchantName, renewalAmount) {
  if (!merchantEmail) {
    logger.warn({ merchantName }, 'No email for merchant - skipping renewal notification');
    return false;
  }

  if (config.dryRun) {
    logger.info({ to: merchantEmail, merchantName }, '[DRY RUN] Would send renewal eligibility notification');
    return true;
  }

  const template = templates.renewalEligible(merchantName, renewalAmount);
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
 */
export async function sendFundingAlert(repEmail, repName, merchantName, fundedAmount, fundingDate) {
  if (!repEmail) {
    logger.warn({ repName, merchantName }, 'No email for rep - skipping funding alert');
    return false;
  }

  if (config.dryRun) {
    logger.info({ to: repEmail, repName, merchantName, amount: fundedAmount }, '[DRY RUN] Would send funding alert');
    return true;
  }

  const template = templates.fundingAlert(repName, merchantName, fundedAmount, fundingDate);
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
 */
export async function sendRenewalOpportunity(repEmail, repName, merchantName, renewalAmount) {
  if (!repEmail) {
    logger.warn({ repName, merchantName }, 'No email for rep - skipping renewal opportunity alert');
    return false;
  }

  if (config.dryRun) {
    logger.info({ to: repEmail, repName, merchantName, amount: renewalAmount }, '[DRY RUN] Would send renewal opportunity alert');
    return true;
  }

  const template = templates.renewalOpportunity(repName, merchantName, renewalAmount);
  const sent = await sendEmailViaSMTP(FROM_EMAIL, repEmail, template.subject, template.content);

  if (sent) {
    logger.info({ to: repEmail, repName, merchantName, amount: renewalAmount }, 'Renewal opportunity alert sent via SMTP');
  } else {
    logger.error({ to: repEmail }, 'Failed to send renewal opportunity alert');
  }

  return sent;
}
