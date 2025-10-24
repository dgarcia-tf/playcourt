const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createTournament,
  listTournaments,
  getTournamentDetail,
  updateTournament,
  deleteTournament,
  addMaterialRecord,
  updateMaterialRecord,
  removeMaterialRecord,
  addPaymentRecord,
  updatePaymentRecord,
  uploadTournamentPoster,
} = require('../controllers/tournamentController');
const {
  createTournamentCategory,
  listTournamentCategories,
  getTournamentCategory,
  updateTournamentCategory,
  deleteTournamentCategory,
  configureTournamentDraw,
  assignTournamentSeeds,
} = require('../controllers/tournamentCategoryController');
const {
  createTournamentEnrollment,
  listTournamentPlayers,
  listTournamentDoublesPlayers,
  listTournamentEnrollments,
  createTournamentDoublesPair,
  deleteTournamentDoublesPair,
  updateEnrollmentStatus,
  removeTournamentEnrollment,
} = require('../controllers/tournamentEnrollmentController');
const {
  listTournamentMatches,
  generateTournamentMatches,
  autoGenerateTournamentBracket,
  recalculateTournamentBracket,
  updateTournamentMatch,
  confirmTournamentMatch,
  rejectTournamentMatch,
  submitTournamentMatchResult,
  approveTournamentMatchResult,
  resetTournamentMatchResult,
} = require('../controllers/tournamentMatchController');
const { authenticate, authenticateOptional, authorizeRoles } = require('../middleware/auth');
const { TOURNAMENT_STATUS } = require('../models/Tournament');
const { GENDERS } = require('../models/User');
const {
  TOURNAMENT_CATEGORY_MATCH_TYPES,
  TOURNAMENT_CATEGORY_MATCH_FORMATS,
} = require('../models/TournamentCategory');
const { tournamentPosterUpload } = require('../middleware/upload');
const { CATEGORY_COLOR_PALETTE, isValidCategoryColor, normalizeHexColor } = require('../utils/colors');

const router = express.Router();

router.get(
  '/',
  authenticateOptional,
  [query('status').optional().isIn(Object.values(TOURNAMENT_STATUS))],
  listTournaments
);

router.get(
  '/:tournamentId',
  authenticateOptional,
  [param('tournamentId').isMongoId()],
  getTournamentDetail
);

router.get(
  '/:tournamentId/categories',
  authenticateOptional,
  [param('tournamentId').isMongoId()],
  listTournamentCategories
);

router.get(
  '/:tournamentId/categories/:categoryId',
  authenticateOptional,
  [param('tournamentId').isMongoId(), param('categoryId').isMongoId()],
  getTournamentCategory
);

router.get(
  '/:tournamentId/categories/:categoryId/matches',
  authenticateOptional,
  [param('tournamentId').isMongoId(), param('categoryId').isMongoId()],
  listTournamentMatches
);

router.get(
  '/:tournamentId/doubles',
  authenticateOptional,
  [param('tournamentId').isMongoId()],
  listTournamentDoublesPlayers
);

router.use(authenticate);

router.post(
  '/:tournamentId/categories/:categoryId/doubles-pairs',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    param('categoryId').isMongoId(),
    body('players').isArray({ min: 2, max: 2 }),
    body('players.*').isMongoId(),
  ],
  createTournamentDoublesPair
);

router.delete(
  '/:tournamentId/categories/:categoryId/doubles-pairs/:pairId',
  authorizeRoles('admin'),
  [param('tournamentId').isMongoId(), param('categoryId').isMongoId(), param('pairId').isMongoId()],
  deleteTournamentDoublesPair
);

router.post(
  '/',
  authorizeRoles('admin'),
  [
    body('name').trim().notEmpty(),
    body('description').optional().isString(),
    body('startDate').optional({ nullable: true }).isISO8601().toDate(),
    body('endDate').optional({ nullable: true }).isISO8601().toDate(),
    body('registrationCloseDate').optional({ nullable: true }).isISO8601().toDate(),
    body('poster').optional({ nullable: true }).isString(),
    body('fees').optional().isArray(),
    body('fees.*.label').optional().isString(),
    body('fees.*.amount').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(Object.values(TOURNAMENT_STATUS)),
    body('hasShirt').optional().isBoolean(),
    body('hasGiftBag').optional().isBoolean(),
    body('shirtSizes').optional().isArray(),
    body('shirtSizes.*').optional().isString(),
    body('isPrivate').optional().isBoolean().toBoolean(),
  ],
  createTournament
);

router.post(
  '/:tournamentId/poster',
  authorizeRoles('admin'),
  [param('tournamentId').isMongoId()],
  tournamentPosterUpload.single('poster'),
  uploadTournamentPoster
);

