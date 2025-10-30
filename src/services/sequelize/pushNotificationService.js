const webpush = require('web-push');
const { Op } = require('sequelize');
const { getSequelize } = require('../../config/database');
const { BRAND_GENERIC_NOTIFICATION, BRAND_NAME } = require('../../config/branding');

let isConfigured = false;
let cachedPublicKey = null;

function normalizeMetadata(metadata) {
  if (!metadata) {
    return {};
  }

  if (metadata instanceof Map) {
    return Object.fromEntries(metadata.entries());
  }

  if (typeof metadata === 'object') {
    return { ...metadata };
  }

  return {};
}

function configurePushNotifications() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.PUSH_NOTIFICATIONS_SUBJECT || 'mailto:admin@example.com';

  if (!publicKey || !privateKey) {
    isConfigured = false;
    cachedPublicKey = null;
    return false;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    cachedPublicKey = publicKey;
    isConfigured = true;
    return true;
  } catch (error) {
    isConfigured = false;
    cachedPublicKey = null;
    console.warn('No se pudieron configurar las notificaciones push', error);
    return false;
  }
}

function pushNotificationsEnabled() {
  return isConfigured;
}

function getPublicKey() {
  return cachedPublicKey;
}

function serializeSubscriptionPayload(subscription) {
  if (!subscription) {
    return null;
  }

  const payload = {
    endpoint: subscription.endpoint,
    keys: {},
    expirationTime: subscription.expirationTime,
  };

  if (subscription.keys) {
    payload.keys = {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    };
  }

  return payload;
}

async function saveSubscription({ userId, endpoint, keys = {}, expirationTime, userAgent }) {
  const sequelize = getSequelize();
  const { PushSubscription } = sequelize.models;

  if (!userId || !endpoint) {
    throw new Error('Faltan parámetros para registrar la suscripción push.');
  }

  const payload = {
    userId,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    expirationTime: expirationTime ? new Date(expirationTime) : null,
    userAgent: userAgent ? String(userAgent).slice(0, 512) : '',
  };

  const [subscription] = await PushSubscription.upsert(payload, {
    where: { userId, endpoint },
    returning: true
  });

  return subscription;
}

async function removeSubscription({ userId, endpoint }) {
  const sequelize = getSequelize();
  const { PushSubscription } = sequelize.models;

  if (!userId || !endpoint) {
    return { deletedCount: 0 };
  }

  const deleted = await PushSubscription.destroy({
    where: { userId, endpoint }
  });

  return { deletedCount: deleted };
}

function buildPushPayload(notification) {
  if (!notification) {
    return null;
  }

  const metadata = normalizeMetadata(notification.metadata);
  const data = {
    notificationId: notification.id?.toString(),
    channel: notification.channel || 'app',
    ...metadata,
  };

  if (!data.matchId && notification.matchId) {
    data.matchId = notification.matchId.toString();
  }

  const payload = {
    title: notification.title || BRAND_NAME,
    body: notification.message || metadata.preview || BRAND_GENERIC_NOTIFICATION,
    data,
  };

  if (metadata.url) {
    payload.data.url = metadata.url;
  }
  if (notification.richMessage) {
    payload.data.richMessage = notification.richMessage;
  }

  return payload;
}

async function sendPushNotification(notification) {
  const sequelize = getSequelize();
  const { PushSubscription } = sequelize.models;

  if (!pushNotificationsEnabled()) {
    return { delivered: 0, failed: 0 };
  }

  if (!notification) {
    return { delivered: 0, failed: 0 };
  }

  const recipients = Array.isArray(notification.recipients)
    ? notification.recipients.map(recipient => recipient.toString())
    : [];

  if (!recipients.length) {
    return { delivered: 0, failed: 0 };
  }

  const subscriptions = await PushSubscription.findAll({
    where: {
      userId: {
        [Op.in]: recipients
      }
    }
  });

  if (!subscriptions.length) {
    return { delivered: 0, failed: 0 };
  }

  const payload = buildPushPayload(notification);
  if (!payload) {
    return { delivered: 0, failed: 0 };
  }

  const serializedPayload = JSON.stringify(payload);
  const now = new Date();
  let delivered = 0;
  let failed = 0;
  const removalIds = [];

  for (const subscription of subscriptions) {
    const pushPayload = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      },
      expirationTime: subscription.expirationTime
    };

    try {
      await webpush.sendNotification(pushPayload, serializedPayload);
      delivered += 1;
      await subscription.update({ lastSuccessAt: now }).catch(() => null);
    } catch (error) {
      failed += 1;
      const statusCode = error?.statusCode || error?.status || error?.code;
      if (statusCode === 404 || statusCode === 410) {
        removalIds.push(subscription.id);
      } else {
        console.warn('Error enviando notificación push', error);
      }
    }
  }

  if (removalIds.length) {
    await PushSubscription.destroy({
      where: {
        id: {
          [Op.in]: removalIds
        }
      }
    }).catch(() => null);
  }

  return { delivered, failed };
}

module.exports = {
  configurePushNotifications,
  pushNotificationsEnabled,
  getPublicKey,
  serializeSubscriptionPayload,
  saveSubscription,
  removeSubscription,
  sendPushNotification,
};