const { Notification } = require('../models/Notification');
const { User, USER_ROLES } = require('../models/User');

async function notifyAdminsOfNewUser(user, { actorId } = {}) {
  if (!user) {
    return;
  }

  try {
    const actorIdString = actorId ? actorId.toString() : null;

    const adminRecipients = await User.find({
      roles: USER_ROLES.ADMIN,
      _id: { $nin: [user._id, actorIdString].filter(Boolean) },
    })
      .select('_id')
      .lean();

    const recipients = adminRecipients
      .map((entry) => entry?._id?.toString())
      .filter(Boolean);

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
      usuario: user._id.toString(),
      socio: isMember ? 'true' : 'false',
    };

    if (membershipNumber) {
      metadata.numero_socio = membershipNumber;
    }

    metadata.socio_validado = verificationStatus ? 'true' : 'false';

    await Notification.create({
      title: 'Nuevo usuario registrado',
      message: fragments.join(' '),
      channel: 'app',
      scheduledFor: new Date(),
      recipients,
      metadata,
      createdBy: actorId,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('No se pudo crear la notificación de nuevo usuario', error);
  }
}

module.exports = {
  notifyAdminsOfNewUser,
};
