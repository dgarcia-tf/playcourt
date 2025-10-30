const { Op } = require('sequelize');
const { getSequelize } = require('../../config/database');

const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

async function notifyAdminsOfNewUser(user, { actorId } = {}) {
  const sequelize = getSequelize();
  const { User, Notification } = sequelize.models;

  if (!user) {
    return;
  }

  try {
    const adminRecipients = await User.findAll({
      where: {
        roles: {
          [Op.contains]: [USER_ROLES.ADMIN]
        },
        id: {
          [Op.notIn]: [user.id, actorId].filter(Boolean)
        }
      },
      attributes: ['id']
    });

    const recipients = adminRecipients.map(admin => admin.id).filter(Boolean);

    if (!recipients.length) {
      return;
    }

    const displayName = user.fullName || user.email || 'Nuevo usuario';
    const isMember = Boolean(user.isMember);
    const membershipNumber = user.membershipNumber;
    const verificationStatus = Boolean(user.membershipNumberVerified);

    const fragments = [`Se ha registrado ${displayName}.`];
    if (isMember) {
      fragments.push('Revisa y valida su número de socio desde el directorio de jugadores.');
    } else {
      fragments.push('Revisa su perfil desde el directorio de jugadores.');
    }

    const metadata = {
      tipo: 'nuevo_usuario',
      usuario: user.id.toString(),
      socio: isMember ? 'true' : 'false',
      socio_validado: verificationStatus ? 'true' : 'false'
    };

    if (membershipNumber) {
      metadata.numero_socio = membershipNumber;
    }

    const notification = await Notification.create({
      title: 'Nuevo usuario registrado',
      message: fragments.join(' '),
      channel: 'app',
      scheduledFor: new Date(),
      metadata,
      createdBy: actorId
    });

    // Set the recipients using the many-to-many relationship
    await notification.setRecipients(recipients);
  } catch (error) {
    console.error('No se pudo crear la notificación de nuevo usuario', error);
  }
}

module.exports = {
  notifyAdminsOfNewUser,
  USER_ROLES
};