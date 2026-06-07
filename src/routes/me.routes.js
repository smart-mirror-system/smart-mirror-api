const router = require('express').Router();

const { aiLimiter } = require('../middleware/rateLimit.middleware');
const auth = require('../middleware/auth.middleware');
const meController = require('../controllers/me.controller');
const chatController = require('../controllers/chat.controller');

router.get('/', auth, meController.me);

router
  .route('/schedule')
  .get(auth, meController.getTrainingSchedule)
  .post(auth, aiLimiter, meController.createTrainingSchedule)
  .put(auth, aiLimiter, meController.createTrainingSchedule)
  .delete(auth, meController.deleteTrainingSchedule);

router
  .route('/diet')
  .get(auth, meController.getDiet)
  .post(auth, aiLimiter, meController.createDiet)
  .put(auth, aiLimiter, meController.createDiet)
  .delete(auth, meController.deleteDiet);

router
  .route('/chatbot/chats')
  .get(auth, chatController.getAllChats)
  .post(auth, chatController.createChat);

router
  .route('/chatbot/chats/:chatId')
  .get(auth, chatController.getChat)
  .put(auth, chatController.updateChat)
  .patch(auth, chatController.updateChat)
  .delete(auth, chatController.deleteChat);

module.exports = router;
