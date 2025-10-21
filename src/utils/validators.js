const IMAGE_DATA_URL_REGEX = /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const TRUE_VALUES = ['true', '1', 'yes', 'si', 'sí', 'on'];
const FALSE_VALUES = ['false', '0', 'no', 'off'];

function isValidImageDataUrl(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();

  if (!trimmed.length) {
    return false;
  }

  if (!IMAGE_DATA_URL_REGEX.test(trimmed)) {
    return false;
  }

  const parts = trimmed.split(',');
  if (parts.length !== 2) {
    return false;
  }

  try {
    const buffer = Buffer.from(parts[1], 'base64');
    if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
      return false;
    }
  } catch (error) {
    return false;
  }

  return true;
}

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized.length) {
      return null;
    }
    if (TRUE_VALUES.includes(normalized)) {
      return true;
    }
    if (FALSE_VALUES.includes(normalized)) {
      return false;
    }
  }

  return null;
}

function sanitizeBoolean(value) {
  const parsed = parseBoolean(value);
  return parsed !== null ? parsed : value;
}

module.exports = {
  isValidImageDataUrl,
  MAX_IMAGE_BYTES,
  parseBoolean,
  sanitizeBoolean,
};
