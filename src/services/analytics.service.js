const sessionRepo = require('../repositories/session.repository');
const { rangeToDates } = require('../utils/dateRange');

const getSummary = async (userId, range = '7d') => {
  const { start, end } = rangeToDates(range);

  const sessions = await sessionRepo.findByUserAndDateRange(userId, start, end);

  const totalSessions = sessions.length;

  const totalReps = sessions.reduce((acc, s) => acc + (s.reps || 0), 0);

  const scored = sessions.filter((s) => typeof s.formScore === 'number');

  const avgFormScore = scored.length
    ? Math.round(
        scored.reduce((acc, s) => acc + s.formScore, 0) / scored.length
      )
    : null;

  // mistakes aggregation
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

  return {
    range,
    totalSessions,
    totalReps,
    avgFormScore,
    topMistakes,
  };
};

const getProgress = async (userId, range = '30d', exerciseType) => {
  const { start, end } = rangeToDates(range);

  const extra = {};
  if (exerciseType) extra.exerciseType = exerciseType;

  const sessions = await sessionRepo.findByUserAndDateRange(
    userId,
    start,
    end,
    extra
  );

  const points = sessions
    .sort((a, b) => a.ts - b.ts)
    .map((s) => ({
      date: s.ts.toISOString().slice(0, 10),
      reps: s.reps,
      formScore: s.formScore,
      exerciseType: s.exerciseType,
    }));

  return {
    range,
    exerciseType: exerciseType || 'all',
    points,
  };
};

module.exports = {
  getSummary,
  getProgress,
};
