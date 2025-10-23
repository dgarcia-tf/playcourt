const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Tournament, TOURNAMENT_STATUS } = require('../models/Tournament');
const { TournamentCategory, TOURNAMENT_CATEGORY_STATUSES } = require('../models/TournamentCategory');
const {
  TournamentEnrollment,
  TOURNAMENT_ENROLLMENT_STATUS,
} = require('../models/TournamentEnrollment');
const {
  TournamentMatch,
  TOURNAMENT_MATCH_STATUS,
  TOURNAMENT_BRACKETS,
} = require('../models/TournamentMatch');
const { notifyTournamentMatchScheduled } = require('../services/tournamentNotificationService');
const { canAccessPrivateContent } = require('../utils/accessControl');

const ROUND_NAME_LABELS = {
  1: 'Final',
  2: 'Semifinales',
  3: 'Cuartos de final',
  4: 'Octavos de final',
  5: 'Dieciseisavos de final',
};

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

  const matches = await TournamentMatch.find({
    tournament: tournamentId,
    category: categoryId,
  })
    .populate('players', 'fullName gender rating photo');

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
    status: { $ne: TOURNAMENT_ENROLLMENT_STATUS.CANCELLED },
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

  const enrollments = await TournamentEnrollment.find({
    tournament: tournamentId,
    category: categoryId,
    status: { $ne: TOURNAMENT_ENROLLMENT_STATUS.CANCELLED },
  })
    .select('user createdAt')
    .sort({ createdAt: 1 });

  const playerIds = enrollments.map((enrollment) => enrollment.user.toString());
  const uniquePlayers = Array.from(new Set(playerIds));

  if (uniquePlayers.length < 2) {
    return res.status(400).json({ message: 'Se necesitan al menos dos jugadores para generar el cuadro' });
  }

  const drawSize = category.drawSize && category.drawSize >= uniquePlayers.length
    ? nextPowerOfTwo(category.drawSize)
    : nextPowerOfTwo(uniquePlayers.length);

  const seedPositions = generateSeedingPositions(drawSize);
  const slotAssignments = new Array(drawSize).fill(null);
  const slotSeedNumbers = new Array(drawSize).fill(undefined);

  const seeds = Array.isArray(category.seeds)
    ? category.seeds
        .filter((seed) => seed && uniquePlayers.includes(seed.player.toString()))
        .sort((a, b) => a.seedNumber - b.seedNumber)
    : [];

  seeds.forEach((seed, index) => {
    const slotIndex = seedPositions[index] - 1;
    if (slotIndex >= 0 && slotIndex < drawSize) {
      slotAssignments[slotIndex] = seed.player.toString();
      slotSeedNumbers[slotIndex] = seed.seedNumber;
    }
  });

  const seededPlayers = new Set(seeds.map((seed) => seed.player.toString()));
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

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const matchesInRound = drawSize / 2 ** (roundIndex + 1);
    const roundName = resolveRoundName(roundIndex, totalRounds);
    const roundMatches = [];
    const roundDrawMatches = [];

    for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex += 1) {
      const players = [];
      const seedsForMatch = { seedA: undefined, seedB: undefined };

      if (roundIndex === 0) {
        const slotAIndex = matchIndex * 2;
        const slotBIndex = slotAIndex + 1;
        const playerA = slotAssignments[slotAIndex];
        const playerB = slotAssignments[slotBIndex];
        if (playerA) players.push(playerA);
        if (playerB) players.push(playerB);
        seedsForMatch.seedA = slotSeedNumbers[slotAIndex];
        seedsForMatch.seedB = slotSeedNumbers[slotBIndex];
        roundDrawMatches.push({
          matchNumber: matchIndex + 1,
          playerA: playerA ? new mongoose.Types.ObjectId(playerA) : undefined,
          playerB: playerB ? new mongoose.Types.ObjectId(playerB) : undefined,
          seedA: seedsForMatch.seedA,
          seedB: seedsForMatch.seedB,
        });
      } else {
        roundDrawMatches.push({ matchNumber: matchIndex + 1 });
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

  for (let roundIndex = 0; roundIndex < mainMatchesMatrix.length - 1; roundIndex += 1) {
    const currentRound = mainMatchesMatrix[roundIndex];
    const nextRound = mainMatchesMatrix[roundIndex + 1];

    currentRound.forEach((match, index) => {
      const targetMatch = nextRound[Math.floor(index / 2)];
      match.nextMatch = targetMatch._id;
      match.nextMatchSlot = index % 2;
      targetMatch.previousMatches.push(match._id);
    });
  }

  const firstRoundMatches = mainMatchesMatrix[0];
  const loserDrawSize = drawSize / 2;
  const consolationPayloads = [];
  const consolationDrawRounds = [];
  const consolationMatrix = [];

  if (loserDrawSize >= 2) {
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
    firstRoundMatches.forEach((match, index) => {
      const target = consolationFirstRound[Math.floor(index / 2)];
      if (target) {
        match.loserNextMatch = target._id;
        match.loserNextMatchSlot = index % 2;
      }
    });

    consolationPayloads.push(...consolationMatrix.flat());
  }

  const payloads = [...mainMatchesMatrix.flat(), ...consolationPayloads];

  await TournamentMatch.deleteMany({ tournament: tournamentId, category: categoryId });
  await TournamentMatch.insertMany(payloads);

  category.draw = drawRounds;
  category.consolationDraw = consolationDrawRounds;
  category.drawSize = drawSize;
  category.status = TOURNAMENT_CATEGORY_STATUSES.IN_PLAY;
  category.markModified('draw');
  category.markModified('consolationDraw');
  await category.save();

  if (tournament.status !== TOURNAMENT_STATUS.FINISHED) {
    tournament.status = TOURNAMENT_STATUS.IN_PLAY;
    await tournament.save();
  }

  await autoAdvanceByes(tournamentId, categoryId, req.user.id);

  const matches = await TournamentMatch.find({ tournament: tournamentId, category: categoryId })
    .populate('players', 'fullName gender rating photo')
    .sort({ roundOrder: 1, matchNumber: 1, createdAt: 1 });

  return res.status(201).json(matches);
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

  matches.forEach((match) => {
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

    const winnerId = match.result?.winner ? match.result.winner.toString() : '';
    if (winnerId) {
      entry.winner = toObjectId(winnerId);
    } else {
      delete entry.winner;
    }
  });

  category.markModified('draw');
  category.markModified('consolationDraw');
  await category.save();

  const populatedMatches = await TournamentMatch.find({
    tournament: tournamentId,
    category: categoryId,
  })
    .populate('players', 'fullName gender rating photo')
    .sort({ roundOrder: 1, matchNumber: 1, createdAt: 1 });

  return res.json(populatedMatches);
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

  if (!match.players.map((player) => player && player.toString()).includes(req.user.id)) {
    return res.status(403).json({ message: 'Solo los jugadores asignados pueden reportar resultados' });
  }

  if (match.status === TOURNAMENT_MATCH_STATUS.COMPLETED) {
    return res.status(400).json({ message: 'El partido ya tiene un resultado confirmado' });
  }

  if (!winner) {
    return res.status(400).json({ message: 'Debe indicar el ganador del partido' });
  }

  const playerIds = match.players.map((player) => player && player.toString()).filter(Boolean);
  if (!playerIds.includes(winner)) {
    return res.status(400).json({ message: 'El ganador debe ser uno de los jugadores del partido' });
  }

  const proposals = match.resultProposals;
  const entry = proposals.get(req.user.id) || {};
  entry.winner = new mongoose.Types.ObjectId(winner);
  entry.score = typeof score === 'string' ? score.trim() : '';
  entry.notes = typeof notes === 'string' ? notes.trim() : undefined;
  entry.submittedAt = new Date();
  proposals.set(req.user.id, entry);

  const otherPlayerId = playerIds.find((playerId) => playerId !== req.user.id);
  const otherProposal = otherPlayerId ? proposals.get(otherPlayerId) : null;

  if (otherProposal) {
    const sameWinner = otherProposal.winner && otherProposal.winner.toString() === winner;
    const sameScore = (otherProposal.score || '') === (entry.score || '');
    match.resultStatus = sameWinner && sameScore ? 'pendiente_admin' : 'revision_requerida';
  } else {
    match.resultStatus = 'sin_resultado';
  }

  match.resultProposals = proposals;
  match.markModified('resultProposals');
  await match.save();
  await match.populate('players', 'fullName gender rating photo');

  return res.json(match);
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

  const playerIds = match.players.map((player) => player && player.toString()).filter(Boolean);

  let winnerId = winner;
  let resolvedScore = typeof score === 'string' ? score.trim() : '';
  let resolvedNotes = typeof notes === 'string' ? notes.trim() : undefined;

  if (!winnerId) {
    const [firstPlayerId, secondPlayerId] = playerIds;
    const firstProposal = match.resultProposals.get(firstPlayerId);
    const secondProposal = match.resultProposals.get(secondPlayerId);
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

  if (!winnerId || !playerIds.includes(winnerId)) {
    return res.status(400).json({ message: 'Debe proporcionar un ganador válido para aprobar el resultado' });
  }

  await applyMatchOutcome(match, {
    winnerId,
    score: resolvedScore,
    notes: resolvedNotes,
    reportedBy: req.user.id,
  });

  await match.populate('players', 'fullName gender rating photo');

  if (context.category.status !== TOURNAMENT_CATEGORY_STATUSES.FINISHED) {
    context.category.status = TOURNAMENT_CATEGORY_STATUSES.IN_PLAY;
    await context.category.save();
  }

  if (context.tournament.status !== TOURNAMENT_STATUS.FINISHED) {
    context.tournament.status = TOURNAMENT_STATUS.IN_PLAY;
    await context.tournament.save();
  }

  return res.json(match);
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
  autoGenerateTournamentBracket,
  recalculateTournamentBracket,
  updateTournamentMatch,
  submitTournamentMatchResult,
  approveTournamentMatchResult,
  resetTournamentMatchResult,
  confirmTournamentMatch,
  rejectTournamentMatch,
};
