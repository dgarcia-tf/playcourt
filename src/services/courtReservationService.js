const { CourtReservation, RESERVATION_STATUS, RESERVATION_TYPES } = require('../models/CourtReservation');
const { CourtBlock, COURT_BLOCK_CONTEXTS } = require('../models/CourtBlock');
const { sendPushNotification } = require('./pushNotificationService');
const { sendEmailNotification } = require('./emailService');

const DEFAULT_RESERVATION_DURATION_MINUTES = 75;
const RESERVATION_DAY_START_MINUTE = 8 * 60 + 30;
const RESERVATION_DAY_END_MINUTE = 22 * 60 + 15;
const MANUAL_RESERVATION_MAX_ADVANCE_HOURS = 48;
const INVALID_RESERVATION_SLOT_MESSAGE =
  'Las reservas deben realizarse en bloques de 75 minutos entre las 08:30 y las 22:15.';
const ACTIVE_RESERVATION_STATUSES = [RESERVATION_STATUS.RESERVED, RESERVATION_STATUS.PRE_RESERVED];

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
  bypassManualAdvanceLimit = false,
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

  if (reservationType === RESERVATION_TYPES.MANUAL && !bypassManualAdvanceLimit) {
    const now = new Date();
    const maxAdvanceMs = MANUAL_RESERVATION_MAX_ADVANCE_HOURS * 60 * 60 * 1000;
    if (startDate.getTime() - now.getTime() > maxAdvanceMs) {
      const error = new Error('Las reservas solo pueden realizarse con hasta 48 horas de antelación.');
      error.statusCode = 400;
      throw error;
    }
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
    status: { $in: ACTIVE_RESERVATION_STATUSES },
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

function formatReservationDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  try {
    return date.toLocaleString('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (error) {
    return date.toLocaleString('es-ES');
  }
}

async function cleanupExpiredManualReservations({ now = new Date() } = {}) {
  const referenceDate = toDate(now) || new Date();

  const expiredReservations = await CourtReservation.find({
    type: RESERVATION_TYPES.MANUAL,
    status: { $in: ACTIVE_RESERVATION_STATUSES },
    endsAt: { $lte: referenceDate },
  })
    .populate('participants', '_id fullName')
    .populate('createdBy', '_id fullName email');

  if (!expiredReservations.length) {
    return 0;
  }

  let removed = 0;

  for (const reservation of expiredReservations) {
    try {
      const creatorId = reservation?.createdBy?._id
        ? reservation.createdBy._id.toString()
        : reservation?.createdBy?.toString?.();
      const participantIds = normalizeParticipants(reservation.participants);
      const recipientIds = participantIds.filter((participantId) => {
        if (!participantId) {
          return false;
        }
        return participantId !== creatorId;
      });

      if (recipientIds.length) {
        const formattedStart = formatReservationDate(reservation.startsAt);
        const metadata = {
          tipo: 'reserva_expirada',
          court: reservation.court || '',
        };
        if (reservation.startsAt instanceof Date && !Number.isNaN(reservation.startsAt.getTime())) {
          metadata.startsAt = reservation.startsAt.toISOString();
        }
        if (reservation.endsAt instanceof Date && !Number.isNaN(reservation.endsAt.getTime())) {
          metadata.endsAt = reservation.endsAt.toISOString();
        }

        const notificationPayload = {
          title: 'Reserva eliminada automáticamente',
          message:
            formattedStart && reservation.court
              ? `La reserva de la pista ${reservation.court} para ${formattedStart} se ha eliminado automáticamente al haber vencido.`
              : 'Una reserva de pista se ha eliminado automáticamente al haber vencido.',
          recipients: recipientIds,
          metadata,
        };

        await Promise.allSettled([
          sendPushNotification({ ...notificationPayload }),
          sendEmailNotification({ ...notificationPayload }),
        ]);
      }

      await CourtReservation.deleteOne({ _id: reservation._id });
      removed += 1;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('No se pudo limpiar una reserva expirada', error);
    }
  }

  return removed;
}

function resolveMatchReservationWindow(match) {
  if (!match) {
    return { startsAt: null, endsAt: null };
  }

  if (match.scheduledAt) {
    return resolveEndsAt(match.scheduledAt, match.endsAt);
  }

  const proposedDate = match.proposal?.proposedFor;
  if (proposedDate) {
    return resolveEndsAt(proposedDate, match.proposal?.endsAt);
  }

  return { startsAt: null, endsAt: null };
}

async function upsertMatchReservation({ match, createdBy }) {
  if (!match || !match._id || !match.court) {
    return null;
  }

  const hasScheduledDate = Boolean(match.scheduledAt);
  const hasProposalDate = Boolean(match.proposal?.proposedFor);
  if (!hasScheduledDate && !hasProposalDate) {
    return null;
  }

  const { startsAt, endsAt } = resolveMatchReservationWindow(match);
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

  const reservationStatus = hasScheduledDate
    ? RESERVATION_STATUS.RESERVED
    : RESERVATION_STATUS.PRE_RESERVED;
  const defaultNotes = hasScheduledDate
    ? 'Reserva automática generada por partido de liga.'
    : 'Pre-reserva automática generada por propuesta de partido.';

  if (existing) {
    existing.court = match.court;
    existing.startsAt = startsAt;
    existing.endsAt = endsAt;
    existing.createdBy = creatorId;
    existing.status = reservationStatus;
    existing.cancelledAt = undefined;
    existing.cancelledBy = undefined;
    existing.match = match._id;
    existing.type = RESERVATION_TYPES.MATCH;
    existing.participants = participants;
    if (
      !existing.notes ||
      existing.notes.startsWith('Reserva automática generada') ||
      existing.notes.startsWith('Pre-reserva automática')
    ) {
      existing.notes = defaultNotes;
    }
    await existing.save();
    return existing;
  }

  const reservation = await CourtReservation.create({
    court: match.court,
    startsAt,
    endsAt,
    createdBy: creatorId,
    status: reservationStatus,
    match: match._id,
    type: RESERVATION_TYPES.MATCH,
    participants,
    notes: defaultNotes,
  });

  return reservation;
}

async function cancelMatchReservation(matchId, { cancelledBy } = {}) {
  if (!matchId) {
    return null;
  }

  const reservation = await CourtReservation.findOne({
    match: matchId,
    status: { $in: ACTIVE_RESERVATION_STATUSES },
  });
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
  MANUAL_RESERVATION_MAX_ADVANCE_HOURS,
  ensureReservationAvailability,
  upsertMatchReservation,
  cancelMatchReservation,
  resolveEndsAt,
  normalizeParticipants,
  cleanupExpiredManualReservations,
};
