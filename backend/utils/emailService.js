/**
 * AgriConnect Email Service
 * Production Resend Node.js SDK wrapper for HTTPS transactional email delivery (OTP, Notifications)
 *
 * Features:
 * - 100% Outbound HTTPS on Port 443 (eliminates Render SMTP ETIMEDOUT on port 587/465)
 * - Safe diagnostic logging (Masked recipient, message ID, provider status)
 * - Zero exposure of credentials, API keys, passwords, or OTP values in logs
 * - Strict delivery confirmation (Verifies message ID confirmed by Resend API)
 * - Zero dependency on Gmail SMTP or Nodemailer for OTP delivery
 */

const { Resend } = require('resend');

/**
 * Mask email address for safe logging (e.g. nay***@gmail.com)
 * Prevents PII exposure in console and deployment logs
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '***';
  const parts = email.trim().split('@');
  if (parts.length !== 2) return '***';
  const [localPart, domain] = parts;
  const visible = localPart.length <= 3 ? localPart[0] : localPart.substring(0, 3);
  return `${visible}***@${domain}`;
}

/**
 * Retrieve initialized Resend client
 * Throws clean error if RESEND_API_KEY is missing
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
  if (!apiKey) {
    const err = new Error('RESEND_API_KEY is not configured in environment variables');
    err.code = 'RESEND_NOT_CONFIGURED';
    throw err;
  }
  return new Resend(apiKey);
}

/**
 * Retrieve configured sender address from environment
 * Default: 'AgriConnect <onboarding@resend.dev>'
 */
function getSenderEmail() {
  const from = process.env.RESEND_FROM_EMAIL ? process.env.RESEND_FROM_EMAIL.trim() : '';
  if (from) {
    // If the user provided plain email like "nayankp987@gmail.com", format with friendly display name
    if (!from.includes('<') && from.includes('@')) {
      return `AgriConnect <${from}>`;
    }
    return from;
  }
  return 'AgriConnect <onboarding@resend.dev>';
}

/**
 * Verify Resend Email Service configuration (via HTTPS)
 * @returns {Promise<{ success: boolean, message: string, provider: string, fromEmail: string, code?: string }>}
 */
async function verifyEmailService() {
  const apiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
  const fromEmail = getSenderEmail();

  if (!apiKey) {
    const msg = 'RESEND_API_KEY is not configured in environment variables';
    console.warn(`[EmailService] âš ï¸ ${msg}`);
    return {
      success: false,
      message: msg,
      provider: 'Resend (HTTPS API)',
      code: 'MISSING_API_KEY',
      fromEmail,
    };
  }

  try {
    const resend = getResendClient();
    console.log(`[EmailService] Verifying Resend API configuration via HTTPS (From: ${fromEmail})...`);

    // Quick HTTPS ping to check API key validity
    const response = await resend.apiKeys.list();
    if (response.error) {
      console.error(`[EmailService] âŒ Resend API verification returned error: ${response.error.message}`);
      return {
        success: false,
        message: response.error.message,
        provider: 'Resend (HTTPS API)',
        code: response.error.name || 'RESEND_API_ERROR',
        fromEmail,
      };
    }

    console.log(`[EmailService] âœ… Resend Email Service verified successfully over HTTPS (Port 443)`);
    return {
      success: true,
      message: 'Resend email service verified successfully over HTTPS',
      provider: 'Resend (HTTPS API)',
      fromEmail,
    };
  } catch (error) {
    console.error(`[EmailService] âŒ Resend verification error: ${error.message}`);
    return {
      success: false,
      message: error.message,
      provider: 'Resend (HTTPS API)',
      code: error.code || 'RESEND_CHECK_FAILED',
      fromEmail,
    };
  }
}

/**
 * Send OTP Verification Email via Resend HTTPS API
 * @param {object} params
 * @param {string} params.to - Farmer/User recipient email address
 * @param {string} params.otp - 6-digit verification code
 * @param {string} [params.userName] - Recipient name
 * @returns {Promise<object>} Result containing messageId, target recipient, and confirmation
 */
