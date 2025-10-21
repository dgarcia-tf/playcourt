const express = require('express');
const { body } = require('express-validator');
const { listGeneralMessages, publishNotice } = require('../controllers/chatController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { validateAttachmentPayload } = require('../utils/attachments');

const router = express.Router();

router.use(authenticate);

router.get('/general', listGeneralMessages);

router.post(
  '/general',
  authorizeRoles('admin'),
  [
    body('content').optional().isString().trim().isLength({ max: 2000 }),
    body('richContent').optional().isString().isLength({ max: 12000 }),
    body('attachments')
      .optional()
      .custom((value) => {
        if (value === undefined) return true;
        if (!Array.isArray(value)) {
          throw new Error('Los adjuntos deben enviarse como una lista.');
        }
        if (value.length > 5) {
          throw new Error('No puedes adjuntar más de 5 archivos por aviso.');
        }
        return true;
      }),
    body('attachments.*').optional().custom(validateAttachmentPayload),
  ],
  publishNotice
);

module.exports = router;
