const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function register(req, res) {
  const { email, password, profile } = req.body;
  if (!email || !password) return res.status(400).json({ ok: false, error: "email & password required" });

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ ok: false, error: "email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, profile: profile || {} });

  res.json({ ok: true, userId: user._id });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ ok: false, error: "email & password required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ ok: false, error: "invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ ok: false, error: "invalid credentials" });

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );

  res.json({ ok: true, token, userId: user._id });
}

module.exports = { register, login };
