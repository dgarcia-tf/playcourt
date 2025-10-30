const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Tournament, TOURNAMENT_STATUS } = require('../models/Tournament');
const {
  TournamentCategory,
  TOURNAMENT_CATEGORY_STATUSES,
  TOURNAMENT_CATEGORY_MATCH_TYPES,
  TOURNAMENT_CATEGORY_ALLOWED_DRAW_SIZES,
  MAX_TOURNAMENT_CATEGORY_PLAYERS,
} = require('../models/TournamentCategory');
const {
  TournamentEnrollment,
  TOURNAMENT_ENROLLMENT_STATUS,
} = require('../models/TournamentEnrollment');
const {
  TournamentMatch,
  TOURNAMENT_MATCH_STATUS,
  TOURNAMENT_BRACKETS,
} = require('../models/TournamentMatch');
const { TournamentDoublesPair } = require('../models/TournamentDoublesPair');
const { CourtReservation, RESERVATION_TYPES } = require('../models/CourtReservation');
const { COURT_BLOCK_CONTEXTS } = require('../models/CourtBlock');
const { notifyTournamentMatchScheduled } = require('../services/tournamentNotificationService');
const {
  autoAssignCourt,
  ensureReservationAvailability: ensureCourtReservationAvailability,
  resolveEndsAt,
  upsertTournamentMatchReservation,
  cancelTournamentMatchReservation,
} = require('../services/courtReservationService');
const { canAccessPrivateContent } = require('../utils/accessControl');
const { createOrderOfPlayPdf } = require('../services/tournamentOrderOfPlayPdfService');

const ROUND_NAME_LABELS = {
  1: 'Final',
  2: 'Semifinales',
  3: 'Cuartos de final',
  4: 'Octavos de final',
  5: 'Dieciseisavos de final',
};

const BYE_PLACEHOLDER = 'BYE';
const BRACKET_RESULTS_BLOCKED_MESSAGE =
  'Esta categoría ya tiene resultados registrados. Marca la opción de reemplazo para generar un nuevo cuadro.';

const MAX_CATEGORY_PARTICIPANTS =
  Number.isFinite(MAX_TOURNAMENT_CATEGORY_PLAYERS) && MAX_TOURNAMENT_CATEGORY_PLAYERS > 0
    ? MAX_TOURNAMENT_CATEGORY_PLAYERS
    : 32;

const MAX_BRACKET_SLOTS = 32;

function toPlainMatch(match) {
  if (!match) {
    return match;
  }

  if (typeof match.toObject === 'function') {
    return match.toObject({ virtuals: true, flattenMaps: true });
  }

  return { ...match };
}

function buildDrawMatchLookup(drawRounds = []) {
  const lookup = new Map();
  if (!Array.isArray(drawRounds)) {
    return lookup;
  }

  drawRounds.forEach((round) => {
    const order = Number(round?.order) || 0;
    const matches = Array.isArray(round?.matches) ? round.matches : [];
    if (!order || !matches.length) {
      return;
    }

    matches.forEach((entry) => {
      const matchNumber = Number(entry?.matchNumber) || 0;
      if (!matchNumber) {
        return;
      }
      const key = `${order}:${matchNumber}`;
      lookup.set(key, {
        placeholderA: entry?.placeholderA,
        placeholderB: entry?.placeholderB,
      });
    });
  });

  return lookup;
}

function assignDrawPlaceholders(drawRounds = []) {
  if (!Array.isArray(drawRounds) || drawRounds.length <= 1) {
    return;
  }

  for (let roundIndex = 1; roundIndex < drawRounds.length; roundIndex += 1) {
    const previousMatches = Array.isArray(drawRounds[roundIndex - 1]?.matches)
      ? drawRounds[roundIndex - 1].matches
      : [];
    const currentMatches = Array.isArray(drawRounds[roundIndex]?.matches)
      ? drawRounds[roundIndex].matches
      : [];

    currentMatches.forEach((drawMatch, matchIndex) => {
      if (!drawMatch || typeof drawMatch !== 'object') {
        return;
      }

      if (!drawMatch.playerA && !drawMatch.placeholderA) {
        const feeder = previousMatches[matchIndex * 2];
        const feederNumber = Number(feeder?.matchNumber) || 0;
        if (feederNumber) {
          drawMatch.placeholderA = `Ganador partido ${feederNumber}`;
        }
      }

      if (!drawMatch.playerB && !drawMatch.placeholderB) {
        const feeder = previousMatches[matchIndex * 2 + 1];
        const feederNumber = Number(feeder?.matchNumber) || 0;
        if (feederNumber) {
          drawMatch.placeholderB = `Ganador partido ${feederNumber}`;
        }
      }
    });
  }
}

function mapMatchesWithDrawLookups(matches, { mainLookup = new Map(), consolationLookup = new Map() } = {}) {
  return matches.map((match) => {
    if (!match) {
      return match;
    }

    const plain = toPlainMatch(match);
    const roundOrder = Number(plain?.roundOrder) || 0;
    const matchNumber = Number(plain?.matchNumber) || 0;
    if (!roundOrder || !matchNumber) {
      return plain;
    }

    const key = `${roundOrder}:${matchNumber}`;
    const lookup =
      plain.bracketType === TOURNAMENT_BRACKETS.CONSOLATION ? consolationLookup : mainLookup;
    const entry = lookup.get(key);

    if (entry) {
      if (entry.placeholderA) {
        plain.placeholderA = entry.placeholderA;
      }
      if (entry.placeholderB) {
        plain.placeholderB = entry.placeholderB;
      }
    }

    return plain;
  });
}

async function serializeMatchesForResponse(matches, { tournamentId, categoryId, categoryDoc } = {}) {
  const isArray = Array.isArray(matches);
  const list = isArray ? matches : [matches];

  if (!list.length) {
    return isArray ? [] : null;
  }

  let category = categoryDoc;

  if (!category && categoryId) {
    const query = { _id: categoryId };
    if (tournamentId) {
      query.tournament = tournamentId;
    }
    category = await TournamentCategory.findOne(query).select('draw consolationDraw');
  }

  const lookups = {
    mainLookup: buildDrawMatchLookup(category?.draw),
    consolationLookup: buildDrawMatchLookup(category?.consolationDraw),
  };

  const serialized = mapMatchesWithDrawLookups(list, lookups);
  return isArray ? serialized : serialized[0];
}

function nextPowerOfTwo(value) {
  if (value <= 1) {
    return 1;
  }
  return 2 ** Math.ceil(Math.log2(value));
}

function generateSeedingPositions(size) {
  if (size <= 1) {
    return [1];
  }

  const previous = generateSeedingPositions(size / 2);
  const result = [];
  previous.forEach((position) => {
    result.push(position);
    result.push(size + 1 - position);
  });
  return result;
}

function resolveRoundName(roundIndex, totalRounds) {
  const remainingRounds = totalRounds - roundIndex;
  if (ROUND_NAME_LABELS[remainingRounds]) {
    return ROUND_NAME_LABELS[remainingRounds];
  }
  return `Ronda ${roundIndex + 1}`;
}

function resolveConsolationRoundName(roundIndex, totalRounds) {
  const baseName = resolveRoundName(roundIndex, totalRounds);
  return `Consolación - ${baseName}`;
}

