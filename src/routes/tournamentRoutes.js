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
  listTournamentEnrollments,
  updateEnrollmentStatus,
  removeTournamentEnrollment,
} = require('../controllers/tournamentEnrollmentController');
const {
  listTournamentMatches,
  generateTournamentMatches,
  updateTournamentMatch,
  confirmTournamentMatch,
  rejectTournamentMatch,
} = require('../controllers/tournamentMatchController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { TOURNAMENT_STATUS } = require('../models/Tournament');
const { GENDERS } = require('../models/User');
const { CATEGORY_SKILL_LEVELS } = require('../models/Category');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  [query('status').optional().isIn(Object.values(TOURNAMENT_STATUS))],
  listTournaments
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
  ],
  createTournament
);

router.get('/:tournamentId', [param('tournamentId').isMongoId()], getTournamentDetail);

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
  ],
  updateTournament
);

router.delete('/:tournamentId', authorizeRoles('admin'), [param('tournamentId').isMongoId()], deleteTournament);

// Tournament categories
router.get(
  '/:tournamentId/categories',
  [param('tournamentId').isMongoId()],
  listTournamentCategories
);

router.post(
  '/:tournamentId/categories',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    body('name').trim().notEmpty(),
    body('description').optional({ nullable: true }).isString(),
    body('gender').isIn(Object.values(GENDERS)),
    body('skillLevel').optional().isIn(Object.values(CATEGORY_SKILL_LEVELS)),
    body('menuTitle').optional({ nullable: true }).isString(),
    body('color').optional({ nullable: true }).isString(),
    body('drawSize').optional({ nullable: true }).isInt({ min: 0 }),
  ],
  createTournamentCategory
);

router.get(
  '/:tournamentId/categories/:categoryId',
  [param('tournamentId').isMongoId(), param('categoryId').isMongoId()],
  getTournamentCategory
);

router.patch(
  '/:tournamentId/categories/:categoryId',
  authorizeRoles('admin'),
  [
    param('tournamentId').isMongoId(),
    param('categoryId').isMongoId(),
    body('name').optional().isString().trim().notEmpty(),
    body('description').optional({ nullable: true }).isString(),
    body('skillLevel').optional().isIn(Object.values(CATEGORY_SKILL_LEVELS)),
    body('menuTitle').optional({ nullable: true }).isString(),
    body('color').optional({ nullable: true }).isString(),
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

// Enrollments
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
    body('status').isString().notEmpty(),
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
router.get(
  '/:tournamentId/categories/:categoryId/matches',
  [param('tournamentId').isMongoId(), param('categoryId').isMongoId()],
  listTournamentMatches
);

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
