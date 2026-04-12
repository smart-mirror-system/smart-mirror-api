const axios = require('axios');

const AI_URL = 'http://localhost:8000';

exports.registerFace = async (req, res) => {
  const { user_id, name } = req.body;

  const response = await axios.post(`${AI_URL}/face/register`, null, {
    params: { user_id, name },
  });

  res.json(response.data);
};

exports.trainFace = async (req, res) => {
  const response = await axios.post(`${AI_URL}/face/train`);

  res.json(response.data);
};

exports.faceLogin = async (req, res) => {
  const response = await axios.get(`${AI_URL}/face/recognize`);

  const userId = response.data.user_id;

  if (!userId) {
    return res.status(401).json({
      message: 'Face not recognized',
    });
  }

  return res.json({
    user_id: userId,
    name: response.data.name,
    confidence: response.data.confidence,
  });
};
