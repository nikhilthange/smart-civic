/**
 * emailService.js
 * Principal Email Delivery & Verification Infrastructure for Smart Civic AI
 * Supports: SMTP, Gmail App Passwords, Resend/SendGrid SMTP, and Dev Fallback.
 */

const nodemailer = require("nodemailer");
const crypto = require("crypto");

let transporter = null;
let isSmtpConfigured = false;
let lastVerifyStatus = null;

/**
 * Initialize and return the Nodemailer transporter
 */
function getTransporter() {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASS;
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

  if (smtpUser && smtpPass) {
    if (smtpHost) {
      // Custom / Enterprise SMTP Configuration
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === "production",
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      });
    } else {
      // Gmail SMTP Service with App Password
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }
    isSmtpConfigured = true;
  } else {
    isSmtpConfigured = false;
    transporter = null;
  }

  return transporter;
}

/**
 * Verify the SMTP connection on startup / diagnostics
 */
async function verifyConnection() {
  const mailer = getTransporter();
  if (!mailer) {
    lastVerifyStatus = {
      connected: false,
      reason: "SMTP credentials not provided in environment variables (SMTP_USER/EMAIL_USER and SMTP_PASS/EMAIL_PASS).",
    };
    return lastVerifyStatus;
  }

  try {
    await mailer.verify();
    lastVerifyStatus = { connected: true, timestamp: new Date().toISOString() };
    console.log("✅ [EmailService] SMTP Transporter connection verified successfully.");
    return lastVerifyStatus;
  } catch (error) {
    lastVerifyStatus = {
      connected: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    };
    console.warn("⚠️  [EmailService] SMTP connection verification failed:", error.message);
    return lastVerifyStatus;
  }
}

/**
 * Helper to build high-converting, spam-resistant Municipal Verification HTML
 */
function buildVerificationEmailHtml({ name, verificationUrl, supportEmail }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Smart Civic AI Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="580" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 36px 32px; text-align: center; border-bottom: 4px solid #10b981;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 14px; padding: 10px 14px; margin-bottom: 12px;">
                      <span style="font-size: 26px; line-height: 1;">🏛️</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Smart Civic AI</h1>
                    <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Citizen Grievance & Municipal Platform</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                Verify your email address
              </h2>
              
              <p style="margin: 0 0 16px 0; color: #334155; font-size: 15px;">
                Hello <strong>${name || "Citizen"}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; color: #334155; font-size: 15px;">
                Thank you for registering on the Smart Civic AI portal. To activate your account and start lodging, tracking, and resolving municipal grievances in your ward, please verify your email address.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.35); text-align: center;">
                      Verify My Account →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 8px 0; color: #64748b; font-size: 13px;">
                Or copy and paste this link into your web browser:
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; word-break: break-all; font-family: monospace; font-size: 12px; color: #0f172a;">
                ${verificationUrl}
              </div>

              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                  ⚠️ This verification link will expire in <strong>24 hours</strong>. If you did not create an account on Smart Civic AI, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px; font-weight: 500;">
                Brihanmumbai Municipal Corporation (BMC) • Smart Civic AI Portal
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                Need assistance? Contact support at <a href="mailto:${supportEmail}" style="color: #6366f1; text-decoration: underline;">${supportEmail}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send an email verification message
 */
async function sendVerificationEmail({ email, name, verificationToken, clientUrl }) {
  const baseUrl = clientUrl || process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || "https://smart-civic-pi.vercel.app";
  const verificationUrl = `${baseUrl.replace(/\/$/, "")}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
  const supportEmail = process.env.SUPPORT_EMAIL || "support@smartcivic.mumbai.gov.in";
  const fromAddress = process.env.SMTP_FROM || `"Smart Civic AI Portal" <${process.env.SMTP_USER || process.env.EMAIL_USER || "noreply@smartcivic.mumbai.gov.in"}>`;

  const mailer = getTransporter();

  // 1. Production / Live SMTP Dispatch
  if (mailer && isSmtpConfigured) {
    try {
      const info = await mailer.sendMail({
        from: fromAddress,
        to: email,
        replyTo: supportEmail,
        subject: "Verify Your Smart Civic AI Account 🏛️",
        html: buildVerificationEmailHtml({ name, verificationUrl, supportEmail }),
        headers: {
          "X-Entity-Ref-ID": crypto.randomUUID(),
          "X-Priority": "1",
          "Importance": "high",
        },
      });

      console.log(`📧 [EmailService] Verification email sent successfully to ${email} (MessageId: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
        sent: true,
        verificationUrl: process.env.NODE_ENV !== "production" ? verificationUrl : undefined,
      };
    } catch (err) {
      console.error(`❌ [EmailService] Failed to send email via SMTP to ${email}:`, err.message);
      
      // In development or staging, also log the direct URL so developers / testers are never blocked
      console.log(`\n========================================================================`);
      console.log(`[DEV/TEST FALLBACK] Direct verification link for ${email}:`);
      console.log(`👉 ${verificationUrl}`);
      console.log(`========================================================================\n`);

      // If in strict production and not configured, throw error so UI doesn't give false positive
      if (process.env.NODE_ENV === "production" && process.env.STRICT_EMAIL === "true") {
        throw new Error(`Email dispatch failed: ${err.message}`);
      }

      return {
        success: true,
        sent: false,
        fallbackMode: true,
        verificationUrl,
        warning: `SMTP failed (${err.message}). Verification link generated for test environment.`,
      };
    }
  }

  // 2. Development / Sandbox Fallback Logging
  console.log(`\n========================================================================`);
  console.log(`[DEV/TEST] SMTP not configured. Direct verification link for ${email}:`);
  console.log(`👉 ${verificationUrl}`);
  console.log(`========================================================================\n`);

  return {
    success: true,
    sent: false,
    fallbackMode: true,
    verificationUrl,
    warning: "SMTP not configured on server. Direct verification link generated for test bypass.",
  };
}

module.exports = {
  getTransporter,
  verifyConnection,
  sendVerificationEmail,
};
