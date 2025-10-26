const { validationResult, body, query } = require('express-validator');
const mongoose = require('mongoose');
const {
  CourtReservation,
  RESERVATION_STATUS,
  RESERVATION_TYPES,
  RESERVATION_GAME_TYPES,
} = require('../models/CourtReservation');
const { Club } = require('../models/Club');
const { User, USER_ROLES, userHasRole } = require('../models/User');
const { CourtBlock } = require('../models/CourtBlock');
const { formatCourtBlock, buildContextLabelMap } = require('./courtBlockController');
const {
  ensureReservationAvailability,
  DEFAULT_RESERVATION_DURATION_MINUTES,
  INVALID_RESERVATION_SLOT_MESSAGE,
  normalizeParticipants,
  RESERVATION_DAY_START_MINUTE,
  RESERVATION_DAY_END_MINUTE,
  MANUAL_RESERVATION_MAX_ADVANCE_HOURS,
  cleanupExpiredManualReservations,
} = require('../services/courtReservationService');

function sanitizeNotes(notes) {
  if (typeof notes !== 'string') {
    return '';
  }
  return notes.trim();
}

function normalizeCourtName(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function normalizeGameType(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const singlesAliases = ['individual', 'individuales', 'singles', 'single', 'simple', 'sencillo'];
  const doublesAliases = ['dobles', 'doubles', 'double', 'parejas', 'pares'];

  if (singlesAliases.includes(normalized)) {
    return RESERVATION_GAME_TYPES.SINGLES;
  }
  if (doublesAliases.includes(normalized)) {
    return RESERVATION_GAME_TYPES.DOUBLES;
  }

  return undefined;
}

function toDate(value) {
  if (!value) {
    return null;
  }
  const result = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(result.getTime())) {
    return null;
  }
  return result;
}

function buildDayRange(dateInput) {
  const day = toDate(dateInput);
  if (!day) {
    return null;
  }

  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function buildDailySlots(date) {
  const day = toDate(date);
  if (!day) {
    return [];
  }

  const slots = [];
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);

  const durationMs = DEFAULT_RESERVATION_DURATION_MINUTES * 60 * 1000;
  const lastStartMinute = RESERVATION_DAY_END_MINUTE - DEFAULT_RESERVATION_DURATION_MINUTES;

  for (
    let minute = RESERVATION_DAY_START_MINUTE;
    minute <= lastStartMinute;
    minute += DEFAULT_RESERVATION_DURATION_MINUTES
  ) {
    const slotStart = new Date(dayStart.getTime() + minute * 60 * 1000);
    const slotEnd = new Date(slotStart.getTime() + durationMs);
    slots.push({ startsAt: slotStart, endsAt: slotEnd });
  }

  return slots;
}

function hasOverlap(startA, endA, startB, endB) {
  if (!startA || !endA || !startB || !endB) {
    return false;
  }
  return startA < endB && endA > startB;
}

function hasCourtManagementAccess(user) {
  return userHasRole(user, USER_ROLES.ADMIN) || userHasRole(user, USER_ROLES.COURT_MANAGER);
}

async function ensureCourtExists(courtName) {
  const normalized = normalizeCourtName(courtName);
  if (!normalized) {
    const error = new Error('La pista es obligatoria.');
    error.statusCode = 400;
    throw error;
  }

  const club = await Club.getSingleton();
  const courts = Array.isArray(club?.courts) ? club.courts : [];
  const exists = courts.some((court) => court?.name?.trim().toLowerCase() === normalized.toLowerCase());

  if (!exists) {
    const error = new Error('La pista seleccionada no existe en el club.');
    error.statusCode = 400;
    throw error;
  }

  const matched = courts.find((court) => court?.name?.trim().toLowerCase() === normalized.toLowerCase());
  return matched?.name || normalized;
}

const ACTIVE_RESERVATION_STATUSES = [RESERVATION_STATUS.RESERVED, RESERVATION_STATUS.PRE_RESERVED];

