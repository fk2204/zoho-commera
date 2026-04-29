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
  applicationConfirmation: (merchantName, submissionNumber, requestedAmount) => ({
    subject: `${merchantName}, your${requestedAmount ? ` $${requestedAmount.toLocaleString()}` : ""} application is under review`,
    content: wrapLayout(`
      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:${COLORS.primary};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Application Received
      </h1>
      <p style="margin:0 0 24px 0;font-size:14px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Merchant Cash Advance Application
      </p>

      <p style="margin:0 0 16px 0;font-size:16px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Hi ${merchantName},
      </p>
      <p style="margin:0 0 20px 0;font-size:15px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        We've received your merchant cash advance application and our funding team is reviewing it now.
      </p>

      ${detailTable(`
        ${detailRow("Reference Number", submissionNumber)}
        ${requestedAmount ? detailRow("Requested Amount", `$${requestedAmount.toLocaleString()}`) : ""}
        ${detailRow("Status", "Under Review")}
        ${detailRow("Response Time", "2&ndash;4 business hours")}
      `)}

      <p style="margin:0;font-size:14px;color:${COLORS.muted};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <strong style="color:${COLORS.text};">What happens next:</strong> A dedicated funding advisor will call you directly to discuss your options and collect any additional documentation needed to move your application forward.
      </p>

      ${ctaButton("Call Us Now", "tel:+18884515255")}

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
  newApplicationAlert: (merchantName, submissionNumber, repName, merchantPhone, merchantEmail, monthlyRevenue, industry) => ({
    subject: `New Application: ${merchantName} — Call within 2 hours`,
    content: wrapLayout(`
      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:${COLORS.primary};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        New Application Alert
      </h1>
      <p style="margin:0 0 24px 0;font-size:14px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Internal &mdash; Assigned to ${repName}
      </p>

      <p style="margin:0 0 16px 0;font-size:16px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Hi ${repName},
      </p>
      <p style="margin:0 0 20px 0;font-size:15px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        A new merchant funding application has been submitted and assigned to you. <strong>Call the merchant within 2 hours</strong> &mdash; speed is the #1 factor in MCA conversion.
      </p>

      ${detailTable(`
        ${detailRow("Merchant", merchantName)}
        ${detailRow("Submission Number", submissionNumber)}
        ${detailRow("Phone", merchantPhone ? `<a href="tel:${merchantPhone}" style="color:${COLORS.primary};text-decoration:none;font-weight:600;">${merchantPhone}</a>` : "&mdash;")}
        ${detailRow("Email", merchantEmail || "&mdash;")}
        ${detailRow("Monthly Revenue", monthlyRevenue ? `$${Number(monthlyRevenue).toLocaleString()}` : "&mdash;")}
        ${detailRow("Industry", industry || "&mdash;")}
        ${detailRow("Assigned Rep", repName)}
        ${detailRow("Received", new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }))}
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
  fundingConfirmation: (merchantName, fundingAmount, fundingDate, factorRate, totalRepayment, dailyPayment) => ({
    subject: `Your $${(fundingAmount ?? 0).toLocaleString()} funding is confirmed, ${merchantName}`,
    content: wrapLayout(`
      <!-- Confirmation banner -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background-color:${COLORS.secondary};border-radius:8px;padding:16px 20px;">
            <p style="margin:0;font-size:15px;font-weight:700;color:${COLORS.primary};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
              Your funding has been approved and is being processed.
            </p>
          </td>
        </tr>
      </table>

      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:${COLORS.primary};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Funding Confirmed
      </h1>
      <p style="margin:0 0 24px 0;font-size:14px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Merchant Cash Advance &mdash; Approved
      </p>

      <p style="margin:0 0 16px 0;font-size:16px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Hi ${merchantName},
      </p>
      <p style="margin:0 0 20px 0;font-size:15px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Your merchant cash advance has been approved. Here are your funding details:
      </p>

      ${detailTable(`
        ${detailRow("Funded Amount", `$${(fundingAmount ?? 0).toLocaleString()}`)}
        ${detailRow("Funding Date", fundingDate)}
        ${detailRow("Status", "Approved &amp; Processing")}
      `)}

      <p style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Your Advance Summary
      </p>
      ${detailTable(`
        ${detailRow("Principal", `$${(fundingAmount ?? 0).toLocaleString()}`)}
        ${detailRow("Factor Rate", factorRate ? factorRate.toString() : "&mdash;")}
        ${detailRow("Total Repayment", totalRepayment ? `$${Number(totalRepayment).toLocaleString()}` : "&mdash;")}
        ${detailRow("Est. Daily Payment", dailyPayment ? `$${Number(dailyPayment).toLocaleString()} <span style="font-size:12px;font-weight:400;color:${COLORS.muted};">(based on 22 business days/month)</span>` : "&mdash;")}
      `)}

      <p style="margin:0 0 16px 0;font-size:12px;color:${COLORS.muted};line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        This is a merchant cash advance, not a loan. Repayment is based on a fixed percentage of future receivables.
      </p>

      <p style="margin:0 0 12px 0;font-size:14px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <strong>Next steps:</strong>
      </p>
      <ul style="margin:0 0 20px 0;padding-left:20px;font-size:14px;color:${COLORS.text};line-height:1.8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <li>Final documents will be sent to you for e-signature shortly.</li>
        <li>Funds will be deposited on or before ${fundingDate}.</li>
        <li>Your payment schedule will be included with your documents.</li>
        <li>Contact us immediately if you have any questions before signing.</li>
      </ul>

      ${ctaButton("Review My Agreement", `mailto:${CONTACT.email}`)}

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
  leadAssigned: (repName, merchantName, leadAmount, merchantPhone, merchantEmail, monthlyRevenue, industry, timeInBusiness, businessState) => ({
    subject: `Lead Assigned: ${merchantName} — Call Now`,
    content: wrapLayout(`
      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:${COLORS.primary};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        New Lead Assigned
      </h1>
      <p style="margin:0 0 24px 0;font-size:14px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Internal &mdash; Action Required
      </p>

      <p style="margin:0 0 16px 0;font-size:16px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Hi ${repName || "Team"},
      </p>
      <p style="margin:0 0 20px 0;font-size:15px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        A lead has been assigned to you. <strong>Call immediately</strong> &mdash; the first rep to call wins the deal.
      </p>

      ${detailTable(`
        ${detailRow("Merchant", merchantName)}
        ${detailRow("Phone", merchantPhone ? `<a href="tel:${merchantPhone}" style="color:${COLORS.primary};text-decoration:none;font-weight:600;">${merchantPhone}</a>` : "&mdash;")}
        ${detailRow("Email", merchantEmail || "&mdash;")}
        ${detailRow("Monthly Revenue", monthlyRevenue ? `$${Number(monthlyRevenue).toLocaleString()}` : "&mdash;")}
        ${detailRow("Industry", industry || "&mdash;")}
        ${detailRow("Time in Business", timeInBusiness ? `${timeInBusiness} months` : "&mdash;")}
        ${detailRow("State", businessState || "&mdash;")}
        ${detailRow("Requested Amount", `$${(leadAmount ?? 0).toLocaleString()}`)}
        ${detailRow("Assigned To", repName || "You")}
        ${detailRow("Assigned On", new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }))}
      `)}

      <p style="margin:0;font-size:14px;color:${COLORS.muted};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <strong style="color:${COLORS.text};">Action required:</strong> Call the merchant now to introduce yourself and move the application forward.
      </p>

      ${ctaButton("Call Merchant Now", `tel:${merchantPhone || "#"}`)}

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
  renewalEligible: (merchantName, renewalAmount, originalAmount, paydownPercent) => ({
    subject: `${merchantName}, you qualify for up to $${(renewalAmount ?? 0).toLocaleString()} in new funding`,
    content: wrapLayout(`
      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:${COLORS.primary};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        You're Eligible for Additional Funding
      </h1>
      <p style="margin:0 0 24px 0;font-size:14px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Renewal Offer &mdash; Commera Funding
      </p>

      <p style="margin:0 0 16px 0;font-size:16px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Hi ${merchantName},
      </p>
      <p style="margin:0 0 20px 0;font-size:15px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Based on your payment history with Commera, you've unlocked access to additional funding. Here's where you stand:
      </p>

      ${paydownPercent != null && originalAmount ? `
      <p style="margin:0 0 16px 0;font-size:15px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        You've paid back <strong>${paydownPercent}%</strong> of your $${Number(originalAmount).toLocaleString()} advance.
      </p>
      ` : ""}

      ${detailTable(`
        ${originalAmount ? detailRow("Original Advance", `$${Number(originalAmount).toLocaleString()}`) : ""}
        ${paydownPercent != null ? detailRow("Paid Down", `${paydownPercent}%`) : ""}
        ${renewalAmount ? detailRow("Potential Renewal", `Up to $${(renewalAmount ?? 0).toLocaleString()}`) : detailRow("Potential Renewal", "Contact us to discuss your renewal offer")}
        ${detailRow("Offer Status", "Available Now")}
        ${detailRow("How to Apply", `Call ${CONTACT.phone}`)}
      `)}

      <p style="margin:0 0 12px 0;font-size:14px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <strong>Why renew with Commera?</strong>
      </p>
      <ul style="margin:0 0 20px 0;padding-left:20px;font-size:14px;color:${COLORS.text};line-height:1.8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <li>Fast approvals &mdash; often same or next business day.</li>
        <li>No collateral required.</li>
        <li>Flexible repayment aligned to your revenue.</li>
        <li>Dedicated funding advisor throughout the process.</li>
      </ul>

      <p style="margin:0 0 20px 0;font-size:14px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        This offer is available this week. Call us to lock in your rate.
      </p>

      ${ctaButton(`Call Us: ${CONTACT.phone}`, "tel:+18884515255")}

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

  // ─── Template 6: Internal Funding Alert (Rep/Manager) ───────────────────
  fundingAlert: (repName, merchantName, fundedAmount, fundingDate, commissionAmount, lenderName) => ({
    subject: `Deal Funded: ${merchantName} — $${(fundedAmount ?? 0).toLocaleString()}`,
    content: wrapLayout(`
      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:${COLORS.primary};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Congratulations &mdash; Deal Funded!
      </h1>
      <p style="margin:0 0 24px 0;font-size:14px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Internal &mdash; Funding Confirmation
      </p>

      <p style="margin:0 0 16px 0;font-size:16px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Hi ${repName},
      </p>
      <p style="margin:0 0 20px 0;font-size:15px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Your deal with <strong>${merchantName}</strong> has been funded. Next steps: reach out today to confirm receipt and discuss payment schedule.
      </p>

      ${detailTable(`
        ${detailRow("Merchant", merchantName)}
        ${detailRow("Funded Amount", `$${(fundedAmount ?? 0).toLocaleString()}`)}
        ${detailRow("Funding Date", fundingDate)}
        ${lenderName ? detailRow("Lender", lenderName) : ""}
        ${commissionAmount ? detailRow("Your Commission", `$${Number(commissionAmount).toLocaleString()}`) : ""}
        ${detailRow("Status", "Ready for Servicing")}
      `)}

      <p style="margin:0;font-size:14px;color:${COLORS.muted};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <strong style="color:${COLORS.text};">Your action:</strong> Call the merchant, confirm payment details, and log the call in Zoho CRM.
      </p>

      ${ctaButton("Open Deal in Zoho", "https://crm.zoho.com/crm/org/tab/Deals/listview")}

      <p style="margin:24px 0 0 0;font-size:14px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Best regards,<br/>
        <strong>Commera Automation</strong>
      </p>
    `),
  }),

  // ─── Template 7: Renewal Opportunity Alert (Rep/Manager) ───────────────
  renewalOpportunity: (repName, merchantName, renewalAmount, merchantPhone, actualFundingDate, paydownPercent) => ({
    subject: `Renewal Opportunity: ${merchantName} (${paydownPercent || 50}% paid down)`,
    content: wrapLayout(`
      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:${COLORS.primary};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Renewal Opportunity Waiting
      </h1>
      <p style="margin:0 0 24px 0;font-size:14px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Internal &mdash; Ready for Outreach
      </p>

      <p style="margin:0 0 16px 0;font-size:16px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Hi ${repName},
      </p>
      <p style="margin:0 0 20px 0;font-size:15px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <strong>${merchantName}</strong> has now paid down ${paydownPercent || 50}% of their original funding and is eligible for a renewal. This is a warm lead &mdash; call now to capture the deal.
      </p>

      ${detailTable(`
        ${detailRow("Merchant", merchantName)}
        ${detailRow("Phone", merchantPhone ? `<a href="tel:${merchantPhone}" style="color:${COLORS.primary};text-decoration:none;font-weight:600;">${merchantPhone}</a>` : "&mdash;")}
        ${detailRow("Potential Renewal Amount", `Up to $${(renewalAmount ?? 0).toLocaleString()}`)}
        ${detailRow("Paid Down", `${paydownPercent || 50}%`)}
        ${detailRow("Eligibility Status", "Ready for Outreach")}
        ${detailRow("Last Funded", actualFundingDate || "&mdash;")}
      `)}

      <p style="margin:0 0 12px 0;font-size:14px;color:${COLORS.text};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <strong>Why this matters:</strong>
      </p>
      <ul style="margin:0 0 20px 0;padding-left:20px;font-size:14px;color:${COLORS.text};line-height:1.8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <li>Existing customers are 3&times; easier to close than new leads.</li>
        <li>They already trust Commera and know the process.</li>
        <li>Act fast &mdash; they may shop competing lenders.</li>
      </ul>

      ${ctaButton("Call Merchant Now", `tel:${merchantPhone || "#"}`)}

      <p style="margin:24px 0 0 0;font-size:13px;color:${COLORS.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Questions? Contact the team at
        <a href="mailto:${CONTACT.email}" style="color:${COLORS.primary};text-decoration:none;font-weight:600;">${CONTACT.email}</a>.
      </p>

      <p style="margin:24px 0 0 0;font-size:14px;color:${COLORS.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        Best regards,<br/>
        <strong>Commera Automation</strong>
      </p>
    `),
  }),
};
