const { Notification } = require('../models/Notification');
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

async function notifyTournamentMatchScheduled({ tournament, category, match, players = [] }) {
  if (!match || !Array.isArray(players) || !players.length) {
    return null;
  }

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
    recipients: players.map((player) => player.toString()),
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
