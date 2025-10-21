const { validationResult, body } = require('express-validator');
const {
  configurePushNotifications,
  pushNotificationsEnabled,
  getPublicKey,
  saveSubscription,
  removeSubscription,
} = require('../services/pushNotificationService');

const registerSubscriptionValidators = [
  body('endpoint')
    .isURL({ require_protocol: true, require_tld: false })
    .withMessage('El endpoint de la suscripción es obligatorio.'),
  body('keys').optional().isObject().withMessage('Las claves de la suscripción deben ser un objeto.'),
  body('keys.p256dh')
    .optional()
    .isString()
    .isLength({ min: 10 })
    .withMessage('La clave pública de la suscripción no es válida.'),
  body('keys.auth')
    .optional()
    .isString()
    .isLength({ min: 5 })
    .withMessage('La clave de autenticación de la suscripción no es válida.'),
  body('expirationTime')
    .optional({ nullable: true })
    .custom((value) => value === null || Number.isFinite(Number(value)))
    .withMessage('La fecha de expiración debe ser un número válido en milisegundos.'),
  body('userAgent').optional().isString().isLength({ max: 512 }),
];

const unregisterSubscriptionValidators = [
  body('endpoint')
    .isURL({ require_protocol: true, require_tld: false })
    .withMessage('Debes proporcionar el endpoint a eliminar.'),
];

function getPushConfig(req, res) {
  if (!pushNotificationsEnabled()) {
    configurePushNotifications();
  }
  const enabled = pushNotificationsEnabled();
  const publicKey = enabled ? getPublicKey() : null;
  res.json({ enabled, publicKey });
}

async function registerSubscription(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (!pushNotificationsEnabled()) {
    configurePushNotifications();
  }

  if (!pushNotificationsEnabled()) {
    return res
      .status(503)
      .json({ message: 'Las notificaciones push no están disponibles en este momento.' });
  }

  const { endpoint, keys = {}, expirationTime = null, userAgent } = req.body;

  try {
    const subscription = await saveSubscription({
      userId: req.user.id,
      endpoint,
      keys,
      expirationTime,
      userAgent,
    });

    return res.status(201).json({ id: subscription._id, endpoint: subscription.endpoint });
  } catch (error) {
    return res.status(500).json({ message: 'No se pudo registrar la suscripción push.' });
  }
}

async function unregisterSubscription(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { endpoint } = req.body;

  try {
    await removeSubscription({ userId: req.user.id, endpoint });
  } catch (error) {
    return res.status(500).json({ message: 'No se pudo eliminar la suscripción push.' });
  }

  return res.status(204).send();
}

module.exports = {
  getPushConfig,
  registerSubscription,
  unregisterSubscription,
  registerSubscriptionValidators,
  unregisterSubscriptionValidators,
};
