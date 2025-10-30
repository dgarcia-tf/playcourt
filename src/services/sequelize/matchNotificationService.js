const { Op } = require('sequelize');
const { getSequelize } = require('../../config/database');
const { MATCH_RESULT_AUTO_CONFIRM_MINUTES } = require('../../config/matchResults');

const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

function toIdString(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Date) {
    return null;
  }

  return value.toString();
}

function buildNameMap(users = []) {
  const map = new Map();
  users.forEach((user) => {
    if (!user || !user.id) {
      return;
    }
    const key = user.id.toString();
    const label = user.fullName || user.email || 'Jugador';
    map.set(key, label);
  });
  return map;
}

async function notifyPendingResultConfirmation(match, reporterId) {
  const sequelize = getSequelize();
  const { User, Notification } = sequelize.models;

  if (!match || !match.players || !match.result) {
    return;
  }

  const reporter = toIdString(reporterId);
  const playerIds = match.players
    .map(player => toIdString(player?.id || player))
    .filter(Boolean);

  if (!playerIds.length) {
    return;
  }

  const confirmations = match.result.confirmations || {};
  const pendingRecipients = playerIds.filter(playerId => {
    if (playerId === reporter) {
      return false;
    }
    const entry = confirmations[playerId];
    return !entry || entry.status !== 'aprobado';
  });

  if (!pendingRecipients.length) {
    return;
  }

  try {
    const users = await User.findAll({
      where: { 
        id: { 
          [Op.in]: playerIds 
        } 
      },
      attributes: ['id', 'fullName', 'email']
    });

    const nameMap = buildNameMap(users);
    const reporterName = reporter ? nameMap.get(reporter) || 'Tu rival' : 'Tu rival';
    const opponentNames = pendingRecipients
      .map(playerId => nameMap.get(playerId) || 'Jugador')
      .join(' vs ');

    const messageParts = [`${reporterName} ha registrado el resultado del partido.`];
    messageParts.push(
      `Confírmalo en los próximos ${MATCH_RESULT_AUTO_CONFIRM_MINUTES} minutos o se aprobará automáticamente.`
    );

    const notification = await Notification.create({
      title: 'Confirmar resultado del partido',
      message: messageParts.join(' '),
      channel: 'app',
      scheduledFor: new Date(),
      matchId: match.id,
      metadata: {
        tipo: 'resultado_pendiente',
        oponentes: opponentNames,
        minutos: MATCH_RESULT_AUTO_CONFIRM_MINUTES.toString(),
      },
      createdBy: reporter || null
    });

    await notification.setRecipients(pendingRecipients);
  } catch (error) {
    console.error('No se pudo crear la notificación de confirmación de resultado pendiente', error);
  }
}

async function notifyResultConfirmed(match, actorId, options = {}) {
  const sequelize = getSequelize();
  const { User, Enrollment, Notification } = sequelize.models;

  if (!match || !match.players) {
    return;
  }

  const playerIds = match.players
    .map(player => toIdString(player?.id || player))
    .filter(Boolean);

  if (!playerIds.length) {
    return;
  }

  try {
    let participantEnrollments = [];
    if (match.categoryId) {
      participantEnrollments = await Enrollment.findAll({
        where: {
          categoryId: match.categoryId,
          userId: {
            [Op.in]: playerIds
          }
        },
        include: [{
          model: User,
          as: 'player',
          attributes: ['id', 'fullName', 'email', 'notifyMatchResults']
        }]
      });
    }

    const playerRecipients = participantEnrollments
      .map(enrollment => enrollment.player)
      .filter(user => user && user.id && user.notifyMatchResults !== false)
      .map(user => user.id.toString());

    const adminRecipients = await User.findAll({
      where: {
        roles: {
          [Op.contains]: [USER_ROLES.ADMIN]
        },
        notifyMatchResults: {
          [Op.not]: false
        }
      },
      attributes: ['id']
    });

    const recipientSet = new Set(playerRecipients);
    adminRecipients.forEach(admin => {
      if (admin.id) {
        recipientSet.add(admin.id.toString());
      }
    });

    if (!recipientSet.size) {
      return;
    }

    const users = await User.findAll({
      where: {
        id: {
          [Op.in]: playerIds
        }
      },
      attributes: ['id', 'fullName', 'email']
    });

    const nameMap = buildNameMap(users);
    const opponentNames = playerIds
      .map(playerId => nameMap.get(playerId) || 'Jugador')
      .join(' vs ');

    const baseMessage = opponentNames
      ? `Se confirmó el partido ${opponentNames}.`
      : 'Se confirmó un partido de la liga.';

    const notification = await Notification.create({
      title: 'Partido finalizado',
      message: options.message || baseMessage,
      channel: 'app',
      scheduledFor: new Date(),
      matchId: match.id,
      metadata: {
        categoria: match.category?.name,
        estado: match.status,
        tipo: 'resultado_confirmado',
      },
      createdBy: toIdString(actorId) || null
    });

    await notification.setRecipients(Array.from(recipientSet));
  } catch (error) {
    console.error('No se pudo crear la notificación de resultado confirmado', error);
  }
}

