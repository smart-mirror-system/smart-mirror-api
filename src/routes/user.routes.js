const router = require('express').Router();
const { saveSetup, getMe } = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware'); // JWT verify
const { setupLimiter } = require('../middleware/rateLimit.middleware');

// Rate limiting is handled globally and per-route via middleware/rateLimit
router.post('/setup', authMiddleware, setupLimiter, saveSetup);

module.exports = router;
