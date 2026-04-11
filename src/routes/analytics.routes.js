const router = require('express').Router();
const auth = require('../middleware/auth');
const { summary, progress } = require('../controllers/analytics.controller');

router.get('/summary', auth, summary);
router.get('/progress', auth, progress);

module.exports = router;
