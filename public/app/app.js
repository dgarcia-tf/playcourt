const API_BASE = '/app/api';
const STORAGE_KEY = 'liga-tennis-app-session';
const REMEMBER_CREDENTIALS_KEY = 'liga-tennis-remember-credentials';
const NOTICE_LAST_SEEN_PREFIX = 'liga-tennis-notices-last-seen:';
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const MAX_NOTICE_ATTACHMENT_SIZE = 3 * 1024 * 1024;
const MAX_NOTICE_ATTACHMENTS = 5;
const CALENDAR_TIME_SLOT_MINUTES = 15;
const CALENDAR_TIME_SLOT_STEP_SECONDS = CALENDAR_TIME_SLOT_MINUTES * 60;

const SCHEDULE_LABELS = {
  manana: 'Mañana',
  tarde: 'Tarde',
  noche: 'Noche',
  fin_de_semana: 'Fin de semana',
  flexible: 'Flexible',
};

const WEEKDAY_OPTIONS = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

const WEEKDAY_LABEL_BY_VALUE = WEEKDAY_OPTIONS.reduce((map, option) => {
  map[option.value] = option.label;
  return map;
}, {});

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  propuesto: 'Propuesto',
  programado: 'Programado',
  revision: 'Resultado pendiente',
  completado: 'Completado',
  caducado: 'Caducado',
};

const MATCH_EXPIRATION_DAYS = 15;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const PUSH_SUPPORTED =
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

const CATEGORY_STATUS_LABELS = {
  inscripcion: 'Inscripción abierta',
  en_curso: 'En curso',
};

const CATEGORY_SKILL_LEVEL_OPTIONS = [
  { value: 'Iniciación', label: 'Iniciación' },
  { value: 'Intermedio', label: 'Intermedio' },
  { value: 'Avanzado', label: 'Avanzado' },
];

const LEAGUE_STATUS_LABELS = {
  activa: 'Activa',
  cerrada: 'Cerrada',
};

const DEFAULT_RULE_SECTIONS = [
  {
    title: 'Filosofía del club',
    bullets: [
      'Promovemos el tenis social competitivo con un ambiente inclusivo para todos los niveles.',
      'Cada temporada prioriza el compañerismo, la mejora continua y el respeto entre rivales.',
      'Las decisiones deportivas se apoyan en la aplicación y el feedback de la comunidad.',
    ],
  },
  {
    title: 'Instalaciones y pistas',
    bullets: [
      'Disponemos de 4 pistas rápidas iluminadas y 2 pistas de arcilla disponibles con reserva previa.',
      'La app indica la pista asignada y permite actualizar la información si se produce un cambio de última hora.',
      'El estado de mantenimiento de cada pista se revisa semanalmente para garantizar superficies seguras.',
    ],
  },
  {
    title: 'Horarios recomendados',
    bullets: [
      'Bloques matutinos: 08:00 – 12:00 · Ideal para jugadores con horario flexible.',
      'Bloques vespertinos: 16:00 – 19:00 · Mayor disponibilidad de monitores y personal de apoyo.',
      'Bloques nocturnos: 19:00 – 22:00 · Iluminación LED en todas las pistas rápidas.',
    ],
  },
  {
    title: 'Formato de juego',
    bullets: [
      'Cada partido se disputa al mejor de tres sets. Si cada jugador gana un set, se define por super tie-break a 10 puntos.',
      'Las victorias otorgan 10 puntos al ranking general más un punto por cada juego ganado.',
      'Los resultados deben ser confirmados por ambos jugadores; el administrador puede validar o corregir marcadores en caso de disputa.',
    ],
  },
  {
    title: 'Conducta y fair play',
    bullets: [
      'Respeta los horarios acordados y avisa con al menos 24 horas de antelación si necesitas reprogramar.',
      'Se prohíbe el lenguaje ofensivo o discriminatorio en pista y en los canales de chat; las infracciones podrán sancionarse.',
      'El uso de la app para confirmar asistencia, registrar resultados y gestionar categorías es obligatorio para mantener el histórico de la liga.',
    ],
  },
];

const MOVEMENT_ICON_PATHS = {
  up: 'M12 7l4 4h-3v6h-2v-6H8l4-4z',
  down: 'M12 17l-4-4h3V7h2v6h3l-4 4z',
  same: 'M8 11h8v2H8z',
  new: 'M12 7v4h4v2h-4v4h-2v-4H6v-2h4V7z',
};

const MOVEMENT_STYLES = {
  up: { color: '#2563eb', background: '#dbeafe' },
  down: { color: '#dc2626', background: '#fee2e2' },
  same: { color: '#475569', background: '#e2e8f0' },
  new: { color: '#0f766e', background: '#ccfbf1' },
};

const DEFAULT_CATEGORY_COLOR = '#2563EB';
const HEX_COLOR_INPUT_REGEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

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

function hexToRgb(hexValue) {
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

function hexToRgba(hexValue, alpha = 1) {
  const rgb = hexToRgb(hexValue);
  if (!rgb) {
    return '';
  }

  const safeAlpha = Number.isFinite(alpha) ? Math.min(Math.max(alpha, 0), 1) : 1;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${safeAlpha})`;
}

function getCategoryColor(category) {
  if (!category) {
    return '';
  }

  const candidate = typeof category === 'string' ? category : category.color;
  const normalized = normalizeHexColor(candidate);
  return normalized || DEFAULT_CATEGORY_COLOR;
}

function applyCategoryColorStyles(
  element,
  color,
  { backgroundAlpha = 0.12, borderAlpha = 0.28, shadowAlpha } = {}
) {
  if (!element) return;
  const normalized = normalizeHexColor(color);
  if (!normalized) return;

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

function applyCategoryTagColor(tag, color, { backgroundAlpha = 0.18 } = {}) {
  if (!tag) return;
  const normalized = normalizeHexColor(color);
  if (!normalized) return;

  const background = hexToRgba(normalized, backgroundAlpha);
  if (background) {
    tag.style.backgroundColor = background;
  }
  tag.style.color = normalized;
}

function createCategoryColorIndicator(color, label = '') {
  const normalized = normalizeHexColor(color);
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

function cloneDefaultRegulationSections() {
  return DEFAULT_RULE_SECTIONS.map((section) => ({
    title: typeof section.title === 'string' ? section.title : '',
    description: typeof section.description === 'string' ? section.description : '',
    bullets: Array.isArray(section.bullets) ? [...section.bullets] : [],
  }));
}

function convertRegulationSectionsToHtml(sections = []) {
  return sections
    .map((section) => {
      const parts = [];
      if (section.title) {
        parts.push(`<h2>${escapeHtml(section.title)}</h2>`);
      }
      if (section.description) {
        parts.push(`<p>${escapeHtml(section.description)}</p>`);
      }
      if (Array.isArray(section.bullets) && section.bullets.length) {
        const items = section.bullets
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('');
        parts.push(`<ul>${items}</ul>`);
      }
      return parts.join('');
    })
    .join('')
    .trim();
}

function normalizeRegulationSection(entry = {}) {
  const title = typeof entry.title === 'string' ? entry.title.trim() : '';
  const description = typeof entry.description === 'string' ? entry.description.trim() : '';
  const bullets = Array.isArray(entry.bullets)
    ? entry.bullets
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
    : [];

  if (!title && !description && !bullets.length) {
    return null;
  }

  const section = { title };
  if (description) {
    section.description = description;
  }
  if (bullets.length) {
    section.bullets = bullets;
  }
  return section;
}

function getDefaultRegulationHtml() {
  const fallbackSections = cloneDefaultRegulationSections();
  const html = convertRegulationSectionsToHtml(fallbackSections);
  return sanitizeNoticeHtml(html);
}

function getRegulationHtml(rawRegulation) {
  const raw = typeof rawRegulation === 'string' ? rawRegulation.trim() : '';

  if (!raw) {
    return getDefaultRegulationHtml();
  }

  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const normalized = parsed.map((entry) => normalizeRegulationSection(entry)).filter(Boolean);
        if (normalized.length) {
          const legacyHtml = convertRegulationSectionsToHtml(normalized);
          const sanitizedLegacy = sanitizeNoticeHtml(legacyHtml);
          if (sanitizedLegacy) {
            return sanitizedLegacy;
          }
        }
      }
    } catch (error) {
      console.warn('No se pudo interpretar el reglamento guardado. Se intentará mostrar el contenido original.', error);
    }
  }

  const sanitizedExisting = sanitizeNoticeHtml(raw);
  if (sanitizedExisting) {
    if (raw.startsWith('[') && sanitizedExisting === raw) {
      return getDefaultRegulationHtml();
    }
    return sanitizedExisting;
  }

  const escaped = escapeHtml(raw);
  if (escaped) {
    return `<p>${escaped}</p>`;
  }

  return getDefaultRegulationHtml();
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getClubCourtNames() {
  const club = state.club || {};
  const courts = Array.isArray(club.courts) ? club.courts : [];
  const names = courts
    .map((entry) => (entry && typeof entry.name === 'string' ? entry.name.trim() : ''))
    .filter(Boolean);
  return Array.from(new Set(names));
}

function getPlayerDisplayName(player) {
  if (!player) return 'Jugador';
  if (player.fullName) return player.fullName;
  if (player.email) return player.email;
  return 'Jugador';
}

function getPlayerInitial(player) {
  const name = getPlayerDisplayName(player).trim();
  return name ? name.charAt(0).toUpperCase() : 'J';
}

function createMovementIcon(type) {
  const pathData = MOVEMENT_ICON_PATHS[type];
  if (!pathData) return null;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('movement-icon');

  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '11');
  circle.setAttribute('fill', 'var(--movement-badge-bg)');
  svg.appendChild(circle);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'currentColor');
  svg.appendChild(path);

  return svg;
}

function resolveMovement(entry) {
  if (!entry) return null;
  if (entry.movement === 'nuevo' || entry.previousPosition === null) {
    return {
      type: 'new',
      text: 'Nuevo',
      ariaLabel: 'Nuevo ingreso al ranking',
    };
  }

  const delta = Number(entry.movementDelta);
  if (!Number.isFinite(delta)) {
    return null;
  }

  if (delta > 0) {
    const absolute = Math.abs(delta);
    return {
      type: 'up',
      text: `+${absolute}`,
      ariaLabel: `Sube ${absolute} ${absolute === 1 ? 'posición' : 'posiciones'}`,
    };
  }

  if (delta < 0) {
    const absolute = Math.abs(delta);
    return {
      type: 'down',
      text: `-${absolute}`,
      ariaLabel: `Baja ${absolute} ${absolute === 1 ? 'posición' : 'posiciones'}`,
    };
  }

  return {
    type: 'same',
    text: 'Igual',
    ariaLabel: 'Se mantiene en la misma posición',
  };
}

function createMovementBadge(entry) {
  const movement = resolveMovement(entry);
  if (!movement) return null;

  const badge = document.createElement('span');
  badge.className = `movement-badge movement-badge--${movement.type}`;
  const style = MOVEMENT_STYLES[movement.type];
  if (style) {
    badge.style.setProperty('--movement-badge-bg', style.background);
    badge.style.color = style.color;
  }

  const icon = createMovementIcon(movement.type);
  if (icon) {
    badge.appendChild(icon);
  }

  const label = document.createElement('span');
  label.className = 'movement-badge__label';
  label.textContent = movement.text;
  badge.appendChild(label);

  badge.setAttribute('aria-label', movement.ariaLabel);
  return badge;
}

function createAvatarElement(player, { size = 'md' } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = `player-avatar player-avatar--${size}`;

  const photo = typeof player?.photo === 'string' ? player.photo : '';

  if (photo) {
    const image = document.createElement('img');
    image.src = photo;
    image.alt = `Avatar de ${getPlayerDisplayName(player)}`;
    wrapper.appendChild(image);
  } else {
    wrapper.classList.add('player-avatar--placeholder');
    wrapper.textContent = getPlayerInitial(player);
  }

  return wrapper;
}

function buildPlayerCell(player, { includeSchedule = false, size = 'md' } = {}) {
  const container = document.createElement('div');
  container.className = 'player-cell';

  container.appendChild(createAvatarElement(player, { size }));

  const info = document.createElement('div');
  info.className = 'player-cell__info';

  const name = document.createElement('span');
  name.className = 'player-cell__name';
  name.textContent = getPlayerDisplayName(player);
  info.appendChild(name);

  if (includeSchedule && player?.preferredSchedule) {
    const schedule = document.createElement('span');
    schedule.className = 'player-cell__meta';
    schedule.textContent = SCHEDULE_LABELS[player.preferredSchedule] || player.preferredSchedule;
    info.appendChild(schedule);
  }

  container.appendChild(info);
  return container;
}

function getMovementIconMarkup(type) {
  const path = MOVEMENT_ICON_PATHS[type];
  if (!path) return '';
  return `
    <svg class="movement-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="var(--movement-badge-bg)"></circle>
      <path d="${path}" fill="currentColor"></path>
    </svg>
  `;
}

function buildMovementBadgeMarkup(entry) {
  const movement = resolveMovement(entry);
  if (!movement) {
    return '<span class="movement-badge movement-badge--none">—</span>';
  }

  const style = MOVEMENT_STYLES[movement.type] || MOVEMENT_STYLES.same;
  const iconMarkup = getMovementIconMarkup(movement.type);
  return `
    <span class="movement-badge movement-badge--${movement.type}" style="--movement-badge-bg:${style.background};color:${style.color};">
      ${iconMarkup}
      <span class="movement-badge__label">${movement.text}</span>
    </span>
  `.trim();
}

function buildPlayerCellMarkup(player, { includeSchedule = false } = {}) {
  const displayName = getPlayerDisplayName(player);
  const safeName = escapeHtml(displayName);
  const scheduleLabel =
    includeSchedule && player?.preferredSchedule
      ? escapeHtml(SCHEDULE_LABELS[player.preferredSchedule] || player.preferredSchedule)
      : '';
  const photo = typeof player?.photo === 'string' ? player.photo : '';
  const hasPhoto = Boolean(photo);
  const avatarClasses = ['player-avatar', 'player-avatar--md'];
  let avatarContent = '';

  if (hasPhoto) {
    avatarContent = `<img src="${photo}" alt="Avatar de ${safeName}" />`;
  } else {
    avatarClasses.push('player-avatar--placeholder');
    avatarContent = escapeHtml(getPlayerInitial(player));
  }

  return `
    <div class="player-cell">
      <div class="${avatarClasses.join(' ')}">${avatarContent}</div>
      <div class="player-cell__info">
        <span class="player-cell__name">${safeName}</span>
        ${scheduleLabel ? `<span class="player-cell__meta">${scheduleLabel}</span>` : ''}
      </div>
    </div>
  `.trim();
}

const state = {
  token: null,
  user: null,
  categories: [],
  leagues: [],
  players: [],
  myMatches: [],
  upcomingMatches: [],
  pendingApprovalMatches: [],
  completedMatches: [],
  selectedCategoryId: null,
  needsSetup: false,
  enrollments: new Map(),
  enrollmentRequests: new Map(),
  activeSection: 'section-dashboard',
  dashboardCategoryId: '',
  dashboardSummary: null,
  calendarMatches: [],
  calendarDate: new Date(),
  globalCalendarDate: new Date(),
  matchesCategoryId: '',
  adminCategoryEditingId: null,
  adminPlayerEditingId: null,
  adminMatchEditingId: null,
  seasons: [],
  club: null,
  currentRanking: null,
  currentRankingCategoryName: '',
  generalChatMessages: [],
  noticeUnreadCount: 0,
  playerDirectoryFilters: {
    search: '',
    gender: '',
    role: '',
    category: '',
  },
  push: {
    supported: PUSH_SUPPORTED,
    permission: PUSH_SUPPORTED ? Notification.permission : 'default',
    enabled: false,
    configLoaded: false,
    serverEnabled: false,
    publicKey: null,
    subscriptionEndpoint: null,
    loading: false,
  },
};

const tabButtons = document.querySelectorAll('.tab-button');
const tabPanes = document.querySelectorAll('.tab-pane');
const authView = document.getElementById('auth-view');
const appView = document.getElementById('app-view');
const appMenu = document.getElementById('app-menu');
const appSidebar = document.getElementById('app-sidebar');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');
const mobileMenuClose = document.getElementById('mobile-menu-close');
const mobileTopbarLogo = document.getElementById('mobile-topbar-logo');
const mobileTopbarTitle = document.getElementById('mobile-topbar-title');
const authDescription = document.getElementById('auth-description');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginStatus = document.getElementById('login-status');
const loginEmailInput = loginForm ? loginForm.querySelector('input[name="email"]') : null;
const loginPasswordInput = loginForm ? loginForm.querySelector('input[name="password"]') : null;
const loginRememberCheckbox = document.getElementById('login-remember');
const registerStatus = document.getElementById('register-status');
const registerRoleWrapper = document.getElementById('register-role-wrapper');
const profileName = document.getElementById('profile-name');
const profileRole = document.getElementById('profile-role');
const profileAvatar = document.getElementById('profile-avatar');
const profileEditButton = document.getElementById('profile-edit');
const profileForm = document.getElementById('profile-form');
const profileCancelButton = document.getElementById('profile-cancel');
const profileStatus = document.getElementById('profile-status');
const accountOverview = document.getElementById('account-overview');
const accountPhoto = document.getElementById('account-photo');
const accountEmail = document.getElementById('account-email');
const accountPhone = document.getElementById('account-phone');
const accountBirthDate = document.getElementById('account-birth-date');
const accountSchedule = document.getElementById('account-schedule');
const accountNotes = document.getElementById('account-notes');
const accountPushStatus = document.getElementById('account-push-status');
const appSections = document.querySelectorAll('.app-section');
const dashboardCategory = document.getElementById('dashboard-category');
const metricPlayers = document.getElementById('metric-players');
const metricUpcoming = document.getElementById('metric-upcoming');
const metricNotifications = document.getElementById('metric-notifications');
const metricCategories = document.getElementById('metric-categories');
const metricCategoriesWrapper = document.getElementById('metric-categories-wrapper');
const dashboardRankingList = document.getElementById('dashboard-ranking');
const dashboardUpcomingList = document.getElementById('dashboard-upcoming');
const dashboardNotificationsList = document.getElementById('dashboard-notifications');
const dashboardGrid = document.getElementById('dashboard-grid');
const dashboardCardToggleButtons = document.querySelectorAll('[data-card-toggle]');
const topbarLogo = document.getElementById('topbar-logo');
const clubNameHeading = document.getElementById('club-name-heading');
const clubSloganHeading = document.getElementById('club-slogan');
const clubLogoDisplay = document.getElementById('club-logo-display');
const clubNameDisplay = document.getElementById('club-name-display');
const clubSloganDisplay = document.getElementById('club-slogan-display');
const clubDescription = document.getElementById('club-description');
const clubAddress = document.getElementById('club-address');
const clubContact = document.getElementById('club-contact');
const clubWebsite = document.getElementById('club-website');
const clubScheduleList = document.getElementById('club-schedule-list');
const clubScheduleEmpty = document.getElementById('club-schedule-empty');
const clubCourtsList = document.getElementById('club-courts-list');
const clubCourtsEmpty = document.getElementById('club-courts-empty');
const clubFacilitiesList = document.getElementById('club-facilities-list');
const clubFacilitiesEmpty = document.getElementById('club-facilities-empty');
const clubEditButton = document.getElementById('club-edit-button');
const clubStatus = document.getElementById('club-status');
const rankingPrintButton = document.getElementById('ranking-print-button');
const logoutButtons = Array.from(document.querySelectorAll('[data-action="logout"]'));
const globalMessage = document.getElementById('global-message');
const categoriesList = document.getElementById('categories-list');
const leaguesList = document.getElementById('leagues-list');
const notificationsList = document.getElementById('notifications-list');
const matchesMenuBadge = document.getElementById('menu-matches-badge');
const notificationsMenuBadge = document.getElementById('menu-notifications-badge');
const noticesMenuBadge = document.getElementById('menu-notices-badge');
const pushSettingsCard = document.getElementById('push-settings-card');
const pushStatusText = document.getElementById('push-status-text');
const pushEnableButton = document.getElementById('push-enable-button');
const pushDisableButton = document.getElementById('push-disable-button');
const pushPermissionWarning = document.getElementById('push-permission-warning');
const pushUnsupportedWarning = document.getElementById('push-unsupported-warning');

if (loginRememberCheckbox) {
  loginRememberCheckbox.addEventListener('change', () => {
    if (!loginRememberCheckbox.checked) {
      clearRememberedCredentials();
    }
  });
}

const upcomingList = document.getElementById('upcoming-matches');
const myMatchesList = document.getElementById('my-matches');
let activeProposalForm = null;
let activeProposalMatchId = null;
let pushServiceWorkerRegistration = null;
let pushServiceWorkerRegistrationPromise = null;
const matchesCategorySelect = document.getElementById('matches-category');
const pendingApprovalsList = document.getElementById('pending-approvals');
const completedMatchesList = document.getElementById('completed-matches');
const generalChatMessagesList = document.getElementById('general-chat-messages');
const generalChatForm = document.getElementById('general-chat-form');
const generalChatInput = document.getElementById('general-chat-input');
const generalChatToolbar = document.getElementById('general-chat-toolbar');
const generalChatEditor = document.getElementById('general-chat-editor');
const generalChatAttachmentInput = document.getElementById('general-chat-attachment-input');
const generalChatAttachments = document.getElementById('general-chat-attachments');
const generalChatAttachmentsList = generalChatAttachments
  ? generalChatAttachments.querySelector('.chat-attachments-list')
  : null;
const rulesContent = document.getElementById('rules-content');
const rulesEditButton = document.getElementById('rules-edit-button');
const rankingSelect = document.getElementById('ranking-select');
const rankingTable = document.getElementById('ranking-table');
const rankingEmpty = document.getElementById('ranking-empty');
const menuButtons = appMenu ? Array.from(appMenu.querySelectorAll('.menu-button')) : [];
const adminMenuButtons = menuButtons.filter((button) => button.dataset.requiresAdmin === 'true');
const adminSectionIds = new Set(adminMenuButtons.map((button) => button.dataset.target));
const adminToggleElements = document.querySelectorAll('[data-admin-visible="toggle"]');
const desktopMediaQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(min-width: 1025px)') : null;

function isMobileMenuSupported() {
  return Boolean(appSidebar && mobileMenuToggle);
}

function isMobileMenuOpen() {
  return appSidebar?.classList.contains('sidebar--mobile-open');
}

function openMobileMenu() {
  if (!isMobileMenuSupported()) return;

  appSidebar.classList.add('sidebar--mobile-open');
  document.body.classList.add('mobile-menu-open');
  if (mobileMenuToggle) {
    mobileMenuToggle.setAttribute('aria-expanded', 'true');
  }
  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.hidden = false;
    requestAnimationFrame(() => {
      mobileMenuBackdrop.classList.add('is-active');
    });
  }

  const focusTarget = menuButtons.find((button) => !button.hidden && !button.disabled) || appSidebar;
  if (focusTarget) {
    requestAnimationFrame(() => {
      focusTarget.focus();
    });
  }
}

function closeMobileMenu({ restoreFocus = false } = {}) {
  if (!isMobileMenuSupported()) return;

  appSidebar.classList.remove('sidebar--mobile-open');
  document.body.classList.remove('mobile-menu-open');
  if (mobileMenuToggle) {
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
  }

  if (mobileMenuBackdrop && !mobileMenuBackdrop.hidden) {
    const finalize = () => {
      mobileMenuBackdrop.hidden = true;
      mobileMenuBackdrop.classList.remove('is-active');
    };

    mobileMenuBackdrop.addEventListener('transitionend', finalize, { once: true });
    mobileMenuBackdrop.addEventListener('transitioncancel', finalize, { once: true });

    requestAnimationFrame(() => {
      mobileMenuBackdrop.classList.remove('is-active');
      const styles = getComputedStyle(mobileMenuBackdrop);
      const durations = styles.transitionDuration
        ? styles.transitionDuration.split(',').map((value) => parseFloat(value) || 0)
        : [0];
      const hasDuration = durations.some((duration) => duration > 0);
      if (!hasDuration) {
        finalize();
      }
    });
  }

  if (restoreFocus && mobileMenuToggle) {
    mobileMenuToggle.focus();
  }
}

function toggleMobileMenu() {
  if (!isMobileMenuSupported()) return;
  if (isMobileMenuOpen()) {
    closeMobileMenu({ restoreFocus: true });
  } else {
    openMobileMenu();
  }
}

function handleDesktopMediaChange(event) {
  if (event.matches) {
    closeMobileMenu();
  }
}
const adminCategoryForm = document.getElementById('admin-category-form');
const adminCategoryList = document.getElementById('admin-category-list');
const adminCategoryCancel = document.getElementById('admin-category-cancel');
const adminPlayerForm = document.getElementById('admin-player-form');
const adminPlayerList = document.getElementById('admin-player-list');
const adminPlayerCancel = document.getElementById('admin-player-cancel');
const adminEnrollmentForm = document.getElementById('admin-enrollment-form');
const adminEnrollmentCategory = document.getElementById('admin-enrollment-category');
const adminEnrollmentPlayer = document.getElementById('admin-enrollment-player');
const adminEnrollmentList = document.getElementById('admin-enrollment-list');
const adminEnrollmentStatus = document.getElementById('admin-enrollment-status');
const adminMatchForm = document.getElementById('admin-match-form');
const adminMatchSelect = document.getElementById('admin-match-select');
const adminMatchCategory = document.getElementById('admin-match-category');
const adminMatchStatus = document.getElementById('admin-match-status-select');
const adminMatchPlayer1 = document.getElementById('admin-match-player1');
const adminMatchPlayer2 = document.getElementById('admin-match-player2');
const adminMatchDate = document.getElementById('admin-match-date');
const adminMatchCourt = document.getElementById('admin-match-court');
const adminMatchNotes = document.getElementById('admin-match-notes');
const adminMatchCancel = document.getElementById('admin-match-cancel');
const adminMatchDelete = document.getElementById('admin-match-delete');
const adminMatchList = document.getElementById('admin-match-list');
const adminStatus = document.getElementById('admin-status');
const adminMatchStatusMessage = document.getElementById('admin-match-status-message');
const calendarContainer = document.getElementById('dashboard-calendar');
const calendarLabel = document.getElementById('calendar-label');
const calendarPrev = document.getElementById('calendar-prev');
const calendarNext = document.getElementById('calendar-next');
const globalCalendarContainer = document.getElementById('global-calendar');
const globalCalendarLabel = document.getElementById('global-calendar-label');
const globalCalendarPrev = document.getElementById('global-calendar-prev');
const globalCalendarNext = document.getElementById('global-calendar-next');
const playerDirectoryList = document.getElementById('player-directory-list');
const playerDirectoryCount = document.getElementById('player-directory-count');
const playerDirectorySearch = document.getElementById('player-directory-search');
const playerDirectoryGender = document.getElementById('player-directory-gender');
const playerDirectoryRole = document.getElementById('player-directory-role');
const playerDirectoryCategory = document.getElementById('player-directory-category');
const playerDirectoryEmpty = document.getElementById('player-directory-empty');
const categoryCreateButton = document.getElementById('category-create-button');
const leagueCreateButton = document.getElementById('league-create-button');
const matchCreateButton = document.getElementById('match-create-button');
const matchGenerateButton = document.getElementById('match-generate-button');
const playerCreateButton = document.getElementById('player-create-button');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

let activeModalCleanup = null;
let noticeDraftAttachments = [];

function translateGender(value) {
  if (value === 'femenino') return 'Femenino';
  if (value === 'masculino') return 'Masculino';
  return value;
}

function translateSchedule(value) {
  return SCHEDULE_LABELS[value] || 'Sin preferencia';
}

function translateRole(role) {
  if (role === 'admin') return 'Administrador';
  if (role === 'player') return 'Jugador';
  return role;
}

function formatRoles(roles) {
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

function entityHasRole(entity, role) {
  if (!entity || !role) return false;
  const roles = Array.isArray(entity.roles)
    ? entity.roles
    : typeof entity.role === 'string'
    ? [entity.role]
    : [];
  return roles.includes(role);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
    reader.readAsDataURL(file);
  });
}

async function extractPhotoFromForm(form, fieldName = 'photo') {
  if (!form?.elements?.[fieldName]) return undefined;
  const input = form.elements[fieldName];
  const file = input.files?.[0];
  if (!file) return undefined;
  if (!file.type.startsWith('image/')) {
    throw new Error('La fotografía debe ser una imagen válida.');
  }
  if (file.size > MAX_PHOTO_SIZE) {
    throw new Error('La fotografía no puede superar los 2 MB.');
  }

  return readFileAsDataUrl(file);
}

function setStatusMessage(element, type, message) {
  if (!element) return;
  element.textContent = message || '';
  element.className = 'status-message';
  if (!message) {
    element.style.display = 'none';
    return;
  }
  if (type) {
    element.classList.add(type);
  }
  element.style.display = 'block';
}

function setCardToggleButtonState(button, expanded) {
  if (!button) return;
  const expandLabel = button.dataset.expandLabel || 'Expandir';
  const collapseLabel = button.dataset.collapseLabel || 'Contraer';
  const label = expanded ? collapseLabel : expandLabel;
  button.setAttribute('aria-expanded', String(expanded));
  button.textContent = label;
}

function toggleDashboardCard(button) {
  if (!button) return;
  const card = button.closest('.card');
  if (!card) return;
  const isCollapsed = card.classList.toggle('card--collapsed');
  const expanded = !isCollapsed;
  setCardToggleButtonState(button, expanded);
}

function initializeDashboardCardToggles() {
  dashboardCardToggleButtons.forEach((button) => {
    const card = button.closest('.card');
    const isCollapsed = card?.classList.contains('card--collapsed') ?? false;
    setCardToggleButtonState(button, !isCollapsed);
  });

  dashboardGrid?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-card-toggle]');
    if (!button) return;
    event.preventDefault();
    toggleDashboardCard(button);
  });
}

function closeModal() {
  if (!modalOverlay || !modalBody) return;
  if (activeModalCleanup) {
    try {
      activeModalCleanup();
    } catch (error) {
      console.warn('Error al ejecutar la limpieza del modal', error);
    }
    activeModalCleanup = null;
  }
  modalOverlay.classList.remove('open');
  modalOverlay.hidden = true;
  modalBody.innerHTML = '';
  if (modalTitle) {
    modalTitle.textContent = '';
  }
}

function openModal({ title, content, onClose } = {}) {
  if (!modalOverlay || !modalBody) return;
  modalTitle.textContent = title || '';
  modalBody.innerHTML = '';
  if (typeof content === 'function') {
    content(modalBody);
  } else if (content instanceof Node) {
    modalBody.appendChild(content);
  }
  activeModalCleanup = typeof onClose === 'function' ? onClose : null;
  modalOverlay.hidden = false;
  requestAnimationFrame(() => {
    modalOverlay.classList.add('open');
  });
}

function showGlobalMessage(message = '', type = 'info') {
  globalMessage.textContent = message;
  globalMessage.classList.remove('show', 'error');
  if (!message) {
    return;
  }
  if (type === 'error') {
    globalMessage.classList.add('error');
  }
  globalMessage.classList.add('show');
}

function updateMatchesMenuBadge(count = 0) {
  if (!matchesMenuBadge) return;
  matchesMenuBadge.textContent = String(count);
  matchesMenuBadge.hidden = count <= 0;
}

function updateNotificationsMenuBadge(count = 0) {
  if (!notificationsMenuBadge) return;
  notificationsMenuBadge.textContent = String(count);
  notificationsMenuBadge.hidden = count <= 0;
}

function updateNotificationCounts(value = 0) {
  let count = 0;
  if (Array.isArray(value)) {
    count = value.reduce((acc, entry) => {
      const weight = Number(entry?.countValue);
      if (Number.isFinite(weight) && weight > 0) {
        return acc + Math.trunc(weight);
      }
      return acc + 1;
    }, 0);
  } else {
    const parsed = Number(value);
    count = Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
  }

  if (metricNotifications) {
    metricNotifications.textContent = String(count);
  }
  updateNotificationsMenuBadge(count);
  return count;
}

function collectEnrollmentRequestAlerts() {
  if (!isAdmin()) {
    state.pendingEnrollmentRequestCount = 0;
    return { alerts: [], total: 0 };
  }

  const categories = Array.isArray(state.categories) ? state.categories : [];
  let total = 0;
  const alerts = [];

  categories.forEach((category) => {
    const pendingCount = Number(category?.pendingRequestCount || 0);
    if (!Number.isFinite(pendingCount) || pendingCount <= 0) {
      return;
    }

    total += pendingCount;
    const categoryId = normalizeId(category);
    const categoryName = category?.name || 'Categoría';

    let scheduledFor = new Date();
    if (category?.pendingRequestLatestAt) {
      const candidate = new Date(category.pendingRequestLatestAt);
      if (!Number.isNaN(candidate.getTime())) {
        scheduledFor = candidate;
      }
    }

    alerts.push({
      type: 'enrollment-request',
      categoryId,
      categoryName,
      pendingCount,
      countValue: pendingCount,
      scheduledFor: scheduledFor.toISOString(),
      channel: 'solicitudes',
      title: `Solicitudes de inscripción · ${categoryName}`,
      message:
        pendingCount === 1
          ? `Hay 1 solicitud pendiente para ${categoryName}.`
          : `Hay ${pendingCount} solicitudes pendientes para ${categoryName}.`,
    });
  });

  alerts.sort((a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor));
  state.pendingEnrollmentRequestCount = total;

  return { alerts, total };
}

function combineNotificationsWithEnrollmentRequests(notifications = []) {
  const base = Array.isArray(notifications) ? [...notifications] : [];
  const { alerts } = collectEnrollmentRequestAlerts();
  return base.concat(alerts);
}

function updateNoticesMenuBadge(count = 0) {
  if (!noticesMenuBadge) return;
  noticesMenuBadge.textContent = String(count);
  noticesMenuBadge.hidden = count <= 0;
}

function getNoticeStorageKey(userId) {
  if (!userId) return null;
  return `${NOTICE_LAST_SEEN_PREFIX}${userId}`;
}

function readNoticeLastSeen(userId) {
  const key = getNoticeStorageKey(userId);
  if (!key) return 0;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch (error) {
    console.warn('No fue posible leer la última visita al panel de avisos', error);
    return 0;
  }
}

function writeNoticeLastSeen(userId, timestamp) {
  const key = getNoticeStorageKey(userId);
  if (!key) return;
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) return;
  try {
    localStorage.setItem(key, String(Math.floor(value)));
  } catch (error) {
    console.warn('No fue posible guardar la última visita al panel de avisos', error);
  }
}

function syncNoticeBoardState(messages = state.generalChatMessages) {
  const currentUserId = normalizeId(state.user);
  if (!currentUserId) {
    state.noticeUnreadCount = 0;
    updateNoticesMenuBadge(0);
    return;
  }

  const list = Array.isArray(messages) ? messages : [];
  const lastSeen = readNoticeLastSeen(currentUserId);
  let latestTimestamp = lastSeen;
  let unread = 0;

  list.forEach((message) => {
    const timestamp = Date.parse(message?.createdAt);
    if (!Number.isFinite(timestamp)) {
      return;
    }
    if (timestamp > latestTimestamp) {
      latestTimestamp = timestamp;
    }
    const senderId = normalizeId(message?.sender);
    if (senderId && senderId === currentUserId) {
      return;
    }
    if (!lastSeen || timestamp > lastSeen) {
      unread += 1;
    }
  });

  if (state.activeSection === 'section-chat') {
    if (latestTimestamp > 0) {
      writeNoticeLastSeen(currentUserId, latestTimestamp);
    }
    unread = 0;
  }

  state.noticeUnreadCount = unread;
  updateNoticesMenuBadge(unread);
}

function setActiveMenu(targetId = null) {
  if (!menuButtons.length) return;

  const activeTargets = new Set();

  if (targetId) {
    activeTargets.add(targetId);
    const targetButton = menuButtons.find((button) => button.dataset.target === targetId);
    const parentTarget = targetButton?.dataset.parentTarget;
    if (parentTarget) {
      activeTargets.add(parentTarget);
    }
  }

  menuButtons.forEach((button) => {
    const target = button.dataset.target;
    button.classList.toggle('active', target ? activeTargets.has(target) : false);
  });
}

function updateAdminMenuVisibility() {
  if (!adminMenuButtons.length) return;
  const shouldShow = isAdmin();
  adminMenuButtons.forEach((button) => {
    button.hidden = !shouldShow;
  });

  if (adminToggleElements.length) {
    adminToggleElements.forEach((element) => {
      if (!element) return;
      element.hidden = !shouldShow;
    });
  }

  if (generalChatForm) {
    generalChatForm.hidden = !shouldShow;
  }

  if (generalChatInput) {
    generalChatInput.disabled = !shouldShow;
  }

  if (!shouldShow && adminSectionIds.size) {
    adminSectionIds.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.hidden = true;
      }
    });
  }

  if (!shouldShow && adminSectionIds.has(state.activeSection)) {
    showSection('section-dashboard');
  }
}

function showSection(sectionId) {
  if (!sectionId || !appSections.length) return;

  const targetSection = document.getElementById(sectionId);
  if (!targetSection) return;

  let resolvedSectionId = sectionId;
  if (targetSection.dataset.adminOnly === 'true' && !isAdmin()) {
    resolvedSectionId = 'section-dashboard';
    showGlobalMessage('Necesitas permisos de administrador para acceder a esta sección.', 'error');
  }

  state.activeSection = resolvedSectionId;

  appSections.forEach((section) => {
    section.hidden = section.id !== resolvedSectionId;
  });

  if (resolvedSectionId !== 'section-account') {
    toggleProfileForm(false);
  }

  setActiveMenu(resolvedSectionId);
  closeMobileMenu();
  syncNoticeBoardState();
}

async function request(path, { method = 'GET', body, requireAuth = true } = {}) {
  const headers = {
    Accept: 'application/json',
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  if (requireAuth) {
    if (!state.token) {
      throw new Error('Debes iniciar sesión para realizar esta acción.');
    }
    headers.Authorization = `Bearer ${state.token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error('No fue posible conectar con el servidor.');
  }

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const message = data?.message || data?.errors?.[0]?.msg || response.statusText;
    if (response.status === 401) {
      clearSession();
      state.token = null;
      state.user = null;
      updateAuthUI();
    }
    throw new Error(message);
  }

  return data;
}

