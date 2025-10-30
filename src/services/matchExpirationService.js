const { Op } = require('sequelize');
const { getSequelize } = require('../config/database');

const MATCH_EXPIRATION_DAYS = 15;
const DEFAULT_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

async function resolveWinnerForExpiredMatch(match) {
  if (!match.players || match.players.length < 2) {
    return null;
  }

  if (match.proposal && match.proposal.requestedBy) {
    if (match.players.includes(match.proposal.requestedBy)) {
      return match.proposal.requestedBy;
    }
  }

  return null;
}

async function assignWalkoverResult(match, models) {
  const { Match, User, Notification } = models;
  
  if (!match.players || match.players.length < 2) {
    return false;
  }

  const now = new Date();
  const winnerId = await resolveWinnerForExpiredMatch(match);

  if (!winnerId) {
    return false;
  }

  const loserId = match.players.find(playerId => playerId !== winnerId);
  if (!loserId) {
    return false;
  }

  // Actualizar el partido
  await Match.update({
    status: 'completed',
    score: '6-0,6-0',
    winnerId: winnerId,
    resultStatus: 'confirmed',
    resultSubmittedAt: now,
    resultConfirmedAt: now,
    expirationDate: null
  }, {
    where: { id: match.id }
  });

  // Crear notificación
  try {
    const players = await User.findAll({
      where: { id: { [Op.in]: match.players } },
      attributes: ['id', 'fullName', 'email']
    });

    const nameMap = new Map();
    players.forEach(user => {
      nameMap.set(user.id, user.fullName || user.email || 'Jugador');
    });

    const opponentNames = match.players
      .map(playerId => nameMap.get(playerId) || 'Jugador')
      .join(' vs ');
    const winnerName = nameMap.get(winnerId) || 'Jugador';

    await Notification.create({
      title: 'Partido asignado por inactividad',
      message: `${opponentNames}: se asignó una victoria 6-0 6-0 a ${winnerName} tras superar los 15 días sin confirmación.`,
      recipients: match.players,
      matchId: match.id,
      metadata: {
        tipo: 'caducidad_partido',
        dias: MATCH_EXPIRATION_DAYS.toString(),
        resultado: '6-0 6-0'
      }
    });
  } catch (error) {
    console.error('No se pudo crear la notificación de partido asignado por inactividad', error);
  }

  return true;
}

async function markMatchAsExpiredWithoutWinner(match, models) {
  const { Match, User, Notification } = models;
  const now = new Date();

  // Actualizar el partido
  await Match.update({
    status: 'expired',
    score: null,
    winner: null,
    resultStatus: 'pending',
    expirationDate: null
  }, {
    where: { id: match.id }
  });

  // Crear notificación
  try {
    const players = await User.findAll({
      where: { id: { [Op.in]: match.players } },
      attributes: ['id', 'fullName', 'email']
    });

    const nameMap = new Map();
    players.forEach(user => {
      nameMap.set(user.id, user.fullName || user.email || 'Jugador');
    });

    const opponentNames = match.players
      .map(playerId => nameMap.get(playerId) || 'Jugador')
      .join(' vs ');

    await Notification.create({
      title: 'Partido caducado sin puntos',
      message: `${opponentNames}: se agotó el plazo de ${MATCH_EXPIRATION_DAYS} días sin confirmaciones ni juego, por lo que el partido no otorga puntos.`,
      recipients: match.players,
      matchId: match.id,
      metadata: {
        tipo: 'caducidad_partido',
        dias: MATCH_EXPIRATION_DAYS.toString(),
        resultado: 'sin_puntos'
      }
    });
  } catch (error) {
    console.error('No se pudo crear la notificación de partido caducado sin puntos', error);
  }
}

async function processExpiredMatches() {
  const sequelize = getSequelize();
  const { Match, User, Notification } = await sequelize.models;

  const now = new Date();
  const expiredMatches = await Match.findAll({
    where: {
      status: {
        [Op.in]: ['pending', 'proposed', 'scheduled']
      },
      expirationDate: {
        [Op.lte]: now
      },
      resultStatus: 'pending'
    }
  });

  if (!expiredMatches.length) {
    return;
  }

  const models = { Match, User, Notification };

  for (const match of expiredMatches) {
    try {
      const assigned = await assignWalkoverResult(match, models);
      if (!assigned) {
        await markMatchAsExpiredWithoutWinner(match, models);
      }
    } catch (error) {
      console.error('No se pudo asignar el resultado automático del partido', {
        matchId: match.id,
        error
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
