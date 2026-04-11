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
    },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
