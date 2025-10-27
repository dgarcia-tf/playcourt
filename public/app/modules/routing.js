import { DEFAULT_APP_BASE_PATH, SECTION_ID_TO_ROUTE, SECTION_ROUTE_TO_ID } from './constants.js';

export function resolveAppBasePath() {
  if (typeof document === 'undefined') {
    return DEFAULT_APP_BASE_PATH;
  }

  const datasetValue = document.body?.dataset?.appBasePath;
  if (datasetValue) {
    return datasetValue;
  }

  if (typeof window !== 'undefined' && window.location?.pathname) {
    const { pathname } = window.location;
    if (pathname.startsWith(DEFAULT_APP_BASE_PATH)) {
      return DEFAULT_APP_BASE_PATH;
    }

    if (!pathname || pathname === '/') {
      return '/';
    }

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length) {
      return `/${segments[0]}`;
    }
  }

  return DEFAULT_APP_BASE_PATH;
}

export const APP_BASE_PATH = resolveAppBasePath();

export function normalizeHistoryPath(path) {
  if (typeof path !== 'string' || !path) {
    return APP_BASE_PATH || '/';
  }

  if (path.length > 1 && path.endsWith('/')) {
    return path.replace(/\/+$/, '');
  }

  return path;
}

export function normalizeAppPath(pathname) {
  if (typeof pathname !== 'string') {
    return null;
  }

  const base = (APP_BASE_PATH || '').replace(/\/+$/, '');
  let remaining = pathname;

  if (base && base !== '/') {
    if (!remaining.startsWith(base)) {
      return null;
    }
    remaining = remaining.slice(base.length);
  }

  remaining = remaining.replace(/^\/+/, '').replace(/\/+$/, '');
  return remaining;
}

export function getSectionIdFromPath(pathname) {
  const normalized = normalizeAppPath(pathname);
  if (normalized == null) {
    return null;
  }

  let routeKey = normalized;
  if (!routeKey) {
    return SECTION_ROUTE_TO_ID.get('') || 'section-dashboard';
  }

  try {
    routeKey = decodeURIComponent(routeKey);
  } catch (error) {
    // Ignorar errores de decodificación y continuar con la ruta original.
  }

  return SECTION_ROUTE_TO_ID.get(routeKey) || null;
}

export function buildPathFromSection(sectionId) {
  if (typeof sectionId !== 'string' || !sectionId) {
    return APP_BASE_PATH || '/';
  }

  const base = (APP_BASE_PATH || '/').replace(/\/+$/, '') || '/';
  const slug = SECTION_ID_TO_ROUTE.get(sectionId);
  if (!slug) {
    return base || '/';
  }

  const normalizedSlug = slug
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');

  if (!normalizedSlug) {
    return base || '/';
  }

  if (!base || base === '/' || base === '') {
    return `/${normalizedSlug}`;
  }

  return `${base}/${normalizedSlug}`;
}

export function syncSectionRoute(sectionId, { replace = false } = {}) {
  if (typeof window === 'undefined' || !window.history) {
    return;
  }

  const targetPath = buildPathFromSection(sectionId);
  if (!targetPath) {
    return;
  }

  const statePayload = { section: sectionId };
  const normalizedTarget = normalizeHistoryPath(targetPath);
  const normalizedCurrent = normalizeHistoryPath(window.location.pathname || '/');

  if (replace || normalizedCurrent === normalizedTarget) {
    window.history.replaceState(statePayload, '', targetPath);
    return;
  }

  if (typeof window.history.pushState === 'function') {
    window.history.pushState(statePayload, '', targetPath);
  }
}

