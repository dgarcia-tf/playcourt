const sanitizeHtml = require('sanitize-html');
const { Op } = require('sequelize');
const { getSequelize } = require('../../config/database');
const {
  configureMailTransport,
  getMailTransport,
  mailTransportEnabled,
  getDefaultSender,
  getDefaultReplyTo,
} = require('../../config/mail');
const {
  BRAND_GENERIC_NOTIFICATION,
  BRAND_NOTIFICATION_SUBJECT,
} = require('../../config/branding');

const FALLBACK_SUBJECT = BRAND_NOTIFICATION_SUBJECT;
const GENERIC_NOTIFICATION_MESSAGE = BRAND_GENERIC_NOTIFICATION;

function ensureTransport() {
  if (mailTransportEnabled()) {
    return true;
  }
  return configureMailTransport();
}

function normalizeNotification(notification) {
  if (!notification) {
    return null;
  }

  return notification.get ? notification.get({ plain: true }) : notification;
}

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

function escapeHtml(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtmlBody({ message, richMessage, metadata, attachments }) {
  const htmlChunks = [];

  if (richMessage) {
    const sanitized = sanitizeHtml(richMessage, {
      allowedTags: [
        'a',
        'b',
        'br',
        'em',
        'i',
        'strong',
        'p',
        'ul',
        'ol',
        'li',
        'span',
      ],
      allowedAttributes: {
        a: ['href', 'target', 'rel', 'title'],
        span: ['style'],
        p: ['style'],
      },
      transformTags: {
        a: (tagName, attribs) => ({
          tagName: 'a',
          attribs: {
            ...attribs,
            target: '_blank',
            rel: attribs.rel ? attribs.rel : 'noopener noreferrer',
          },
        }),
      },
    });
    htmlChunks.push(`<div class="rich-message">${sanitized}</div>`);
  } else if (message) {
    const escaped = escapeHtml(message).replace(/\n/g, '<br />');
    htmlChunks.push(`<p>${escaped}</p>`);
  } else {
    htmlChunks.push(`<p>${GENERIC_NOTIFICATION_MESSAGE}</p>`);
  }

  if (metadata.url) {
    const urlValue = String(metadata.url);
    const safeUrl = escapeHtml(urlValue);
    htmlChunks.push(
      `<p><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Ver más detalles</a></p>`
    );
  }

  const linkableAttachments = (attachments || []).filter((attachment) => attachment && attachment.url);
  if (linkableAttachments.length) {
    const items = linkableAttachments
      .map((attachment) => {
        const label = escapeHtml(attachment.description || attachment.filename || attachment.url);
        const href = escapeHtml(attachment.url);
        return `<li><a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
      })
      .join('');
    htmlChunks.push(`<p>Enlaces relacionados:</p><ul>${items}</ul>`);
  }

  return htmlChunks.join('');
}

function buildTextBody({ message, metadata, attachments }) {
  const parts = [];
  if (message) {
    parts.push(String(message));
  } else {
    parts.push(GENERIC_NOTIFICATION_MESSAGE);
  }

  if (metadata.url) {
    parts.push(`Ver más detalles: ${String(metadata.url)}`);
  }

  const linkableAttachments = (attachments || []).filter((attachment) => attachment && attachment.url);
  linkableAttachments.forEach((attachment) => {
    const label = attachment.description || attachment.filename || attachment.url;
    parts.push(`Adjunto: ${label} (${attachment.url})`);
  });

  return parts.join('\n\n');
}

function transformDataUrlAttachments(attachments = []) {
  const emailAttachments = [];

  attachments.forEach((attachment, index) => {
    if (!attachment || !attachment.dataUrl) {
      return;
    }

    const match = /^data:([^;]+);base64,(.+)$/i.exec(attachment.dataUrl);
    if (!match) {
      return;
    }

    const contentType = attachment.contentType || match[1] || 'application/octet-stream';
    const base64 = match[2];
    const content = Buffer.from(base64, 'base64');
    const filename =
      attachment.filename || attachment.description || `adjunto-${index + 1}.${contentType.split('/').pop() || 'bin'}`;

    emailAttachments.push({
      filename,
      content,
      contentType,
    });
  });

  return emailAttachments;
}

async function resolveRecipients(recipientIds = []) {
  const sequelize = getSequelize();
  const { User } = sequelize.models;

  const ids = Array.isArray(recipientIds)
    ? recipientIds
        .map((value) => {
          if (!value) return null;
          if (typeof value === 'string') return value;
          if (typeof value.toString === 'function') {
            return value.toString();
          }
          return null;
        })
        .filter(Boolean)
    : [];

  if (!ids.length) {
    return [];
  }

  const users = await User.findAll({
    where: {
      id: {
        [Op.in]: ids
      }
    },
    attributes: ['email', 'fullName']
  });

  const seenEmails = new Set();

  return users
    .filter((user) => user && user.email)
    .map((user) => ({
      email: String(user.email).trim(),
      name: user.fullName || user.email,
    }))
    .filter((recipient) => {
      if (!recipient.email) {
        return false;
      }
      const normalized = recipient.email.toLowerCase();
      if (seenEmails.has(normalized)) {
        return false;
      }
      seenEmails.add(normalized);
      return true;
    });
}

async function sendEmailNotification(notification) {
  if (!ensureTransport()) {
    return { delivered: 0, failed: 0 };
  }

  const plainNotification = normalizeNotification(notification);
  if (!plainNotification) {
    return { delivered: 0, failed: 0 };
  }

  const transporter = getMailTransport();
  if (!transporter) {
    return { delivered: 0, failed: 0 };
  }

  const metadata = normalizeMetadata(plainNotification.metadata);
  const attachments = Array.isArray(plainNotification.attachments) ? plainNotification.attachments : [];
  const recipients = await resolveRecipients(plainNotification.recipients);

  if (!recipients.length) {
    return { delivered: 0, failed: 0 };
  }

  const htmlBody = buildHtmlBody({
    message: plainNotification.message,
    richMessage: plainNotification.richMessage,
    metadata,
    attachments,
  });
  const textBody = buildTextBody({
    message: plainNotification.message,
    metadata,
    attachments,
  });
  const dataUrlAttachments = transformDataUrlAttachments(attachments);

  const from = getDefaultSender();
  const replyTo = getDefaultReplyTo();
  const subject = plainNotification.title || FALLBACK_SUBJECT;

  let delivered = 0;
  let failed = 0;

  for (const recipient of recipients) {
    try {
      const messageAttachments = dataUrlAttachments.map((attachment) => ({ ...attachment }));
      const to = recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email;
      await transporter.sendMail({
        from,
        to,
        replyTo,
        subject,
        text: textBody,
        html: htmlBody,
        attachments: messageAttachments,
      });
      delivered += 1;
    } catch (error) {
      failed += 1;
    }
  }

  return { delivered, failed };
}

module.exports = {
  sendEmailNotification,
};