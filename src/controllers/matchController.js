const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Match } = require('../models/Match');
const { CourtReservation } = require('../models/CourtReservation');
const { Category } = require('../models/Category');
const { Enrollment } = require('../models/Enrollment');
const { Season } = require('../models/Season');
const { Notification } = require('../models/Notification');
const { Club } = require('../models/Club');
const { User, USER_ROLES, userHasRole } = require('../models/User');
const { refreshCategoryRanking } = require('../services/rankingService');
const { MATCH_EXPIRATION_DAYS } = require('../services/matchExpirationService');
const {
  ensureReservationAvailability: ensureCourtReservationAvailability,
  upsertMatchReservation,
  cancelMatchReservation,
  resolveEndsAt,
} = require('../services/courtReservationService');

const MATCH_STATUSES = ['pendiente', 'propuesto', 'programado', 'revision', 'completado', 'caducado'];
const ACTIVE_STATUSES = MATCH_STATUSES.filter((status) => !['completado', 'caducado'].includes(status));
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MIN_MATCH_DURATION_MS = 90 * 60 * 1000;
const MATCH_EXPIRATION_MS = MATCH_EXPIRATION_DAYS * DAY_IN_MS;

function sanitizeScores(playerIds = [], scores = {}) {
  const normalized = {};
  const source = scores || {};
  playerIds.forEach((playerId) => {
    const rawValue =
      typeof source.get === 'function'
        ? source.get(playerId)
        : typeof source === 'object' && source !== null
        ? source[playerId]
        : undefined;
    const numeric = Number(rawValue);
    normalized[playerId] = Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
  });
  return normalized;
}

function sanitizeSets(playerIds = [], sets = []) {
  if (!Array.isArray(sets) || !sets.length) {
    return [];
  }

  const allowedPlayers = playerIds.map((id) => id.toString());
  const sanitized = [];
  sets.slice(0, 3).forEach((set, index) => {
    if (!set || typeof set !== 'object') return;
    const number = Number.isFinite(Number(set.number)) ? Number(set.number) : index + 1;
    const rawScores = set.scores || {};
    const normalizedScores = {};
    allowedPlayers.forEach((playerId) => {
      const rawValue =
        typeof rawScores.get === 'function'
          ? rawScores.get(playerId)
          : typeof rawScores === 'object' && rawScores !== null
          ? rawScores[playerId]
          : undefined;
      const numeric = Number(rawValue);
      normalizedScores[playerId] = Number.isFinite(numeric) && numeric >= 0 ? Math.floor(numeric) : 0;
    });

    const totalForSet = Object.values(normalizedScores).reduce((acc, value) => acc + value, 0);
    if (totalForSet === 0) {
      return;
    }

    sanitized.push({
      number,
      tieBreak: number === 3 && Boolean(set.tieBreak),
      scores: normalizedScores,
    });
  });

  return sanitized;
}

function buildTotalsFromSets(playerIds = [], sets = []) {
  if (!Array.isArray(sets) || !sets.length) {
    return null;
  }

  const totals = {};
  playerIds.forEach((playerId) => {
    totals[playerId] = 0;
  });

  sets.forEach((set) => {
    playerIds.forEach((playerId) => {
      const value = Number(set.scores[playerId]);
      if (Number.isFinite(value)) {
        totals[playerId] += Math.max(0, value);
      }
    });
  });

  return totals;
}

async function resolveClubCourtSelection(courtInput) {
  if (courtInput === undefined || courtInput === null) {
    return undefined;
  }

  const value = typeof courtInput === 'string' ? courtInput : String(courtInput);
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const club = await Club.getSingleton();
  const courts = Array.isArray(club && club.courts) ? club.courts : [];

  if (!courts.length) {
    const error = new Error('No hay pistas registradas en el club.');
    error.statusCode = 400;
    throw error;
  }

  const normalized = trimmed.toLowerCase();
  const matched = courts.find(
    (entry) => entry && entry.name && entry.name.trim().toLowerCase() === normalized
  );

  if (!matched) {
    const error = new Error('La pista seleccionada no existe en el club.');
    error.statusCode = 400;
    throw error;
  }

  return matched.name;
}

