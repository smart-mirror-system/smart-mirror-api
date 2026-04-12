const router = require('express').Router();
const { saveSetup, getMe } = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth'); // JWT verify
const { setupLimiter } = require('../middleware/rateLimit');

// Rate limiting is handled globally and per-route via middleware/rateLimit
router.post('/setup', authMiddleware, setupLimiter, saveSetup);

module.exports = router;
