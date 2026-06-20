/**
 * email.service.js
 * Sends emails via nodemailer
 * 
 * Install: npm install nodemailer
 * 
 * Config via .env:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=your@gmail.com
 *   SMTP_PASS=your-app-password    ← Gmail App Password (not regular password)
 *   SMTP_FROM="SmartMirror <your@gmail.com>"
 * 
 * For Gmail: enable 2FA → App Passwords → generate one
 */

const nodemailer = require('nodemailer');

// Create transporter once (singleton pattern)
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return _transporter;
}

/**
 * Send a password reset OTP email
 * @param {string} toEmail  - Recipient email
 * @param {string} otp      - 6-digit OTP code
 * @param {string} name     - User's name (optional)
 */
async function sendOTPEmail(toEmail, otp, name = '') {
  const transporter = getTransporter();
  const greeting    = name ? `Hi ${name},` : 'Hi,';

  await transporter.sendMail({
    from:    process.env.SMTP_FROM || '"SmartMirror" <noreply@smartmirror.app>',
    to:      toEmail,
    subject: 'Your SmartMirror Password Reset Code',
    text: `${greeting}\n\nYour password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, ignore this email.\n\n— SmartMirror Team`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080e18;color:#fff;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.1);">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="width:48px;height:48px;background:linear-gradient(135deg,#6ba3ff,#3ae7e1);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-5"/></svg>
          </div>
          <h1 style="font-size:20px;font-weight:700;color:#fff;margin:0;letter-spacing:1px;">SmartMirror</h1>
        </div>
        <p style="color:rgba(255,255,255,0.7);margin-bottom:24px;line-height:1.6;">${greeting}<br><br>Here is your password reset code:</p>
        <div style="background:rgba(58,231,225,0.08);border:1px solid rgba(58,231,225,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <div style="font-family:monospace;font-size:42px;font-weight:900;letter-spacing:12px;color:#3ae7e1;text-shadow:0 0 20px rgba(58,231,225,0.5);">${otp}</div>
        </div>
        <p style="color:rgba(255,255,255,0.45);font-size:13px;line-height:1.6;">This code expires in <strong style="color:#ffd250;">10 minutes</strong>.<br>If you didn't request a password reset, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;">
        <p style="color:rgba(255,255,255,0.25);font-size:11px;text-align:center;margin:0;">SmartMirror · Fitness AI Platform</p>
      </div>
    `,
  });
}

module.exports = { sendOTPEmail };
