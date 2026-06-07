const asyncHandler = require('express-async-handler');
const analyticsService = require('../services/analytics.service');

const summary = asyncHandler(async (req, res) => {
  const data = await analyticsService.getSummary(
    req.user.userId,
    req.query.range
  );

  res.json({ ok: true, ...data });
});

const progress = asyncHandler(async (req, res) => {
  const data = await analyticsService.getProgress(
    req.user.userId,
    req.query.range,
    req.query.exerciseType
  );

  res.json({ ok: true, ...data });
});

module.exports = {
  summary,
  progress,
};
