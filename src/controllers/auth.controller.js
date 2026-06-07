const asyncHandler = require('express-async-handler');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.json({
    ok: true,
    ...result,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  res.json({
    ok: true,
    ...result,
  });
});

module.exports = {
  register,
  login,
};