function toObjectId(value) {
  if (!value) {
    return undefined;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  try {
    return new mongoose.Types.ObjectId(value);
  } catch (error) {
    return undefined;
  }
}

function createConfirmationEntries(playerIds = []) {
  return playerIds.reduce((acc, playerId) => {
    acc[playerId] = { status: 'pendiente' };
    return acc;
  }, {});
}

async function hasCategoryMatchesWithResults(tournamentId, categoryId) {
  const query = {
    tournament: tournamentId,
    category: categoryId,
    $or: [
      { resultStatus: { $ne: 'sin_resultado' } },
      { status: TOURNAMENT_MATCH_STATUS.COMPLETED },
      { 'result.winner': { $exists: true, $ne: null } },
    ],
  };

  const result = await TournamentMatch.exists(query);
  return Boolean(result);
}

function applyByePlaceholders(entry, hasPlayerA, hasPlayerB) {
  if (!entry) {
    return;
  }

  if (hasPlayerA && !hasPlayerB) {
    entry.placeholderB = BYE_PLACEHOLDER;
    delete entry.placeholderA;
    return;
  }

  if (hasPlayerB && !hasPlayerA) {
    entry.placeholderA = BYE_PLACEHOLDER;
    delete entry.placeholderB;
    return;
  }

  delete entry.placeholderA;
  delete entry.placeholderB;
}

function getMatchPlayerType(match) {
  return match?.playerType === 'TournamentDoublesPair' ? 'TournamentDoublesPair' : 'User';
}

function normalizeParticipantId(value) {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }
  if (typeof value === 'object' && value !== null) {
    if (value._id) {
      return value._id.toString();
    }
    if (value.id) {
      return value.id.toString();
    }
  }
  return '';
}

function getMatchParticipantIds(match) {
  if (!match) {
    return [];
  }
  const players = Array.isArray(match.players) ? match.players : [];
  return players.map((player) => normalizeParticipantId(player)).filter(Boolean);
}

async function buildParticipantUserMap(participantIds, playerType) {
  if (!Array.isArray(participantIds) || !participantIds.length) {
    return new Map();
  }

  if (playerType === 'TournamentDoublesPair') {
    const objectIds = participantIds
      .map((id) => {
        try {
          return new mongoose.Types.ObjectId(id);
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean);

    const pairs = await TournamentDoublesPair.find({ _id: { $in: objectIds } })
      .select('players')
      .lean();

    const map = new Map();

    pairs.forEach((pair) => {
      const pairId = pair._id.toString();
      const users = Array.isArray(pair.players)
        ? pair.players.map((player) => normalizeParticipantId(player)).filter(Boolean)
        : [];
      map.set(pairId, users);
    });

    participantIds.forEach((id) => {
      if (!map.has(id)) {
        map.set(id, []);
      }
    });

    return map;
  }

  const map = new Map();
  participantIds.forEach((id) => {
    map.set(id, [id]);
  });
  return map;
}

async function getMatchParticipantUserMap(match) {
  const participantIds = getMatchParticipantIds(match);
  const playerType = getMatchPlayerType(match);
  return buildParticipantUserMap(participantIds, playerType);
}

function populateTournamentMatchPlayers(query) {
  return query.populate({
    path: 'players',
    select: 'fullName gender rating photo email players',
  });
}

function formatMatchPlayers(match) {
  if (!match || getMatchPlayerType(match) !== 'TournamentDoublesPair') {
    return;
  }

  const players = Array.isArray(match.players) ? match.players : [];
  match.players = players.map((player) => {
    if (!player || typeof player !== 'object') {
      return player;
    }

    const copy = player;
    if (!copy.fullName || !copy.fullName.trim()) {
      const names = Array.isArray(copy.players)
        ? copy.players
            .map((entry) => {
              if (entry && typeof entry === 'object' && entry.fullName) {
                return entry.fullName;
              }
              if (entry && typeof entry === 'object' && entry.email) {
                return entry.email;
              }
              if (typeof entry === 'string') {
                return entry;
              }
              return '';
            })
            .filter((name) => Boolean(name && name.trim()))
        : [];
      if (names.length) {
        copy.fullName = names.join(' / ');
      }
    }
    return copy;
  });
}

async function hydrateMatchPlayerDetails(matches) {
  if (!matches) {
    return;
  }

  const docs = Array.isArray(matches) ? matches : [matches];
  const pairIds = new Set();

  docs.forEach((match) => {
    if (!match || getMatchPlayerType(match) !== 'TournamentDoublesPair') {
      return;
    }
    const players = Array.isArray(match.players) ? match.players : [];
    players.forEach((player) => {
      const id = normalizeParticipantId(player);
      if (id) {
        pairIds.add(id);
      }
    });
  });

  const objectIds = Array.from(pairIds)
    .map((id) => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);

  let pairMap;
  if (objectIds.length) {
    const pairs = await TournamentDoublesPair.find({ _id: { $in: objectIds } })
      .populate({
        path: 'players',
        select: 'fullName gender rating photo email',
      })
      .exec();

    pairMap = new Map();
    pairs.forEach((pair) => {
      pairMap.set(pair._id.toString(), pair);
    });
  }

  docs.forEach((match) => {
    if (!match) {
      return;
    }

    if (getMatchPlayerType(match) === 'TournamentDoublesPair' && pairMap) {
      const players = Array.isArray(match.players) ? match.players : [];
      const resolvedPlayers = players.map((player) => {
        const id = normalizeParticipantId(player);
        if (id && pairMap.has(id)) {
          return pairMap.get(id);
        }
        return player;
      });

      if (typeof match.set === 'function') {
        match.set('players', resolvedPlayers);
      } else {
        match.players = resolvedPlayers;
      }
    }

    formatMatchPlayers(match);
  });
}

async function populateMatchPlayers(match) {
  if (!match) {
    return;
  }

  await match.populate({
    path: 'players',
    select: 'fullName gender rating photo email players',
  });

  await hydrateMatchPlayerDetails(match);
}

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

  const tournament = await Tournament.findById(tournamentId).select('isPrivate');
  if (!tournament) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  if (tournament.isPrivate && !canAccessPrivateContent(req.user)) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const matchesQuery = populateTournamentMatchPlayers(
    TournamentMatch.find({
      tournament: tournamentId,
      category: categoryId,
    })
  );

  const matches = await matchesQuery;
  await hydrateMatchPlayerDetails(matches);

  const priority = {
    [TOURNAMENT_BRACKETS.MAIN]: 0,
    [TOURNAMENT_BRACKETS.CONSOLATION]: 1,
    [TOURNAMENT_BRACKETS.MANUAL]: 2,
  };

  matches.sort((a, b) => {
    const typeDiff = (priority[a.bracketType] || 3) - (priority[b.bracketType] || 3);
    if (typeDiff !== 0) {
      return typeDiff;
    }
    const roundDiff = (a.roundOrder || 0) - (b.roundOrder || 0);
    if (roundDiff !== 0) {
      return roundDiff;
    }
    const matchNumberDiff = (a.matchNumber || 0) - (b.matchNumber || 0);
    if (matchNumberDiff !== 0) {
      return matchNumberDiff;
    }
    return a.createdAt - b.createdAt;
  });

  const responseMatches = await serializeMatchesForResponse(matches, {
    tournamentId,
    categoryId,
  });

  return res.json(responseMatches);
}

function parseDayRange(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return null;
  }

  const [year, month, date] = day.split('-').map((value) => Number.parseInt(value, 10));
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(date)) {
    return null;
  }

  const start = new Date(year, month - 1, date);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  if (
    start.getFullYear() !== year ||
    start.getMonth() !== month - 1 ||
    start.getDate() !== date
  ) {
    return null;
  }

  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function formatMatchLabel(match) {
  const parts = [];
  if (match.round && typeof match.round === 'string') {
    parts.push(match.round.trim());
  }
  if (Number.isFinite(Number(match.matchNumber))) {
    parts.push(`Partido ${Number(match.matchNumber)}`);
  }
  if (match.bracketType === TOURNAMENT_BRACKETS.CONSOLATION) {
    parts.push('Consolación');
  }

  if (!parts.length) {
    return 'Partido';
  }

  return parts.join(' - ');
}