const validateCreateReservation = [
  body('court').isString().withMessage('La pista es obligatoria.'),
  body('startsAt')
    .custom((value) => toDate(value) !== null)
    .withMessage('La fecha y hora de inicio es obligatoria.'),
  body('endsAt')
    .optional()
    .custom((value) => toDate(value) !== null)
    .withMessage('La fecha y hora de finalización no es válida.'),
  body('durationMinutes')
    .optional()
    .isInt({ gt: 0, lt: 12 * 60 })
    .withMessage('La duración debe ser un número de minutos válido.'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Las notas deben tener menos de 500 caracteres.'),
  body('participants')
    .optional()
    .isArray({ max: 3 })
    .withMessage('La lista de participantes es inválida.'),
  body('participants.*')
    .optional()
    .isMongoId()
    .withMessage('Cada participante debe ser un identificador válido.'),
  body('gameType')
    .optional({ nullable: true })
    .isString()
    .withMessage('El tipo de partido debe ser un texto.'),
  body('matchType')
    .optional({ nullable: true })
    .isString()
    .withMessage('El tipo de partido debe ser un texto.'),
];

const validateListReservations = [
  query('date')
    .optional()
    .custom((value) => toDate(value) !== null)
    .withMessage('La fecha no es válida.'),
  query('court')
    .optional()
    .isString()
    .withMessage('La pista debe ser un texto.'),
  query('start')
    .optional()
    .custom((value) => toDate(value) !== null)
    .withMessage('La fecha inicial no es válida.'),
  query('end')
    .optional()
    .custom((value) => toDate(value) !== null)
    .withMessage('La fecha final no es válida.'),
];

async function createReservation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  await cleanupExpiredManualReservations().catch(() => null);

  const {
    court: rawCourt,
    startsAt: rawStartsAt,
    endsAt: rawEndsAt,
    durationMinutes,
    notes,
    matchType: rawMatchType,
    gameType: rawGameType,
  } = req.body;

  const startsAt = toDate(rawStartsAt);
  if (!startsAt) {
    return res.status(400).json({ message: 'La fecha y hora de inicio es obligatoria.' });
  }

  let endsAt = toDate(rawEndsAt);
  const normalizedDuration = Number.isFinite(Number(durationMinutes))
    ? Number(durationMinutes)
    : null;

  if (normalizedDuration !== null && normalizedDuration !== DEFAULT_RESERVATION_DURATION_MINUTES) {
    return res.status(400).json({ message: INVALID_RESERVATION_SLOT_MESSAGE });
  }

  const duration = DEFAULT_RESERVATION_DURATION_MINUTES;

  if (!endsAt) {
    endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);
  } else {
    const diffMinutes = Math.round((endsAt.getTime() - startsAt.getTime()) / (60 * 1000));
    if (diffMinutes !== duration) {
      return res.status(400).json({ message: INVALID_RESERVATION_SLOT_MESSAGE });
    }
  }

  if (endsAt <= startsAt) {
    return res.status(400).json({ message: 'La hora de finalización debe ser posterior a la de inicio.' });
  }

  const court = await ensureCourtExists(rawCourt);

  await ensureReservationAvailability({
    court,
    startsAt,
    endsAt,
    bypassManualAdvanceLimit: hasCourtManagementAccess(req.user),
  });

  let gameType = RESERVATION_GAME_TYPES.SINGLES;
  const typeCandidates = [rawGameType, rawMatchType];
  for (const candidate of typeCandidates) {
    if (candidate === undefined || candidate === null || candidate === '') {
      continue;
    }

    const normalizedType = normalizeGameType(candidate);
    if (normalizedType === undefined) {
      return res.status(400).json({ message: 'El tipo de partido seleccionado no es válido.' });
    }

    if (normalizedType) {
      gameType = normalizedType;
      break;
    }
  }

  const participantList = Array.isArray(req.body.participants) ? req.body.participants : [];
  const normalizedParticipants = normalizeParticipants(participantList);
  const requesterId = req.user.id.toString();
  const participants = normalizedParticipants.includes(requesterId)
    ? [...normalizedParticipants]
    : [requesterId, ...normalizedParticipants];

  if (!participants.includes(requesterId)) {
    participants.unshift(requesterId);
  }

  const requiredParticipants =
    gameType === RESERVATION_GAME_TYPES.DOUBLES ? 4 : 2;

  if (participants.length < requiredParticipants) {
    return res.status(400).json({
      message:
        gameType === RESERVATION_GAME_TYPES.DOUBLES
          ? 'Debes añadir a los cuatro jugadores para una reserva de dobles.'
          : 'Debes añadir al segundo jugador para una reserva individual.',
    });
  }

  if (participants.length > requiredParticipants) {
    return res.status(400).json({
      message:
        gameType === RESERVATION_GAME_TYPES.DOUBLES
          ? 'Una reserva de dobles solo puede tener cuatro participantes.'
          : 'Una reserva individual solo puede tener dos participantes.',
    });
  }

  const now = new Date();
  const conflictingReservation = await CourtReservation.findOne({
    type: RESERVATION_TYPES.MANUAL,
    status: { $in: ACTIVE_RESERVATION_STATUSES },
    endsAt: { $gt: now },
    participants: { $in: participants },
  })
    .populate('participants', 'fullName')
    .lean();

  if (conflictingReservation) {
    const conflictingParticipants = normalizeParticipants(conflictingReservation.participants);
    const conflictingId = participants.find((participantId) =>
      conflictingParticipants.includes(participantId)
    );

    let conflictMessage =
      'Uno de los jugadores ya tiene una reserva activa. Cancela la reserva anterior antes de crear una nueva.';
    if (conflictingId && Array.isArray(conflictingReservation.participants)) {
      const conflictingUser = conflictingReservation.participants.find((participant) => {
        const participantId =
          participant && typeof participant === 'object'
            ? participant._id?.toString?.() || participant.id?.toString?.()
            : participant?.toString?.();
        return participantId === conflictingId;
      });
      const displayName =
        conflictingUser?.fullName || conflictingUser?.email || conflictingReservation.createdBy?.fullName;
      if (displayName) {
        conflictMessage = `El jugador ${displayName} ya tiene una reserva activa. Cancela la reserva anterior antes de crear una nueva.`;
      }
    }

    return res.status(409).json({ message: conflictMessage });
  }

  const reservation = await CourtReservation.create({
    court,
    startsAt,
    endsAt,
    notes: sanitizeNotes(notes),
    createdBy: req.user.id,
    participants,
    type: RESERVATION_TYPES.MANUAL,
    gameType,
  });

  await reservation.populate('createdBy', 'fullName email roles');
  await reservation.populate('participants', 'fullName');

  return res.status(201).json(reservation);
}

