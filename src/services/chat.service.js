const chatRepository = require('../repositories/chat.repository');

class ChatService {
  async createChat(userId, title) {
    const chatTitle = title || 'New Chat';
    return await chatRepository.createChat({ title: chatTitle, userId });
  }

  async getAllChats(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Run database queries concurrently for better performance
    const [chats, total] = await Promise.all([
      chatRepository.findChatsByUser(userId, skip, limit),
      chatRepository.countChatsByUser(userId),
    ]);

    return {
      chats,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getChatDetails(chatId, userId, page = 1, limit = 5) {
    const chat = await chatRepository.findChatByIdAndUser(chatId, userId);

    if (!chat) return null; // Let the controller handle the 404 response

    const skip = (page - 1) * limit;

    const [chatMessages, totalMessages] = await Promise.all([
      chatRepository.findMessagesByChatId(chatId, skip, limit),
      chatRepository.countMessagesByChatId(chatId),
    ]);

    return {
      chat,
      chatMessages,
      pagination: {
        totalMessages,
        page,
        totalPages: Math.ceil(totalMessages / limit),
      },
    };
  }

  async deleteChat(chatId, userId) {
    const chat = await chatRepository.deleteChat(chatId, userId);

    if (!chat) return false;

    // Only delete messages if the chat was successfully found and deleted
    await chatRepository.deleteMessagesByChatId(chatId);
    return true;
  }

  async updateChat(chatId, userId, title) {
    return await chatRepository.updateChatTitle(chatId, userId, title);
  }
}

module.exports = new ChatService();
