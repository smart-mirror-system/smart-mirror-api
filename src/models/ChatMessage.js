const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    message: String,
    role: {
      type: String,
      enum: ['User', 'Bot'],
      required: true,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
