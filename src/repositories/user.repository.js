const User = require('../models/User');

const updateById = async (userId, data) => {
  return await User.findByIdAndUpdate(userId, { $set: data }, { new: true });
};

/**
 *
 * @param {*} userId
 * @param {string} selectedItems Fields you want to get from the Record
 * @returns {Promise<Object>}
 */
const findById = async (userId, selectedItems) => {
  const projection = selectedItems ? selectedItems : '-password';
  return await User.findById(userId).select(projection);
};

module.exports = {
  updateById,
  findById,
};
