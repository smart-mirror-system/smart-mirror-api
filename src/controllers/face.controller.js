const asyncHandler = require('express-async-handler');
const faceService = require('../services/face.service');

exports.registerFace = asyncHandler(async (req, res) => {
  const result = await faceService.registerFace(
    req.body.user_id,
    req.body.name
  );

  res.json({
    ok: true,
    ...result,
  });
});

exports.trainFace = asyncHandler(async (req, res) => {
  const result = await faceService.trainFace();

  res.json({
    ok: true,
    ...result,
  });
});

exports.faceLogin = asyncHandler(async (req, res) => {
  const result = await faceService.faceLogin();

  res.json({
    ok: true,
    ...result,
  });
});
