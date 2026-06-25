const asyncHandler = require('express-async-handler');
const aisocketService = require('../services/aisocket.service');

exports.pauseAi = asyncHandler(async (req, res) => {
  aisocketService.pauseAi(req.io);
  res.json({ ok: true });
});

exports.resumeAi = asyncHandler(async (req, res) => {
  aisocketService.resumeAi(req.io);
  res.json({ ok: true });
});
