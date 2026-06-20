const express = require('express');
const router  = express.Router();
const {
  register,
  login,
  qrConfirm,
  qrStatus,
  forgotPassword,
  verifyOTP,
  resetPassword,
} = require('../controllers/auth.controller');

router.post('/register', register); // create account
router.post('/login', login); // get JWT token

// ── QR authentication (socket is primary, REST is fallback) ──
router.post('/qr-confirm',  qrConfirm);  // mobile calls this after login
router.get('/qr-status',    qrStatus);   // mirror polls this (fallback only)
 
// ── Password reset OTP flow ──
router.post('/forgot-password', forgotPassword); // sends OTP email
router.post('/verify-otp',      verifyOTP);      // validates OTP → returns resetToken
router.post('/reset-password',  resetPassword);  // uses resetToken → updates password

module.exports = router;
