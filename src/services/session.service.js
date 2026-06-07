const sessionRepo = require('../repositories/session.repository');

const createSession = async (userId, body) => {
  const { exerciseType, reps, formScore, mistakes } = body;

  if (!exerciseType || typeof reps !== 'number') {
    const err = new Error('exerciseType and reps (number) required');
    err.statusCode = 400;
    throw err;
  }

  const session = await sessionRepo.create({
    userId,
    exerciseType,
    reps,
    formScore: formScore ?? null,
    mistakes: Array.isArray(mistakes) ? mistakes : [],
  });

  return session;
};

const getLatestSession = async (userId) => {
  return await sessionRepo.findLatestByUser(userId);
};

const listSessions = async (userId, queryParams) => {
  const { from, to, exerciseType } = queryParams;

  const query = { userId };

  if (exerciseType) query.exerciseType = exerciseType;

  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  return await sessionRepo.findAll(query);
};

const getSessionById = async (userId, sessionId) => {
  const session = await sessionRepo.findByIdAndUser(sessionId, userId);

  if (!session) {
    const err = new Error('session not found');
    err.statusCode = 404;
    throw err;
  }

  return session;
};

module.exports = {
  createSession,
  getLatestSession,
  listSessions,
  getSessionById,
};
