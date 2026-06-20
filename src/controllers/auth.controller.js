const asyncHandler = require('express-async-handler');
const bcrypt       = require('bcryptjs');
const authService = require('../services/auth.service');
const qrService    = require('../services/qr.service');
const otpService   = require('../services/otp.service');
const emailService = require('../services/email.service');
const userRepo     = require('../repositories/user.repository');
const authRepo     = require('../repositories/auth.repository');

/**
 * POST /api/auth/register
 * Body: { email, password, profile }
 *  - profile can include name, avatarUrl, etc.
 * Response: { token, user }
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.json({
    ok: true,
    ...result,
  });
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Response: { token, user }
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  res.json({
    ok: true,
    ...result,
  });
});

/**
 * POST /api/auth/qr-confirm
 * Called by mobile after successful login to notify the mirror
 * Body: { session, token, name }
 * 
 * This triggers a socket event to the mirror instantly via io (injected below)
 * Also stores in memory as REST fallback
 */
const qrConfirm = asyncHandler(async (req, res) => {
  const { session, token, name } = req.body;
 
  if (!session || !token) {
    return res.status(400).json({ ok: false, error: 'session and token are required' });
  }
 
  // 1. Store in memory (REST fallback)
  qrService.confirmSession(session, token, name || 'User');
 
  // 2. Push via socket.io (primary — instant, no polling)
  // req.io is injected by the server (see server.js patch below)
  if (req.io) {
    req.io.to(`qr:${session}`).emit('qr:authenticated', { token, name: name || 'User' });
  }
 
  res.json({ ok: true });
});

/**
 * GET /api/auth/qr-status?session=XXX
 * REST fallback — mirror polls this if socket isn't available
 * Returns token if session was confirmed, otherwise 404
 */
const qrStatus = asyncHandler(async (req, res) => {
  const { session } = req.query;
  if (!session) return res.status(400).json({ ok: false, error: 'session required' });
 
  const data = qrService.getSession(session);
  if (!data) return res.status(404).json({ ok: false, error: 'session not found or expired' });
 
  // Consume the session (one-time use)
  qrService.deleteSession(session);
  res.json({ ok: true, token: data.token, name: data.name });
});

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Sends a 6-digit OTP to the email
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ ok: false, error: 'email is required' });
 
  // Check user exists (but don't reveal if they don't — security best practice)
  const user = await authRepo.findByEmail(email.toLowerCase());
 
  if (user) {
    const otp  = otpService.generateOTP(email);
    const name = user.profile?.name || user.profile?.firstName || '';
 
    try {
      await emailService.sendOTPEmail(email, otp, name);
    } catch (emailErr) {
      console.error('Email send error:', emailErr.message);
      // Don't expose email errors to client
    }
  }
 
  // Always return ok — prevents email enumeration attacks
  res.json({ ok: true, message: 'If that email exists, a reset code has been sent.' });
});
 
/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 * Returns: { resetToken } if valid
 */
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ ok: false, error: 'email and otp are required' });
 
  const result = otpService.verifyOTP(email, String(otp));
  if (!result.ok) return res.status(400).json({ ok: false, error: result.error });
 
  res.json({ ok: true, resetToken: result.resetToken });
});
 
/**
 * POST /api/auth/reset-password
 * Body: { resetToken, newPassword }
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) {
    return res.status(400).json({ ok: false, error: 'resetToken and newPassword are required' });
  }
 
  // Validate password strength (same rules as registration)
  if (newPassword.length < 8 || newPassword.length > 64) {
    return res.status(400).json({ ok: false, error: 'Password must be 8–64 characters.' });
  }
  if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) ||
      !/\d/.test(newPassword)    || !/[@$!%*?&]/.test(newPassword)) {
    return res.status(400).json({
      ok: false,
      error: 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&).'
    });
  }
 
  // Consume the reset token
  const result = otpService.consumeResetToken(resetToken);
  if (!result.ok) return res.status(400).json({ ok: false, error: result.error });
 
  // Find user and update password
  const user = await authRepo.findByEmail(result.email);
  if (!user) return res.status(404).json({ ok: false, error: 'User not found.' });
 
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await userRepo.updateById(user._id, { passwordHash });
 
  res.json({ ok: true, message: 'Password updated successfully.' });
});

module.exports = {
  register,
  login,
  qrConfirm,
  qrStatus,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
