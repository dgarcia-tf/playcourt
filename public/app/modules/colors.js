import {
  CATEGORY_COLOR_PALETTE,
  DEFAULT_CATEGORY_COLOR,
  HEX_COLOR_INPUT_REGEX,
} from './constants.js';

export function normalizeHexColor(value) {
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

export function hexToRgb(hexValue) {
  const normalized = normalizeHexColor(hexValue);
  if (!normalized) {
    return null;
  }

  const hex = normalized.slice(1);
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);

  if ([r, g, b].some((component) => Number.isNaN(component))) {
    return null;
  }

  return { r, g, b, hex: normalized };
}

export function hexToRgba(hexValue, alpha = 1) {
  const rgb = hexToRgb(hexValue);
  if (!rgb) {
    return '';
  }

  const safeAlpha = Number.isFinite(alpha) ? Math.min(Math.max(alpha, 0), 1) : 1;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${safeAlpha})`;
}

export function resolveCategoryColor(value, fallback = DEFAULT_CATEGORY_COLOR) {
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

export function getCategoryColor(category) {
  if (!category) {
    return DEFAULT_CATEGORY_COLOR;
  }

  const candidate = typeof category === 'string' ? category : category.color;
  return resolveCategoryColor(candidate);
}

export function applyCategoryColorStyles(
  element,
  color,
  { backgroundAlpha = 0.12, borderAlpha = 0.28, shadowAlpha } = {}
) {
  if (!element) return;
  const normalized = resolveCategoryColor(color);

  const background = hexToRgba(normalized, backgroundAlpha);
  const border = hexToRgba(normalized, borderAlpha);

  if (background) {
    element.style.backgroundColor = background;
  }
  if (border) {
    element.style.borderColor = border;
  }
  element.style.setProperty('--category-color', normalized);
  if (typeof shadowAlpha === 'number') {
    const shadow = hexToRgba(normalized, shadowAlpha);
    element.style.boxShadow = `0 10px 22px ${shadow}`;
  }

  element.classList.add('category-colored');
}

export function applyCategoryTagColor(tag, color, { backgroundAlpha = 0.18 } = {}) {
  if (!tag) return;
  const normalized = resolveCategoryColor(color);

  const background = hexToRgba(normalized, backgroundAlpha);
  if (background) {
    tag.style.backgroundColor = background;
  }
  tag.style.color = normalized;
}

export function createCategoryColorIndicator(color, label = '') {
  const normalized = resolveCategoryColor(color);
  if (!normalized) return null;

  const indicator = document.createElement('span');
  indicator.className = 'category-color-indicator';
  indicator.style.setProperty('--category-color', normalized);
  indicator.setAttribute('aria-hidden', 'true');
  if (label) {
    indicator.title = `Color de ${label}`;
  } else {
    indicator.title = `Color ${normalized}`;
  }
  return indicator;
}

export function renderCategoryColorField({
  name = 'color',
  legend = 'Color identificativo',
  hint = '',
  selected,
} = {}) {
  const activeColor = resolveCategoryColor(selected);
  const options = CATEGORY_COLOR_PALETTE.map((color) => {
    const checked = color === activeColor ? 'checked' : '';
    return `
      <label class="color-select-option">
        <input type="radio" name="${name}" value="${color}" ${checked} />
        <span class="color-swatch" style="--option-color: ${color}" aria-hidden="true"></span>
        <span class="color-select-label">${color}</span>
      </label>
    `;
  }).join('');

  return `
    <fieldset class="color-select">
      <legend>${legend}</legend>
      <div class="color-select-options">
        ${options}
      </div>
      ${hint ? `<span class="form-hint">${hint}</span>` : ''}
    </fieldset>
  `;
}
