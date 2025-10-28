export const DEFAULT_APP_BASE_PATH = '/app';

export const SECTION_ROUTE_ENTRIES = [
  ['panel', 'section-dashboard'],
  ['', 'section-dashboard'],
  ['reservas', 'section-court-reservations'],
  ['noticias', 'section-chat'],
  ['notificaciones', 'section-notifications'],
  ['ligas', 'section-league-dashboard'],
  ['ligas/inscribirse', 'section-leagues'],
  ['ligas/categorias', 'section-categories'],
  ['ligas/jugadores', 'section-league-players'],
  ['ligas/pagos', 'section-league-payments'],
  ['ligas/partidos', 'section-matches'],
  ['ligas/calendario', 'section-calendar'],
  ['ligas/ranking', 'section-ranking'],
  ['ligas/reglamento', 'section-rules'],
  ['torneos/panel', 'section-tournament-dashboard'],
  ['torneos', 'section-tournaments'],
  ['torneos/categorias', 'section-tournament-categories'],
  ['torneos/cuadros', 'section-tournament-brackets'],
  ['torneos/inscripciones', 'section-tournament-enrollments'],
  ['torneos/dobles', 'section-tournament-doubles'],
  ['torneos/pagos', 'section-tournament-payments'],
  ['torneos/partidos', 'section-tournament-matches'],
  ['torneos/reglamento', 'section-tournament-rules'],
  ['administracion', 'section-admin'],
  ['administracion/club', 'section-club'],
  ['administracion/pistas', 'section-court-admin'],
  ['administracion/usuarios', 'section-user-directory'],
  ['administracion/modo-demo', 'section-demo-mode'],
  ['mi-cuenta', 'section-account'],
];

export const SECTION_ROUTE_TO_ID = new Map(SECTION_ROUTE_ENTRIES);
export const SECTION_ID_TO_ROUTE = new Map();
SECTION_ROUTE_ENTRIES.forEach(([route, sectionId]) => {
  if (!SECTION_ID_TO_ROUTE.has(sectionId) && route) {
    SECTION_ID_TO_ROUTE.set(sectionId, route);
  }
});
if (!SECTION_ID_TO_ROUTE.has('section-dashboard')) {
  SECTION_ID_TO_ROUTE.set('section-dashboard', '');
}

let appBasePath = DEFAULT_APP_BASE_PATH;

export function getAppBasePath() {
  return appBasePath;
}

export function setAppBasePath(value) {
  if (typeof value === 'string' && value) {
    appBasePath = value;
  } else {
    appBasePath = DEFAULT_APP_BASE_PATH;
  }
}

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

export function normalizeHistoryPath(path) {
  if (typeof path !== 'string' || !path) {
    return appBasePath || '/';
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

  const base = (appBasePath || '').replace(/\/+$/, '');
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
    return appBasePath || '/';
  }

  const base = (appBasePath || '/').replace(/\/+$/, '') || '/';
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
