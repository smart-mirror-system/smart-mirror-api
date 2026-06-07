const userRepo = require('../repositories/user.repository');

const saveUserSetup = async (userId, body) => {
  const { language, training, preferences, profile } = body;

  const user = await userRepo.updateById(userId, {
    language,
    training,
    preferences,
    profile,
    isSetupComplete: true,
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const getCurrentUser = async (userId) => {
  const user = await userRepo.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

module.exports = {
  saveUserSetup,
  getCurrentUser,
};
