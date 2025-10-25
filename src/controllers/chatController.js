const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const sanitizeHtml = require('sanitize-html');
const { ChatMessage } = require('../models/ChatMessage');
const { Notification } = require('../models/Notification');
const { USER_ROLES, userHasRole, User } = require('../models/User');
const { MAX_ATTACHMENT_SIZE, normalizeAttachments } = require('../utils/attachments');

const GENERAL_ROOM = 'general';
const MAX_MESSAGES = 100;
const MAX_ATTACHMENTS = 5;
const MAX_RICH_CONTENT_LENGTH = 12000;
const MAX_RICH_CONTENT_WITH_INLINE_IMAGES = 600000;
const MAX_INLINE_IMAGE_TOTAL_SIZE = MAX_ATTACHMENT_SIZE * 2;
const DATA_IMAGE_REGEX = /^data:image\/[a-z0-9.+-]+;base64,/i;
const INLINE_IMAGE_SRC_REGEX = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

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
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    span: ['style'],
    img: ['src', 'alt'],
  },
  allowedStyles: {
    span: {
      'text-decoration': [/^underline$/i],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
  },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: attribs.rel || 'noopener noreferrer',
        target: attribs.target || '_blank',
      },
    }),
    img: (tagName, attribs) => {
      const src = typeof attribs.src === 'string' ? attribs.src.trim() : '';
      if (!src) {
        return { text: '' };
      }
      const alt = typeof attribs.alt === 'string' ? attribs.alt.trim().slice(0, 240) : '';
      return {
        tagName,
        attribs: {
          src,
          alt,
        },
      };
    },
  },
  nonTextTags: ['style', 'script', 'textarea', 'option'],
};

function estimateDataUrlSize(dataUrl) {
  if (typeof dataUrl !== 'string') {
    return 0;
  }
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    return 0;
  }
  const base64 = dataUrl.slice(commaIndex + 1).replace(/\s+/g, '');
  if (!base64) {
    return 0;
  }
  return Math.floor((base64.length * 3) / 4);
}

function extractInlineImageSources(html = '') {
  if (!html) {
    return [];
  }
  const sources = [];
  INLINE_IMAGE_SRC_REGEX.lastIndex = 0;
  let match;
  while ((match = INLINE_IMAGE_SRC_REGEX.exec(html))) {
    if (match[1]) {
      sources.push(match[1]);
    }
  }
  INLINE_IMAGE_SRC_REGEX.lastIndex = 0;
  return sources;
}

function formatSizeLabel(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  if (bytes >= 1024 * 1024) {
    const value = (bytes / (1024 * 1024)).toFixed(1);
    const normalized = value.endsWith('.0') ? value.slice(0, -2) : value;
    return `${normalized} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${bytes} B`;
}

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
  const inlineImageSources = extractInlineImageSources(sanitizedRichContent);
  let inlineImagesTotalSize = 0;
  for (const source of inlineImageSources) {
    if (!source || !DATA_IMAGE_REGEX.test(source)) {
      continue;
    }
    const estimatedSize = estimateDataUrlSize(source);
    if (estimatedSize > MAX_ATTACHMENT_SIZE) {
      return res.status(400).json({
        message: `Cada imagen insertada debe pesar menos de ${formatSizeLabel(MAX_ATTACHMENT_SIZE)}.`,
      });
    }
    inlineImagesTotalSize += estimatedSize;
  }

  if (inlineImagesTotalSize > MAX_INLINE_IMAGE_TOTAL_SIZE) {
    return res.status(400).json({
      message: `Las imágenes insertadas superan el tamaño máximo total permitido (${formatSizeLabel(
        MAX_INLINE_IMAGE_TOTAL_SIZE
      )}).`,
    });
  }

  const fallbackText = extractPlainTextFromRichContent(sanitizedRichContent);
  const normalizedContent = (rawContent || '').toString().trim();
  const effectiveContent = normalizedContent || fallbackText;

  if (!effectiveContent && !sanitizedRichContent && !sanitizedAttachments.length) {
    return res
      .status(400)
      .json({ message: 'Debes incluir un mensaje o adjuntar al menos un archivo.' });
  }

  const content = effectiveContent.slice(0, 2000);
  let richPayload;
  if (sanitizedRichContent) {
    if (inlineImageSources.length) {
      if (sanitizedRichContent.length > MAX_RICH_CONTENT_WITH_INLINE_IMAGES) {
        return res.status(400).json({
          message:
            'El aviso supera el tamaño máximo permitido para contenido con imágenes. Reduce el peso de las imágenes e inténtalo de nuevo.',
        });
      }
      richPayload = sanitizedRichContent;
    } else {
      richPayload = sanitizedRichContent.slice(0, MAX_RICH_CONTENT_LENGTH);
    }
  }

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
