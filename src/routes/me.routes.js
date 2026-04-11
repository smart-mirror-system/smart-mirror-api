const router = require('express').Router();
const rateLimit = require('express-rate-limit');

const auth = require('../middleware/auth');
const {
  me,
  createTrainingSchedule,
  getTrainingSchedule,
  deleteTrainingSchedule,
} = require('../controllers/me.controller');

const generateScheduleLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { 
    ok: false, 
    error: 'Too many requests from this IP, please try again later after 1 hour from the last request' 
  },
});


router.get('/', auth, me);
router
  .route('/schedule')
  .get(auth, getTrainingSchedule)
  .post(auth, generateScheduleLimit, createTrainingSchedule)
  .put(auth, generateScheduleLimit, createTrainingSchedule)
  .delete(auth, deleteTrainingSchedule);

module.exports = router;
