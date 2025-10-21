const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const sanitizeHtml = require('sanitize-html');
const { ChatMessage } = require('../models/ChatMessage');
const { Notification } = require('../models/Notification');
const { USER_ROLES, userHasRole, User } = require('../models/User');
const { normalizeAttachments } = require('../utils/attachments');

const GENERAL_ROOM = 'general';
const MAX_MESSAGES = 100;
const MAX_ATTACHMENTS = 5;

const RICH_TEXT_OPTIONS = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'ol',
    'ul',
    'li',
    'blockquote',
    'a',
    'h1',
    'h2',
    'h3',
    'span',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    span: ['style'],
  },
  allowedStyles: {
    span: {
      'text-decoration': [/^underline$/i],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href'],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: attribs.rel || 'noopener noreferrer',
        target: attribs.target || '_blank',
      },
    }),
  },
  nonTextTags: ['style', 'script', 'textarea', 'option'],
};

function sanitizeRichContent(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return sanitizeHtml(input, RICH_TEXT_OPTIONS).trim();
}

function extractPlainTextFromRichContent(input) {
  if (!input) {
    return '';
  }
  const text = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
  return text.replace(/\s+/g, ' ').trim();
}

async function listGeneralMessages(req, res) {
  const messages = await ChatMessage.find({ roomType: GENERAL_ROOM })
    .populate('sender', 'fullName email role photo')
    .sort({ createdAt: -1 })
    .limit(MAX_MESSAGES)
    .lean();

  return res.json(messages.reverse());
}

async function postGeneralMessage(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { content: rawContent = '', richContent, attachments = [] } = req.body;
  const attachmentsList = Array.isArray(attachments) ? attachments : [];

  if (attachmentsList.length > MAX_ATTACHMENTS) {
    return res
      .status(400)
      .json({ message: 'No puedes adjuntar más de 5 archivos por aviso.' });
  }

  let sanitizedAttachments = [];
  try {
    sanitizedAttachments = normalizeAttachments(attachmentsList);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  const sanitizedRichContent = sanitizeRichContent(richContent);
  const fallbackText = extractPlainTextFromRichContent(sanitizedRichContent);
  const normalizedContent = (rawContent || '').toString().trim();
  const effectiveContent = normalizedContent || fallbackText;

  if (!effectiveContent && !sanitizedRichContent && !sanitizedAttachments.length) {
    return res
      .status(400)
      .json({ message: 'Debes incluir un mensaje o adjuntar al menos un archivo.' });
  }

  const content = effectiveContent.slice(0, 2000);
  const richPayload = sanitizedRichContent ? sanitizedRichContent.slice(0, 12000) : undefined;

  const message = await ChatMessage.create({
    roomType: GENERAL_ROOM,
    sender: req.user.id,
    content,
    richContent: richPayload,
    attachments: sanitizedAttachments,
  });

  const populated = await message.populate('sender', 'fullName email role photo');

  const recipients = await User.find({
    _id: { $ne: req.user.id },
  })
    .select('_id notifyMatchResults')
    .lean();

  const recipientIds = recipients
    .filter((entry) => entry.notifyMatchResults !== false)
    .map((entry) => entry._id);

  if (recipientIds.length) {
    await Notification.create({
      title: 'Nuevo aviso del club',
      message: content || 'Nuevo aviso disponible.',
      richMessage: richPayload,
      attachments: sanitizedAttachments,
      channel: 'app',
      scheduledFor: new Date(),
      recipients: recipientIds,
      metadata: { source: 'notice', messageId: message._id.toString() },
      createdBy: req.user.id,
    });
  }

  return res.status(201).json(populated);
}

function ensureAdmin(req) {
  if (!userHasRole(req.user, USER_ROLES.ADMIN)) {
    const error = new Error('Solo los administradores pueden publicar avisos.');
    error.status = 403;
    throw error;
  }
}

async function publishNotice(req, res, next) {
  try {
    ensureAdmin(req);
    return await postGeneralMessage(req, res);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listGeneralMessages,
  publishNotice,
};
