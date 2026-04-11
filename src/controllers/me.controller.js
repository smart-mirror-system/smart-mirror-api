const User = require('../models/User');
const {
  generateTrainingSchedule,
} = require('../services/training-schedule.service');

async function me(req, res) {
  const user = await User.findById(req.user.userId).select('-passwordHash');
  if (!user)
    return res.status(404).json({ ok: false, error: 'user not found' });
  res.json({ ok: true, user });
}

async function createTrainingSchedule(req, res, next) {
  try {
    const user = await User.findById(req.user.userId).select('profile');
    if (!user)
      return res.status(404).json({ ok: false, error: 'user not found' });
    console.log('generating');

    const schedule = await generateTrainingSchedule(user);
    console.log('Generated');

    user.trainingSchedule = schedule;
    await user.save();

    res.status(201).json({ ok: true, schedule: user.trainingSchedule });
  } catch (err) {
    console.error('Error creating schedule:', err);
    next(err);
  }
}

async function getTrainingSchedule(req, res, next) {
  try {
    const user = await User.findById(req.user.userId).select(
      'trainingSchedule'
    );
    if (!user)
      return res.status(404).json({ ok: false, error: 'user not found' });

    res.status(200).json({ ok: true, schedule: user.trainingSchedule });
  } catch (err) {
    console.error('Error getting schedule', err);
    next(err);
  }
}

async function deleteTrainingSchedule(req, res, next) {
  try {
    const user = await User.findById(req.user.userId).select(
      'trainingSchedule'
    );
    if (!user)
      return res.status(404).json({ ok: false, error: 'user not found' });

    user.trainingSchedule = null;
    await user.save();
    res
      .status(200)
      .json({ ok: true, message: 'schedule deleted successfully' });
  } catch (err) {
    console.error('Error Deleting Schedule', err);
    next(err);
  }
}

module.exports = {
  me,
  createTrainingSchedule,
  getTrainingSchedule,
  deleteTrainingSchedule,
};
