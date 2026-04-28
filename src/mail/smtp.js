// src/mail/smtp.js
// Zoho SMTP email transport via nodemailer
// Uses Zoho Mail app credentials for reliable delivery

import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.ZOHO_SMTP_USER;
  const pass = process.env.ZOHO_SMTP_PASS;

  if (!user || !pass) {
    logger.warn('ZOHO_SMTP_USER or ZOHO_SMTP_PASS not set — SMTP unavailable');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // SSL
      auth: { user, pass },
      tls: { rejectUnauthorized: false }, // Allow self-signed certs
    });
    logger.info({ user }, 'SMTP transporter created');
    return transporter;
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to create SMTP transporter');
    return null;
  }
}

export async function sendEmailViaSMTP(fromEmail, to, subject, content) {
  const smtp = getTransporter();
  if (!smtp) {
    logger.warn({ to, subject }, 'SMTP not configured — cannot send email');
    return false;
  }

  try {
    const result = await smtp.sendMail({
      from: `"Commera" <${fromEmail}>`,
      to,
      subject,
      html: content,
    });
    logger.info({ to, subject, messageId: result.messageId }, 'Email sent via SMTP');
    return true;
  } catch (err) {
    logger.error({ to, subject, err: err.message }, 'Failed to send email via SMTP');
    // Reset transporter on auth errors
    if (err.message.includes('Invalid login') || err.message.includes('auth')) {
      transporter = null;
    }
    return false;
  }
}
