const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Match } = require('../models/Match');
const { CourtReservation, RESERVATION_STATUS, RESERVATION_TYPES } = require('../models/CourtReservation');
const { Category, MATCH_FORMATS, DEFAULT_CATEGORY_MATCH_FORMAT } = require('../models/Category');
const { Enrollment } = require('../models/Enrollment');
const { Season } = require('../models/Season');
const { Notification } = require('../models/Notification');
const { Club } = require('../models/Club');
const { User, USER_ROLES, userHasRole } = require('../models/User');
const { refreshCategoryRanking } = require('../services/rankingService');
const { MATCH_EXPIRATION_DAYS } = require('../services/matchExpirationService');
const { MATCH_RESULT_AUTO_CONFIRM_MS } = require('../config/matchResults');
const {
  notifyPendingResultConfirmation,
  notifyResultConfirmed,
  notifyScheduleConfirmationRequest,
  notifyScheduleRejected,
} = require('../services/matchNotificationService');
const { ensureLeagueIsOpen } = require('../services/leagueStatusService');
const {
  ensureReservationAvailability: ensureCourtReservationAvailability,
  upsertMatchReservation,
  cancelMatchReservation,
  resolveEndsAt,
  autoAssignCourt: assignMatchCourt,
} = require('../services/courtReservationService');
const { generateCalendarMetadata } = require('../utils/calendarLinks');

const MATCH_STATUSES = ['pendiente', 'propuesto', 'programado', 'revision', 'completado', 'caducado'];
const ACTIVE_STATUSES = MATCH_STATUSES.filter((status) => !['completado', 'caducado'].includes(status));
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MIN_MATCH_DURATION_MS = 75 * 60 * 1000;
const MATCH_EXPIRATION_MS = MATCH_EXPIRATION_DAYS * DAY_IN_MS;
const MATCH_RESULT_AUTO_CONFIRM_TIMEOUT_MS = MATCH_RESULT_AUTO_CONFIRM_MS;
const ACTIVE_RESERVATION_STATUSES = [RESERVATION_STATUS.RESERVED, RESERVATION_STATUS.PRE_RESERVED];

async function ensureCategoryLeagueAllowsChanges(category, message) {
  if (!category || !category.league) {
    return;
  }

  await ensureLeagueIsOpen(category.league, message);
}

async function ensureMatchLeagueAllowsChanges(match, message) {
  if (!match) {
    return;
  }

  await match.populate({ path: 'league', select: 'status endDate closedAt' });

  if (match.league) {
    await ensureLeagueIsOpen(match.league, message);
    return;
  }

  if (match.category) {
    const category = await Category.findById(match.category).select('league');
    if (category?.league) {
      await ensureLeagueIsOpen(category.league, message);
    }
  }
}

function normalizeMatchFormat(value) {
  return Object.values(MATCH_FORMATS).includes(value) ? value : DEFAULT_CATEGORY_MATCH_FORMAT;
}

