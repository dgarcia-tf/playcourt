const express = require('express');
const { body, param, query } = require('express-validator');
const {
  listPlayers,
  createPlayer,
  createDemoPlayers,
  updatePlayer,
  deletePlayer,
  USER_ROLES,
  GENDERS,
} = require('../controllers/playerController');
const { PREFERRED_SCHEDULES, SHIRT_SIZES, normalizePreferredSchedule } = require('../models/User');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { isValidImageDataUrl, sanitizeBoolean } = require('../utils/validators');

const router = express.Router();

router.use(authenticate, authorizeRoles('admin'));

router.post('/demo', createDemoPlayers);

router.get(
  '/',
  [
    query('role').optional().isIn(Object.values(USER_ROLES)),
    query('search').optional().isString().trim().isLength({ min: 1 }),
  ],
  listPlayers
);

router.post(
  '/',
  [
    body('fullName').trim().notEmpty().withMessage('El nombre completo es obligatorio'),
    body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('gender').isIn(Object.values(GENDERS)).withMessage('Género inválido'),
    body('birthDate')
      .isISO8601()
      .withMessage('La fecha de nacimiento es obligatoria y debe ser válida')
      .toDate(),
    body('role').optional().isIn(Object.values(USER_ROLES)).withMessage('Rol inválido'),
    body('roles')
      .optional()
      .custom((value) => {
        const values = Array.isArray(value) ? value : [value];
        return values.every((item) => Object.values(USER_ROLES).includes(item));
      })
      .withMessage('Roles inválidos'),
    body('phone').trim().isLength({ min: 7 }).withMessage('El teléfono es obligatorio'),
    body('photo')
      .optional({ checkFalsy: true })
      .custom((value) => isValidImageDataUrl(value))
      .withMessage('La fotografía debe ser una imagen en Base64 válida (data URL) de hasta 2 MB.'),
    body('preferredSchedule')
      .optional()
      .customSanitizer((value) => normalizePreferredSchedule(value))
      .isIn(Object.values(PREFERRED_SCHEDULES))
      .withMessage('Horario preferido inválido'),
    body('notes').optional().isString().trim().isLength({ max: 500 }),
    body('shirtSize')
      .trim()
      .notEmpty()
      .withMessage('La talla de camiseta es obligatoria')
      .bail()
      .isIn(Object.values(SHIRT_SIZES))
      .withMessage('Talla de camiseta inválida'),
    body('isMember')
      .optional()
      .customSanitizer(sanitizeBoolean)
      .custom((value) => typeof value === 'boolean')
      .withMessage('El indicador de socio es inválido'),
    body('membershipNumber')
      .optional()
      .isString()
      .withMessage('El número de socio debe ser un texto')
      .bail()
      .trim()
      .isLength({ max: 50 })
      .withMessage('El número de socio es demasiado largo')
      .custom((value, { req }) => {
        if (req.body.isMember && !value) {
          throw new Error('El número de socio es obligatorio para socios');
        }
        return true;
      }),
    body('membershipNumberVerified')
      .optional()
      .customSanitizer(sanitizeBoolean)
      .custom((value) => typeof value === 'boolean')
      .withMessage('El estado de validación del número de socio es inválido'),
    body('notifyMatchRequests')
      .optional()
      .customSanitizer(sanitizeBoolean)
      .custom((value) => typeof value === 'boolean')
      .withMessage('Preferencia de notificación inválida'),
    body('notifyMatchResults')
      .optional()
      .customSanitizer(sanitizeBoolean)
      .custom((value) => typeof value === 'boolean')
      .withMessage('Preferencia de notificación inválida'),
  ],
  createPlayer
);

router.patch(
  '/:playerId',
  [
    param('playerId').isMongoId(),
    body('fullName').optional().trim().isLength({ min: 3 }),
    body('email').optional().isEmail().withMessage('Correo inválido').normalizeEmail(),
    body('gender').optional().isIn(Object.values(GENDERS)).withMessage('Género inválido'),
    body('birthDate')
      .optional()
      .isISO8601()
      .withMessage('La fecha de nacimiento es inválida')
      .toDate(),
    body('role').optional().isIn(Object.values(USER_ROLES)).withMessage('Rol inválido'),
    body('roles')
      .optional()
      .custom((value) => {
        const values = Array.isArray(value) ? value : [value];
        return values.every((item) => Object.values(USER_ROLES).includes(item));
      })
      .withMessage('Roles inválidos'),
    body('password').optional().isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('phone').optional().trim().isLength({ min: 7 }).withMessage('El teléfono debe tener al menos 7 caracteres'),
    body('photo')
      .optional({ checkFalsy: true })
      .custom((value) => isValidImageDataUrl(value))
      .withMessage('La fotografía debe ser una imagen en Base64 válida (data URL) de hasta 2 MB.'),
    body('preferredSchedule')
      .optional()
      .customSanitizer((value) => normalizePreferredSchedule(value))
      .isIn(Object.values(PREFERRED_SCHEDULES))
      .withMessage('Horario preferido inválido'),
    body('notes').optional().isString().trim().isLength({ max: 500 }),
    body('shirtSize')
      .optional({ checkFalsy: true })
      .trim()
      .isIn(Object.values(SHIRT_SIZES))
      .withMessage('Talla de camiseta inválida'),
    body('isMember')
      .optional()
      .customSanitizer(sanitizeBoolean)
      .custom((value) => typeof value === 'boolean')
      .withMessage('El indicador de socio es inválido'),
    body('membershipNumber')
      .optional()
      .isString()
      .withMessage('El número de socio debe ser un texto')
      .bail()
      .trim()
      .isLength({ max: 50 })
      .withMessage('El número de socio es demasiado largo')
      .custom((value, { req }) => {
        if (req.body.isMember && !value) {
          throw new Error('El número de socio es obligatorio para socios');
        }
        return true;
      }),
    body('membershipNumberVerified')
      .optional()
      .customSanitizer(sanitizeBoolean)
      .custom((value) => typeof value === 'boolean')
      .withMessage('El estado de validación del número de socio es inválido'),
    body('notifyMatchRequests')
      .optional()
      .customSanitizer(sanitizeBoolean)
      .custom((value) => typeof value === 'boolean')
      .withMessage('Preferencia de notificación inválida'),
    body('notifyMatchResults')
      .optional()
      .customSanitizer(sanitizeBoolean)
      .custom((value) => typeof value === 'boolean')
      .withMessage('Preferencia de notificación inválida'),
  ],
  updatePlayer
);

router.delete('/:playerId', [param('playerId').isMongoId()], deletePlayer);

module.exports = router;
