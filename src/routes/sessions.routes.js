const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  createSession,
  latestSession,
  listSessions,
  getSessionById,
} = require('../controllers/sessions.controller');

router.post('/', auth, createSession);
router.get('/latest', auth, latestSession);
router.get('/', auth, listSessions);
router.get('/:id', auth, getSessionById);

module.exports = router;