function persistRememberedCredentials(email, password, remember) {
  if (!remember) {
    clearRememberedCredentials();
    return;
  }

  const payload = {
    email: typeof email === 'string' ? email : '',
    password: typeof password === 'string' ? password : '',
  };

  localStorage.setItem(REMEMBER_CREDENTIALS_KEY, JSON.stringify(payload));
}

function clearRememberedCredentials() {
  localStorage.removeItem(REMEMBER_CREDENTIALS_KEY);
}

function loadRememberedCredentials() {
  if (!loginEmailInput || !loginPasswordInput || !loginRememberCheckbox) {
    return;
  }

  const storedRaw = localStorage.getItem(REMEMBER_CREDENTIALS_KEY);
  if (!storedRaw) {
    loginRememberCheckbox.checked = false;
    return;
  }

  try {
    const stored = JSON.parse(storedRaw);
    const savedEmail = typeof stored?.email === 'string' ? stored.email : '';
    const savedPassword = typeof stored?.password === 'string' ? stored.password : '';

    loginEmailInput.value = savedEmail;
    loginPasswordInput.value = savedPassword;
    loginRememberCheckbox.checked = Boolean(savedEmail || savedPassword);
  } catch (error) {
    clearRememberedCredentials();
    loginRememberCheckbox.checked = false;
  }
}

function persistSession() {
  if (state.token && state.user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: state.token, user: state.user }));
  }
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function ensurePushServiceWorker() {
  if (!state.push.supported) {
    return Promise.resolve(null);
  }

  if (!pushServiceWorkerRegistrationPromise) {
    pushServiceWorkerRegistrationPromise = navigator.serviceWorker
      .register('/app/service-worker.js')
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        pushServiceWorkerRegistration = registration;
        return registration;
      })
      .catch((error) => {
        console.warn('No se pudo registrar el service worker de notificaciones push', error);
        pushServiceWorkerRegistrationPromise = null;
        pushServiceWorkerRegistration = null;
        return null;
      });
  }

  return pushServiceWorkerRegistrationPromise;
}

async function getPushRegistration() {
  if (!state.push.supported) {
    return null;
  }

  if (pushServiceWorkerRegistration) {
    return pushServiceWorkerRegistration;
  }

  const registration = await ensurePushServiceWorker();
  pushServiceWorkerRegistration = registration;
  return registration;
}

function getPushStatusLabel() {
  if (!state.user) {
    return 'Disponible tras iniciar sesión';
  }

  if (!state.push.supported) {
    return 'No compatible';
  }

  if (!state.push.serverEnabled) {
    return 'No disponible';
  }

  if (state.push.permission === 'denied') {
    return 'Bloqueadas en el navegador';
  }

  return state.push.enabled ? 'Activadas' : 'Pendiente de activar';
}

function updatePushSettingsUI() {
  if (accountPushStatus) {
    accountPushStatus.textContent = getPushStatusLabel();
  }

  if (!pushSettingsCard) {
    return;
  }

  const supported = state.push.supported;
  const loggedIn = Boolean(state.token);
  const permission = supported && typeof Notification !== 'undefined' ? Notification.permission : 'default';
  state.push.permission = permission;
  const serverEnabled = state.push.serverEnabled && Boolean(state.push.publicKey);
  const loading = state.push.loading;

  let statusMessage = '';
  if (!supported) {
    statusMessage = 'Tu navegador no es compatible con las notificaciones push.';
  } else if (!loggedIn) {
    statusMessage = 'Inicia sesión para configurar las notificaciones push en este dispositivo.';
  } else if (!state.push.configLoaded) {
    statusMessage = 'Verificando la disponibilidad de las notificaciones push...';
  } else if (!serverEnabled) {
    statusMessage = 'Las notificaciones push todavía no están habilitadas en el servidor.';
  } else if (permission === 'denied') {
    statusMessage = 'Has bloqueado las notificaciones push desde el navegador.';
  } else if (state.push.enabled) {
    statusMessage = 'Recibirás avisos inmediatos del club en este dispositivo.';
  } else {
    statusMessage = 'Activa las notificaciones push para recibir avisos en tiempo real del club.';
  }

  if (pushStatusText) {
    pushStatusText.textContent = statusMessage;
  }

  const canEnable =
    supported &&
    loggedIn &&
    serverEnabled &&
    permission !== 'denied' &&
    Boolean(state.push.publicKey);

  if (pushEnableButton) {
    pushEnableButton.hidden = !canEnable || state.push.enabled;
    pushEnableButton.disabled = loading || !canEnable;
  }

  if (pushDisableButton) {
    pushDisableButton.hidden = !state.push.enabled;
    pushDisableButton.disabled = loading;
  }

  if (pushPermissionWarning) {
    pushPermissionWarning.hidden = permission !== 'denied';
  }

  if (pushUnsupportedWarning) {
    pushUnsupportedWarning.hidden = supported;
  }
}

async function fetchPushConfig() {
  if (!state.token || !state.push.supported) {
    state.push.configLoaded = true;
    state.push.serverEnabled = false;
    state.push.publicKey = null;
    updatePushSettingsUI();
    return null;
  }

  try {
    const config = await request('/push/config');
    state.push.publicKey = config?.publicKey || null;
    state.push.serverEnabled = Boolean(config?.enabled && config?.publicKey);
    state.push.configLoaded = true;
    return config;
  } catch (error) {
    state.push.publicKey = null;
    state.push.serverEnabled = false;
    state.push.configLoaded = true;
    throw error;
  } finally {
    updatePushSettingsUI();
  }
}

function serializePushSubscription(subscription) {
  if (!subscription) {
    return null;
  }

  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: json?.keys || {},
    userAgent: navigator.userAgent,
  };
}

async function syncPushSubscriptionState() {
  if (!state.token || !state.push.supported) {
    state.push.enabled = false;
    state.push.subscriptionEndpoint = null;
    updatePushSettingsUI();
    return;
  }

  state.push.loading = true;
  updatePushSettingsUI();

  try {
    if (!state.push.configLoaded) {
      try {
        await fetchPushConfig();
      } catch (error) {
        console.warn('No se pudo obtener la configuración de notificaciones push', error);
      }
    }

    if (!state.push.serverEnabled || !state.push.publicKey) {
      state.push.enabled = false;
      return;
    }

    const registration = await getPushRegistration();
    if (!registration) {
      state.push.enabled = false;
      return;
    }

    const existing = await registration.pushManager.getSubscription();
    state.push.subscriptionEndpoint = existing?.endpoint || null;
    state.push.permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';

    if (existing && state.push.permission === 'granted') {
      const payload = serializePushSubscription(existing);
      if (payload) {
        try {
          await request('/push/subscriptions', { method: 'POST', body: payload });
          state.push.enabled = true;
        } catch (error) {
          console.warn('No se pudo sincronizar la suscripción push', error);
        }
      }
    } else {
      state.push.enabled = false;
    }
  } catch (error) {
    console.warn('Error al sincronizar las notificaciones push', error);
  } finally {
    state.push.loading = false;
    updatePushSettingsUI();
  }
}

async function enablePushNotifications() {
  if (!state.push.supported || !state.token) {
    showGlobalMessage('Las notificaciones push no están disponibles en este dispositivo.', 'error');
    return;
  }

  state.push.loading = true;
  updatePushSettingsUI();

  try {
    if (!state.push.configLoaded || !state.push.publicKey) {
      await fetchPushConfig();
    }

    if (!state.push.serverEnabled || !state.push.publicKey) {
      showGlobalMessage('Las notificaciones push aún no están habilitadas en el servidor.', 'error');
      return;
    }

    const permission = await Notification.requestPermission();
    state.push.permission = permission;
    if (permission !== 'granted') {
      showGlobalMessage('Debes permitir las notificaciones para activarlas.', 'error');
      return;
    }

    const registration = await getPushRegistration();
    if (!registration) {
      showGlobalMessage('No se pudo preparar el servicio de notificaciones.', 'error');
      return;
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(state.push.publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    const payload = serializePushSubscription(subscription);
    if (!payload) {
      showGlobalMessage('No se pudo registrar la suscripción push.', 'error');
      return;
    }

    await request('/push/subscriptions', { method: 'POST', body: payload });
    state.push.enabled = true;
    state.push.subscriptionEndpoint = subscription.endpoint;
    showGlobalMessage('Notificaciones push activadas correctamente.');
  } catch (error) {
    console.warn('No se pudo activar las notificaciones push', error);
    const message = error?.message || 'No se pudo activar las notificaciones push.';
    showGlobalMessage(message, 'error');
  } finally {
    state.push.loading = false;
    state.push.permission = state.push.supported && typeof Notification !== 'undefined' ? Notification.permission : 'default';
    updatePushSettingsUI();
  }
}

async function disablePushNotifications() {
  if (!state.push.supported) {
    return;
  }

  state.push.loading = true;
  updatePushSettingsUI();

  try {
    const registration = await getPushRegistration();
    if (!registration) {
      state.push.enabled = false;
      return;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      try {
        await request('/push/subscriptions', {
          method: 'DELETE',
          body: { endpoint: subscription.endpoint },
        });
      } catch (error) {
        console.warn('No se pudo eliminar la suscripción push del servidor', error);
      }
      await subscription.unsubscribe().catch(() => null);
    }

    state.push.enabled = false;
    state.push.subscriptionEndpoint = null;
    showGlobalMessage('Notificaciones push desactivadas en este dispositivo.');
  } catch (error) {
    console.warn('No se pudo desactivar las notificaciones push', error);
    showGlobalMessage('No se pudo desactivar las notificaciones push.', 'error');
  } finally {
    state.push.loading = false;
    updatePushSettingsUI();
  }
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const stored = JSON.parse(raw);
    if (stored?.token && stored?.user) {
      state.token = stored.token;
      state.user = stored.user;
    }
  } catch (error) {
    console.warn('No fue posible restaurar la sesión previa', error);
  }
}

function switchTab(target) {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.target === target;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  tabPanes.forEach((pane) => {
    pane.hidden = pane.dataset.pane !== target;
  });
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => switchTab(button.dataset.target));
});

if (appMenu) {
  appMenu.addEventListener('click', (event) => {
    const button = event.target.closest('.menu-button');
    if (!button || button.hidden || button.disabled) return;
    showSection(button.dataset.target);
  });
}

mobileMenuToggle?.addEventListener('click', (event) => {
  event.preventDefault();
  toggleMobileMenu();
});

mobileMenuBackdrop?.addEventListener('click', () => {
  closeMobileMenu({ restoreFocus: true });
});

mobileMenuClose?.addEventListener('click', () => {
  closeMobileMenu({ restoreFocus: true });
});

if (desktopMediaQuery?.addEventListener) {
  desktopMediaQuery.addEventListener('change', handleDesktopMediaChange);
} else if (desktopMediaQuery?.addListener) {
  desktopMediaQuery.addListener(handleDesktopMediaChange);
}

if (desktopMediaQuery) {
  handleDesktopMediaChange(desktopMediaQuery);
}

function updateProfileCard() {
  if (!state.user) return;

  profileName.textContent = state.user.fullName || '';
  profileRole.textContent = formatRoles(state.user.roles || state.user.role);
  profileRole.classList.toggle('admin', entityHasRole(state.user, 'admin'));

  const photo = state.user.photo;
  profileAvatar.style.backgroundImage = photo ? `url('${photo}')` : '';
  if (accountPhoto) {
    accountPhoto.style.backgroundImage = photo ? `url('${photo}')` : '';
  }

  if (accountEmail) {
    accountEmail.textContent = state.user.email || '—';
  }

  if (accountPhone) {
    accountPhone.textContent = state.user.phone || '—';
  }

  if (accountBirthDate) {
    accountBirthDate.textContent = state.user.birthDate
      ? formatShortDate(state.user.birthDate)
      : '—';
  }

  if (accountSchedule) {
    accountSchedule.textContent = state.user.preferredSchedule
      ? translateSchedule(state.user.preferredSchedule)
      : 'Sin preferencia definida';
  }

  if (accountNotes) {
    accountNotes.textContent = state.user.notes || 'Sin notas registradas.';
  }

  if (accountPushStatus) {
    accountPushStatus.textContent = getPushStatusLabel();
  }

  if (profileForm && !profileForm.hidden) {
    fillProfileForm();
  }
}

function fillProfileForm() {
  if (!profileForm || !state.user) return;

  const { elements } = profileForm;
  if (!elements) return;

  elements.fullName.value = state.user.fullName || '';
  elements.email.value = state.user.email || '';
  elements.phone.value = state.user.phone || '';
  if (elements.preferredSchedule) {
    elements.preferredSchedule.value = state.user.preferredSchedule || 'flexible';
  }
  if (elements.gender) {
    elements.gender.value = state.user.gender || 'masculino';
  }
  if (elements.birthDate) {
    elements.birthDate.value = formatDateInput(state.user.birthDate);
  }
  if (elements.photo) {
    elements.photo.value = '';
  }
  if (elements.notes) {
    elements.notes.value = state.user.notes || '';
  }
  if (elements.password) {
    elements.password.value = '';
  }
  if (elements.notifyMatchRequests) {
    elements.notifyMatchRequests.checked = state.user.notifyMatchRequests !== false;
  }
  if (elements.notifyMatchResults) {
    elements.notifyMatchResults.checked = state.user.notifyMatchResults !== false;
  }
}

function toggleProfileForm(show) {
  if (!profileForm) return;

  if (show) {
    fillProfileForm();
    profileForm.hidden = false;
    if (profileEditButton) {
      profileEditButton.hidden = true;
    }
    if (accountOverview) {
      accountOverview.hidden = true;
    }
    setStatusMessage(profileStatus, '', '');
    return;
  }

  profileForm.hidden = true;
  if (profileEditButton) {
    profileEditButton.hidden = false;
  }
  if (accountOverview) {
    accountOverview.hidden = false;
  }
  profileForm.reset();
  if (profileForm.elements?.password) {
    profileForm.elements.password.value = '';
  }
  setStatusMessage(profileStatus, '', '');
}

function resetData() {
  toggleProfileForm(false);
  state.enrollments.clear();
  state.myMatches = [];
  state.upcomingMatches = [];
  state.pendingApprovalMatches = [];
  state.completedMatches = [];
  state.leagues = [];
  state.dashboardSummary = null;
  state.dashboardCategoryId = '';
  state.matchesCategoryId = '';
  state.generalChatMessages = [];
  state.noticeUnreadCount = 0;
  updateCategoryControlsAvailability();
  if (leaguesList) {
    leaguesList.innerHTML =
      '<li class="empty-state">Inicia sesión para revisar las ligas disponibles.</li>';
  }
  categoriesList.innerHTML = '<li class="empty-state">Inicia sesión para ver las categorías.</li>';
  notificationsList.innerHTML = '<li class="empty-state">Inicia sesión para ver tus notificaciones.</li>';
  upcomingList.innerHTML = '<li class="empty-state">Inicia sesión para consultar el calendario.</li>';
  myMatchesList.innerHTML = '<li class="empty-state">Inicia sesión para consultar tus partidos.</li>';
  updateMatchesMenuBadge(0);
  updateNoticesMenuBadge(0);
  if (pendingApprovalsList) {
    pendingApprovalsList.innerHTML =
      '<li class="empty-state">Inicia sesión para consultar los resultados pendientes.</li>';
  }
  if (completedMatchesList) {
    completedMatchesList.innerHTML =
      '<li class="empty-state">Inicia sesión para revisar los partidos disputados.</li>';
  }
  state.club = null;
  populateAdminMatchCourtOptions('');
  renderRules();
  if (clubNameDisplay) {
    clubNameDisplay.textContent = 'Liga Tennis';
  }
  if (clubSloganDisplay) {
    clubSloganDisplay.textContent = 'Liga social de tenis';
  }
  if (clubDescription) {
    clubDescription.textContent = '';
  }
  if (clubAddress) {
    clubAddress.textContent = '—';
  }
  if (clubContact) {
    clubContact.textContent = '—';
  }
  if (clubWebsite) {
    clubWebsite.textContent = '—';
  }
  if (clubScheduleList) {
    clubScheduleList.innerHTML = '';
  }
  if (clubScheduleEmpty) {
    clubScheduleEmpty.hidden = false;
  }
  if (clubCourtsList) {
    clubCourtsList.innerHTML = '';
  }
  if (clubCourtsEmpty) {
    clubCourtsEmpty.hidden = false;
  }
  if (clubFacilitiesList) {
    clubFacilitiesList.innerHTML = '';
  }
  if (clubFacilitiesEmpty) {
    clubFacilitiesEmpty.hidden = false;
  }
  if (clubStatus) {
    setStatusMessage(clubStatus, '', '');
  }
  if (topbarLogo) {
    topbarLogo.src = 'assets/club-logo.png';
  }
  if (clubNameHeading) {
    clubNameHeading.textContent = 'Liga Tennis';
  }
  if (clubSloganHeading) {
    clubSloganHeading.textContent = 'Liga social de tenis';
  }
  if (mobileTopbarTitle) {
    mobileTopbarTitle.textContent = 'Liga Tennis';
  }
  if (clubLogoDisplay) {
    clubLogoDisplay.style.backgroundImage = '';
  }
  if (mobileTopbarLogo) {
    mobileTopbarLogo.src = 'assets/club-logo.svg';
  }
  rankingSelect.innerHTML = '';
  rankingTable.querySelector('tbody').innerHTML = '';
  rankingEmpty.hidden = false;
  if (dashboardRankingList) {
    dashboardRankingList.innerHTML = '<li class="empty-state">Inicia sesión para consultar el ranking.</li>';
  }
  if (dashboardUpcomingList) {
    dashboardUpcomingList.innerHTML = '<li class="empty-state">Inicia sesión para ver los próximos partidos.</li>';
  }
  if (dashboardNotificationsList) {
    dashboardNotificationsList.innerHTML = '<li class="empty-state">Inicia sesión para revisar tus notificaciones.</li>';
  }
  if (dashboardCategory) {
    dashboardCategory.innerHTML = '';
  }
  if (generalChatMessagesList) {
    generalChatMessagesList.innerHTML =
      '<li class="empty-state">Inicia sesión para revisar los avisos del club.</li>';
  }
  if (generalChatInput) {
    generalChatInput.value = '';
  }
  if (metricPlayers) {
    metricPlayers.textContent = '0';
  }
  if (metricUpcoming) {
    metricUpcoming.textContent = '0';
  }
  updateNotificationCounts(0);
  if (metricCategories) {
    metricCategories.textContent = '0';
  }
  if (metricCategoriesWrapper) {
    metricCategoriesWrapper.hidden = false;
  }
  if (calendarContainer) {
    calendarContainer.innerHTML = '<div class="calendar-empty">Inicia sesión para ver el calendario.</div>';
  }
  if (calendarLabel) {
    calendarLabel.textContent = '';
  }
  if (globalCalendarContainer) {
    globalCalendarContainer.innerHTML =
      '<div class="calendar-empty">Inicia sesión para ver el calendario general.</div>';
  }
  if (globalCalendarLabel) {
    globalCalendarLabel.textContent = '';
  }
  if (playerDirectoryList) {
    playerDirectoryList.innerHTML = '';
  }
  if (playerDirectoryEmpty) {
    playerDirectoryEmpty.hidden = false;
    playerDirectoryEmpty.textContent = 'Inicia sesión para ver el directorio de jugadores.';
  }
  if (playerDirectoryCount) {
    playerDirectoryCount.textContent = '0';
  }
  if (playerDirectorySearch) {
    playerDirectorySearch.value = '';
  }
  if (playerDirectoryGender) {
    playerDirectoryGender.value = '';
  }
  if (playerDirectoryRole) {
    playerDirectoryRole.value = '';
  }
  if (playerDirectoryCategory) {
    playerDirectoryCategory.value = '';
  }
  state.players = [];
  state.playerDirectoryFilters = {
    search: '',
    gender: '',
    role: '',
    category: '',
  };
  resetAdminCategoryForm();
  resetAdminPlayerForm();
  resetAdminMatchForm();
  if (adminCategoryList) {
    adminCategoryList.innerHTML =
      '<li class="empty-state">Inicia sesión para gestionar las categorías.</li>';
  }
  if (adminPlayerList) {
    adminPlayerList.innerHTML =
      '<li class="empty-state">Inicia sesión para gestionar los usuarios.</li>';
  }
  if (adminMatchList) {
    adminMatchList.innerHTML =
      '<li class="empty-state">Inicia sesión para gestionar los partidos.</li>';
  }
  if (accountEmail) {
    accountEmail.textContent = '—';
  }
  if (accountPhone) {
    accountPhone.textContent = '—';
  }
  if (accountBirthDate) {
    accountBirthDate.textContent = '—';
  }
  if (accountSchedule) {
    accountSchedule.textContent = '—';
  }
  if (accountNotes) {
    accountNotes.textContent = 'Sin notas registradas.';
  }
  if (profileAvatar) {
    profileAvatar.style.backgroundImage = '';
  }
  if (accountPhoto) {
    accountPhoto.style.backgroundImage = '';
  }
  setStatusMessage(adminStatus, '', '');
  setStatusMessage(adminMatchStatusMessage, '', '');
  if (adminEnrollmentForm) {
    adminEnrollmentForm.reset();
  }
  if (adminEnrollmentList) {
    adminEnrollmentList.innerHTML =
      '<li class="empty-state">Inicia sesión para gestionar las inscripciones.</li>';
  }
  setStatusMessage(adminEnrollmentStatus, '', '');
  state.push.enabled = false;
  state.push.subscriptionEndpoint = null;
  state.push.publicKey = null;
  state.push.serverEnabled = false;
  state.push.configLoaded = false;
  state.push.permission = state.push.supported && typeof Notification !== 'undefined' ? Notification.permission : 'default';
  updatePushSettingsUI();
}

function applySetupState() {
  const roleInputs = registerForm
    ? Array.from(registerForm.querySelectorAll('input[name="roles"]'))
    : [];
  if (!roleInputs.length) return;

  if (state.needsSetup) {
    authDescription.textContent =
      'No hay administradores configurados todavía. Crea el usuario inicial para activar la aplicación.';
    roleInputs.forEach((input) => {
      input.checked = true;
      input.disabled = true;
      const wrapper = input.closest('.checkbox-option');
      if (wrapper) {
        wrapper.hidden = false;
      }
    });
    registerRoleWrapper.dataset.locked = 'true';
    switchTab('register');
    return;
  }

  authDescription.textContent = 'Inicia sesión con tu cuenta o regístrate para participar en la liga.';
  roleInputs.forEach((input) => {
    const isPlayerOption = input.value === 'player';
    const isAdminOption = input.value === 'admin';
    input.disabled = isAdminOption;
    input.checked = isPlayerOption;
    const wrapper = input.closest('.checkbox-option');
    if (wrapper) {
      wrapper.hidden = isAdminOption;
    }
  });
  registerRoleWrapper.dataset.locked = 'false';
}

function isAdmin() {
  return entityHasRole(state.user, 'admin');
}

function updateAuthUI() {
  const loggedIn = Boolean(state.token && state.user);
  authView.hidden = loggedIn;
  authView?.classList.toggle('is-hidden', loggedIn);
  appView.hidden = !loggedIn;
  if (appMenu) {
    appMenu.hidden = !loggedIn;
  }
  if (appSidebar) {
    appSidebar.hidden = !loggedIn;
  }

  if (!loggedIn) {
    closeMobileMenu();
    resetData();
    showGlobalMessage('Inicia sesión para acceder al panel de la liga.');
    if (appSections.length) {
      appSections.forEach((section) => {
        section.hidden = true;
      });
    }
    state.activeSection = 'section-dashboard';
    setActiveMenu(null);
  } else {
    showGlobalMessage('');
    updateProfileCard();
    state.activeSection = state.activeSection || 'section-dashboard';
    showSection(state.activeSection);
  }

  updateAdminMenuVisibility();
  updatePushSettingsUI();
}

function formatDate(value) {
  if (!value) return 'Por confirmar';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function formatShortDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  } catch (error) {
    return '—';
  }
}

function getMatchExpirationDate(match) {
  if (!match) return null;

  if (match.expiresAt) {
    const expirationDate = new Date(match.expiresAt);
    if (!Number.isNaN(expirationDate.getTime())) {
      return expirationDate;
    }
  }

  if (match.createdAt) {
    const createdAt = new Date(match.createdAt);
    if (!Number.isNaN(createdAt.getTime())) {
      return new Date(createdAt.getTime() + MATCH_EXPIRATION_DAYS * DAY_IN_MS);
    }
  }

  return null;
}

function formatExpirationDeadline(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch (error) {
    return null;
  }
}

function getExpirationWarningMessage(match) {
  const deadlineDate = getMatchExpirationDate(match);
  if (!deadlineDate) {
    return null;
  }

  const deadlineLabel = formatExpirationDeadline(deadlineDate);
  if (!deadlineLabel) {
    return null;
  }

  return `Aviso: disponen de ${MATCH_EXPIRATION_DAYS} días desde la generación del partido. Fecha límite: ${deadlineLabel}. Si nadie confirma ni juega antes de esa fecha, el partido no sumará puntos. Si solo un jugador confirma la fecha y la otra parte no responde, se asignará 6-0 6-0 a quien confirmó.`;
}

function formatTime(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    return '—';
  }
}

