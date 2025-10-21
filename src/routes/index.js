const express = require('express');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const leagueRoutes = require('./leagueRoutes');
const matchRoutes = require('./matchRoutes');
const notificationRoutes = require('./notificationRoutes');
const seasonRoutes = require('./seasonRoutes');
const clubRoutes = require('./clubRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const playerRoutes = require('./playerRoutes');
const chatRoutes = require('./chatRoutes');
const pushRoutes = require('./pushRoutes');
const courtRoutes = require('./courtRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/leagues', leagueRoutes);
router.use('/matches', matchRoutes);
router.use('/notifications', notificationRoutes);
router.use('/seasons', seasonRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/players', playerRoutes);
router.use('/chat', chatRoutes);
router.use('/club', clubRoutes);
router.use('/push', pushRoutes);
router.use('/courts', courtRoutes);

module.exports = router;
