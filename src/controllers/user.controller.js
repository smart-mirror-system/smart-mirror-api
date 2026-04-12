const User = require('../models/User');

async function saveSetup(req, res) {
  try {
    const userId = req.user.userId;
    const { language, training, preferences, profile } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          language,
          training,
          preferences,
          profile,
          isSetupComplete: true,
        },
      },
      { new: true }
    );

    res.json({ ok: true, user });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'server error' });
  }
}

async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    res.json({ ok: true, user });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
}

module.exports = { saveSetup, getMe };