function formatDateOnly(value, options = {}) {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: options.weekday ?? 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function formatMonthLabel(date) {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch (error) {
    return '';
  }
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(date) {
  const copy = startOfDay(date);
  const day = copy.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function roundDateToInterval(date, minutes = CALENDAR_TIME_SLOT_MINUTES, mode = 'ceil') {
  const base = new Date(date);
  if (Number.isNaN(base.getTime())) {
    return new Date(NaN);
  }
  base.setSeconds(0, 0);
  const intervalMs = minutes * 60 * 1000;
  const remainder = base.getTime() % intervalMs;
  if (remainder === 0) {
    return base;
  }
  if (mode === 'floor') {
    return new Date(base.getTime() - remainder);
  }
  return new Date(base.getTime() + (intervalMs - remainder));
}

function roundDateUpToInterval(date, minutes = CALENDAR_TIME_SLOT_MINUTES) {
  return roundDateToInterval(date, minutes, 'ceil');
}

function formatDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const datePart = formatDateInput(date);
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${datePart}T${hours}:${minutes}`;
}

function hasActiveLeagues() {
  return Array.isArray(state.leagues)
    ? state.leagues.some((league) => league?.status !== 'cerrada')
    : false;
}

function resolveLeague(reference) {
  if (!reference) return null;
  const leagueId = normalizeId(reference);
  if (leagueId) {
    const fromState = state.leagues.find((league) => normalizeId(league) === leagueId);
    if (fromState) {
      return fromState;
    }
  }
  if (typeof reference === 'object') {
    return reference;
  }
  return null;
}

function updateCategoryControlsAvailability() {
  if (!categoryCreateButton) return;
  const enabled = hasActiveLeagues();
  categoryCreateButton.disabled = !enabled;
  categoryCreateButton.title = enabled
    ? ''
    : 'Crea una liga activa para registrar nuevas categorías.';
}

function renderLeagues(leagues = []) {
  if (!leaguesList) return;
  leaguesList.innerHTML = '';

  if (!Array.isArray(leagues) || !leagues.length) {
    leaguesList.innerHTML =
      '<li class="empty-state">Crea una liga para iniciar una nueva temporada.</li>';
    return;
  }

  const sorted = leagues
    .slice()
    .sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'activa' ? -1 : 1;
      }
      const yearA = Number(a.year) || 0;
      const yearB = Number(b.year) || 0;
      if (yearA !== yearB) {
        return yearB - yearA;
      }
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    });

  sorted.forEach((league) => {
    const item = document.createElement('li');
    const leagueId = normalizeId(league);
    if (leagueId) {
      item.dataset.leagueId = leagueId;
    }

    const title = document.createElement('strong');
    title.textContent = league.name || 'Liga';
    item.appendChild(title);

    const statusMeta = document.createElement('div');
    statusMeta.className = 'meta meta-league';
    if (league.year) {
      statusMeta.appendChild(document.createElement('span')).textContent = `Temporada ${league.year}`;
    }
    const statusBadge = document.createElement('span');
    statusBadge.className = `tag league-status league-status--${league.status || 'activa'}`;
    statusBadge.textContent = LEAGUE_STATUS_LABELS[league.status] || LEAGUE_STATUS_LABELS.activa;
    statusMeta.appendChild(statusBadge);
    item.appendChild(statusMeta);

    const dateParts = [];
    if (league.startDate) {
      dateParts.push(`Inicio: ${formatDate(league.startDate)}`);
    }
    if (league.endDate) {
      dateParts.push(`Fin: ${formatDate(league.endDate)}`);
    }
    if (league.status === 'cerrada' && league.closedAt) {
      dateParts.push(`Cierre: ${formatDate(league.closedAt)}`);
    }
    if (dateParts.length) {
      const datesMeta = document.createElement('div');
      datesMeta.className = 'meta meta-league-dates';
      datesMeta.textContent = dateParts.join(' · ');
      item.appendChild(datesMeta);
    }

    if (league.description) {
      const description = document.createElement('p');
      description.className = 'note';
      description.textContent = league.description;
      item.appendChild(description);
    }

    const categories = Array.isArray(league.categories) ? league.categories : [];
    if (categories.length) {
      const categoryList = document.createElement('ul');
      categoryList.className = 'inline-list league-category-list';
      categories.forEach((category) => {
        const chip = document.createElement('li');
        chip.textContent = category.name || 'Categoría';
        categoryList.appendChild(chip);
      });
      item.appendChild(categoryList);
    } else {
      const emptyMeta = document.createElement('div');
      emptyMeta.className = 'meta note';
      emptyMeta.textContent = 'Sin categorías asociadas por el momento.';
      item.appendChild(emptyMeta);
    }

    if (isAdmin()) {
      const actions = document.createElement('div');
      actions.className = 'actions';
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'secondary';
      editButton.textContent = 'Editar';
      editButton.dataset.action = 'edit';
      if (leagueId) {
        editButton.dataset.leagueId = leagueId;
      }
      actions.appendChild(editButton);
      item.appendChild(actions);
    }

    leaguesList.appendChild(item);
  });
}

function renderCategories(categories = []) {
  if (!categoriesList) return;
  updateCategoryControlsAvailability();
  categoriesList.innerHTML = '';

  if (!categories.length) {
    if (!state.leagues.length) {
      categoriesList.innerHTML = isAdmin()
        ? '<li class="empty-state">Crea una liga para comenzar a registrar categorías.</li>'
        : '<li class="empty-state">Aún no hay ligas disponibles.</li>';
    } else {
      categoriesList.innerHTML = '<li class="empty-state">No hay categorías registradas.</li>';
    }
    return;
  }

  const admin = isAdmin();
  const currentGender = state.user?.gender || '';
  let pendingRequestTotal = 0;

  categories.forEach((category) => {
    const item = document.createElement('li');
    const categoryId = normalizeId(category);
    if (categoryId) {
      item.dataset.categoryId = categoryId;
    }
    const categoryColor = getCategoryColor(category);
    if (categoryColor) {
      applyCategoryColorStyles(item, categoryColor, { backgroundAlpha: 0.14, borderAlpha: 0.3 });
    }

    const title = document.createElement('strong');
    title.textContent = category.name;
    if (categoryColor) {
      const indicator = createCategoryColorIndicator(categoryColor, category.name);
      if (indicator) {
        title.classList.add('with-category-color');
        title.prepend(indicator);
      }
    }
    item.appendChild(title);

    const statusValue = category.status || 'inscripcion';
    const meta = document.createElement('div');
    meta.className = 'meta meta-category';
    meta.appendChild(document.createElement('span')).textContent = translateGender(category.gender);

    const statusBadge = document.createElement('span');
    statusBadge.className = `tag category-status category-status--${statusValue}`;
    statusBadge.textContent = CATEGORY_STATUS_LABELS[statusValue] || 'Estado por definir';
    meta.appendChild(statusBadge);

    if (category.skillLevel) {
      const level = document.createElement('span');
      level.className = 'tag category-level';
      level.textContent = category.skillLevel;
      meta.appendChild(level);
    }
    item.appendChild(meta);

    const minimumAgeValue = Number(category.minimumAge);
    if (Number.isFinite(minimumAgeValue) && minimumAgeValue > 0) {
      const minimumAgeMeta = document.createElement('div');
      minimumAgeMeta.className = 'meta meta-minimum-age';
      const parts = [`Edad mínima: ${minimumAgeValue} años`];
      if (category.minimumAgeReferenceYear) {
        parts.push(`Año de referencia: ${category.minimumAgeReferenceYear}`);
      }
      minimumAgeMeta.textContent = parts.join(' · ');
      item.appendChild(minimumAgeMeta);
    }

    if (category.startDate || category.endDate) {
      const dates = document.createElement('div');
      dates.className = 'meta';
      const formatted = [category.startDate, category.endDate]
        .map((value) => (value ? formatDate(value) : null))
        .filter(Boolean)
        .join(' · ');
      dates.textContent = formatted || 'Fechas por confirmar';
      item.appendChild(dates);
    }

    if (category.description) {
      const description = document.createElement('p');
      description.textContent = category.description;
      item.appendChild(description);
    }

    const linkedLeague = resolveLeague(category.league);
    if (linkedLeague) {
      const leagueMeta = document.createElement('div');
      leagueMeta.className = 'meta meta-league-link';
      leagueMeta.appendChild(document.createElement('span')).textContent = 'Liga';

      const leagueTag = document.createElement('span');
      leagueTag.className = 'tag league-tag';
      const leagueNameParts = [linkedLeague.name || 'Liga'];
      if (linkedLeague.year) {
        leagueNameParts.push(linkedLeague.year);
      }
      leagueTag.textContent = leagueNameParts.join(' · ');
      if (linkedLeague.status === 'cerrada') {
        leagueTag.classList.add('league-tag--closed');
      }
      leagueMeta.appendChild(leagueTag);

      const statusLabel = linkedLeague.status
        ? LEAGUE_STATUS_LABELS[linkedLeague.status]
        : null;
      if (statusLabel) {
        const statusBadge = document.createElement('span');
        statusBadge.className = `tag league-status league-status--${linkedLeague.status}`;
        statusBadge.textContent = statusLabel;
        leagueMeta.appendChild(statusBadge);
      }

      item.appendChild(leagueMeta);
    } else if (admin) {
      const leagueNote = document.createElement('div');
      leagueNote.className = 'meta note';
      leagueNote.textContent = 'Liga pendiente de asignar.';
      item.appendChild(leagueNote);
    }

    const storedEnrollments = state.enrollments.get(categoryId);
    const enrollmentCount = Array.isArray(storedEnrollments)
      ? storedEnrollments.length
      : Number(category.enrollmentCount || 0);
    const pendingRequestCount = Number(category.pendingRequestCount || 0);
    if (admin && Number.isFinite(pendingRequestCount) && pendingRequestCount > 0) {
      pendingRequestTotal += pendingRequestCount;
    }

    const enrollmentSummary = document.createElement('div');
    enrollmentSummary.className = 'meta meta-enrollment';
    enrollmentSummary.textContent = `Jugadores inscritos: ${enrollmentCount}`;
    item.appendChild(enrollmentSummary);

    if (admin && pendingRequestCount > 0) {
      const requestSummary = document.createElement('div');
      requestSummary.className = 'meta meta-enrollment';
      requestSummary.textContent = `Solicitudes pendientes: ${pendingRequestCount}`;
      item.appendChild(requestSummary);
    }

    if (Array.isArray(storedEnrollments) && storedEnrollments.length) {
      const roster = document.createElement('ul');
      roster.className = 'inline-list';
      storedEnrollments.forEach((enrollment) => {
        const player = enrollment.user || {};
        const listItem = document.createElement('li');
        listItem.textContent = player.fullName || player.email || 'Jugador';
        roster.appendChild(listItem);
      });
      item.appendChild(roster);
    }

    const actions = document.createElement('div');
    actions.className = 'actions category-actions';
    let hasActions = false;

    if (admin) {
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'secondary';
      editButton.textContent = 'Editar';
      if (categoryId) {
        editButton.dataset.categoryId = categoryId;
        editButton.dataset.action = 'edit';
      }
      actions.appendChild(editButton);

      if (pendingRequestCount > 0) {
        const reviewButton = document.createElement('button');
        reviewButton.type = 'button';
        reviewButton.className = 'primary';
        reviewButton.textContent =
          pendingRequestCount === 1
            ? 'Revisar solicitud'
            : `Revisar ${pendingRequestCount} solicitudes`;
        if (categoryId) {
          reviewButton.dataset.categoryId = categoryId;
          reviewButton.dataset.action = 'review-requests';
        }
        actions.appendChild(reviewButton);
      }

      const manageButton = document.createElement('button');
      manageButton.type = 'button';
      manageButton.className = 'ghost';
      manageButton.textContent = 'Gestionar inscripciones';
      if (categoryId) {
        manageButton.dataset.categoryId = categoryId;
        manageButton.dataset.action = 'enrollments';
      }
      actions.appendChild(manageButton);
      hasActions = true;
    }

    const hasPendingRequest = Boolean(category.pendingRequestId);
    const canRequestEnrollment = Boolean(
      !admin &&
        categoryId &&
        category.canRequestEnrollment &&
        !category.isEnrolled &&
        !hasPendingRequest
    );

    if (category.isEnrolled) {
      const enrolledBadge = document.createElement('span');
      enrolledBadge.className = 'tag tag--success';
      enrolledBadge.textContent = 'Inscrito';
      actions.appendChild(enrolledBadge);
      hasActions = true;
    } else if (hasPendingRequest) {
      const pendingBadge = document.createElement('span');
      pendingBadge.className = 'tag';
      pendingBadge.textContent = 'Solicitud enviada';
      actions.appendChild(pendingBadge);
      hasActions = true;
    } else if (canRequestEnrollment) {
      const requestButton = document.createElement('button');
      requestButton.type = 'button';
      requestButton.className = 'primary';
      requestButton.dataset.categoryId = categoryId;
      requestButton.dataset.action = 'request-enrollment';
      requestButton.textContent = 'Solicitar inscripción';
      actions.appendChild(requestButton);
      hasActions = true;
    } else if (!admin && statusValue === 'en_curso') {
      const note = document.createElement('span');
      note.className = 'note';
      note.textContent = 'Inscripciones cerradas';
      actions.appendChild(note);
      hasActions = true;
    } else if (!admin && currentGender && category.gender !== currentGender) {
      const note = document.createElement('span');
      note.className = 'note';
      note.textContent = 'No disponible para tu perfil';
      actions.appendChild(note);
      hasActions = true;
    }

    if (hasActions) {
      item.appendChild(actions);
    }

    categoriesList.appendChild(item);
  });

  if (admin) {
    state.pendingEnrollmentRequestCount = pendingRequestTotal;
    if (state.notificationBase !== null) {
      renderNotifications(state.notificationBase);
    }
  } else {
    state.pendingEnrollmentRequestCount = 0;
  }
}

function updateDashboardCategoryOptions(categories = []) {
  if (!dashboardCategory) return;

  const previous = state.dashboardCategoryId || '';
  const availableIds = new Set(categories.map((category) => category._id || category.id));

  dashboardCategory.innerHTML = '';

  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'Todas las categorías';
  dashboardCategory.appendChild(allOption);

  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category._id || category.id;
    option.textContent = category.name;
    dashboardCategory.appendChild(option);
  });

  let nextValue = previous && availableIds.has(previous) ? previous : '';
  if (!nextValue && categories.length) {
    nextValue = categories[0]._id || categories[0].id || '';
  }
  dashboardCategory.value = nextValue;
  state.dashboardCategoryId = nextValue;
}

function updateMatchesCategoryOptions(categories = []) {
  if (!matchesCategorySelect) return;

  const previous = state.matchesCategoryId || '';
  const availableIds = new Set(categories.map((category) => category._id || category.id));

  matchesCategorySelect.innerHTML = '';

  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'Todas las categorías';
  matchesCategorySelect.appendChild(allOption);

  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category._id || category.id;
    option.textContent = category.name;
    matchesCategorySelect.appendChild(option);
  });

  let nextValue = previous && availableIds.has(previous) ? previous : '';
  if (!nextValue) {
    nextValue = state.dashboardCategoryId || categories[0]?._id || categories[0]?.id || '';
  }

  matchesCategorySelect.value = nextValue;
  state.matchesCategoryId = nextValue;
}

function getPodiumEmoji(positionIndex) {
  switch (positionIndex) {
    case 0:
      return '🥇';
    case 1:
      return '🥈';
    case 2:
      return '🥉';
    default:
      return '';
  }
}

function renderDashboardRankingList(ranking = []) {
  if (!dashboardRankingList) return;

  dashboardRankingList.innerHTML = '';

  if (!ranking.length) {
    dashboardRankingList.innerHTML = '<li class="empty-state">Aún no hay posiciones registradas.</li>';
    return;
  }

  ranking.forEach((entry, index) => {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    const podiumEmoji = getPodiumEmoji(index);
    const titlePrefix = podiumEmoji ? `${index + 1}. ${podiumEmoji} ` : `${index + 1}. `;
    title.textContent = `${titlePrefix}${entry.player?.fullName || 'Jugador'}`;
    item.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.appendChild(document.createElement('span')).textContent = `${entry.points ?? 0} pts`;
    meta.appendChild(document.createElement('span')).textContent = `${entry.matchesPlayed ?? 0} jugados`;
    meta.appendChild(document.createElement('span')).textContent = `${entry.wins ?? 0} victorias`;
    meta.appendChild(document.createElement('span')).textContent = `${entry.gamesWon ?? 0} juegos ganados`;
    const movementBadge = createMovementBadge(entry);
    if (movementBadge) {
      movementBadge.classList.add('meta-movement');
      meta.appendChild(movementBadge);
    }
    item.appendChild(meta);

    dashboardRankingList.appendChild(item);
  });
}

function renderDashboardMatchesList(matches = []) {
  if (!dashboardUpcomingList) return;

  dashboardUpcomingList.innerHTML = '';

  if (!matches.length) {
    dashboardUpcomingList.innerHTML = '<li class="empty-state">No hay partidos programados.</li>';
    return;
  }

  matches.forEach((match) => {
    const item = document.createElement('li');
    const players = Array.isArray(match.players)
      ? match.players.map((player) => player.fullName).filter(Boolean)
      : [];
    const categoryColor = match.category ? getCategoryColor(match.category) : '';

    const title = document.createElement('strong');
    title.textContent = players.length ? players.join(' vs ') : 'Partido pendiente';
    if (categoryColor) {
      const indicator = createCategoryColorIndicator(categoryColor, match.category?.name);
      if (indicator) {
        title.classList.add('with-category-color');
        title.prepend(indicator);
      }
    }
    item.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.appendChild(document.createElement('span')).textContent = formatDate(match.scheduledAt);
    meta.appendChild(document.createElement('span')).textContent = match.court
      ? `Pista ${match.court}`
      : 'Pista por confirmar';
    item.appendChild(meta);

    if (match.category?.name) {
      const category = document.createElement('div');
      category.className = 'meta';
      category.appendChild(document.createElement('span')).textContent = 'Categoría';
      const categoryTag = document.createElement('span');
      categoryTag.className = 'tag match-category-tag';
      categoryTag.textContent = match.category.name;
      applyCategoryTagColor(categoryTag, categoryColor);
      category.appendChild(categoryTag);
      item.appendChild(category);
    }

    if (categoryColor) {
      applyCategoryColorStyles(item, categoryColor, { shadowAlpha: 0.16 });
    }

    dashboardUpcomingList.appendChild(item);
  });
}

function renderDashboardNotificationsList(notifications = []) {
  if (!dashboardNotificationsList) return;

  dashboardNotificationsList.innerHTML = '';

  const baseList = Array.isArray(notifications) ? [...notifications] : [];
  let items = baseList;
  if (isAdmin()) {
    const { alerts } = collectEnrollmentRequestAlerts();
    const mappedAlerts = alerts.map((alert) => ({
      ...alert,
      title:
        alert.title || `Solicitudes de inscripción · ${alert.categoryName || 'Categoría'}`,
      message:
        alert.message ||
        (alert.pendingCount === 1
          ? `Hay 1 solicitud pendiente para ${alert.categoryName || 'esta categoría'}.`
          : `Hay ${alert.pendingCount} solicitudes pendientes para ${alert.categoryName || 'esta categoría'}.`),
    }));
    items = baseList.concat(mappedAlerts);
  }

  if (!items.length) {
    dashboardNotificationsList.innerHTML = '<li class="empty-state">No hay notificaciones pendientes.</li>';
    return;
  }

  items.forEach((notification) => {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = notification.title;
    item.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.appendChild(document.createElement('span')).textContent = formatDate(notification.scheduledFor);
    meta.appendChild(document.createElement('span')).textContent = (notification.channel || 'app').toUpperCase();
    item.appendChild(meta);

    if (notification.message) {
      const description = document.createElement('p');
      description.textContent = notification.message;
      item.appendChild(description);
    }

    if (notification.match?.scheduledAt) {
      const info = document.createElement('div');
      info.className = 'meta';
      const parts = [formatDate(notification.match.scheduledAt)];
      parts.push(notification.match.court ? `Pista ${notification.match.court}` : 'Pista por confirmar');
      if (notification.match.category?.name) {
        parts.push(`Categoría ${notification.match.category.name}`);
      }
      info.textContent = parts.join(' · ');
      item.appendChild(info);
    }

    dashboardNotificationsList.appendChild(item);
  });
}

function normalizeId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value._id) return value._id.toString();
    if (value.id) return value.id.toString();
  }
  return '';
}

function extractScoreMap(rawScores) {
  if (!rawScores) return new Map();
  if (typeof rawScores.get === 'function') {
    return new Map(rawScores);
  }
  if (typeof rawScores === 'object') {
    return new Map(
      Object.entries(rawScores).map(([key, value]) => {
        const numeric = Number(value);
        return [key, Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0];
      })
    );
  }
  return new Map();
}

function extractResultSets(match) {
  const players = Array.isArray(match?.players) ? match.players : [];
  const playerIds = players.map((player) => normalizeId(player));
  const rawSets = Array.isArray(match?.result?.sets) ? match.result.sets : [];

  return rawSets
    .map((set, index) => {
      const number = Number.isFinite(Number(set?.number)) ? Number(set.number) : index + 1;
      const tieBreak = Boolean(set?.tieBreak) && number === 3;
      const scoresMap = extractScoreMap(set?.scores);
      const scores = {};
      playerIds.forEach((playerId) => {
        const value = Number(scoresMap.get(playerId));
        scores[playerId] = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
      });
      const total = Object.values(scores).reduce((acc, value) => acc + value, 0);
      if (total === 0) {
        return null;
      }
      return { number, tieBreak, scores };
    })
    .filter(Boolean);
}

function aggregateSetsForPlayers(sets, playerIds = []) {
  if (!Array.isArray(sets) || !sets.length) {
    return null;
  }
  const totals = {};
  playerIds.forEach((playerId) => {
    totals[playerId] = 0;
  });
  sets.forEach((set) => {
    playerIds.forEach((playerId) => {
      const value = Number(set.scores?.[playerId]);
      if (Number.isFinite(value)) {
        totals[playerId] += Math.max(0, value);
      }
    });
  });
  return totals;
}

function getMatchSets(match) {
  const sets = extractResultSets(match);
  const players = Array.isArray(match?.players) ? match.players : [];
  const playerIds = players.map((player) => normalizeId(player));
  if (!sets.length || playerIds.length < 2) {
    return [];
  }

  return sets.map((set) => {
    const normalizedScores = {};
    playerIds.forEach((playerId) => {
      const value = Number(set.scores?.[playerId]);
      normalizedScores[playerId] = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
    });
    return {
      number: set.number,
      tieBreak: Boolean(set.tieBreak) && set.number === 3,
      scores: normalizedScores,
    };
  });
}

function getMatchScores(match) {
  const players = Array.isArray(match?.players) ? match.players : [];
  const playerIds = players.map((player) => normalizeId(player));
  const sets = getMatchSets(match);
  let scoreMap;

  if (sets.length) {
    const totals = aggregateSetsForPlayers(sets, playerIds) || {};
    scoreMap = new Map(Object.entries(totals));
  } else {
    scoreMap = extractScoreMap(match?.result?.scores);
  }

  return players.map((player) => {
    const id = normalizeId(player);
    const games = Number(scoreMap.get(id)) || 0;
    return {
      id,
      games,
      player,
    };
  });
}

function resolveWinnerId(match) {
  const winner = match?.result?.winner;
  if (!winner) {
    return '';
  }

  if (typeof winner === 'string') {
    return winner;
  }

  if (typeof winner === 'object') {
    return normalizeId(winner);
  }

  return '';
}

function createResultScoreboard(match) {
  const sets = getMatchSets(match);
  const participants = getMatchScores(match);

  if (!sets.length || participants.length < 2) {
    return null;
  }

  const scoreboard = document.createElement('div');
  scoreboard.className = 'result-scoreboard';
  scoreboard.setAttribute('role', 'table');
  scoreboard.setAttribute('aria-label', 'Marcador por sets');
  scoreboard.style.setProperty('--sets-count', Math.max(sets.length, 1));

  const winnerId = resolveWinnerId(match);

  participants.forEach((participant) => {
    const row = document.createElement('div');
    row.className = 'result-scoreboard__row';
    row.setAttribute('role', 'row');

    if (participant.id && participant.id === winnerId) {
      row.classList.add('result-scoreboard__row--winner');
    }

    const nameCell = document.createElement('span');
    nameCell.className = 'result-scoreboard__cell result-scoreboard__cell--player';
    nameCell.setAttribute('role', 'rowheader');
    const playerName =
      typeof participant.player === 'object'
        ? participant.player.fullName || participant.player.email || 'Jugador'
        : 'Jugador';
    nameCell.textContent = playerName;
    row.appendChild(nameCell);

    sets.forEach((set, index) => {
      const scoreCell = document.createElement('span');
      scoreCell.className = 'result-scoreboard__cell result-scoreboard__cell--score';
      scoreCell.setAttribute('role', 'cell');

      const scoreValue = Number(set.scores?.[participant.id]);
      const displayValue = Number.isFinite(scoreValue) && scoreValue >= 0 ? Math.floor(scoreValue) : '';
      scoreCell.textContent = displayValue;

      if (set.tieBreak) {
        scoreCell.classList.add('result-scoreboard__cell--tiebreak');
        scoreCell.setAttribute('aria-label', `Super tie-break set ${index + 1}: ${displayValue}`);
      }

      row.appendChild(scoreCell);
    });

    scoreboard.appendChild(row);
  });

  return scoreboard;
}

function formatMatchScore(match) {
  const sets = getMatchSets(match);
  const participants = getMatchScores(match);
  if (sets.length >= 1 && participants.length >= 2) {
    const [first, second] = participants;
    const setLabels = sets.map((set) => {
      const firstScore = set.scores?.[first.id] ?? 0;
      const secondScore = set.scores?.[second.id] ?? 0;
      const base = `${firstScore}-${secondScore}`;
      return set.tieBreak ? `[${base}]` : base;
    });
    return `Marcador: ${setLabels.join(', ')}`;
  }

  const scores = participants;
  if (!scores.length) {
    return '';
  }

  return scores
    .map(({ player, games }) => {
      const name = typeof player === 'object' ? player.fullName || player.email || 'Jugador' : 'Jugador';
      return `${name}: ${games} juego${games === 1 ? '' : 's'}`;
    })
    .join(' · ');
}

function getResultConfirmation(match, userId) {
  if (!match?.result?.confirmations || !userId) return null;
  const confirmations = match.result.confirmations;
  if (typeof confirmations.get === 'function') {
    return confirmations.get(userId) || null;
  }
  if (typeof confirmations === 'object') {
    return confirmations[userId] || null;
  }
  return null;
}

function buildCalendarDataset(matches = []) {
  const scheduled = [];
  const unscheduled = [];

  matches.forEach((match) => {
    if (match.scheduledAt) {
      scheduled.push(match);
    } else {
      unscheduled.push(match);
    }
  });

  scheduled.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const grouped = new Map();
  scheduled.forEach((match) => {
    const key = startOfDay(new Date(match.scheduledAt)).getTime();
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(match);
  });

  return { grouped, unscheduled };
}

function openCalendarMatch(matchId) {
  if (!matchId) return;
  if (isAdmin()) {
    openMatchModal(matchId);
  } else {
    openResultModal(matchId);
  }
}

function bindCalendarEvent(element, matchId) {
  if (!element || !matchId) return;
  element.dataset.matchId = matchId;
  element.tabIndex = 0;
  element.setAttribute('role', 'button');
  element.classList.add('calendar-event--actionable');
  element.addEventListener('click', () => {
    openCalendarMatch(matchId);
  });
  element.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openCalendarMatch(matchId);
    }
  });
}

function createCalendarEvent(match) {
  const container = document.createElement('div');
  container.className = `calendar-event ${match.status === 'programado' ? 'confirmed' : 'pending'}`;
  const categoryColor = match.category ? getCategoryColor(match.category) : '';

  const title = document.createElement('strong');
  const players = Array.isArray(match.players)
    ? match.players.map((player) => player.fullName || 'Jugador').join(' vs ')
    : 'Partido';
  title.textContent = players;
  if (categoryColor) {
    const indicator = createCategoryColorIndicator(categoryColor, match.category?.name);
    if (indicator) {
      title.classList.add('with-category-color');
      title.prepend(indicator);
    }
  }
  container.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.appendChild(document.createElement('span')).textContent = formatTime(match.scheduledAt);
  if (match.court) {
    meta.appendChild(document.createElement('span')).textContent = `Pista ${match.court}`;
  }
  const statusTag = document.createElement('span');
  statusTag.className = `tag status-${match.status}`;
  statusTag.textContent = STATUS_LABELS[match.status] || match.status;
  meta.appendChild(statusTag);
  container.appendChild(meta);

  if (match.category?.name) {
    const category = document.createElement('div');
    category.className = 'meta';
    const categoryTag = document.createElement('span');
    categoryTag.className = 'tag match-category-tag';
    categoryTag.textContent = match.category.name;
    applyCategoryTagColor(categoryTag, categoryColor, { backgroundAlpha: 0.22 });
    category.appendChild(categoryTag);
    container.appendChild(category);
  }

  if (categoryColor) {
    applyCategoryColorStyles(container, categoryColor, { backgroundAlpha: 0.18, borderAlpha: 0.32 });
  }

  const matchId = normalizeId(match);
  if (matchId) {
    bindCalendarEvent(container, matchId);
  }

  return container;
}

function renderUnscheduledMatches(matches = [], container = calendarContainer) {
  if (!matches.length || !container) return;

  const block = document.createElement('div');
  block.className = 'calendar-day';
  const header = document.createElement('div');
  header.className = 'calendar-day-header';
  header.innerHTML = '<strong>Sin fecha asignada</strong><span>Pendientes de confirmar</span>';
  block.appendChild(header);

  matches.forEach((match) => {
    const event = document.createElement('div');
    event.className = 'calendar-event pending';
    const categoryColor = match.category ? getCategoryColor(match.category) : '';
    const title = document.createElement('strong');
    const players = Array.isArray(match.players)
      ? match.players.map((player) => player.fullName || 'Jugador').join(' vs ')
      : 'Partido';
    title.textContent = players;
    if (categoryColor) {
      const indicator = createCategoryColorIndicator(categoryColor, match.category?.name);
      if (indicator) {
        title.classList.add('with-category-color');
        title.prepend(indicator);
      }
    }
    event.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';
    if (match.category?.name) {
      const categoryTag = document.createElement('span');
      categoryTag.className = 'tag match-category-tag';
      categoryTag.textContent = match.category.name;
      applyCategoryTagColor(categoryTag, categoryColor, { backgroundAlpha: 0.22 });
      meta.appendChild(categoryTag);
    } else {
      meta.textContent = 'Categoría por confirmar';
    }
    event.appendChild(meta);

    const matchId = normalizeId(match);
    if (matchId) {
      bindCalendarEvent(event, matchId);
    }

    if (categoryColor) {
      applyCategoryColorStyles(event, categoryColor, { backgroundAlpha: 0.18, borderAlpha: 0.32 });
    }

    block.appendChild(event);
  });

  container.appendChild(block);
}

function renderCalendarView({
  container,
  labelElement,
  referenceDate,
  matches,
  includeUnscheduled = false,
}) {
  if (!container) return;

  const reference = referenceDate instanceof Date ? new Date(referenceDate) : new Date();
  const list = Array.isArray(matches) ? matches : [];
  const { grouped, unscheduled } = buildCalendarDataset(list);
  container.innerHTML = '';

  const monthReference = new Date(reference.getFullYear(), reference.getMonth(), 1);

  if (labelElement) {
    labelElement.textContent = formatMonthLabel(monthReference);
  }

  let cursor = startOfWeek(monthReference);
  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const weekRow = document.createElement('div');
    weekRow.className = 'calendar-week';

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const day = addDays(cursor, dayIndex);
      const key = startOfDay(day).getTime();
      const events = grouped.get(key) || [];
      const column = document.createElement('div');
      column.className = 'calendar-day';
      if (day.getMonth() !== monthReference.getMonth()) {
        column.classList.add('calendar-day--muted');
      }

      const header = document.createElement('div');
      header.className = 'calendar-day-header';
      header.innerHTML = `<strong>${day.getDate()}</strong><span>${new Intl.DateTimeFormat('es-ES', {
        weekday: 'short',
      }).format(day)}</span>`;
      column.appendChild(header);

      if (!events.length) {
        const empty = document.createElement('div');
        empty.className = 'calendar-empty';
        empty.textContent = '—';
        column.appendChild(empty);
      } else {
        events.forEach((match) => {
          column.appendChild(createCalendarEvent(match));
        });
      }

      weekRow.appendChild(column);
    }

    container.appendChild(weekRow);
    cursor = addDays(cursor, 7);
    if (cursor.getMonth() > monthReference.getMonth() && cursor.getDate() >= 7) {
      break;
    }
  }

  if (includeUnscheduled) {
    renderUnscheduledMatches(unscheduled, container);
  }
}

function renderCalendar() {
  if (!calendarContainer) return;

  const matches = Array.isArray(state.calendarMatches) ? state.calendarMatches : [];
  const categoryId = state.dashboardCategoryId;
  const filtered = matches.filter((match) => {
    if (!categoryId) return true;
    const matchCategoryId = normalizeId(match.category);
    return matchCategoryId ? matchCategoryId === categoryId : false;
  });

  renderCalendarView({
    container: calendarContainer,
    labelElement: calendarLabel,
    referenceDate: state.calendarDate,
    matches: filtered,
    includeUnscheduled: true,
  });
}

function getConfirmedCalendarMatches() {
  return (Array.isArray(state.calendarMatches) ? state.calendarMatches : []).filter(
    (match) => match.status === 'programado' && match.scheduledAt
  );
}

function renderGlobalCalendar() {
  if (!globalCalendarContainer) return;

  const confirmedMatches = getConfirmedCalendarMatches();
  renderCalendarView({
    container: globalCalendarContainer,
    labelElement: globalCalendarLabel,
    referenceDate: state.globalCalendarDate,
    matches: confirmedMatches,
  });
}

function renderAllCalendars() {
  renderCalendar();
  renderGlobalCalendar();
}

function shiftCalendar(step) {
  const reference = new Date(state.calendarDate);
  state.calendarDate = new Date(reference.getFullYear(), reference.getMonth() + step, 1);
  renderCalendar();
}

function shiftGlobalCalendar(step) {
  const reference = new Date(state.globalCalendarDate);
  state.globalCalendarDate = new Date(reference.getFullYear(), reference.getMonth() + step, 1);
  renderGlobalCalendar();
}

function renderDashboardSummary(summary) {
  state.dashboardSummary = summary || null;

  if (dashboardCategory && summary?.category?.id) {
    const categoryId = summary.category.id;
    if (dashboardCategory.value !== categoryId) {
      dashboardCategory.value = categoryId;
    }
    state.dashboardCategoryId = categoryId;
    if (matchesCategorySelect && matchesCategorySelect.value !== categoryId) {
      matchesCategorySelect.value = categoryId;
      matchesCategorySelect.dispatchEvent(new Event('change'));
    } else if (!state.matchesCategoryId) {
      state.matchesCategoryId = categoryId;
    }
  }

  const metrics = summary?.metrics || {};
  if (metricPlayers) {
    metricPlayers.textContent = String(metrics.players ?? 0);
  }
  if (metricUpcoming) {
    metricUpcoming.textContent = String(metrics.upcomingMatches ?? 0);
  }
  updateNotificationCounts(metrics.pendingNotifications ?? 0);
  if (metricCategoriesWrapper) {
    const hasMetric = typeof metrics.categories === 'number';
    metricCategoriesWrapper.hidden = !hasMetric;
    if (hasMetric && metricCategories) {
      metricCategories.textContent = String(metrics.categories ?? 0);
    }
  }

  renderDashboardRankingList(summary?.ranking || []);
  renderDashboardMatchesList(summary?.upcomingMatches || []);
  renderDashboardNotificationsList(summary?.notifications || []);
  renderAllCalendars();
}

async function loadDashboardSummary(categoryId = '') {
  if (!state.token) return;

  try {
    const query = categoryId ? `?categoryId=${categoryId}` : '';
    const summary = await request(`/dashboard/summary${query}`);
    renderDashboardSummary(summary);
  } catch (error) {
    renderDashboardSummary(null);
    if (dashboardRankingList) {
      dashboardRankingList.innerHTML = `<li class="empty-state">${error.message}</li>`;
    }
    if (dashboardUpcomingList) {
      dashboardUpcomingList.innerHTML = `<li class="empty-state">${error.message}</li>`;
    }
    if (dashboardNotificationsList) {
      dashboardNotificationsList.innerHTML = `<li class="empty-state">${error.message}</li>`;
    }
    if (metricPlayers) {
      metricPlayers.textContent = '0';
    }
    if (metricUpcoming) {
      metricUpcoming.textContent = '0';
    }
    updateNotificationCounts(0);
    if (metricCategoriesWrapper) {
      metricCategoriesWrapper.hidden = false;
    }
    showGlobalMessage(error.message, 'error');
    renderAllCalendars();
  }
}

function renderMatches(matches = [], container, emptyMessage) {
  if (!container) return;
  container.innerHTML = '';
  if (!matches.length) {
    container.innerHTML = `<li class="empty-state">${emptyMessage}</li>`;
    return;
  }

  matches.forEach((match) => {
    const item = document.createElement('li');
    const matchId = match._id || match.id;
    if (matchId) {
      item.dataset.matchId = matchId;
    }
    const categoryColor = match.category ? getCategoryColor(match.category) : '';
    const title = document.createElement('strong');
    const players = Array.isArray(match.players)
      ? match.players.map((player) => player.fullName || 'Jugador').join(' vs ')
      : 'Jugadores por definir';
    title.textContent = players;
    if (categoryColor) {
      const indicator = createCategoryColorIndicator(categoryColor, match.category?.name);
      if (indicator) {
        title.classList.add('with-category-color');
        title.prepend(indicator);
      }
    }
    item.appendChild(title);

    const metaPrimary = document.createElement('div');
    metaPrimary.className = 'meta';
    metaPrimary.appendChild(document.createElement('span')).textContent = formatDate(match.scheduledAt);
    if (match.court) {
      metaPrimary.appendChild(document.createElement('span')).textContent = `Pista ${match.court}`;
    }
    if (match.category?.name) {
      const tag = document.createElement('span');
      tag.className = 'tag match-category-tag';
      tag.textContent = match.category.name;
      applyCategoryTagColor(tag, categoryColor);
      metaPrimary.appendChild(tag);
    }
    item.appendChild(metaPrimary);

    if (categoryColor) {
      applyCategoryColorStyles(item, categoryColor, { shadowAlpha: 0.18 });
    }

    if (match.status === 'pendiente' || match.status === 'propuesto') {
      const warningMessage = getExpirationWarningMessage(match);
      if (warningMessage) {
        const warning = document.createElement('p');
        warning.className = 'deadline-warning';
        warning.textContent = warningMessage;
        item.appendChild(warning);
      }
    } else if (match.status === 'caducado') {
      const deadlineDate = getMatchExpirationDate(match);
      const deadlineLabel = formatExpirationDeadline(deadlineDate);
      const warning = document.createElement('p');
      warning.className = 'deadline-warning deadline-warning--expired';
      warning.textContent = deadlineLabel
        ? `El plazo venció el ${deadlineLabel}. El partido caducó sin puntos.`
        : 'El plazo venció. El partido caducó sin puntos.';
      item.appendChild(warning);
    }

    if (match.status === 'revision' || match.result?.status === 'en_revision') {
      const pending = document.createElement('div');
      pending.className = 'meta warning';
      pending.textContent = 'Resultado pendiente de validación.';
      item.appendChild(pending);
    }

    if (match.result?.status === 'confirmado' || match.status === 'completado') {
      const resultSummary = document.createElement('div');
      resultSummary.className = 'meta result-meta';
      const winner = match.result?.winner;
      let winnerName = '';
      if (winner) {
        if (typeof winner === 'object') {
          winnerName = winner.fullName || winner.email || 'Ganador';
        } else if (typeof winner === 'string') {
          const participant = Array.isArray(match.players)
            ? match.players.find((player) => normalizeId(player) === winner)
            : null;
          winnerName = participant?.fullName || participant?.email || 'Ganador';
        }
      }

      if (winnerName) {
        resultSummary.appendChild(document.createElement('span')).textContent = `Ganador: ${winnerName}`;
      }

      const scoreboard = createResultScoreboard(match);
      const scoreLabel = formatMatchScore(match);

      if (!scoreboard && scoreLabel) {
        resultSummary.appendChild(document.createElement('span')).textContent = scoreLabel;
      }

      if (resultSummary.childNodes.length) {
        item.appendChild(resultSummary);
      }

      if (scoreboard) {
        item.appendChild(scoreboard);
      }
    } else if (match.result?.status === 'rechazado') {
      const rejected = document.createElement('div');
      rejected.className = 'meta warning';
      rejected.textContent = 'El último resultado fue rechazado.';
      item.appendChild(rejected);
    }

    const isResultManagementList =
      container === pendingApprovalsList || container === completedMatchesList;

    if (isAdmin()) {
      const actions = document.createElement('div');
      actions.className = 'actions';
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'secondary';
      if (matchId) {
        editButton.dataset.matchId = matchId;
      }
      if (isResultManagementList) {
        editButton.dataset.action = 'edit-result';
        editButton.textContent =
          match.status === 'revision' || match.result?.status === 'en_revision'
            ? 'Revisar resultado'
            : 'Editar resultado';
      } else {
        editButton.dataset.action = 'edit-match';
        editButton.textContent = 'Editar';
      }
      actions.appendChild(editButton);

      if (!isResultManagementList && matchId && match.status !== 'completado') {
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'danger';
        deleteButton.dataset.matchId = matchId;
        deleteButton.dataset.action = 'delete-match';
        deleteButton.textContent = 'Eliminar';
        actions.appendChild(deleteButton);

        const resultButton = document.createElement('button');
        resultButton.type = 'button';
        resultButton.className = 'primary';
        resultButton.dataset.matchId = matchId;
        resultButton.dataset.action = 'report-result';
        resultButton.textContent =
          match.status === 'revision' || match.result?.status === 'en_revision'
            ? 'Revisar resultado'
            : 'Registrar resultado';
        actions.appendChild(resultButton);
      }
      item.appendChild(actions);
    }

    container.appendChild(item);
  });
}

function filterMatchesByCategory(matches = []) {
  const categoryId = state.matchesCategoryId;
  if (!categoryId) {
    return matches;
  }
  return matches.filter((match) => normalizeId(match.category) === categoryId);
}

function closeProposalForm() {
  if (activeProposalForm) {
    activeProposalForm.remove();
  }
  activeProposalForm = null;
  activeProposalMatchId = null;
}

function openProposalForm(matchId, triggerButton) {
  if (!matchId) {
    return;
  }

  if (activeProposalForm && activeProposalMatchId === matchId) {
    closeProposalForm();
    return;
  }

  closeProposalForm();

  const listItem = triggerButton?.closest('li[data-match-id]');
  if (!listItem) {
    showGlobalMessage('No se pudo abrir el formulario de propuesta.', 'error');
    return;
  }

  const courtNames = getClubCourtNames();

  const courtOptions = courtNames
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join('');

  const form = document.createElement('form');
  form.className = 'proposal-form';

  const dateInputId = `proposal-${matchId}-datetime`;
  const courtInputId = `proposal-${matchId}-court`;
  const messageInputId = `proposal-${matchId}-message`;

  const courtFieldMarkup = courtNames.length
    ? `
    <div class="proposal-form__field">
      <label for="${courtInputId}">Pista (opcional)</label>
      <select id="${courtInputId}" name="court">
        <option value="">Por definir</option>
        ${courtOptions}
      </select>
      <span class="form-hint">Las pistas disponibles se gestionan en el perfil del club.</span>
    </div>
  `
    : `
    <div class="proposal-form__field">
      <label for="${courtInputId}">Pista (opcional)</label>
      <input type="text" id="${courtInputId}" name="court" placeholder="Añade pistas en la sección del club" disabled />
      <span class="form-hint">Añade pistas en la sección del club para poder asignarlas.</span>
    </div>
  `;

  form.innerHTML = `
    <h4>Proponer fecha y hora</h4>
    <div class="proposal-form__field">
      <label for="${dateInputId}">Fecha y hora</label>
      <input type="datetime-local" id="${dateInputId}" name="proposedFor" required step="${CALENDAR_TIME_SLOT_STEP_SECONDS}" />
    </div>
    ${courtFieldMarkup}
    <div class="proposal-form__field">
      <label for="${messageInputId}">Mensaje (opcional)</label>
      <textarea id="${messageInputId}" name="message" rows="3" placeholder="Mensaje para tu oponente"></textarea>
    </div>
    <p class="proposal-form__error" hidden></p>
    <div class="proposal-form__actions">
      <button type="submit" class="primary">Enviar propuesta</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
    </div>
  `;

  const proposedInput = form.querySelector('input[name="proposedFor"]');
  const courtInput = form.querySelector('[name="court"]');
  const messageInput = form.querySelector('textarea[name="message"]');
  const cancelButton = form.querySelector('button[data-action="cancel"]');
  const submitButton = form.querySelector('button[type="submit"]');
  const errorMessage = form.querySelector('.proposal-form__error');

  const updateError = (message = '') => {
    if (!errorMessage) return;
    errorMessage.textContent = message;
    errorMessage.hidden = !message;
  };

  const now = new Date();
  const minDateValue = roundDateUpToInterval(now, CALENDAR_TIME_SLOT_MINUTES);
  const defaultDateValue = roundDateUpToInterval(
    new Date(minDateValue.getTime() + 2 * 60 * 60 * 1000),
    CALENDAR_TIME_SLOT_MINUTES
  );
  if (proposedInput) {
    proposedInput.step = String(CALENDAR_TIME_SLOT_STEP_SECONDS);
  }
  if (proposedInput && !Number.isNaN(defaultDateValue.getTime())) {
    proposedInput.value = formatDateTimeLocal(defaultDateValue);
  }
  if (proposedInput && !Number.isNaN(minDateValue.getTime())) {
    proposedInput.min = formatDateTimeLocal(minDateValue);
  }

  cancelButton?.addEventListener('click', (event) => {
    event.preventDefault();
    closeProposalForm();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    updateError();

    if (!proposedInput) {
      updateError('Indica la fecha y hora de la propuesta.');
      return;
    }

    const proposedValue = proposedInput.value;
    if (!proposedValue) {
      updateError('Indica la fecha y hora de la propuesta.');
      proposedInput.focus();
      return;
    }

    const proposedDate = new Date(proposedValue);
    if (Number.isNaN(proposedDate.getTime())) {
      updateError('La fecha indicada no es válida.');
      proposedInput.focus();
      return;
    }

    const messageValue = messageInput?.value.trim();
    const courtValue = (() => {
      if (!courtInput) return '';
      if (courtInput.tagName === 'SELECT') {
        return courtInput.value;
      }
      const rawValue = courtInput.value || '';
      return rawValue.trim();
    })();

    if (submitButton) submitButton.disabled = true;
    if (cancelButton) cancelButton.disabled = true;

    try {
      await request(`/matches/${matchId}/propose`, {
        method: 'POST',
        body: {
          proposedFor: proposedDate.toISOString(),
          message: messageValue ? messageValue : undefined,
          court: courtValue ? courtValue : undefined,
        },
      });
      showGlobalMessage('Se envió la propuesta de partido.', 'info');
      closeProposalForm();
      await loadAllData();
    } catch (error) {
      showGlobalMessage(error.message, 'error');
    } finally {
      if (submitButton) submitButton.disabled = false;
      if (cancelButton) cancelButton.disabled = false;
    }
  });

  form.addEventListener('input', () => {
    updateError();
  });

  activeProposalForm = form;
  activeProposalMatchId = matchId;

  listItem.appendChild(form);
  proposedInput?.focus();
}

function renderMyMatches(matches = []) {
  const hadActiveProposalForm = Boolean(activeProposalForm);
  let proposalFormAttached = false;

  const pendingCount = Array.isArray(matches)
    ? matches.filter((match) => match?.status === 'pendiente').length
    : 0;
  updateMatchesMenuBadge(pendingCount);

  myMatchesList.innerHTML = '';

  if (!matches.length) {
    myMatchesList.innerHTML = '<li class="empty-state">No tienes partidos asignados.</li>';
    if (hadActiveProposalForm) {
      closeProposalForm();
    }
    return;
  }

  const currentUserId = state.user?.id || state.user?._id || '';

  matches.forEach((match) => {
    const matchId = match._id || match.id;
    const item = document.createElement('li');
    item.dataset.matchId = matchId;
    const categoryColor = match.category ? getCategoryColor(match.category) : '';

    const title = document.createElement('strong');
    const players = Array.isArray(match.players)
      ? match.players.map((player) => player.fullName || 'Jugador').join(' vs ')
      : 'Jugadores por definir';
    title.textContent = players;
    if (categoryColor) {
      const indicator = createCategoryColorIndicator(categoryColor, match.category?.name);
      if (indicator) {
        title.classList.add('with-category-color');
        title.prepend(indicator);
      }
    }
    item.appendChild(title);

    const statusRow = document.createElement('div');
    statusRow.className = 'meta';
    const statusTag = document.createElement('span');
    statusTag.className = `tag status-${match.status}`;
    statusTag.textContent = STATUS_LABELS[match.status] || match.status;
    statusRow.appendChild(statusTag);
    if (match.category?.name) {
      const categoryTag = document.createElement('span');
      categoryTag.className = 'tag match-category-tag';
      categoryTag.textContent = match.category.name;
      applyCategoryTagColor(categoryTag, categoryColor);
      statusRow.appendChild(categoryTag);
    }
    item.appendChild(statusRow);

    if (categoryColor) {
      applyCategoryColorStyles(item, categoryColor, { shadowAlpha: 0.18 });
    }

    const detailRow = document.createElement('div');
    detailRow.className = 'meta';

    const resultStatus = match.result?.status || '';
    const isExpired = match.status === 'caducado';

    if (match.status === 'programado') {
      detailRow.appendChild(document.createElement('span')).textContent = formatDate(match.scheduledAt);
      if (match.court) {
        detailRow.appendChild(document.createElement('span')).textContent = `Pista ${match.court}`;
      }
    } else if (match.status === 'propuesto' && match.proposal) {
      const proposer = match.proposal.requestedBy?.fullName || 'Un jugador';
      detailRow.appendChild(document.createElement('span')).textContent = `${proposer} propuso ${formatDate(
        match.proposal.proposedFor
      )}`;
      if (match.court) {
        detailRow.appendChild(document.createElement('span')).textContent = `Pista sugerida: ${match.court}`;
      }
    } else if (match.status === 'pendiente') {
      detailRow.appendChild(document.createElement('span')).textContent =
        'A la espera de que alguien proponga fecha y hora.';
    } else if (match.status === 'caducado') {
      detailRow.appendChild(document.createElement('span')).textContent =
        'El plazo de 15 días expiró y el partido no otorgó puntos.';
    } else if (match.status === 'revision' || resultStatus === 'en_revision') {
      detailRow.appendChild(document.createElement('span')).textContent =
        'Resultado pendiente de confirmación.';
    } else if (match.status === 'completado' || resultStatus === 'confirmado') {
      detailRow.appendChild(document.createElement('span')).textContent = 'Resultado registrado.';
    }

    if (match.proposal?.message) {
      const proposalMessage = document.createElement('p');
      proposalMessage.className = 'proposal-message';
      proposalMessage.textContent = `Mensaje: ${match.proposal.message}`;
      item.appendChild(proposalMessage);
    }

    if (detailRow.childNodes.length) {
      item.appendChild(detailRow);
    }

    if (!isExpired && (match.status === 'pendiente' || match.status === 'propuesto')) {
      const warningMessage = getExpirationWarningMessage(match);
      if (warningMessage) {
        const warning = document.createElement('p');
        warning.className = 'deadline-warning';
        warning.textContent = warningMessage;
        item.appendChild(warning);
      }
    } else if (isExpired) {
      const deadlineDate = getMatchExpirationDate(match);
      const deadlineLabel = formatExpirationDeadline(deadlineDate);
      const warning = document.createElement('p');
      warning.className = 'deadline-warning deadline-warning--expired';
      warning.textContent = deadlineLabel
        ? `El plazo para disputar el partido venció el ${deadlineLabel}. El partido caducó sin puntos.`
        : 'El plazo para disputar el partido venció. El partido caducó sin puntos.';
      item.appendChild(warning);
    }

    if (resultStatus === 'confirmado' || match.status === 'completado') {
      const resultSummary = document.createElement('div');
      resultSummary.className = 'meta result-meta';
      const winner = match.result?.winner;
      let winnerName = '';
      if (winner) {
        if (typeof winner === 'object') {
          winnerName = winner.fullName || winner.email || 'Ganador';
        } else if (typeof winner === 'string') {
          const participant = Array.isArray(match.players)
            ? match.players.find((player) => normalizeId(player) === winner)
            : null;
          winnerName = participant?.fullName || participant?.email || 'Ganador';
        }
      }

      if (winnerName) {
        resultSummary.appendChild(document.createElement('span')).textContent = `Ganador: ${winnerName}`;
      }

      const scoreboard = createResultScoreboard(match);
      const scoreLabel = formatMatchScore(match);

      if (!scoreboard && scoreLabel) {
        resultSummary.appendChild(document.createElement('span')).textContent = scoreLabel;
      }

      if (resultSummary.childNodes.length) {
        item.appendChild(resultSummary);
      }

      if (scoreboard) {
        item.appendChild(scoreboard);
      }
    } else if (resultStatus === 'rechazado') {
      const rejected = document.createElement('div');
      rejected.className = 'meta warning';
      rejected.textContent = 'El resultado enviado fue rechazado. Vuelve a registrarlo.';
      item.appendChild(rejected);
    }

    const actions = document.createElement('div');
    actions.className = 'actions';

    const canPropose = !isExpired && match.status === 'pendiente';
    if (canPropose) {
      const proposeButton = document.createElement('button');
      proposeButton.type = 'button';
      proposeButton.className = 'primary';
      proposeButton.dataset.action = 'propose';
      proposeButton.dataset.matchId = matchId;
      proposeButton.textContent = 'Proponer fecha';
      actions.appendChild(proposeButton);
    } else if (match.status === 'propuesto' && match.proposal) {
      if (match.proposal.requestedTo?._id === currentUserId || match.proposal.requestedTo === currentUserId) {
        const acceptButton = document.createElement('button');
        acceptButton.type = 'button';
        acceptButton.className = 'primary';
        acceptButton.dataset.action = 'respond';
        acceptButton.dataset.decision = 'accept';
        acceptButton.dataset.matchId = matchId;
        acceptButton.textContent = 'Aceptar propuesta';
        actions.appendChild(acceptButton);

        const rejectButton = document.createElement('button');
        rejectButton.type = 'button';
        rejectButton.className = 'ghost';
        rejectButton.dataset.action = 'respond';
        rejectButton.dataset.decision = 'reject';
        rejectButton.dataset.matchId = matchId;
        rejectButton.textContent = 'Rechazar';
        actions.appendChild(rejectButton);
      } else if (
        match.proposal.requestedBy?._id === currentUserId ||
        match.proposal.requestedBy === currentUserId
      ) {
        const waiting = document.createElement('p');
        waiting.className = 'meta';
        const opponentName = match.proposal.requestedTo?.fullName || 'el o la oponente';
        waiting.textContent = `Esperando confirmación de ${opponentName}.`;
        item.appendChild(waiting);
      }
    }

    const confirmation = getResultConfirmation(match, currentUserId);
    const needsConfirmation = resultStatus === 'en_revision' && confirmation?.status !== 'aprobado';
    const canReportResult = match.status !== 'completado' && !isExpired;

    if (canReportResult) {
      const reportButton = document.createElement('button');
      reportButton.type = 'button';
      reportButton.className = needsConfirmation ? 'secondary' : 'primary';
      reportButton.dataset.action = 'report-result';
      reportButton.dataset.matchId = matchId;
      reportButton.textContent = needsConfirmation ? 'Actualizar resultado' : 'Reportar resultado';
      actions.appendChild(reportButton);
    }

    if (needsConfirmation) {
      const approveButton = document.createElement('button');
      approveButton.type = 'button';
      approveButton.className = 'primary';
      approveButton.dataset.action = 'confirm-result';
      approveButton.dataset.matchId = matchId;
      approveButton.textContent = 'Confirmar resultado';
      actions.appendChild(approveButton);

      const rejectButton = document.createElement('button');
      rejectButton.type = 'button';
      rejectButton.className = 'ghost';
      rejectButton.dataset.action = 'reject-result';
      rejectButton.dataset.matchId = matchId;
      rejectButton.textContent = 'Rechazar';
      actions.appendChild(rejectButton);
    }

    if (isAdmin()) {
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'secondary';
      editButton.dataset.action = 'edit-match';
      editButton.dataset.matchId = matchId;
      editButton.textContent = 'Editar';
      actions.appendChild(editButton);

      if (match.status !== 'completado') {
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'danger';
        deleteButton.dataset.action = 'delete-match';
        deleteButton.dataset.matchId = matchId;
        deleteButton.textContent = 'Eliminar';
        actions.appendChild(deleteButton);
      }
    }

    if (actions.childNodes.length) {
      item.appendChild(actions);
    }

    if (activeProposalForm && activeProposalMatchId === matchId) {
      item.appendChild(activeProposalForm);
      proposalFormAttached = true;
    }

    myMatchesList.appendChild(item);
  });

  if (hadActiveProposalForm && !proposalFormAttached) {
    closeProposalForm();
  }
}

function renderNotifications(notifications = []) {
  const baseList = Array.isArray(notifications) ? [...notifications] : [];
  state.notificationBase = baseList;
  const combined = combineNotificationsWithEnrollmentRequests(baseList);
  state.notifications = combined;

  updateNotificationCounts(combined);
  notificationsList.innerHTML = '';
  if (!combined.length) {
    notificationsList.innerHTML = '<li class="empty-state">No tienes notificaciones pendientes.</li>';
    return;
  }

  combined.forEach((notification) => {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    const isEnrollmentAlert = notification.type === 'enrollment-request';
    title.textContent = isEnrollmentAlert
      ? notification.title || `Solicitudes de inscripción · ${notification.categoryName || 'Categoría'}`
      : notification.title;
    item.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.appendChild(document.createElement('span')).textContent = formatDate(notification.scheduledFor);
    meta.appendChild(document.createElement('span')).textContent = isEnrollmentAlert
      ? 'SOLICITUDES'
      : (notification.channel || 'app').toUpperCase();
    if (isEnrollmentAlert && Number(notification.pendingCount) > 0) {
      meta.appendChild(document.createElement('span')).textContent = `Pendientes: ${notification.pendingCount}`;
    }
    item.appendChild(meta);

    const messageText = notification.message;
    if (messageText) {
      const message = document.createElement('p');
      message.textContent = messageText;
      item.appendChild(message);
    }

    if (!isEnrollmentAlert && notification.match?.scheduledAt) {
      const info = document.createElement('div');
      info.className = 'meta';
      info.textContent = `Partido: ${formatDate(notification.match.scheduledAt)} · Pista ${
        notification.match.court || 'por confirmar'
      }`;
      item.appendChild(info);
    }

    if (isEnrollmentAlert) {
      if (notification.categoryId) {
        const actions = document.createElement('div');
        actions.className = 'actions';
        const reviewButton = document.createElement('button');
        reviewButton.type = 'button';
        reviewButton.className = 'primary';
        reviewButton.dataset.reviewCategory = notification.categoryId;
        reviewButton.textContent =
          Number(notification.pendingCount) === 1 ? 'Revisar solicitud' : 'Revisar solicitudes';
        actions.appendChild(reviewButton);
        item.appendChild(actions);
      }
      notificationsList.appendChild(item);
      return;
    }

    const notificationId = normalizeId(notification);
    if (notificationId) {
      const actions = document.createElement('div');
      actions.className = 'actions';
      const dismiss = document.createElement('button');
      dismiss.type = 'button';
      dismiss.className = 'secondary';
      dismiss.dataset.notificationId = notificationId;
      dismiss.textContent = 'Marcar como leída';
      actions.appendChild(dismiss);
      item.appendChild(actions);
    }

    notificationsList.appendChild(item);
  });
}

function normalizeWebsiteUrl(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return url.toString();
  } catch (error) {
    return trimmed;
  }
}

function normalizeDayLabel(label) {
  if (typeof label !== 'string') return '';
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const WEEKDAY_VALUE_BY_LABEL = WEEKDAY_OPTIONS.reduce((map, option) => {
  map[normalizeDayLabel(option.label)] = option.value;
  return map;
}, {});

function getDayValueFromLabel(label) {
  const normalized = normalizeDayLabel(label);
  return WEEKDAY_VALUE_BY_LABEL[normalized] || '';
}

function normalizeScheduleForEditor(entry = {}) {
  const label = typeof entry.label === 'string' ? entry.label.trim() : '';
  const opensAt = typeof entry.opensAt === 'string' ? entry.opensAt.trim() : '';
  const closesAt = typeof entry.closesAt === 'string' ? entry.closesAt.trim() : '';
  const dayValue = getDayValueFromLabel(label);

  if (dayValue) {
    return {
      dayValue,
      customLabel: '',
      opensAt,
      closesAt,
    };
  }

  return {
    dayValue: label ? 'custom' : '',
    customLabel: label,
    opensAt,
    closesAt,
  };
}

function createSchedulesEditor(initialSchedules = []) {
  const wrapper = document.createElement('div');
  wrapper.className = 'club-editor';

  const list = document.createElement('div');
  list.className = 'club-editor__list';

  const emptyState = document.createElement('p');
  emptyState.className = 'club-editor__empty';
  emptyState.textContent = 'No hay franjas horarias configuradas.';

  const footer = document.createElement('div');
  footer.className = 'club-editor__footer';

  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'secondary';
  addButton.textContent = 'Añadir franja horaria';
  footer.appendChild(addButton);

  wrapper.append(list, emptyState, footer);

  function updateEmptyState() {
    emptyState.hidden = list.children.length > 0;
  }

  function createScheduleItem(data = {}) {
    const item = document.createElement('div');
    item.className = 'club-editor__item';

    const firstRow = document.createElement('div');
    firstRow.className = 'form-grid';

    const dayLabel = document.createElement('label');
    dayLabel.textContent = 'Día';
    const daySelect = document.createElement('select');
    daySelect.className = 'club-schedule-day';
    daySelect.innerHTML = '<option value="">Selecciona un día</option>';
    WEEKDAY_OPTIONS.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      daySelect.appendChild(opt);
    });
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = 'Personalizado';
    daySelect.appendChild(customOption);
    dayLabel.appendChild(daySelect);

    const customLabel = document.createElement('label');
    customLabel.className = 'club-schedule-custom';
    customLabel.textContent = 'Nombre de la franja';
    const customInput = document.createElement('input');
    customInput.type = 'text';
    customInput.className = 'club-schedule-label';
    customInput.placeholder = 'Ej. Torneo interno';
    customLabel.appendChild(customInput);

    firstRow.append(dayLabel, customLabel);

    const secondRow = document.createElement('div');
    secondRow.className = 'form-grid';

    const opensLabel = document.createElement('label');
    opensLabel.textContent = 'Hora de apertura';
    const opensInput = document.createElement('input');
    opensInput.type = 'time';
    opensInput.className = 'club-schedule-opens';
    opensLabel.appendChild(opensInput);

    const closesLabel = document.createElement('label');
    closesLabel.textContent = 'Hora de cierre';
    const closesInput = document.createElement('input');
    closesInput.type = 'time';
    closesInput.className = 'club-schedule-closes';
    closesLabel.appendChild(closesInput);

    secondRow.append(opensLabel, closesLabel);

    const actions = document.createElement('div');
    actions.className = 'form-actions form-actions--inline';
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'ghost';
    removeButton.textContent = 'Eliminar franja';
    removeButton.addEventListener('click', () => {
      list.removeChild(item);
      if (!list.children.length) {
        addSchedule({ dayValue: '', customLabel: '', opensAt: '', closesAt: '' });
      } else {
        updateEmptyState();
      }
    });
    actions.appendChild(removeButton);

    item.append(firstRow, secondRow, actions);
    list.appendChild(item);

    if (data.dayValue) {
      daySelect.value = data.dayValue;
    }
    if (data.customLabel) {
      customInput.value = data.customLabel;
    }
    if (data.opensAt) {
      opensInput.value = data.opensAt;
    }
    if (data.closesAt) {
      closesInput.value = data.closesAt;
    }

    function syncCustomField() {
      const isCustom = daySelect.value === 'custom' || !daySelect.value;
      customLabel.hidden = !isCustom;
      if (!isCustom) {
        customInput.placeholder = `Ej. ${WEEKDAY_LABEL_BY_VALUE[daySelect.value] || 'Horario'}`;
      } else {
        customInput.placeholder = 'Nombre de la franja';
      }
    }

    daySelect.addEventListener('change', syncCustomField);
    syncCustomField();

    updateEmptyState();
  }

  function addSchedule(data) {
    createScheduleItem(data);
  }

  addButton.addEventListener('click', () => {
    addSchedule({ dayValue: '', customLabel: '', opensAt: '', closesAt: '' });
  });

  const normalized = Array.isArray(initialSchedules) ? initialSchedules.map(normalizeScheduleForEditor) : [];
  if (normalized.length) {
    normalized.forEach((entry) => addSchedule(entry));
  }

  if (!list.children.length) {
    addSchedule({ dayValue: '', customLabel: '', opensAt: '', closesAt: '' });
  }

  updateEmptyState();

  function getValue() {
    return Array.from(list.querySelectorAll('.club-editor__item'))
      .map((item) => {
        const daySelect = item.querySelector('.club-schedule-day');
        const customInput = item.querySelector('.club-schedule-label');
        const opensInput = item.querySelector('.club-schedule-opens');
        const closesInput = item.querySelector('.club-schedule-closes');

        const dayValue = daySelect?.value || '';
        const opensAt = opensInput?.value?.trim() || '';
        const closesAt = closesInput?.value?.trim() || '';
        let label = '';

        if (dayValue && dayValue !== 'custom') {
          label = WEEKDAY_LABEL_BY_VALUE[dayValue] || '';
        } else {
          label = customInput?.value?.trim() || '';
        }

        if (!label) {
          return null;
        }

        return {
          label,
          opensAt,
          closesAt,
        };
      })
      .filter(Boolean);
  }

  return {
    element: wrapper,
    getValue,
    addSchedule,
  };
}

function normalizeCourtForEditor(entry = {}) {
  return {
    name: typeof entry.name === 'string' ? entry.name.trim() : '',
    surface: typeof entry.surface === 'string' ? entry.surface.trim() : '',
    indoor: Boolean(entry.indoor),
    lights: entry.lights === undefined ? true : Boolean(entry.lights),
    notes: typeof entry.notes === 'string' ? entry.notes.trim() : '',
  };
}

function createCourtsEditor(initialCourts = []) {
  const wrapper = document.createElement('div');
  wrapper.className = 'club-editor';

  const list = document.createElement('div');
  list.className = 'club-editor__list';

  const emptyState = document.createElement('p');
  emptyState.className = 'club-editor__empty';
  emptyState.textContent = 'No hay pistas añadidas.';

  const footer = document.createElement('div');
  footer.className = 'club-editor__footer';

  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'secondary';
  addButton.textContent = 'Añadir pista';
  footer.appendChild(addButton);

  wrapper.append(list, emptyState, footer);

  function updateEmptyState() {
    emptyState.hidden = list.children.length > 0;
  }

  function createCourtItem(data = {}) {
    const item = document.createElement('div');
    item.className = 'club-editor__item';

    const firstRow = document.createElement('div');
    firstRow.className = 'form-grid';

    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Nombre de la pista';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'club-court-name';
    nameInput.placeholder = 'Ej. Pista Central';
    nameLabel.appendChild(nameInput);

    const surfaceLabel = document.createElement('label');
    surfaceLabel.textContent = 'Superficie';
    const surfaceInput = document.createElement('input');
    surfaceInput.type = 'text';
    surfaceInput.className = 'club-court-surface';
    surfaceInput.placeholder = 'Ej. Dura, Arcilla';
    surfaceLabel.appendChild(surfaceInput);

    firstRow.append(nameLabel, surfaceLabel);

    const secondRow = document.createElement('div');
    secondRow.className = 'form-grid';

    const indoorLabel = document.createElement('label');
    indoorLabel.textContent = 'Tipo de pista';
    const indoorSelect = document.createElement('select');
    indoorSelect.className = 'club-court-indoor';
    indoorSelect.innerHTML = `
      <option value="outdoor">Exterior</option>
      <option value="indoor">Interior</option>
    `;
    indoorLabel.appendChild(indoorSelect);

    const lightsLabel = document.createElement('label');
    lightsLabel.textContent = 'Iluminación';
    const lightsSelect = document.createElement('select');
    lightsSelect.className = 'club-court-lights';
    lightsSelect.innerHTML = `
      <option value="true">Con iluminación</option>
      <option value="false">Sin iluminación</option>
    `;
    lightsLabel.appendChild(lightsSelect);

    secondRow.append(indoorLabel, lightsLabel);

    const notesLabel = document.createElement('label');
    notesLabel.textContent = 'Notas';
    const notesInput = document.createElement('textarea');
    notesInput.className = 'club-court-notes';
    notesInput.rows = 2;
    notesInput.placeholder = 'Detalles adicionales u observaciones';
    notesLabel.appendChild(notesInput);

    const actions = document.createElement('div');
    actions.className = 'form-actions form-actions--inline';
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'ghost';
    removeButton.textContent = 'Eliminar pista';
    removeButton.addEventListener('click', () => {
      list.removeChild(item);
      if (!list.children.length) {
        addCourt({ name: '', surface: '', indoor: false, lights: true, notes: '' });
      } else {
        updateEmptyState();
      }
    });
    actions.appendChild(removeButton);

    item.append(firstRow, secondRow, notesLabel, actions);
    list.appendChild(item);

    nameInput.value = data.name || '';
    surfaceInput.value = data.surface || '';
    indoorSelect.value = data.indoor ? 'indoor' : 'outdoor';
    lightsSelect.value = data.lights === false ? 'false' : 'true';
    notesInput.value = data.notes || '';

    updateEmptyState();
  }

  function addCourt(data) {
    createCourtItem(data);
  }

  addButton.addEventListener('click', () => {
    addCourt({ name: '', surface: '', indoor: false, lights: true, notes: '' });
  });

  const normalized = Array.isArray(initialCourts) ? initialCourts.map(normalizeCourtForEditor) : [];
  if (normalized.length) {
    normalized.forEach((entry) => addCourt(entry));
  }

  if (!list.children.length) {
    addCourt({ name: '', surface: '', indoor: false, lights: true, notes: '' });
  }

  updateEmptyState();

  function getValue() {
    return Array.from(list.querySelectorAll('.club-editor__item'))
      .map((item) => {
        const nameInput = item.querySelector('.club-court-name');
        const surfaceInput = item.querySelector('.club-court-surface');
        const indoorSelect = item.querySelector('.club-court-indoor');
        const lightsSelect = item.querySelector('.club-court-lights');
        const notesInput = item.querySelector('.club-court-notes');

        const name = nameInput?.value?.trim();
        if (!name) {
          return null;
        }

        return {
          name,
          surface: surfaceInput?.value?.trim() || '',
          indoor: indoorSelect?.value === 'indoor',
          lights: lightsSelect?.value !== 'false',
          notes: notesInput?.value?.trim() || '',
        };
      })
      .filter(Boolean);
  }

  return {
    element: wrapper,
    getValue,
    addCourt,
  };
}

function createRegulationEditor(initialContent = '') {
  const container = document.createElement('div');
  container.className = 'chat-editor chat-editor--regulation';

  const toolbar = document.createElement('div');
  toolbar.className = 'chat-toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'Formato del reglamento');

  const buttons = [
    { command: 'bold', label: 'Negrita', content: 'B' },
    { command: 'italic', label: 'Cursiva', content: 'I' },
    { command: 'underline', label: 'Subrayado', content: 'U' },
    { command: 'heading', label: 'Encabezado nivel 1', content: 'H1', level: '1' },
    { command: 'heading', label: 'Encabezado nivel 2', content: 'H2', level: '2' },
    { command: 'list', label: 'Lista con viñetas', content: '•', list: 'unordered' },
    { command: 'list', label: 'Lista numerada', content: '1.', list: 'ordered' },
    { command: 'quote', label: 'Cita', content: '“ ”' },
    { command: 'link', label: 'Insertar enlace', content: '🔗' },
    { command: 'clear', label: 'Limpiar formato', content: '⌫' },
  ];

  buttons.forEach((config) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chat-toolbar-button';
    button.dataset.command = config.command;
    if (config.level) {
      button.dataset.level = config.level;
    }
    if (config.list) {
      button.dataset.list = config.list;
    }
    button.setAttribute('aria-label', config.label);
    button.textContent = config.content;
    toolbar.appendChild(button);
  });

  const editor = document.createElement('div');
  editor.className = 'chat-editor-content';
  editor.contentEditable = 'true';
  editor.setAttribute('role', 'textbox');
  editor.setAttribute('aria-multiline', 'true');
  editor.dataset.placeholder = 'Describe el reglamento del club con formato enriquecido';

  const sanitizedInitial = sanitizeNoticeHtml(initialContent) || '';
  if (sanitizedInitial) {
    editor.innerHTML = sanitizedInitial;
  }

  toolbar.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-command]');
    if (!button || button.disabled) {
      return;
    }
    const { command } = button.dataset;
    if (!command) {
      return;
    }
    applyRichTextCommand(editor, command, {
      level: button.dataset.level,
      list: button.dataset.list,
    });
  });

  container.append(toolbar, editor);

  function getValue() {
    const rawHtml = editor.innerHTML || '';
    return sanitizeNoticeHtml(rawHtml);
  }

  return {
    element: container,
    getValue,
  };
}

function parseFacilitiesInput(rawValue) {
  if (typeof rawValue !== 'string') return [];
  return rawValue
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function renderClubProfile(club = {}) {
  state.club = club || {};
  const name = typeof club.name === 'string' && club.name.trim() ? club.name.trim() : 'Liga Tennis';
  const slogan =
    typeof club.slogan === 'string' && club.slogan.trim() ? club.slogan.trim() : 'Liga social de tenis';

  if (clubNameHeading) {
    clubNameHeading.textContent = name;
  }
  if (clubSloganHeading) {
    clubSloganHeading.textContent = slogan;
  }
  if (clubNameDisplay) {
    clubNameDisplay.textContent = name;
  }
  if (clubSloganDisplay) {
    clubSloganDisplay.textContent = slogan;
  }
  if (mobileTopbarTitle) {
    mobileTopbarTitle.textContent = name;
  }

  if (clubDescription) {
    clubDescription.textContent = club.description?.trim() || 'Actualiza la descripción del club para compartir la filosofía y servicios disponibles.';
  }

  const contactBits = [];
  if (club.contactPhone) {
    contactBits.push(`Tel: ${club.contactPhone}`);
  }
  if (club.contactEmail) {
    contactBits.push(`Email: ${club.contactEmail}`);
  }

  if (clubAddress) {
    clubAddress.textContent = club.address?.trim() || '—';
  }
  if (clubContact) {
    clubContact.textContent = contactBits.length ? contactBits.join(' · ') : '—';
  }
  if (clubWebsite) {
    clubWebsite.textContent = '';
    const normalized = normalizeWebsiteUrl(club.website);
    if (normalized) {
      const link = document.createElement('a');
      link.href = normalized;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = normalized.replace(/^https?:\/\//i, '');
      clubWebsite.appendChild(link);
    } else {
      clubWebsite.textContent = '—';
    }
  }

  if (topbarLogo) {
    if (club.logo) {
      topbarLogo.src = club.logo;
    } else {
      topbarLogo.src = 'assets/club-logo.svg';
    }
  }

  if (mobileTopbarLogo) {
    if (club.logo) {
      mobileTopbarLogo.src = club.logo;
    } else {
      mobileTopbarLogo.src = 'assets/club-logo.svg';
    }
  }

  if (clubLogoDisplay) {
    if (club.logo) {
      clubLogoDisplay.style.backgroundImage = `url(${club.logo})`;
      clubLogoDisplay.textContent = '';
    } else {
      clubLogoDisplay.style.backgroundImage = '';
      clubLogoDisplay.textContent = name.charAt(0).toUpperCase();
    }
  }

  const schedules = Array.isArray(club.schedules) ? club.schedules : [];
  if (clubScheduleList) {
    clubScheduleList.innerHTML = '';
    schedules.forEach((entry) => {
      const item = document.createElement('li');
      const rangeParts = [];
      if (entry.opensAt) {
        rangeParts.push(entry.opensAt);
      }
      if (entry.closesAt) {
        rangeParts.push(entry.closesAt);
      }
      const range = rangeParts.length ? ` · ${rangeParts.join(' – ')}` : '';
      item.textContent = `${entry.label}${range}`;
      clubScheduleList.appendChild(item);
    });
    clubScheduleList.hidden = !schedules.length;
  }
  if (clubScheduleEmpty) {
    clubScheduleEmpty.hidden = Boolean(schedules.length);
  }

  const courts = Array.isArray(club.courts) ? club.courts : [];
  if (clubCourtsList) {
    clubCourtsList.innerHTML = '';
    courts.forEach((court) => {
      const item = document.createElement('li');
      const details = [];
      if (court.surface) {
        details.push(court.surface);
      }
      details.push(court.indoor ? 'Interior' : 'Exterior');
      details.push(court.lights ? 'Con iluminación' : 'Sin iluminación');
      if (court.notes) {
        details.push(court.notes);
      }
      item.textContent = `${court.name} · ${details.join(' · ')}`;
      clubCourtsList.appendChild(item);
    });
    clubCourtsList.hidden = !courts.length;
  }
  if (clubCourtsEmpty) {
    clubCourtsEmpty.hidden = Boolean(courts.length);
  }

  const facilities = Array.isArray(club.facilities) ? club.facilities : [];
  if (clubFacilitiesList) {
    clubFacilitiesList.innerHTML = '';
    facilities.forEach((facility) => {
      const item = document.createElement('li');
      item.textContent = facility;
      clubFacilitiesList.appendChild(item);
    });
    clubFacilitiesList.hidden = !facilities.length;
  }
  if (clubFacilitiesEmpty) {
    clubFacilitiesEmpty.hidden = Boolean(facilities.length);
  }

  populateAdminMatchCourtOptions();

  renderRules();

  if (clubStatus) {
    setStatusMessage(clubStatus, '', '');
  }
}

function formatChatTimestamp(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    return '';
  }
}

const NOTICE_ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const NOTICE_ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'OL',
  'UL',
  'LI',
  'BLOCKQUOTE',
  'A',
  'H1',
  'H2',
  'H3',
  'H4',
]);

function sanitizeNoticeHtml(html) {
  if (typeof html !== 'string' || !html.trim()) {
    return '';
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  const cleanNode = (node) => {
    const children = Array.from(node.childNodes);
    children.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.tagName === 'SPAN') {
          const style = child.getAttribute('style') || '';
          if (/text-decoration\s*:\s*underline/i.test(style)) {
            const underline = document.createElement('u');
            while (child.firstChild) {
              underline.appendChild(child.firstChild);
            }
            child.replaceWith(underline);
            cleanNode(underline);
            return;
          }
        }

        if (!NOTICE_ALLOWED_TAGS.has(child.tagName)) {
          const fragment = document.createDocumentFragment();
          while (child.firstChild) {
            fragment.appendChild(child.firstChild);
          }
          child.replaceWith(fragment);
          cleanNode(fragment);
          return;
        }

        const attributes = Array.from(child.attributes);
        attributes.forEach((attribute) => {
          const name = attribute.name.toLowerCase();
          if (child.tagName === 'A') {
            if (name === 'href') {
              let href = attribute.value.trim();
              if (href && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) {
                href = `https://${href}`;
              }
              try {
                const url = new URL(href);
                if (!NOTICE_ALLOWED_SCHEMES.has(url.protocol)) {
                  child.removeAttribute(attribute.name);
                  return;
                }
                child.setAttribute('href', url.toString());
                child.setAttribute('rel', 'noopener noreferrer');
                child.setAttribute('target', '_blank');
              } catch (error) {
                child.removeAttribute(attribute.name);
              }
              return;
            }
            if (name === 'title') {
              return;
            }
            if (name === 'rel') {
              child.setAttribute('rel', 'noopener noreferrer');
              return;
            }
            if (name === 'target') {
              child.setAttribute('target', '_blank');
              return;
            }
          }
          child.removeAttribute(attribute.name);
        });

        cleanNode(child);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
      } else if (child.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        cleanNode(child);
      }
    });
  };

  cleanNode(template.content);
  return template.innerHTML.trim();
}

