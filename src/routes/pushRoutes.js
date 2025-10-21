const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getPushConfig,
  registerSubscription,
  unregisterSubscription,
  registerSubscriptionValidators,
  unregisterSubscriptionValidators,
} = require('../controllers/pushSubscriptionController');

const router = express.Router();

router.get('/config', authenticate, getPushConfig);
router.post('/subscriptions', authenticate, registerSubscriptionValidators, registerSubscription);
router.delete('/subscriptions', authenticate, unregisterSubscriptionValidators, unregisterSubscription);

module.exports = router;
