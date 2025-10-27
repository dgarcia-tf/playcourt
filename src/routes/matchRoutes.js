const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createMatch,
  listMatches,
  updateMatch,
  deleteMatch,
  reportResult,
  confirmResult,
  proposeMatch,
  respondToProposal,
} = require('../controllers/matchController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

const MATCH_STATUS_OPTIONS = ['pendiente', 'programado', 'completado', 'caducado'];

router.get(
  '/',
  authenticate,
  [
    query('categoryId').optional().isMongoId(),
    query('status').optional().isIn(MATCH_STATUS_OPTIONS),
    query('statuses')
      .optional()
      .customSanitizer((value) => {
        if (value === undefined) {
          return value;
        }
        if (Array.isArray(value)) {
          return value;
        }
        if (typeof value === 'string') {
          return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        }
        return [];
      })
      .custom((value) =>
        value === undefined
          ? true
          : Array.isArray(value)
          ? value.every((status) => MATCH_STATUS_OPTIONS.includes(status))
          : false
      ),
    query('seasonId').optional().isMongoId(),
    query('leagueId').optional().isMongoId(),
    query('playerId').optional().isMongoId(),
    query('resultStatus')
      .optional()
      .isIn(['pendiente', 'en_revision', 'confirmado', 'rechazado'])
      .withMessage('Estado de resultado inválido'),
    query('includeDrafts').optional().isBoolean().toBoolean(),
  ],
  listMatches
);

router.post(
  '/',
  authenticate,
  authorizeRoles('admin'),
  [
    body('categoryId').isMongoId().withMessage('Categoría inválida'),
    body('players').isArray({ min: 2, max: 2 }).withMessage('Se requieren dos jugadores'),
    body('players.*').isMongoId().withMessage('ID de jugador inválido'),
    body('scheduledAt').optional().isISO8601().toDate(),
    body('court').optional().isString().trim(),
    body('notes').optional().isString(),
    body('seasonId').optional().isMongoId(),
  ],
  createMatch
);

router.patch(
  '/:matchId',
  authenticate,
  authorizeRoles('admin'),
  [
    param('matchId').isMongoId(),
    body('categoryId').optional().isMongoId(),
    body('players').optional().isArray({ min: 2, max: 2 }),
    body('players.*').optional().isMongoId(),
    body('scheduledAt')
      .optional({ nullable: true })
      .custom((value) => value === null || value === '' || !Number.isNaN(Date.parse(value)))
      .withMessage('Fecha y hora inválida'),
    body('court').optional({ nullable: true }).isString().trim().isLength({ max: 120 }),
    body('notes').optional({ nullable: true }).isString().isLength({ max: 500 }),
  ],
  updateMatch
);

router.delete(
  '/:matchId',
  authenticate,
  authorizeRoles('admin'),
  [param('matchId').isMongoId()],
  deleteMatch
);

router.post(
  '/:matchId/result',
  authenticate,
  [
    param('matchId').isMongoId(),
    body('winnerId').isMongoId().withMessage('El ganador es obligatorio'),
    body('sets')
      .optional()
      .isArray({ min: 1, max: 3 })
      .withMessage(
        'Si envías sets, el arreglo debe contener entre uno y tres elementos. Recuerda que los formatos al mejor de tres requieren registrar dos o tres sets.'
      ),
    body('sets.*.number').optional().isInt({ min: 1, max: 3 }),
    body('sets.*.tieBreak').optional().isBoolean(),
    body('sets.*.scores').optional().isObject(),
    body('scores').optional().isObject(),
    body('notes').optional().isString(),
  ],
  reportResult
);

router.post(
  '/:matchId/result/confirm',
  authenticate,
  [param('matchId').isMongoId(), body('decision').isIn(['approve', 'reject'])],
  confirmResult
);

router.post(
  '/:matchId/propose',
  authenticate,
  [
    param('matchId').isMongoId(),
    body('proposedFor').isISO8601().withMessage('Proporciona una fecha válida.'),
    body('court').optional({ nullable: true }).isString().trim().isLength({ max: 120 }),
    body('message').optional().isString(),
  ],
  proposeMatch
);

router.post(
  '/:matchId/respond',
  authenticate,
  [
    param('matchId').isMongoId(),
    body('decision').isIn(['accept', 'reject']),
  ],
  respondToProposal
);

module.exports = router;
