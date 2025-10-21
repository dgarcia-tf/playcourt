const { CourtReservation, RESERVATION_STATUS, RESERVATION_TYPES } = require('../models/CourtReservation');

const DEFAULT_RESERVATION_DURATION_MINUTES = 90;

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

  const duration = Number.isFinite(Number(durationMinutes)) ? Number(durationMinutes) : DEFAULT_RESERVATION_DURATION_MINUTES;
  const computedEnd = new Date(startDate.getTime() + duration * 60 * 1000);
  return { startsAt: startDate, endsAt: computedEnd };
}

async function ensureReservationAvailability({ court, startsAt, endsAt, excludeReservationId }) {
  if (!court || !startsAt || !endsAt) {
    const error = new Error('Los parámetros de la reserva son inválidos.');
    error.statusCode = 400;
    throw error;
  }

  if (endsAt <= startsAt) {
    const error = new Error('La hora de finalización debe ser posterior a la de inicio.');
    error.statusCode = 400;
    throw error;
  }

  const query = {
    court,
    status: RESERVATION_STATUS.RESERVED,
    $and: [
      { startsAt: { $lt: endsAt } },
      { endsAt: { $gt: startsAt } },
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

  await ensureReservationAvailability({
    court: match.court,
    startsAt,
    endsAt,
    excludeReservationId: existing?._id,
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
  ensureReservationAvailability,
  upsertMatchReservation,
  cancelMatchReservation,
  resolveEndsAt,
  normalizeParticipants,
};
