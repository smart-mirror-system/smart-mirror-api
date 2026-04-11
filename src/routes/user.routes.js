const router = require('express').Router();
const { saveSetup, getMe } = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth'); // JWT verify

router.post('/setup', authMiddleware, saveSetup);

module.exports = router;