async function ensureSchedulingAvailability({ scheduledDate, players = [], court, excludeMatchId }) {
  if (!(scheduledDate instanceof Date) || Number.isNaN(scheduledDate.getTime())) {
    const error = new Error('Fecha y hora inválida.');
    error.statusCode = 400;
    throw error;
  }

  const windowStart = new Date(scheduledDate.getTime() - MIN_MATCH_DURATION_MS);
  const windowEnd = new Date(scheduledDate.getTime() + MIN_MATCH_DURATION_MS);

  const normalizedPlayers = Array.isArray(players)
    ? players.map((playerId) => playerId && playerId.toString())
    : [];

  const conditions = [];
  if (normalizedPlayers.length) {
    conditions.push({ players: { $in: normalizedPlayers } });
  }

  if (court) {
    conditions.push({ court });
  }

  if (!conditions.length) {
    return;
  }

  const query = {
    scheduledAt: { $gte: windowStart, $lt: windowEnd },
    status: { $in: ACTIVE_STATUSES },
    $or: conditions,
  };

  if (excludeMatchId) {
    query._id = { $ne: excludeMatchId };
  }

  const conflict = await Match.findOne(query).select('_id');
  if (conflict) {
    const error = new Error(
      'No se puede programar el partido en la misma franja horaria. Debe haber al menos 1 hora y 30 minutos entre partidos.'
    );
    error.statusCode = 400;
    throw error;
  }
}

async function createMatch(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { categoryId, players, scheduledAt, court, notes, seasonId } = req.body;

  if (!Array.isArray(players) || players.length !== 2) {
    return res.status(400).json({ message: 'Se requieren exactamente dos jugadores' });
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }

  const leagueId = category.league ? category.league.toString() : null;

  const enrollments = await Enrollment.find({
    category: categoryId,
    user: { $in: players },
  }).populate('user');

  if (enrollments.length !== 2) {
    return res.status(400).json({ message: 'Ambos jugadores deben estar inscritos en la categoría' });
  }

  let resolvedSeasonId = seasonId;

  if (seasonId) {
    const season = await Season.findById(seasonId);
    if (!season) {
      return res.status(404).json({ message: 'Temporada no encontrada' });
    }

    if (!Array.isArray(season.categories)) {
      season.categories = [];
    }

    const alreadyLinked = season.categories.map((id) => id.toString()).includes(categoryId);
    if (!alreadyLinked) {
      season.categories.push(new mongoose.Types.ObjectId(categoryId));
      await season.save();
    }
  }

  const matchPayload = {
    category: categoryId,
    league: leagueId ? new mongoose.Types.ObjectId(leagueId) : undefined,
    season: resolvedSeasonId ? new mongoose.Types.ObjectId(resolvedSeasonId) : undefined,
    players,
    result: {
      notes,
    },
    createdBy: req.user.id,
  };

  const normalizedPlayers = players.map((playerId) => playerId && playerId.toString());
  let scheduledDate;
  if (scheduledAt) {
    scheduledDate = scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ message: 'Fecha y hora inválida.' });
    }
    matchPayload.scheduledAt = scheduledDate;
    matchPayload.status = 'programado';
  } else {
    matchPayload.expiresAt = new Date(Date.now() + MATCH_EXPIRATION_MS);
  }

  let resolvedCourt;
  if (court !== undefined) {
    try {
      resolvedCourt = await resolveClubCourtSelection(court);
      if (resolvedCourt) {
        matchPayload.court = resolvedCourt;
      }
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        message: error.message || 'La pista seleccionada no es válida.',
      });
    }
  }

  if (scheduledDate) {
    try {
      await ensureSchedulingAvailability({
        scheduledDate,
        players: normalizedPlayers,
        court: resolvedCourt || matchPayload.court,
      });
    } catch (error) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }

    if (resolvedCourt || matchPayload.court) {
      const { startsAt: reservationStart, endsAt: reservationEnd } = resolveEndsAt(scheduledDate);
      try {
        await ensureCourtReservationAvailability({
          court: resolvedCourt || matchPayload.court,
          startsAt: reservationStart,
          endsAt: reservationEnd,
        });
      } catch (error) {
        return res.status(error.statusCode || 400).json({ message: error.message });
      }
    }
  }

  const match = await Match.create(matchPayload);
  if (match.scheduledAt) {
    const reminderAt = new Date(match.scheduledAt.getTime() - 60 * 60 * 1000);
    const scheduledReminder = reminderAt > new Date() ? reminderAt : match.scheduledAt;
    const opponentNames = enrollments.map((enrollment) => enrollment.user.fullName).join(' vs ');

    try {
      await Notification.create({
        title: 'Recordatorio de partido',
        message: `Partido programado ${opponentNames} el ${match.scheduledAt.toISOString()} en la pista ${match.court || 'por definir'}.`,
        channel: 'app',
        scheduledFor: scheduledReminder,
        recipients: players,
        match: match._id,
        metadata: {
          categoria: category.name,
          pista: match.court,
        },
        createdBy: req.user.id,
      });
    } catch (error) {
      console.error('No se pudo crear la notificación de recordatorio', error);
    }

    if (match.court) {
      try {
        await upsertMatchReservation({ match, createdBy: req.user.id });
      } catch (error) {
        console.error('No se pudo crear la reserva automática del partido', error);
      }
    }
  }

  return res.status(201).json(match);
}

