const express = require('express');
const { authenticate } = require('../middleware/auth');
const { streamUpdates } = require('../controllers/liveUpdateController');

const router = express.Router();

router.get('/stream', authenticate, streamUpdates);

module.exports = router;
