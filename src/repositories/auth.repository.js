const User = require('../models/User');

const findByEmail = async (email) => {
  return await User.findOne({ email });
};

const createUser = async (data) => {
  return await User.create(data);
};

module.exports = {
  findByEmail,
  createUser,
};
