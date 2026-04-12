const express = require('express');
const router = express.Router();

const faceController = require('../controllers/face.controller');

router.post('/register', faceController.registerFace);

router.post('/train', faceController.trainFace);

router.get('/login', faceController.faceLogin);

module.exports = router;