async function listMatches(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    categoryId,
    status,
    statuses,
    seasonId,
    playerId,
    includeDrafts,
    resultStatus,
    leagueId,
  } = req.query;

  const query = {};
  if (categoryId) {
    query.category = categoryId;
  }
  const statusList = Array.isArray(statuses)
    ? statuses.filter((value) => MATCH_STATUSES.includes(value))
    : undefined;

  if (statusList?.length) {
    query.status = { $in: statusList };
  } else if (status) {
    query.status = status;
  } else if (includeDrafts) {
    query.status = { $in: ACTIVE_STATUSES };
  }
  if (seasonId) {
    query.season = seasonId;
  }
  if (leagueId) {
    query.league = leagueId;
  }
  if (playerId) {
    query.players = playerId;
  }

  if (resultStatus) {
    query['result.status'] = resultStatus;
  }

  const matches = await Match.find(query)
    .populate('category', 'name gender color')
    .populate('league', 'name year status')
    .populate('season', 'name year')
    .populate('players', 'fullName email gender')
    .populate('result.winner', 'fullName email gender')
    .populate('proposal.requestedBy', 'fullName email phone')
    .populate('proposal.requestedTo', 'fullName email phone')
    .sort({ scheduledAt: 1, createdAt: 1 });

  return res.json(matches);
}

async function updateMatch(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { matchId } = req.params;
  const {
    categoryId,
    players,
    scheduledAt,
    court,
    status,
    notes,
  } = req.body;

  const match = await Match.findById(matchId);
  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  const existingReservation = await CourtReservation.findOne({ match: matchId });

  let targetCategoryId = match.category?.toString();
  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    match.category = categoryId;
    targetCategoryId = categoryId;
    match.league = category.league ? category.league : undefined;
  }

  if (Array.isArray(players)) {
    if (players.length !== 2) {
      return res.status(400).json({ message: 'El partido debe tener dos jugadores' });
    }

    const normalizedPlayers = players.map((playerId) => playerId.toString());
    const enrollments = await Enrollment.find({
      category: targetCategoryId,
      user: { $in: normalizedPlayers },
    });

    if (enrollments.length !== normalizedPlayers.length) {
      return res
        .status(400)
        .json({ message: 'Los jugadores seleccionados deben estar inscritos en la categoría' });
    }

    match.players = normalizedPlayers;
  }

  if (scheduledAt !== undefined) {
    if (!scheduledAt) {
      match.scheduledAt = undefined;
      if (status === 'programado' && !match.proposal) {
        match.status = 'pendiente';
        match.expiresAt = new Date(Date.now() + MATCH_EXPIRATION_MS);
      }
    } else {
      const updatedDate = scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt);
      if (Number.isNaN(updatedDate.getTime())) {
        return res.status(400).json({ message: 'Fecha y hora inválida.' });
      }
      match.scheduledAt = updatedDate;
    }
  }

  if (court !== undefined) {
    if (court === null || (typeof court === 'string' && !court.trim())) {
      match.court = undefined;
    } else {
      try {
        match.court = await resolveClubCourtSelection(court);
      } catch (error) {
        return res
          .status(error.statusCode || 400)
          .json({ message: error.message || 'La pista seleccionada no es válida.' });
      }
    }
  }

  if (status) {
    if (!MATCH_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    if (status === 'caducado') {
      match.status = 'caducado';
      match.proposal = undefined;
      match.scheduledAt = undefined;
      match.expiresAt = undefined;
    } else if (status !== 'completado') {
      match.status = status;
      if (status === 'pendiente') {
        match.proposal = undefined;
        match.expiresAt = new Date(Date.now() + MATCH_EXPIRATION_MS);
      } else if (status === 'programado') {
        match.expiresAt = undefined;
      }
    }
  }

  if (notes !== undefined) {
    if (!match.result) {
      match.result = {};
    }
    match.result.notes = notes || undefined;
  }

  if (match.scheduledAt instanceof Date && !Number.isNaN(match.scheduledAt.getTime())) {
    try {
      await ensureSchedulingAvailability({
        scheduledDate: match.scheduledAt,
        players: Array.isArray(match.players)
          ? match.players.map((playerId) => playerId && playerId.toString())
          : [],
        court: match.court,
        excludeMatchId: match._id,
      });
    } catch (error) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }

    if (match.court) {
      const { startsAt: reservationStart, endsAt: reservationEnd } = resolveEndsAt(match.scheduledAt);
      try {
        await ensureCourtReservationAvailability({
          court: match.court,
          startsAt: reservationStart,
          endsAt: reservationEnd,
          excludeReservationId: existingReservation?._id,
        });
      } catch (error) {
        return res.status(error.statusCode || 400).json({ message: error.message });
      }
    }
  }

  const shouldSyncReservation =
    match.status === 'programado' && Boolean(match.scheduledAt) && Boolean(match.court);

  await match.save();

  const updated = await Match.findById(matchId)
    .populate('category', 'name gender color')
    .populate('league', 'name year status')
    .populate('season', 'name year')
    .populate('players', 'fullName email gender phone')
    .populate('proposal.requestedBy', 'fullName email phone')
    .populate('proposal.requestedTo', 'fullName email phone');

  if (shouldSyncReservation) {
    try {
      await upsertMatchReservation({ match, createdBy: req.user.id });
    } catch (error) {
      console.error('No se pudo sincronizar la reserva de pista del partido', error);
    }
  } else if (existingReservation) {
    try {
      await cancelMatchReservation(match._id, { cancelledBy: req.user.id });
    } catch (error) {
      console.error('No se pudo cancelar la reserva vinculada al partido', error);
    }
  }

  return res.json(updated);
}

