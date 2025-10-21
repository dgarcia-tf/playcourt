const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getGlobalOverview,
  getLeagueDashboard,
  getTournamentDashboard,
} = require('../controllers/dashboardController');

const router = express.Router();

router.get('/overview', authenticate, getGlobalOverview);
router.get('/leagues', authenticate, getLeagueDashboard);
router.get('/tournaments', authenticate, getTournamentDashboard);

module.exports = router;
