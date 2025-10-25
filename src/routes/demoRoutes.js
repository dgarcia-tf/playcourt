const express = require('express');
const { body } = require('express-validator');
const { activateDemoMode } = require('../controllers/demoController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { sanitizeBoolean } = require('../utils/validators');

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorizeRoles('admin'),
  [body('confirm').optional().customSanitizer(sanitizeBoolean)],
  activateDemoMode
);

module.exports = router;
