const { Op } = require('sequelize');
const { getSequelize } = require('../../config/database');
const { sendPushNotification } = require('../pushNotificationService');
const { sendEmailNotification } = require('../emailService');

const DEFAULT_RESERVATION_DURATION_MINUTES = 75;
const RESERVATION_DAY_START_MINUTE = 8 * 60 + 30;
const RESERVATION_DAY_END_MINUTE = 22 * 60 + 15;
const MANUAL_RESERVATION_MAX_ADVANCE_HOURS = 48;
const INVALID_RESERVATION_SLOT_MESSAGE =
  'Las reservas deben realizarse en bloques de 75 minutos entre las 08:30 y las 22:15.';

const RESERVATION_STATUS = {
  RESERVED: 'reserved',
  PRE_RESERVED: 'pre_reserved',
  CANCELLED: 'cancelled'
};

const RESERVATION_TYPES = {
  MANUAL: 'manual',
  MATCH: 'match'
};

const COURT_BLOCK_CONTEXTS = {
  LEAGUE: 'league',
  TOURNAMENT: 'tournament'
};

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
  const sequelize = getSequelize();
  const { CourtReservation, CourtBlock } = sequelize.models;

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
    where: {
      court,
      status: {
        [Op.in]: ACTIVE_RESERVATION_STATUSES
      },
      startsAt: {
        [Op.lt]: endDate
      },
      endsAt: {
        [Op.gt]: startDate
      }
    }
  };

  if (Array.isArray(excludeReservationId)) {
    if (excludeReservationId.length) {
      query.where.id = {
        [Op.notIn]: excludeReservationId
      };
    }
  } else if (excludeReservationId) {
    query.where.id = {
      [Op.ne]: excludeReservationId
    };
  }

  const overlappingReservation = await CourtReservation.findOne({
    ...query,
    attributes: ['id', 'matchId']
  });

  if (overlappingReservation) {
    const error = new Error('La pista ya está reservada en el horario seleccionado.');
    error.statusCode = 409;
    throw error;
  }

  const blockQuery = {
    where: {
      startsAt: {
        [Op.lt]: endDate
      },
      endsAt: {
        [Op.gt]: startDate
      },
      [Op.or]: [
        { courts: [] },
        { courts: { [Op.contains]: [court] } }
      ]
    },
    attributes: ['contextType', 'contextId', 'courts', 'startsAt', 'endsAt']
  };

  const blockingEntries = await CourtBlock.findAll(blockQuery);

  if (blockingEntries.length) {
    if (reservationType === RESERVATION_TYPES.MATCH && contextType && contextId) {
      const contextKey = contextId.toString();
      const allowed = blockingEntries.some((block) => {
        if (block.contextType !== contextType) {
          return false;
        }
        const blockContext = block.contextId?.toString();
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

async function resolveTournamentMatchParticipantIds(match) {
  if (!match) {
    return [];
  }

  const sequelize = getSequelize();
  const { TournamentDoublesPair } = sequelize.models;

  const players = Array.isArray(match.players) ? match.players : [];
  if (!players.length) {
    return [];
  }

  const participantIds = new Set();
  const pendingPairIds = new Set();
  const playerType = match.playerType || 'User';

  players.forEach((player) => {
    if (!player) {
      return;
    }

    if (playerType === 'TournamentDoublesPair') {
      if (typeof player === 'object' && Array.isArray(player.players) && player.players.length) {
        player.players.forEach((member) => {
          const id = extractParticipantId(member);
          if (id) {
            participantIds.add(id);
          }
        });
        return;
      }

      const pairId = extractParticipantId(player);
      if (pairId) {
        pendingPairIds.add(pairId);
      }
      return;
    }

    const participantId = extractParticipantId(player);
    if (participantId) {
      participantIds.add(participantId);
    }
  });

  if (pendingPairIds.size) {
    const pairs = await TournamentDoublesPair.findAll({
      where: {
        id: {
          [Op.in]: Array.from(pendingPairIds)
        }
      },
      attributes: ['player1Id', 'player2Id']
    });

    pairs.forEach((pair) => {
      if (pair.player1Id) participantIds.add(pair.player1Id);
      if (pair.player2Id) participantIds.add(pair.player2Id);
    });
  }

  return normalizeParticipants(Array.from(participantIds));
}

async function autoAssignCourt({ scheduledDate, excludeReservationId, preferredCourt } = {}) {
  const sequelize = getSequelize();
  const { Club } = sequelize.models;

  const startDate = toDate(scheduledDate);
  if (!startDate) {
    const error = new Error('Fecha y hora inválida.');
    error.statusCode = 400;
    throw error;
  }

  const club = await Club.findOne();
  if (!club || !club.courts || !club.courts.length) {
    const error = new Error('No hay pistas registradas en el club.');
    error.statusCode = 400;
    throw error;
  }

  const courtNames = club.courts
    .map(entry => (entry && typeof entry.name === 'string' ? entry.name.trim() : ''))
    .filter(Boolean);

  const { startsAt, endsAt } = resolveEndsAt(startDate);
  if (!startsAt || !endsAt) {
    const error = new Error('No se pudo determinar la duración del partido.');
    error.statusCode = 400;
    throw error;
  }

  const uniqueCourts = Array.from(new Set(courtNames));
  const attemptOrder = preferredCourt
    ? [preferredCourt, ...uniqueCourts.filter((name) => name !== preferredCourt)]
    : uniqueCourts;

  for (const courtName of attemptOrder) {
    try {
      await ensureReservationAvailability({
        court: courtName,
        startsAt,
        endsAt,
        excludeReservationId,
        reservationType: RESERVATION_TYPES.MATCH,
        bypassManualAdvanceLimit: true,
      });
      return courtName;
    } catch (error) {
      if (error && error.statusCode === 409) {
        continue;
      }
      if (error && error.message === INVALID_RESERVATION_SLOT_MESSAGE) {
        continue;
      }
      throw error;
    }
  }

  const error = new Error('No hay pistas disponibles para el horario seleccionado.');
  error.statusCode = 409;
  throw error;
}

function normalizeParticipants(participants = []) {
  if (!Array.isArray(participants)) {
    return [];
  }
  const normalized = new Set();
  participants.forEach((participant) => {
    if (!participant) return;
    const id = typeof participant === 'object' && participant !== null ? participant.id : participant;
    if (id) {
      normalized.add(id.toString());
    }
  });
  return Array.from(normalized);
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
  const sequelize = getSequelize();
  const { CourtReservation, User } = sequelize.models;

  const referenceDate = toDate(now) || new Date();

  const expiredReservations = await CourtReservation.findAll({
    where: {
      type: RESERVATION_TYPES.MANUAL,
      status: {
        [Op.in]: ACTIVE_RESERVATION_STATUSES
      },
      endsAt: {
        [Op.lte]: referenceDate
      }
    },
    include: [
      {
        model: User,
        as: 'participants',
        attributes: ['id', 'fullName']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName', 'email']
      }
    ]
  });

  if (!expiredReservations.length) {
    return 0;
  }

  let removed = 0;

  for (const reservation of expiredReservations) {
    try {
      const creatorId = reservation.createdBy;
      const participantIds = normalizeParticipants(reservation.participants);
      const recipientIds = participantIds.filter(id => id !== creatorId);

      if (recipientIds.length) {
        const formattedStart = formatReservationDate(reservation.startsAt);
        const metadata = {
          tipo: 'reserva_expirada',
          court: reservation.court || '',
          startsAt: reservation.startsAt?.toISOString(),
          endsAt: reservation.endsAt?.toISOString()
        };

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

      await reservation.destroy();
      removed += 1;
    } catch (error) {
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
  const sequelize = getSequelize();
  const { CourtReservation } = sequelize.models;

  if (!match || !match.id || !match.court) {
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
  const existingReservations = await CourtReservation.findAll({
    where: { matchId: match.id }
  });
  
  const excludeReservationIds = existingReservations.map(reservation => reservation?.id).filter(Boolean);

  const existing = existingReservations.find(reservation => reservation?.court === match.court) ||
    (existingReservations.length ? existingReservations[0] : null);

  let contextType;
  let contextId;
  if (match.leagueId) {
    contextType = COURT_BLOCK_CONTEXTS.LEAGUE;
    contextId = match.leagueId;
  } else if (match.tournamentId) {
    contextType = COURT_BLOCK_CONTEXTS.TOURNAMENT;
    contextId = match.tournamentId;
  }

  await ensureReservationAvailability({
    court: match.court,
    startsAt,
    endsAt,
    excludeReservationId: excludeReservationIds,
    reservationType: RESERVATION_TYPES.MATCH,
    contextType,
    contextId,
  });

  const creatorCandidate = createdBy || match.proposal?.requestedBy || match.createdBy;
  const creatorId = creatorCandidate || participants[0];
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
    await existing.update({
      court: match.court,
      startsAt,
      endsAt,
      createdBy: creatorId,
      status: reservationStatus,
      cancelledAt: null,
      cancelledBy: null,
      matchId: match.id,
      type: RESERVATION_TYPES.MATCH,
      notes: (!existing.notes ||
        existing.notes.startsWith('Reserva automática generada') ||
        existing.notes.startsWith('Pre-reserva automática')) ? defaultNotes : existing.notes
    });

    await existing.setParticipants(participants);
    return existing;
  }

  const reservation = await CourtReservation.create({
    court: match.court,
    startsAt,
    endsAt,
    createdBy: creatorId,
    status: reservationStatus,
    matchId: match.id,
    type: RESERVATION_TYPES.MATCH,
    notes: defaultNotes
  });

  await reservation.setParticipants(participants);
  return reservation;
}

async function upsertTournamentMatchReservation({ match, createdBy }) {
  const sequelize = getSequelize();
  const { CourtReservation } = sequelize.models;

  if (!match || !match.id || !match.court || !match.scheduledAt) {
    return null;
  }

  const { startsAt, endsAt } = resolveEndsAt(match.scheduledAt, match.endsAt);
  if (!startsAt || !endsAt) {
    return null;
  }

  const participants = await resolveTournamentMatchParticipantIds(match);
  const existingReservations = await CourtReservation.findAll({
    where: { tournamentMatchId: match.id }
  });
  
  const excludeReservationIds = existingReservations.map(reservation => reservation?.id).filter(Boolean);

  await ensureReservationAvailability({
    court: match.court,
    startsAt,
    endsAt,
    excludeReservationId: excludeReservationIds,
    reservationType: RESERVATION_TYPES.MATCH,
    contextType: COURT_BLOCK_CONTEXTS.TOURNAMENT,
    contextId: match.tournamentId,
    bypassManualAdvanceLimit: true,
  });

  const creatorCandidate = createdBy || match.createdBy;
  const creatorId = creatorCandidate || participants[0];
  if (!creatorId) {
    const error = new Error('No se pudo determinar el creador de la reserva del partido.');
    error.statusCode = 500;
    throw error;
  }

  const existing = existingReservations.find(reservation => reservation?.court === match.court) ||
    (existingReservations.length ? existingReservations[0] : null);

  const reservationStatus = RESERVATION_STATUS.RESERVED;
  const defaultNotes = 'Reserva automática generada por partido de torneo.';

  if (existing) {
    await existing.update({
      court: match.court,
      startsAt,
      endsAt,
      createdBy: creatorId,
      status: reservationStatus,
      cancelledAt: null,
      cancelledBy: null,
      matchId: null,
      tournamentMatchId: match.id,
      type: RESERVATION_TYPES.MATCH,
      notes: (!existing.notes || existing.notes.startsWith('Reserva automática generada')) 
        ? defaultNotes : existing.notes
    });

    await existing.setParticipants(participants);
    return existing;
  }

  const reservation = await CourtReservation.create({
    court: match.court,
    startsAt,
    endsAt,
    createdBy: creatorId,
    status: reservationStatus,
    tournamentMatchId: match.id,
    type: RESERVATION_TYPES.MATCH,
    notes: defaultNotes
  });

  await reservation.setParticipants(participants);
  return reservation;
}

async function cancelMatchReservation(matchId, { cancelledBy } = {}) {
  const sequelize = getSequelize();
  const { CourtReservation } = sequelize.models;

  if (!matchId) {
    return null;
  }

  const reservation = await CourtReservation.findOne({
    where: {
      matchId,
      status: {
        [Op.in]: ACTIVE_RESERVATION_STATUSES
      }
    }
  });

  if (!reservation) {
    return null;
  }

  await reservation.update({
    status: RESERVATION_STATUS.CANCELLED,
    cancelledAt: new Date(),
    cancelledBy: cancelledBy || null
  });

  return reservation;
}

async function cancelTournamentMatchReservation(matchId, { cancelledBy } = {}) {
  const sequelize = getSequelize();
  const { CourtReservation } = sequelize.models;

  if (!matchId) {
    return null;
  }

  const reservation = await CourtReservation.findOne({
    where: {
      tournamentMatchId: matchId,
      status: {
        [Op.in]: ACTIVE_RESERVATION_STATUSES
      }
    }
  });

  if (!reservation) {
    return null;
  }

  await reservation.update({
    status: RESERVATION_STATUS.CANCELLED,
    cancelledAt: new Date(),
    cancelledBy: cancelledBy || null
  });

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
  autoAssignCourt,
  upsertTournamentMatchReservation,
  cancelTournamentMatchReservation,
};