router.patch(
  '/:tournamentId',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    body('name').optional().isString().trim().notEmpty(),
    body('description').optional({ nullable: true }).isString(),
    body('startDate').optional({ nullable: true }).custom((value) => {
      if (value === null) return true;
      return !Number.isNaN(Date.parse(value));
    }),
    body('endDate').optional({ nullable: true }).custom((value) => {
      if (value === null) return true;
      return !Number.isNaN(Date.parse(value));
    }),
    body('registrationCloseDate').optional({ nullable: true }).custom((value) => {
      if (value === null) return true;
      return !Number.isNaN(Date.parse(value));
    }),
    body('poster').optional({ nullable: true }).isString(),
    body('fees').optional().isArray(),
    body('status').optional().isIn(Object.values(TOURNAMENT_STATUS)),
    body('hasShirt').optional().isBoolean(),
    body('hasGiftBag').optional().isBoolean(),
    body('shirtSizes').optional().isArray(),
    body('shirtSizes.*').optional().isString(),
    body('isPrivate').optional().isBoolean().toBoolean(),
  ],
  updateTournament
);

router.delete('/:tournamentId', authorizeRoles('admin'), [param('tournamentId').isMongoId()], deleteTournament);

// Tournament categories
router.post(
  '/:tournamentId/categories',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    body('name').trim().notEmpty(),
    body('description').optional({ nullable: true }).isString(),
    body('gender').isIn(Object.values(GENDERS)),
    body('matchType').isIn(Object.values(TOURNAMENT_CATEGORY_MATCH_TYPES)),
    body('matchFormat').isIn(Object.values(TOURNAMENT_CATEGORY_MATCH_FORMATS)),
    body('menuTitle').optional({ nullable: true }).isString(),
    body('color')
      .optional({ nullable: true })
      .customSanitizer((value) => {
        if (value === null || value === undefined || value === '') {
          return null;
        }
        const normalized = normalizeHexColor(value);
        return isValidCategoryColor(normalized) ? normalized : null;
      })
      .custom((value) => value === null || CATEGORY_COLOR_PALETTE.includes(value))
      .withMessage('Color de categoría inválido'),
    body('drawSize').optional({ nullable: true }).isInt({ min: 0 }),
  ],
  createTournamentCategory
);

router.patch(
  '/:tournamentId/categories/:categoryId',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    param('categoryId').isMongoId(),
    body('name').optional().isString().trim().notEmpty(),
    body('description').optional({ nullable: true }).isString(),
    body('gender').optional().isIn(Object.values(GENDERS)),
    body('matchType').optional().isIn(Object.values(TOURNAMENT_CATEGORY_MATCH_TYPES)),
    body('matchFormat').optional().isIn(Object.values(TOURNAMENT_CATEGORY_MATCH_FORMATS)),
    body('menuTitle').optional({ nullable: true }).isString(),
    body('color')
      .optional({ nullable: true })
      .customSanitizer((value) => {
        if (value === null || value === undefined || value === '') {
          return null;
        }
        const normalized = normalizeHexColor(value);
        return isValidCategoryColor(normalized) ? normalized : null;
      })
      .custom((value) => value === null || CATEGORY_COLOR_PALETTE.includes(value))
      .withMessage('Color de categoría inválido'),
    body('drawSize').optional({ nullable: true }).isInt({ min: 0 }),
  ],
  updateTournamentCategory
);

router.delete(
  '/:tournamentId/categories/:categoryId',
  authorizeRoles('admin'),
  [param('tournamentId').isMongoId(), param('categoryId').isMongoId()],
  deleteTournamentCategory
);

router.post(
  '/:tournamentId/categories/:categoryId/draw',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    param('categoryId').isMongoId(),
    body('rounds').isArray(),
  ],
  configureTournamentDraw
);

router.post(
  '/:tournamentId/categories/:categoryId/seeds',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    param('categoryId').isMongoId(),
    body('seeds').isArray(),
    body('seeds.*.player').isMongoId(),
    body('seeds.*.seedNumber').isInt({ min: 1 }),
  ],
  assignTournamentSeeds
);

router.post(
  '/:tournamentId/categories/:categoryId/brackets/auto',
  authorizeRoles('admin'),
  [param('tournamentId').isMongoId(), param('categoryId').isMongoId()],
  autoGenerateTournamentBracket
);

router.post(
  '/:tournamentId/categories/:categoryId/brackets/recalculate',
  authorizeRoles('admin'),
  [param('tournamentId').isMongoId(), param('categoryId').isMongoId()],
  recalculateTournamentBracket
);

// Enrollments
router.get('/:tournamentId/enrollments', [param('tournamentId').isMongoId()], listTournamentPlayers);
router.get(
  '/:tournamentId/categories/:categoryId/enrollments',
  [param('tournamentId').isMongoId(), param('categoryId').isMongoId()],
  listTournamentEnrollments
);

router.post(
  '/:tournamentId/categories/:categoryId/enrollments',
  [
    param('tournamentId').isMongoId(),
    param('categoryId').isMongoId(),
    body('userId').optional({ nullable: true }).isMongoId(),
    body('shirtSize').optional({ nullable: true }).isString(),
  ],
  createTournamentEnrollment
);