async function listReservations(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  await cleanupExpiredManualReservations().catch(() => null);

  const { date, court: rawCourt, start: rawStart, end: rawEnd } = req.query;

  const filters = {
    status: { $in: ACTIVE_RESERVATION_STATUSES },
  };

  if (!hasCourtManagementAccess(req.user)) {
    filters.createdBy = req.user.id;
  }

  const rangeConditions = [];
  const startDate = toDate(rawStart);
  const endDate = toDate(rawEnd);

  if (startDate) {
    rangeConditions.push({ endsAt: { $gt: startDate } });
  }
  if (endDate) {
    rangeConditions.push({ startsAt: { $lt: endDate } });
  }

  if (rangeConditions.length) {
    filters.$and = rangeConditions;
  } else if (date) {
    const range = buildDayRange(date);
    if (range) {
      filters.startsAt = { $gte: range.start, $lt: range.end };
    }
  }

  if (rawCourt) {
    filters.court = await ensureCourtExists(rawCourt);
  }

  const reservations = await CourtReservation.find(filters)
    .sort({ startsAt: 1 })
    .populate('createdBy', 'fullName email roles')
    .populate('participants', 'fullName')
    .populate({
      path: 'match',
      select: 'players category league season status scheduledAt court',
      populate: [
        { path: 'players', select: 'fullName email' },
        { path: 'category', select: 'name color' },
        { path: 'league', select: 'name year status' },
        { path: 'season', select: 'name year' },
      ],
    });

  return res.json(reservations);
}

