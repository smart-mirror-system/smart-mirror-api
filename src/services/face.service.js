const jwt = require('jsonwebtoken');
const aiClient = require('./aiClient.service');

const registerFace = async (userId, name) => {
  if (!userId || !name) {
    const err = new Error('user_id and name are required');
    err.statusCode = 400;
    throw err;
  }

  return await aiClient.registerFace(userId, name);
};

const trainFace = async () => {
  return await aiClient.trainFace();
};

const faceLogin = async () => {
  const data = await aiClient.recognizeFace();

  if (!data.user_id) {
    const err = new Error('Face not recognized');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign({ userId: data.user_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '7d',
  });

  return {
    token,
    user_id: data.user_id,
    name: data.name,
    confidence: data.confidence,
  };
};

module.exports = {
  registerFace,
  trainFace,
  faceLogin,
};
