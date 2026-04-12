const rateLimit = require('express-rate-limit');

exports.globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.REQUEST_LIMIT) || 100,
  message: { 
    ok: false, 
    error: 'Too many requests from this IP, please try again after 15 minutes' 
  },
});

exports.setupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    ok: false,
    error: 'Too many setup requests, please try again later'
  }
});

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    ok: false,
    error: 'Too many authentication requests, please try again later'
  }
});