function validateSetsForMatchFormat({ matchFormat, sets = [], winnerId, playerIds = [] }) {
  if (!Array.isArray(sets) || !sets.length) {
    return;
  }

  const normalizedWinnerId = winnerId ? winnerId.toString() : null;
  const players = Array.from(new Set(playerIds.map((playerId) => playerId && playerId.toString()))).filter(
    Boolean
  );

  if (players.length !== 2) {
    return;
  }

  const format = normalizeMatchFormat(matchFormat);
  const sortedSets = [...sets].sort((a, b) => a.number - b.number);

  const ensureSequentialSetNumbers = () => {
    sortedSets.forEach((set, index) => {
      const expectedNumber = index + 1;
      if (set.number !== expectedNumber) {
        throw new Error('Los sets deben registrarse en orden correlativo.');
      }
    });
  };

  const getScoresForSet = (set) =>
    players.map((playerId) => ({
      playerId,
      value: Number(set.scores?.[playerId]) || 0,
    }));

  if (
    format === MATCH_FORMATS.TWO_SETS_SIX_GAMES_SUPER_TB ||
    format === MATCH_FORMATS.TWO_SETS_FOUR_GAMES_SUPER_TB
  ) {
    if (sortedSets.length < 2 || sortedSets.length > 3) {
      throw new Error('El formato al mejor de tres requiere registrar dos o tres sets.');
    }

    ensureSequentialSetNumbers();

    const requiredGames =
      format === MATCH_FORMATS.TWO_SETS_SIX_GAMES_SUPER_TB ? 6 : 4;
    const setWins = new Map(players.map((playerId) => [playerId, 0]));

    sortedSets.forEach((set, index) => {
      if (index < 2 && set.tieBreak) {
        throw new Error('Los dos primeros sets no pueden marcarse como super tie-break.');
      }

      if (index === 2) {
        set.tieBreak = true;
      }

      const scores = getScoresForSet(set);
      const [firstScore, secondScore] = scores;

      if (firstScore.value === secondScore.value) {
        throw new Error('Cada set debe tener un ganador.');
      }

      const winnerEntry = firstScore.value > secondScore.value ? firstScore : secondScore;
      const loserEntry = firstScore.value > secondScore.value ? secondScore : firstScore;

      if (index < 2) {
        if (winnerEntry.value < requiredGames) {
          throw new Error(`Los sets se deben cerrar al llegar al menos a ${requiredGames} juegos.`);
        }
      } else {
        if (!set.tieBreak) {
          throw new Error('El tercer set debe registrarse como super tie-break.');
        }
        if (winnerEntry.value <= loserEntry.value) {
          throw new Error('El super tie-break debe tener un ganador con más puntos.');
        }
        if (winnerEntry.value < 7) {
          throw new Error('El super tie-break debe alcanzar al menos 7 puntos.');
        }
      }

      const currentWins = setWins.get(winnerEntry.playerId) || 0;
      setWins.set(winnerEntry.playerId, currentWins + 1);
    });

    const wins = players.map((playerId) => setWins.get(playerId) || 0);
    const maxWins = Math.max(...wins);
    const minWins = Math.min(...wins);

    if (maxWins < 2) {
      throw new Error('El ganador debe obtener al menos dos sets.');
    }

    if (maxWins === minWins) {
      throw new Error('Los sets reportados no determinan un ganador.');
    }

    const computedWinner = players.find((playerId) => (setWins.get(playerId) || 0) === maxWins);

    if (computedWinner !== normalizedWinnerId) {
      throw new Error('El ganador indicado no coincide con los sets reportados.');
    }

    if (sortedSets.length === 2 && maxWins !== 2) {
      throw new Error('Un partido al mejor de tres debe cerrarse con dos sets ganados.');
    }

    if (sortedSets.length === 3 && !(maxWins === 2 && minWins === 1)) {
      throw new Error('El super tie-break debe definir al ganador del partido.');
    }

    return;
  }

  if (format === MATCH_FORMATS.SINGLE_SET_TEN_GAMES_SUPER_TB) {
    if (sortedSets.length < 1 || sortedSets.length > 2) {
      throw new Error('El formato a 10 juegos permite registrar uno o dos sets.');
    }

    ensureSequentialSetNumbers();

    const setWins = new Map(players.map((playerId) => [playerId, 0]));
    let mainSetWasTie = false;
    let tieBreakPlayed = false;

    sortedSets.forEach((set, index) => {
      const scores = getScoresForSet(set);
      const [firstScore, secondScore] = scores;

      if (index === 0) {
        if (set.tieBreak) {
          throw new Error('El set principal no puede marcarse como super tie-break.');
        }

        if (firstScore.value === secondScore.value) {
          mainSetWasTie = true;
          const minimumGamesToForceTieBreak = 5;
          if (
            firstScore.value < minimumGamesToForceTieBreak ||
            secondScore.value < minimumGamesToForceTieBreak
          ) {
            throw new Error(
              'El set principal debe alcanzar al menos 5 juegos por jugador para forzar el super tie-break.'
            );
          }

          if (sortedSets.length === 1) {
            throw new Error('Si el set principal termina empatado se debe registrar el super tie-break.');
          }

          return;
        }

        const winnerEntry = firstScore.value > secondScore.value ? firstScore : secondScore;
        const totalGames = firstScore.value + secondScore.value;

        if (totalGames < 10) {
          throw new Error('El set principal debe acumular al menos 10 juegos entre ambos jugadores.');
        }

        const currentWins = setWins.get(winnerEntry.playerId) || 0;
        setWins.set(winnerEntry.playerId, currentWins + 1);
      } else {
        if (!set.tieBreak) {
          throw new Error('El super tie-break debe registrarse como tal.');
        }

        tieBreakPlayed = true;

        if (firstScore.value === secondScore.value) {
          throw new Error('El super tie-break debe tener un ganador con más puntos.');
        }

        const winnerEntry = firstScore.value > secondScore.value ? firstScore : secondScore;
        const loserEntry = firstScore.value > secondScore.value ? secondScore : firstScore;

        if (winnerEntry.value <= loserEntry.value) {
          throw new Error('El super tie-break debe tener un ganador con más puntos.');
        }

        if (winnerEntry.value < 10) {
          throw new Error('El super tie-break debe alcanzar al menos 10 puntos.');
        }

        const currentWins = setWins.get(winnerEntry.playerId) || 0;
        setWins.set(winnerEntry.playerId, currentWins + 1);
      }
    });

    if (tieBreakPlayed && !mainSetWasTie) {
      throw new Error('El super tie-break solo debe registrarse cuando el set principal termina empatado.');
    }

    const wins = players.map((playerId) => setWins.get(playerId) || 0);
    const maxWins = Math.max(...wins);
    const minWins = Math.min(...wins);

    if (tieBreakPlayed) {
      if (maxWins === minWins) {
        throw new Error('Los sets reportados no determinan un ganador.');
      }

      if (!(maxWins === 1 && minWins === 0)) {
        throw new Error('El super tie-break debe definir al ganador del partido.');
      }
    } else if (!(maxWins === 1 && minWins === 0)) {
      throw new Error('El partido debe registrar un ganador en el set principal.');
    }

    const computedWinner = players.find((playerId) => (setWins.get(playerId) || 0) === maxWins);

    if (computedWinner !== normalizedWinnerId) {
      throw new Error('El ganador indicado no coincide con los sets reportados.');
    }
  }
}

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
      tieBreak: Boolean(set.tieBreak),
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

  await ensureCategoryLeagueAllowsChanges(
    category,
    'La liga está cerrada y no admite la creación de nuevos partidos.'
  );

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
    const confirmationMap = new Map();
    normalizedPlayers
      .filter(Boolean)
      .forEach((playerId) => {
        confirmationMap.set(playerId, { status: 'pendiente' });
      });
    if (confirmationMap.size) {
      matchPayload.scheduleConfirmation = {
        status: 'pendiente',
        requestedAt: new Date(),
        confirmations: confirmationMap,
      };
    }
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
    if (!resolvedCourt && !matchPayload.court) {
      try {
        const assignedCourt = await assignMatchCourt({ scheduledDate });
        matchPayload.court = assignedCourt;
      } catch (error) {
        return res.status(error.statusCode || 400).json({ message: error.message });
      }
    }

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
          reservationType: RESERVATION_TYPES.MATCH,
          bypassManualAdvanceLimit: true,
        });
      } catch (error) {
        return res.status(error.statusCode || 400).json({ message: error.message });
      }
    }
  }

  const match = await Match.create(matchPayload);

  if (match.scheduleConfirmation?.status === 'pendiente' && match.scheduledAt) {
    await match.populate('category', 'name');
    await match.populate('players', 'fullName email notifyMatchRequests');
    await notifyScheduleConfirmationRequest(match, req.user.id);
  }
  let responseCalendarLinks = {};
  if (match.scheduledAt) {
    const reminderAt = new Date(match.scheduledAt.getTime() - 60 * 60 * 1000);
    const scheduledReminder = reminderAt > new Date() ? reminderAt : match.scheduledAt;
    const opponentNames = enrollments.map((enrollment) => enrollment.user.fullName).join(' vs ');
    const { startsAt: eventStart, endsAt: eventEnd } = resolveEndsAt(match.scheduledAt);
    const calendarMetadata = generateCalendarMetadata({
      title: opponentNames ? `Partido: ${opponentNames}` : 'Partido programado',
      description: [
        opponentNames ? `Partido entre ${opponentNames}.` : 'Partido programado.',
        category?.name ? `Categoría: ${category.name}.` : null,
        match.court ? `Pista: ${match.court}.` : null,
      ]
        .filter(Boolean)
        .join(' '),
      location: match.court,
      startsAt: eventStart,
      endsAt: eventEnd,
    });
    responseCalendarLinks = calendarMetadata;
    const notificationMetadata = {};
    if (category?.name) {
      notificationMetadata.categoria = category.name;
    }
    if (match.court) {
      notificationMetadata.pista = match.court;
    }
    Object.entries(calendarMetadata).forEach(([key, value]) => {
      if (value) {
        notificationMetadata[key] = value;
      }
    });

    try {
      await Notification.create({
        title: 'Recordatorio de partido',
        message: `Partido programado ${opponentNames} el ${match.scheduledAt.toISOString()} en la pista ${match.court || 'por definir'}.`,
        channel: 'app',
        scheduledFor: scheduledReminder,
        recipients: players,
        match: match._id,
        metadata: notificationMetadata,
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

  if (responseCalendarLinks && Object.keys(responseCalendarLinks).length) {
    const responseBody = match.toObject({ virtuals: true, flattenMaps: true });
    responseBody.calendarLinks = responseCalendarLinks;
    return res.status(201).json(responseBody);
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
    .populate('category', 'name gender color matchFormat')
    .populate('league', 'name year status')
    .populate('season', 'name year')
    .populate('players', 'fullName email gender')
    .populate('result.winner', 'fullName email gender')
    .populate('proposal.requestedBy', 'fullName email phone')
    .populate('proposal.requestedTo', 'fullName email phone')
    .sort({ scheduledAt: 1, createdAt: 1 });
  const responsePayload = matches.map((matchDoc) => {
    if (!matchDoc) {
      return matchDoc;
    }

    const plainMatch =
      typeof matchDoc.toObject === 'function'
        ? matchDoc.toObject({ virtuals: true, flattenMaps: true })
        : matchDoc;

    if (!plainMatch?.scheduledAt) {
      return plainMatch;
    }

    const { startsAt: eventStart, endsAt: eventEnd } = resolveEndsAt(plainMatch.scheduledAt);
    if (!eventStart || !eventEnd || eventEnd <= eventStart) {
      return plainMatch;
    }

    const opponentNames = Array.isArray(plainMatch.players)
      ? plainMatch.players
          .map((player) => player?.fullName || player?.email)
          .filter(Boolean)
          .join(' vs ')
      : '';

    const calendarMetadata = generateCalendarMetadata({
      title: opponentNames ? `Partido: ${opponentNames}` : 'Partido programado',
      description: [
        opponentNames ? `Partido entre ${opponentNames}.` : 'Partido programado.',
        plainMatch.category?.name ? `Categoría: ${plainMatch.category.name}.` : null,
        plainMatch.league?.name ? `Liga: ${plainMatch.league.name}.` : null,
        plainMatch.court ? `Pista: ${plainMatch.court}.` : null,
      ]
        .filter(Boolean)
        .join(' '),
      location: plainMatch.court,
      startsAt: eventStart,
      endsAt: eventEnd,
    });

    if (calendarMetadata && Object.keys(calendarMetadata).length) {
      plainMatch.calendarLinks = calendarMetadata;
    }

    return plainMatch;
  });

  return res.json(responsePayload);
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

  const previousScheduledAtTime =
    match.scheduledAt instanceof Date && !Number.isNaN(match.scheduledAt.getTime())
      ? match.scheduledAt.getTime()
      : null;
  const previousCourtValue = typeof match.court === 'string' ? match.court : '';

  await ensureMatchLeagueAllowsChanges(
    match,
    'La liga está cerrada y no permite editar partidos.'
  );

  const existingReservation = await CourtReservation.findOne({
    match: matchId,
    status: { $in: ACTIVE_RESERVATION_STATUSES },
  });

  let targetCategoryId = match.category?.toString();
  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    await ensureCategoryLeagueAllowsChanges(
      category,
      'La liga está cerrada y no permite editar partidos.'
    );

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
      match.court = undefined;
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
    if (!match.court) {
      try {
        match.court = await assignMatchCourt({
          scheduledDate: match.scheduledAt,
          excludeReservationId: existingReservation?._id,
          preferredCourt: previousCourtValue,
        });
      } catch (error) {
        return res.status(error.statusCode || 400).json({ message: error.message });
      }
    }

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
          reservationType: RESERVATION_TYPES.MATCH,
          bypassManualAdvanceLimit: true,
        });
      } catch (error) {
        return res.status(error.statusCode || 400).json({ message: error.message });
      }
    }
  }

  const currentScheduledAtTime =
    match.scheduledAt instanceof Date && !Number.isNaN(match.scheduledAt.getTime())
      ? match.scheduledAt.getTime()
      : null;
  const currentCourtValue = typeof match.court === 'string' ? match.court : '';
  const scheduledAtChanged = previousScheduledAtTime !== currentScheduledAtTime;
  const courtChanged = previousCourtValue !== currentCourtValue;

  let scheduleConfirmationRequested = false;
  if (currentScheduledAtTime && (scheduledAtChanged || courtChanged)) {
    const playerIds = Array.isArray(match.players)
      ? match.players
          .map((playerId) => (playerId && typeof playerId.toString === 'function' ? playerId.toString() : null))
          .filter(Boolean)
      : [];

    if (playerIds.length) {
      const confirmationMap = new Map();
      playerIds.forEach((playerId) => {
        confirmationMap.set(playerId, { status: 'pendiente' });
      });

      match.scheduleConfirmation = {
        status: 'pendiente',
        requestedAt: new Date(),
        confirmations: confirmationMap,
      };
      match.markModified('scheduleConfirmation');
      match.markModified('scheduleConfirmation.confirmations');
      scheduleConfirmationRequested = true;
    }
  } else if (!currentScheduledAtTime && match.scheduleConfirmation) {
    match.scheduleConfirmation = undefined;
    match.markModified('scheduleConfirmation');
  }

  const shouldSyncReservation =
    match.status === 'programado' && Boolean(match.scheduledAt) && Boolean(match.court);

  await match.save();

  const updated = await Match.findById(matchId)
    .populate('category', 'name gender color matchFormat')
    .populate('league', 'name year status')
    .populate('season', 'name year')
    .populate('players', 'fullName email gender phone')
    .populate('proposal.requestedBy', 'fullName email phone')
    .populate('proposal.requestedTo', 'fullName email phone');
  let responseCalendarLinks = {};

  if (updated?.scheduledAt) {
    const { startsAt: eventStart, endsAt: eventEnd } = resolveEndsAt(updated.scheduledAt);
    const opponentNames = Array.isArray(updated.players)
      ? updated.players
          .map((player) => player?.fullName || player?.email)
          .filter(Boolean)
          .join(' vs ')
      : '';

    responseCalendarLinks = generateCalendarMetadata({
      title: opponentNames ? `Partido: ${opponentNames}` : 'Partido programado',
      description: [
        opponentNames ? `Partido entre ${opponentNames}.` : 'Partido programado.',
        updated.category?.name ? `Categoría: ${updated.category.name}.` : null,
        updated.league?.name ? `Liga: ${updated.league.name}.` : null,
        updated.court ? `Pista: ${updated.court}.` : null,
      ]
        .filter(Boolean)
        .join(' '),
      location: updated.court,
      startsAt: eventStart,
      endsAt: eventEnd,
    });
  }

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

  if (scheduleConfirmationRequested) {
    try {
      await notifyScheduleConfirmationRequest(updated, req.user.id);
    } catch (error) {
      console.error('No se pudo enviar la notificación de confirmación de horario', error);
    }
  }

  if (responseCalendarLinks && Object.keys(responseCalendarLinks).length) {
    const responseBody = updated.toObject({ virtuals: true, flattenMaps: true });
    responseBody.calendarLinks = responseCalendarLinks;
    return res.json(responseBody);
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

  await ensureMatchLeagueAllowsChanges(
    match,
    'La liga está cerrada y no permite eliminar partidos.'
  );

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
    .populate('category', 'name color matchFormat')
    .populate('league', 'name year status');

  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  await ensureMatchLeagueAllowsChanges(
    match,
    'La liga está cerrada y no permite registrar resultados.'
  );

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

  try {
    validateSetsForMatchFormat({
      matchFormat: match.category?.matchFormat,
      sets: sanitizedSets,
      winnerId,
      playerIds,
    });
  } catch (validationError) {
    return res.status(400).json({ message: validationError.message });
  }

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
  match.result.autoConfirmAt = isAdmin
    ? undefined
    : new Date(now.getTime() + MATCH_RESULT_AUTO_CONFIRM_TIMEOUT_MS);

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
    match.result.autoConfirmAt = undefined;
  } else {
    match.result.status = 'en_revision';
    match.status = 'revision';
  }

  await match.save();

  if (isAdmin) {
    await refreshCategoryRanking(match.category);
  }

  const populated = await Match.findById(matchId)
    .populate('category', 'name gender color matchFormat')
    .populate('league', 'name year status')
    .populate('season', 'name year')
    .populate('players', 'fullName email gender phone')
    .populate('proposal.requestedBy', 'fullName email phone')
    .populate('proposal.requestedTo', 'fullName email phone')
    .populate('result.winner', 'fullName email');

  if (match.result.status === 'confirmado') {
    await notifyResultConfirmed(populated, requesterId);
  } else if (!isAdmin) {
    await notifyPendingResultConfirmation(populated, requesterId);
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

  await ensureMatchLeagueAllowsChanges(
    match,
    'La liga está cerrada y no permite confirmar resultados.'
  );

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
    match.result.autoConfirmAt = undefined;
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
      .populate('category', 'name gender color matchFormat')
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
    match.result.autoConfirmAt = undefined;
  }

  match.result.confirmations = confirmations;
  match.markModified('result.confirmations');

  if (allApproved || isAdmin) {
    match.result.status = 'confirmado';
    match.status = 'completado';
    match.result.confirmedBy = userId;
    match.result.confirmedAt = now;
    match.result.autoConfirmAt = undefined;
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
    .populate('category', 'name gender color matchFormat')
    .populate('league', 'name year status')
    .populate('season', 'name year')
    .populate('players', 'fullName email gender phone')
    .populate('proposal.requestedBy', 'fullName email phone')
    .populate('proposal.requestedTo', 'fullName email phone')
    .populate('result.winner', 'fullName email');

  if (match.result.status === 'confirmado') {
    await notifyResultConfirmed(populated, userId);
  }

  return res.json(populated);
}

