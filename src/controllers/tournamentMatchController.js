const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Tournament, TOURNAMENT_STATUS } = require('../models/Tournament');
const { TournamentCategory, TOURNAMENT_CATEGORY_STATUSES } = require('../models/TournamentCategory');
const { TournamentEnrollment } = require('../models/TournamentEnrollment');
const { TournamentMatch, TOURNAMENT_MATCH_STATUS } = require('../models/TournamentMatch');
const { notifyTournamentMatchScheduled } = require('../services/tournamentNotificationService');

async function ensureTournamentContext(tournamentId, categoryId) {
  const [tournament, category] = await Promise.all([
    Tournament.findById(tournamentId),
    TournamentCategory.findOne({ _id: categoryId, tournament: tournamentId }),
  ]);

  if (!tournament) {
    const error = new Error('Torneo no encontrado');
    error.statusCode = 404;
    throw error;
  }

  if (!category) {
    const error = new Error('Categoría no encontrada');
    error.statusCode = 404;
    throw error;
  }

  return { tournament, category };
}

async function listTournamentMatches(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;

  const matches = await TournamentMatch.find({
    tournament: tournamentId,
    category: categoryId,
  })
    .populate('players', 'fullName gender rating photo')
    .sort({ round: 1, matchNumber: 1, scheduledAt: 1 });

  return res.json(matches);
}

function sanitizeMatchPayload(match, allowedPlayers = new Set()) {
  if (!match || typeof match !== 'object') {
    return null;
  }

  const players = Array.isArray(match.players) ? match.players : [];
  if (players.length !== 2) {
    return null;
  }

  const normalizedPlayers = players
    .map((player) => {
      try {
        return new mongoose.Types.ObjectId(player);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);

  if (normalizedPlayers.length !== 2) {
    return null;
  }

  if (normalizedPlayers[0].toString() === normalizedPlayers[1].toString()) {
    return null;
  }

  if (
    allowedPlayers.size &&
    (!allowedPlayers.has(normalizedPlayers[0].toString()) ||
      !allowedPlayers.has(normalizedPlayers[1].toString()))
  ) {
    return null;
  }

  const scheduledAt = match.scheduledAt ? new Date(match.scheduledAt) : null;
  const hasValidDate = scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime());

  return {
    round: typeof match.round === 'string' ? match.round.trim() : undefined,
    matchNumber: Number.isFinite(Number(match.matchNumber)) ? Number(match.matchNumber) : undefined,
    players: normalizedPlayers.map((id) => id.toString()),
    scheduledAt: hasValidDate ? scheduledAt : undefined,
    court: typeof match.court === 'string' ? match.court.trim() : undefined,
    status: Object.values(TOURNAMENT_MATCH_STATUS).includes(match.status)
      ? match.status
      : TOURNAMENT_MATCH_STATUS.SCHEDULED,
  };
}

async function generateTournamentMatches(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;
  const { matches = [], replaceExisting = false } = req.body;

  let context;
  try {
    context = await ensureTournamentContext(tournamentId, categoryId);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  const { tournament, category } = context;

  const enrollments = await TournamentEnrollment.find({
    tournament: tournamentId,
    category: categoryId,
  }).select('user');

  const allowedPlayers = new Set(enrollments.map((enrollment) => enrollment.user.toString()));
  if (!allowedPlayers.size) {
    return res.status(400).json({ message: 'No hay jugadores inscritos en la categoría' });
  }

  const sanitizedMatches = Array.isArray(matches)
    ? matches
        .map((match) => sanitizeMatchPayload(match, allowedPlayers))
        .filter((match) => match && match.players && match.players.length === 2)
    : [];

  if (!sanitizedMatches.length) {
    return res.status(400).json({ message: 'No se proporcionaron partidos válidos' });
  }

  if (replaceExisting) {
    await TournamentMatch.deleteMany({ tournament: tournamentId, category: categoryId });
  }

  const payloads = sanitizedMatches.map((match) => {
    const confirmationEntries = match.players.reduce((acc, playerId) => {
      acc[playerId] = { status: 'pendiente' };
      return acc;
    }, {});

    return {
      tournament: tournamentId,
      category: categoryId,
      round: match.round,
      matchNumber: match.matchNumber,
      players: match.players,
      scheduledAt: match.scheduledAt,
      court: match.court,
      status: match.status,
      confirmations: confirmationEntries,
      createdBy: req.user.id,
    };
  });

  const createdMatches = await TournamentMatch.insertMany(payloads, { ordered: false });

  await Promise.all(
    createdMatches.map((match) =>
      notifyTournamentMatchScheduled({
        tournament,
        category,
        match,
        players: match.players,
      }).then((notification) => {
        if (notification) {
          match.notifications.push(notification._id);
        }
        return match.save();
      })
    )
  );

  if (tournament.status !== TOURNAMENT_STATUS.FINISHED) {
    tournament.status = TOURNAMENT_STATUS.IN_PLAY;
    await tournament.save();
  }

  if (category.status !== TOURNAMENT_CATEGORY_STATUSES.FINISHED) {
    category.status = TOURNAMENT_CATEGORY_STATUSES.IN_PLAY;
    await category.save();
  }

  const populatedMatches = await TournamentMatch.find({
    _id: { $in: createdMatches.map((match) => match._id) },
  }).populate('players', 'fullName gender rating photo');

  return res.status(201).json(populatedMatches);
}

async function updateTournamentMatch(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId, matchId } = req.params;
  const updates = req.body || {};

  let context;
  try {
    context = await ensureTournamentContext(tournamentId, categoryId);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  const match = await TournamentMatch.findOne({
    _id: matchId,
    tournament: tournamentId,
    category: categoryId,
  });

  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  ['round', 'court'].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      match[field] = updates[field];
    }
  });

  if (Object.prototype.hasOwnProperty.call(updates, 'scheduledAt')) {
    const scheduledAt = updates.scheduledAt ? new Date(updates.scheduledAt) : null;
    match.scheduledAt = scheduledAt && !Number.isNaN(scheduledAt.getTime()) ? scheduledAt : null;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
    const allowed = Object.values(TOURNAMENT_MATCH_STATUS);
    if (allowed.includes(updates.status)) {
      match.status = updates.status;
    }
  }

  await match.save();

  if (updates.notifyPlayers) {
    const notification = await notifyTournamentMatchScheduled({
      tournament: context.tournament,
      category: context.category,
      match,
      players: match.players,
    });
    if (notification) {
      match.notifications.push(notification._id);
      await match.save();
    }
  }

  await match.populate('players', 'fullName gender rating photo');

  return res.json(match);
}

