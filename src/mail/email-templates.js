// Email templates for Commera automation
// All templates use inline styles for maximum email client compatibility.

const COLORS = {
  primary: "#2d5a47",
  secondary: "#a8d5ba",
  background: "#fafaf8",
  card: "#ffffff",
  text: "#1a1a1a",
  muted: "#6b7280",
  border: "#e5e7eb",
};

const CONTACT = {
  email: "commera@commerafunding.com",
  phone: "+1 (888) 451-5255",
  website: "https://commerafunding.com",
};

// Shared layout wrapper — all templates use this to stay consistent.
function wrapLayout(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Commera Funding</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.background};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.background};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:28px;font-weight:800;color:${COLORS.primary};letter-spacing:-0.5px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Commera</span>
              <span style="font-size:14px;color:${COLORS.muted};display:block;margin-top:2px;letter-spacing:1px;text-transform:uppercase;">Funding</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:${COLORS.card};border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.06);overflow:hidden;">

              <!-- Card top accent bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:5px;background-color:${COLORS.primary};border-radius:12px 12px 0 0;"></td>
                </tr>
              </table>

              <!-- Card body -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 48px;">
                    ${content}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;padding-bottom:8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-top:1px solid ${COLORS.border};padding-top:24px;">
                    <p style="margin:0 0 6px 0;font-size:13px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                      <strong style="color:${COLORS.primary};">Commera Funding</strong>
                    </p>
                    <p style="margin:0 0 4px 0;font-size:12px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                      <a href="mailto:${CONTACT.email}" style="color:${COLORS.muted};text-decoration:none;">${CONTACT.email}</a>
                      &nbsp;&bull;&nbsp;
                      <a href="tel:${CONTACT.phone}" style="color:${COLORS.muted};text-decoration:none;">${CONTACT.phone}</a>
                    </p>
                    <p style="margin:0;font-size:11px;color:#9ca3af;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                      You received this email because you have an active application or account with Commera Funding.
                      If you believe this was sent in error, contact us at
                      <a href="mailto:${CONTACT.email}" style="color:#9ca3af;text-decoration:underline;">${CONTACT.email}</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Reusable CTA button block.
