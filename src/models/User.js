const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    profile: {
      name: String,
      age: Number,
      heightCm: Number,
      weightKg: Number,
      goal: String,
      information: String,
    },
    chats: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Chat',
      },
    ],
    trainingSchedule: {
      summary_message: String,
      schedule: [
        {
          day: String,
          focus: String,
          exercises: [
            {
              name: String,
              sets: Number,
              reps: String,
              rest_seconds: Number,
              notes: String,
            },
          ],
        },
      ],
    },
    diet: {
      summary_message: String,
      weekly_targets: {
        calories: Number,
        protein_g: Number,
        carbs_g: Number,
        fat_g: Number,
      },
      plan: [
        {
          day: String,
          meals: [
            {
              type: { type: String }, // e.g., Breakfast
              name: String,
              calories: Number,
              notes: String,
            },
          ],
        },
      ],
      generatedAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
