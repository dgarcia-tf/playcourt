const { Notification } = require('../models/Notification');
const { Enrollment } = require('../models/Enrollment');
const { User, USER_ROLES } = require('../models/User');
const {
  MATCH_RESULT_AUTO_CONFIRM_MINUTES,
} = require('../config/matchResults');

function toObjectIdString(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Date) {
    return null;
  }

  if (typeof value.toString === 'function') {
    return value.toString();
  }

  return null;
}

function buildNameMap(users = []) {
  const map = new Map();
  users.forEach((user) => {
    if (!user || !user._id) {
      return;
    }
    const key = user._id.toString();
    const label = user.fullName || user.email || 'Jugador';
    map.set(key, label);
  });
  return map;
}

async function notifyPendingResultConfirmation(matchDoc, reporterId) {
  if (!matchDoc || !matchDoc.players || !matchDoc.result) {
    return;
  }

  const reporter = toObjectIdString(reporterId);
  const players = Array.isArray(matchDoc.players) ? matchDoc.players : [];
  const playerIds = players
    .map((player) => toObjectIdString(player?._id || player))
    .filter(Boolean);

  if (!playerIds.length) {
    return;
  }

  const rawConfirmations = matchDoc.result.confirmations;
  const confirmationMap =
    rawConfirmations instanceof Map
      ? rawConfirmations
      : new Map(Object.entries(rawConfirmations || {}));

  const pendingRecipients = playerIds.filter((playerId) => {
    if (playerId === reporter) {
      return false;
    }
    const entry = confirmationMap.get(playerId);
    return !entry || entry.status !== 'aprobado';
  });

  if (!pendingRecipients.length) {
    return;
  }

  try {
    const users = await User.find({ _id: { $in: playerIds } })
      .select('fullName email')
      .lean();
    const nameMap = buildNameMap(users);

    const reporterName = reporter ? nameMap.get(reporter) || 'Tu rival' : 'Tu rival';
    const opponentNames = pendingRecipients
      .map((playerId) => nameMap.get(playerId) || 'Jugador')
      .join(' vs ');

    const messageParts = [`${reporterName} ha registrado el resultado del partido.`];
    messageParts.push(
      `Confírmalo en los próximos ${MATCH_RESULT_AUTO_CONFIRM_MINUTES} minutos o se aprobará automáticamente.`
    );

    await Notification.create({
      title: 'Confirmar resultado del partido',
      message: messageParts.join(' '),
      channel: 'app',
      scheduledFor: new Date(),
      recipients: pendingRecipients,
      match: matchDoc._id,
      metadata: {
        tipo: 'resultado_pendiente',
        oponentes: opponentNames,
        minutos: MATCH_RESULT_AUTO_CONFIRM_MINUTES.toString(),
      },
      createdBy: reporter || undefined,
    });
  } catch (error) {
    console.error('No se pudo crear la notificación de confirmación de resultado pendiente', error);
  }
}

async function notifyResultConfirmed(matchDoc, actorId, options = {}) {
  if (!matchDoc || !matchDoc.players) {
    return;
  }

  const players = Array.isArray(matchDoc.players) ? matchDoc.players : [];
  const playerIds = players
    .map((player) => toObjectIdString(player?._id || player))
    .filter(Boolean);

  if (!playerIds.length) {
    return;
  }

  const categoryId = toObjectIdString(matchDoc.category?._id || matchDoc.category);

  try {
    let participantEnrollments = [];
    if (categoryId) {
      participantEnrollments = await Enrollment.find({
        category: categoryId,
        user: { $in: playerIds },
      })
        .populate('user', 'fullName email notifyMatchResults')
        .lean();
    }

    const playerRecipients = participantEnrollments
      .map((enrollment) => enrollment.user)
      .filter((user) => user && user._id && user.notifyMatchResults !== false)
      .map((user) => user._id.toString());

    const adminRecipients = await User.find({
      roles: USER_ROLES.ADMIN,
      notifyMatchResults: { $ne: false },
    })
      .select('_id')
      .lean();

    const recipientSet = new Set(playerRecipients);
    adminRecipients.forEach(({ _id }) => {
      if (_id) {
        recipientSet.add(_id.toString());
      }
    });

    if (!recipientSet.size) {
      return;
    }

    const users = await User.find({ _id: { $in: playerIds } })
      .select('fullName email')
      .lean();
    const nameMap = buildNameMap(users);

    const opponentNames = playerIds
      .map((playerId) => nameMap.get(playerId) || 'Jugador')
      .join(' vs ');

    const baseMessage = opponentNames
      ? `Se confirmó el partido ${opponentNames}.`
      : 'Se confirmó un partido de la liga.';

    await Notification.create({
      title: 'Partido finalizado',
      message: options.message || baseMessage,
      channel: 'app',
      scheduledFor: new Date(),
      recipients: Array.from(recipientSet),
      match: matchDoc._id,
      metadata: {
        categoria: matchDoc.category?.name,
        estado: matchDoc.status,
        tipo: 'resultado_confirmado',
      },
      createdBy: toObjectIdString(actorId) || undefined,
    });
  } catch (error) {
    console.error('No se pudo crear la notificación de resultado confirmado', error);
  }
}

module.exports = {
  notifyPendingResultConfirmation,
  notifyResultConfirmed,
};