async function sendOtpEmail({ to, otp, userName = 'Farmer / Agri Partner' }) {
  if (!to || typeof to !== 'string') {
    throw new Error('Recipient email address is required');
  }
  if (!otp) {
    throw new Error('OTP code is required');
  }

  const normalizedTo = to.trim().toLowerCase();
  const maskedTo = maskEmail(normalizedTo);
  const fromEmail = getSenderEmail();

  const resend = getResendClient();

  const textContent = `Hello ${userName},\n\nYour AgriConnect verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this code, please ignore this email.\n\nWarm regards,\nAgriConnect Team`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #15803d 0%, #166534 100%); padding: 28px 32px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">ðŸŒ¾ AgriConnect</h1>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9; font-weight: 500;">Connecting Farmers, FPOs & Buyers Directly</p>
      </div>
      <div style="padding: 32px; color: #334155; line-height: 1.6;">
        <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">Account Verification Code</h2>
        <p style="font-size: 14px; margin-bottom: 24px;">Hello <strong>${userName}</strong>,</p>
        <p style="font-size: 14px; margin-bottom: 24px;">Please use the following one-time password (OTP) to complete your registration or login on AgriConnect:</p>

        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 16px 36px;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #15803d;">${otp}</span>
          </div>
          <p style="margin: 10px 0 0; font-size: 12px; color: #64748b;">â±ï¸ This verification code expires in <strong>5 minutes</strong>.</p>
        </div>

        <div style="background-color: #f8fafc; border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 6px; margin: 24px 0;">
          <p style="margin: 0; font-size: 12px; color: #475569;">
            <strong>Security Notice:</strong> Never share your verification code or passwords with anyone. AgriConnect representatives will never ask for your OTP.
          </p>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 24px;">If you did not request this verification code, please ignore this email or contact support.</p>
      </div>
      <div style="background-color: #f1f5f9; padding: 16px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        Â© ${new Date().getFullYear()} AgriConnect Karnataka. All rights reserved.
      </div>
    </div>
  `;

  console.log(`[EmailService] Attempting to send OTP email to ${maskedTo} via Resend HTTPS API...`);

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [normalizedTo],
      subject: `Your AgriConnect Verification Code: ${otp}`,
      text: textContent,
      html: htmlContent,
    });

    if (error) {
      const deliveryErr = new Error(error.message || 'Resend rejected email delivery');
      deliveryErr.code = error.name || 'RESEND_DELIVERY_ERROR';
      deliveryErr.statusCode = error.statusCode || 503;
      console.error(`[EmailService] âŒ Failed to send OTP to ${maskedTo}: ${deliveryErr.message} (status: ${deliveryErr.statusCode})`);
      throw deliveryErr;
    }

    if (!data || !data.id) {
      const noIdErr = new Error('Resend did not return a valid delivery ID confirmation');
      noIdErr.code = 'RESEND_NO_ID';
      console.error(`[EmailService] âŒ Failed to send OTP to ${maskedTo}: No delivery ID received`);
      throw noIdErr;
    }

    // Safe Diagnostic Logging (NO credentials, NO passwords, NO OTP logged)
    console.log(`[EmailService] âœ… Resend Delivery Attempt Complete:`);
    console.log(`   - Message ID: ${data.id}`);
    console.log(`   - Recipient (Target): ${maskedTo}`);
    console.log(`   - Sender: ${fromEmail}`);
    console.log(`   - Transport: Resend HTTPS API (Port 443)`);

    return {
      success: true,
      messageId: data.id,
      to: maskedTo,
      provider: 'Resend',
    };
  } catch (err) {
    if (!err.code) {
      err.code = 'RESEND_NETWORK_ERROR';
    }
    console.error(`[EmailService] âŒ Error dispatching OTP via Resend to ${maskedTo}: ${err.message}`);
    throw err;
  }
}

module.exports = {
  sendOtpEmail,
  verifyEmailService,
  verifySmtpConnection: verifyEmailService, // Backwards-compatible alias
  maskEmail,
  getSenderEmail,
};
