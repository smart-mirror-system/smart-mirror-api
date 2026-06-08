const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepo = require('../repositories/auth.repository');

const registerUser = async ({ email, password, profile }) => {
  if (!email || !password) {
    const err = new Error('email & password required');
    err.statusCode = 400;
    throw err;
  }

  const exists = await authRepo.findByEmail(email);
  if (exists) {
    const err = new Error('email already exists');
    err.statusCode = 409;
    throw err;
  }

  if (password.length < 8 || password.length > 64) {
    const err = new Error('Password must be between 8 and 64 characters long.');
    err.statusCode = 400;
    throw err;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
    const err = new Error(
      'Password must contain uppercase, lowercase, number, and special character.'
    );
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await authRepo.createUser({
    email,
    passwordHash,
    profile: profile || {},
  });

  return { userId: user._id };
};

const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const err = new Error('email & password required');
    err.statusCode = 400;
    throw err;
  }

  const user = await authRepo.findByEmail(email);
  if (!user) {
    const err = new Error('invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const err = new Error('invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '7d',
  });

  return {
    token,
    userId: user._id,
  };
};

module.exports = {
  registerUser,
  loginUser,
};