async function notifyScheduleConfirmationRequest(match, actorId) {
  const sequelize = getSequelize();
  const { User, Notification } = sequelize.models;

  if (!match || !match.players || !match.scheduledAt) {
    return;
  }

  const playerIds = match.players
    .map(player => toIdString(player?.id || player))
    .filter(Boolean);

  if (!playerIds.length) {
    return;
  }

  try {
    const users = await User.findAll({
      where: {
        id: {
          [Op.in]: playerIds
        },
        notifyMatchRequests: {
          [Op.not]: false
        }
      },
      attributes: ['id', 'fullName', 'email']
    });

    const nameMap = buildNameMap(users);
    const recipients = users.map(user => user.id.toString());

    if (!recipients.length) {
      return;
    }

    const opponentNames = playerIds
      .map(playerId => nameMap.get(playerId) || 'Jugador')
      .join(' vs ');

    const scheduledAt = new Date(match.scheduledAt);

    if (Number.isNaN(scheduledAt.getTime())) {
      return;
    }

    const courtLabel = match.court ? ` en la pista ${match.court}` : '';
    const baseMessage = opponentNames
      ? `Se programó el partido ${opponentNames} para el ${scheduledAt.toISOString()}${courtLabel}.`
      : `Se programó un partido para el ${scheduledAt.toISOString()}${courtLabel}.`;

    const metadata = {
      tipo: 'horario_pendiente',
      categoria: match.category?.name || '',
      programadoPara: scheduledAt.toISOString(),
      pista: match.court || ''
    };

    const notification = await Notification.create({
      title: 'Confirma la fecha del partido',
      message: `${baseMessage} Confírmala o recházala desde la app.`,
      channel: 'app',
      scheduledFor: new Date(),
      matchId: match.id,
      metadata,
      createdBy: toIdString(actorId) || null
    });

    await notification.setRecipients(recipients);
  } catch (error) {
    console.error('No se pudo crear la notificación de confirmación de horario', error);
  }
}

async function notifyScheduleRejected(match, rejectingPlayerId, reason) {
  const sequelize = getSequelize();
  const { User, Notification } = sequelize.models;

  if (!match || !match.players) {
    return;
  }

  const playerIds = match.players
    .map(player => toIdString(player?.id || player))
    .filter(Boolean);

  if (!playerIds.length) {
    return;
  }

  const rejectingPlayer = toIdString(rejectingPlayerId);

  try {
    const [users, admins] = await Promise.all([
      User.findAll({
        where: {
          id: {
            [Op.in]: playerIds
          }
        },
        attributes: ['id', 'fullName', 'email']
      }),
      User.findAll({
        where: {
          roles: {
            [Op.contains]: [USER_ROLES.ADMIN]
          }
        },
        attributes: ['id']
      })
    ]);

    const adminRecipients = admins
      .map(admin => toIdString(admin?.id))
      .filter(Boolean);

    if (!adminRecipients.length) {
      return;
    }

    const nameMap = buildNameMap(users);
    const rejectingName = rejectingPlayer ? nameMap.get(rejectingPlayer) || 'Un jugador' : 'Un jugador';
    const opponentNames = playerIds
      .map(playerId => nameMap.get(playerId) || 'Jugador')
      .join(' vs ');

    const scheduledAt = match.scheduledAt ? new Date(match.scheduledAt) : null;
    const scheduledLabel = scheduledAt && !Number.isNaN(scheduledAt.getTime())
      ? ` programado para el ${scheduledAt.toISOString()}`
      : '';

    const courtLabel = match.court ? ` en la pista ${match.court}` : '';

    const baseMessage = opponentNames
      ? `${rejectingName} rechazó la fecha del partido ${opponentNames}${scheduledLabel}${courtLabel}.`
      : `${rejectingName} rechazó la fecha de un partido${scheduledLabel}${courtLabel}.`;

    const reasonMessage = reason ? ` Motivo: ${reason}` : '';

    const metadata = {
      tipo: 'horario_rechazado',
      categoria: match.category?.name || '',
      programadoPara: scheduledAt?.toISOString(),
      pista: match.court || '',
      motivo: reason || ''
    };

    const notification = await Notification.create({
      title: 'Horario de partido rechazado',
      message: `${baseMessage}${reasonMessage}`,
      channel: 'app',
      scheduledFor: new Date(),
      matchId: match.id,
      metadata,
      createdBy: rejectingPlayer || null
    });

    await notification.setRecipients(adminRecipients);
  } catch (error) {
    console.error('No se pudo crear la notificación de rechazo de horario', error);
  }
}

module.exports = {
  notifyPendingResultConfirmation,
  notifyResultConfirmed,
  notifyScheduleConfirmationRequest,
  notifyScheduleRejected,
};