function extractPlainTextFromHtml(html) {
  if (!html) {
    return '';
  }
  const template = document.createElement('template');
  template.innerHTML = html;
  const text = template.content.textContent || '';
  return text.replace(/\s+/g, ' ').trim();
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '';
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${bytes} B`;
}

function renderNoticeAttachmentsDraft() {
  if (!generalChatAttachments || !generalChatAttachmentsList) {
    return;
  }
  generalChatAttachmentsList.innerHTML = '';
  if (!noticeDraftAttachments.length) {
    generalChatAttachments.hidden = true;
    return;
  }

  generalChatAttachments.hidden = false;
  noticeDraftAttachments.forEach((attachment) => {
    const item = document.createElement('li');
    item.className = 'chat-attachment';
    item.dataset.attachmentId = attachment.id;

    if (attachment.type === 'image' && attachment.dataUrl) {
      const preview = document.createElement('img');
      preview.className = 'chat-attachment-preview';
      preview.src = attachment.dataUrl;
      preview.alt = attachment.name || 'Imagen adjunta';
      item.appendChild(preview);
    }

    const info = document.createElement('div');
    info.className = 'chat-attachment-info';

    const title = document.createElement('p');
    title.className = 'chat-attachment-name';
    title.textContent = attachment.name || 'Adjunto';
    info.appendChild(title);

    const meta = document.createElement('p');
    meta.className = 'chat-attachment-meta';
    meta.textContent = [attachment.contentType, formatFileSize(attachment.size)]
      .filter(Boolean)
      .join(' · ');
    info.appendChild(meta);

    item.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'chat-attachment-actions';
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'chat-attachment-remove';
    removeButton.dataset.attachmentRemove = attachment.id;
    removeButton.textContent = 'Eliminar';
    actions.appendChild(removeButton);
    item.appendChild(actions);

    generalChatAttachmentsList.appendChild(item);
  });
}

function setNoticeFormBusy(isBusy) {
  if (generalChatToolbar) {
    generalChatToolbar.querySelectorAll('button').forEach((button) => {
      button.disabled = isBusy;
    });
  }
  if (generalChatEditor) {
    generalChatEditor.setAttribute('contenteditable', isBusy ? 'false' : 'true');
    if (!isBusy) {
      generalChatEditor.focus();
    }
  }
  if (generalChatAttachmentInput) {
    generalChatAttachmentInput.disabled = isBusy;
  }
  const submitButton = generalChatForm?.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = isBusy;
  }
}

function resetNoticeComposer() {
  if (generalChatEditor) {
    generalChatEditor.innerHTML = '';
  }
  if (generalChatInput) {
    generalChatInput.value = '';
  }
  if (generalChatAttachmentInput) {
    generalChatAttachmentInput.value = '';
  }
  noticeDraftAttachments = [];
  renderNoticeAttachmentsDraft();
}

function applyRichTextCommand(editor, command, { level, list, onAttachment } = {}) {
  if (!editor || !command) {
    return;
  }

  editor.focus();

  switch (command) {
    case 'bold':
    case 'italic':
    case 'underline':
      document.execCommand(command);
      break;
    case 'heading': {
      const headingLevel = level || '2';
      document.execCommand('formatBlock', false, `H${headingLevel}`);
      break;
    }
    case 'list':
      if (list === 'ordered') {
        document.execCommand('insertOrderedList');
      } else {
        document.execCommand('insertUnorderedList');
      }
      break;
    case 'quote':
      document.execCommand('formatBlock', false, 'blockquote');
      break;
    case 'link': {
      const url = window.prompt('Introduce la URL del enlace (incluye https://)');
      if (!url) {
        break;
      }
      let sanitizedUrl = url.trim();
      if (sanitizedUrl && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(sanitizedUrl)) {
        sanitizedUrl = `https://${sanitizedUrl}`;
      }
      try {
        const parsed = new URL(sanitizedUrl);
        if (!NOTICE_ALLOWED_SCHEMES.has(parsed.protocol)) {
          showGlobalMessage(
            'Introduce un enlace con un protocolo permitido (http, https, mailto o tel).',
            'error'
          );
          break;
        }
        document.execCommand('createLink', false, parsed.toString());
      } catch (error) {
        showGlobalMessage('No se pudo crear el enlace. Revisa la URL e inténtalo de nuevo.', 'error');
      }
      break;
    }
    case 'clear':
      document.execCommand('removeFormat');
      document.execCommand('formatBlock', false, 'p');
      break;
    case 'attachment':
      if (typeof onAttachment === 'function') {
        onAttachment();
      }
      break;
    default:
      break;
  }
}