async function respondToScheduleConfirmation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { matchId } = req.params;
  const { decision, reason } = req.body;

  const match = await Match.findById(matchId)
    .populate('category', 'name gender color matchFormat')
    .populate('league', 'name year status')
    .populate('season', 'name year')
    .populate('players', 'fullName email gender phone');

  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  await ensureMatchLeagueAllowsChanges(
    match,
    'La liga está cerrada y no permite confirmar horarios.'
  );

  if (!match.scheduleConfirmation || !match.scheduleConfirmation.confirmations) {
    return res
      .status(400)
      .json({ message: 'No hay una programación pendiente de confirmación para este partido.' });
  }

  if (match.scheduleConfirmation.status === 'confirmado') {
    return res.status(400).json({ message: 'La fecha del partido ya fue confirmada.' });
  }

  if (match.scheduleConfirmation.status === 'rechazado') {
    return res.status(400).json({ message: 'Debes esperar a que el administrador reprograme el partido.' });
  }

  const playerIds = Array.isArray(match.players)
    ? match.players
        .map((player) => {
          if (!player) {
            return null;
          }
          if (typeof player === 'string') {
            return player;
          }
          if (player._id) {
            return player._id.toString();
          }
          if (typeof player.toString === 'function') {
            return player.toString();
          }
          return null;
        })
        .filter(Boolean)
    : [];

  const userId = req.user.id;

  if (!playerIds.includes(userId)) {
    return res.status(403).json({ message: 'Solo los jugadores del partido pueden responder.' });
  }

  const now = new Date();
  const rawConfirmations = match.scheduleConfirmation.confirmations;
  const confirmationMap =
    rawConfirmations instanceof Map
      ? new Map(rawConfirmations)
      : new Map(Object.entries(rawConfirmations || {}));

  if (decision === 'accept') {
    confirmationMap.set(userId, { status: 'aprobado', respondedAt: now });

    const allApproved = playerIds.every((playerId) => {
      const entry = confirmationMap.get(playerId);
      return entry?.status === 'aprobado';
    });

    match.scheduleConfirmation.status = allApproved ? 'confirmado' : 'pendiente';
    match.scheduleConfirmation.confirmedAt = allApproved ? now : undefined;
    match.scheduleConfirmation.confirmedBy = allApproved ? userId : undefined;
    match.scheduleConfirmation.rejectedAt = undefined;
    match.scheduleConfirmation.rejectedBy = undefined;
  } else {
    const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
    if (!trimmedReason) {
      return res
        .status(400)
        .json({ message: 'Debes indicar un motivo para rechazar la fecha propuesta.' });
    }

    confirmationMap.set(userId, {
      status: 'rechazado',
      respondedAt: now,
      reason: trimmedReason,
    });

    match.scheduleConfirmation.status = 'rechazado';
    match.scheduleConfirmation.rejectedAt = now;
    match.scheduleConfirmation.rejectedBy = userId;
    match.scheduleConfirmation.confirmedAt = undefined;
    match.scheduleConfirmation.confirmedBy = undefined;
    match.status = 'pendiente';
    match.expiresAt = new Date(Date.now() + MATCH_EXPIRATION_MS);
  }

  match.scheduleConfirmation.confirmations = confirmationMap;
  match.markModified('scheduleConfirmation.confirmations');
  match.markModified('scheduleConfirmation');

  await match.save();

  const populated = await Match.findById(matchId)
    .populate('category', 'name gender color matchFormat')
    .populate('league', 'name year status')
    .populate('season', 'name year')
    .populate('players', 'fullName email gender phone');

  let responseCalendarLinks = {};
  if (populated?.scheduledAt) {
    const { startsAt: eventStart, endsAt: eventEnd } = resolveEndsAt(populated.scheduledAt);
    if (eventStart && eventEnd && eventEnd > eventStart) {
      const opponentNames = Array.isArray(populated.players)
        ? populated.players
            .map((player) => player?.fullName || player?.email)
            .filter(Boolean)
            .join(' vs ')
        : '';

      responseCalendarLinks = generateCalendarMetadata({
        title: opponentNames ? `Partido: ${opponentNames}` : 'Partido programado',
        description: [
          opponentNames ? `Partido entre ${opponentNames}.` : 'Partido programado.',
          populated.category?.name ? `Categoría: ${populated.category.name}.` : null,
          populated.league?.name ? `Liga: ${populated.league.name}.` : null,
          populated.court ? `Pista: ${populated.court}.` : null,
        ]
          .filter(Boolean)
          .join(' '),
        location: populated.court,
        startsAt: eventStart,
        endsAt: eventEnd,
      });
    }
  }

  if (decision === 'reject') {
    try {
      const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
      await notifyScheduleRejected(populated, userId, trimmedReason);
    } catch (error) {
      console.error('No se pudo notificar el rechazo de la programación', error);
    }
  }

  const responsePayload = populated.toObject({ virtuals: true, flattenMaps: true });
  if (responseCalendarLinks && Object.keys(responseCalendarLinks).length) {
    responsePayload.calendarLinks = responseCalendarLinks;
  }

  return res.json(responsePayload);
}

