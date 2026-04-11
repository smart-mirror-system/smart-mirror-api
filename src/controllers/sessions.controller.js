const Session = require('../models/Session');

async function createSession(req, res) {
  const { exerciseType, reps, formScore, mistakes, ts } = req.body;

  if (!exerciseType || typeof reps !== 'number') {
    return res
      .status(400)
      .json({ ok: false, error: 'exerciseType and reps (number) required' });
  }

  const session = await Session.create({
    userId: req.user.userId,
    exerciseType,
    reps,
    formScore: formScore ?? null,
    mistakes: Array.isArray(mistakes) ? mistakes : [],
    ts: ts ? new Date(ts) : new Date(),
  });

  res.json({ ok: true, session });
}

async function latestSession(req, res) {
  const latest = await Session.findOne({ userId: req.user.userId }).sort({
    ts: -1,
  });
  res.json({ ok: true, latest });
}

async function listSessions(req, res) {
  const { from, to, exerciseType } = req.query;
  const q = { userId: req.user.userId };

  if (exerciseType) q.exerciseType = exerciseType;

  if (from || to) {
    q.ts = {};
    if (from) q.ts.$gte = new Date(from);
    if (to) q.ts.$lte = new Date(to);
  }

  const sessions = await Session.find(q).sort({ ts: -1 }).limit(500);
  res.json({ ok: true, sessions });
}

async function getSessionById(req, res) {
  const s = await Session.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  });
  if (!s)
    return res.status(404).json({ ok: false, error: 'session not found' });
  res.json({ ok: true, session: s });
}

module.exports = { createSession, latestSession, listSessions, getSessionById };