function formatMatchPlayersForDisplay(match) {
  const players = Array.isArray(match.players) ? match.players : [];

  if (!players.length) {
    return 'Por definir';
  }

  const names = players.map((player) => {
    if (!player) {
      return 'Por definir';
    }

    if (typeof player === 'string') {
      return player;
    }

    if (player.fullName && player.fullName.trim()) {
      return player.fullName.trim();
    }

    if (player.email) {
      return player.email;
    }

    if (Array.isArray(player.players)) {
      const pairNames = player.players
        .map((entry) => {
          if (!entry) {
            return '';
          }
          if (typeof entry === 'string') {
            return entry;
          }
          if (entry.fullName && entry.fullName.trim()) {
            return entry.fullName.trim();
          }
          if (entry.email) {
            return entry.email;
          }
          return '';
        })
        .filter((value) => Boolean(value && value.trim()));
      if (pairNames.length) {
        return pairNames.join(' / ');
      }
    }

    return 'Por definir';
  });

  return names.join(' vs ');
}

async function downloadTournamentOrderOfPlay(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId } = req.params;
  const { day } = req.query;

  const tournament = await Tournament.findById(tournamentId).select('name isPrivate');
  if (!tournament) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  if (tournament.isPrivate && !canAccessPrivateContent(req.user)) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const range = parseDayRange(day);
  if (!range) {
    return res.status(400).json({ message: 'Debe proporcionar un día válido con el formato AAAA-MM-DD' });
  }

  const matchesQuery = populateTournamentMatchPlayers(
    TournamentMatch.find({
      tournament: tournamentId,
      scheduledAt: { $gte: range.start, $lt: range.end },
    })
      .populate({ path: 'category', select: 'name matchType order color' })
      .sort({ scheduledAt: 1, court: 1, createdAt: 1 })
  );

  const matches = await matchesQuery.exec();
  await hydrateMatchPlayerDetails(matches);

  const categoryMap = new Map();

  matches.forEach((match) => {
    if (!match || !match.category || !match.scheduledAt) {
      return;
    }

    const categoryId = match.category._id ? match.category._id.toString() : match.category.toString();
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        name: match.category.name || 'Categoría sin nombre',
        matches: [],
      });
    }

    categoryMap.get(categoryId).matches.push(match);
  });

  const timeFormatter = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const categories = Array.from(categoryMap.values())
    .map((category) => {
      const sortedMatches = category.matches
        .slice()
        .sort((a, b) => {
          const timeDiff = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
          if (timeDiff !== 0) {
            return timeDiff;
          }
          const courtA = a.court || '';
          const courtB = b.court || '';
          if (courtA && courtB) {
            return courtA.localeCompare(courtB, 'es', { sensitivity: 'base' });
          }
          if (courtA) {
            return -1;
          }
          if (courtB) {
            return 1;
          }
          return (a.createdAt || 0) - (b.createdAt || 0);
        });

      return {
        name: category.name,
        matches: sortedMatches.map((match) => ({
          label: formatMatchLabel(match),
          players: formatMatchPlayersForDisplay(match),
          time: timeFormatter.format(new Date(match.scheduledAt)),
          court: match.court ? match.court : 'Por definir',
        })),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

  const dayLabel = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full' }).format(range.start);

  const document = createOrderOfPlayPdf({
    tournamentName: tournament.name,
    dayLabel,
    categories,
  });

  const filename = `orden-juego-${day}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  document.on('error', () => {
    if (!res.headersSent) {
      res.status(500);
    }
    res.end();
  });

  document.pipe(res);
  document.end();
}

function sanitizeMatchPayload(match, { allowedPlayers = new Set(), playerType = 'User' } = {}) {
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
    playerType,
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

  const isDoubles = category.matchType === TOURNAMENT_CATEGORY_MATCH_TYPES.DOUBLES;

  let allowedPlayers;
  let playerType;

  if (isDoubles) {
    const pairs = await TournamentDoublesPair.find({
      tournament: tournamentId,
      category: categoryId,
    }).select('_id players');

    allowedPlayers = new Set(pairs.map((pair) => pair._id.toString()));
    playerType = 'TournamentDoublesPair';

    if (!allowedPlayers.size) {
      return res.status(400).json({ message: 'No hay parejas registradas en la categoría' });
    }
  } else {
    const enrollments = await TournamentEnrollment.find({
      tournament: tournamentId,
      category: categoryId,
      status: { $ne: TOURNAMENT_ENROLLMENT_STATUS.CANCELLED },
    }).select('user');

    allowedPlayers = new Set(enrollments.map((enrollment) => enrollment.user.toString()));
    playerType = 'User';

    if (!allowedPlayers.size) {
      return res.status(400).json({ message: 'No hay jugadores inscritos en la categoría' });
    }
  }

  const hasRecordedResults = await hasCategoryMatchesWithResults(tournamentId, categoryId);
  if (hasRecordedResults && !replaceExisting) {
    return res.status(400).json({ message: BRACKET_RESULTS_BLOCKED_MESSAGE });
  }

  const sanitizedMatches = Array.isArray(matches)
    ? matches
        .map((match) =>
          sanitizeMatchPayload(match, { allowedPlayers, playerType })
        )
        .filter((match) => match && match.players && match.players.length === 2)
    : [];

  if (!sanitizedMatches.length) {
    return res.status(400).json({ message: 'No se proporcionaron partidos válidos' });
  }

  for (const sanitized of sanitizedMatches) {
    if (sanitized.scheduledAt && sanitized.court) {
      try {
        const { startsAt, endsAt } = resolveEndsAt(sanitized.scheduledAt);
        await ensureCourtReservationAvailability({
          court: sanitized.court,
          startsAt,
          endsAt,
          reservationType: RESERVATION_TYPES.MATCH,
          contextType: COURT_BLOCK_CONTEXTS.TOURNAMENT,
          contextId: tournamentId,
          bypassManualAdvanceLimit: true,
        });
      } catch (error) {
        return res.status(error.statusCode || 400).json({ message: error.message });
      }
    }
  }

  if (replaceExisting) {
    const existingMatches = await TournamentMatch.find({
      tournament: tournamentId,
      category: categoryId,
    })
      .select('_id')
      .lean();
    const existingIds = existingMatches.map((entry) => entry._id).filter(Boolean);
    if (existingIds.length) {
      await CourtReservation.deleteMany({ tournamentMatch: { $in: existingIds } });
    }
    await TournamentMatch.deleteMany({ tournament: tournamentId, category: categoryId });
  }

  const payloads = sanitizedMatches.map((match) => {
    const confirmationEntries = createConfirmationEntries(match.players);

    return {
      tournament: tournamentId,
      category: categoryId,
      round: match.round,
      roundOrder: 1,
      matchNumber: match.matchNumber,
      players: match.players,
      scheduledAt: match.scheduledAt,
      court: match.court,
      status: match.status,
      confirmations: confirmationEntries,
      createdBy: req.user.id,
      bracketType: TOURNAMENT_BRACKETS.MANUAL,
      playerType,
    };
  });

  const createdMatches = await TournamentMatch.insertMany(payloads, { ordered: false });

  try {
    for (const createdMatch of createdMatches) {
      if (createdMatch.scheduledAt && createdMatch.court) {
        await upsertTournamentMatchReservation({ match: createdMatch, createdBy: req.user.id });
      }
    }
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  await Promise.all(
    createdMatches.map((match) =>
      notifyTournamentMatchScheduled({
        tournament,
        category,
        match,
        players: match.players,
        playerType: match.playerType,
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

  const populatedMatchesQuery = populateTournamentMatchPlayers(
    TournamentMatch.find({
      _id: { $in: createdMatches.map((match) => match._id) },
    })
  );
  const populatedMatches = await populatedMatchesQuery;
  await hydrateMatchPlayerDetails(populatedMatches);

  const responseMatches = await serializeMatchesForResponse(populatedMatches, {
    categoryDoc: category,
  });

  return res.status(201).json(responseMatches);
}

async function propagateMatchResult(match, winnerId, loserId) {
  const updates = [];

  if (match.nextMatch && typeof match.nextMatch !== 'string') {
    match.nextMatch = match.nextMatch.toString();
  }
  if (match.loserNextMatch && typeof match.loserNextMatch !== 'string') {
    match.loserNextMatch = match.loserNextMatch.toString();
  }

  if (match.nextMatch && winnerId) {
    updates.push(
      (async () => {
        const nextMatch = await TournamentMatch.findById(match.nextMatch);
        if (!nextMatch) return;

        const players = Array.isArray(nextMatch.players)
          ? nextMatch.players.map((player) => (player ? player.toString() : undefined))
          : [];

        if (typeof match.nextMatchSlot === 'number') {
          while (players.length <= match.nextMatchSlot) {
            players.push(undefined);
          }
          players[match.nextMatchSlot] = winnerId;
        } else if (!players.includes(winnerId)) {
          players.push(winnerId);
        }

        nextMatch.players = players.filter(Boolean);
        nextMatch.confirmations = createConfirmationEntries(nextMatch.players.map(String));
        if (nextMatch.status === TOURNAMENT_MATCH_STATUS.COMPLETED) {
          nextMatch.status = TOURNAMENT_MATCH_STATUS.PENDING;
        }
        nextMatch.markModified('confirmations');
        await nextMatch.save();
      })()
    );
  }

  if (match.loserNextMatch && loserId) {
    updates.push(
      (async () => {
        const consolationMatch = await TournamentMatch.findById(match.loserNextMatch);
        if (!consolationMatch) return;

        const players = Array.isArray(consolationMatch.players)
          ? consolationMatch.players.map((player) => (player ? player.toString() : undefined))
          : [];

        if (typeof match.loserNextMatchSlot === 'number') {
          while (players.length <= match.loserNextMatchSlot) {
            players.push(undefined);
          }
          players[match.loserNextMatchSlot] = loserId;
        } else if (!players.includes(loserId)) {
          players.push(loserId);
        }

        consolationMatch.players = players.filter(Boolean);
        consolationMatch.confirmations = createConfirmationEntries(
          consolationMatch.players.map(String)
        );
        if (consolationMatch.status === TOURNAMENT_MATCH_STATUS.COMPLETED) {
          consolationMatch.status = TOURNAMENT_MATCH_STATUS.PENDING;
        }
        consolationMatch.markModified('confirmations');
        await consolationMatch.save();
      })()
    );
  }

  await Promise.all(updates);
}

async function revertMatchProgress(match) {
  const tasks = [];

  const winnerId = match.result?.winner ? match.result.winner.toString() : undefined;
  const playerIds = match.players.map((player) => player && player.toString());
  const loserId = playerIds.find((playerId) => playerId && playerId !== winnerId);

  if (match.nextMatch && winnerId) {
    tasks.push(
      (async () => {
        const targetMatch = await TournamentMatch.findById(match.nextMatch);
        if (!targetMatch) return;

        const players = targetMatch.players.map((p) => (p ? p.toString() : undefined));
        if (typeof match.nextMatchSlot === 'number' && players.length > match.nextMatchSlot) {
          players[match.nextMatchSlot] = undefined;
        } else {
          for (let index = 0; index < players.length; index += 1) {
            if (players[index] === winnerId) {
              players[index] = undefined;
            }
          }
        }

        targetMatch.players = players.filter(Boolean);
        targetMatch.confirmations = createConfirmationEntries(targetMatch.players.map(String));
        if (targetMatch.status === TOURNAMENT_MATCH_STATUS.COMPLETED) {
          targetMatch.status = TOURNAMENT_MATCH_STATUS.PENDING;
        }
        targetMatch.markModified('confirmations');
        await targetMatch.save();
      })()
    );
  }

  if (match.loserNextMatch && loserId) {
    tasks.push(
      (async () => {
        const targetMatch = await TournamentMatch.findById(match.loserNextMatch);
        if (!targetMatch) return;

        const players = targetMatch.players.map((p) => (p ? p.toString() : undefined));
        if (typeof match.loserNextMatchSlot === 'number' && players.length > match.loserNextMatchSlot) {
          players[match.loserNextMatchSlot] = undefined;
        } else {
          for (let index = 0; index < players.length; index += 1) {
            if (players[index] === loserId) {
              players[index] = undefined;
            }
          }
        }

        targetMatch.players = players.filter(Boolean);
        targetMatch.confirmations = createConfirmationEntries(targetMatch.players.map(String));
        if (targetMatch.status === TOURNAMENT_MATCH_STATUS.COMPLETED) {
          targetMatch.status = TOURNAMENT_MATCH_STATUS.PENDING;
        }
        targetMatch.markModified('confirmations');
        await targetMatch.save();
      })()
    );
  }

  await Promise.all(tasks);
}

async function applyMatchOutcome(match, { winnerId, score, notes, reportedBy }) {
  const winnerObjectId = new mongoose.Types.ObjectId(winnerId);
  const playerIds = match.players.map((player) => player && player.toString()).filter(Boolean);
  const loserId = playerIds.find((playerId) => playerId !== winnerId);

  match.result = {
    winner: winnerObjectId,
    score: score || '',
    notes: notes || undefined,
    reportedAt: new Date(),
    reportedBy: reportedBy ? new mongoose.Types.ObjectId(reportedBy) : undefined,
  };
  match.status = TOURNAMENT_MATCH_STATUS.COMPLETED;
  match.resultStatus = 'confirmado';
  match.resultProposals = new Map();
  match.markModified('resultProposals');

  await match.save();
  await propagateMatchResult(match, winnerId, loserId);
}

async function autoAdvanceByes(tournamentId, categoryId, actorId) {
  const matches = await TournamentMatch.find({
    tournament: tournamentId,
    category: categoryId,
    bracketType: TOURNAMENT_BRACKETS.MAIN,
    roundOrder: 1,
  });

  const byeMatches = matches.filter(
    (matchItem) => matchItem.players.length === 1 && matchItem.status !== TOURNAMENT_MATCH_STATUS.COMPLETED
  );
  for (const match of byeMatches) {
    const winnerId = match.players[0].toString();
    await applyMatchOutcome(match, {
      winnerId,
      score: 'WO',
      notes: 'Avance automático',
      reportedBy: actorId,
    });
  }
}

async function autoGenerateTournamentBracket(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;

  let context;
  try {
    context = await ensureTournamentContext(tournamentId, categoryId);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  const { tournament, category } = context;

  const isDoubles = category.matchType === TOURNAMENT_CATEGORY_MATCH_TYPES.DOUBLES;

  let participantSource = [];

  if (isDoubles) {
    const pairs = await TournamentDoublesPair.find({
      tournament: tournamentId,
      category: categoryId,
    })
      .select('_id createdAt')
      .sort({ createdAt: 1 });

    participantSource = pairs.map((pair) => pair._id.toString());
  } else {
    const enrollments = await TournamentEnrollment.find({
      tournament: tournamentId,
      category: categoryId,
      status: { $ne: TOURNAMENT_ENROLLMENT_STATUS.CANCELLED },
    })
      .select('user createdAt')
      .sort({ createdAt: 1 });

    participantSource = enrollments.map((enrollment) => enrollment.user.toString());
  }

  const uniquePlayers = [];
  const seenParticipants = new Set();
  participantSource.forEach((participantId) => {
    if (!seenParticipants.has(participantId)) {
      seenParticipants.add(participantId);
      uniquePlayers.push(participantId);
    }
  });

  if (uniquePlayers.length < 2) {
    return res.status(400).json({
      message: isDoubles
        ? 'Se necesitan al menos dos parejas para generar el cuadro'
        : 'Se necesitan al menos dos jugadores para generar el cuadro',
    });
  }

  if (uniquePlayers.length > MAX_CATEGORY_PARTICIPANTS) {
    return res.status(400).json({
      message: `La categoría supera el máximo permitido de ${MAX_CATEGORY_PARTICIPANTS} jugadores.`,
    });
  }

  const rawConfiguredCapacity =
    typeof category.drawSize === 'number' ? category.drawSize : Number(category.drawSize);
  const configuredCapacity =
    Number.isFinite(rawConfiguredCapacity) && rawConfiguredCapacity > 0
      ? Math.min(rawConfiguredCapacity, MAX_CATEGORY_PARTICIPANTS)
      : null;

  if (configuredCapacity && uniquePlayers.length > configuredCapacity) {
    return res.status(400).json({
      message: `Hay más jugadores inscritos que el límite configurado de ${configuredCapacity} plazas. Ajusta el tamaño del cuadro o modifica las inscripciones de la categoría.`,
    });
  }

  const baseDrawSize =
    configuredCapacity && configuredCapacity >= uniquePlayers.length
      ? configuredCapacity
      : uniquePlayers.length;

  const drawSize = Math.min(nextPowerOfTwo(baseDrawSize), MAX_BRACKET_SLOTS);
  const effectiveCategoryDrawSize = configuredCapacity || drawSize;

  const seedPositions = generateSeedingPositions(drawSize);
  const maxSeedNumber = seedPositions.length;
  const slotAssignments = new Array(drawSize).fill(null);
  const slotSeedNumbers = new Array(drawSize).fill(undefined);

  const seeds = Array.isArray(category.seeds)
    ? category.seeds
        .filter((seed) => {
          if (!seed) return false;
          const playerId = normalizeParticipantId(seed.player);
          return Boolean(playerId) && uniquePlayers.includes(playerId);
        })
        .filter((seed) => Number.isFinite(seed.seedNumber) && seed.seedNumber > 0)
        .filter((seed) => seed.seedNumber <= maxSeedNumber)
        .sort((a, b) => a.seedNumber - b.seedNumber)
        .slice(0, maxSeedNumber)
    : [];

  seeds.forEach((seed, index) => {
    const slotIndex = seedPositions[index] - 1;
    if (slotIndex >= 0 && slotIndex < drawSize) {
      slotAssignments[slotIndex] = normalizeParticipantId(seed.player);
      slotSeedNumbers[slotIndex] = seed.seedNumber;
    }
  });

  const seededPlayers = new Set(
    seeds.map((seed) => normalizeParticipantId(seed.player)).filter(Boolean)
  );
  const remainingPlayers = uniquePlayers.filter((playerId) => !seededPlayers.has(playerId));

  let remainderIndex = 0;
  for (let i = 0; i < slotAssignments.length; i += 1) {
    if (!slotAssignments[i] && remainderIndex < remainingPlayers.length) {
      slotAssignments[i] = remainingPlayers[remainderIndex];
      remainderIndex += 1;
    }
  }

  if (remainderIndex < remainingPlayers.length) {
    return res
      .status(400)
      .json({ message: 'Hay más jugadores que plazas en el cuadro. Ajusta el tamaño del cuadro.' });
  }

  const totalRounds = Math.ceil(Math.log2(drawSize));
  const mainMatchesMatrix = [];
  const drawRounds = [];
  const preAssignedSlotsByRound = Array.from({ length: totalRounds }, (_, roundIndex) => {
    const matchesInRound = drawSize / 2 ** (roundIndex + 1);
    return Array.from({ length: matchesInRound }, () => [undefined, undefined]);
  });
  const feederInfoByRound = Array.from({ length: totalRounds }, (_, roundIndex) => {
    const matchesInRound = drawSize / 2 ** (roundIndex + 1);
    return Array.from({ length: matchesInRound }, () => [false, false]);
  });

  function resolveNextMatchTarget(startRoundIndex, matchIndex) {
    let parentIndex = Math.floor(matchIndex / 2);
    let slot = matchIndex % 2;

    for (let roundPointer = startRoundIndex + 1; roundPointer < mainMatchesMatrix.length; roundPointer += 1) {
      const roundMatches = mainMatchesMatrix[roundPointer];
      if (!roundMatches || !roundMatches.length) {
        break;
      }
      const candidate = roundMatches[parentIndex];
      if (candidate) {
        return { targetMatch: candidate, slot };
      }
      slot = parentIndex % 2;
      parentIndex = Math.floor(parentIndex / 2);
    }

    return null;
  }

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const matchesInRound = drawSize / 2 ** (roundIndex + 1);
    const roundName = resolveRoundName(roundIndex, totalRounds);
    const roundMatches = [];
    const roundDrawMatches = [];

    for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex += 1) {
      const players = [];
      let shouldCreateMatch = true;
      const seedsForMatch = { seedA: undefined, seedB: undefined };

      if (roundIndex === 0) {
        const slotAIndex = matchIndex * 2;
        const slotBIndex = slotAIndex + 1;
        const playerA = slotAssignments[slotAIndex];
        const playerB = slotAssignments[slotBIndex];
        const hasPlayerA = Boolean(playerA);
        const hasPlayerB = Boolean(playerB);
        if (hasPlayerA) players.push(playerA);
        if (hasPlayerB) players.push(playerB);
        seedsForMatch.seedA = slotSeedNumbers[slotAIndex];
        seedsForMatch.seedB = slotSeedNumbers[slotBIndex];

        const drawMatch = {
          matchNumber: matchIndex + 1,
        };

        if (hasPlayerA) {
          drawMatch.playerA = new mongoose.Types.ObjectId(playerA);
        }
        if (hasPlayerB) {
          drawMatch.playerB = new mongoose.Types.ObjectId(playerB);
        }
        if (seedsForMatch.seedA) {
          drawMatch.seedA = seedsForMatch.seedA;
        }
        if (seedsForMatch.seedB) {
          drawMatch.seedB = seedsForMatch.seedB;
        }

        applyByePlaceholders(drawMatch, hasPlayerA, hasPlayerB);
        roundDrawMatches.push(drawMatch);

        if (players.length < 2) {
          const hasSinglePlayer = players.length === 1;
          const hasNoPlayers = players.length === 0;
          shouldCreateMatch = hasSinglePlayer || hasNoPlayers;
          if (hasSinglePlayer && roundIndex + 1 < totalRounds) {
            const parentIndex = Math.floor(matchIndex / 2);
            const slot = matchIndex % 2;
            feederInfoByRound[roundIndex + 1][parentIndex][slot] = true;
          }
        } else if (roundIndex + 1 < totalRounds) {
          const parentIndex = Math.floor(matchIndex / 2);
          const slot = matchIndex % 2;
          feederInfoByRound[roundIndex + 1][parentIndex][slot] = true;
        }
      } else {
        const assignedSlots =
          (preAssignedSlotsByRound[roundIndex] && preAssignedSlotsByRound[roundIndex][matchIndex]) ||
          [];
        const [playerA, playerB] = assignedSlots;
        const hasPlayerA = Boolean(playerA);
        const hasPlayerB = Boolean(playerB);
        const feeders =
          (feederInfoByRound[roundIndex] && feederInfoByRound[roundIndex][matchIndex]) ||
          [false, false];
        const hasFeederA = Boolean(feeders[0]);
        const hasFeederB = Boolean(feeders[1]);
        const potentialA = hasPlayerA || hasFeederA;
        const potentialB = hasPlayerB || hasFeederB;
        const potentialCount = (potentialA ? 1 : 0) + (potentialB ? 1 : 0);
        shouldCreateMatch = potentialCount >= 2;
        if (hasPlayerA) {
          players.push(playerA);
        }
        if (hasPlayerB) {
          players.push(playerB);
        }

        const drawMatch = {
          matchNumber: matchIndex + 1,
        };

        if (hasPlayerA) {
          drawMatch.playerA = new mongoose.Types.ObjectId(playerA);
        }
        if (hasPlayerB) {
          drawMatch.playerB = new mongoose.Types.ObjectId(playerB);
        }

        applyByePlaceholders(drawMatch, hasPlayerA, hasPlayerB);
        roundDrawMatches.push(drawMatch);

        if (!shouldCreateMatch && roundIndex + 1 < totalRounds) {
          const parentIndex = Math.floor(matchIndex / 2);
          const slot = matchIndex % 2;

          if (potentialA && !potentialB) {
            if (hasPlayerA) {
              preAssignedSlotsByRound[roundIndex + 1][parentIndex][slot] = playerA;
            } else if (hasFeederA) {
              feederInfoByRound[roundIndex + 1][parentIndex][slot] = true;
            }
          } else if (potentialB && !potentialA) {
            if (hasPlayerB) {
              preAssignedSlotsByRound[roundIndex + 1][parentIndex][slot] = playerB;
            } else if (hasFeederB) {
              feederInfoByRound[roundIndex + 1][parentIndex][slot] = true;
            }
          }
        } else if (shouldCreateMatch && roundIndex + 1 < totalRounds) {
          const parentIndex = Math.floor(matchIndex / 2);
          const slot = matchIndex % 2;
          feederInfoByRound[roundIndex + 1][parentIndex][slot] = true;
        }
      }

      if (!shouldCreateMatch) {
        roundMatches.push(null);
        continue;
      }

      const matchId = new mongoose.Types.ObjectId();
      const payload = {
        _id: matchId,
        tournament: tournamentId,
        category: categoryId,
        round: roundName,
        roundOrder: roundIndex + 1,
        matchNumber: matchIndex + 1,
        players,
        status: TOURNAMENT_MATCH_STATUS.PENDING,
        confirmations: createConfirmationEntries(players),
        bracketType: TOURNAMENT_BRACKETS.MAIN,
        previousMatches: [],
        createdBy: req.user.id,
        playerType: isDoubles ? 'TournamentDoublesPair' : 'User',
      };

      roundMatches.push(payload);
    }

    mainMatchesMatrix.push(roundMatches);
    drawRounds.push({
      name: roundName,
      order: roundIndex + 1,
      matches: roundDrawMatches,
    });
  }

  assignDrawPlaceholders(drawRounds);

  for (let roundIndex = 0; roundIndex < mainMatchesMatrix.length - 1; roundIndex += 1) {
    const currentRound = mainMatchesMatrix[roundIndex];

    currentRound.forEach((match, index) => {
      if (!match) {
        return;
      }

      const targetInfo = resolveNextMatchTarget(roundIndex, index);
      if (!targetInfo) {
        return;
      }

      const { targetMatch, slot } = targetInfo;
      match.nextMatch = targetMatch._id;
      match.nextMatchSlot = slot;
      targetMatch.previousMatches.push(match._id);
    });
  }

  const firstRoundMatches = Array.isArray(mainMatchesMatrix[0])
    ? mainMatchesMatrix[0].filter(Boolean)
    : [];
  const consolationSourceMatches = firstRoundMatches.filter((match) => {
    const playersCount = Array.isArray(match.players) ? match.players.length : 0;
    return playersCount >= 2;
  });
  const consolationPayloads = [];
  const consolationDrawRounds = [];
  const consolationMatrix = [];

  if (consolationSourceMatches.length >= 2) {
    const loserDrawSize = nextPowerOfTwo(consolationSourceMatches.length);
    const consolationRounds = Math.ceil(Math.log2(loserDrawSize));

    for (let roundIndex = 0; roundIndex < consolationRounds; roundIndex += 1) {
      const matchesInRound = loserDrawSize / 2 ** (roundIndex + 1);
      const roundName = resolveConsolationRoundName(roundIndex, consolationRounds);
      const roundMatches = [];
      const drawMatches = [];

      for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex += 1) {
        const matchId = new mongoose.Types.ObjectId();
        const payload = {
          _id: matchId,
          tournament: tournamentId,
          category: categoryId,
          round: roundName,
          roundOrder: roundIndex + 1,
          matchNumber: matchIndex + 1,
          players: [],
          status: TOURNAMENT_MATCH_STATUS.PENDING,
          confirmations: {},
          bracketType: TOURNAMENT_BRACKETS.CONSOLATION,
          previousMatches: [],
          createdBy: req.user.id,
          playerType: isDoubles ? 'TournamentDoublesPair' : 'User',
        };
        roundMatches.push(payload);
        drawMatches.push({ matchNumber: matchIndex + 1 });
      }

      consolationMatrix.push(roundMatches);
      consolationDrawRounds.push({
        name: roundName,
        order: roundIndex + 1,
        matches: drawMatches,
      });
    }

    assignDrawPlaceholders(consolationDrawRounds);

    for (let roundIndex = 0; roundIndex < consolationMatrix.length - 1; roundIndex += 1) {
      const currentRound = consolationMatrix[roundIndex];
      const nextRound = consolationMatrix[roundIndex + 1];

      currentRound.forEach((match, index) => {
        const targetMatch = nextRound[Math.floor(index / 2)];
        match.nextMatch = targetMatch._id;
        match.nextMatchSlot = index % 2;
        targetMatch.previousMatches.push(match._id);
      });
    }

    const consolationFirstRound = consolationMatrix[0];
    consolationSourceMatches.forEach((match, index) => {
      const target = consolationFirstRound[Math.floor(index / 2)];
      if (target) {
        match.loserNextMatch = target._id;
        match.loserNextMatchSlot = index % 2;
      }
    });

    consolationPayloads.push(...consolationMatrix.flat());
  }

  const mainPayloads = mainMatchesMatrix.flat().filter(Boolean);
  const payloads = [...mainPayloads, ...consolationPayloads];

  const previousMatches = await TournamentMatch.find({
    tournament: tournamentId,
    category: categoryId,
  })
    .select('_id')
    .lean();
  const previousIds = previousMatches.map((entry) => entry._id).filter(Boolean);
  if (previousIds.length) {
    await CourtReservation.deleteMany({ tournamentMatch: { $in: previousIds } });
  }

  await TournamentMatch.deleteMany({ tournament: tournamentId, category: categoryId });
  await TournamentMatch.insertMany(payloads);

  category.draw = drawRounds;
  category.consolationDraw = consolationDrawRounds;
  category.drawSize = effectiveCategoryDrawSize;
  category.status = TOURNAMENT_CATEGORY_STATUSES.IN_PLAY;
  category.markModified('draw');
  category.markModified('consolationDraw');
  await category.save();

  if (tournament.status !== TOURNAMENT_STATUS.FINISHED) {
    tournament.status = TOURNAMENT_STATUS.IN_PLAY;
    await tournament.save();
  }

  await autoAdvanceByes(tournamentId, categoryId, req.user.id);

  const matchesQuery = populateTournamentMatchPlayers(
    TournamentMatch.find({ tournament: tournamentId, category: categoryId }).sort({
      roundOrder: 1,
      matchNumber: 1,
      createdAt: 1,
    })
  );
  const matches = await matchesQuery;
  await hydrateMatchPlayerDetails(matches);

  const responseMatches = await serializeMatchesForResponse(matches, { categoryDoc: category });

  return res.status(201).json(responseMatches);
}

async function recalculateTournamentBracket(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;

  let context;
  try {
    context = await ensureTournamentContext(tournamentId, categoryId);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  const matches = await TournamentMatch.find({
    tournament: tournamentId,
    category: categoryId,
    bracketType: { $in: [TOURNAMENT_BRACKETS.MAIN, TOURNAMENT_BRACKETS.CONSOLATION] },
  }).sort({ roundOrder: 1, matchNumber: 1, createdAt: 1 });

  if (!matches.length) {
    return res
      .status(404)
      .json({ message: 'No hay partidos de cuadro generados para esta categoría.' });
  }

  const matchMap = new Map();
  const outcomes = matches.map((match) => {
    const players = Array.isArray(match.players)
      ? match.players.map((player) => (player ? player.toString() : undefined)).filter(Boolean)
      : [];
    let winnerId = match.result?.winner ? match.result.winner.toString() : '';
    if (!winnerId && players.length === 1) {
      [winnerId] = players;
    }
    const loserId = players.find((playerId) => playerId && playerId !== winnerId);
    matchMap.set(match._id.toString(), match);
    return { match, players, winnerId, loserId };
  });

  matches.forEach((match) => {
    const keepPlayers =
      match.bracketType === TOURNAMENT_BRACKETS.MAIN && Number(match.roundOrder) === 1;
    if (!keepPlayers) {
      match.players = [];
    }
    const confirmationPlayers = Array.isArray(match.players)
      ? match.players.map((player) => (player ? player.toString() : undefined)).filter(Boolean)
      : [];
    match.confirmations = createConfirmationEntries(confirmationPlayers);
    match.markModified('confirmations');
  });

  outcomes.forEach(({ match, winnerId, loserId }) => {
    if (match.nextMatch && winnerId) {
      const target = matchMap.get(match.nextMatch.toString());
      if (target) {
        const players = Array.isArray(target.players)
          ? target.players.map((player) => (player ? player.toString() : undefined))
          : [];
        if (typeof match.nextMatchSlot === 'number') {
          while (players.length <= match.nextMatchSlot) {
            players.push(undefined);
          }
          players[match.nextMatchSlot] = winnerId;
        } else if (!players.includes(winnerId)) {
          players.push(winnerId);
        }
        target.players = players
          .filter(Boolean)
          .map((playerId) => new mongoose.Types.ObjectId(playerId));
        target.confirmations = createConfirmationEntries(target.players.map(String));
        target.markModified('confirmations');
        if (target.status === TOURNAMENT_MATCH_STATUS.COMPLETED) {
          target.status = TOURNAMENT_MATCH_STATUS.PENDING;
        }
      }
    }

    if (match.loserNextMatch && loserId) {
      const target = matchMap.get(match.loserNextMatch.toString());
      if (target) {
        const players = Array.isArray(target.players)
          ? target.players.map((player) => (player ? player.toString() : undefined))
          : [];
        if (typeof match.loserNextMatchSlot === 'number') {
          while (players.length <= match.loserNextMatchSlot) {
            players.push(undefined);
          }
          players[match.loserNextMatchSlot] = loserId;
        } else if (!players.includes(loserId)) {
          players.push(loserId);
        }
        target.players = players
          .filter(Boolean)
          .map((playerId) => new mongoose.Types.ObjectId(playerId));
        target.confirmations = createConfirmationEntries(target.players.map(String));
        target.markModified('confirmations');
        if (target.status === TOURNAMENT_MATCH_STATUS.COMPLETED) {
          target.status = TOURNAMENT_MATCH_STATUS.PENDING;
        }
      }
    }
  });

  await Promise.all(matches.map((match) => match.save()));

  await autoAdvanceByes(tournamentId, categoryId, req.user.id);

  const refreshedMatches = await TournamentMatch.find({
    tournament: tournamentId,
    category: categoryId,
    bracketType: { $in: [TOURNAMENT_BRACKETS.MAIN, TOURNAMENT_BRACKETS.CONSOLATION] },
  }).sort({ roundOrder: 1, matchNumber: 1, createdAt: 1 });

  const { category } = context;
  const drawRounds = Array.isArray(category.draw) ? category.draw : [];
  const consolationRounds = Array.isArray(category.consolationDraw) ? category.consolationDraw : [];

  const mainLookup = new Map();
  drawRounds.forEach((round) => {
    const order = Number(round.order) || 0;
    const matchesInRound = Array.isArray(round.matches) ? round.matches : [];
    matchesInRound.forEach((entry) => {
      const key = `${order}:${Number(entry.matchNumber) || 0}`;
      mainLookup.set(key, entry);
    });
  });

  const consolationLookup = new Map();
  consolationRounds.forEach((round) => {
    const order = Number(round.order) || 0;
    const matchesInRound = Array.isArray(round.matches) ? round.matches : [];
    matchesInRound.forEach((entry) => {
      const key = `${order}:${Number(entry.matchNumber) || 0}`;
      consolationLookup.set(key, entry);
    });
  });

  refreshedMatches.forEach((match) => {
    const key = `${Number(match.roundOrder) || 0}:${Number(match.matchNumber) || 0}`;
    const targetMap =
      match.bracketType === TOURNAMENT_BRACKETS.MAIN ? mainLookup : consolationLookup;
    const entry = targetMap.get(key);
    if (!entry) {
      return;
    }

    const players = Array.isArray(match.players)
      ? match.players.map((player) => (player ? player.toString() : undefined))
      : [];
    const [playerA, playerB] = players;
    if (playerA) {
      entry.playerA = toObjectId(playerA);
    } else {
      delete entry.playerA;
    }
    if (playerB) {
      entry.playerB = toObjectId(playerB);
    } else {
      delete entry.playerB;
    }

    applyByePlaceholders(entry, Boolean(playerA), Boolean(playerB));

    const winnerId = match.result?.winner ? match.result.winner.toString() : '';
    if (winnerId) {
      entry.winner = toObjectId(winnerId);
    } else {
      delete entry.winner;
    }
  });

  assignDrawPlaceholders(drawRounds);
  assignDrawPlaceholders(consolationRounds);

  category.markModified('draw');
  category.markModified('consolationDraw');
  await category.save();

  const populatedMatchesQuery = populateTournamentMatchPlayers(
    TournamentMatch.find({
      tournament: tournamentId,
      category: categoryId,
    }).sort({ roundOrder: 1, matchNumber: 1, createdAt: 1 })
  );
  const populatedMatches = await populatedMatchesQuery;
  await hydrateMatchPlayerDetails(populatedMatches);

  const responseMatches = await serializeMatchesForResponse(populatedMatches, {
    categoryDoc: context.category,
  });

  return res.json(responseMatches);
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

  if (Object.prototype.hasOwnProperty.call(updates, 'round')) {
    match.round = updates.round;
  }

  const previousCourt = typeof match.court === 'string' ? match.court : undefined;
  let preferredCourt = previousCourt;
  if (Object.prototype.hasOwnProperty.call(updates, 'court')) {
    const rawCourt = updates.court;
    const trimmedCourt = typeof rawCourt === 'string' ? rawCourt.trim() : '';
    preferredCourt = trimmedCourt || undefined;
    match.court = preferredCourt;
  }

  let scheduledAtProvided = false;
  if (Object.prototype.hasOwnProperty.call(updates, 'scheduledAt')) {
    scheduledAtProvided = true;
    if (updates.scheduledAt) {
      const scheduledAt = new Date(updates.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime())) {
        return res.status(400).json({ message: 'Fecha y hora inválida.' });
      }
      match.scheduledAt = scheduledAt;
    } else {
      match.scheduledAt = null;
    }
  }

  if (match.scheduledAt) {
    const { startsAt, endsAt } = resolveEndsAt(match.scheduledAt);
    try {
      const assignedCourt = await autoAssignCourt({
        scheduledDate: match.scheduledAt,
        preferredCourt: preferredCourt || previousCourt,
      });
      match.court = assignedCourt;
      await ensureCourtReservationAvailability({
        court: assignedCourt,
        startsAt,
        endsAt,
        reservationType: RESERVATION_TYPES.MATCH,
        bypassManualAdvanceLimit: true,
      });
    } catch (error) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  } else if (scheduledAtProvided) {
    match.court = undefined;
  }

  try {
    if (match.scheduledAt && match.court) {
      await upsertTournamentMatchReservation({ match, createdBy: req.user.id });
    } else if (scheduledAtProvided) {
      await cancelTournamentMatchReservation(match._id, { cancelledBy: req.user.id });
    }
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
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
      playerType: getMatchPlayerType(match),
    });
    if (notification) {
      match.notifications.push(notification._id);
      await match.save();
    }
  }

  await populateMatchPlayers(match);

  const responseMatch = await serializeMatchesForResponse(match, {
    categoryDoc: context.category,
  });

  return res.json(responseMatch);
}

async function submitTournamentMatchResult(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId, matchId } = req.params;
  const { winner, score, notes } = req.body;

  const tournament = await Tournament.findById(tournamentId).select('isPrivate');
  if (!tournament) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  if (tournament.isPrivate && !canAccessPrivateContent(req.user)) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const match = await TournamentMatch.findOne({
    _id: matchId,
    tournament: tournamentId,
    category: categoryId,
  });

  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  const participantMap = await getMatchParticipantUserMap(match);
  const participantEntries = Array.from(participantMap.entries());
  const userEntry = participantEntries.find(([, users]) => users.includes(req.user.id));

  if (!userEntry) {
    return res.status(403).json({ message: 'Solo los jugadores asignados pueden reportar resultados' });
  }

  if (match.status === TOURNAMENT_MATCH_STATUS.COMPLETED) {
    return res.status(400).json({ message: 'El partido ya tiene un resultado confirmado' });
  }

  const winnerId = normalizeParticipantId(winner);
  if (!winnerId) {
    return res.status(400).json({ message: 'Debe indicar el ganador del partido' });
  }

  const participantIds = participantEntries.map(([participantId]) => participantId);
  if (!participantIds.includes(winnerId)) {
    return res.status(400).json({ message: 'El ganador debe ser uno de los jugadores del partido' });
  }

  const proposals = match.resultProposals;
  const entry = proposals.get(req.user.id) || {};
  entry.winner = new mongoose.Types.ObjectId(winnerId);
  entry.score = typeof score === 'string' ? score.trim() : '';
  entry.notes = typeof notes === 'string' ? notes.trim() : undefined;
  entry.submittedAt = new Date();
  proposals.set(req.user.id, entry);

  const [currentParticipantId] = userEntry;
  const otherUserIds = participantEntries
    .filter(([participantId]) => participantId !== currentParticipantId)
    .flatMap(([, users]) => users);
  const otherProposal = otherUserIds
    .map((userId) => proposals.get(userId))
    .find((proposal) => Boolean(proposal));

  if (otherProposal) {
    const sameWinner = otherProposal.winner && otherProposal.winner.toString() === winnerId;
    const sameScore = (otherProposal.score || '') === (entry.score || '');
    match.resultStatus = sameWinner && sameScore ? 'pendiente_admin' : 'revision_requerida';
  } else {
    match.resultStatus = 'sin_resultado';
  }

  match.resultProposals = proposals;
  match.markModified('resultProposals');
  await match.save();
  await populateMatchPlayers(match);

  const responseMatch = await serializeMatchesForResponse(match, {
    tournamentId,
    categoryId,
  });

  return res.json(responseMatch);
}

async function approveTournamentMatchResult(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId, matchId } = req.params;
  const { winner, score, notes } = req.body;

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

  const participantMap = await getMatchParticipantUserMap(match);
  const participantEntries = Array.from(participantMap.entries());
  const participantIds = participantEntries.map(([participantId]) => participantId);

  let winnerId = normalizeParticipantId(winner);
  let resolvedScore = typeof score === 'string' ? score.trim() : '';
  let resolvedNotes = typeof notes === 'string' ? notes.trim() : undefined;

  if (!winnerId) {
    if (participantEntries.length === 2) {
      const [firstEntry, secondEntry] = participantEntries;
      const firstProposal = firstEntry[1]
        .map((userId) => match.resultProposals.get(userId))
        .find((proposal) => Boolean(proposal && proposal.winner));
      const secondProposal = secondEntry[1]
        .map((userId) => match.resultProposals.get(userId))
        .find((proposal) => Boolean(proposal && proposal.winner));

      if (
        firstProposal &&
        secondProposal &&
        firstProposal.winner &&
        secondProposal.winner &&
        firstProposal.winner.toString() === secondProposal.winner.toString() &&
        (firstProposal.score || '') === (secondProposal.score || '')
      ) {
        winnerId = firstProposal.winner.toString();
        resolvedScore = firstProposal.score || '';
        resolvedNotes = firstProposal.notes || undefined;
      }
    }
  }

  if (!winnerId || !participantIds.includes(winnerId)) {
    return res.status(400).json({ message: 'Debe proporcionar un ganador válido para aprobar el resultado' });
  }

  await applyMatchOutcome(match, {
    winnerId,
    score: resolvedScore,
    notes: resolvedNotes,
    reportedBy: req.user.id,
  });

  await populateMatchPlayers(match);

  if (context.category.status !== TOURNAMENT_CATEGORY_STATUSES.FINISHED) {
    context.category.status = TOURNAMENT_CATEGORY_STATUSES.IN_PLAY;
    await context.category.save();
  }

  if (context.tournament.status !== TOURNAMENT_STATUS.FINISHED) {
    context.tournament.status = TOURNAMENT_STATUS.IN_PLAY;
    await context.tournament.save();
  }

  const responseMatch = await serializeMatchesForResponse(match, {
    categoryDoc: context.category,
  });

  return res.json(responseMatch);
}

async function resetTournamentMatchResult(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId, matchId } = req.params;

  const tournament = await Tournament.findById(tournamentId).select('isPrivate');
  if (!tournament) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  if (tournament.isPrivate && !canAccessPrivateContent(req.user)) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const match = await TournamentMatch.findOne({
    _id: matchId,
    tournament: tournamentId,
    category: categoryId,
  });

  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  await revertMatchProgress(match);

  match.result = undefined;
  match.status = TOURNAMENT_MATCH_STATUS.PENDING;
  match.resultStatus = 'sin_resultado';
  match.resultProposals = new Map();
  match.markModified('resultProposals');
  match.confirmations = createConfirmationEntries(
    match.players.map((player) => player && player.toString()).filter(Boolean)
  );
  match.markModified('confirmations');
  await match.save();
  await populateMatchPlayers(match);

  const responseMatch = await serializeMatchesForResponse(match, {
    tournamentId,
    categoryId,
  });

  return res.json(responseMatch);
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

  const participantMap = await getMatchParticipantUserMap(match);
  const participantEntries = Array.from(participantMap.entries());
  const userId = req.user.id.toString();
  const userEntry = participantEntries.find(([, users]) => users.includes(userId));

  if (!userEntry) {
    return res.status(403).json({ message: 'Solo los jugadores asignados pueden responder al partido' });
  }

  const [participantId] = userEntry;

  const confirmation = match.confirmations.get(participantId) || { status: 'pendiente' };
  confirmation.status = targetStatus;
  confirmation.respondedAt = new Date();
  match.confirmations.set(participantId, confirmation);

  if (targetStatus === 'rechazado') {
    match.status = TOURNAMENT_MATCH_STATUS.REJECTED;
  } else if (targetStatus === 'confirmado') {
    const allConfirmed = participantEntries.every(([entryId]) => {
      const entry = match.confirmations.get(entryId);
      return entry && entry.status === 'confirmado';
    });
    if (allConfirmed) {
      match.status = TOURNAMENT_MATCH_STATUS.CONFIRMED;
    } else if (match.status !== TOURNAMENT_MATCH_STATUS.CONFIRMED) {
      match.status = TOURNAMENT_MATCH_STATUS.SCHEDULED;
    }
  }

  match.markModified('confirmations');
  await match.save();
  await populateMatchPlayers(match);

  const responseMatch = await serializeMatchesForResponse(match, {
    tournamentId,
    categoryId,
  });

  return res.json(responseMatch);
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
  autoGenerateTournamentBracket,
  recalculateTournamentBracket,
  updateTournamentMatch,
  submitTournamentMatchResult,
  approveTournamentMatchResult,
  resetTournamentMatchResult,
  confirmTournamentMatch,
  rejectTournamentMatch,
  downloadTournamentOrderOfPlay,
};