function ctaButton(label, href = "#") {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0 0;">
    <tr>
      <td align="left">
        <a href="${href}"
           style="display:inline-block;background-color:${COLORS.primary};color:#ffffff;font-size:15px;font-weight:600;
                  text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:0.2px;
                  font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

// Reusable detail row (label / value pair inside a light box).
function detailRow(label, value) {
  return `<tr>
    <td style="padding:10px 16px;border-bottom:1px solid ${COLORS.border};">
      <span style="font-size:12px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.6px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${label}</span><br/>
      <span style="font-size:15px;color:${COLORS.text};font-weight:600;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${value}</span>
    </td>
  </tr>`;
}

// Wraps detail rows in a light-background table.
function detailTable(rows) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background-color:${COLORS.background};border:1px solid ${COLORS.border};border-radius:8px;margin:24px 0;overflow:hidden;">
    ${rows}
  </table>`;
}

export const templates = {
  // ─── Template 1: Merchant Application Confirmation ─────────────────────────
  applicationConfirmation: (merchantName, submissionNumber) => ({
    subject: `Your Application - Ref: ${submissionNumber}`,
    content: wrapLayout(`
      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:${COLORS.primary};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Application Received
      </h1>
      <p style="margin:0 0 24px 0;font-size:14px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Merchant Funding Application
      </p>

      <p style="margin:0 0 16px 0;font-size:16px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Hi ${merchantName},
      </p>
      <p style="margin:0 0 20px 0;font-size:15px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        We've received your application for merchant funding. Our team will review your submission and be in touch with next steps.
      </p>

      ${detailTable(`
        ${detailRow("Reference Number", submissionNumber)}
        ${detailRow("Status", "Under Review")}
        ${detailRow("Expected Response", "Within 24–48 business hours")}
      `)}

      <p style="margin:0;font-size:14px;color:${COLORS.muted};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <strong style="color:${COLORS.text};">What happens next:</strong> A member of our funding team will contact you directly to discuss your options and collect any additional documentation needed to move your application forward.
      </p>

      ${ctaButton("Track Your Application", CONTACT.website)}

      <p style="margin:24px 0 0 0;font-size:13px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Questions? Reply to this email or call us at
        <a href="tel:${CONTACT.phone}" style="color:${COLORS.primary};text-decoration:none;font-weight:600;">${CONTACT.phone}</a>.
      </p>

      <p style="margin:24px 0 0 0;font-size:14px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Best regards,<br/>
        <strong>The Commera Funding Team</strong>
      </p>
    `),
  }),

  // ─── Template 2: Internal New Application Alert (Sales Rep) ────────────────
  newApplicationAlert: (merchantName, submissionNumber, repName) => ({
    subject: `New Application: ${merchantName} - ${submissionNumber}`,
    content: wrapLayout(`
      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:${COLORS.primary};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        New Application Alert
      </h1>
      <p style="margin:0 0 24px 0;font-size:14px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Internal — Assigned to ${repName}
      </p>

      <p style="margin:0 0 16px 0;font-size:16px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Hi ${repName},
      </p>
      <p style="margin:0 0 20px 0;font-size:15px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        A new merchant funding application has been submitted and assigned to you. Please review it in Zoho CRM and follow up with the merchant within 24 hours.
      </p>

      ${detailTable(`
        ${detailRow("Merchant", merchantName)}
        ${detailRow("Submission Number", submissionNumber)}
        ${detailRow("Assigned Rep", repName)}
        ${detailRow("Received", new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))}
      `)}

      <p style="margin:0;font-size:14px;color:${COLORS.muted};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <strong style="color:${COLORS.text};">Action required:</strong> Log into Zoho CRM, locate submission <strong>${submissionNumber}</strong>, and initiate merchant contact per the standard follow-up protocol.
      </p>

      ${ctaButton("Open in Zoho CRM", "https://crm.zoho.com")}

      <p style="margin:24px 0 0 0;font-size:13px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Need support? Contact the team at
        <a href="mailto:${CONTACT.email}" style="color:${COLORS.primary};text-decoration:none;font-weight:600;">${CONTACT.email}</a>.
      </p>

      <p style="margin:24px 0 0 0;font-size:14px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Best regards,<br/>
        <strong>Commera Automation</strong>
      </p>
    `),
  }),

  // ─── Template 3: Merchant Funding Confirmation ─────────────────────────────
  fundingConfirmation: (merchantName, fundingAmount, fundingDate) => ({
    subject: `Funding Approved - $${(fundingAmount ?? 0).toLocaleString()}`,
    content: wrapLayout(`
      <!-- Green accent banner -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background-color:${COLORS.secondary};border-radius:8px;padding:16px 20px;">
            <p style="margin:0;font-size:15px;font-weight:700;color:${COLORS.primary};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
              Congratulations! Your funding has been approved.
            </p>
          </td>
        </tr>
      </table>

      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:${COLORS.primary};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Funding Confirmed
      </h1>
      <p style="margin:0 0 24px 0;font-size:14px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Merchant Cash Advance — Approved
      </p>

      <p style="margin:0 0 16px 0;font-size:16px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Hi ${merchantName},
      </p>
      <p style="margin:0 0 20px 0;font-size:15px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Great news — your funding application has been approved and is being processed. Here are the details of your approved funding:
      </p>

      ${detailTable(`
        ${detailRow("Approved Amount", `$${(fundingAmount ?? 0).toLocaleString()}`)}
        ${detailRow("Funding Date", fundingDate)}
        ${detailRow("Status", "Approved & Processing")}
      `)}

      <p style="margin:0 0 12px 0;font-size:14px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <strong>Next steps:</strong>
      </p>
      <ul style="margin:0 0 20px 0;padding-left:20px;font-size:14px;color:${COLORS.text};line-height:1.8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <li>Final documents will be sent to you for e-signature shortly.</li>
        <li>Funds will be deposited on or before your funding date.</li>
        <li>Your payment schedule will be included with your documents.</li>
        <li>Contact us immediately if you have any questions before signing.</li>
      </ul>

      ${ctaButton("Contact Us", `mailto:${CONTACT.email}`)}

      <p style="margin:24px 0 0 0;font-size:13px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Have questions? Call us directly at
        <a href="tel:${CONTACT.phone}" style="color:${COLORS.primary};text-decoration:none;font-weight:600;">${CONTACT.phone}</a>
        or email
        <a href="mailto:${CONTACT.email}" style="color:${COLORS.primary};text-decoration:none;font-weight:600;">${CONTACT.email}</a>.
      </p>

      <p style="margin:24px 0 0 0;font-size:14px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Best regards,<br/>
        <strong>The Commera Funding Team</strong>
      </p>
    `),
  }),

  // ─── Template 4: Internal Lead Assignment Alert (Sales Rep) ───────────────
  leadAssigned: (repName, merchantName, leadAmount) => ({
    subject: `Lead Assigned: ${merchantName}`,
    content: wrapLayout(`
      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:${COLORS.primary};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        New Lead Assigned
      </h1>
      <p style="margin:0 0 24px 0;font-size:14px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Internal — Action Required
      </p>

      <p style="margin:0 0 16px 0;font-size:16px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Hi ${repName || 'Team'},
      </p>
      <p style="margin:0 0 20px 0;font-size:15px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        A lead has been assigned to you. Contact the merchant promptly — speed closes deals.
      </p>

      ${detailTable(`
        ${detailRow("Merchant", merchantName)}
        ${detailRow("Requested Amount", `$${(leadAmount ?? 0).toLocaleString()}`)}
        ${detailRow("Assigned To", repName || 'You')}
        ${detailRow("Assigned On", new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))}
      `)}

      <p style="margin:0;font-size:14px;color:${COLORS.muted};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <strong style="color:${COLORS.text};">Action required:</strong> Call the merchant now to introduce yourself and move the application forward.
      </p>

      ${ctaButton("Call Merchant", "https://crm.zoho.com/crm/org/tab/Leads/listview")}

      <p style="margin:24px 0 0 0;font-size:13px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Need support? Contact the team at
        <a href="mailto:${CONTACT.email}" style="color:${COLORS.primary};text-decoration:none;font-weight:600;">${CONTACT.email}</a>.
      </p>

      <p style="margin:24px 0 0 0;font-size:14px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Best regards,<br/>
        <strong>Commera Automation</strong>
      </p>
    `),
  }),

  // ─── Template 5: Merchant Renewal Eligibility ──────────────────────────────
  renewalEligible: (merchantName, renewalAmount) => ({
    subject: `You're Eligible for Renewal`,
    content: wrapLayout(`
      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:${COLORS.primary};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        You're Eligible for Additional Funding
      </h1>
      <p style="margin:0 0 24px 0;font-size:14px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Renewal Offer — Commera Funding
      </p>

      <p style="margin:0 0 16px 0;font-size:16px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Hi ${merchantName},
      </p>
      <p style="margin:0 0 20px 0;font-size:15px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Great news! Based on your strong payment history with Commera, you're now eligible for additional funding. We'd love to help fuel your next stage of growth.
      </p>

      ${detailTable(`
        ${detailRow("Potential Renewal Amount", `Up to $${(renewalAmount ?? 0).toLocaleString()}`)}
        ${detailRow("Offer Status", "Available Now")}
        ${detailRow("How to Apply", `Call ${CONTACT.phone}`)}
      `)}

      <p style="margin:0 0 12px 0;font-size:14px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <strong>Why renew with Commera?</strong>
      </p>
      <ul style="margin:0 0 20px 0;padding-left:20px;font-size:14px;color:${COLORS.text};line-height:1.8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <li>Fast approvals — often same or next business day.</li>
        <li>No collateral required.</li>
        <li>Flexible repayment aligned to your revenue.</li>
        <li>Dedicated funding advisor throughout the process.</li>
      </ul>

      ${ctaButton(`Call Us: ${CONTACT.phone}`, `tel:${CONTACT.phone}`)}

      <p style="margin:24px 0 0 0;font-size:13px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Prefer email? Reach us at
        <a href="mailto:${CONTACT.email}" style="color:${COLORS.primary};text-decoration:none;font-weight:600;">${CONTACT.email}</a>
        and we'll get the conversation started.
      </p>

      <p style="margin:24px 0 0 0;font-size:14px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Best regards,<br/>
        <strong>The Commera Funding Team</strong>
      </p>
    `),
  }),
};
