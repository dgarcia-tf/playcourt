const express = require('express');
const { getAccountSummary } = require('../controllers/accountController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', authenticate, getAccountSummary);

module.exports = router;