function handleNoticeToolbarClick(event) {
  const button = event.target.closest('button[data-command]');
  if (!button || button.disabled) {
    return;
  }
  const command = button.dataset.command;
  if (!command) {
    return;
  }
  if (!generalChatEditor) {
    return;
  }

  event.preventDefault();
  applyRichTextCommand(generalChatEditor, command, {
    level: button.dataset.level,
    list: button.dataset.list,
    onAttachment: () => generalChatAttachmentInput?.click(),
  });
}

function removeNoticeAttachment(attachmentId) {
  if (!attachmentId) return;
  noticeDraftAttachments = noticeDraftAttachments.filter((item) => item.id !== attachmentId);
  renderNoticeAttachmentsDraft();
}

async function handleNoticeAttachmentChange(event) {
  const fileList = Array.from(event.target.files || []);
  if (!fileList.length) {
    return;
  }

  const availableSlots = MAX_NOTICE_ATTACHMENTS - noticeDraftAttachments.length;
  if (availableSlots <= 0) {
    showGlobalMessage('Has alcanzado el número máximo de adjuntos por aviso (5).', 'error');
    event.target.value = '';
    return;
  }

  const selectedFiles = fileList.slice(0, availableSlots);
  const newAttachments = [];

  for (const file of selectedFiles) {
    if (file.size > MAX_NOTICE_ATTACHMENT_SIZE) {
      showGlobalMessage(
        `El archivo "${file.name}" supera el tamaño máximo permitido (3 MB).`,
        'error'
      );
      continue;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      newAttachments.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: file.name,
        size: file.size,
        contentType: file.type,
        dataUrl,
        type: file.type && file.type.toLowerCase().startsWith('image/') ? 'image' : 'file',
      });
    } catch (error) {
      showGlobalMessage(error.message, 'error');
    }
  }

  if (newAttachments.length) {
    noticeDraftAttachments = noticeDraftAttachments
      .concat(newAttachments)
      .slice(0, MAX_NOTICE_ATTACHMENTS);
    renderNoticeAttachmentsDraft();
  }

  event.target.value = '';
}

function renderChatMessages(messages = [], container, emptyMessage) {
  if (!container) return;
  container.innerHTML = '';
  if (!messages.length) {
    container.innerHTML = `<li class="empty-state">${emptyMessage}</li>`;
    return;
  }

  const currentUserId = normalizeId(state.user);

  messages.forEach((message) => {
    const item = document.createElement('li');
    item.className = 'chat-message';
    const senderId = normalizeId(message.sender);
    if (senderId && senderId === currentUserId) {
      item.classList.add('mine');
    }

    const header = document.createElement('div');
    header.className = 'chat-message-header';
    const name = document.createElement('strong');
    name.textContent = message.sender?.fullName || message.sender?.email || 'Participante';
    header.appendChild(name);

    const senderRoles = message.sender?.roles || message.sender?.role;
    if (senderRoles) {
      const role = document.createElement('span');
      role.className = 'tag';
      role.textContent = formatRoles(senderRoles);
      header.appendChild(role);
    }

    const timestamp = document.createElement('time');
    timestamp.dateTime = message.createdAt || '';
    timestamp.textContent = formatChatTimestamp(message.createdAt);
    header.appendChild(timestamp);

    const body = document.createElement('div');
    const sanitizedRich = sanitizeNoticeHtml(message.richContent || '');
    const plainContent = (message.content || '').trim();

    if (sanitizedRich) {
      const richContainer = document.createElement('div');
      richContainer.className = 'chat-message-rich';
      richContainer.innerHTML = sanitizedRich;
      body.appendChild(richContainer);
    } else if (plainContent) {
      const paragraph = document.createElement('p');
      paragraph.textContent = plainContent;
      body.appendChild(paragraph);
    }

    if (Array.isArray(message.attachments) && message.attachments.length) {
      const attachmentsWrapper = document.createElement('div');
      attachmentsWrapper.className = 'chat-message-attachments';

      message.attachments.forEach((attachment) => {
        if (!attachment) return;
        const attachmentBlock = document.createElement('div');
        attachmentBlock.className = 'chat-message-attachment';
        const source = attachment.dataUrl || attachment.url;
        const filename = attachment.filename || attachment.description || 'Adjunto';
        const attachmentType = (attachment.type || '').toLowerCase();
        const isImage =
          attachmentType === 'image' || (attachment.contentType || '').toLowerCase().startsWith('image/');

        if (isImage && source) {
          const img = document.createElement('img');
          img.src = source;
          img.alt = filename;
          attachmentBlock.appendChild(img);
        }

        if (source) {
          const link = document.createElement('a');
          link.href = source;
          link.textContent = filename;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          if (attachment.filename) {
            link.download = attachment.filename;
          }
          attachmentBlock.appendChild(link);
        } else if (!attachmentBlock.childElementCount) {
          const label = document.createElement('span');
          label.textContent = filename;
          attachmentBlock.appendChild(label);
        }

        attachmentsWrapper.appendChild(attachmentBlock);
      });

      if (attachmentsWrapper.childElementCount) {
        body.appendChild(attachmentsWrapper);
      }
    }

    item.appendChild(header);
    if (body.childElementCount) {
      item.appendChild(body);
    }

    container.appendChild(item);
  });
}

function renderGeneralChat() {
  renderChatMessages(
    Array.isArray(state.generalChatMessages) ? state.generalChatMessages : [],
    generalChatMessagesList,
    'Todavía no hay avisos publicados.'
  );
}

function renderDirectChat() {}

function populateChatParticipants() {}

function renderRules() {
  if (!rulesContent) return;

  const html = getRegulationHtml(state.club?.regulation);
  const sanitized = typeof html === 'string' ? html.trim() : '';

  if (!sanitized) {
    rulesContent.innerHTML =
      '<p class="empty-state">Aún no se ha configurado el reglamento del club.</p>';
    return;
  }

  rulesContent.innerHTML = sanitized;
}

renderRules();

function updateRankingOptions(categories = []) {
  rankingSelect.innerHTML = '';
  if (!categories.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Sin categorías disponibles';
    rankingSelect.appendChild(option);
    rankingEmpty.hidden = false;
    rankingEmpty.textContent = 'Crea una categoría para ver el ranking.';
    return;
  }

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecciona una categoría';
  rankingSelect.appendChild(placeholder);

  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category._id || category.id;
    option.textContent = category.name;
    rankingSelect.appendChild(option);
  });

  if (state.selectedCategoryId) {
    rankingSelect.value = state.selectedCategoryId;
  }
}

function renderRankingTable(data) {
  const tbody = rankingTable.querySelector('tbody');
  tbody.innerHTML = '';

  if (!data || !Array.isArray(data.ranking) || !data.ranking.length) {
    rankingEmpty.hidden = false;
    rankingEmpty.textContent = 'Aún no hay resultados para esta categoría.';
    state.currentRanking = null;
    return;
  }

  rankingEmpty.hidden = true;
  state.currentRanking = data;
  const activeCategory = state.categories.find(
    (category) => (category._id || category.id) === state.selectedCategoryId
  );
  state.currentRankingCategoryName = activeCategory?.name || 'Categoría';

  data.ranking.forEach((entry, index) => {
    const row = document.createElement('tr');

    const positionCell = document.createElement('td');
    const podiumEmoji = getPodiumEmoji(index);
    positionCell.textContent = podiumEmoji ? `${index + 1} ${podiumEmoji}` : index + 1;
    row.appendChild(positionCell);

    const playerCell = document.createElement('td');
    playerCell.appendChild(buildPlayerCell(entry.player));
    row.appendChild(playerCell);

    row.appendChild(document.createElement('td')).textContent = entry.points ?? 0;
    row.appendChild(document.createElement('td')).textContent = entry.matchesPlayed ?? 0;
    row.appendChild(document.createElement('td')).textContent = entry.wins ?? 0;
    row.appendChild(document.createElement('td')).textContent = entry.losses ?? 0;
    row.appendChild(document.createElement('td')).textContent = entry.gamesWon ?? 0;

    tbody.appendChild(row);
  });
}

function printRankingSheet() {
  if (!state.currentRanking || !Array.isArray(state.currentRanking.ranking)) {
    showGlobalMessage('Selecciona una categoría con ranking disponible para imprimir.', 'info');
    return;
  }

  const rankingEntries = state.currentRanking.ranking;
  const categoryName = state.currentRankingCategoryName || 'Ranking de la liga';
  const printWindow = window.open('', '_blank', 'width=1024,height=768');
  if (!printWindow) {
    showGlobalMessage('No fue posible abrir la vista de impresión. Permite las ventanas emergentes.', 'error');
    return;
  }

  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(now);

  const rows = rankingEntries
    .map((entry, index) => {
      const playerMarkup = buildPlayerCellMarkup(entry.player, { includeSchedule: true });
      const podiumEmoji = getPodiumEmoji(index);
      const positionLabel = podiumEmoji ? `${index + 1} ${podiumEmoji}` : index + 1;

      return `
        <tr>
          <td>${positionLabel}</td>
          <td>${playerMarkup}</td>
          <td>${entry.points ?? 0}</td>
          <td>${entry.matchesPlayed ?? 0}</td>
          <td>${entry.wins ?? 0}</td>
          <td>${entry.losses ?? 0}</td>
          <td>${entry.gamesWon ?? 0}</td>
        </tr>
      `;
    })
    .join('');

  printWindow.document.write(`<!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Ranking ${categoryName}</title>
      <style>
        body { font-family: 'Segoe UI', Roboto, sans-serif; margin: 32px; background: #f7f8fb; color: #1f2933; }
        h1 { margin: 0 0 8px; font-size: 28px; }
        p.subtitle { margin: 0 0 24px; color: #52606d; }
        table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 24px 48px rgba(15, 23, 42, 0.12); }
        thead th { text-align: left; padding: 16px; background: linear-gradient(90deg, #59a4ff, #7ac8ff); color: #fff; font-weight: 600; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; }
        tbody td { padding: 14px 16px; border-bottom: 1px solid #e4ecf7; font-size: 15px; vertical-align: middle; }
        tbody tr:nth-child(even) { background: #f9fbff; }
        tbody tr:last-child td { border-bottom: none; }
        .player-cell { display: flex; align-items: center; gap: 14px; }
        .player-avatar { width: 48px; height: 48px; border-radius: 50%; background: #e2e8f0; color: #1f2937; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 18px; text-transform: uppercase; overflow: hidden; }
        .player-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .player-avatar--placeholder { background: #cbd5f5; color: #1e293b; }
        .player-cell__info { display: flex; flex-direction: column; gap: 4px; }
        .player-cell__name { font-weight: 600; font-size: 16px; }
        .player-cell__meta { color: #64748b; font-size: 13px; }
        .movement-badge { display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 999px; background: var(--movement-badge-bg, rgba(148, 163, 184, 0.2)); font-weight: 600; font-size: 14px; }
        .movement-icon { width: 20px; height: 20px; }
        @media print {
          body { margin: 16px; }
          table { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <h1>Ranking · ${categoryName}</h1>
      <p class="subtitle">Actualizado el ${formattedDate}</p>
      <table>
        <thead>
          <tr>
            <th>Nº Ranking</th>
            <th>Jugador</th>
            <th>Puntos</th>
            <th>Jugados</th>
            <th>Victorias</th>
            <th>Derrotas</th>
            <th>Juegos ganados</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <script>window.addEventListener('load', () => { window.print(); });</script>
    </body>
  </html>`);
  printWindow.document.close();
}

async function loadRanking(categoryId) {
  if (!categoryId) {
    rankingTable.querySelector('tbody').innerHTML = '';
    rankingEmpty.hidden = false;
    rankingEmpty.textContent = 'Selecciona una categoría.';
    state.selectedCategoryId = null;
    state.currentRanking = null;
    state.currentRankingCategoryName = '';
    return;
  }

  state.selectedCategoryId = categoryId;
  setStatusMessage(adminStatus, '', '');
  try {
    const data = await request(`/categories/${categoryId}/ranking`);
    renderRankingTable(data);
  } catch (error) {
    rankingTable.querySelector('tbody').innerHTML = '';
    rankingEmpty.hidden = false;
    rankingEmpty.textContent = error.message;
    showGlobalMessage(error.message, 'error');
    state.currentRanking = null;
  }
}

function populateAdminSelects() {
  if (!isAdmin()) return;

  const categories = Array.isArray(state.categories) ? state.categories : [];
  const players = Array.isArray(state.players) ? state.players : [];
  const playerOptions = players.filter((player) => entityHasRole(player, 'player'));

  const buildCategoryOptions = (select, placeholder = 'Selecciona una categoría') => {
    if (!select) return;
    const previous = select.value;
    select.innerHTML = placeholder ? `<option value="">${placeholder}</option>` : '';
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category._id || category.id;
      const league = resolveLeague(category.league);
      const leagueLabel = league
        ? ` · ${league.name}${league.year ? ` · ${league.year}` : ''}`
        : '';
      option.textContent = `${category.name} (${translateGender(category.gender)})${leagueLabel}`;
      select.appendChild(option);
    });
    if (previous) {
      select.value = previous;
    }
  };

  buildCategoryOptions(adminEnrollmentCategory, 'Selecciona una categoría');
  buildCategoryOptions(adminMatchCategory, '');
  buildCategoryOptions(playerDirectoryCategory, 'Todas las categorías');

  if (adminEnrollmentPlayer) {
    const previous = adminEnrollmentPlayer.value;
    adminEnrollmentPlayer.innerHTML = '<option value="">Selecciona un jugador</option>';
    playerOptions.forEach((player) => {
      const option = document.createElement('option');
      option.value = player._id || player.id;
      option.textContent = player.fullName;
      adminEnrollmentPlayer.appendChild(option);
    });
    if (
      previous &&
      Array.from(adminEnrollmentPlayer.options).some((option) => option.value === previous)
    ) {
      adminEnrollmentPlayer.value = previous;
    }
  }

  const populateMatchPlayers = (select) => {
    if (!select) return;
    const previous = select.value;
    select.innerHTML = '<option value="">Selecciona un jugador</option>';
    playerOptions.forEach((player) => {
      const option = document.createElement('option');
      option.value = player._id || player.id;
      option.textContent = player.fullName;
      select.appendChild(option);
    });
    if (previous) {
      select.value = previous;
    }
  };

  populateMatchPlayers(adminMatchPlayer1);
  populateMatchPlayers(adminMatchPlayer2);

  if (adminEnrollmentList) {
    const selectedCategory = adminEnrollmentCategory?.value || '';
    renderEnrollmentList(selectedCategory);
  }
}

function renderAdminCategoryList() {
  if (!adminCategoryList) return;
  adminCategoryList.innerHTML = '';

  if (!state.categories.length) {
    adminCategoryList.innerHTML = '<li class="empty-state">Aún no hay categorías.</li>';
    return;
  }

  state.categories
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .forEach((category) => {
      const item = document.createElement('li');
      const categoryColor = getCategoryColor(category);
      if (categoryColor) {
        applyCategoryColorStyles(item, categoryColor, { backgroundAlpha: 0.14, borderAlpha: 0.3 });
      }
      const title = document.createElement('strong');
      title.textContent = category.name;
      if (categoryColor) {
        const indicator = createCategoryColorIndicator(categoryColor, category.name);
        if (indicator) {
          title.classList.add('with-category-color');
          title.prepend(indicator);
        }
      }
      item.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.appendChild(document.createElement('span')).textContent = translateGender(category.gender);
      if (category.skillLevel) {
        meta.appendChild(document.createElement('span')).textContent = category.skillLevel;
      }
      item.appendChild(meta);

      const minimumAgeValue = Number(category.minimumAge);
      if (Number.isFinite(minimumAgeValue) && minimumAgeValue > 0) {
        const ageMeta = document.createElement('div');
        ageMeta.className = 'meta';
        const parts = [`Edad mínima: ${minimumAgeValue} años`];
        if (category.minimumAgeReferenceYear) {
          parts.push(`Referencia: ${category.minimumAgeReferenceYear}`);
        }
        ageMeta.textContent = parts.join(' · ');
        item.appendChild(ageMeta);
      }

      const categoryLeague = resolveLeague(category.league);
      if (categoryLeague) {
        const leagueMeta = document.createElement('div');
        leagueMeta.className = 'meta meta-league-link';
        leagueMeta.appendChild(document.createElement('span')).textContent = 'Liga';
        const leagueTag = document.createElement('span');
        leagueTag.className = 'tag league-tag';
        leagueTag.textContent = categoryLeague.year
          ? `${categoryLeague.name} · ${categoryLeague.year}`
          : categoryLeague.name || 'Liga';
        if (categoryLeague.status === 'cerrada') {
          leagueTag.classList.add('league-tag--closed');
        }
        leagueMeta.appendChild(leagueTag);
        item.appendChild(leagueMeta);
      }

      const dates = [];
      if (category.startDate) {
        dates.push(`Inicio: ${formatDateInput(category.startDate)}`);
      }
      if (category.endDate) {
        dates.push(`Fin: ${formatDateInput(category.endDate)}`);
      }
      if (dates.length) {
        const dateMeta = document.createElement('div');
        dateMeta.className = 'meta';
        dateMeta.textContent = dates.join(' · ');
        item.appendChild(dateMeta);
      }

      const actions = document.createElement('div');
      actions.className = 'actions';
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'secondary';
      editButton.textContent = 'Editar';
      editButton.dataset.categoryId = category._id || category.id;
      editButton.dataset.action = 'edit';
      actions.appendChild(editButton);

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'danger';
      deleteButton.textContent = 'Eliminar';
      deleteButton.dataset.categoryId = category._id || category.id;
      deleteButton.dataset.action = 'delete';
      actions.appendChild(deleteButton);
      item.appendChild(actions);

      adminCategoryList.appendChild(item);
    });
}

function renderAdminPlayerList() {
  if (!adminPlayerList) return;
  adminPlayerList.innerHTML = '';

  if (!state.players.length) {
    adminPlayerList.innerHTML = '<li class="empty-state">No hay usuarios registrados.</li>';
    return;
  }

  state.players
    .slice()
    .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'es'))
    .forEach((player) => {
      const item = document.createElement('li');
      const header = buildPlayerCell(player, { size: 'sm' });
      item.appendChild(header);

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.appendChild(document.createElement('span')).textContent = player.email;
      meta.appendChild(document.createElement('span')).textContent = formatRoles(player.roles || player.role);
      if (player.phone) {
        meta.appendChild(document.createElement('span')).textContent = player.phone;
      }
      if (player.birthDate) {
        meta.appendChild(document.createElement('span')).textContent = `Nacimiento: ${formatShortDate(
          player.birthDate
        )}`;
      }
      item.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'actions';
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'secondary';
      editButton.textContent = 'Editar';
      editButton.dataset.playerId = player._id || player.id;
      actions.appendChild(editButton);
      item.appendChild(actions);

      adminPlayerList.appendChild(item);
    });
}

