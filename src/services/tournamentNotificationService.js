const mongoose = require('mongoose');
const { Notification } = require('../models/Notification');
const { TournamentDoublesPair } = require('../models/TournamentDoublesPair');
const { sendPushNotification } = require('./pushNotificationService');

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
  if (!match || !Array.isArray(players) || !players.length) {
    return null;
  }

  const participantIds = players
    .map((player) => {
      if (!player) return '';
      if (typeof player === 'string') return player;
      if (player instanceof Date) return '';
      if (typeof player === 'object' && player !== null) {
        if (player._id) return player._id.toString();
        if (player.id) return player.id.toString();
      }
      try {
        return player.toString();
      } catch (error) {
        return '';
      }
    })
    .filter(Boolean);

  let recipientIds = participantIds;

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

    recipientIds = pairs
      .flatMap((pair) =>
        Array.isArray(pair.players)
          ? pair.players.map((player) => player && player.toString()).filter(Boolean)
          : []
      )
      .filter(Boolean);
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
    recipients: recipientIds,
    metadata: {
      tournamentId: tournament?._id?.toString() || tournament?.id?.toString(),
      categoryId: category?._id?.toString() || category?.id?.toString(),
      matchId: match._id?.toString(),
      type: 'tournament_match',
    },
  });

  await sendPushNotification(notification).catch(() => null);

  return notification;
}

module.exports = {
  notifyTournamentMatchScheduled,
};
