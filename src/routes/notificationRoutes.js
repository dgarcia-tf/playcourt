const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createNotification,
  listNotifications,
  listMyNotifications,
  updateNotificationStatus,
  acknowledgeMyNotification,
} = require('../controllers/notificationController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { validateAttachmentPayload } = require('../utils/attachments');

const router = express.Router();

router.get(
  '/mine',
  authenticate,
  [
    query('status').optional().isIn(['pendiente', 'enviado', 'cancelado']),
    query('upcoming').optional().isBoolean().toBoolean(),
  ],
  listMyNotifications
);

router.get(
  '/',
  authenticate,
  authorizeRoles('admin'),
  [
    query('status').optional().isIn(['pendiente', 'enviado', 'cancelado']),
    query('matchId').optional().isMongoId(),
    query('upcoming').optional().isBoolean().toBoolean(),
  ],
  listNotifications
);

router.post(
  '/',
  authenticate,
  authorizeRoles('admin'),
  [
    body('title').notEmpty().withMessage('El título es obligatorio'),
    body('message').optional().isString().withMessage('El mensaje debe ser un texto válido'),
    body('richMessage')
      .optional()
      .isString()
      .withMessage('El contenido enriquecido debe ser un texto válido'),
    body('attachments').optional().isArray(),
    body('attachments.*.url')
      .optional()
      .isURL({ require_protocol: true })
      .withMessage('Cada adjunto debe incluir una URL válida'),
    body('attachments.*.description')
      .optional()
      .isString()
      .withMessage('La descripción del adjunto debe ser texto'),
    body('attachments.*.type')
      .optional()
      .isIn(['image', 'video', 'file', 'link'])
      .withMessage('El tipo de adjunto no es válido'),
    body('channel').optional().isIn(['app', 'email', 'sms', 'push']),
    body('scheduledFor').optional().isISO8601().toDate(),
    body('recipients').optional().isArray(),
    body('recipients.*').optional().isMongoId(),
    body('matchId').optional().isMongoId(),
    body('metadata').optional().isObject(),
  ],
  createNotification
);

router.patch(
  '/:notificationId/status',
  authenticate,
  authorizeRoles('admin'),
  [
    param('notificationId').isMongoId(),
    body('status').isIn(['pendiente', 'enviado', 'cancelado']),
    body('scheduledFor').optional().isISO8601().toDate(),
    body('sentAt').optional().isISO8601().toDate(),
  ],
  updateNotificationStatus
);

router.delete(
  '/mine/:notificationId',
  authenticate,
  [param('notificationId').isMongoId()],
  acknowledgeMyNotification
);

module.exports = router;