async function deleteMatch(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { matchId } = req.params;

  const match = await Match.findById(matchId);
  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  if (match.status === 'completado') {
    return res
      .status(400)
      .json({ message: 'No es posible eliminar un partido que ya fue completado.' });
  }

  try {
    await cancelMatchReservation(matchId, { cancelledBy: req.user.id });
  } catch (error) {
    console.error('No se pudo cancelar la reserva asociada al partido eliminado', error);
  }

  await Promise.all([
    Notification.deleteMany({ match: matchId }),
    Match.deleteOne({ _id: matchId }),
  ]);

  return res.json({ message: 'Partido eliminado correctamente' });
}

async function reportResult(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { matchId } = req.params;
  const { winnerId, scores, sets, notes } = req.body;

  const match = await Match.findById(matchId)
    .populate('category', 'name color')
    .populate('league', 'name year status');

  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  const playerIds = match.players.map((player) => player.toString());
  const requesterId = req.user.id;
  const isAdmin = userHasRole(req.user, USER_ROLES.ADMIN);

  if (!playerIds.includes(winnerId)) {
    return res.status(400).json({ message: 'El ganador debe ser uno de los jugadores del partido' });
  }

  if (!isAdmin && !playerIds.includes(requesterId)) {
    return res.status(403).json({ message: 'Solo los jugadores del partido pueden reportar el resultado.' });
  }

  if (match.status === 'caducado') {
    return res
      .status(400)
      .json({ message: 'El partido caducó y no admite el registro de nuevos resultados.' });
  }

  const sanitizedSets = sanitizeSets(playerIds, sets);
  const sanitizedScores = sanitizedSets.length
    ? buildTotalsFromSets(playerIds, sanitizedSets)
    : sanitizeScores(playerIds, scores);
  const now = new Date();

  match.proposal = undefined;
  match.result = match.result || {};
  match.result.winner = winnerId;
  if (sanitizedSets.length) {
    match.result.sets = sanitizedSets.map((set) => ({
      number: set.number,
      tieBreak: set.tieBreak,
      scores: new Map(Object.entries(set.scores)),
    }));
    match.markModified('result.sets');
  } else {
    match.result.sets = undefined;
  }
  match.result.scores = new Map(Object.entries(sanitizedScores));
  match.markModified('result.scores');
  match.result.notes = notes || undefined;
  match.result.reportedBy = requesterId;
  match.result.reportedAt = now;
  match.result.confirmedBy = undefined;
  match.result.confirmedAt = undefined;

  const confirmationMap = new Map();
  playerIds.forEach((playerId) => {
    confirmationMap.set(playerId, {
      status: isAdmin || playerId === requesterId ? 'aprobado' : 'pendiente',
      respondedAt: isAdmin || playerId === requesterId ? now : undefined,
    });
  });
  match.result.confirmations = confirmationMap;
  match.markModified('result.confirmations');

  if (isAdmin) {
    match.result.status = 'confirmado';
    match.status = 'completado';
    match.result.confirmedBy = requesterId;
    match.result.confirmedAt = now;
  } else {
    match.result.status = 'en_revision';
    match.status = 'revision';
  }

  await match.save();

  if (isAdmin) {
    await refreshCategoryRanking(match.category);
  }

  const populated = await Match.findById(matchId)
    .populate('category', 'name gender color')
    .populate('league', 'name year status')
    .populate('season', 'name year')
    .populate('players', 'fullName email gender phone')
    .populate('proposal.requestedBy', 'fullName email phone')
    .populate('proposal.requestedTo', 'fullName email phone')
    .populate('result.winner', 'fullName email');

  if (match.result.status === 'confirmado') {
    const participantEnrollments = await Enrollment.find({
      category: match.category,
      user: { $in: match.players },
    }).populate('user', 'fullName email notifyMatchResults');

    const playerRecipients = participantEnrollments
      .map((enrollment) => enrollment.user)
      .filter((user) => user && user.notifyMatchResults !== false)
      .map((user) => user._id.toString());

    const adminRecipients = await User.find({
      roles: USER_ROLES.ADMIN,
      notifyMatchResults: { $ne: false },
    })
      .select('_id')
      .lean();

    const recipientSet = new Set(playerRecipients);
    adminRecipients.forEach(({ _id }) => {
      if (_id) {
        recipientSet.add(_id.toString());
      }
    });

    if (recipientSet.size) {
      const opponentNames = participantEnrollments
        .map((enrollment) => enrollment.user?.fullName || enrollment.user?.email)
        .filter(Boolean)
        .join(' vs ');

      try {
        await Notification.create({
          title: 'Partido finalizado',
          message: opponentNames
            ? `Se confirmó el partido ${opponentNames}.`
            : 'Se confirmó un partido de la liga.',
          channel: 'app',
          scheduledFor: new Date(),
          recipients: Array.from(recipientSet),
          match: match._id,
          metadata: {
            categoria: populated.category?.name,
            estado: populated.status,
          },
          createdBy: userId,
        });
      } catch (error) {
        console.error('No se pudo crear la notificación de resultado confirmado', error);
      }
    }
  }

  return res.json(populated);
}

