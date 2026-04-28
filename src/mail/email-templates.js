// Email templates for Commera automation

export const templates = {
  applicationConfirmation: (merchantName, submissionNumber) => ({
    subject: `Application Received - Ref: ${submissionNumber}`,
    content: `
      <h2>Thank you for your application!</h2>
      <p>Hi ${merchantName},</p>
      <p>We have successfully received your funding application.</p>
      <p><strong>Application Reference: ${submissionNumber}</strong></p>
      <p>Our team is now reviewing your submission. You can expect to hear from us within 1-2 business days with next steps.</p>
      <p>If you have any questions, please reply to this email or contact us at <strong>+1 (888) 451-5255</strong>.</p>
      <p>Best regards,<br/>Commera Funding Team</p>
    `,
  }),

  newApplicationAlert: (merchantName, submissionNumber, submissionOwner) => ({
    subject: `New Application - ${merchantName} - ${submissionNumber}`,
    content: `
      <h2>New Application Received</h2>
      <p><strong>Merchant:</strong> ${merchantName}</p>
      <p><strong>Application #:</strong> ${submissionNumber}</p>
      <p><strong>Assigned to:</strong> ${submissionOwner}</p>
      <p>Review the application and follow up with the merchant.</p>
    `,
  }),

  fundingConfirmation: (merchantName, fundingAmount, fundingDate) => ({
    subject: `Funding Approved & Processing - ${merchantName}`,
    content: `
      <h2>Congratulations! Your funding has been approved.</h2>
      <p>Hi ${merchantName},</p>
      <p>Great news! Your funding application has been approved.</p>
      <p><strong>Funding Amount:</strong> $${fundingAmount.toLocaleString()}</p>
      <p><strong>Expected Funding Date:</strong> ${fundingDate}</p>
      <p>Final documents are being prepared and will be sent to you shortly for signature.</p>
      <p>Contact us immediately if you have any questions.</p>
      <p>Best regards,<br/>Commera Funding Team</p>
    `,
  }),

  renewalEligible: (merchantName, renewalAmount) => ({
    subject: `You May Be Eligible for Additional Funding - ${merchantName}`,
    content: `
      <h2>Great News! You're Eligible for Additional Funding</h2>
      <p>Hi ${merchantName},</p>
      <p>Based on your on-time payment history, you may now be eligible for additional funding.</p>
      <p><strong>Potential Additional Funding:</strong> Up to $${renewalAmount.toLocaleString()}</p>
      <p>Are you interested? Reply to this email and we'll get started right away.</p>
      <p>Best regards,<br/>Commera Funding Team</p>
    `,
  }),
};