function renderAdminMatchList(matches = []) {
  if (!adminMatchList) return;
  adminMatchList.innerHTML = '';

  const sorted = Array.isArray(matches)
    ? [...matches].sort((a, b) => {
        const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
        const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
        return dateA - dateB;
      })
    : [];

  if (adminMatchSelect) {
    const current = adminMatchSelect.value;
    adminMatchSelect.innerHTML = '<option value="">Elige un partido pendiente o programado</option>';
    sorted.forEach((match) => {
      const option = document.createElement('option');
      option.value = match._id || match.id;
      const players = Array.isArray(match.players)
        ? match.players.map((player) => player.fullName || 'Jugador').join(' vs ')
        : 'Partido';
      const dateLabel = match.scheduledAt ? formatDate(match.scheduledAt) : 'Sin fecha';
      option.textContent = `${players} · ${dateLabel}`;
      adminMatchSelect.appendChild(option);
    });
    if (current) {
      adminMatchSelect.value = current;
    }
  }

  if (!sorted.length) {
    adminMatchList.innerHTML = '<li class="empty-state">No hay partidos activos.</li>';
    return;
  }

  sorted.forEach((match) => {
    const item = document.createElement('li');
    const categoryColor = match.category ? getCategoryColor(match.category) : '';
    const title = document.createElement('strong');
    const players = Array.isArray(match.players)
      ? match.players.map((player) => player.fullName || 'Jugador').join(' vs ')
      : 'Partido';
    title.textContent = players;
    if (categoryColor) {
      const indicator = createCategoryColorIndicator(categoryColor, match.category?.name);
      if (indicator) {
        title.classList.add('with-category-color');
        title.prepend(indicator);
      }
    }
    item.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.appendChild(document.createElement('span')).textContent = formatDate(match.scheduledAt);
    if (match.category?.name) {
      const categoryTag = document.createElement('span');
      categoryTag.className = 'tag match-category-tag';
      categoryTag.textContent = match.category.name;
      applyCategoryTagColor(categoryTag, categoryColor);
      meta.appendChild(categoryTag);
    }
    const statusTag = document.createElement('span');
    statusTag.className = `tag status-${match.status}`;
    statusTag.textContent = STATUS_LABELS[match.status] || match.status;
    meta.appendChild(statusTag);
    item.appendChild(meta);

    if (categoryColor) {
      applyCategoryColorStyles(item, categoryColor, { shadowAlpha: 0.18 });
    }

    const actions = document.createElement('div');
    actions.className = 'actions';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'secondary';
    editButton.textContent = 'Editar';
    editButton.dataset.matchId = match._id || match.id;
    actions.appendChild(editButton);

    if (match.status !== 'completado') {
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'danger';
      deleteButton.textContent = 'Eliminar';
      deleteButton.dataset.matchId = match._id || match.id;
      deleteButton.dataset.action = 'delete';
      actions.appendChild(deleteButton);
    }
    item.appendChild(actions);

    adminMatchList.appendChild(item);
  });
}

function buildPlayerCategoryIndex() {
  const index = new Map();
  const categories = Array.isArray(state.categories) ? state.categories : [];

  state.enrollments.forEach((enrollments, categoryId) => {
    const normalizedId = String(categoryId);
    const category = categories.find((item) => (item._id || item.id) === normalizedId);
    const categoryName = category?.name || 'Sin asignar';
    const items = Array.isArray(enrollments) ? enrollments : [];

    items.forEach((enrollment) => {
      const userRef = enrollment.user;
      const userId =
        (typeof userRef === 'object' && userRef !== null
          ? userRef._id || userRef.id
          : userRef) || null;
      if (!userId) return;

      const bucket = index.get(userId) || [];
      if (!bucket.some((entry) => entry.id === normalizedId)) {
        bucket.push({ id: normalizedId, name: categoryName });
      }
      index.set(userId, bucket);
    });
  });

  return index;
}

function renderPlayerDirectory() {
  if (!playerDirectoryList) return;

  if (!isAdmin()) {
    playerDirectoryList.innerHTML = '';
    if (playerDirectoryEmpty) {
      playerDirectoryEmpty.hidden = false;
      playerDirectoryEmpty.textContent = 'Disponible solo para administradores.';
    }
    if (playerDirectoryCount) {
      playerDirectoryCount.textContent = '0';
    }
    return;
  }

  const filters = state.playerDirectoryFilters || {};
  const searchTerm = (filters.search || '').toLowerCase();
  const genderFilter = filters.gender || '';
  const roleFilter = filters.role || '';
  const categoryFilter = filters.category || '';
  const players = Array.isArray(state.players) ? state.players : [];
  const categoryIndex = buildPlayerCategoryIndex();

  const filtered = players.filter((player) => {
    if (genderFilter && player.gender !== genderFilter) {
      return false;
    }
    if (roleFilter && !entityHasRole(player, roleFilter)) {
      return false;
    }
    if (searchTerm) {
      const haystack = `${player.fullName || ''} ${player.email || ''} ${player.phone || ''}`.toLowerCase();
      if (!haystack.includes(searchTerm)) {
        return false;
      }
    }
    if (categoryFilter) {
      const categories = categoryIndex.get(player._id || player.id) || [];
      if (!categories.some((entry) => entry.id === categoryFilter)) {
        return false;
      }
    }
    return true;
  });

  const sorted = filtered.slice().sort((a, b) => {
    const nameA = (a.fullName || '').toLocaleLowerCase('es');
    const nameB = (b.fullName || '').toLocaleLowerCase('es');
    return nameA.localeCompare(nameB, 'es');
  });

  playerDirectoryList.innerHTML = '';

  if (playerDirectoryCount) {
    playerDirectoryCount.textContent = String(sorted.length);
  }

  if (!sorted.length) {
    if (playerDirectoryEmpty) {
      playerDirectoryEmpty.hidden = false;
      playerDirectoryEmpty.textContent = 'Aún no hay jugadores que coincidan con el filtro seleccionado.';
    }
    return;
  }

  if (playerDirectoryEmpty) {
    playerDirectoryEmpty.hidden = true;
  }

  sorted.forEach((player) => {
    const playerId = player._id || player.id;
    const item = document.createElement('li');
    const header = buildPlayerCell(player, { includeSchedule: true });
    item.appendChild(header);

    const contact = document.createElement('div');
    contact.className = 'meta';
    if (player.email) {
      contact.appendChild(document.createElement('span')).textContent = player.email;
    }
    if (player.phone) {
      contact.appendChild(document.createElement('span')).textContent = player.phone;
    }
    const roleTag = document.createElement('span');
    roleTag.className = 'tag';
    roleTag.textContent = formatRoles(player.roles || player.role);
    contact.appendChild(roleTag);
    item.appendChild(contact);

    const details = document.createElement('div');
    details.className = 'meta';
    details.appendChild(document.createElement('span')).textContent = `Género: ${translateGender(
      player.gender
    )}`;
    details.appendChild(document.createElement('span')).textContent = `Horario: ${translateSchedule(
      player.preferredSchedule
    )}`;
    if (player.birthDate) {
      details.appendChild(document.createElement('span')).textContent = `Nacimiento: ${formatShortDate(
        player.birthDate
      )}`;
    }
    const categories = categoryIndex.get(playerId) || [];
    const categoryLabel = categories.length
      ? categories
          .map((entry) => entry.name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, 'es'))
          .join(', ')
      : 'Sin asignar';
    details.appendChild(document.createElement('span')).textContent = `Categorías: ${categoryLabel}`;
    item.appendChild(details);

    if (player.notes) {
      const notes = document.createElement('div');
      notes.className = 'meta';
      notes.appendChild(document.createElement('span')).textContent = `Notas: ${player.notes}`;
      item.appendChild(notes);
    }

    const actions = document.createElement('div');
    actions.className = 'actions';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'secondary';
    editButton.textContent = 'Editar';
    editButton.dataset.playerId = playerId;
    actions.appendChild(editButton);
    item.appendChild(actions);

    playerDirectoryList.appendChild(item);
  });
}

function resetAdminCategoryForm() {
  if (!adminCategoryForm) return;
  adminCategoryForm.reset();
  state.adminCategoryEditingId = null;
  const submit = adminCategoryForm.querySelector('.primary');
  if (submit) {
    submit.textContent = 'Guardar categoría';
  }
  if (adminCategoryCancel) {
    adminCategoryCancel.hidden = true;
  }
  if (adminCategoryForm.elements?.leagueId) {
    adminCategoryForm.elements.leagueId.value = '';
  }
  if (adminCategoryForm.elements?.color) {
    adminCategoryForm.elements.color.value = DEFAULT_CATEGORY_COLOR;
  }
}

function setAdminCategoryEditing(categoryId) {
  if (!adminCategoryForm) return;
  const category = state.categories.find((item) => (item._id || item.id) === categoryId);
  if (!category) return;

  state.adminCategoryEditingId = categoryId;
  adminCategoryForm.elements.name.value = category.name || '';
  adminCategoryForm.elements.description.value = category.description || '';
  adminCategoryForm.elements.gender.value = category.gender || 'masculino';
  adminCategoryForm.elements.skillLevel.value = category.skillLevel || '';
  if (adminCategoryForm.elements.startDate) {
    adminCategoryForm.elements.startDate.value = formatDateInput(category.startDate);
  }
  if (adminCategoryForm.elements.endDate) {
    adminCategoryForm.elements.endDate.value = formatDateInput(category.endDate);
  }
  if (adminCategoryForm.elements.leagueId) {
    adminCategoryForm.elements.leagueId.value = normalizeId(category.league) || '';
  }
  if (adminCategoryForm.elements.color) {
    adminCategoryForm.elements.color.value = getCategoryColor(category);
  }

  const submit = adminCategoryForm.querySelector('.primary');
  if (submit) {
    submit.textContent = 'Actualizar categoría';
  }
  if (adminCategoryCancel) {
    adminCategoryCancel.hidden = false;
  }
  adminCategoryForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetAdminPlayerForm() {
  if (!adminPlayerForm) return;
  adminPlayerForm.reset();
  state.adminPlayerEditingId = null;
  const submit = adminPlayerForm.querySelector('.primary');
  if (submit) {
    submit.textContent = 'Guardar usuario';
  }
  if (adminPlayerCancel) {
    adminPlayerCancel.hidden = true;
  }
}

function setAdminPlayerEditing(playerId) {
  if (!adminPlayerForm) return;
  const player = state.players.find((item) => (item._id || item.id) === playerId);
  if (!player) return;

  state.adminPlayerEditingId = playerId;
  adminPlayerForm.elements.fullName.value = player.fullName || '';
  adminPlayerForm.elements.email.value = player.email || '';
  adminPlayerForm.elements.password.value = '';
  adminPlayerForm.elements.gender.value = player.gender || 'masculino';
  adminPlayerForm.elements.role.value = player.role || 'player';
  adminPlayerForm.elements.phone.value = player.phone || '';
  adminPlayerForm.elements.preferredSchedule.value = player.preferredSchedule || 'flexible';
  adminPlayerForm.elements.notes.value = player.notes || '';

  const submit = adminPlayerForm.querySelector('.primary');
  if (submit) {
    submit.textContent = 'Actualizar usuario';
  }
  if (adminPlayerCancel) {
    adminPlayerCancel.hidden = false;
  }
  adminPlayerForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function populateAdminMatchCourtOptions(selectedValue) {
  if (!adminMatchCourt) return;

  const courtNames = getClubCourtNames();
  const targetValue =
    selectedValue !== undefined && selectedValue !== null
      ? String(selectedValue)
      : adminMatchCourt.value;

  adminMatchCourt.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = courtNames.length
    ? 'Sin pista asignada'
    : 'Añade pistas en la sección del club';
  adminMatchCourt.appendChild(placeholder);

  courtNames.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    adminMatchCourt.appendChild(option);
  });

  adminMatchCourt.title = courtNames.length
    ? 'Las pistas disponibles se gestionan en el perfil del club.'
    : 'Añade pistas en la sección del club para poder asignarlas.';

  if (targetValue && courtNames.includes(targetValue)) {
    adminMatchCourt.value = targetValue;
  } else {
    adminMatchCourt.value = '';
  }
}

function resetAdminMatchForm() {
  if (!adminMatchForm) return;
  adminMatchForm.reset();
  populateAdminMatchCourtOptions('');
  state.adminMatchEditingId = null;
  if (adminMatchSelect) {
    adminMatchSelect.value = '';
  }
  if (adminMatchCancel) {
    adminMatchCancel.hidden = true;
  }
  if (adminMatchDelete) {
    adminMatchDelete.hidden = true;
    adminMatchDelete.disabled = false;
    delete adminMatchDelete.dataset.matchId;
  }
  setStatusMessage(adminMatchStatusMessage, '', '');
}

function setAdminMatchEditing(matchId) {
  if (!adminMatchForm) return;
  setStatusMessage(adminMatchStatusMessage, '', '');
  const match = state.calendarMatches.find((item) => (item._id || item.id) === matchId);
  if (!match) return;

  state.adminMatchEditingId = matchId;
  if (adminMatchSelect) {
    adminMatchSelect.value = matchId;
  }
  if (adminMatchCategory) {
    const categoryValue = normalizeId(match.category);
    adminMatchCategory.value = categoryValue || '';
  }

  const playerIds = Array.isArray(match.players)
    ? match.players.map((player) => normalizeId(player))
    : [];
  const [firstPlayer, secondPlayer] = playerIds;

  if (adminMatchPlayer1) {
    if (firstPlayer && !Array.from(adminMatchPlayer1.options).some((opt) => opt.value === firstPlayer)) {
      const option = document.createElement('option');
      option.value = firstPlayer;
      option.textContent = match.players?.[0]?.fullName || 'Jugador';
      adminMatchPlayer1.appendChild(option);
    }
    adminMatchPlayer1.value = firstPlayer || '';
  }
  if (adminMatchPlayer2) {
    if (secondPlayer && !Array.from(adminMatchPlayer2.options).some((opt) => opt.value === secondPlayer)) {
      const option = document.createElement('option');
      option.value = secondPlayer;
      option.textContent = match.players?.[1]?.fullName || 'Jugador';
      adminMatchPlayer2.appendChild(option);
    }
    adminMatchPlayer2.value = secondPlayer || '';
  }

  if (adminMatchStatus) {
    adminMatchStatus.value = match.status || 'pendiente';
  }
  if (adminMatchDate) {
    adminMatchDate.value = formatDateTimeLocal(match.scheduledAt);
  }
  populateAdminMatchCourtOptions(match.court || '');
  if (adminMatchNotes) {
    const notes = match.result?.notes || match.notes || '';
    adminMatchNotes.value = notes;
  }

  if (adminMatchCancel) {
    adminMatchCancel.hidden = false;
  }
  if (adminMatchDelete) {
    adminMatchDelete.hidden = match.status === 'completado';
    adminMatchDelete.disabled = match.status === 'completado';
    adminMatchDelete.dataset.matchId = matchId;
  }
  adminMatchForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function loadEnrollments(categoryId) {
  if (!categoryId) {
    return [];
  }

  if (state.enrollments.has(categoryId)) {
    return state.enrollments.get(categoryId);
  }

  const enrollments = await request(`/categories/${categoryId}/enrollments`);
  const sorted = Array.isArray(enrollments)
    ? [...enrollments].sort((a, b) => {
        const nameA = a?.user?.fullName || '';
        const nameB = b?.user?.fullName || '';
        return nameA.localeCompare(nameB, 'es');
      })
    : [];
  state.enrollments.set(categoryId, sorted);
  return sorted;
}

async function loadEnrollmentRequests(categoryId, { force = false } = {}) {
  if (!categoryId) {
    return [];
  }

  if (!force && state.enrollmentRequests.has(categoryId)) {
    return state.enrollmentRequests.get(categoryId);
  }

  const requests = await request(`/categories/${categoryId}/enrollment-requests`);
  const sorted = Array.isArray(requests)
    ? [...requests].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : [];
  state.enrollmentRequests.set(categoryId, sorted);
  return sorted;
}

function buildCategoryPayload(formData, isEditing = false) {
  const payload = {
    name: (formData.get('name') || '').trim(),
    gender: formData.get('gender'),
  };

  const description = (formData.get('description') || '').trim();
  if (description) {
    payload.description = description;
  } else if (isEditing) {
    payload.description = null;
  }

  const skillLevel = (formData.get('skillLevel') || '').trim();
  if (skillLevel) {
    payload.skillLevel = skillLevel;
  }

  if (formData.has('startDate')) {
    const startDate = formData.get('startDate');
    if (startDate) {
      payload.startDate = startDate;
    } else if (isEditing) {
      payload.startDate = null;
    }
  }

  if (formData.has('endDate')) {
    const endDate = formData.get('endDate');
    if (endDate) {
      payload.endDate = endDate;
    } else if (isEditing) {
      payload.endDate = null;
    }
  }

  const status = formData.get('status');
  if (status) {
    payload.status = status;
  }

  const leagueId = (formData.get('leagueId') || '').trim();
  if (leagueId) {
    payload.leagueId = leagueId;
  }

  if (formData.has('minimumAge')) {
    const rawMinimumAge = formData.get('minimumAge');
    if (rawMinimumAge !== null && rawMinimumAge !== undefined && rawMinimumAge !== '') {
      const parsedMinimumAge = Number.parseInt(rawMinimumAge, 10);
      if (Number.isFinite(parsedMinimumAge) && parsedMinimumAge >= 0) {
        payload.minimumAge = parsedMinimumAge;
      }
    } else if (isEditing) {
      payload.minimumAge = null;
    }
  }

  if (formData.has('color')) {
    const colorValue = (formData.get('color') || '').trim();
    if (colorValue) {
      payload.color = colorValue;
    } else if (isEditing) {
      payload.color = null;
    }
  }

  return payload;
}

async function submitCategoryFormData({ form, categoryId, statusElement }) {
  if (!form) return false;
  const formData = new FormData(form);
  const isEditing = Boolean(categoryId);
  const payload = buildCategoryPayload(formData, isEditing);

  if (!payload.name) {
    setStatusMessage(statusElement, 'error', 'El nombre de la categoría es obligatorio.');
    return false;
  }

  if (!payload.leagueId) {
    setStatusMessage(statusElement, 'error', 'Selecciona una liga para la categoría.');
    return false;
  }

  if (
    !payload.skillLevel ||
    !CATEGORY_SKILL_LEVEL_OPTIONS.some((option) => option.value === payload.skillLevel)
  ) {
    setStatusMessage(statusElement, 'error', 'Selecciona un nivel para la categoría.');
    return false;
  }

  setStatusMessage(
    statusElement,
    'info',
    isEditing ? 'Actualizando categoría...' : 'Creando categoría...'
  );

  try {
    const url = isEditing ? `/categories/${categoryId}` : '/categories';
    const method = isEditing ? 'PATCH' : 'POST';
    await request(url, { method, body: payload });
    setStatusMessage(
      statusElement,
      'success',
      isEditing ? 'Categoría actualizada.' : 'Categoría creada.'
    );
    await loadAllData();
    return true;
  } catch (error) {
    setStatusMessage(statusElement, 'error', error.message);
    return false;
  }
}

function buildLeaguePayload(formData, isEditing = false) {
  const payload = {
    name: (formData.get('name') || '').trim(),
    status: formData.get('status') || 'activa',
  };

  const yearRaw = (formData.get('year') || '').trim();
  if (yearRaw) {
    const parsedYear = Number.parseInt(yearRaw, 10);
    if (!Number.isNaN(parsedYear)) {
      payload.year = parsedYear;
    }
  }

  const description = (formData.get('description') || '').trim();
  if (description) {
    payload.description = description;
  } else if (isEditing) {
    payload.description = null;
  }

  const startDate = formData.get('startDate');
  if (startDate) {
    payload.startDate = startDate;
  } else if (isEditing) {
    payload.startDate = null;
  }

  const endDate = formData.get('endDate');
  if (endDate) {
    payload.endDate = endDate;
  } else if (isEditing) {
    payload.endDate = null;
  }

  const categories = formData.getAll('categories').filter(Boolean);
  if (categories.length || isEditing) {
    payload.categories = categories;
  }

  return payload;
}

async function submitLeagueFormData({ form, leagueId, statusElement }) {
  if (!form) return false;
  const formData = new FormData(form);
  const isEditing = Boolean(leagueId);
  const payload = buildLeaguePayload(formData, isEditing);

  if (!payload.name) {
    setStatusMessage(statusElement, 'error', 'El nombre de la liga es obligatorio.');
    return false;
  }

  setStatusMessage(
    statusElement,
    'info',
    isEditing ? 'Actualizando liga...' : 'Creando liga...'
  );

  try {
    const url = isEditing ? `/leagues/${leagueId}` : '/leagues';
    const method = isEditing ? 'PATCH' : 'POST';
    await request(url, { method, body: payload });
    setStatusMessage(
      statusElement,
      'success',
      isEditing ? 'Liga actualizada.' : 'Liga creada.'
    );
    await loadAllData();
    return true;
  } catch (error) {
    setStatusMessage(statusElement, 'error', error.message);
    return false;
  }
}

function buildPlayerPayload(formData, isEditing = false) {
  const payload = {
    fullName: (formData.get('fullName') || '').trim(),
    email: (formData.get('email') || '').trim(),
    gender: formData.get('gender'),
    phone: (formData.get('phone') || '').trim(),
    preferredSchedule: formData.get('preferredSchedule'),
    birthDate: formData.get('birthDate'),
  };

  const roles = formData.getAll('roles');
  const normalizedRoles = roles.length ? roles : ['player'];
  if (!normalizedRoles.includes('player')) {
    normalizedRoles.push('player');
  }
  payload.roles = Array.from(new Set(normalizedRoles));

  const notes = (formData.get('notes') || '').trim();
  if (notes || isEditing) {
    payload.notes = notes;
  }

  payload.notifyMatchRequests = formData.has('notifyMatchRequests');
  payload.notifyMatchResults = formData.has('notifyMatchResults');

  const password = formData.get('password');
  if (password) {
    payload.password = password;
  }

  return payload;
}

async function submitPlayerFormData({ form, playerId, statusElement }) {
  if (!form) return false;
  const formData = new FormData(form);
  const isEditing = Boolean(playerId);
  const payload = buildPlayerPayload(formData, isEditing);

  if (!payload.fullName || !payload.email || !payload.phone || !payload.birthDate) {
    setStatusMessage(
      statusElement,
      'error',
      'Nombre, correo, teléfono y fecha de nacimiento son obligatorios.'
    );
    return false;
  }

  if (!isEditing && !payload.password) {
    setStatusMessage(statusElement, 'error', 'Asigna una contraseña para el nuevo usuario.');
    return false;
  }

  setStatusMessage(
    statusElement,
    'info',
    isEditing ? 'Actualizando usuario...' : 'Creando usuario...'
  );

  try {
    const photoData = await extractPhotoFromForm(form);
    if (photoData) {
      payload.photo = photoData;
    }

    const url = isEditing ? `/players/${playerId}` : '/players';
    const method = isEditing ? 'PATCH' : 'POST';
    await request(url, { method, body: payload });
    setStatusMessage(
      statusElement,
      'success',
      isEditing ? 'Usuario actualizado.' : 'Usuario creado.'
    );
    await loadAllData();
    return true;
  } catch (error) {
    setStatusMessage(statusElement, 'error', error.message);
    return false;
  }
}

function buildMatchPayload(formData, isEditing = false) {
  const payload = {};
  const categoryId = formData.get('categoryId');
  if (categoryId) {
    payload.categoryId = categoryId;
  }

  const scheduledAt = formData.get('scheduledAt');
  if (scheduledAt) {
    payload.scheduledAt = scheduledAt;
  } else if (isEditing) {
    payload.scheduledAt = null;
  }

  const status = formData.get('status');
  if (status) {
    payload.status = status;
  }

  const court = (formData.get('court') || '').trim();
  if (court) {
    payload.court = court;
  } else if (isEditing) {
    payload.court = null;
  }

  const notes = (formData.get('notes') || '').trim();
  if (notes) {
    payload.notes = notes;
  } else if (isEditing) {
    payload.notes = null;
  }

  return payload;
}

async function submitMatchFormData({ form, matchId, statusElement, creating = false }) {
  if (!form) return false;
  const formData = new FormData(form);
  const isEditing = !creating && Boolean(matchId);
  const payload = buildMatchPayload(formData, isEditing);

  const player1 = formData.get('player1');
  const player2 = formData.get('player2');
  const selectedPlayers = [player1, player2].filter(Boolean);

  if (selectedPlayers.length === 1) {
    setStatusMessage(statusElement, 'error', 'Selecciona ambos jugadores para el partido.');
    return false;
  }

  if (selectedPlayers.length === 2) {
    if (selectedPlayers[0] === selectedPlayers[1]) {
      setStatusMessage(statusElement, 'error', 'Los jugadores deben ser distintos.');
      return false;
    }
    payload.players = selectedPlayers;
  } else if (creating) {
    setStatusMessage(statusElement, 'error', 'Selecciona dos jugadores para crear el partido.');
    return false;
  }

  if (creating && !payload.categoryId) {
    setStatusMessage(statusElement, 'error', 'Selecciona una categoría para el partido.');
    return false;
  }

  setStatusMessage(
    statusElement,
    'info',
    creating ? 'Creando partido...' : 'Actualizando partido...'
  );

  try {
    const url = creating ? '/matches' : `/matches/${matchId}`;
    const method = creating ? 'POST' : 'PATCH';
    await request(url, { method, body: payload });
    setStatusMessage(
      statusElement,
      'success',
      creating ? 'Partido creado.' : 'Partido actualizado.'
    );
    await loadAllData();
    return true;
  } catch (error) {
    setStatusMessage(statusElement, 'error', error.message);
    return false;
  }
}

async function deleteMatchById(matchId, { statusElement, button } = {}) {
  if (!matchId || !isAdmin()) {
    return false;
  }

  const matchSources = [
    state.calendarMatches,
    state.upcomingMatches,
    state.pendingApprovalMatches,
    state.completedMatches,
    state.myMatches,
  ];

  let match = null;
  for (const source of matchSources) {
    if (!Array.isArray(source)) continue;
    const found = source.find((item) => normalizeId(item) === matchId);
    if (found) {
      match = found;
      break;
    }
  }
  const playersLabel = Array.isArray(match?.players)
    ? match.players.map((player) => player.fullName || player.email || 'Jugador').join(' vs ')
    : '';
  const message = playersLabel
    ? `¿Seguro que deseas eliminar el partido ${playersLabel}?`
    : '¿Seguro que deseas eliminar este partido?';

  const confirmed = window.confirm(message);
  if (!confirmed) {
    return false;
  }

  if (button) {
    button.disabled = true;
  }

  if (statusElement) {
    setStatusMessage(statusElement, 'info', 'Eliminando partido...');
  }

  try {
    await request(`/matches/${matchId}`, { method: 'DELETE' });
    if (statusElement) {
      setStatusMessage(statusElement, 'success', 'Partido eliminado correctamente.');
    } else {
      showGlobalMessage('Partido eliminado correctamente.', 'success');
    }
    if (state.adminMatchEditingId === matchId) {
      resetAdminMatchForm();
    }
    await loadAllData();
    return true;
  } catch (error) {
    if (statusElement) {
      setStatusMessage(statusElement, 'error', error.message);
    } else {
      showGlobalMessage(error.message, 'error');
    }
    return false;
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

async function populateMatchPlayerSelects(form, categoryId, selectedPlayers = [], statusElement) {
  const player1Select = form?.elements?.player1;
  const player2Select = form?.elements?.player2;
  if (!player1Select || !player2Select) return;

  player1Select.innerHTML = '<option value="">Selecciona jugador 1</option>';
  player2Select.innerHTML = '<option value="">Selecciona jugador 2</option>';
  player1Select.disabled = true;
  player2Select.disabled = true;

  if (!categoryId) {
    player1Select.disabled = false;
    player2Select.disabled = false;
    return;
  }

  try {
    const enrollments = await loadEnrollments(categoryId);
    enrollments.forEach((enrollment) => {
      const userId = normalizeId(enrollment.user);
      if (!userId) return;
      const label = enrollment.user?.fullName || enrollment.user?.email || 'Jugador';
      const optionOne = new Option(label, userId);
      const optionTwo = new Option(label, userId);
      player1Select.appendChild(optionOne);
      player2Select.appendChild(optionTwo);
    });

    player1Select.disabled = false;
    player2Select.disabled = false;

    if (selectedPlayers[0]) {
      player1Select.value = selectedPlayers[0];
    }
    if (selectedPlayers[1]) {
      player2Select.value = selectedPlayers[1];
    }
  } catch (error) {
    player1Select.disabled = false;
    player2Select.disabled = false;
    setStatusMessage(statusElement, 'error', error.message);
  }
}

function openCategoryModal(categoryId = '') {
  if (!isAdmin()) return;
  const normalizedId = categoryId || '';
  const category = normalizedId
    ? state.categories.find((item) => normalizeId(item) === normalizedId)
    : null;

  const form = document.createElement('form');
  form.className = 'form';
  const skillLevelOptions = CATEGORY_SKILL_LEVEL_OPTIONS.map(
    (option) => `<option value="${option.value}">${option.label}</option>`
  ).join('');
  form.innerHTML = `
    <label>
      Nombre
      <input type="text" name="name" required />
    </label>
    <label>
      Descripción
      <textarea name="description" rows="2" maxlength="280" placeholder="Detalles opcionales"></textarea>
    </label>
    <label data-field="league">
      Liga
      <select name="leagueId" required>
        <option value="">Selecciona una liga</option>
      </select>
      <span class="form-hint">Selecciona la liga a la que pertenecerá la categoría.</span>
    </label>
    <div class="form-grid">
      <label>
        Género
        <select name="gender" required>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
        </select>
      </label>
      <label>
        Nivel
        <select name="skillLevel" required>
          <option value="">Selecciona un nivel</option>
          ${skillLevelOptions}
        </select>
      </label>
    </div>
    <label>
      Estado
      <select name="status" required>
        <option value="inscripcion">Inscripción abierta</option>
        <option value="en_curso">En curso</option>
      </select>
      <span class="form-hint">Cuando está en curso no se aceptan nuevas inscripciones.</span>
    </label>
    <label>
      Color identificativo
      <input type="color" name="color" value="${DEFAULT_CATEGORY_COLOR}" />
      <span class="form-hint">Se utilizará para identificar la categoría en listas y calendarios.</span>
    </label>
    <label>
      Edad mínima (años)
      <input type="number" name="minimumAge" min="0" step="1" placeholder="Opcional" />
      <span class="form-hint">Los jugadores deben cumplir esta edad durante el año natural de la liga.</span>
    </label>
    <div class="form-actions">
      <button type="submit" class="primary">${category ? 'Actualizar' : 'Crear'} categoría</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
    </div>
  `;

  form.elements.name.value = category?.name || '';
  form.elements.description.value = category?.description || '';
  form.elements.gender.value = category?.gender || 'masculino';
  form.elements.skillLevel.value = category?.skillLevel || '';
  if (form.elements.minimumAge) {
    form.elements.minimumAge.value =
      category?.minimumAge === undefined || category?.minimumAge === null
        ? ''
        : Number(category.minimumAge);
  }
  if (form.elements.status) {
    form.elements.status.value = category?.status || 'inscripcion';
  }
  if (form.elements.color) {
    const colorValue = category ? getCategoryColor(category) : DEFAULT_CATEGORY_COLOR;
    form.elements.color.value = colorValue || DEFAULT_CATEGORY_COLOR;
  }

  const leagueSelect = form.elements.leagueId;
  const leagueField = form.querySelector('[data-field="league"]');
  const leagueHint = leagueField?.querySelector('.form-hint');
  const currentLeagueId = normalizeId(category?.league);
  if (leagueSelect) {
    const availableLeagues = Array.isArray(state.leagues) ? [...state.leagues] : [];
    if (!availableLeagues.length && category?.league && typeof category.league === 'object') {
      availableLeagues.push(category.league);
    }

    availableLeagues
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
      .forEach((league) => {
        const leagueId = normalizeId(league);
        if (!leagueId) return;
        const labelParts = [league.name || 'Liga'];
        if (league.year) {
          labelParts.push(league.year);
        }
        const option = document.createElement('option');
        option.value = leagueId;
        option.textContent = labelParts.join(' · ');
        const isClosed = league.status === 'cerrada';
        if (isClosed && leagueId !== currentLeagueId) {
          option.disabled = true;
          option.textContent += ' (cerrada)';
        }
        leagueSelect.appendChild(option);
      });

    let hasEnabledOption = Array.from(leagueSelect.options).some((option) => !option.disabled && option.value);

    if (currentLeagueId) {
      leagueSelect.value = currentLeagueId;
      hasEnabledOption = true;
    } else if (hasEnabledOption) {
      const preferred = availableLeagues.find((league) => league.status !== 'cerrada');
      if (preferred) {
        leagueSelect.value = normalizeId(preferred);
      } else if (leagueSelect.options.length > 1) {
        leagueSelect.selectedIndex = 1;
      }
    }

    leagueSelect.disabled = !hasEnabledOption;

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton && !category) {
      submitButton.disabled = leagueSelect.disabled;
    }

    if (leagueHint) {
      leagueHint.textContent = leagueSelect.disabled && !category
        ? 'Crea una liga activa antes de registrar categorías.'
        : 'Selecciona la liga a la que pertenecerá la categoría.';
    }
  }

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const succeeded = await submitCategoryFormData({
      form,
      categoryId: normalizedId,
      statusElement: status,
    });
    if (succeeded) {
      closeModal();
    }
  });

  const cancelButton = form.querySelector('[data-action="cancel"]');
  cancelButton?.addEventListener('click', () => {
    setStatusMessage(status, '', '');
    closeModal();
  });

  openModal({
    title: category ? 'Editar categoría' : 'Nueva categoría',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });
}

