const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Notification } = require('../models/Notification');
const { Match } = require('../models/Match');
const { User } = require('../models/User');
const { normalizeAttachments } = require('../utils/attachments');
const { sendPushNotification } = require('../services/sequelize/pushNotificationService');
const { sendEmailNotification } = require('../services/sequelize/emailService');

async function createNotification(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title,
    message,
    richMessage,
    attachments = [],
    channel,
    scheduledFor,
    recipients = [],
    matchId,
    metadata = {},
  } = req.body;

  if (!message && !richMessage) {
    return res.status(400).json({ message: 'Debes proporcionar un mensaje o contenido enriquecido.' });
  }

  const normalizedMetadata = Object.entries(metadata || {}).reduce((acc, [key, value]) => {
    acc[key] = value === undefined || value === null ? '' : String(value);
    return acc;
  }, {});

  let match = null;
  if (matchId) {
    match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Partido asociado no encontrado' });
    }
  }

  if (recipients.length > 0) {
    const distinctRecipients = [...new Set(recipients.map((id) => id.toString()))];
    const existingRecipients = await User.countDocuments({ _id: { $in: distinctRecipients } });
    if (existingRecipients !== distinctRecipients.length) {
      return res.status(400).json({ message: 'Alguno de los destinatarios no existe' });
    }
  }

  const normalizedAttachments = (attachments || [])
    .filter((attachment) => attachment && attachment.url)
    .map((attachment) => ({
      url: attachment.url,
      description: attachment.description,
      type: attachment.type || 'image',
    }));

  const notification = await Notification.create({
    title,
    message,
    richMessage,
    attachments: normalizedAttachments,
    channel,
    scheduledFor,
    recipients,
    match: match ? match._id : undefined,
    metadata: normalizedMetadata,
    createdBy: req.user.id,
  });

  return res.status(201).json(notification);
}

async function listNotifications(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { status, matchId, upcoming } = req.query;

  const query = {};
  if (status) {
    query.status = status;
  }
  if (matchId) {
    query.match = new mongoose.Types.ObjectId(matchId);
  }
  if (typeof upcoming === 'boolean') {
    query.scheduledFor = upcoming ? { $gte: new Date() } : { $lt: new Date() };
  }

  const notifications = await Notification.find(query)
    .sort({ scheduledFor: 1, createdAt: -1 })
    .populate('match', 'scheduledAt court season')
    .populate('recipients', 'fullName email role');

  return res.json(notifications);
}

async function listMyNotifications(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { status, upcoming } = req.query;

  const query = { recipients: req.user.id };
  if (status) {
    query.status = status;
  }

  if (typeof upcoming === 'boolean') {
    query.scheduledFor = upcoming ? { $gte: new Date() } : { $lt: new Date() };
  }

  const notifications = await Notification.find(query)
    .sort({ scheduledFor: 1, createdAt: -1 })
    .populate('match', 'scheduledAt court season')
    .populate('recipients', 'fullName email role');

  return res.json(notifications);
}

async function updateNotificationStatus(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { notificationId } = req.params;
  const { status, scheduledFor } = req.body;

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    return res.status(404).json({ message: 'Notificación no encontrada' });
  }

  if (typeof scheduledFor !== 'undefined') {
    notification.scheduledFor = scheduledFor;
  }

  notification.status = status;
  if (status === 'enviado') {
    notification.sentAt = req.body.sentAt ? new Date(req.body.sentAt) : new Date();
  } else if (status === 'pendiente') {
    notification.sentAt = null;
  } else if (status === 'cancelado') {
    notification.sentAt = null;
  }

  await notification.save();

  if (notification.status === 'enviado') {
    if (notification.channel === 'push') {
      try {
        await sendPushNotification(notification);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('No se pudo enviar la notificación push', error);
      }
    } else if (notification.channel === 'email') {
      try {
        await sendEmailNotification(notification);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('No se pudo enviar la notificación por correo electrónico', error);
      }
    }
  }

  return res.json(notification);
}

async function acknowledgeMyNotification(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { notificationId } = req.params;

  const notification = await Notification.findOne({
    _id: notificationId,
    recipients: req.user.id,
  });

  if (!notification) {
    return res.status(404).json({ message: 'Notificación no encontrada' });
  }

  notification.recipients = notification.recipients.filter(
    (recipientId) => recipientId.toString() !== req.user.id
  );

  if (notification.recipients.length) {
    await notification.save();
  } else {
    await notification.deleteOne();
  }

  return res.status(204).send();
}

module.exports = {
  createNotification,
  listNotifications,
  listMyNotifications,
  updateNotificationStatus,
  acknowledgeMyNotification,
};
