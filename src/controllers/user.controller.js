const asyncHandler = require('express-async-handler');
const userService = require('../services/user.service');

const saveSetup = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const user = await userService.saveUserSetup(userId, req.body);

  res.json({ ok: true, user });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getCurrentUser(req.user.userId);

  res.json({ ok: true, user });
});

module.exports = { saveSetup, getMe };
