const { Match } = require('../models/Match');
const { Notification } = require('../models/Notification');
const { User } = require('../models/User');
const { refreshCategoryRanking } = require('./rankingService');

const MATCH_EXPIRATION_DAYS = 15;
const DEFAULT_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

function resolveWinnerForExpiredMatch(match) {
  const players = Array.isArray(match.players) ? match.players : [];
  if (players.length < 2) {
    return null;
  }

  const normalizedPlayers = players.map((player) => player.toString());

  if (match.proposal && match.proposal.requestedBy) {
    const requester = match.proposal.requestedBy.toString();
    if (normalizedPlayers.includes(requester)) {
      return requester;
    }
  }

  return null;
}

async function assignWalkoverResult(match) {
  const players = Array.isArray(match.players) ? match.players : [];
  if (players.length < 2) {
    return false;
  }

  const now = new Date();
  const playerIds = players.map((player) => player.toString());
  const winnerId = resolveWinnerForExpiredMatch(match);

  if (!winnerId) {
    return false;
  }

  const loserId = playerIds.find((playerId) => playerId !== winnerId);
  if (!loserId) {
    return false;
  }

  const winnerObjectId = players.find((player) => player.toString() === winnerId) || winnerId;
  const scores = new Map();
  scores.set(winnerId, 12);
  scores.set(loserId, 0);

  const confirmations = new Map();
  playerIds.forEach((playerId) => {
    confirmations.set(playerId, {
      status: 'aprobado',
      respondedAt: now,
    });
  });

  match.result = match.result || {};
  match.result.winner = winnerObjectId;
  match.result.sets = [
    {
      number: 1,
      scores: {
        [winnerId]: 6,
        [loserId]: 0,
      },
      tieBreak: false,
    },
    {
      number: 2,
      scores: {
        [winnerId]: 6,
        [loserId]: 0,
      },
      tieBreak: false,
    },
  ];
  match.result.scores = scores;
  match.result.notes = 'Partido asignado automáticamente por inactividad (WO).';
  match.result.reportedAt = now;
  match.result.status = 'confirmado';
  match.result.reportedBy = undefined;
  match.result.confirmations = confirmations;
  match.result.confirmedAt = now;
  match.result.confirmedBy = undefined;

  match.markModified('result.scores');
  match.markModified('result.confirmations');

  match.status = 'completado';
  match.proposal = undefined;
  match.scheduledAt = undefined;
  match.expiresAt = undefined;

  await match.save();
  await refreshCategoryRanking(match.category);

  try {
    const users = await User.find({ _id: { $in: players } })
      .select('fullName email')
      .lean();
    const nameMap = new Map();
    users.forEach((user) => {
      if (!user || !user._id) return;
      const key = user._id.toString();
      nameMap.set(key, user.fullName || user.email || 'Jugador');
    });

    const opponentNames = playerIds
      .map((playerId) => nameMap.get(playerId) || 'Jugador')
      .join(' vs ');
    const winnerName = nameMap.get(winnerId) || 'Jugador';

    await Notification.create({
      title: 'Partido asignado por inactividad',
      message: `${opponentNames}: se asignó una victoria 6-0 6-0 a ${winnerName} tras superar los 15 días sin confirmación.`,
      channel: 'app',
      scheduledFor: now,
      recipients: playerIds,
      match: match._id,
      metadata: {
        tipo: 'caducidad_partido',
        dias: MATCH_EXPIRATION_DAYS.toString(),
        resultado: '6-0 6-0',
      },
    });
  } catch (error) {
    console.error('No se pudo crear la notificación de partido asignado por inactividad', error);
  }

  return true;
}

async function markMatchAsExpiredWithoutWinner(match) {
  const players = Array.isArray(match.players) ? match.players : [];
  const now = new Date();

  match.status = 'caducado';
  match.proposal = undefined;
  match.scheduledAt = undefined;
  match.expiresAt = undefined;

  match.result = match.result || {};
  match.result.winner = undefined;
  match.result.sets = undefined;
  match.result.scores = undefined;
  match.result.notes = 'Partido caducado sin confirmaciones ni juego.';
  match.result.reportedBy = undefined;
  match.result.reportedAt = undefined;
  match.result.status = 'pendiente';
  match.result.confirmedBy = undefined;
  match.result.confirmedAt = undefined;

  const confirmations = new Map();
  players.forEach((player) => {
    if (!player) return;
    confirmations.set(player.toString(), {
      status: 'pendiente',
      respondedAt: undefined,
    });
  });
  match.result.confirmations = confirmations;

  match.markModified('result.confirmations');
  match.markModified('result.scores');
  match.markModified('result.sets');

  await match.save();

  try {
    const playerIds = players.map((player) => player.toString());
    if (!playerIds.length) {
      return;
    }

    const users = await User.find({ _id: { $in: players } })
      .select('fullName email')
      .lean();
    const nameMap = new Map();
    users.forEach((user) => {
      if (!user || !user._id) return;
      nameMap.set(user._id.toString(), user.fullName || user.email || 'Jugador');
    });

    const opponentNames = playerIds
      .map((playerId) => nameMap.get(playerId) || 'Jugador')
      .join(' vs ');

    await Notification.create({
      title: 'Partido caducado sin puntos',
      message: `${opponentNames}: se agotó el plazo de ${MATCH_EXPIRATION_DAYS} días sin confirmaciones ni juego, por lo que el partido no otorga puntos.`,
      channel: 'app',
      scheduledFor: now,
      recipients: playerIds,
      match: match._id,
      metadata: {
        tipo: 'caducidad_partido',
        dias: MATCH_EXPIRATION_DAYS.toString(),
        resultado: 'sin_puntos',
      },
    });
  } catch (error) {
    console.error('No se pudo crear la notificación de partido caducado sin puntos', error);
  }
}

async function processExpiredMatches() {
  const now = new Date();
  const expiredMatches = await Match.find({
    status: { $in: ['pendiente', 'programado'] },
    expiresAt: { $lte: now },
    $or: [{ 'result.status': { $exists: false } }, { 'result.status': 'pendiente' }],
  });

  if (!expiredMatches.length) {
    return;
  }

  for (const match of expiredMatches) {
    try {
      const assigned = await assignWalkoverResult(match);
      if (!assigned) {
        await markMatchAsExpiredWithoutWinner(match);
      }
    } catch (error) {
      console.error('No se pudo asignar el resultado automático del partido', {
        matchId: match._id?.toString(),
        error,
      });
    }
  }
}

function scheduleMatchExpirationChecks() {
  const intervalValue = Number(process.env.MATCH_EXPIRATION_INTERVAL_MS || DEFAULT_CHECK_INTERVAL_MS);
  const intervalMs = Number.isFinite(intervalValue) && intervalValue > 0 ? intervalValue : DEFAULT_CHECK_INTERVAL_MS;

  const runCheck = () => {
    processExpiredMatches().catch((error) => {
      console.error('Error procesando partidos caducados', error);
    });
  };

  runCheck();
  setInterval(runCheck, intervalMs).unref();
}

module.exports = {
  MATCH_EXPIRATION_DAYS,
  scheduleMatchExpirationChecks,
  processExpiredMatches,
};
