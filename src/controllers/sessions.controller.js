const asyncHandler = require('express-async-handler');
const sessionService = require('../services/session.service');

const createSession = asyncHandler(async (req, res) => {
  const session = await sessionService.createSession(req.user.userId, req.body);

  res.status(201).json({ ok: true, session });
});

const latestSession = asyncHandler(async (req, res) => {
  const latest = await sessionService.getLatestSession(req.user.userId);

  res.json({ ok: true, latest });
});

const listSessions = asyncHandler(async (req, res) => {
  const sessions = await sessionService.listSessions(
    req.user.userId,
    req.query
  );

  res.json({ ok: true, sessions });
});

const getSessionById = asyncHandler(async (req, res) => {
  const session = await sessionService.getSessionById(
    req.user.userId,
    req.params.id
  );

  res.json({ ok: true, session });
});

module.exports = {
  createSession,
  latestSession,
  listSessions,
  getSessionById,
};
