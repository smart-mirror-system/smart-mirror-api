const mongoose = require('mongoose');

const mistakeSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    count: { type: Number, default: 0 },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    exerciseType: { type: String, required: true }, // "squat", "pushup", ...
    reps: { type: Number, required: true },
    formScore: { type: Number, default: null }, // 0..100 optional
    mistakes: { type: [mistakeSchema], default: [] },
    ts: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
