const Session = require('../models/Session');
const { rangeToDates } = require('../utils/dateRange');

async function summary(req, res) {
  const range = req.query.range || '7d';
  const { start, end } = rangeToDates(range);

  const sessions = await Session.find({
    userId: req.user.userId,
    ts: { $gte: start, $lte: end },
  });

  const totalSessions = sessions.length;
  const totalReps = sessions.reduce((a, s) => a + (s.reps || 0), 0);

  const scored = sessions.filter((s) => typeof s.formScore === 'number');
  const avgFormScore = scored.length
    ? Math.round(scored.reduce((a, s) => a + s.formScore, 0) / scored.length)
    : null;

  // aggregate mistakes
  const mistakeMap = new Map();
  for (const s of sessions) {
    for (const m of s.mistakes || []) {
      if (!m?.type) continue;
      mistakeMap.set(m.type, (mistakeMap.get(m.type) || 0) + (m.count || 0));
    }
  }
  const topMistakes = [...mistakeMap.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  res.json({
    ok: true,
    range,
    totalSessions,
    totalReps,
    avgFormScore,
    topMistakes,
  });
}

async function progress(req, res) {
  const range = req.query.range || '30d';
  const exerciseType = req.query.exerciseType;
  const { start, end } = rangeToDates(range);

  const q = { userId: req.user.userId, ts: { $gte: start, $lte: end } };
  if (exerciseType) q.exerciseType = exerciseType;

  const sessions = await Session.find(q).sort({ ts: 1 });

  const points = sessions.map((s) => ({
    date: s.ts.toISOString().slice(0, 10),
    reps: s.reps,
    formScore: s.formScore,
    exerciseType: s.exerciseType,
  }));

  res.json({ ok: true, range, exerciseType: exerciseType || 'all', points });
}

module.exports = { summary, progress };
