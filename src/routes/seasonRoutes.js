const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createSeason,
  listSeasons,
  getSeasonDetail,
  addCategoryToSeason,
  updateSeason,
  deleteSeason,
} = require('../controllers/seasonController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, [query('year').optional().isInt({ min: 2000 }).toInt()], listSeasons);

router.post(
  '/',
  authenticate,
  authorizeRoles('admin'),
  [
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('year').isInt({ min: 2000 }).withMessage('El año es obligatorio'),
    body('description').optional().isString(),
    body('startDate').optional().isISO8601().toDate(),
    body('endDate').optional().isISO8601().toDate(),
    body('categories').optional().isArray(),
    body('categories.*').optional().isMongoId(),
  ],
  createSeason
);

router.get(
  '/:seasonId',
  authenticate,
  [param('seasonId').isMongoId()],
  getSeasonDetail
);

router.post(
  '/:seasonId/categories',
  authenticate,
  authorizeRoles('admin'),
  [param('seasonId').isMongoId(), body('categoryId').isMongoId()],
  addCategoryToSeason
);

router.patch(
  '/:seasonId',
  authenticate,
  authorizeRoles('admin'),
  [
    param('seasonId').isMongoId(),
    body('name').optional().isString().trim().isLength({ min: 3 }),
    body('year').optional().isInt({ min: 2000 }).toInt(),
    body('description').optional().isString().trim().isLength({ max: 500 }),
    body('startDate').optional({ checkFalsy: true }).isISO8601().toDate(),
    body('endDate').optional({ checkFalsy: true }).isISO8601().toDate(),
    body('categories').optional().isArray(),
    body('categories.*').optional().isMongoId(),
  ],
  updateSeason
);

router.delete(
  '/:seasonId',
  authenticate,
  authorizeRoles('admin'),
  [param('seasonId').isMongoId()],
  deleteSeason
);

module.exports = router;
