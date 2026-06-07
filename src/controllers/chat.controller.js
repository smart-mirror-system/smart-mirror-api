const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const chatService = require('../services/chat.service');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const createChat = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { title } = req.body;

  const newChat = await chatService.createChat(userId, title);

  res.status(201).json({
    ok: true,
    chatId: newChat._id,
    title: newChat.title,
  });
});

const getAllChats = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const result = await chatService.getAllChats(userId, page, limit);

  res.status(200).json({
    ok: true,
    ...result,
  });
});

const getChat = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { chatId } = req.params;

  if (!isValidId(chatId)) {
    return res.status(400).json({ ok: false, error: 'Invalid chat ID format' });
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;

  const result = await chatService.getChatDetails(chatId, userId, page, limit);

  if (!result) {
    return res
      .status(404)
      .json({ ok: false, error: 'Chat not found or unauthorized' });
  }

  res.status(200).json({
    ok: true,
    ...result,
  });
});

const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.user;

  if (!isValidId(chatId)) {
    return res.status(400).json({ ok: false, error: 'Invalid chat ID format' });
  }

  const isDeleted = await chatService.deleteChat(chatId, userId);

  if (!isDeleted) {
    return res.status(404).json({ ok: false, error: 'Chat not found' });
  }

  return res.status(204).send();
});

const updateChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.user;
  const { title } = req.body;

  if (!isValidId(chatId)) {
    return res.status(400).json({ ok: false, error: 'Invalid chat ID format' });
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res
      .status(400)
      .json({ ok: false, error: 'A valid text title is required' });
  }

  const chat = await chatService.updateChat(chatId, userId, title);

  if (!chat) {
    return res.status(404).json({ ok: false, error: 'Chat not found' });
  }

  res.status(200).json({ ok: true, chat });
});

module.exports = {
  createChat,
  getAllChats,
  getChat,
  updateChat,
  deleteChat,
};
