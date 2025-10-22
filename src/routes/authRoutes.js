const express = require('express');
const { body } = require('express-validator');
const { register, login, getSetupStatus, getProfile, updateProfile } = require('../controllers/authController');
const { GENDERS, USER_ROLES, PREFERRED_SCHEDULES, normalizePreferredSchedule } = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { isValidImageDataUrl, sanitizeBoolean } = require('../utils/validators');

const router = express.Router();

router.post(
  '/register',
  [
    body('fullName').notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('Correo electrónico inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('gender').isIn(Object.values(GENDERS)).withMessage('Género inválido'),
    body('birthDate')
      .isISO8601()
      .withMessage('La fecha de nacimiento es obligatoria y debe ser válida')
      .toDate(),
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
    body('role').optional().isIn(Object.values(USER_ROLES)).withMessage('Rol inválido'),
    body('roles')
      .optional()
      .custom((value) => {
        const values = Array.isArray(value) ? value : [value];
        return values.every((item) => Object.values(USER_ROLES).includes(item));
      })
      .withMessage('Roles inválidos'),
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
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Correo electrónico inválido'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  ],
  login
);

router.get('/setup-status', getSetupStatus);

router.get('/me', authenticate, getProfile);

router.patch(
  '/me',
  authenticate,
  [
    body('fullName').optional().trim().isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
    body('email').optional().isEmail().withMessage('Correo electrónico inválido'),
    body('gender').optional().isIn(Object.values(GENDERS)).withMessage('Género inválido'),
    body('birthDate')
      .optional()
      .isISO8601()
      .withMessage('La fecha de nacimiento es inválida')
      .toDate(),
    body('phone').optional().trim().isLength({ min: 7 }).withMessage('El teléfono es obligatorio'),
    body('photo')
      .optional({ checkFalsy: true })
      .custom((value) => isValidImageDataUrl(value))
      .withMessage('La fotografía debe ser una imagen en Base64 válida (data URL) de hasta 2 MB.'),
    body('preferredSchedule')
      .optional()
      .customSanitizer((value) => normalizePreferredSchedule(value))
      .isIn(Object.values(PREFERRED_SCHEDULES))
      .withMessage('Horario preferido inválido'),
    body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Las notas son demasiado largas'),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres'),
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
  updateProfile
);

module.exports = router;
