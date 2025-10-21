const MAX_ATTACHMENT_SIZE = 3 * 1024 * 1024; // 3 MB
const ALLOWED_TYPES = new Set(['image', 'video', 'file', 'link']);

function sanitizeText(value, maxLength = 200) {
  if (typeof value !== 'string') return '';
  const cleaned = value.replace(/[\0\r\n]+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function isDataUrl(value) {
  return typeof value === 'string' && /^data:[^;]+;base64,.+/i.test(value);
}

function estimateDataUrlSize(dataUrl) {
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

function extractMimeType(dataUrl) {
  const match = /^data:([^;,]+)[;,]/i.exec(dataUrl);
  return match ? match[1].toLowerCase() : '';
}

function resolveType({ explicitType, contentType, hasUrlLink, hasData }) {
  const normalizedExplicit = explicitType ? explicitType.toLowerCase() : '';
  if (ALLOWED_TYPES.has(normalizedExplicit)) {
    return normalizedExplicit;
  }
  const lowered = (contentType || '').toLowerCase();
  if (lowered.startsWith('image/')) {
    return 'image';
  }
  if (lowered.startsWith('video/')) {
    return 'video';
  }
  if (hasUrlLink && !hasData) {
    return 'link';
  }
  return 'file';
}

function normalizeAttachmentEntry(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Adjunto no válido.');
  }

  const description = sanitizeText(raw.description, 240);
  const filename = sanitizeText(raw.filename || raw.name || '', 160);
  const contentType = sanitizeText(raw.contentType || raw.mimeType || '', 120);
  const explicitType = sanitizeText(raw.type || '', 24);
  const trimmedUrl = typeof raw.url === 'string' ? raw.url.trim() : '';
  const trimmedDataUrl = typeof raw.dataUrl === 'string' ? raw.dataUrl.trim() : '';

  const sanitized = {};
  if (description) {
    sanitized.description = description;
  }
  if (filename) {
    sanitized.filename = filename;
  }
  if (contentType) {
    sanitized.contentType = contentType.toLowerCase();
  }

  let size = Number(raw.size ?? raw.fileSize ?? 0);
  if (!Number.isFinite(size) || size < 0) {
    size = 0;
  }

  if (trimmedDataUrl) {
    if (!isDataUrl(trimmedDataUrl)) {
      throw new Error('El archivo adjunto debe ser un archivo válido en formato base64.');
    }
    const inferredType = extractMimeType(trimmedDataUrl);
    const estimatedSize = estimateDataUrlSize(trimmedDataUrl);
    if (estimatedSize > MAX_ATTACHMENT_SIZE) {
      throw new Error('El archivo adjunto supera el tamaño máximo de 3 MB.');
    }
    if (size === 0) {
      size = estimatedSize;
    }
    sanitized.dataUrl = trimmedDataUrl;
    if (!sanitized.contentType && inferredType) {
      sanitized.contentType = inferredType;
    }
  } else if (trimmedUrl) {
    if (!isHttpUrl(trimmedUrl)) {
      throw new Error('Las URL de los adjuntos deben usar HTTP o HTTPS.');
    }
    sanitized.url = trimmedUrl;
  } else {
    throw new Error('Cada adjunto debe incluir un archivo o un enlace.');
  }

  if (size > MAX_ATTACHMENT_SIZE) {
    throw new Error('El archivo adjunto supera el tamaño máximo de 3 MB.');
  }

  if (size > 0) {
    sanitized.size = Math.floor(size);
  }

  sanitized.type = resolveType({
    explicitType,
    contentType: sanitized.contentType,
    hasUrlLink: Boolean(sanitized.url),
    hasData: Boolean(sanitized.dataUrl),
  });

  if (!sanitized.filename && sanitized.url) {
    try {
      const url = new URL(sanitized.url);
      const lastSegment = url.pathname.split('/').filter(Boolean).pop();
      if (lastSegment) {
        sanitized.filename = sanitizeText(decodeURIComponent(lastSegment), 160);
      }
    } catch (error) {
      // Ignore decoding issues
    }
  }

  return sanitized;
}

function normalizeAttachments(rawAttachments = []) {
  if (!Array.isArray(rawAttachments)) {
    return [];
  }
  return rawAttachments.map((attachment) => normalizeAttachmentEntry(attachment));
}

function validateAttachmentPayload(value) {
  normalizeAttachmentEntry(value);
  return true;
}

module.exports = {
  MAX_ATTACHMENT_SIZE,
  normalizeAttachments,
  validateAttachmentPayload,
};