async function confirmResult(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { matchId } = req.params;
  const { decision } = req.body;

  const match = await Match.findById(matchId);

  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  if (!match.result || !match.result.winner) {
    return res.status(400).json({ message: 'Aún no hay un resultado registrado para este partido.' });
  }

  const playerIds = match.players.map((player) => player.toString());
  const userId = req.user.id;
  const isAdmin = userHasRole(req.user, USER_ROLES.ADMIN);

  if (!isAdmin && !playerIds.includes(userId)) {
    return res
      .status(403)
      .json({ message: 'Solo los jugadores del partido pueden validar el resultado.' });
  }

  const now = new Date();
  const rawConfirmations = match.result.confirmations;
  const confirmations =
    rawConfirmations instanceof Map
      ? new Map(rawConfirmations)
      : new Map(Object.entries(rawConfirmations || {}));

  if (decision === 'reject') {
    match.result.status = 'rechazado';
    match.status = 'pendiente';
    match.expiresAt = new Date(Date.now() + MATCH_EXPIRATION_MS);
    match.result.confirmedBy = isAdmin ? userId : undefined;
    match.result.confirmedAt = undefined;
    playerIds.forEach((playerId) => {
      confirmations.set(playerId, {
        status: playerId === userId ? 'rechazado' : 'pendiente',
        respondedAt: playerId === userId ? now : undefined,
      });
    });
    match.result.confirmations = confirmations;
    match.markModified('result.confirmations');
    await match.save();

    const populated = await Match.findById(matchId)
      .populate('category', 'name gender color')
      .populate('league', 'name year status')
      .populate('season', 'name year')
      .populate('players', 'fullName email gender phone')
      .populate('proposal.requestedBy', 'fullName email phone')
      .populate('proposal.requestedTo', 'fullName email phone')
      .populate('result.winner', 'fullName email');

    return res.json(populated);
  }

  if (decision !== 'approve') {
    return res.status(400).json({ message: 'Decisión inválida. Usa "approve" o "reject".' });
  }

  confirmations.set(userId, {
    status: 'aprobado',
    respondedAt: now,
  });

  const allApproved = playerIds.every((playerId) => {
    if (isAdmin) return true;
    const entry = confirmations.get(playerId);
    return entry?.status === 'aprobado';
  });

  if (isAdmin) {
    playerIds.forEach((playerId) => {
      confirmations.set(playerId, {
        status: 'aprobado',
        respondedAt: now,
      });
    });
  }

  match.result.confirmations = confirmations;
  match.markModified('result.confirmations');

  if (allApproved || isAdmin) {
    match.result.status = 'confirmado';
    match.status = 'completado';
    match.result.confirmedBy = userId;
    match.result.confirmedAt = now;
  } else {
    match.result.status = 'en_revision';
    if (match.status !== 'revision') {
      match.status = 'revision';
    }
  }

  await match.save();

  if (match.result.status === 'confirmado') {
    await refreshCategoryRanking(match.category);
  }

  const populated = await Match.findById(matchId)
    .populate('category', 'name gender color')
    .populate('league', 'name year status')
    .populate('season', 'name year')
    .populate('players', 'fullName email gender phone')
    .populate('proposal.requestedBy', 'fullName email phone')
    .populate('proposal.requestedTo', 'fullName email phone')
    .populate('result.winner', 'fullName email');

  return res.json(populated);
}

