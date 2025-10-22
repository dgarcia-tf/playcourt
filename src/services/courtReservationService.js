const { CourtReservation, RESERVATION_STATUS, RESERVATION_TYPES } = require('../models/CourtReservation');
const { CourtBlock, COURT_BLOCK_CONTEXTS } = require('../models/CourtBlock');

const DEFAULT_RESERVATION_DURATION_MINUTES = 75;
const RESERVATION_DAY_START_MINUTE = 8 * 60 + 30;
const RESERVATION_DAY_END_MINUTE = 22 * 60 + 15;
const INVALID_RESERVATION_SLOT_MESSAGE =
  'Las reservas deben realizarse en bloques de 75 minutos entre las 08:30 y las 22:15.';

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

function resolveEndsAt(startsAt, endsAt, durationMinutes = DEFAULT_RESERVATION_DURATION_MINUTES) {
  const startDate = toDate(startsAt);
  if (!startDate) {
    return { startsAt: null, endsAt: null };
  }

  const endDate = toDate(endsAt);
  if (endDate && endDate > startDate) {
    return { startsAt: startDate, endsAt: endDate };
  }

  const duration = Number.isFinite(Number(durationMinutes))
    ? Number(durationMinutes)
    : DEFAULT_RESERVATION_DURATION_MINUTES;
  const computedEnd = new Date(startDate.getTime() + duration * 60 * 1000);
  return { startsAt: startDate, endsAt: computedEnd };
}

function minutesFromDayStart(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function isValidReservationSlot(startDate, endDate) {
  if (!startDate || !endDate) {
    return false;
  }

  if (startDate.toDateString() !== endDate.toDateString()) {
    return false;
  }

  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (60 * 1000));
  if (durationMinutes !== DEFAULT_RESERVATION_DURATION_MINUTES) {
    return false;
  }

  const startMinutes = minutesFromDayStart(startDate);
  const endMinutes = minutesFromDayStart(endDate);
  if (startMinutes < RESERVATION_DAY_START_MINUTE || endMinutes > RESERVATION_DAY_END_MINUTE) {
    return false;
  }

  return (startMinutes - RESERVATION_DAY_START_MINUTE) % DEFAULT_RESERVATION_DURATION_MINUTES === 0;
}

async function ensureReservationAvailability({
  court,
  startsAt,
  endsAt,
  excludeReservationId,
  reservationType = RESERVATION_TYPES.MANUAL,
  contextType,
  contextId,
}) {
  if (!court || !startsAt || !endsAt) {
    const error = new Error('Los parámetros de la reserva son inválidos.');
    error.statusCode = 400;
    throw error;
  }

  const startDate = toDate(startsAt);
  const endDate = toDate(endsAt);

  if (!startDate || !endDate) {
    const error = new Error('Los parámetros de la reserva son inválidos.');
    error.statusCode = 400;
    throw error;
  }

  if (endDate <= startDate) {
    const error = new Error('La hora de finalización debe ser posterior a la de inicio.');
    error.statusCode = 400;
    throw error;
  }

  if (!isValidReservationSlot(startDate, endDate)) {
    const error = new Error(INVALID_RESERVATION_SLOT_MESSAGE);
    error.statusCode = 400;
    throw error;
  }

  const query = {
    court,
    status: RESERVATION_STATUS.RESERVED,
    $and: [
      { startsAt: { $lt: endDate } },
      { endsAt: { $gt: startDate } },
    ],
  };

  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }

  const overlappingReservation = await CourtReservation.findOne(query).select('_id match');
  if (overlappingReservation) {
    const error = new Error('La pista ya está reservada en el horario seleccionado.');
    error.statusCode = 409;
    throw error;
  }

  const blockQuery = {
    startsAt: { $lt: endDate },
    endsAt: { $gt: startDate },
    $or: [{ courts: { $size: 0 } }, { courts: court }],
  };

  const blockingEntries = await CourtBlock.find(blockQuery)
    .select('contextType context courts startsAt endsAt')
    .lean();

  if (blockingEntries.length) {
    if (reservationType === RESERVATION_TYPES.MATCH && contextType && contextId) {
      const contextKey = contextId.toString();
      const allowed = blockingEntries.some((block) => {
        if (block.contextType !== contextType) {
          return false;
        }
        const blockContext = block.context?.toString?.();
        return blockContext && blockContext === contextKey;
      });
      if (allowed) {
        return;
      }
    }

    const error = new Error(
      'La pista está bloqueada para partidos oficiales en el horario seleccionado. Contacta con la organización.'
    );
    error.statusCode = 409;
    throw error;
  }
}

