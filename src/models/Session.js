const mongoose = require('mongoose');

const mistakeSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    count: { type: Number, default: 1 },
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
    formScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    mistakes: { type: [mistakeSchema], default: [] },
  },
  { timestamps: true }
);

// Optimizes queries like:
// Session.findOne({ userId }).sort({ createdAt: -1 })
// by indexing userId (filter) and createdAt (descending sort)
sessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Session', sessionSchema);