async function generateCategoryMatches(req, res) {
  const { categoryId } = req.params;

  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }

  const enrollments = await Enrollment.find({ category: categoryId }).select('user').populate('user', 'fullName');

  if (enrollments.length < 2) {
    return res
      .status(400)
      .json({ message: 'Se necesitan al menos dos jugadores inscritos para generar partidos.' });
  }

  const playerIds = enrollments.map((enrollment) => enrollment.user._id.toString());
  const existingMatches = await Match.find({ category: categoryId }).select('players status');
  const existingKeys = new Set(
    existingMatches.map((match) => match.players.map((player) => player.toString()).sort().join(':'))
  );

  const combinations = [];
  for (let i = 0; i < playerIds.length - 1; i += 1) {
    for (let j = i + 1; j < playerIds.length; j += 1) {
      const key = [playerIds[i], playerIds[j]].sort().join(':');
      if (!existingKeys.has(key)) {
        combinations.push([playerIds[i], playerIds[j]]);
        existingKeys.add(key);
      }
    }
  }

  if (!combinations.length) {
    return res.status(200).json({
      created: 0,
      message: 'Todos los encuentros posibles ya están generados.',
    });
  }

  const payload = combinations.map((pair) => ({
    category: categoryId,
    league: category.league || undefined,
    players: pair,
    status: 'pendiente',
    autoGenerated: true,
    createdBy: req.user.id,
    expiresAt: new Date(Date.now() + MATCH_EXPIRATION_MS),
  }));

  const matches = await Match.insertMany(payload);

  const playerNameMap = new Map(
    enrollments.map((enrollment) => [enrollment.user._id.toString(), enrollment.user.fullName])
  );

  const notifications = matches.map((matchDoc, index) => {
    const playerIds = combinations[index];
    if (!Array.isArray(playerIds) || playerIds.length !== 2) {
      return null;
    }

    const opponentNames = playerIds
      .map((playerId) => playerNameMap.get(playerId) || 'Jugador')
      .join(' vs ');
    const expirationDate = matchDoc.expiresAt instanceof Date ? matchDoc.expiresAt : null;
    const deadline = expirationDate ? expirationDate.toISOString().split('T')[0] : undefined;

    return {
      title: 'Nuevo partido pendiente',
      message: deadline
        ? `${opponentNames}: disponen de 15 días, hasta el ${deadline}, para disputar el partido. Si nadie confirma ni juega antes de esa fecha, el partido caducará sin puntos. Si solo un jugador confirma la fecha y la otra parte no responde, se asignará 6-0 6-0 a quien confirmó.`
        : `${opponentNames}: disponen de 15 días para disputar el partido. Si nadie confirma ni juega antes de esa fecha, el partido caducará sin puntos. Si solo un jugador confirma la fecha y la otra parte no responde, se asignará 6-0 6-0 a quien confirmó.`,
      channel: 'app',
      scheduledFor: new Date(),
      recipients: playerIds,
      match: matchDoc._id,
      metadata: {
        tipo: 'caducidad_partido',
        dias: MATCH_EXPIRATION_DAYS.toString(),
        venceEl: deadline,
      },
      createdBy: req.user.id,
    };
  });

  try {
    const filteredNotifications = notifications.filter(Boolean);
    if (filteredNotifications.length) {
      await Notification.insertMany(filteredNotifications);
    }
  } catch (error) {
    console.error('No se pudieron crear las notificaciones de caducidad de partido', error);
  }

  return res.status(201).json({
    created: matches.length,
    pending: matches.length,
    players: enrollments.length,
  });
}

