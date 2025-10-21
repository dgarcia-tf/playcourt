const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  createReservation,
  listReservations,
  cancelReservation,
  getAvailability,
  validateCreateReservation,
  validateListReservations,
} = require('../controllers/courtReservationController');

const router = express.Router();

router.get('/reservations', authenticate, validateListReservations, listReservations);
router.get('/availability', authenticate, validateListReservations, getAvailability);
router.post('/reservations', authenticate, validateCreateReservation, createReservation);
router.delete('/reservations/:id', authenticate, cancelReservation);

module.exports = router;
