const { Op } = require('sequelize');
const { getSequelize } = require('../../config/database');
const { sendPushNotification } = require('../pushNotificationService');

function formatDateTime(value) {
  if (!value) {
    return 'Por definir';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Por definir';
  }

  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
  } catch (error) {
    return date.toISOString();
  }
}

async function notifyTournamentMatchScheduled({
  tournament,
  category,
  match,
  players = [],
  playerType = 'User',
}) {
  const sequelize = getSequelize();
  const { Notification, TournamentDoublesPair } = sequelize.models;

  if (!match || !Array.isArray(players) || !players.length) {
    return null;
  }

  const participantIds = players
    .map(player => {
      if (!player) return '';
      if (typeof player === 'string') return player;
      if (player instanceof Date) return '';
      if (typeof player === 'object' && player !== null) {
        if (player.id) return player.id.toString();
      }
      return player.toString();
    })
    .filter(Boolean);

  let recipientIds = participantIds;

  if (playerType === 'TournamentDoublesPair') {
    const pairs = await TournamentDoublesPair.findAll({
      where: {
        id: {
          [Op.in]: participantIds
        }
      },
      attributes: ['player1Id', 'player2Id']
    });

    recipientIds = pairs.reduce((acc, pair) => {
      if (pair.player1Id) acc.push(pair.player1Id.toString());
      if (pair.player2Id) acc.push(pair.player2Id.toString());
      return acc;
    }, []);
  }

  if (!recipientIds.length) {
    return null;
  }

  recipientIds = Array.from(new Set(recipientIds));

  const title = `Partido programado - ${tournament?.name || 'Torneo'}`;
  const messageParts = [
    category?.name ? `Categoría ${category.name}` : null,
    match.round ? `Ronda: ${match.round}` : null,
    match.court ? `Pista: ${match.court}` : null,
    `Horario: ${formatDateTime(match.scheduledAt)}`,
  ].filter(Boolean);

  const notification = await Notification.create({
    title,
    message: messageParts.join(' · '),
    channel: 'app',
    metadata: {
      tournamentId: tournament?.id?.toString(),
      categoryId: category?.id?.toString(),
      matchId: match.id?.toString(),
      type: 'tournament_match',
    }
  });

  // Set the recipients
  await notification.setRecipients(recipientIds);

  await sendPushNotification(notification).catch(() => null);

  return notification;
}

module.exports = {
  notifyTournamentMatchScheduled,
};