async function proposeMatch(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { matchId } = req.params;
  const { proposedFor, message, court } = req.body;

  const match = await Match.findById(matchId);
  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  const requesterId = req.user.id;
  const playerIds = match.players.map((player) => player.toString());
  if (!playerIds.includes(requesterId)) {
    return res.status(403).json({ message: 'Solo los jugadores del partido pueden proponer un horario.' });
  }

  if (match.status === 'completado') {
    return res.status(400).json({ message: 'El partido ya fue completado.' });
  }

  if (match.status === 'caducado') {
    return res
      .status(400)
      .json({ message: 'El partido caducó y no admite nuevas propuestas de fecha.' });
  }

  const opponentId = playerIds.find((id) => id !== requesterId);
  const proposedDate = new Date(proposedFor);
  if (Number.isNaN(proposedDate.getTime())) {
    return res.status(400).json({ message: 'Fecha inválida.' });
  }

  match.proposal = {
    requestedBy: requesterId,
    requestedTo: opponentId,
    proposedFor: proposedDate,
    message,
    requestedAt: new Date(),
    status: 'pendiente',
  };
  match.status = 'propuesto';
  match.scheduledAt = undefined;
  match.court = undefined;
  if (court !== undefined) {
    try {
      match.court = await resolveClubCourtSelection(court);
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        message: error.message || 'La pista seleccionada no es válida.',
      });
    }
  }

  await match.save();

  const populated = await Match.findById(matchId)
    .populate('category', 'name gender color')
    .populate('league', 'name year status')
    .populate('players', 'fullName email phone')
    .populate('proposal.requestedBy', 'fullName email phone')
    .populate('proposal.requestedTo', 'fullName email phone');

  try {
    const opponent = await User.findById(opponentId).select('fullName email notifyMatchRequests');

    if (opponent && opponent.notifyMatchRequests !== false) {
      const requesterName =
        (req.user && (req.user.fullName || req.user.email)) || 'Jugador';
      const proposedDate = match.proposal?.proposedFor instanceof Date
        ? match.proposal.proposedFor
        : new Date(proposedFor);
      const baseMessage = `${requesterName} te propuso jugar el partido el ${proposedDate.toISOString()}.`;
      const courtMessage = match.court ? ` Pista sugerida: ${match.court}.` : '';
      const trimmedNote = typeof message === 'string' ? message.trim() : '';
      const noteMessage = trimmedNote ? ` Mensaje: ${trimmedNote.slice(0, 200)}` : '';
      const notificationMessage = `${baseMessage}${courtMessage}${noteMessage}`;
      const metadata = {
        tipo: 'propuesta_partido',
        propuestoPara: proposedDate.toISOString(),
        categoria: populated.category?.name || '',
        solicitante: requesterName,
      };

      const existingNotification = await Notification.findOne({
        match: match._id,
        'metadata.tipo': 'propuesta_partido',
      });

      if (existingNotification) {
        existingNotification.title = 'Propuesta de partido';
        existingNotification.message = notificationMessage;
        existingNotification.channel = 'app';
        existingNotification.scheduledFor = new Date();
        existingNotification.status = 'pendiente';
        existingNotification.sentAt = null;
        existingNotification.recipients = [opponent._id];
        existingNotification.match = match._id;
        existingNotification.metadata = metadata;
        existingNotification.createdBy = requesterId;
        existingNotification.markModified('metadata');
        await existingNotification.save();
      } else {
        await Notification.create({
          title: 'Propuesta de partido',
          message: notificationMessage,
          channel: 'app',
          scheduledFor: new Date(),
          recipients: [opponent._id],
          match: match._id,
          metadata,
          createdBy: requesterId,
        });
      }
    }
  } catch (error) {
    console.error('No se pudo crear la notificación de propuesta de partido', error);
  }

  return res.json(populated);
}

