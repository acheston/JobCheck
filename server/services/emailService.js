import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email Service
 * Handles sending email alerts when job changes are detected
 */

/**
 * Send email alert for a job change
 * @param {Object} changeInfo - Information about the job change
 * @param {string} changeInfo.personName - Name of the person
 * @param {string} changeInfo.previousRole - Previous job role
 * @param {string} changeInfo.previousCompany - Previous company
 * @param {string} changeInfo.newRole - New job role
 * @param {string} changeInfo.newCompany - New company
 * @param {number} changeInfo.confidence - Confidence level of the detection
 * @param {Array} changeInfo.evidence - Evidence supporting the change
 * @param {Array<string>} changeInfo.recipients - Optional person-specific recipients
 * @returns {Promise<Object>} Result of sending the email
 */
async function sendJobChangeAlert(changeInfo) {
  const {
    personName,
    previousRole,
    previousCompany,
    newRole,
    newCompany,
    confidence,
    evidence = [],
    recipients: personRecipients = []
  } = changeInfo;

  // Use person-specific recipients if provided, otherwise fall back to global recipients
  let recipients = [];
  if (personRecipients && personRecipients.length > 0) {
    recipients = Array.isArray(personRecipients) 
      ? personRecipients.filter(email => email && email.trim().includes('@'))
      : [];
  }
  
  // If no person-specific recipients, use global recipients
  if (recipients.length === 0) {
    recipients = getEmailRecipients();
  }
  
  if (recipients.length === 0) {
    const msg = personRecipients?.length
      ? 'No valid email addresses for this contact (check format).'
      : 'No recipients configured for this contact, and no EMAIL_RECIPIENTS fallback set.';
    console.warn('[EmailService]', msg);
    return { success: false, error: msg };
  }

  // Build email content
  const subject = `Job Change Alert: ${personName} has a new position`;
  
  const htmlContent = buildEmailHTML({
    personName,
    previousRole,
    previousCompany,
    newRole,
    newCompany,
    confidence,
    evidence
  });

  const textContent = buildEmailText({
    personName,
    previousRole,
    previousCompany,
    newRole,
    newCompany,
    confidence,
    evidence
  });

  try {
    // Send emails using Resend batch API
    const from = process.env.EMAIL_FROM || 'JobCheck <onboarding@resend.dev>';
    const emailPromises = recipients.map(recipient => ({
      from,
      to: recipient,
      subject,
      html: htmlContent,
      text: textContent
    }));

    const { data, error } = await resend.batch.send(emailPromises);

    if (error) {
      console.error('[EmailService] Error sending emails:', error);
      
      // Provide helpful error message for Resend validation errors
      if (error.statusCode === 422 && error.message?.includes('testing email address')) {
        const helpfulMessage = error.message + 
          '\n\nNote: In Resend\'s testing mode, you can only send to:' +
          '\n- Verified email addresses in your Resend account' +
          '\n- Test addresses: delivered@resend.dev, bounced@resend.dev, complained@resend.dev' +
          '\n\nTo send to real addresses, verify your domain in the Resend dashboard.';
        return { success: false, error: helpfulMessage };
      }
      
      return { success: false, error: error.message };
    }

    console.log(`[EmailService] Successfully sent ${emailPromises.length} email(s) for ${personName}'s job change`);
    
    // Handle response format - data is an array of { id: string }
    const emailIds = Array.isArray(data) 
      ? data.map(e => e.id || e).filter(Boolean)
      : (data?.id ? [data.id] : []);
    
    return { success: true, emailIds };
  } catch (error) {
    console.error('[EmailService] Exception sending emails:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get list of email recipients from environment variable
 * Supports comma-separated list
 * @returns {Array<string>} Array of email addresses
 */
function getEmailRecipients() {
  const recipientsEnv = process.env.EMAIL_RECIPIENTS || '';
  if (!recipientsEnv.trim()) {
    return [];
  }
  
  return recipientsEnv
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0 && email.includes('@'));
}

/**
 * Build HTML email content
 */
function buildEmailHTML({ personName, previousRole, previousCompany, newRole, newCompany, confidence, evidence }) {
  const changeType = previousCompany !== newCompany ? 'Company' : 'Role';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .change-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
    .previous { color: #666; text-decoration: line-through; }
    .new { color: #4CAF50; font-weight: bold; }
    .confidence { display: inline-block; background-color: #e3f2fd; padding: 5px 10px; border-radius: 3px; margin: 10px 0; }
    .evidence { background-color: #fff3cd; padding: 10px; margin: 10px 0; border-radius: 3px; font-size: 0.9em; }
    .footer { text-align: center; color: #666; font-size: 0.9em; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Job Change Alert</h1>
    </div>
    <div class="content">
      <h2>${personName} has a new position!</h2>
      
      <div class="change-box">
        <p><strong>Previous:</strong></p>
        <p class="previous">${previousRole || 'Unknown'} at ${previousCompany || 'Unknown'}</p>
        
        <p><strong>New:</strong></p>
        <p class="new">${newRole || 'Unknown'} at ${newCompany || 'Unknown'}</p>
      </div>

      <div class="confidence">
        <strong>Confidence Level:</strong> ${confidence}%
      </div>

      ${evidence.length > 0 ? `
      <div>
        <h3>Evidence:</h3>
        ${evidence.map((e, i) => `
          <div class="evidence">
            <strong>Source ${i + 1}:</strong> ${e.snippet || 'N/A'}<br>
            <small><a href="${e.source}">View source</a></small>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div class="footer">
        <p>This alert was automatically generated by JobCheck</p>
        <p>You're receiving this because you're monitoring ${personName}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Build plain text email content
 */
function buildEmailText({ personName, previousRole, previousCompany, newRole, newCompany, confidence, evidence }) {
  return `
Job Change Alert: ${personName} has a new position!

Previous: ${previousRole || 'Unknown'} at ${previousCompany || 'Unknown'}
New: ${newRole || 'Unknown'} at ${newCompany || 'Unknown'}

Confidence Level: ${confidence}%

${evidence.length > 0 ? `
Evidence:
${evidence.map((e, i) => `
${i + 1}. ${e.snippet || 'N/A'}
   Source: ${e.source}
`).join('')}
` : ''}

---
This alert was automatically generated by JobCheck
You're receiving this because you're monitoring ${personName}
  `.trim();
}

export { sendJobChangeAlert, getEmailRecipients };