function normalizeParticipants(participants = []) {
  if (!Array.isArray(participants)) {
    return [];
  }
  const normalized = [];
  participants.forEach((participant) => {
    if (!participant) return;
    const id = typeof participant === 'object' && participant !== null ? participant._id || participant.id || participant.toString() : participant;
    if (!id) return;
    const stringId = id.toString();
    if (stringId && !normalized.includes(stringId)) {
      normalized.push(stringId);
    }
  });
  return normalized;
}

async function upsertMatchReservation({ match, createdBy }) {
  if (!match || !match._id || !match.court || !match.scheduledAt) {
    return null;
  }

  const { startsAt, endsAt } = resolveEndsAt(match.scheduledAt, match.endsAt);
  if (!startsAt || !endsAt) {
    return null;
  }

  const participants = normalizeParticipants(match.players);
  const existing = await CourtReservation.findOne({ match: match._id });

  let contextType;
  let contextId;
  if (match.league) {
    contextType = COURT_BLOCK_CONTEXTS.LEAGUE;
    contextId = match.league;
  } else if (match.tournament) {
    contextType = COURT_BLOCK_CONTEXTS.TOURNAMENT;
    contextId = match.tournament;
  }

  await ensureReservationAvailability({
    court: match.court,
    startsAt,
    endsAt,
    excludeReservationId: existing?._id,
    reservationType: RESERVATION_TYPES.MATCH,
    contextType,
    contextId,
  });

  const creatorCandidate = createdBy || match.proposal?.requestedBy || match.createdBy;
  const creatorId = creatorCandidate ? creatorCandidate.toString() : participants[0];
  if (!creatorId) {
    const error = new Error('No se pudo determinar el creador de la reserva del partido.');
    error.statusCode = 500;
    throw error;
  }

  if (existing) {
    existing.court = match.court;
    existing.startsAt = startsAt;
    existing.endsAt = endsAt;
    existing.createdBy = creatorId;
    existing.status = RESERVATION_STATUS.RESERVED;
    existing.cancelledAt = undefined;
    existing.cancelledBy = undefined;
    existing.match = match._id;
    existing.type = RESERVATION_TYPES.MATCH;
    existing.participants = participants;
    if (!existing.notes) {
      existing.notes = 'Reserva automática generada por partido de liga.';
    }
    await existing.save();
    return existing;
  }

  const reservation = await CourtReservation.create({
    court: match.court,
    startsAt,
    endsAt,
    createdBy: creatorId,
    status: RESERVATION_STATUS.RESERVED,
    match: match._id,
    type: RESERVATION_TYPES.MATCH,
    participants,
    notes: 'Reserva automática generada por partido de liga.',
  });

  return reservation;
}

async function cancelMatchReservation(matchId, { cancelledBy } = {}) {
  if (!matchId) {
    return null;
  }

  const reservation = await CourtReservation.findOne({ match: matchId, status: RESERVATION_STATUS.RESERVED });
  if (!reservation) {
    return null;
  }

  reservation.status = RESERVATION_STATUS.CANCELLED;
  reservation.cancelledAt = new Date();
  if (cancelledBy) {
    reservation.cancelledBy = cancelledBy;
  }

  await reservation.save();
  return reservation;
}

module.exports = {
  DEFAULT_RESERVATION_DURATION_MINUTES,
  INVALID_RESERVATION_SLOT_MESSAGE,
  RESERVATION_DAY_START_MINUTE,
  RESERVATION_DAY_END_MINUTE,
  ensureReservationAvailability,
  upsertMatchReservation,
  cancelMatchReservation,
  resolveEndsAt,
  normalizeParticipants,
};
