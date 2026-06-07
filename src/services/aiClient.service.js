const axios = require('axios');

const AI_URL = 'http://localhost:8000';

const registerFace = async (user_id, name) => {
  const response = await axios.post(`${AI_URL}/face/register`, null, {
    params: { user_id, name },
  });

  return response.data;
};

const trainFace = async () => {
  const response = await axios.post(`${AI_URL}/face/train`);
  return response.data;
};

const recognizeFace = async () => {
  const response = await axios.get(`${AI_URL}/face/recognize`);
  return response.data;
};

module.exports = {
  registerFace,
  trainFace,
  recognizeFace,
};
