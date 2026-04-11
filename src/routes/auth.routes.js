const router = require('express').Router();
const { register, login } = require('../controllers/auth.controller');

router.post('/register', register); // create account
router.post('/login', login); // get JWT token

module.exports = router;