router.patch(
  '/:tournamentId/categories/:categoryId/enrollments/:enrollmentId',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    param('categoryId').isMongoId(),
    param('enrollmentId').isMongoId(),
    body('status').optional().isString().notEmpty(),
    body('shirtSize').optional({ nullable: true }).isString(),
  ],
  updateEnrollmentStatus
);

router.delete(
  '/:tournamentId/categories/:categoryId/enrollments/:enrollmentId',
  authorizeRoles('admin'),
  [param('tournamentId').isMongoId(), param('categoryId').isMongoId(), param('enrollmentId').isMongoId()],
  removeTournamentEnrollment
);

// Matches
router.post(
  '/:tournamentId/categories/:categoryId/matches/generate',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    param('categoryId').isMongoId(),
    body('matches').isArray({ min: 1 }),
    body('replaceExisting').optional().isBoolean(),
  ],
  generateTournamentMatches
);

router.patch(
  '/:tournamentId/categories/:categoryId/matches/:matchId',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    param('categoryId').isMongoId(),
    param('matchId').isMongoId(),
    body('notifyPlayers').optional().isBoolean(),
  ],
  updateTournamentMatch
);

router.post(
  '/:tournamentId/categories/:categoryId/matches/:matchId/result',
  [
    param('tournamentId').isMongoId(),
    param('categoryId').isMongoId(),
    param('matchId').isMongoId(),
    body('winner').isMongoId(),
    body('score').optional({ nullable: true }).isString(),
    body('notes').optional({ nullable: true }).isString(),
  ],
  submitTournamentMatchResult
);

router.post(
  '/:tournamentId/categories/:categoryId/matches/:matchId/result/approve',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    param('categoryId').isMongoId(),
    param('matchId').isMongoId(),
    body('winner').optional({ nullable: true }).isMongoId(),
    body('score').optional({ nullable: true }).isString(),
    body('notes').optional({ nullable: true }).isString(),
  ],
  approveTournamentMatchResult
);

router.post(
  '/:tournamentId/categories/:categoryId/matches/:matchId/result/reset',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    param('categoryId').isMongoId(),
    param('matchId').isMongoId(),
    body('reason').optional({ nullable: true }).isString(),
  ],
  resetTournamentMatchResult
);

router.post(
  '/:tournamentId/categories/:categoryId/matches/:matchId/confirm',
  [param('tournamentId').isMongoId(), param('categoryId').isMongoId(), param('matchId').isMongoId()],
  confirmTournamentMatch
);

router.post(
  '/:tournamentId/categories/:categoryId/matches/:matchId/reject',
  [param('tournamentId').isMongoId(), param('categoryId').isMongoId(), param('matchId').isMongoId()],
  rejectTournamentMatch
);

// Administration helpers
router.post(
  '/:tournamentId/materials',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    body('name').isString().trim().notEmpty(),
    body('description').optional({ nullable: true }).isString(),
    body('assignedTo').optional({ nullable: true }).isMongoId(),
    body('delivered').optional().isBoolean(),
    body('deliveredAt').optional({ nullable: true }).isISO8601().toDate(),
    body('notes').optional({ nullable: true }).isString(),
  ],
  addMaterialRecord
);

router.patch(
  '/:tournamentId/materials/:materialId',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    param('materialId').isMongoId(),
    body('name').optional().isString(),
    body('description').optional({ nullable: true }).isString(),
    body('assignedTo').optional({ nullable: true }).isMongoId(),
    body('delivered').optional().isBoolean(),
    body('deliveredAt').optional({ nullable: true }).isISO8601().toDate(),
    body('notes').optional({ nullable: true }).isString(),
  ],
  updateMaterialRecord
);

router.delete(
  '/:tournamentId/materials/:materialId',
  authorizeRoles('admin'),
  [param('tournamentId').isMongoId(), param('materialId').isMongoId()],
  removeMaterialRecord
);

router.post(
  '/:tournamentId/payments',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    body('user').optional({ nullable: true }).isMongoId(),
    body('amount').optional({ nullable: true }).isFloat({ min: 0 }),
    body('status').optional().isIn(['pendiente', 'pagado', 'exento', 'fallido']),
    body('method').optional({ nullable: true }).isString(),
    body('reference').optional({ nullable: true }).isString(),
    body('notes').optional({ nullable: true }).isString(),
    body('paidAt').optional({ nullable: true }).isISO8601().toDate(),
  ],
  addPaymentRecord
);

router.patch(
  '/:tournamentId/payments/:paymentId',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    param('paymentId').isMongoId(),
    body('user').optional({ nullable: true }).isMongoId(),
    body('amount').optional({ nullable: true }).isFloat({ min: 0 }),
    body('status').optional().isIn(['pendiente', 'pagado', 'exento', 'fallido']),
    body('method').optional({ nullable: true }).isString(),
    body('reference').optional({ nullable: true }).isString(),
    body('notes').optional({ nullable: true }).isString(),
    body('paidAt').optional({ nullable: true }).isISO8601().toDate(),
  ],
  updatePaymentRecord
);

module.exports = router;
