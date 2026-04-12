const jwt = require('jsonwebtoken');

/**
 * Generate JWT for smart mirror device authentication
 */
const generateDeviceToken = (deviceId, secret) => {
  return jwt.sign({ type: 'device', deviceId }, secret, { expiresIn: '365d' });
};

module.exports = generateDeviceToken;