function openLeagueModal(leagueId = '') {
  if (!isAdmin()) return;
  const normalizedId = leagueId || '';
  const league = normalizedId
    ? state.leagues.find((item) => normalizeId(item) === normalizedId)
    : null;

  const form = document.createElement('form');
  form.className = 'form';
  form.innerHTML = `
    <label>
      Nombre
      <input type="text" name="name" required />
    </label>
    <div class="form-grid">
      <label>
        Año
        <input type="number" name="year" min="2000" placeholder="Opcional" />
      </label>
      <label>
        Estado
        <select name="status" required>
          <option value="activa">${LEAGUE_STATUS_LABELS.activa}</option>
          <option value="cerrada">${LEAGUE_STATUS_LABELS.cerrada}</option>
        </select>
      </label>
    </div>
    <label>
      Descripción
      <textarea name="description" rows="2" maxlength="280" placeholder="Detalles opcionales"></textarea>
    </label>
    <div class="form-grid">
      <label>
        Inicio
        <input type="date" name="startDate" />
      </label>
      <label>
        Fin
        <input type="date" name="endDate" />
      </label>
    </div>
    <label>
      Categorías asociadas
      <select name="categories" multiple size="6"></select>
      <span class="form-hint">Selecciona categorías existentes para vincularlas a esta liga.</span>
    </label>
    <div class="form-actions">
      <button type="submit" class="primary">${league ? 'Actualizar' : 'Crear'} liga</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
    </div>
  `;

  form.elements.name.value = league?.name || '';
  if (form.elements.year) {
    form.elements.year.value = league?.year ? String(league.year) : '';
  }
  if (form.elements.status) {
    form.elements.status.value = league?.status || 'activa';
  }
  form.elements.description.value = league?.description || '';
  form.elements.startDate.value = formatDateInput(league?.startDate);
  form.elements.endDate.value = formatDateInput(league?.endDate);

  const categoriesSelect = form.elements.categories;
  if (categoriesSelect) {
    const categories = Array.isArray(state.categories) ? [...state.categories] : [];
    const selectedIds = league
      ? Array.isArray(league.categories)
        ? league.categories.map((category) => normalizeId(category))
        : []
      : [];

    categories
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
      .forEach((category) => {
        const categoryId = normalizeId(category);
        if (!categoryId) return;
        const option = document.createElement('option');
        option.value = categoryId;
        const parts = [category.name || 'Categoría', translateGender(category.gender)];
        const linkedLeague = resolveLeague(category.league);
        const linkedLeagueId = normalizeId(linkedLeague);
        if (linkedLeagueId && linkedLeagueId !== normalizedId) {
          const linkedLeagueName = linkedLeague?.name || 'Asignada';
          parts.push(`Liga ${linkedLeagueName}`);
          option.disabled = true;
        }
        option.textContent = parts.join(' · ');
        option.selected = selectedIds.includes(categoryId);
        categoriesSelect.appendChild(option);
      });

    const optionCount = categoriesSelect.options.length || 3;
    categoriesSelect.size = Math.min(8, Math.max(3, optionCount));
  }

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const succeeded = await submitLeagueFormData({
      form,
      leagueId: normalizedId,
      statusElement: status,
    });
    if (succeeded) {
      closeModal();
    }
  });

  const cancelButton = form.querySelector('[data-action="cancel"]');
  cancelButton?.addEventListener('click', () => {
    setStatusMessage(status, '', '');
    closeModal();
  });

  openModal({
    title: league ? 'Editar liga' : 'Nueva liga',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });
}

function openPlayerModal(playerId = '') {
  if (!isAdmin()) return;
  const normalizedId = playerId || '';
  const player = normalizedId
    ? state.players.find((item) => normalizeId(item) === normalizedId)
    : null;

  const scheduleOptions = Object.entries(SCHEDULE_LABELS)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');

  const form = document.createElement('form');
  form.className = 'form';
  form.enctype = 'multipart/form-data';
  form.innerHTML = `
    <label>
      Nombre completo
      <input type="text" name="fullName" required />
    </label>
    <label>
      Correo electrónico
      <input type="email" name="email" required />
    </label>
    <label>
      Contraseña
      <input type="password" name="password" minlength="8" ${player ? '' : 'required'} />
      <span class="form-hint">${
        player
          ? 'Deja vacío para mantener la contraseña actual.'
          : 'Mínimo 8 caracteres para nuevos usuarios.'
      }</span>
    </label>
    <div class="form-grid">
      <label>
        Género
        <select name="gender" required>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
        </select>
      </label>
      <fieldset class="checkbox-group">
        <legend>Roles</legend>
        <label class="checkbox-option">
          <input type="checkbox" name="roles" value="player" />
          Jugador
        </label>
        <label class="checkbox-option">
          <input type="checkbox" name="roles" value="admin" />
          Administrador
        </label>
      </fieldset>
    </div>
    <label>
      Fecha de nacimiento
      <input type="date" name="birthDate" required />
    </label>
    <label>
      Teléfono
      <input type="tel" name="phone" required />
    </label>
    <label>
      Fotografía
      <input type="file" name="photo" accept="image/*" />
      <span class="form-hint">Imágenes en Base64 hasta 2&nbsp;MB. Deja vacío para conservar la actual.</span>
    </label>
    <label>
      Horario preferido
      <select name="preferredSchedule" required>${scheduleOptions}</select>
    </label>
    <label>
      Notas
      <textarea name="notes" rows="2" maxlength="500" placeholder="Preferencias adicionales"></textarea>
    </label>
    <div class="form-grid form-grid--stacked">
      <label class="checkbox-option">
        <input type="checkbox" name="notifyMatchRequests" value="true" />
        Enviar notificaciones cuando reciba solicitudes de partido
      </label>
      <label class="checkbox-option">
        <input type="checkbox" name="notifyMatchResults" value="true" />
        Avisar cuando se confirme el resultado de un partido
      </label>
    </div>
    <div class="form-actions">
      <button type="submit" class="primary">${player ? 'Actualizar' : 'Crear'} jugador</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
      ${
        player
          ? '<button type="button" class="danger" data-action="delete">Eliminar jugador</button>'
          : ''
      }
    </div>
  `;

  form.elements.fullName.value = player?.fullName || '';
  form.elements.email.value = player?.email || '';
  form.elements.gender.value = player?.gender || 'masculino';
  form.elements.birthDate.value = formatDateInput(player?.birthDate);
  form.elements.phone.value = player?.phone || '';
  form.elements.preferredSchedule.value = player?.preferredSchedule || 'flexible';
  form.elements.notes.value = player?.notes || '';
  form.elements.notifyMatchRequests.checked = player ? player.notifyMatchRequests !== false : true;
  form.elements.notifyMatchResults.checked = player ? player.notifyMatchResults !== false : true;

  const roleInputs = Array.from(form.querySelectorAll('input[name="roles"]'));
  const currentRoles = Array.isArray(player?.roles)
    ? player.roles
    : player?.role
    ? [player.role]
    : ['player'];
  roleInputs.forEach((input) => {
    if (input.value === 'player') {
      input.checked = true;
    }
    if (currentRoles.includes(input.value)) {
      input.checked = true;
    } else if (input.value !== 'player') {
      input.checked = false;
    }
  });

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const succeeded = await submitPlayerFormData({
      form,
      playerId: normalizedId,
      statusElement: status,
    });
    if (succeeded) {
      closeModal();
    }
  });

  const cancelButton = form.querySelector('[data-action="cancel"]');
  cancelButton?.addEventListener('click', () => {
    setStatusMessage(status, '', '');
    closeModal();
  });

  const deleteButton = form.querySelector('[data-action="delete"]');
  deleteButton?.addEventListener('click', async () => {
    if (!normalizedId) return;
    const confirmed = window.confirm('¿Seguro que deseas eliminar este jugador?');
    if (!confirmed) return;

    setStatusMessage(status, 'info', 'Eliminando jugador...');
    try {
      await request(`/players/${normalizedId}`, { method: 'DELETE' });
      setStatusMessage(status, 'success', 'Jugador eliminado.');
      closeModal();
      await loadAllData();
    } catch (error) {
      setStatusMessage(status, 'error', error.message);
    }
  });

  openModal({
    title: player ? 'Editar jugador' : 'Nuevo jugador',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });
}

function openMatchModal(matchId = '') {
  if (!isAdmin()) return;
  const normalizedId = matchId || '';
  let match = null;
  if (normalizedId) {
    const matchSources = [
      state.calendarMatches,
      state.myMatches,
      state.upcomingMatches,
      state.pendingApprovalMatches,
      state.completedMatches,
    ];

    for (const source of matchSources) {
      if (!Array.isArray(source)) continue;
      const found = source.find((item) => normalizeId(item) === normalizedId);
      if (found) {
        match = found;
        break;
      }
    }
  }

  const categoryOptions = Array.isArray(state.categories)
    ? state.categories
        .map((category) => {
          const id = normalizeId(category);
          return id
            ? `<option value="${id}">${category.name || 'Categoría'}</option>`
            : '';
        })
        .join('')
    : '';

  const statusOptions = Object.entries(STATUS_LABELS)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');

  const courtNames = getClubCourtNames();

  const courtOptions = courtNames
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join('');

  const courtFieldMarkup = courtNames.length
    ? `
    <label>
      Pista
      <select name="court">
        <option value="">Sin pista asignada</option>
        ${courtOptions}
      </select>
      <span class="form-hint">Las pistas disponibles se gestionan en el perfil del club.</span>
    </label>
  `
    : `
    <label>
      Pista
      <input type="text" name="court" placeholder="Añade pistas en la sección del club" disabled />
      <span class="form-hint">Añade pistas en la sección del club para poder asignarlas.</span>
    </label>
  `;

  const form = document.createElement('form');
  form.className = 'form';
  form.innerHTML = `
    <label>
      Categoría
      <select name="categoryId" required>
        <option value="">Selecciona una categoría</option>
        ${categoryOptions}
      </select>
    </label>
    <div class="form-grid">
      <label>
        Jugador 1
        <select name="player1" required>
          <option value="">Selecciona jugador 1</option>
        </select>
      </label>
      <label>
        Jugador 2
        <select name="player2" required>
          <option value="">Selecciona jugador 2</option>
        </select>
      </label>
    </div>
    <label>
      Estado
      <select name="status" required>
        ${statusOptions}
      </select>
    </label>
    <label>
      Fecha y hora
      <input type="datetime-local" name="scheduledAt" step="${CALENDAR_TIME_SLOT_STEP_SECONDS}" />
      <span class="form-hint">Déjalo vacío para mantener el partido pendiente.</span>
    </label>
    ${courtFieldMarkup}
    <label>
      Notas internas
      <textarea name="notes" rows="3" maxlength="500" placeholder="Comentarios o recordatorios"></textarea>
    </label>
    <div class="form-actions">
      <button type="submit" class="primary">${match ? 'Actualizar' : 'Crear'} partido</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
    </div>
  `;

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  const categoryField = form.elements.categoryId;
  const scheduledField = form.elements.scheduledAt;
  const statusField = form.elements.status;
  const courtField = form.elements.court;
  const notesField = form.elements.notes;

  const categoryValue = match ? normalizeId(match.category) : '';
  if (categoryValue) {
    categoryField.value = categoryValue;
  }
  if (statusField) {
    statusField.value = match?.status || 'pendiente';
  }
  if (scheduledField) {
    scheduledField.value = formatDateTimeLocal(match?.scheduledAt);
  }
  if (courtField) {
    const courtValue = match?.court || '';
    if (courtValue && courtField.tagName === 'SELECT') {
      const options = Array.from(courtField.options || []);
      const hasOption = options.some((option) => option.value === courtValue);
      if (!hasOption) {
        const option = document.createElement('option');
        option.value = courtValue;
        option.textContent = courtValue;
        courtField.appendChild(option);
      }
    }
    courtField.value = courtValue;
  }
  if (notesField) {
    notesField.value = match?.result?.notes || match?.notes || '';
  }

  const selectedPlayers = Array.isArray(match?.players)
    ? match.players.map((player) => normalizeId(player))
    : [];

  populateMatchPlayerSelects(form, categoryField.value, selectedPlayers, status).catch((error) => {
    console.warn('No fue posible cargar jugadores inscritos', error);
  });

  categoryField.addEventListener('change', (event) => {
    setStatusMessage(status, '', '');
    populateMatchPlayerSelects(form, event.target.value, [], status).catch((error) => {
      console.warn('No fue posible cargar jugadores inscritos', error);
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const succeeded = await submitMatchFormData({
      form,
      matchId: normalizedId,
      statusElement: status,
      creating: !match,
    });
    if (succeeded) {
      closeModal();
    }
  });

  const cancelButton = form.querySelector('[data-action="cancel"]');
  cancelButton?.addEventListener('click', () => {
    setStatusMessage(status, '', '');
    closeModal();
  });

  openModal({
    title: match ? 'Editar partido' : 'Nuevo partido',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });
}

function openClubModal() {
  if (!isAdmin()) return;

  const club = state.club || {};
  const form = document.createElement('form');
  form.className = 'form';
  form.innerHTML = `
    <div class="form-grid">
      <label>
        Nombre del club
        <input type="text" name="name" required />
      </label>
      <label>
        Lema o eslogan
        <input type="text" name="slogan" maxlength="120" />
      </label>
    </div>
    <label>
      Descripción
      <textarea name="description" rows="3" maxlength="600" placeholder="Presentación del club y servicios principales"></textarea>
    </label>
    <div class="form-grid">
      <label>
        Dirección
        <input type="text" name="address" maxlength="160" />
      </label>
      <label>
        Teléfono de contacto
        <input type="text" name="contactPhone" maxlength="40" />
      </label>
    </div>
    <div class="form-grid">
      <label>
        Correo electrónico
        <input type="email" name="contactEmail" maxlength="160" />
      </label>
      <label>
        Sitio web
        <input type="text" name="website" placeholder="ej. clubtenis.com" maxlength="160" />
      </label>
    </div>
    <label>
      Logotipo
      <input type="file" name="logo" accept="image/*" />
      <span class="form-hint">El logotipo se almacena en la base de datos (máx. 2&nbsp;MB).</span>
    </label>
    <section class="form-section">
      <div class="form-section__header">
        <h3>Horarios preferentes</h3>
        <p class="form-hint">Define franjas horarias por día y ajusta su horario.</p>
      </div>
      <div data-mount="schedules"></div>
    </section>
    <section class="form-section">
      <div class="form-section__header">
        <h3>Pistas disponibles</h3>
        <p class="form-hint">Añade cada pista con sus características principales.</p>
      </div>
      <div data-mount="courts"></div>
    </section>
    <label>
      Servicios del club
      <textarea
        name="facilities"
        rows="3"
        placeholder="Una línea por servicio destacado"
      ></textarea>
    </label>
    <div class="form-actions">
      <button type="submit" class="primary">Guardar cambios</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
    </div>
  `;

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  const schedulesMount = form.querySelector('[data-mount="schedules"]');
  const schedulesEditor = createSchedulesEditor(club.schedules);
  schedulesMount?.appendChild(schedulesEditor.element);

  const courtsMount = form.querySelector('[data-mount="courts"]');
  const courtsEditor = createCourtsEditor(club.courts);
  courtsMount?.appendChild(courtsEditor.element);

  form.elements.name.value = club.name || '';
  form.elements.slogan.value = club.slogan || '';
  form.elements.description.value = club.description || '';
  form.elements.address.value = club.address || '';
  form.elements.contactPhone.value = club.contactPhone || '';
  form.elements.contactEmail.value = club.contactEmail || '';
  form.elements.website.value = club.website || '';
  form.elements.facilities.value = Array.isArray(club.facilities) ? club.facilities.join('\n') : '';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!isAdmin()) return;

    const formData = new FormData(form);
    const schedules = schedulesEditor?.getValue?.() || [];
    const courts = courtsEditor?.getValue?.() || [];

    const payload = {
      name: formData.get('name')?.toString().trim() || '',
      slogan: formData.get('slogan')?.toString().trim() || '',
      description: formData.get('description')?.toString().trim() || '',
      address: formData.get('address')?.toString().trim() || '',
      contactPhone: formData.get('contactPhone')?.toString().trim() || '',
      contactEmail: formData.get('contactEmail')?.toString().trim() || '',
      website: formData.get('website')?.toString().trim() || '',
      schedules,
      courts,
      facilities: parseFacilitiesInput(formData.get('facilities')?.toString() || ''),
    };

    try {
      const logoData = await extractPhotoFromForm(form, 'logo');
      if (logoData !== undefined) {
        payload.logo = logoData;
      }
    } catch (error) {
      setStatusMessage(status, 'error', error.message);
      return;
    }

    setStatusMessage(status, 'info', 'Guardando cambios del club...');

    try {
      const updated = await request('/club', { method: 'PUT', body: payload });
      const fallbackClub = {
        ...(state.club || {}),
        ...payload,
      };
      const nextClub = updated && typeof updated === 'object' ? updated : fallbackClub;
      renderClubProfile(nextClub);
      setStatusMessage(status, 'success', 'Información actualizada correctamente.');
      closeModal();
      showGlobalMessage('Información del club actualizada.');
    } catch (error) {
      setStatusMessage(status, 'error', error.message);
    }
  });

  form.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
    setStatusMessage(status, '', '');
    closeModal();
  });

  openModal({
    title: 'Editar información del club',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });
}

function openRulesEditorModal() {
  if (!isAdmin()) return;

  const club = state.club || {};
  const existingContent = getRegulationHtml(club.regulation);

  const form = document.createElement('form');
  form.className = 'form';
  form.innerHTML = `
    <p class="form-hint">
      Redacta el reglamento con formato enriquecido (negritas, cursivas, encabezados y listas).
      Los cambios estarán disponibles inmediatamente para todos los jugadores.
    </p>
    <div data-mount="regulation"></div>
    <div class="form-actions">
      <button type="submit" class="primary">Guardar reglamento</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
    </div>
  `;

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  const mount = form.querySelector('[data-mount="regulation"]');
  const editor = createRegulationEditor(existingContent);
  mount?.appendChild(editor.element);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!isAdmin()) return;

    const content = editor.getValue();
    if (!content) {
      setStatusMessage(status, 'error', 'Añade contenido antes de guardar el reglamento.');
      return;
    }

    if (content.length > 5000) {
      setStatusMessage(
        status,
        'error',
        'El reglamento supera el límite máximo de 5000 caracteres permitidos.'
      );
      return;
    }

    const payload = {
      regulation: content,
    };

    setStatusMessage(status, 'info', 'Guardando reglamento...');

    try {
      const updated = await request('/club', { method: 'PUT', body: payload });
      renderClubProfile(updated);
      setStatusMessage(status, 'success', 'Reglamento actualizado correctamente.');
      closeModal();
      showGlobalMessage('Reglamento del club actualizado.');
    } catch (error) {
      setStatusMessage(status, 'error', error.message);
    }
  });

  form.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
    setStatusMessage(status, '', '');
    closeModal();
  });

  openModal({
    title: 'Editar reglamento del club',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });
}

function openGenerateMatchesModal(preselectedCategoryId = '') {
  if (!isAdmin()) return;

  if (!Array.isArray(state.categories) || !state.categories.length) {
    showGlobalMessage('Crea al menos una categoría antes de generar partidos.', 'warning');
    return;
  }

  const options = state.categories
    .map((category) => {
      const id = normalizeId(category);
      if (!id) return '';
      const label = category.name || 'Categoría';
      return `<option value="${id}">${label}</option>`;
    })
    .join('');

  const form = document.createElement('form');
  form.className = 'form';
  form.innerHTML = `
    <label>
      Categoría
      <select name="categoryId" required>
        <option value="">Selecciona una categoría</option>
        ${options}
      </select>
    </label>
    <p class="form-hint">
      El sistema generará enfrentamientos pendientes entre los jugadores inscritos que aún no hayan jugado entre sí.
    </p>
    <div class="form-actions">
      <button type="submit" class="primary">Generar partidos</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
    </div>
  `;

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  const select = form.elements.categoryId;
  if (
    preselectedCategoryId &&
    Array.from(select.options).some((option) => option.value === preselectedCategoryId)
  ) {
    select.value = preselectedCategoryId;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const categoryId = select.value;
    if (!categoryId) {
      setStatusMessage(status, 'error', 'Selecciona la categoría a generar.');
      return;
    }

    setStatusMessage(status, 'info', 'Creando enfrentamientos pendientes...');

    try {
      const result = await request(`/categories/${categoryId}/generate-matches`, { method: 'POST' });
      const created = Number(result?.created || 0);
      const message =
        created > 0
          ? `Se generaron ${created} partidos pendientes.`
          : result?.message || 'No había nuevos partidos por crear.';
      setStatusMessage(status, 'success', message);
      await loadAllData();
      closeModal();
      showGlobalMessage(message);
    } catch (error) {
      setStatusMessage(status, 'error', error.message);
    }
  });

  form.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
    setStatusMessage(status, '', '');
    closeModal();
  });

  openModal({
    title: 'Generar partidos pendientes',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });
}

function openResultModal(matchId) {
  if (!matchId) return;

  const normalizedId = matchId;
  let match = null;
  const matchSources = [
    state.calendarMatches,
    state.upcomingMatches,
    state.myMatches,
    state.pendingApprovalMatches,
    state.completedMatches,
  ];

  for (const source of matchSources) {
    if (!Array.isArray(source)) continue;
    const found = source.find((item) => normalizeId(item) === normalizedId);
    if (found) {
      match = found;
      break;
    }
  }

  if (!match || !Array.isArray(match.players) || match.players.length < 2) {
    showGlobalMessage('No fue posible cargar los datos del partido.', 'error');
    return;
  }

  const participants = getMatchScores(match);
  if (participants.length < 2) {
    showGlobalMessage('No fue posible identificar a los jugadores del partido.', 'error');
    return;
  }
  const currentWinnerId = normalizeId(match.result?.winner);
  const existingSets = getMatchSets(match);

  const form = document.createElement('form');
  form.className = 'form';

  const playersMarkup = participants
    .map(({ player, id }) => {
      const name = player?.fullName || player?.email || 'Jugador';
      return `
        <label class="radio-field">
          <input type="radio" name="winner" value="${id}" ${currentWinnerId === id ? 'checked' : ''} required />
          <span>${name}</span>
        </label>
      `;
    })
    .join('');

  const setRows = [1, 2, 3]
    .map((setNumber) => {
      const stored = existingSets.find((set) => set.number === setNumber);
      const isTieBreak = setNumber === 3;
      const legend = isTieBreak ? 'Super tie-break' : `Set ${setNumber}`;
      const inputs = participants
        .map(({ id, player }) => {
          const currentValue = stored?.scores?.[id] ?? 0;
          const name = player?.fullName || player?.email || 'Jugador';
          return `
            <label>
              ${name}
              <input type="number" name="set${setNumber}-${id}" min="0" step="1" value="${
                Number.isFinite(currentValue) ? currentValue : 0
              }" />
            </label>
          `;
        })
        .join('');

      return `
        <fieldset data-set="${setNumber}">
          <legend>${legend}</legend>
          <div class="form-grid">${inputs}</div>
        </fieldset>
      `;
    })
    .join('');

  form.innerHTML = `
    <fieldset>
      <legend>Ganador del partido</legend>
      <div class="form-grid form-grid--columns-1">${playersMarkup}</div>
    </fieldset>
    ${setRows}
    <label>
      Notas
      <textarea name="notes" rows="3" maxlength="500" placeholder="Comentarios opcionales">${
        match.result?.notes || ''
      }</textarea>
    </label>
    <div class="form-actions">
      <button type="submit" class="primary">Guardar resultado</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
    </div>
  `;

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const winnerId = formData.get('winner');

    if (!winnerId) {
      setStatusMessage(status, 'error', 'Selecciona el jugador ganador.');
      return;
    }

    const setsPayload = [1, 2, 3]
      .map((setNumber) => {
        const scores = participants.reduce((acc, { id }) => {
          const value = Number(formData.get(`set${setNumber}-${id}`));
          acc[id] = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
          return acc;
        }, {});
        const total = Object.values(scores).reduce((acc, value) => acc + value, 0);
        if (total === 0) {
          return null;
        }
        return {
          number: setNumber,
          tieBreak: setNumber === 3,
          scores,
        };
      })
      .filter(Boolean);

    if (setsPayload.length < 2) {
      setStatusMessage(status, 'error', 'Introduce al menos dos sets para registrar el resultado.');
      return;
    }

    const scorePayload = setsPayload.reduce((acc, set) => {
      Object.entries(set.scores).forEach(([playerId, value]) => {
        const current = acc[playerId] || 0;
        acc[playerId] = current + value;
      });
      return acc;
    }, {});

    setStatusMessage(status, 'info', 'Guardando resultado...');

    try {
      await request(`/matches/${normalizedId}/result`, {
        method: 'POST',
        body: {
          winnerId,
          sets: setsPayload,
          scores: scorePayload,
          notes: (formData.get('notes') || '').trim() || undefined,
        },
      });
      setStatusMessage(status, 'success', 'Resultado enviado.');
      closeModal();
      await loadAllData();
    } catch (error) {
      setStatusMessage(status, 'error', error.message);
    }
  });

  form.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
    closeModal();
  });

  openModal({
    title: 'Registrar resultado',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });
}

async function openEnrollmentModal(categoryId, { focusRequests = false } = {}) {
  if (!isAdmin() || !categoryId) return;

  const category = state.categories.find((item) => normalizeId(item) === categoryId);
  if (!category) {
    showGlobalMessage('Categoría no encontrada.', 'error');
    return;
  }

  try {
    await loadEnrollments(categoryId);
  } catch (error) {
    showGlobalMessage(error.message, 'error');
  }

  let requestLoadError = null;
  try {
    state.enrollmentRequests.delete(categoryId);
    await loadEnrollmentRequests(categoryId);
  } catch (error) {
    requestLoadError = error;
  }

  if (!Array.isArray(state.players) || !state.players.length) {
    try {
      const players = await request('/players');
      state.players = Array.isArray(players) ? players : [];
    } catch (error) {
      showGlobalMessage('No fue posible cargar la lista de jugadores.', 'error');
      return;
    }
  }

  const container = document.createElement('div');
  container.className = 'enrollment-modal';

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  const header = document.createElement('p');
  header.className = 'meta';
  header.textContent = `Jugadores inscritos en ${category.name}`;
  container.appendChild(header);

  const requestHeader = document.createElement('p');
  requestHeader.className = 'meta';
  requestHeader.textContent = 'Solicitudes de inscripción pendientes';
  container.appendChild(requestHeader);

  const requestList = document.createElement('ul');
  requestList.className = 'list compact';
  container.appendChild(requestList);

  const list = document.createElement('ul');
  list.className = 'list compact';
  container.appendChild(list);

  const form = document.createElement('form');
  form.className = 'form';
  form.innerHTML = `
    <label>
      Añadir jugador
      <select name="playerId" required></select>
    </label>
    <div class="form-actions">
      <button type="submit" class="primary">Inscribir</button>
    </div>
  `;
  container.appendChild(form);
  container.appendChild(status);

  const select = form.elements.playerId;

  function refreshSelect() {
    const enrollments = state.enrollments.get(categoryId) || [];
    const enrolledIds = new Set(enrollments.map((enrollment) => normalizeId(enrollment.user)));
    select.innerHTML = '<option value="">Selecciona un jugador</option>';
    state.players
      .filter((player) => entityHasRole(player, 'player') && !enrolledIds.has(normalizeId(player)))
      .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'es'))
      .forEach((player) => {
        const option = document.createElement('option');
        option.value = player._id || player.id;
        option.textContent = player.fullName || player.email;
        select.appendChild(option);
      });
  }

  function renderEnrollmentRequests() {
    const requests = state.enrollmentRequests.get(categoryId) || [];
    requestList.innerHTML = '';

    if (!requests.length) {
      requestList.innerHTML = '<li class="empty-state">No hay solicitudes pendientes.</li>';
      return;
    }

    requests.forEach((entry) => {
      const item = document.createElement('li');
      const name = entry.user?.fullName || entry.user?.email || 'Jugador';
      const title = document.createElement('strong');
      title.textContent = name;
      item.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'meta';
      const email = entry.user?.email;
      if (email) {
        meta.appendChild(document.createElement('span')).textContent = email;
      }
      const phone = entry.user?.phone;
      if (phone) {
        meta.appendChild(document.createElement('span')).textContent = phone;
      }
      const schedule = entry.user?.preferredSchedule;
      if (schedule) {
        meta.appendChild(document.createElement('span')).textContent = `Horario: ${translateSchedule(schedule)}`;
      }
      if (entry.createdAt) {
        const createdDate = formatDate(entry.createdAt);
        const createdTime = formatTime(entry.createdAt);
        meta.appendChild(document.createElement('span')).textContent = `Solicitada el ${createdDate} · ${createdTime}`;
      }
      item.appendChild(meta);

      const requestActions = document.createElement('div');
      requestActions.className = 'actions';

      const approveButton = document.createElement('button');
      approveButton.type = 'button';
      approveButton.className = 'primary';
      approveButton.dataset.requestId = entry._id || entry.id;
      approveButton.dataset.action = 'approve-request';
      approveButton.textContent = 'Aprobar';
      requestActions.appendChild(approveButton);

      const rejectButton = document.createElement('button');
      rejectButton.type = 'button';
      rejectButton.className = 'ghost';
      rejectButton.dataset.requestId = entry._id || entry.id;
      rejectButton.dataset.action = 'reject-request';
      rejectButton.textContent = 'Rechazar';
      requestActions.appendChild(rejectButton);

      item.appendChild(requestActions);
      requestList.appendChild(item);
    });
  }

  function renderEnrollmentEntries() {
    const enrollments = state.enrollments.get(categoryId) || [];
    list.innerHTML = '';

    if (!enrollments.length) {
      list.innerHTML = '<li class="empty-state">Aún no hay jugadores inscritos.</li>';
      return;
    }

    enrollments
      .slice()
      .sort((a, b) => {
        const nameA = a.user?.fullName || a.user?.email || '';
        const nameB = b.user?.fullName || b.user?.email || '';
        return nameA.localeCompare(nameB, 'es');
      })
      .forEach((enrollment) => {
        const item = document.createElement('li');
        const name = enrollment.user?.fullName || enrollment.user?.email || 'Jugador';
        const title = document.createElement('strong');
        title.textContent = name;
        item.appendChild(title);

        const meta = document.createElement('div');
        meta.className = 'meta';
        if (enrollment.user?.email) {
          meta.appendChild(document.createElement('span')).textContent = enrollment.user.email;
        }
        if (enrollment.user?.phone) {
          meta.appendChild(document.createElement('span')).textContent = enrollment.user.phone;
        }
        item.appendChild(meta);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'ghost';
        removeButton.dataset.enrollmentId = enrollment._id || enrollment.id;
        removeButton.textContent = 'Quitar';
        item.appendChild(removeButton);

        list.appendChild(item);
      });
  }

  container.addEventListener('click', async (event) => {
    const requestButton = event.target.closest('button[data-request-id]');
    if (requestButton) {
      const { requestId, action } = requestButton.dataset;
      if (!requestId || !action) {
        return;
      }

      const isApprove = action === 'approve-request';
      const actionLabel = isApprove ? 'Aprobando solicitud...' : 'Rechazando solicitud...';
      const successMessage = isApprove
        ? 'Solicitud aprobada. El jugador ha sido inscrito.'
        : 'Solicitud rechazada.';

      const parentItem = requestButton.closest('li');
      const buttons = parentItem?.querySelectorAll('button[data-request-id]') || [];
      const previousLabels = new Map();
      buttons.forEach((btn) => {
        previousLabels.set(btn, btn.textContent);
        btn.disabled = true;
        if (btn === requestButton) {
          btn.textContent = isApprove ? 'Aprobando...' : 'Rechazando...';
        }
      });

      setStatusMessage(status, 'info', actionLabel);

      try {
        await request(`/categories/${categoryId}/enrollment-requests/${requestId}`, {
          method: 'PATCH',
          body: { action: isApprove ? 'approve' : 'reject' },
        });
        state.enrollmentRequests.delete(categoryId);
        state.enrollments.delete(categoryId);
        await loadEnrollmentRequests(categoryId, { force: true });
        await loadEnrollments(categoryId);
        await reloadCategories();
        renderEnrollmentRequests();
        renderEnrollmentEntries();
        refreshSelect();
        setStatusMessage(status, 'success', successMessage);
      } catch (error) {
        setStatusMessage(status, 'error', error.message);
      } finally {
        buttons.forEach((btn) => {
          btn.disabled = false;
          const label = previousLabels.get(btn);
          if (label) {
            btn.textContent = label;
          }
        });
      }

      return;
    }

    const button = event.target.closest('button[data-enrollment-id]');
    if (!button) return;

    const enrollmentId = button.dataset.enrollmentId;
    button.disabled = true;
    setStatusMessage(status, 'info', 'Eliminando inscripción...');

    try {
      await request(`/categories/${categoryId}/enrollments/${enrollmentId}`, { method: 'DELETE' });
      state.enrollments.delete(categoryId);
      await loadEnrollments(categoryId);
      renderEnrollmentEntries();
      refreshSelect();
      await reloadCategories();
      setStatusMessage(status, 'success', 'Inscripción eliminada.');
    } catch (error) {
      setStatusMessage(status, 'error', error.message);
    } finally {
      button.disabled = false;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const playerId = select.value;
    if (!playerId) {
      setStatusMessage(status, 'error', 'Selecciona un jugador.');
      return;
    }

    setStatusMessage(status, 'info', 'Inscribiendo jugador...');

    try {
      await request('/categories/enroll', {
        method: 'POST',
        body: { categoryId, userId: playerId },
      });
      select.value = '';
      state.enrollments.delete(categoryId);
      await loadEnrollments(categoryId);
      await loadEnrollmentRequests(categoryId, { force: true });
      await reloadCategories();
      renderEnrollmentEntries();
      renderEnrollmentRequests();
      refreshSelect();
      setStatusMessage(status, 'success', 'Jugador inscrito correctamente.');
    } catch (error) {
      setStatusMessage(status, 'error', error.message);
    }
  });

  renderEnrollmentRequests();
  renderEnrollmentEntries();
  refreshSelect();

  openModal({
    title: `Inscripciones · ${category.name}`,
    content: (body) => {
      body.appendChild(container);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });

  if (requestLoadError) {
    setStatusMessage(status, 'error', 'No fue posible cargar las solicitudes pendientes.');
  }
}

function openSeasonModal(seasonId = '') {
  if (!isAdmin()) return;

  const normalizedId = seasonId || '';
  const season = normalizedId
    ? state.seasons.find((item) => normalizeId(item) === normalizedId)
    : null;

  const categoryOptions = Array.isArray(state.categories)
    ? state.categories
        .map((category) => {
          const id = normalizeId(category);
          if (!id) return '';
          return `<option value="${id}">${category.name}</option>`;
        })
        .join('')
    : '';

  const form = document.createElement('form');
  form.className = 'form';
  form.innerHTML = `
    <label>
      Nombre de la temporada
      <input type="text" name="name" required />
    </label>
    <label>
      Año
      <input type="number" name="year" min="2000" max="2100" required />
    </label>
    <div class="form-grid">
      <label>
        Inicio
        <input type="date" name="startDate" />
      </label>
      <label>
        Fin
        <input type="date" name="endDate" />
      </label>
    </div>
    <label>
      Descripción
      <textarea name="description" rows="3" maxlength="500" placeholder="Detalles opcionales"></textarea>
    </label>
    <label>
      Categorías vinculadas
      <select name="categories" multiple size="5">${categoryOptions}</select>
      <span class="form-hint">Mantén presionada la tecla Ctrl (Cmd en Mac) para seleccionar varias categorías.</span>
    </label>
    <div class="form-actions">
      <button type="submit" class="primary">${season ? 'Actualizar' : 'Crear'} temporada</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
      ${
        season
          ? '<button type="button" class="danger" data-action="delete">Eliminar temporada</button>'
          : ''
      }
    </div>
  `;

  form.elements.name.value = season?.name || '';
  form.elements.year.value = season?.year || new Date().getFullYear();
  if (season?.startDate) {
    form.elements.startDate.value = formatDateInput(season.startDate);
  }
  if (season?.endDate) {
    form.elements.endDate.value = formatDateInput(season.endDate);
  }
  form.elements.description.value = season?.description || '';

  const categorySelect = form.elements.categories;
  if (categorySelect && season?.categories?.length) {
    const selectedIds = season.categories.map((category) => normalizeId(category)).filter(Boolean);
    Array.from(categorySelect.options).forEach((option) => {
      option.selected = selectedIds.includes(option.value);
    });
  }

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      name: (formData.get('name') || '').trim(),
      year: Number(formData.get('year')),
      description: (formData.get('description') || '').trim() || undefined,
    };

    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');
    payload.startDate = startDate || undefined;
    payload.endDate = endDate || undefined;

    payload.categories = Array.from(new Set(formData.getAll('categories')));

    setStatusMessage(
      status,
      'info',
      season ? 'Actualizando temporada...' : 'Creando temporada...'
    );

    try {
      if (season) {
        await request(`/seasons/${normalizedId}`, { method: 'PATCH', body: payload });
      } else {
        await request('/seasons', { method: 'POST', body: payload });
      }
      setStatusMessage(status, 'success', season ? 'Temporada actualizada.' : 'Temporada creada.');
      closeModal();
      await loadAllData();
    } catch (error) {
      setStatusMessage(status, 'error', error.message);
    }
  });

  form.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
    closeModal();
  });

  if (season) {
    form.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const confirmed = window.confirm('¿Eliminar esta temporada de forma permanente?');
      if (!confirmed) return;
      setStatusMessage(status, 'info', 'Eliminando temporada...');
      try {
        await request(`/seasons/${normalizedId}`, { method: 'DELETE' });
        setStatusMessage(status, 'success', 'Temporada eliminada.');
        closeModal();
        await loadAllData();
      } catch (error) {
        setStatusMessage(status, 'error', error.message);
      }
    });
  }

  openModal({
    title: season ? 'Editar temporada' : 'Nueva temporada',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });
}

