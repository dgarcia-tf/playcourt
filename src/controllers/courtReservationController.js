const { validationResult, body, query } = require('express-validator');
const mongoose = require('mongoose');
const { CourtReservation, RESERVATION_STATUS, RESERVATION_TYPES } = require('../models/CourtReservation');
const { Club } = require('../models/Club');
const { User, USER_ROLES, userHasRole } = require('../models/User');
const {
  ensureReservationAvailability,
  DEFAULT_RESERVATION_DURATION_MINUTES,
  INVALID_RESERVATION_SLOT_MESSAGE,
  normalizeParticipants,
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

  const {
    court: rawCourt,
    startsAt: rawStartsAt,
    endsAt: rawEndsAt,
    durationMinutes,
    notes,
    matchType: rawMatchType,
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

  await ensureReservationAvailability({ court, startsAt, endsAt });

  const participantList = Array.isArray(req.body.participants) ? req.body.participants : [];
  const normalizedParticipants = normalizeParticipants(participantList);
  const requesterId = req.user.id.toString();
  if (!normalizedParticipants.includes(requesterId)) {
    normalizedParticipants.unshift(requesterId);
  }
  const participants = normalizedParticipants.slice(0, 4);

  const reservation = await CourtReservation.create({
    court,
    startsAt,
    endsAt,
    notes: sanitizeNotes(notes),
    createdBy: req.user.id,
    participants,
    type: RESERVATION_TYPES.MANUAL,
  });

  await reservation
    .populate('createdBy', 'fullName email roles')
    .populate('participants', 'fullName email roles');

  return res.status(201).json(reservation);
}

async function listReservations(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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
    .populate('participants', 'fullName email roles')
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
  validateCreateReservation,
  validateListReservations,
  listReservationPlayers,
};