async function generateCategoryMatches(req, res) {
  const { categoryId } = req.params;

  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }

  await ensureCategoryLeagueAllowsChanges(
    category,
    'La liga está cerrada y no permite generar partidos.'
  );

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
  const { proposedFor, message } = req.body;

  const match = await Match.findById(matchId);
  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  await ensureMatchLeagueAllowsChanges(
    match,
    'La liga está cerrada y no permite proponer nuevas fechas.'
  );

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

  const previousCourtValue = typeof match.court === 'string' ? match.court : undefined;

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

  const existingReservation = await CourtReservation.findOne({
    match: matchId,
    status: { $in: ACTIVE_RESERVATION_STATUSES },
  });

  const { startsAt: reservationStart, endsAt: reservationEnd } = resolveEndsAt(proposedDate);
  try {
    const assignedCourt = await assignMatchCourt({
      scheduledDate: proposedDate,
      excludeReservationId: existingReservation?._id,
      preferredCourt: previousCourtValue,
    });
    match.court = assignedCourt;
    await ensureCourtReservationAvailability({
      court: match.court,
      startsAt: reservationStart,
      endsAt: reservationEnd,
      excludeReservationId: existingReservation?._id,
      reservationType: RESERVATION_TYPES.MATCH,
      bypassManualAdvanceLimit: true,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }

  await match.save();

  try {
    await upsertMatchReservation({ match, createdBy: requesterId });
  } catch (error) {
    console.error('No se pudo crear la pre-reserva de pista para la propuesta', error);
  }

  const populated = await Match.findById(matchId)
    .populate('category', 'name gender color matchFormat')
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
  const { decision } = req.body;

  const match = await Match.findById(matchId);
  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  await ensureMatchLeagueAllowsChanges(
    match,
    'La liga está cerrada y no permite gestionar propuestas de partidos.'
  );

  if (!match.proposal || !match.proposal.requestedTo) {
    return res.status(400).json({ message: 'No hay una propuesta pendiente para este partido.' });
  }

  if (match.status === 'caducado') {
    return res
      .status(400)
      .json({ message: 'El partido caducó y no admite respuestas a propuestas anteriores.' });
  }

  const existingReservation = await CourtReservation.findOne({
    match: matchId,
    status: { $in: ACTIVE_RESERVATION_STATUSES },
  });

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
    if (!match.court) {
      try {
        match.court = await assignMatchCourt({
          scheduledDate: proposedDate,
          excludeReservationId: existingReservation?._id,
        });
      } catch (error) {
        return res.status(error.statusCode || 400).json({ message: error.message });
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
          reservationType: RESERVATION_TYPES.MATCH,
          bypassManualAdvanceLimit: true,
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
    .populate('category', 'name gender color matchFormat')
    .populate('league', 'name year status')
    .populate('players', 'fullName email phone')
    .populate('proposal.requestedBy', 'fullName email phone')
    .populate('proposal.requestedTo', 'fullName email phone');
  let responseCalendarLinks = {};

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
      const { startsAt: eventStart, endsAt: eventEnd } = resolveEndsAt(match.scheduledAt);
      const calendarMetadata = generateCalendarMetadata({
        title: opponentNames ? `Partido: ${opponentNames}` : 'Partido programado',
        description: [
          opponentNames ? `Partido entre ${opponentNames}.` : 'Partido programado.',
          populated.category?.name ? `Categoría: ${populated.category.name}.` : null,
          populated.league?.name ? `Liga: ${populated.league.name}.` : null,
          match.court ? `Pista: ${match.court}.` : null,
        ]
          .filter(Boolean)
          .join(' '),
        location: match.court,
        startsAt: eventStart,
        endsAt: eventEnd,
      });
      responseCalendarLinks = calendarMetadata;
      const notificationMetadata = {};
      if (populated.category?.name) {
        notificationMetadata.categoria = populated.category.name;
      }
      if (match.court) {
        notificationMetadata.pista = match.court;
      }
      Object.entries(calendarMetadata).forEach(([key, value]) => {
        if (value) {
          notificationMetadata[key] = value;
        }
      });

      try {
        await Notification.create({
          title: 'Partido confirmado',
          message: messageText,
          channel: 'app',
          scheduledFor: match.scheduledAt,
          recipients: Array.from(recipientSet),
          match: match._id,
          metadata: notificationMetadata,
          createdBy: userId,
        });
      } catch (error) {
        console.error('No se pudo crear la notificación de confirmación', error);
      }
    }
  }

  const responsePayload = populated.toObject({ virtuals: true, flattenMaps: true });
  if (responseCalendarLinks && Object.keys(responseCalendarLinks).length) {
    responsePayload.calendarLinks = responseCalendarLinks;
  }

  return res.json(responsePayload);
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
  respondToScheduleConfirmation,
  respondToProposal,
};