async function respondToTournamentMatch(req, res, targetStatus) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId, matchId } = req.params;

  const match = await TournamentMatch.findOne({
    _id: matchId,
    tournament: tournamentId,
    category: categoryId,
  });

  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  const userId = req.user.id.toString();
  if (!match.players.map((player) => player.toString()).includes(userId)) {
    return res.status(403).json({ message: 'Solo los jugadores asignados pueden responder al partido' });
  }

  const confirmation = match.confirmations.get(userId) || { status: 'pendiente' };
  confirmation.status = targetStatus;
  confirmation.respondedAt = new Date();
  match.confirmations.set(userId, confirmation);

  if (targetStatus === 'rechazado') {
    match.status = TOURNAMENT_MATCH_STATUS.REJECTED;
  } else if (targetStatus === 'confirmado') {
    const allConfirmed = match.players.every((playerId) => {
      const entry = match.confirmations.get(playerId.toString());
      return entry && entry.status === 'confirmado';
    });
    if (allConfirmed) {
      match.status = TOURNAMENT_MATCH_STATUS.CONFIRMED;
    } else if (match.status !== TOURNAMENT_MATCH_STATUS.CONFIRMED) {
      match.status = TOURNAMENT_MATCH_STATUS.SCHEDULED;
    }
  }

  await match.save();
  await match.populate('players', 'fullName gender rating photo');

  return res.json(match);
}

async function confirmTournamentMatch(req, res) {
  return respondToTournamentMatch(req, res, 'confirmado');
}

async function rejectTournamentMatch(req, res) {
  return respondToTournamentMatch(req, res, 'rechazado');
}

module.exports = {
  listTournamentMatches,
  generateTournamentMatches,
  updateTournamentMatch,
  confirmTournamentMatch,
  rejectTournamentMatch,
};
