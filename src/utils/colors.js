const HEX_COLOR_INPUT_REGEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const DEFAULT_CATEGORY_COLOR = '#2563EB';

function normalizeHexColor(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed.length) {
    return '';
  }

  const match = trimmed.match(HEX_COLOR_INPUT_REGEX);
  if (!match) {
    return '';
  }

  let hex = match[1];
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => `${char}${char}`)
      .join('');
  }

  return `#${hex.toUpperCase()}`;
}

function resolveCategoryColor(value, fallback = DEFAULT_CATEGORY_COLOR) {
  const normalized = normalizeHexColor(value);
  return normalized || fallback;
}

module.exports = {
  DEFAULT_CATEGORY_COLOR,
  HEX_COLOR_REGEX,
  normalizeHexColor,
  resolveCategoryColor,
};
