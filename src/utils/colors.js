const HEX_COLOR_INPUT_REGEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

const CATEGORY_COLOR_PALETTE = Object.freeze([
  '#2563EB',
  '#9333EA',
  '#F97316',
  '#059669',
]);

const DEFAULT_CATEGORY_COLOR = CATEGORY_COLOR_PALETTE[0];

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
  if (normalized && CATEGORY_COLOR_PALETTE.includes(normalized)) {
    return normalized;
  }

  const normalizedFallback = normalizeHexColor(fallback);
  if (normalizedFallback && CATEGORY_COLOR_PALETTE.includes(normalizedFallback)) {
    return normalizedFallback;
  }

  return DEFAULT_CATEGORY_COLOR;
}

function isValidCategoryColor(value) {
  const normalized = normalizeHexColor(value);
  return Boolean(normalized) && CATEGORY_COLOR_PALETTE.includes(normalized);
}

module.exports = {
  CATEGORY_COLOR_PALETTE,
  DEFAULT_CATEGORY_COLOR,
  HEX_COLOR_REGEX,
  isValidCategoryColor,
  normalizeHexColor,
  resolveCategoryColor,
};
