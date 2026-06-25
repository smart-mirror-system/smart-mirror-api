const express = require('express');
const router = express.Router();

// NOTE: This route file is registered in server.js (not app.js) because
// the controllers depend on req.io (injected by the Socket.IO middleware).
// See server.js lines ~43-44.

const aisocketController = require('../controllers/aisocket.controller');

router.post('/pause', aisocketController.pauseAi);
router.post('/resume', aisocketController.resumeAi);

module.exports = router;