async function cancelReservation(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: 'Reserva no encontrada.' });
  }

  const reservation = await CourtReservation.findById(id);

  if (!reservation || !ACTIVE_RESERVATION_STATUSES.includes(reservation.status)) {
    return res.status(404).json({ message: 'Reserva no encontrada.' });
  }

  const isOwner = reservation.createdBy?.toString() === req.user.id.toString();
  const isAdmin = userHasRole(req.user, USER_ROLES.ADMIN);
  const isCourtManager = userHasRole(req.user, USER_ROLES.COURT_MANAGER);

  if (reservation.match) {
    return res.status(409).json({
      message: 'La reserva está asociada a un partido de liga. Actualiza el partido para modificar la pista.',
    });
  }

  if (!isOwner && !isAdmin && !isCourtManager) {
    return res.status(403).json({ message: 'No tienes permisos para cancelar esta reserva.' });
  }

  reservation.status = RESERVATION_STATUS.CANCELLED;
  reservation.cancelledAt = new Date();
  reservation.cancelledBy = req.user.id;

  await reservation.save();

  return res.json({ message: 'Reserva cancelada correctamente.' });
}

async function getAvailability(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  await cleanupExpiredManualReservations().catch(() => null);

  const { date, court: rawCourt } = req.query;
  const range = buildDayRange(date);
  if (!range) {
    return res.status(400).json({ message: 'La fecha es obligatoria para consultar disponibilidad.' });
  }

  const club = await Club.getSingleton();
  const allCourts = Array.isArray(club?.courts)
    ? club.courts.map((court) => court?.name).filter(Boolean)
    : [];

  let selectedCourts = allCourts;
  let resolvedCourt;
  if (rawCourt) {
    resolvedCourt = await ensureCourtExists(rawCourt);
    selectedCourts = resolvedCourt ? [resolvedCourt] : [];
  }

  const ignoreManualLimit = req.query.ignoreManualLimit === 'true';

  if (!selectedCourts.length) {
    return res.json({ date: range.start, courts: [], blocks: [] });
  }

  const reservations = await CourtReservation.find({
    court: { $in: selectedCourts },
    status: { $in: ACTIVE_RESERVATION_STATUSES },
    startsAt: { $gte: range.start, $lt: range.end },
  })
    .sort({ startsAt: 1 })
    .populate('createdBy', 'fullName email roles')
    .populate('participants', 'fullName')
    .populate({
      path: 'match',
      select: 'players category league season status scheduledAt court',
      populate: [
        { path: 'players', select: 'fullName email' },
        { path: 'category', select: 'name color' },
        { path: 'league', select: 'name year status' },
        { path: 'season', select: 'name year' },
      ],
    });

  const blocks = await CourtBlock.find({
    startsAt: { $lt: range.end },
    endsAt: { $gt: range.start },
  })
    .sort({ startsAt: 1 })
    .lean();

  const blockLabels = await buildContextLabelMap(blocks);
  const serializedBlocks = blocks
    .map((block) => formatCourtBlock(block, blockLabels))
    .filter(Boolean)
    .filter((block) => {
      if (!resolvedCourt) {
        return true;
      }
      const appliesToCourts = block.courts && block.courts.length ? block.courts : allCourts;
      return appliesToCourts.includes(resolvedCourt);
    });

  const blocksByCourt = new Map();
  serializedBlocks.forEach((block) => {
    const targetCourts = block.courts && block.courts.length ? block.courts : allCourts;
    targetCourts.forEach((courtName) => {
      if (!blocksByCourt.has(courtName)) {
        blocksByCourt.set(courtName, []);
      }
      blocksByCourt.get(courtName).push(block);
    });
  });

  const slots = buildDailySlots(range.start);
  const manualReservationCutoff = new Date(
    Date.now() + MANUAL_RESERVATION_MAX_ADVANCE_HOURS * 60 * 60 * 1000
  );
  let canBypassManualLimit = hasCourtManagementAccess(req.user);
  if (!canBypassManualLimit && ignoreManualLimit) {
    canBypassManualLimit =
      userHasRole(req.user, USER_ROLES.ADMIN) || userHasRole(req.user, USER_ROLES.COURT_MANAGER);
  }

  const grouped = selectedCourts.map((courtName) => ({
    court: courtName,
    reservations: [],
    blocks: (blocksByCourt.get(courtName) || []).filter((block) => {
      if (!resolvedCourt) {
        return true;
      }
      const target = block.courts && block.courts.length ? block.courts : allCourts;
      return target.includes(courtName);
    }),
    availableSlots: [],
  }));

  reservations.forEach((reservation) => {
    const bucket = grouped.find((entry) => entry.court === reservation.court);
    if (bucket) {
      bucket.reservations.push(reservation);
    } else {
      grouped.push({
        court: reservation.court,
        reservations: [reservation],
        blocks: blocksByCourt.get(reservation.court) || [],
        availableSlots: [],
      });
    }
  });

  grouped.forEach((entry) => {
    const courtReservations = entry.reservations || [];
    const courtBlocks = entry.blocks || [];

    entry.availableSlots = slots.filter((slot) => {
      if (!canBypassManualLimit && slot.startsAt > manualReservationCutoff) {
        return false;
      }

      const blockedByReservation = courtReservations.some((reservation) =>
        hasOverlap(slot.startsAt, slot.endsAt, reservation.startsAt, reservation.endsAt)
      );
      if (blockedByReservation) {
        return false;
      }

      const blockedByCourtBlock = courtBlocks.some((block) => {
        const blockStart = block.startsAt instanceof Date ? block.startsAt : new Date(block.startsAt);
        const blockEnd = block.endsAt instanceof Date ? block.endsAt : new Date(block.endsAt);
        return hasOverlap(slot.startsAt, slot.endsAt, blockStart, blockEnd);
      });
      return !blockedByCourtBlock;
    });
  });

  return res.json({
    date: range.start,
    court: resolvedCourt,
    courts: grouped,
    blocks: serializedBlocks,
  });
}