function renderEnrollmentList(categoryId) {
  if (!adminEnrollmentList) return;

  adminEnrollmentList.innerHTML = '';

  if (!categoryId) {
    adminEnrollmentList.innerHTML =
      '<li class="empty-state">Selecciona una categoría para ver los jugadores asociados.</li>';
    return;
  }

  const enrollments = state.enrollments.get(categoryId);
  if (!enrollments) {
    adminEnrollmentList.innerHTML =
      '<li class="empty-state">Selecciona una categoría para ver los jugadores asociados.</li>';
    return;
  }

  if (!enrollments.length) {
    adminEnrollmentList.innerHTML =
      '<li class="empty-state">Aún no hay jugadores inscritos en esta categoría.</li>';
    return;
  }

  enrollments.forEach((enrollment) => {
    const item = document.createElement('li');
    const info = document.createElement('div');
    info.className = 'enrollment-player';

    const name = document.createElement('strong');
    name.textContent = enrollment.user?.fullName || 'Jugador';
    info.appendChild(name);

    const details = [];
    if (enrollment.user?.email) {
      details.push(enrollment.user.email);
    }
    if (enrollment.user?.phone) {
      details.push(enrollment.user.phone);
    }
    if (enrollment.user?.preferredSchedule) {
      details.push(`Horario: ${translateSchedule(enrollment.user.preferredSchedule)}`);
    }

    if (details.length) {
      const meta = document.createElement('span');
      meta.className = 'enrollment-meta';
      meta.textContent = details.join(' · ');
      info.appendChild(meta);
    }

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'danger';
    removeButton.textContent = 'Quitar';
    removeButton.dataset.enrollmentId = enrollment._id || enrollment.id;
    removeButton.dataset.categoryId = categoryId;

    item.appendChild(info);
    item.appendChild(removeButton);
    adminEnrollmentList.appendChild(item);
  });
}

async function hydrateEnrollmentCache(categories) {
  if (!isAdmin()) return;
  if (!Array.isArray(categories) || !categories.length) return;

  const tasks = categories.map(async (category) => {
    const categoryId = category?._id || category?.id;
    if (!categoryId) return;
    if (state.enrollments.has(categoryId)) return;

    try {
      await loadEnrollments(categoryId);
    } catch (error) {
      state.enrollments.set(categoryId, []);
    }
  });

  await Promise.all(tasks);
}

async function loadGeneralChat() {
  try {
    const messages = await request('/chat/general');
    state.generalChatMessages = Array.isArray(messages) ? messages : [];
    syncNoticeBoardState(state.generalChatMessages);
    renderGeneralChat();
  } catch (error) {
    state.generalChatMessages = [];
    syncNoticeBoardState(state.generalChatMessages);
    renderGeneralChat();
  }
}

async function loadChatParticipants() {}

async function loadDirectChat() {}

function updateDirectChatFormState() {}

async function reloadCategories() {
  const categories = await request('/categories');
  const list = Array.isArray(categories) ? categories : [];
  state.categories = list;
  renderCategories(list);
  updateRankingOptions(list);
  updateDashboardCategoryOptions(list);
  updateMatchesCategoryOptions(list);
  if (isAdmin()) {
    renderAdminCategoryList();
    renderPlayerDirectory();
  }
}

async function loadAllData() {
  if (!state.token) return;

  try {
    const userId = state.user?.id || state.user?._id;
    if (!userId) {
      throw new Error('No fue posible identificar al usuario autenticado.');
    }

    state.enrollments.clear();
    state.enrollmentRequests.clear();
    const [leagues, categories] = await Promise.all([
      request('/leagues'),
      request('/categories'),
    ]);
    state.leagues = Array.isArray(leagues) ? leagues : [];
    renderLeagues(state.leagues);

    const categoryList = Array.isArray(categories) ? categories : [];
    state.categories = categoryList;
    renderCategories(categoryList);
    updateRankingOptions(categoryList);
    updateDashboardCategoryOptions(categoryList);
    updateMatchesCategoryOptions(categoryList);

    await loadDashboardSummary(state.dashboardCategoryId);

    const [
      upcomingMatches,
      myMatches,
      notifications,
      clubProfile,
      seasons,
      calendarMatches,
      completedMatches,
      pendingReviewMatches,
    ] = await Promise.all([
      request('/matches?statuses=programado,revision'),
      request(`/matches?playerId=${userId}&includeDrafts=true`),
      request('/notifications/mine?upcoming=true').catch(() => []),
      request('/club').catch(() => null),
      request('/seasons').catch(() => []),
      request('/matches?statuses=pendiente,propuesto,programado,revision'),
      request('/matches?status=completado').catch(() => []),
      request('/matches?resultStatus=en_revision').catch(() => []),
    ]);

    state.upcomingMatches = Array.isArray(upcomingMatches) ? upcomingMatches : [];
    renderMatches(
      filterMatchesByCategory(state.upcomingMatches),
      upcomingList,
      'No hay partidos programados.'
    );
    state.myMatches = Array.isArray(myMatches) ? myMatches : [];
    renderMyMatches(state.myMatches);
    let pendingMatches = Array.isArray(pendingReviewMatches) ? pendingReviewMatches : [];
    if (!isAdmin()) {
      const currentUserId = normalizeId(state.user);
      pendingMatches = pendingMatches.filter((match) =>
        Array.isArray(match.players)
          ? match.players.some((player) => normalizeId(player) === currentUserId)
          : false
      );
    }
    state.pendingApprovalMatches = pendingMatches;
    renderMatches(
      filterMatchesByCategory(state.pendingApprovalMatches),
      pendingApprovalsList,
      'No hay resultados pendientes por aprobar.'
    );
    state.completedMatches = Array.isArray(completedMatches) ? completedMatches : [];
    renderMatches(
      filterMatchesByCategory(state.completedMatches),
      completedMatchesList,
      'Aún no hay partidos confirmados para mostrar.'
    );
    renderNotifications(notifications);
    if (clubProfile) {
      renderClubProfile(clubProfile);
    }
    state.seasons = Array.isArray(seasons) ? seasons : [];
    state.calendarMatches = Array.isArray(calendarMatches) ? calendarMatches : [];
    renderAdminMatchList(state.calendarMatches);
    renderAllCalendars();

    if (isAdmin()) {
      await hydrateEnrollmentCache(categoryList);
      const allUsers = await request('/players');
      state.players = Array.isArray(allUsers) ? allUsers : [];
      renderCategories(state.categories);
      populateAdminSelects();
      renderAdminCategoryList();
      renderAdminPlayerList();
      renderPlayerDirectory();
      renderAdminMatchList(state.calendarMatches);
      const selectedCategory = adminEnrollmentCategory?.value;
      if (selectedCategory) {
        try {
          await loadEnrollments(selectedCategory);
          renderEnrollmentList(selectedCategory);
          setStatusMessage(adminEnrollmentStatus, '', '');
        } catch (error) {
          state.enrollments.delete(selectedCategory);
          if (adminEnrollmentList) {
            adminEnrollmentList.innerHTML =
              '<li class="empty-state">No fue posible cargar las inscripciones.</li>';
          }
          setStatusMessage(adminEnrollmentStatus, 'error', error.message);
        }
      } else {
        renderEnrollmentList('');
      }
    }

    if (categoryList.length) {
      const defaultCategory =
        state.selectedCategoryId || categoryList[0]._id || categoryList[0].id;
      await loadRanking(defaultCategory);
      rankingSelect.value = defaultCategory;
      state.selectedCategoryId = defaultCategory;
    } else {
    await loadRanking('');
  }

  await loadGeneralChat();
  await syncPushSubscriptionState();
} catch (error) {
  showGlobalMessage(error.message, 'error');
}
}

async function checkSetupStatus() {
  try {
    const data = await request('/auth/setup-status', { requireAuth: false });
    state.needsSetup = Boolean(data?.needsSetup);
  } catch (error) {
    state.needsSetup = false;
  }
  applySetupState();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const payload = {
    email: formData.get('email'),
    password: formData.get('password'),
  };
  const rememberCredentials = loginRememberCheckbox?.checked ?? false;

  setStatusMessage(loginStatus, 'info', 'Verificando credenciales...');

  try {
    const data = await request('/auth/login', { method: 'POST', body: payload, requireAuth: false });
    state.token = data.token;
    state.user = data.user;
    state.needsSetup = false;
    applySetupState();
    persistSession();
    persistRememberedCredentials(payload.email, payload.password, rememberCredentials);
    updateAuthUI();
    setStatusMessage(loginStatus, 'success', 'Sesión iniciada.');
    await loadAllData();
    loginForm.reset();
    loadRememberedCredentials();
  } catch (error) {
    setStatusMessage(loginStatus, 'error', error.message);
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);
  const payload = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    gender: formData.get('gender'),
    birthDate: formData.get('birthDate'),
    phone: formData.get('phone'),
    preferredSchedule: formData.get('preferredSchedule'),
    notes: formData.get('notes') || undefined,
  };

  const roleInputs = Array.from(registerForm.querySelectorAll('input[name="roles"]'));
  const selectedRoles = roleInputs
    .filter((input) => input.checked)
    .map((input) => input.value);
  if (!selectedRoles.length) {
    selectedRoles.push('player');
  }
  if (state.needsSetup && !selectedRoles.includes('admin')) {
    selectedRoles.push('admin');
  }
  payload.roles = Array.from(new Set(selectedRoles));

  setStatusMessage(registerStatus, 'info', 'Creando la cuenta...');

  try {
    const photoData = await extractPhotoFromForm(registerForm);
    if (photoData) {
      payload.photo = photoData;
    }
    const data = await request('/auth/register', { method: 'POST', body: payload, requireAuth: false });
    state.token = data.token;
    state.user = data.user;
    state.needsSetup = !data.setupCompleted;
    applySetupState();
    persistSession();
    updateAuthUI();
    await loadAllData();
    registerForm.reset();
    setStatusMessage(registerStatus, 'success', 'Cuenta creada correctamente.');
  } catch (error) {
    setStatusMessage(registerStatus, 'error', error.message);
  }
});

profileEditButton?.addEventListener('click', () => {
  toggleProfileForm(true);
  profileForm?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

profileCancelButton?.addEventListener('click', () => {
  toggleProfileForm(false);
});

profileForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.user) return;

  const formData = new FormData(profileForm);
  const payload = {
    fullName: (formData.get('fullName') || '').trim(),
    email: (formData.get('email') || '').trim(),
    phone: (formData.get('phone') || '').trim(),
    preferredSchedule: formData.get('preferredSchedule'),
    gender: formData.get('gender'),
    birthDate: formData.get('birthDate'),
    notifyMatchRequests: formData.has('notifyMatchRequests'),
    notifyMatchResults: formData.has('notifyMatchResults'),
  };

  const notesRaw = (formData.get('notes') || '').trim();
  payload.notes = notesRaw;

  const password = formData.get('password');
  if (password) {
    payload.password = password;
  }

  setStatusMessage(profileStatus, 'info', 'Guardando cambios...');

  try {
    const photoData = await extractPhotoFromForm(profileForm);
    if (photoData) {
      payload.photo = photoData;
    }
    const data = await request('/auth/me', { method: 'PATCH', body: payload });
    state.user = data.user;
    persistSession();
    updateProfileCard();
    showGlobalMessage('Perfil actualizado correctamente.');
    toggleProfileForm(false);
  } catch (error) {
    setStatusMessage(profileStatus, 'error', error.message);
  }
});

rankingPrintButton?.addEventListener('click', () => {
  printRankingSheet();
});

calendarPrev?.addEventListener('click', () => {
  shiftCalendar(-1);
});

calendarNext?.addEventListener('click', () => {
  shiftCalendar(1);
});

globalCalendarPrev?.addEventListener('click', () => {
  shiftGlobalCalendar(-1);
});

globalCalendarNext?.addEventListener('click', () => {
  shiftGlobalCalendar(1);
});

clubEditButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  openClubModal();
});

rulesEditButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  openRulesEditorModal();
});

generalChatToolbar?.addEventListener('click', handleNoticeToolbarClick);

generalChatAttachmentInput?.addEventListener('change', handleNoticeAttachmentChange);

generalChatAttachmentsList?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-attachment-remove]');
  if (!button) return;
  removeNoticeAttachment(button.dataset.attachmentRemove);
});

generalChatForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isAdmin()) return;

  const rawHtml = generalChatEditor ? generalChatEditor.innerHTML : '';
  const sanitizedRich = sanitizeNoticeHtml(rawHtml);
  const plainText = extractPlainTextFromHtml(sanitizedRich);

  if (!plainText && !sanitizedRich && !noticeDraftAttachments.length) {
    showGlobalMessage('Escribe un mensaje o añade un adjunto antes de publicar.', 'error');
    generalChatEditor?.focus();
    return;
  }

  if (plainText.length > 2000) {
    showGlobalMessage('El aviso supera el límite de 2000 caracteres.', 'error');
    return;
  }

  if (sanitizedRich.length > 12000) {
    showGlobalMessage('El contenido enriquecido es demasiado largo (máximo 12000 caracteres).', 'error');
    return;
  }

  if (generalChatInput) {
    generalChatInput.value = plainText;
  }

  const attachmentsPayload = noticeDraftAttachments.map((attachment) => ({
    filename: attachment.name,
    contentType: attachment.contentType,
    size: attachment.size,
    dataUrl: attachment.dataUrl,
    type: attachment.type,
  }));

  const payload = {
    content: plainText,
    richContent: sanitizedRich || undefined,
    attachments: attachmentsPayload,
  };

  setNoticeFormBusy(true);

  try {
    await request('/chat/general', { method: 'POST', body: payload });
    resetNoticeComposer();
    await loadGeneralChat();
  } catch (error) {
    showGlobalMessage(error.message, 'error');
  } finally {
    setNoticeFormBusy(false);
  }
});

pushEnableButton?.addEventListener('click', () => {
  enablePushNotifications();
});

pushDisableButton?.addEventListener('click', () => {
  disablePushNotifications();
});

logoutButtons.forEach((button) => {
  button.addEventListener('click', () => {
    closeMobileMenu();
    state.token = null;
    state.user = null;
    state.players = [];
    state.selectedCategoryId = null;
    state.notifications = [];
    state.notificationBase = null;
    state.pendingEnrollmentRequestCount = 0;
    state.calendarDate = new Date();
    state.globalCalendarDate = new Date();
    clearSession();
    updateNotificationCounts([]);
    updateAuthUI();
    showGlobalMessage('Sesión cerrada correctamente.');
    checkSetupStatus();
  });
});

dashboardCategory?.addEventListener('change', async (event) => {
  const value = event.target.value || '';
  state.dashboardCategoryId = value;
  await loadDashboardSummary(value);
  renderAllCalendars();
  if (matchesCategorySelect) {
    matchesCategorySelect.value = value;
    matchesCategorySelect.dispatchEvent(new Event('change'));
  }
});

matchesCategorySelect?.addEventListener('change', (event) => {
  state.matchesCategoryId = event.target.value || '';
  renderMatches(
    filterMatchesByCategory(state.upcomingMatches),
    upcomingList,
    'No hay partidos programados.'
  );
  renderMatches(
    filterMatchesByCategory(state.pendingApprovalMatches),
    pendingApprovalsList,
    'No hay resultados pendientes por aprobar.'
  );
  renderMatches(
    filterMatchesByCategory(state.completedMatches),
    completedMatchesList,
    'Aún no hay partidos confirmados para mostrar.'
  );
});

rankingSelect.addEventListener('change', (event) => {
  const categoryId = event.target.value;
  loadRanking(categoryId);
});

notificationsList?.addEventListener('click', async (event) => {
  const reviewButton = event.target.closest('button[data-review-category]');
  if (reviewButton) {
    const { reviewCategory } = reviewButton.dataset;
    if (reviewCategory) {
      openEnrollmentModal(reviewCategory, { focusRequests: true });
    }
    return;
  }

  const button = event.target.closest('button[data-notification-id]');
  if (!button) return;
  const { notificationId } = button.dataset;
  if (!notificationId) return;

  button.disabled = true;
  try {
    await request(`/notifications/mine/${notificationId}`, { method: 'DELETE' });
    const notifications = await request('/notifications/mine?upcoming=true').catch(() => []);
    renderNotifications(Array.isArray(notifications) ? notifications : []);
    await loadDashboardSummary(state.dashboardCategoryId);
  } catch (error) {
    button.disabled = false;
    showGlobalMessage(error.message, 'error');
  }
});

adminCategoryForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isAdmin()) return;
  const succeeded = await submitCategoryFormData({
    form: adminCategoryForm,
    categoryId: state.adminCategoryEditingId,
    statusElement: adminStatus,
  });
  if (succeeded) {
    resetAdminCategoryForm();
  }
});

adminEnrollmentCategory?.addEventListener('change', async (event) => {
  const categoryId = event.target.value;
  if (!categoryId) {
    renderEnrollmentList('');
    setStatusMessage(adminEnrollmentStatus, '', '');
    return;
  }

  if (adminEnrollmentList) {
    adminEnrollmentList.innerHTML = '<li class="empty-state">Cargando inscripciones...</li>';
  }
  setStatusMessage(adminEnrollmentStatus, '', '');

  try {
    await loadEnrollments(categoryId);
    renderEnrollmentList(categoryId);
    renderPlayerDirectory();
  } catch (error) {
    state.enrollments.delete(categoryId);
    if (adminEnrollmentList) {
      adminEnrollmentList.innerHTML =
        '<li class="empty-state">No fue posible cargar las inscripciones.</li>';
    }
    setStatusMessage(adminEnrollmentStatus, 'error', error.message);
  }
});

adminEnrollmentForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isAdmin()) return;

  const formData = new FormData(adminEnrollmentForm);
  const categoryId = formData.get('categoryId');
  const userId = formData.get('userId');

  if (!categoryId || !userId) {
    setStatusMessage(adminEnrollmentStatus, 'error', 'Selecciona la categoría y el jugador.');
    return;
  }

  setStatusMessage(adminEnrollmentStatus, 'info', 'Inscribiendo jugador...');

  try {
    await request('/categories/enroll', { method: 'POST', body: { categoryId, userId } });
    state.enrollments.delete(categoryId);
    await loadEnrollments(categoryId);
    state.enrollmentRequests.delete(categoryId);
    await reloadCategories();
    renderEnrollmentList(categoryId);
    setStatusMessage(adminEnrollmentStatus, 'success', 'Jugador inscrito correctamente.');
    if (adminEnrollmentForm.elements.userId) {
      adminEnrollmentForm.elements.userId.value = '';
    }
  } catch (error) {
    setStatusMessage(adminEnrollmentStatus, 'error', error.message);
  }
});

adminEnrollmentList?.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-enrollment-id]');
  if (!button || !isAdmin()) return;

  const categoryId = button.dataset.categoryId;
  const enrollmentId = button.dataset.enrollmentId;
  if (!categoryId || !enrollmentId) return;

  button.disabled = true;
  setStatusMessage(adminEnrollmentStatus, 'info', 'Eliminando inscripción...');

  try {
    await request(`/categories/${categoryId}/enrollments/${enrollmentId}`, { method: 'DELETE' });
    state.enrollments.delete(categoryId);
    await loadEnrollments(categoryId);
    state.enrollmentRequests.delete(categoryId);
    await reloadCategories();
    renderEnrollmentList(categoryId);
    setStatusMessage(adminEnrollmentStatus, 'success', 'Inscripción eliminada.');
  } catch (error) {
    setStatusMessage(adminEnrollmentStatus, 'error', error.message);
  } finally {
    button.disabled = false;
  }
});

adminCategoryCancel?.addEventListener('click', () => {
  resetAdminCategoryForm();
  setStatusMessage(adminStatus, '', '');
});

adminCategoryList?.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-category-id]');
  if (!button || !isAdmin()) return;
  const { categoryId, action } = button.dataset;
  if (!categoryId) return;

  if (action === 'delete') {
    const category = state.categories.find((item) => normalizeId(item) === categoryId);
    const categoryName = category?.name ? `la categoría "${category.name}"` : 'esta categoría';
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar ${categoryName}? Esta acción eliminará los partidos e inscripciones asociadas.`
    );
    if (!confirmed) return;

    button.disabled = true;
    setStatusMessage(adminStatus, 'info', 'Eliminando categoría...');

    try {
      await request(`/categories/${categoryId}`, { method: 'DELETE' });
      setStatusMessage(adminStatus, 'success', 'Categoría eliminada.');
      if (state.adminCategoryEditingId === categoryId) {
        resetAdminCategoryForm();
      }
      await loadAllData();
    } catch (error) {
      setStatusMessage(adminStatus, 'error', error.message);
    } finally {
      button.disabled = false;
    }

    return;
  }

  setAdminCategoryEditing(categoryId);
});

adminPlayerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isAdmin()) return;
  const succeeded = await submitPlayerFormData({
    form: adminPlayerForm,
    playerId: state.adminPlayerEditingId,
    statusElement: adminStatus,
  });
  if (succeeded) {
    resetAdminPlayerForm();
  }
});

adminPlayerCancel?.addEventListener('click', () => {
  resetAdminPlayerForm();
  setStatusMessage(adminStatus, '', '');
});

adminPlayerList?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-player-id]');
  if (!button || !isAdmin()) return;
  setAdminPlayerEditing(button.dataset.playerId);
});

playerDirectorySearch?.addEventListener('input', (event) => {
  state.playerDirectoryFilters.search = (event.target.value || '').trim();
  renderPlayerDirectory();
});

playerDirectoryGender?.addEventListener('change', (event) => {
  state.playerDirectoryFilters.gender = event.target.value || '';
  renderPlayerDirectory();
});

playerDirectoryRole?.addEventListener('change', (event) => {
  state.playerDirectoryFilters.role = event.target.value || '';
  renderPlayerDirectory();
});

playerDirectoryCategory?.addEventListener('change', async (event) => {
  const value = event.target.value || '';
  state.playerDirectoryFilters.category = value;
  if (value) {
    try {
      await loadEnrollments(value);
    } catch (error) {
      console.warn('No fue posible actualizar las inscripciones para el filtro seleccionado', error);
    }
  }
  renderPlayerDirectory();
});

playerDirectoryList?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-player-id]');
  if (!button || !isAdmin()) return;
  openPlayerModal(button.dataset.playerId);
});

categoriesList?.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-category-id]');
  if (!button) return;

  const { categoryId, action } = button.dataset;
  if (!categoryId) return;

  if (action === 'request-enrollment') {
    const previousLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Enviando solicitud...';
    try {
      await request(`/categories/${categoryId}/enrollment-requests`, { method: 'POST' });
      state.enrollmentRequests.delete(categoryId);
      showGlobalMessage('Solicitud enviada. Un administrador la revisará en breve.');
      await reloadCategories();
    } catch (error) {
      showGlobalMessage(error.message, 'error');
    } finally {
      if (document.body.contains(button)) {
        button.disabled = false;
        button.textContent = previousLabel;
      }
    }
    return;
  }

  if (!isAdmin()) return;

  if (action === 'review-requests') {
    openEnrollmentModal(categoryId, { focusRequests: true });
    return;
  }

  if (action === 'enrollments') {
    openEnrollmentModal(categoryId);
  } else {
    openCategoryModal(categoryId);
  }
});

upcomingList?.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const { matchId, action } = button.dataset;
  if (!matchId) return;

  if (action === 'delete-match') {
    await deleteMatchById(matchId, { button });
    return;
  }

  if (action === 'report-result' || action === 'edit-result') {
    openResultModal(matchId);
    return;
  }

  if (!isAdmin()) return;
  openMatchModal(matchId);
});

pendingApprovalsList?.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const { matchId, action } = button.dataset;
  if (!matchId) return;

  if (action === 'delete-match') {
    await deleteMatchById(matchId, { button });
    return;
  }

  if (action === 'report-result' || action === 'edit-result') {
    openResultModal(matchId);
    return;
  }

  if (!isAdmin()) return;
  openMatchModal(matchId);
});

completedMatchesList?.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const { matchId, action } = button.dataset;
  if (!matchId) return;

  if (action === 'delete-match') {
    await deleteMatchById(matchId, { button });
    return;
  }

  if (action === 'report-result' || action === 'edit-result') {
    openResultModal(matchId);
    return;
  }

  if (!isAdmin()) return;
  openMatchModal(matchId);
});

leaguesList?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, leagueId } = button.dataset;
  if (action === 'edit' && leagueId) {
    openLeagueModal(leagueId);
  }
});

categoryCreateButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  openCategoryModal();
});

leagueCreateButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  openLeagueModal();
});

playerCreateButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  openPlayerModal();
});

matchGenerateButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  const defaultCategory = state.dashboardCategoryId || state.selectedCategoryId || '';
  openGenerateMatchesModal(defaultCategory);
});

matchCreateButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  openMatchModal();
});

modalClose?.addEventListener('click', () => {
  closeModal();
});

modalOverlay?.addEventListener('click', (event) => {
  if (event.target === modalOverlay) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') {
    return;
  }

  let handled = false;

  if (!modalOverlay?.hidden) {
    closeModal();
    handled = true;
  }

  if (isMobileMenuOpen()) {
    closeMobileMenu({ restoreFocus: true });
    handled = true;
  }

  if (handled) {
    event.preventDefault();
  }
});

adminMatchSelect?.addEventListener('change', (event) => {
  const matchId = event.target.value;
  if (!matchId) {
    resetAdminMatchForm();
    return;
  }
  setAdminMatchEditing(matchId);
});

adminMatchList?.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-match-id]');
  if (!button || !isAdmin()) return;

  const { matchId, action } = button.dataset;
  if (!matchId) return;

  if (action === 'delete') {
    await deleteMatchById(matchId, { statusElement: adminMatchStatusMessage, button });
    return;
  }

  setAdminMatchEditing(matchId);
});

adminMatchCancel?.addEventListener('click', () => {
  resetAdminMatchForm();
});

adminMatchDelete?.addEventListener('click', async () => {
  if (!isAdmin()) return;
  const matchId = state.adminMatchEditingId || adminMatchSelect?.value;
  if (!matchId) {
    setStatusMessage(
      adminMatchStatusMessage,
      'error',
      'Selecciona un partido pendiente o programado para poder eliminarlo.'
    );
    return;
  }

  await deleteMatchById(matchId, {
    statusElement: adminMatchStatusMessage,
    button: adminMatchDelete,
  });
});

adminMatchForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isAdmin()) return;

  const matchId = state.adminMatchEditingId || adminMatchSelect?.value;
  if (!matchId) {
    setStatusMessage(adminMatchStatusMessage, 'error', 'Selecciona un partido para actualizar.');
    return;
  }

  const succeeded = await submitMatchFormData({
    form: adminMatchForm,
    matchId,
    statusElement: adminMatchStatusMessage,
    creating: false,
  });

  if (succeeded) {
    if (state.calendarMatches.some((match) => (match._id || match.id) === matchId)) {
      setAdminMatchEditing(matchId);
    } else {
      resetAdminMatchForm();
    }
  }
});

myMatchesList?.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || !state.token) return;

  const { action, matchId } = button.dataset;
  if (!matchId || !action) return;

  button.disabled = true;

  try {
    if (action === 'edit-match') {
      button.disabled = false;
      if (isAdmin()) {
        openMatchModal(matchId);
      }
      return;
    }

    if (action === 'delete-match') {
      await deleteMatchById(matchId, { button });
      return;
    }

    if (action === 'report-result') {
      button.disabled = false;
      openResultModal(matchId);
      return;
    } else if (action === 'propose') {
      openProposalForm(matchId, button);
      return;
    } else if (action === 'respond') {
      const { decision } = button.dataset;
      if (!decision) return;

      await request(`/matches/${matchId}/respond`, {
        method: 'POST',
        body: {
          decision,
        },
      });

      const message = decision === 'accept' ? 'Partido confirmado.' : 'Se rechazó la propuesta.';
      showGlobalMessage(message, 'info');
    } else if (action === 'confirm-result' || action === 'reject-result') {
      const decision = action === 'confirm-result' ? 'approve' : 'reject';
      await request(`/matches/${matchId}/result/confirm`, {
        method: 'POST',
        body: { decision },
      });
      const message =
        decision === 'approve'
          ? 'Resultado confirmado.'
          : 'Has rechazado el resultado. Regístralo nuevamente si es necesario.';
      showGlobalMessage(message, 'info');
    }

    await loadAllData();
  } catch (error) {
    showGlobalMessage(error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

if (state.push.supported) {
  window.addEventListener('focus', () => {
    const permission = Notification.permission;
    if (state.push.permission !== permission) {
      state.push.permission = permission;
      updatePushSettingsUI();
    }
  });
}

if (state.push.supported) {
  ensurePushServiceWorker();
}

updatePushSettingsUI();

initializeDashboardCardToggles();

async function init() {
  resetData();
  loadRememberedCredentials();
  await checkSetupStatus();
  restoreSession();
  updateAuthUI();
  if (state.token) {
    await loadAllData();
  }
}

init();
