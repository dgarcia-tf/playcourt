const express = require('express');
const { body, param } = require('express-validator');
const {
  createCategory,
  listCategories,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { enrollPlayer, listEnrollments, removeEnrollment } = require('../controllers/enrollmentController');
const {
  requestEnrollment,
  listEnrollmentRequests,
  updateEnrollmentRequest,
} = require('../controllers/enrollmentRequestController');
const { generateCategoryMatches } = require('../controllers/matchController');
const { getCategoryRanking } = require('../controllers/rankingController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { GENDERS } = require('../models/User');
const { CATEGORY_STATUSES, CATEGORY_SKILL_LEVELS, MATCH_FORMATS } = require('../models/Category');
const { HEX_COLOR_REGEX, normalizeHexColor } = require('../utils/colors');

const router = express.Router();

router.get('/', authenticate, listCategories);

router.post(
  '/',
  authenticate,
  authorizeRoles('admin'),
  [
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('gender').isIn(Object.values(GENDERS)).withMessage('Género inválido'),
    body('skillLevel')
      .isIn(Object.values(CATEGORY_SKILL_LEVELS))
      .withMessage('Nivel de categoría inválido'),
    body('startDate').optional().isISO8601().toDate(),
    body('endDate').optional().isISO8601().toDate(),
    body('status')
      .optional()
      .isIn(Object.values(CATEGORY_STATUSES))
      .withMessage('Estado de la categoría inválido'),
    body('matchFormat')
      .optional({ nullable: true })
      .customSanitizer((value) => (value === '' ? null : value))
      .custom((value) => value === null || Object.values(MATCH_FORMATS).includes(value))
      .withMessage('Formato de partido inválido'),
    body('minimumAge')
      .customSanitizer((value) => (value === '' ? null : value))
      .optional({ nullable: true })
      .isInt({ min: 0, max: 120 })
      .withMessage('La edad mínima debe ser un número entero igual o mayor a 0')
      .toInt(),
    body('color')
      .optional({ nullable: true })
      .customSanitizer((value) => {
        if (value === null || value === undefined || value === '') {
          return null;
        }
        const normalized = normalizeHexColor(value);
        return normalized || null;
      })
      .custom((value) => value === null || HEX_COLOR_REGEX.test(value))
      .withMessage('Color de la categoría inválido'),
    body('leagueId').isMongoId().withMessage('Liga inválida'),
  ],
  createCategory
);

router.patch(
  '/:categoryId',
  authenticate,
  authorizeRoles('admin'),
  [
    param('categoryId').isMongoId(),
    body('name').optional().trim().isLength({ min: 3 }),
    body('description').optional({ nullable: true }).isString(),
    body('gender').optional().isIn(Object.values(GENDERS)).withMessage('Género inválido'),
    body('skillLevel')
      .optional()
      .isIn(Object.values(CATEGORY_SKILL_LEVELS))
      .withMessage('Nivel de categoría inválido'),
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
    body('status')
      .optional()
      .isIn(Object.values(CATEGORY_STATUSES))
      .withMessage('Estado de la categoría inválido'),
    body('matchFormat')
      .optional({ nullable: true })
      .customSanitizer((value) => (value === '' ? null : value))
      .custom((value) => value === null || Object.values(MATCH_FORMATS).includes(value))
      .withMessage('Formato de partido inválido'),
    body('minimumAge')
      .customSanitizer((value) => (value === '' ? null : value))
      .optional({ nullable: true })
      .isInt({ min: 0, max: 120 })
      .withMessage('La edad mínima debe ser un número entero igual o mayor a 0')
      .toInt(),
    body('color')
      .optional({ nullable: true })
      .customSanitizer((value) => {
        if (value === null || value === undefined || value === '') {
          return null;
        }
        const normalized = normalizeHexColor(value);
        return normalized || null;
      })
      .custom((value) => value === null || HEX_COLOR_REGEX.test(value))
      .withMessage('Color de la categoría inválido'),
    body('leagueId').optional().isMongoId().withMessage('Liga inválida'),
  ],
  updateCategory
);

router.delete(
  '/:categoryId',
  authenticate,
  authorizeRoles('admin'),
  [param('categoryId').isMongoId()],
  deleteCategory
);

router.post(
  '/enroll',
  authenticate,
  authorizeRoles('admin'),
  [
    body('categoryId').isMongoId().withMessage('Categoría inválida'),
    body('userId').optional().isMongoId(),
  ],
  enrollPlayer
);

router.post(
  '/:categoryId/enrollment-requests',
  authenticate,
  [param('categoryId').isMongoId()],
  requestEnrollment
);

router.get(
  '/:categoryId/enrollment-requests',
  authenticate,
  authorizeRoles('admin'),
  [param('categoryId').isMongoId()],
  listEnrollmentRequests
);

router.patch(
  '/:categoryId/enrollment-requests/:requestId',
  authenticate,
  authorizeRoles('admin'),
  [
    param('categoryId').isMongoId(),
    param('requestId').isMongoId(),
    body('action')
      .isIn(['approve', 'reject'])
      .withMessage('Acción inválida para la solicitud de inscripción'),
  ],
  updateEnrollmentRequest
);

router.get(
  '/:categoryId/enrollments',
  authenticate,
  [param('categoryId').isMongoId()],
  listEnrollments
);

router.delete(
  '/:categoryId/enrollments/:enrollmentId',
  authenticate,
  authorizeRoles('admin'),
  [param('categoryId').isMongoId(), param('enrollmentId').isMongoId()],
  removeEnrollment
);

router.post(
  '/:categoryId/generate-matches',
  authenticate,
  authorizeRoles('admin'),
  [param('categoryId').isMongoId()],
  generateCategoryMatches
);

router.get(
  '/:categoryId/ranking',
  authenticate,
  [param('categoryId').isMongoId()],
  getCategoryRanking
);

module.exports = router;