async function respondToProposal(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { matchId } = req.params;
  const { decision, court } = req.body;

  const match = await Match.findById(matchId);
  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  if (!match.proposal || !match.proposal.requestedTo) {
    return res.status(400).json({ message: 'No hay una propuesta pendiente para este partido.' });
  }

  if (match.status === 'caducado') {
    return res
      .status(400)
      .json({ message: 'El partido caducó y no admite respuestas a propuestas anteriores.' });
  }

  const existingReservation = await CourtReservation.findOne({ match: matchId });

  const userId = req.user.id;
  if (match.proposal.requestedTo.toString() !== userId) {
    return res
      .status(403)
      .json({ message: 'Solo el jugador invitado puede responder a la propuesta de horario.' });
  }

  if (decision === 'accept') {
    match.proposal.status = 'aceptada';
    match.proposal.respondedAt = new Date();
    match.status = 'programado';
    const proposedDate =
      match.proposal.proposedFor instanceof Date
        ? match.proposal.proposedFor
        : new Date(match.proposal.proposedFor);
    if (Number.isNaN(proposedDate.getTime())) {
      return res.status(400).json({ message: 'Fecha y hora inválida.' });
    }
    match.scheduledAt = proposedDate;
    match.expiresAt = undefined;
    if (court !== undefined) {
      if (court === null || (typeof court === 'string' && !court.trim())) {
        match.court = undefined;
      } else {
        try {
          match.court = await resolveClubCourtSelection(court);
        } catch (error) {
          return res
            .status(error.statusCode || 400)
            .json({ message: error.message || 'La pista seleccionada no es válida.' });
        }
      }
    }
  } else if (decision === 'reject') {
    match.proposal.status = 'rechazada';
    match.proposal.respondedAt = new Date();
    match.status = 'pendiente';
    match.proposal = undefined;
    match.scheduledAt = undefined;
    match.court = undefined;
    match.expiresAt = new Date(Date.now() + MATCH_EXPIRATION_MS);
  } else {
    return res.status(400).json({ message: 'Decisión inválida. Usa "accept" o "reject".' });
  }

  if (match.status === 'programado' && match.scheduledAt) {
    const scheduledDate =
      match.scheduledAt instanceof Date ? match.scheduledAt : new Date(match.scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ message: 'Fecha y hora inválida.' });
    }

    try {
      await ensureSchedulingAvailability({
        scheduledDate,
        players: Array.isArray(match.players)
          ? match.players.map((playerId) => playerId && playerId.toString())
          : [],
        court: match.court,
        excludeMatchId: match._id,
      });
    } catch (error) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }

    if (match.court) {
      const { startsAt: reservationStart, endsAt: reservationEnd } = resolveEndsAt(scheduledDate);
      try {
        await ensureCourtReservationAvailability({
          court: match.court,
          startsAt: reservationStart,
          endsAt: reservationEnd,
          excludeReservationId: existingReservation?._id,
        });
      } catch (error) {
        return res.status(error.statusCode || 400).json({ message: error.message });
      }
    }
  }

  const shouldSyncReservation =
    match.status === 'programado' && Boolean(match.scheduledAt) && Boolean(match.court);

  await match.save();

  if (shouldSyncReservation) {
    try {
      await upsertMatchReservation({ match, createdBy: userId });
    } catch (error) {
      console.error('No se pudo sincronizar la reserva de pista del partido', error);
    }
  } else if (existingReservation) {
    try {
      await cancelMatchReservation(match._id, { cancelledBy: userId });
    } catch (error) {
      console.error('No se pudo cancelar la reserva vinculada al partido', error);
    }
  }

  try {
    await Notification.deleteMany({ match: matchId, 'metadata.tipo': 'propuesta_partido' });
  } catch (error) {
    console.error('No se pudieron limpiar las notificaciones de propuesta de partido', error);
  }

  const populated = await Match.findById(matchId)
    .populate('category', 'name gender color')
    .populate('league', 'name year status')
    .populate('players', 'fullName email phone')
    .populate('proposal.requestedBy', 'fullName email phone')
    .populate('proposal.requestedTo', 'fullName email phone');

  if (decision === 'accept' && match.scheduledAt) {
    const enrollments = await Enrollment.find({
      category: match.category,
      user: { $in: match.players },
    }).populate('user', 'fullName email notifyMatchRequests');

    const opponentNames = enrollments
      .map((enrollment) => enrollment.user.fullName || enrollment.user.email)
      .filter(Boolean)
      .join(' vs ');

    const participantRecipients = enrollments
      .map((enrollment) => enrollment.user)
      .filter((user) => user && user.notifyMatchRequests !== false)
      .map((user) => user._id.toString());

    const adminRecipients = await User.find({
      roles: USER_ROLES.ADMIN,
      notifyMatchRequests: { $ne: false },
    })
      .select('_id')
      .lean();

    const recipientSet = new Set(participantRecipients);
    adminRecipients.forEach(({ _id }) => {
      if (_id) {
        recipientSet.add(_id.toString());
      }
    });

    if (recipientSet.size) {
      const messageText = opponentNames
        ? `Se confirmó el partido ${opponentNames} para el ${match.scheduledAt.toISOString()}.`
        : `Se confirmó un partido para el ${match.scheduledAt.toISOString()}.`;

      try {
        await Notification.create({
          title: 'Partido confirmado',
          message: messageText,
          channel: 'app',
          scheduledFor: match.scheduledAt,
          recipients: Array.from(recipientSet),
          match: match._id,
          metadata: {
            categoria: populated.category?.name,
            pista: match.court,
          },
          createdBy: userId,
        });
      } catch (error) {
        console.error('No se pudo crear la notificación de confirmación', error);
      }
    }
  }

  return res.json(populated);
}

module.exports = {
  createMatch,
  listMatches,
  updateMatch,
  deleteMatch,
  reportResult,
  confirmResult,
  generateCategoryMatches,
  proposeMatch,
  respondToProposal,
};
