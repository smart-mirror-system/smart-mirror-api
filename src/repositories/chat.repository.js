const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');

class ChatRepository {
  async createChat(chatData) {
    return await Chat.create(chatData);
  }

  async findChatsByUser(userId, skip, limit) {
    return await Chat.find({ userId })
      .select('-userId -__v')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async countChatsByUser(userId) {
    return await Chat.countDocuments({ userId });
  }

  async findChatByIdAndUser(chatId, userId) {
    return await Chat.findOne({ _id: chatId, userId })
      .select('-userId -__v')
      .lean();
  }

  async findMessagesByChatId(chatId, skip, limit) {
    return await ChatMessage.find({ chatId })
      .select('-userId -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async countMessagesByChatId(chatId) {
    return await ChatMessage.countDocuments({ chatId });
  }

  async deleteChat(chatId, userId) {
    return await Chat.findOneAndDelete({ _id: chatId, userId });
  }

  async deleteMessagesByChatId(chatId) {
    return await ChatMessage.deleteMany({ chatId });
  }

  async updateChatTitle(chatId, userId, title) {
    return await Chat.findOneAndUpdate(
      { _id: chatId, userId },
      { $set: { title } },
      { new: true, runValidators: true }
    ).select('-userId -__v');
  }
}

module.exports = new ChatRepository();
