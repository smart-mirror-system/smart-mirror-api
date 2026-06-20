/**
 * otp.service.js
 * In-memory OTP store for password reset
 * 
 * Flow:
 * 1. POST /api/auth/forgot-password  → generate OTP → send email
 * 2. POST /api/auth/verify-otp       → validate OTP → return resetToken
 * 3. POST /api/auth/reset-password   → validate resetToken → update password
 */

const crypto = require('crypto');

const OTP_TTL_MS      = 10 * 60 * 1000; // 10 minutes
const RESET_TTL_MS    = 15 * 60 * 1000; // 15 minutes after OTP verified

// Map<email, { otp, expiresAt, attempts }>
const otpStore = new Map();

// Map<resetToken, { email, expiresAt }>
const resetTokenStore = new Map();

// Cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of otpStore)        if (now > v.expiresAt)    otpStore.delete(k);
  for (const [k, v] of resetTokenStore) if (now > v.expiresAt) resetTokenStore.delete(k);
}, 5 * 60_000);

/**
 * Generate a 6-digit OTP for an email
 * @param {string} email
 * @returns {string} The 6-digit OTP
 */
function generateOTP(email) {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
  return otp;
}

/**
 * Verify an OTP for an email
 * @param {string} email
 * @param {string} otp
 * @returns {{ ok: boolean, resetToken?: string, error?: string }}
 */
function verifyOTP(email, otp) {
  const key    = email.toLowerCase();
  const record = otpStore.get(key);

  if (!record) return { ok: false, error: 'No OTP found. Please request a new one.' };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { ok: false, error: 'OTP has expired. Please request a new one.' };
  }

  // Max 5 attempts to prevent brute force
  record.attempts++;
  if (record.attempts > 5) {
    otpStore.delete(key);
    return { ok: false, error: 'Too many attempts. Please request a new OTP.' };
  }

  if (record.otp !== String(otp)) {
    return { ok: false, error: 'Incorrect code. Please try again.' };
  }

  // OTP correct — generate one-time reset token
  otpStore.delete(key);
  const resetToken = crypto.randomBytes(32).toString('hex');
  resetTokenStore.set(resetToken, {
    email: key,
    expiresAt: Date.now() + RESET_TTL_MS,
  });

  return { ok: true, resetToken };
}

/**
 * Consume a reset token (verify + delete in one step)
 * @param {string} resetToken
 * @returns {{ ok: boolean, email?: string, error?: string }}
 */
function consumeResetToken(resetToken) {
  const record = resetTokenStore.get(resetToken);
  if (!record) return { ok: false, error: 'Invalid or expired reset token.' };
  if (Date.now() > record.expiresAt) {
    resetTokenStore.delete(resetToken);
    return { ok: false, error: 'Reset token has expired. Please start over.' };
  }
  resetTokenStore.delete(resetToken);
  return { ok: true, email: record.email };
}

module.exports = { generateOTP, verifyOTP, consumeResetToken };