async function listReservationPlayers(req, res) {
  const playerFilter = {
    $or: [{ roles: USER_ROLES.PLAYER }, { role: USER_ROLES.PLAYER }],
  };

  let players = await User.find(playerFilter)
    .select('fullName email roles')
    .sort({ fullName: 1, email: 1 })
    .lean();

  const requesterId = req.user?.id?.toString();
  if (requesterId && !players.some((player) => player?._id?.toString() === requesterId)) {
    const requester = await User.findById(requesterId).select('fullName email roles').lean();
    if (requester) {
      players.push(requester);
    }
  }

  const sanitized = players
    .map((player) => ({
      _id: player?._id?.toString(),
      id: player?._id?.toString(),
      fullName: typeof player?.fullName === 'string' ? player.fullName : '',
      email: typeof player?.email === 'string' ? player.email : '',
      roles: Array.isArray(player?.roles) ? player.roles : player?.roles ? [player.roles] : [],
    }))
    .sort((a, b) => {
      const labelA = (a.fullName || a.email || '').toLocaleLowerCase('es');
      const labelB = (b.fullName || b.email || '').toLocaleLowerCase('es');
      return labelA.localeCompare(labelB, 'es');
    });

  return res.json(sanitized);
}

module.exports = {
  createReservation,
  listReservations,
  cancelReservation,
  getAvailability,
  validateCreateReservation,
  validateListReservations,
  listReservationPlayers,
};
