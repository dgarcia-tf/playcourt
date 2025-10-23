const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createLeague,
  getLeagueOverview,
  listLeagues,
  getLeagueDetail,
  listLeagueEnrollments,
  updateLeague,
  deleteLeague,
  addLeaguePaymentRecord,
  updateLeaguePaymentRecord,
  uploadLeaguePoster,
} = require('../controllers/leagueController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { LEAGUE_STATUS } = require('../models/League');
const { CATEGORY_STATUSES } = require('../models/Category');
const { GENDERS } = require('../models/User');
const { leaguePosterUpload } = require('../middleware/upload');

const router = express.Router();

router.get(
  '/overview',
  authenticate,
  getLeagueOverview
);

router.get(
  '/',
  authenticate,
  [
    query('year').optional().isInt({ min: 2000 }).toInt(),
    query('status').optional().isIn(Object.values(LEAGUE_STATUS)),
    query('includeClosed').optional().isBoolean().toBoolean(),
  ],
  listLeagues
);

router.post(
  '/',
  authenticate,
  authorizeRoles('admin'),
  [
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('year').optional().isInt({ min: 2000 }).withMessage('Año inválido'),
    body('description').optional().isString(),
    body('poster').optional({ nullable: true }).isString(),
    body('startDate').optional().isISO8601().toDate(),
    body('endDate').optional().isISO8601().toDate(),
    body('registrationCloseDate').optional({ nullable: true }).isISO8601().toDate(),
    body('enrollmentFee')
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage('La tarifa debe ser un número positivo')
      .toFloat(),
    body('status').optional().isIn(Object.values(LEAGUE_STATUS)),
    body('categories').optional().isArray(),
    body('categories.*').optional().isMongoId(),
    body('newCategories').optional().isArray(),
    body('newCategories.*.name').optional().isString().trim().notEmpty(),
    body('newCategories.*.description').optional({ nullable: true }).isString(),
    body('newCategories.*.skillLevel').optional({ nullable: true }).isString(),
    body('newCategories.*.gender')
      .optional()
      .isIn(Object.values(GENDERS)),
    body('newCategories.*.status')
      .optional()
      .isIn(Object.values(CATEGORY_STATUSES)),
  ],
  createLeague
);

router.get(
  '/:leagueId',
  authenticate,
  [param('leagueId').isMongoId()],
  getLeagueDetail
);

router.get(
  '/:leagueId/enrollments',
  authenticate,
  [param('leagueId').isMongoId()],
  listLeagueEnrollments
);

router.patch(
  '/:leagueId',
  authenticate,
  authorizeRoles('admin'),
  [
    param('leagueId').isMongoId(),
    body('name').optional().isString().trim().isLength({ min: 3 }),
    body('year').optional().isInt({ min: 2000 }).toInt(),
    body('description').optional({ nullable: true }).isString(),
    body('poster').optional({ nullable: true }).isString(),
    body('startDate')
      .optional({ nullable: true })
      .custom((value) => value === null || value === '' || !Number.isNaN(Date.parse(value)))
      .withMessage('Fecha de inicio inválida')
      .customSanitizer((value) => (value === '' ? null : value))
      .customSanitizer((value) => (value ? new Date(value) : value)),
    body('endDate')
      .optional({ nullable: true })
      .custom((value) => value === null || value === '' || !Number.isNaN(Date.parse(value)))
      .withMessage('Fecha de cierre inválida')
      .customSanitizer((value) => (value === '' ? null : value))
      .customSanitizer((value) => (value ? new Date(value) : value)),
    body('registrationCloseDate')
      .optional({ nullable: true })
      .custom((value) => value === null || value === '' || !Number.isNaN(Date.parse(value)))
      .withMessage('Fecha límite de inscripción inválida')
      .customSanitizer((value) => (value === '' ? null : value))
      .customSanitizer((value) => (value ? new Date(value) : value)),
    body('enrollmentFee')
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage('La tarifa debe ser un número positivo')
      .toFloat(),
    body('status').optional().isIn(Object.values(LEAGUE_STATUS)),
    body('categories').optional().isArray(),
    body('categories.*').optional().isMongoId(),
  ],
  updateLeague
);

router.post(
  '/:leagueId/poster',
  authenticate,
  authorizeRoles('admin'),
  [param('leagueId').isMongoId()],
  leaguePosterUpload.single('poster'),
  uploadLeaguePoster
);

router.delete(
  '/:leagueId',
  authenticate,
  authorizeRoles('admin'),
  [param('leagueId').isMongoId()],
  deleteLeague
);

router.post(
  '/:leagueId/payments',
  authenticate,
  authorizeRoles('admin'),
  [
    param('leagueId').isMongoId(),
    body('user').optional({ nullable: true }).isMongoId(),
    body('amount').optional({ nullable: true }).isFloat({ min: 0 }),
    body('status').optional().isIn(['pendiente', 'pagado', 'exento', 'fallido']),
    body('method').optional({ nullable: true }).isString(),
    body('reference').optional({ nullable: true }).isString(),
    body('notes').optional({ nullable: true }).isString(),
    body('paidAt').optional({ nullable: true }).isISO8601().toDate(),
  ],
  addLeaguePaymentRecord
);

router.patch(
  '/:leagueId/payments/:paymentId',
  authenticate,
  authorizeRoles('admin'),
  [
    param('leagueId').isMongoId(),
    param('paymentId').isMongoId(),
    body('user').optional({ nullable: true }).isMongoId(),
    body('amount').optional({ nullable: true }).isFloat({ min: 0 }),
    body('status').optional().isIn(['pendiente', 'pagado', 'exento', 'fallido']),
    body('method').optional({ nullable: true }).isString(),
    body('reference').optional({ nullable: true }).isString(),
    body('notes').optional({ nullable: true }).isString(),
    body('paidAt').optional({ nullable: true }).isISO8601().toDate(),
  ],
  updateLeaguePaymentRecord
);

module.exports = router;
