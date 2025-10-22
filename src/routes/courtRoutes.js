const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  createReservation,
  listReservations,
  cancelReservation,
  validateCreateReservation,
  validateListReservations,
  listReservationPlayers,
} = require('../controllers/courtReservationController');
const {
  createBlock,
  listBlocks,
  deleteBlock,
  validateCreateBlock,
  validateListBlocks,
  validateDeleteBlock,
} = require('../controllers/courtBlockController');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

router.get('/reservations/players', authenticate, listReservationPlayers);
router.get('/reservations', authenticate, validateListReservations, listReservations);
router.post('/reservations', authenticate, validateCreateReservation, createReservation);
router.delete('/reservations/:id', authenticate, cancelReservation);
router.get(
  '/blocks',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.COURT_MANAGER),
  validateListBlocks,
  listBlocks
);
router.post(
  '/blocks',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.COURT_MANAGER),
  validateCreateBlock,
  createBlock
);
router.delete(
  '/blocks/:id',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.COURT_MANAGER),
  validateDeleteBlock,
  deleteBlock
);

module.exports = router;
