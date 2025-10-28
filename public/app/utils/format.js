import {
  CATEGORY_COLOR_PALETTE,
  CATEGORY_SKILL_LEVEL_OPTIONS,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_LEAGUE_CURRENCY,
  SCHEDULE_LABELS,
} from '../config/constants.js';
import { normalizeHexColor } from './validation.js';

export function formatCurrencyValue(amount, currency = 'EUR') {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return '';
  }

  let resolvedCurrency = typeof currency === 'string' ? currency.trim().toUpperCase() : 'EUR';
  if (!resolvedCurrency) {
    resolvedCurrency = 'EUR';
  }

  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: resolvedCurrency,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (error) {
    return `${numericAmount.toFixed(2)} ${resolvedCurrency}`.trim();
  }
}

export function formatCurrencyDisplay(amount) {
  const formatted = formatCurrencyValue(amount, DEFAULT_LEAGUE_CURRENCY);
  if (formatted) {
    return formatted;
  }

  const numeric = Number(amount) || 0;
  return `${numeric.toFixed(2)} ${DEFAULT_LEAGUE_CURRENCY}`;
}

export function translateGender(value) {
  if (value === 'femenino') return 'Femenino';
  if (value === 'masculino') return 'Masculino';
  if (value === 'mixto') return 'Mixto';
  return value;
}

export function translateSchedule(value) {
  return SCHEDULE_LABELS[value] || 'Sin preferencia';
}

export function translateRole(role) {
  if (role === 'admin') return 'Administrador';
  if (role === 'player') return 'Jugador';
  if (role === 'court_manager') return 'Gestor de pistas';
  return role;
}

export function formatSkillLevelLabel(value) {
  const option = CATEGORY_SKILL_LEVEL_OPTIONS.find((entry) => entry.value === value);
  return option ? option.label : value || '';
}

export function formatRoles(roles) {
  const list = Array.isArray(roles)
    ? roles
    : typeof roles === 'string' && roles
    ? [roles]
    : [];
  if (!list.length) {
    return translateRole('player');
  }
  return list.map((role) => translateRole(role)).join(' · ');
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
