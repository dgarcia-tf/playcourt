const API_BASE = '/app/api';
const STORAGE_KEY = 'cn-sanmarcos-app-session';
const REMEMBER_CREDENTIALS_KEY = 'cn-sanmarcos-remember-credentials';
const NOTICE_LAST_SEEN_PREFIX = 'cn-sanmarcos-notices-last-seen:';
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const MAX_NOTICE_ATTACHMENT_SIZE = 3 * 1024 * 1024;
const MAX_NOTICE_ATTACHMENTS = 5;
const CALENDAR_TIME_SLOT_MINUTES = 15;
const CALENDAR_TIME_SLOT_STEP_SECONDS = CALENDAR_TIME_SLOT_MINUTES * 60;
const COURT_RESERVATION_DEFAULT_DURATION = 90;

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

const CALENDAR_MATCH_STATUSES = ['pendiente', 'propuesto', 'programado', 'revision'];

const MATCH_EXPIRATION_DAYS = 15;
const MATCHES_PER_PAGE = 10;
const UNCATEGORIZED_CATEGORY_KEY = '__uncategorized__';
const UNCATEGORIZED_CATEGORY_LABEL = 'Sin categoría';
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

const TOURNAMENT_STATUS_LABELS = {
  inscripcion: 'Inscripción abierta',
  en_juego: 'En juego',
  finalizado: 'Finalizado',
};

const TOURNAMENT_CATEGORY_STATUS_LABELS = {
  inscripcion: 'Inscripción abierta',
  cuadros: 'Cuadros definidos',
  en_juego: 'En juego',
  finalizado: 'Finalizado',
};

const TOURNAMENT_ENROLLMENT_STATUS_LABELS = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
};

const TOURNAMENT_MATCH_STATUS_LABELS = {
  pendiente: 'Pendiente',
  programado: 'Programado',
  confirmado: 'Confirmado',
  rechazado: 'Rechazado',
  completado: 'Completado',
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
const PAYMENT_STATUS_LABELS = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  exento: 'Exento',
  fallido: 'Fallido',
};
const PAYMENT_STATUS_ORDER = {
  pendiente: 0,
  pagado: 1,
  exento: 2,
  fallido: 3,
};
const DEFAULT_LEAGUE_CURRENCY = 'EUR';

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

function populateCourtReservationCourts() {
  if (!courtReservationCourtSelect) {
    return;
  }

  const currentValue = courtReservationCourtSelect.value;
  const courtNames = getClubCourtNames();
  courtReservationCourtSelect.innerHTML = '';

  if (!courtNames.length) {
    const option = new Option('Añade pistas en la sección del club para habilitar las reservas', '');
    option.disabled = true;
    option.selected = true;
    courtReservationCourtSelect.appendChild(option);
    courtReservationCourtSelect.disabled = true;
    if (courtReservationSubmit) {
      courtReservationSubmit.disabled = true;
    }
    return;
  }

  courtReservationCourtSelect.disabled = false;
  if (courtReservationSubmit) {
    courtReservationSubmit.disabled = false;
  }

  let resolvedValue = currentValue && courtNames.includes(currentValue) ? currentValue : courtNames[0];
  courtNames.forEach((name) => {
    const option = new Option(name, name, false, name === resolvedValue);
    courtReservationCourtSelect.appendChild(option);
  });
  courtReservationCourtSelect.value = resolvedValue;
}

function populateCourtBlockCourts() {
  if (!courtBlockCourtsSelect) {
    return;
  }

  const previousSelection = new Set(
    Array.from(courtBlockCourtsSelect.selectedOptions || []).map((option) => option.value)
  );
  const courtNames = getClubCourtNames();
  courtBlockCourtsSelect.innerHTML = '';

  if (!courtNames.length) {
    const option = new Option(
      'Añade pistas en la sección del club para poder bloquearlas',
      '',
      true,
      true
    );
    option.disabled = true;
    courtBlockCourtsSelect.appendChild(option);
    courtBlockCourtsSelect.disabled = true;
    return;
  }

  courtBlockCourtsSelect.disabled = false;
  courtNames.forEach((name) => {
    const option = new Option(name, name, false, previousSelection.has(name));
    courtBlockCourtsSelect.appendChild(option);
  });
}

function populateCourtBlockEntities() {
  if (!courtBlockEntitySelect) {
    return;
  }

  const contextType = courtBlockContextSelect?.value || 'league';
  const entities =
    contextType === 'league'
      ? Array.isArray(state.leagues)
        ? state.leagues
        : []
      : Array.isArray(state.tournaments)
        ? state.tournaments
        : [];

  const previousValue = courtBlockEntitySelect.value;
  courtBlockEntitySelect.innerHTML = '';

  if (!entities.length) {
    const message =
      contextType === 'league'
        ? 'No hay ligas activas para asignar bloqueos.'
        : 'No hay torneos activos para asignar bloqueos.';
    const option = new Option(message, '', true, true);
    option.disabled = true;
    courtBlockEntitySelect.appendChild(option);
    courtBlockEntitySelect.disabled = true;
    if (courtBlockSubmit) {
      courtBlockSubmit.disabled = true;
    }
    return;
  }

  courtBlockEntitySelect.disabled = false;
  if (courtBlockSubmit) {
    courtBlockSubmit.disabled = false;
  }

  const options = entities.map((entity) => {
    const id = entity?._id || entity?.id;
    const labelParts = [];
    if (entity?.name) {
      labelParts.push(entity.name);
    }
    if (entity?.year) {
      labelParts.push(entity.year);
    }
    const label = labelParts.length ? labelParts.join(' · ') : 'Competición';
    return { id, label };
  });

  let resolvedValue = previousValue;
  if (!options.some((option) => option.id === resolvedValue)) {
    resolvedValue = options[0]?.id || '';
  }

  options.forEach((option) => {
    if (!option.id) {
      return;
    }
    const element = new Option(option.label, option.id, false, option.id === resolvedValue);
    courtBlockEntitySelect.appendChild(element);
  });

  courtBlockEntitySelect.value = resolvedValue;
}

function setCourtBlockDefaultRange(baseDate = new Date()) {
  if (!courtBlockStartInput || !courtBlockEndInput) {
    return;
  }

  const reference = new Date(baseDate);
  if (Number.isNaN(reference.getTime())) {
    return;
  }

  if (reference.getHours() === 0 && reference.getMinutes() === 0) {
    reference.setHours(9, 0, 0, 0);
  }

  const start = roundDateUpToInterval(reference, CALENDAR_TIME_SLOT_MINUTES);
  const end = new Date(start.getTime() + COURT_RESERVATION_DEFAULT_DURATION * 60 * 1000);
  courtBlockStartInput.value = formatDateTimeLocal(start);
  courtBlockEndInput.value = formatDateTimeLocal(end);
}

function ensureCourtBlockRangeDefaults(baseDate = new Date()) {
  if (!courtBlockStartInput || !courtBlockEndInput) {
    return;
  }

  if (!courtBlockStartInput.value || !courtBlockEndInput.value) {
    setCourtBlockDefaultRange(baseDate);
  }
}

function resetCourtReservationForm() {
  if (!courtReservationForm) {
    return;
  }

  const baseDate = roundDateUpToInterval(new Date(), CALENDAR_TIME_SLOT_MINUTES);
  const dateValue = formatDateInput(baseDate);
  const timeValue = formatTimeInputValue(baseDate);
  if (courtReservationDateInput) {
    courtReservationDateInput.value = dateValue;
  }
  if (courtReservationTimeInput) {
    courtReservationTimeInput.value = timeValue;
  }
  if (courtReservationDurationSelect) {
    courtReservationDurationSelect.value = String(COURT_RESERVATION_DEFAULT_DURATION);
  }
  if (courtReservationNotesInput) {
    courtReservationNotesInput.value = '';
  }
  populateCourtReservationCourts();
  setStatusMessage(courtReservationStatus, '', '');
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
  tournaments: [],
  tournamentDetails: new Map(),
  selectedTournamentId: '',
  selectedTournamentCategoriesId: '',
  selectedEnrollmentTournamentId: '',
  selectedEnrollmentCategoryId: '',
  selectedMatchTournamentId: '',
  selectedMatchCategoryId: '',
  tournamentEnrollments: new Map(),
  tournamentMatches: new Map(),
  activeSection: 'section-dashboard',
  globalOverview: null,
  leagueDashboard: null,
  tournamentDashboard: null,
  calendarMatches: [],
  calendarDate: new Date(),
  globalCalendarDate: new Date(),
  matchPagination: {
    upcoming: {},
    pending: {},
    completed: {},
  },
  adminCategoryEditingId: null,
  adminPlayerEditingId: null,
  adminMatchEditingId: null,
  seasons: [],
  club: null,
  rankingsByCategory: new Map(),
  rankingsLoading: false,
  generalChatMessages: [],
  noticeUnreadCount: 0,
  playerDirectoryFilters: {
    search: '',
    gender: '',
    role: '',
    category: '',
  },
  leaguePlayersFilters: {
    league: '',
    category: '',
    search: '',
    gender: '',
  },
  leaguePlayersLoading: false,
  leagueDetails: new Map(),
  leaguePayments: new Map(),
  leaguePaymentFilters: {
    league: '',
    status: '',
    search: '',
  },
  leaguePaymentsLoading: false,
  courtReservations: [],
  courtAvailability: [],
  courtAvailabilityDate: new Date(),
  courtAdminDate: new Date(),
  courtAdminSchedule: [],
  courtAdminBlocks: [],
  courtCalendarDate: new Date(),
  courtCalendarEvents: [],
  courtBlocks: [],
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
const globalLeaguesCount = document.getElementById('global-leagues-count');
const globalTournamentsCount = document.getElementById('global-tournaments-count');
const globalCategoriesCount = document.getElementById('global-categories-count');
const globalCourtsCount = document.getElementById('global-courts-count');
const globalLeaguesList = document.getElementById('global-leagues-list');
const globalTournamentsList = document.getElementById('global-tournaments-list');
const globalUpcomingMatchesList = document.getElementById('global-upcoming-matches');
const leagueMetricPlayers = document.getElementById('league-metric-players');
const leagueMetricCategories = document.getElementById('league-metric-categories');
const leagueMetricUpcoming = document.getElementById('league-metric-upcoming');
const leagueRankingCards = document.getElementById('league-ranking-cards');
const leagueUpcomingMatchesList = document.getElementById('league-upcoming-matches');
const tournamentMetricActive = document.getElementById('tournament-metric-active');
const tournamentMetricCategories = document.getElementById('tournament-metric-categories');
const tournamentMetricUpcoming = document.getElementById('tournament-metric-upcoming');
const tournamentDrawCards = document.getElementById('tournament-draw-cards');
const tournamentUpcomingMatchesList = document.getElementById('tournament-upcoming-matches');
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
const courtReservationForm = document.getElementById('court-reservation-form');
const courtReservationDateInput = document.getElementById('court-reservation-date');
const courtReservationTimeInput = document.getElementById('court-reservation-time');
const courtReservationDurationSelect = document.getElementById('court-reservation-duration');
const courtReservationCourtSelect = document.getElementById('court-reservation-court');
const courtReservationNotesInput = document.getElementById('court-reservation-notes');
const courtReservationStatus = document.getElementById('court-reservation-status');
const courtReservationSubmit = document.getElementById('court-reservation-submit');
const courtReservationList = document.getElementById('court-reservation-list');
const courtReservationEmpty = document.getElementById('court-reservation-empty');
const courtAvailabilityDateInput = document.getElementById('court-availability-date');
const courtAvailabilityList = document.getElementById('court-availability-list');
const courtAvailabilityEmpty = document.getElementById('court-availability-empty');
const courtAdminDateInput = document.getElementById('court-admin-date');
const courtAdminSchedule = document.getElementById('court-admin-schedule');
const courtAdminEmpty = document.getElementById('court-admin-empty');
const courtAdminStatus = document.getElementById('court-admin-status');
const courtCalendarContainer = document.getElementById('court-calendar-container');
const courtCalendarLabel = document.getElementById('court-calendar-label');
const courtCalendarPrev = document.getElementById('court-calendar-prev');
const courtCalendarNext = document.getElementById('court-calendar-next');
const courtCalendarStatus = document.getElementById('court-calendar-status');
const courtBlockForm = document.getElementById('court-block-form');
const courtBlockContextSelect = document.getElementById('court-block-context');
const courtBlockEntitySelect = document.getElementById('court-block-entity');
const courtBlockCourtsSelect = document.getElementById('court-block-courts');
const courtBlockStartInput = document.getElementById('court-block-start');
const courtBlockEndInput = document.getElementById('court-block-end');
const courtBlockNotesInput = document.getElementById('court-block-notes');
const courtBlockStatus = document.getElementById('court-block-status');
const courtBlocksList = document.getElementById('court-blocks-list');
const courtBlocksEmpty = document.getElementById('court-blocks-empty');
const courtBlockSubmit = courtBlockForm ? courtBlockForm.querySelector('button[type="submit"]') : null;
const rankingPrintButton = document.getElementById('ranking-print-button');
const logoutButtons = Array.from(document.querySelectorAll('[data-action="logout"]'));
const globalMessage = document.getElementById('global-message');
const categoriesList = document.getElementById('categories-list');
const leaguesList = document.getElementById('leagues-list');
const notificationsList = document.getElementById('notifications-list');
const matchesMenuBadge = document.getElementById('menu-matches-badge');
const notificationsMenuBadge = document.getElementById('menu-notifications-badge');
const noticesMenuBadge = document.getElementById('menu-notices-badge');
const metricNotifications = document.getElementById('metric-notifications');
const tournamentsList = document.getElementById('tournaments-list');
const tournamentDetailCard = document.getElementById('tournament-detail-card');
const tournamentDetailTitle = document.getElementById('tournament-detail-title');
const tournamentDetailSubtitle = document.getElementById('tournament-detail-subtitle');
const tournamentDetailBody = document.getElementById('tournament-detail-body');
const tournamentCategoryTournamentSelect = document.getElementById('tournament-category-tournament');
const tournamentCategoriesList = document.getElementById('tournament-categories-list');
const tournamentCategoriesEmpty = document.getElementById('tournament-categories-empty');
const tournamentEnrollmentTournamentSelect = document.getElementById('tournament-enrollment-tournament');
const tournamentEnrollmentCategorySelect = document.getElementById('tournament-enrollment-category');
const tournamentEnrollmentList = document.getElementById('tournament-enrollment-list');
const tournamentEnrollmentEmpty = document.getElementById('tournament-enrollment-empty');
const tournamentMatchTournamentSelect = document.getElementById('tournament-match-tournament');
const tournamentMatchCategorySelect = document.getElementById('tournament-match-category');
const tournamentMatchesList = document.getElementById('tournament-matches-list');
const tournamentMatchesEmpty = document.getElementById('tournament-matches-empty');
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
const pendingApprovalsList = document.getElementById('pending-approvals');
const completedMatchesList = document.getElementById('completed-matches');
let pendingTournamentDetailId = null;
let pendingTournamentEnrollmentKey = '';
let pendingTournamentMatchesKey = '';
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
const leagueRulesContent = document.getElementById('rules-content');
const leagueRulesEditButton = document.getElementById('rules-edit-button');
const tournamentRulesContent = document.getElementById('tournament-rules-content');
const tournamentRulesEditButton = document.getElementById('tournament-rules-edit-button');
const rankingStatus = document.getElementById('ranking-status');
const rankingCategoryList = document.getElementById('ranking-category-list');
const rankingEmpty = document.getElementById('ranking-empty');
const menuButtons = appMenu ? Array.from(appMenu.querySelectorAll('.menu-button')) : [];
const leaguePaymentsMenuButton = appMenu
  ? appMenu.querySelector('[data-target="section-league-payments"]')
  : null;
const leaguePaymentsSection = document.getElementById('section-league-payments');
const adminMenuButtons = menuButtons.filter((button) => button.dataset.requiresAdmin === 'true');
const adminSectionIds = new Set(adminMenuButtons.map((button) => button.dataset.target));
const courtManagerMenuButtons = menuButtons.filter(
  (button) => button.dataset.requiresCourtManager === 'true'
);
const courtManagerSectionIds = new Set(
  courtManagerMenuButtons.map((button) => button.dataset.target)
);
const menuButtonInitialHidden = new Map(menuButtons.map((button) => [button, button.hidden]));
const adminToggleElements = document.querySelectorAll('[data-admin-visible="toggle"]');

function setMenuGroupExpanded(menuGroup, expanded) {
  if (!menuGroup) return;
  const { parentButton, submenu, group } = menuGroup;
  if (parentButton) {
    parentButton.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }
  if (group) {
    group.classList.toggle('menu-group--expanded', expanded);
  }
  if (submenu) {
    submenu.hidden = !expanded;
  }
}

const collapsibleMenuGroups = appMenu
  ? Array.from(appMenu.querySelectorAll('[data-collapsible="true"]'))
      .map((group) => {
        const parentButton = group.querySelector('.menu-button--parent');
        const submenu = group.querySelector('.menu-submenu');
        if (!parentButton || !submenu) {
          return null;
        }
        const menuGroup = {
          group,
          parentButton,
          submenu,
          target: parentButton.dataset.target || null,
        };
        setMenuGroupExpanded(menuGroup, false);
        return menuGroup;
      })
      .filter(Boolean)
  : [];

const collapsibleMenuGroupsByTarget = new Map();
collapsibleMenuGroups.forEach((menuGroup) => {
  if (menuGroup.target) {
    collapsibleMenuGroupsByTarget.set(menuGroup.target, menuGroup);
  }
});
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
const leaguePlayersList = document.getElementById('league-players-list');
const leaguePlayersCount = document.getElementById('league-players-count');
const leaguePlayersLeagueSelect = document.getElementById('league-players-league');
const leaguePlayersCategorySelect = document.getElementById('league-players-category');
const leaguePlayersSearch = document.getElementById('league-players-search');
const leaguePlayersGender = document.getElementById('league-players-gender');
const leaguePlayersEmpty = document.getElementById('league-players-empty');
const leaguePaymentsList = document.getElementById('league-payments-list');
const leaguePaymentsCount = document.getElementById('league-payments-count');
const leaguePaymentsLeagueSelect = document.getElementById('league-payments-league');
const leaguePaymentsStatusSelect = document.getElementById('league-payments-status');
const leaguePaymentsSearchInput = document.getElementById('league-payments-search');
const leaguePaymentsEmpty = document.getElementById('league-payments-empty');
const leaguePaymentsFeeBadge = document.getElementById('league-payments-fee');
const leaguePaymentsStatusMessage = document.getElementById('league-payments-status');
const playerDirectoryList = document.getElementById('user-directory-list');
const playerDirectoryCount = document.getElementById('user-directory-count');
const playerDirectorySearch = document.getElementById('user-directory-search');
const playerDirectoryGender = document.getElementById('user-directory-gender');
const playerDirectoryRole = document.getElementById('user-directory-role');
const playerDirectoryCategory = document.getElementById('user-directory-category');
const playerDirectoryEmpty = document.getElementById('user-directory-empty');
const categoryCreateButton = document.getElementById('category-create-button');
const leagueCreateButton = document.getElementById('league-create-button');
const matchCreateButton = document.getElementById('match-create-button');
const matchGenerateButton = document.getElementById('match-generate-button');
const playerCreateButton = document.getElementById('player-create-button');
const tournamentCreateButton = document.getElementById('tournament-create-button');
const tournamentEditButton = document.getElementById('tournament-edit-button');
const tournamentCategoryCreateButton = document.getElementById(
  'tournament-category-create-button'
);
const tournamentEnrollmentAddButton = document.getElementById(
  'tournament-enrollment-add-button'
);
const tournamentDrawGenerateButton = document.getElementById('tournament-draw-generate-button');
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

function formatSkillLevelLabel(value) {
  const option = CATEGORY_SKILL_LEVEL_OPTIONS.find((entry) => entry.value === value);
  return option ? option.label : value || '';
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

function updateTournamentActionAvailability() {
  if (tournamentEditButton) {
    tournamentEditButton.disabled = !state.selectedTournamentId;
  }

  const hasTournaments = Array.isArray(state.tournaments) && state.tournaments.length > 0;

  if (tournamentCategoryCreateButton) {
    tournamentCategoryCreateButton.disabled = !hasTournaments;
  }

  if (tournamentEnrollmentAddButton) {
    tournamentEnrollmentAddButton.disabled = !hasTournaments;
  }

  if (tournamentDrawGenerateButton) {
    tournamentDrawGenerateButton.disabled = !hasTournaments;
  }
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
    metricNotifications.hidden = count <= 0;
  }
  updateNotificationsMenuBadge(count);
  return count;
}

function ensureLeaguePlayerFilters() {
  if (!state.leaguePlayersFilters) {
    state.leaguePlayersFilters = {
      league: '',
      category: '',
      search: '',
      gender: '',
    };
  }
  return state.leaguePlayersFilters;
}

function ensureLeaguePaymentFilters() {
  if (!state.leaguePaymentFilters) {
    state.leaguePaymentFilters = {
      league: '',
      status: '',
      search: '',
    };
  }
  return state.leaguePaymentFilters;
}

function leagueHasEnrollmentFee(league) {
  if (!league) return false;
  const fee = Number(league.enrollmentFee);
  return Number.isFinite(fee) && fee > 0;
}

function getLeaguesWithEnrollmentFee() {
  return Array.isArray(state.leagues)
    ? state.leagues.filter((league) => leagueHasEnrollmentFee(league))
    : [];
}

function getLeagueCategories(leagueId) {
  if (!leagueId) return [];
  const categories = Array.isArray(state.categories) ? state.categories : [];
  return categories.filter((category) => normalizeId(category?.league) === leagueId);
}

function getLeagueIdForCategory(categoryId) {
  if (!categoryId) return '';
  const category = Array.isArray(state.categories)
    ? state.categories.find((entry) => normalizeId(entry) === categoryId)
    : null;
  return category ? normalizeId(category.league) : '';
}

function invalidateLeaguePaymentsByCategory(categoryId) {
  const leagueId = getLeagueIdForCategory(categoryId);
  if (leagueId && state.leaguePayments instanceof Map) {
    state.leaguePayments.delete(leagueId);
  }
}

function pruneLeagueCaches() {
  const leagues = Array.isArray(state.leagues) ? state.leagues : [];
  const activeLeagueIds = new Set(
    leagues.map((league) => normalizeId(league)).filter((value) => Boolean(value))
  );

  if (state.leagueDetails instanceof Map) {
    Array.from(state.leagueDetails.keys()).forEach((leagueId) => {
      if (!activeLeagueIds.has(leagueId)) {
        state.leagueDetails.delete(leagueId);
      }
    });
  }

  if (state.leaguePayments instanceof Map) {
    Array.from(state.leaguePayments.keys()).forEach((leagueId) => {
      if (!activeLeagueIds.has(leagueId)) {
        state.leaguePayments.delete(leagueId);
      }
    });
  }

  const filters = ensureLeaguePaymentFilters();
  let filtersReset = false;
  if (filters.league && !activeLeagueIds.has(filters.league)) {
    filters.league = '';
    filters.status = '';
    filters.search = '';
    filtersReset = true;
  }

  return { filtersReset };
}

function formatLeagueOptionLabel(league) {
  if (!league) return 'Liga';
  const name = league.name || 'Liga';
  const year = league.year ? ` · ${league.year}` : '';
  return `${name}${year}`;
}

function updateLeaguePlayersCategoryOptions() {
  if (!leaguePlayersCategorySelect) return [];
  const filters = ensureLeaguePlayerFilters();
  const leagueId = filters.league;
  const categories = getLeagueCategories(leagueId);
  const previousCategory = filters.category;
  const options = categories
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));

  leaguePlayersCategorySelect.innerHTML = '<option value="">Todas las categorías</option>';
  const availableIds = new Set();

  options.forEach((category) => {
    const id = normalizeId(category);
    if (!id || availableIds.has(id)) {
      return;
    }
    availableIds.add(id);
    const option = document.createElement('option');
    option.value = id;
    option.textContent = `${category.name} (${translateGender(category.gender)})`;
    leaguePlayersCategorySelect.appendChild(option);
  });

  let nextCategory = '';
  if (previousCategory && availableIds.has(previousCategory)) {
    nextCategory = previousCategory;
  }
  filters.category = nextCategory;
  leaguePlayersCategorySelect.value = nextCategory;
  leaguePlayersCategorySelect.disabled = !options.length;
  return options;
}

function updateLeaguePlayersControls({ resetSelection = false } = {}) {
  if (!leaguePlayersLeagueSelect) return;

  const filters = ensureLeaguePlayerFilters();
  const categories = Array.isArray(state.categories) ? state.categories : [];
  const leagues = Array.isArray(state.leagues) ? state.leagues : [];
  const previousLeague = !resetSelection ? filters.league : '';

  const leaguesWithCategories = leagues.filter((league) => {
    const leagueId = normalizeId(league);
    return categories.some((category) => normalizeId(category.league) === leagueId);
  });

  const sortedLeagues = leaguesWithCategories
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
      return (a.name || '').localeCompare(b.name || '', 'es');
    });

  leaguePlayersLeagueSelect.innerHTML = '<option value="">Selecciona una liga</option>';
  const availableLeagueIds = new Set();

  sortedLeagues.forEach((league) => {
    const id = normalizeId(league);
    if (!id || availableLeagueIds.has(id)) {
      return;
    }
    availableLeagueIds.add(id);
    const option = document.createElement('option');
    option.value = id;
    option.textContent = formatLeagueOptionLabel(league);
    leaguePlayersLeagueSelect.appendChild(option);
  });

  let nextLeague = '';
  if (previousLeague && availableLeagueIds.has(previousLeague)) {
    nextLeague = previousLeague;
  } else if (availableLeagueIds.size) {
    const firstOption = leaguePlayersLeagueSelect.options[1];
    nextLeague = firstOption?.value || '';
  }

  filters.league = nextLeague;
  leaguePlayersLeagueSelect.value = nextLeague;
  leaguePlayersLeagueSelect.disabled = !availableLeagueIds.size;

  const leagueCategories = updateLeaguePlayersCategoryOptions();
  const hasActiveSelection = Boolean(nextLeague) && leagueCategories.length > 0;

  if (leaguePlayersSearch) {
    if (!hasActiveSelection) {
      leaguePlayersSearch.value = '';
    } else {
      leaguePlayersSearch.value = filters.search || '';
    }
    leaguePlayersSearch.disabled = !hasActiveSelection;
  }

  if (leaguePlayersGender) {
    if (!hasActiveSelection) {
      leaguePlayersGender.value = '';
    } else {
      leaguePlayersGender.value = filters.gender || '';
    }
    leaguePlayersGender.disabled = !hasActiveSelection;
  }

  if (!hasActiveSelection && leaguePlayersList) {
    leaguePlayersList.innerHTML = '';
  }

  if (!hasActiveSelection && leaguePlayersCount) {
    leaguePlayersCount.textContent = '0';
  }

  if (!hasActiveSelection && leaguePlayersEmpty) {
    leaguePlayersEmpty.hidden = false;
    leaguePlayersEmpty.textContent = availableLeagueIds.size
      ? 'Selecciona una liga para ver los jugadores inscritos.'
      : 'Aún no hay ligas con categorías registradas.';
  }
}

function updateLeaguePaymentFeeIndicator(feeValue) {
  if (!leaguePaymentsFeeBadge) return;

  let resolvedFee = feeValue;
  if (typeof resolvedFee === 'undefined') {
    const filters = ensureLeaguePaymentFilters();
    const league = resolveLeague(filters.league);
    const fee = league ? Number(league.enrollmentFee) : NaN;
    resolvedFee = Number.isFinite(fee) ? fee : null;
  }

  if (Number.isFinite(resolvedFee) && resolvedFee > 0) {
    const formatted = formatCurrencyValue(resolvedFee, DEFAULT_LEAGUE_CURRENCY);
    leaguePaymentsFeeBadge.textContent = formatted || `${resolvedFee.toFixed(2)} ${DEFAULT_LEAGUE_CURRENCY}`;
    leaguePaymentsFeeBadge.hidden = false;
  } else {
    leaguePaymentsFeeBadge.textContent = '';
    leaguePaymentsFeeBadge.hidden = true;
  }
}

function updateLeaguePaymentControls({ resetSelection = false } = {}) {
  if (!leaguePaymentsLeagueSelect) return;

  const filters = ensureLeaguePaymentFilters();
  const previousLeague = filters.league || '';
  const leaguesWithFee = getLeaguesWithEnrollmentFee();
  const sorted = leaguesWithFee
    .slice()
    .sort((a, b) => formatLeagueOptionLabel(a).localeCompare(formatLeagueOptionLabel(b), 'es'));

  const availableIds = new Set();
  leaguePaymentsLeagueSelect.innerHTML = '<option value="">Selecciona una liga con cuota</option>';

  sorted.forEach((league) => {
    const id = normalizeId(league);
    if (!id || availableIds.has(id)) {
      return;
    }
    availableIds.add(id);
    const option = document.createElement('option');
    option.value = id;
    option.textContent = formatLeagueOptionLabel(league);
    leaguePaymentsLeagueSelect.appendChild(option);
  });

  const preferredLeague = resetSelection ? '' : previousLeague;
  let nextLeague = preferredLeague && availableIds.has(preferredLeague) ? preferredLeague : '';
  if (!nextLeague && availableIds.size) {
    const firstOption = leaguePaymentsLeagueSelect.options[1];
    nextLeague = firstOption?.value || '';
  }

  const resolvedLeague = nextLeague || '';
  const selectionChanged = resolvedLeague !== previousLeague;
  const shouldResetFilters = resetSelection || selectionChanged || !resolvedLeague;

  filters.league = resolvedLeague;
  if (shouldResetFilters) {
    filters.status = '';
    filters.search = '';
  }

  leaguePaymentsLeagueSelect.value = resolvedLeague;
  leaguePaymentsLeagueSelect.disabled = !availableIds.size;

  const hasSelection = Boolean(resolvedLeague);

  if (leaguePaymentsStatusSelect) {
    if (!hasSelection || shouldResetFilters) {
      leaguePaymentsStatusSelect.value = '';
    } else {
      leaguePaymentsStatusSelect.value = filters.status || '';
    }
    leaguePaymentsStatusSelect.disabled = !hasSelection;
  }

  if (leaguePaymentsSearchInput) {
    if (!hasSelection || shouldResetFilters) {
      leaguePaymentsSearchInput.value = '';
    } else {
      leaguePaymentsSearchInput.value = filters.search || '';
    }
    leaguePaymentsSearchInput.disabled = !hasSelection;
  }

  if (!hasSelection && leaguePaymentsList) {
    leaguePaymentsList.innerHTML = '';
  }

  if (!hasSelection && leaguePaymentsCount) {
    leaguePaymentsCount.textContent = '0';
  }

  if (!hasSelection && leaguePaymentsEmpty) {
    leaguePaymentsEmpty.hidden = false;
    leaguePaymentsEmpty.textContent = availableIds.size
      ? 'Selecciona una liga con cuota para ver los pagos.'
      : 'Configura una liga con cuota de inscripción para gestionar pagos.';
  }

  if (hasSelection && leaguePaymentsEmpty) {
    leaguePaymentsEmpty.hidden = true;
  }

  updateLeaguePaymentFeeIndicator();
  updateLeaguePaymentMenuVisibility();

  if (selectionChanged && hasSelection && state.activeSection === 'section-league-payments') {
    refreshLeaguePayments().catch((error) => {
      console.warn('No se pudo actualizar el listado de pagos de liga', error);
    });
  }
}

let leaguePlayersRequestToken = 0;
let leaguePaymentsRequestToken = 0;

async function refreshLeaguePlayers({ force = false } = {}) {
  if (!leaguePlayersList) return;

  const filters = ensureLeaguePlayerFilters();
  const leagueId = filters.league;

  leaguePlayersList.innerHTML = '';

  if (leaguePlayersCount) {
    leaguePlayersCount.textContent = '0';
  }

  if (!leagueId) {
    if (leaguePlayersEmpty) {
      leaguePlayersEmpty.hidden = false;
      leaguePlayersEmpty.textContent = leaguePlayersLeagueSelect?.disabled
        ? 'Aún no hay ligas con categorías registradas.'
        : 'Selecciona una liga para ver los jugadores inscritos.';
    }
    return;
  }

  const categories = getLeagueCategories(leagueId);
  if (!categories.length) {
    if (leaguePlayersEmpty) {
      leaguePlayersEmpty.hidden = false;
      leaguePlayersEmpty.textContent = 'La liga seleccionada todavía no tiene categorías registradas.';
    }
    return;
  }

  const categoryFilter = filters.category;
  const targetCategories = categoryFilter
    ? categories.filter((category) => normalizeId(category) === categoryFilter)
    : categories;

  if (!targetCategories.length) {
    filters.category = '';
    return refreshLeaguePlayers({ force });
  }

  const categoryIds = targetCategories
    .map((category) => normalizeId(category))
    .filter(Boolean);

  if (!categoryIds.length) {
    if (leaguePlayersEmpty) {
      leaguePlayersEmpty.hidden = false;
      leaguePlayersEmpty.textContent = 'No hay categorías disponibles para la liga seleccionada.';
    }
    return;
  }

  const requestToken = ++leaguePlayersRequestToken;
  state.leaguePlayersLoading = true;

  if (leaguePlayersEmpty) {
    leaguePlayersEmpty.hidden = false;
    leaguePlayersEmpty.textContent = 'Cargando jugadores inscritos...';
  }

  try {
    await Promise.all(
      categoryIds.map((categoryId) => loadEnrollments(categoryId, { force }).catch((error) => {
        console.warn('No fue posible cargar las inscripciones de la categoría', categoryId, error);
        throw error;
      }))
    );
  } catch (error) {
    if (requestToken === leaguePlayersRequestToken) {
      leaguePlayersList.innerHTML = '';
      if (leaguePlayersEmpty) {
        leaguePlayersEmpty.hidden = false;
        leaguePlayersEmpty.textContent = 'No fue posible cargar los jugadores inscritos.';
      }
      if (leaguePlayersCount) {
        leaguePlayersCount.textContent = '0';
      }
    }
    state.leaguePlayersLoading = false;
    return;
  }

  if (requestToken !== leaguePlayersRequestToken) {
    state.leaguePlayersLoading = false;
    return;
  }

  const categoriesById = new Map();
  targetCategories.forEach((category) => {
    const id = normalizeId(category);
    if (id) {
      categoriesById.set(id, category);
    }
  });

  const playerMap = new Map();

  categoryIds.forEach((categoryId) => {
    const enrollments = state.enrollments.get(categoryId) || [];
    enrollments.forEach((enrollment) => {
      const player = enrollment?.user || {};
      const playerId = normalizeId(player);
      if (!playerId) return;

      if (!playerMap.has(playerId)) {
        playerMap.set(playerId, {
          player,
          categories: new Set(),
        });
      }
      playerMap.get(playerId).categories.add(categoryId);
    });
  });

  const searchTerm = (filters.search || '').toLowerCase();
  const genderFilter = filters.gender || '';

  const entries = Array.from(playerMap.values())
    .filter(({ player }) => {
      if (genderFilter && player.gender !== genderFilter) {
        return false;
      }
      if (searchTerm) {
        const haystack = `${player.fullName || ''} ${player.email || ''} ${player.phone || ''}`.toLowerCase();
        if (!haystack.includes(searchTerm)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const nameA = (a.player.fullName || '').toLocaleLowerCase('es');
      const nameB = (b.player.fullName || '').toLocaleLowerCase('es');
      return nameA.localeCompare(nameB, 'es');
    });

  if (leaguePlayersCount) {
    leaguePlayersCount.textContent = String(entries.length);
  }

  if (!entries.length) {
    leaguePlayersList.innerHTML = '';
    if (leaguePlayersEmpty) {
      leaguePlayersEmpty.hidden = false;
      leaguePlayersEmpty.textContent =
        filters.search || filters.gender
          ? 'Aún no hay jugadores inscritos que coincidan con el filtro seleccionado.'
          : 'Aún no hay jugadores inscritos en la selección actual.';
    }
    state.leaguePlayersLoading = false;
    return;
  }

  if (leaguePlayersEmpty) {
    leaguePlayersEmpty.hidden = true;
  }

  leaguePlayersList.innerHTML = '';

  entries.forEach(({ player, categories: playerCategories }) => {
    const item = document.createElement('li');
    item.appendChild(buildPlayerCell(player, { includeSchedule: true }));

    const contact = document.createElement('div');
    contact.className = 'meta';
    if (player.email) {
      contact.appendChild(document.createElement('span')).textContent = player.email;
    }
    if (player.phone) {
      contact.appendChild(document.createElement('span')).textContent = player.phone;
    }
    if (contact.childNodes.length) {
      item.appendChild(contact);
    }

    const details = document.createElement('div');
    details.className = 'meta';
    const genderLabel = translateGender(player.gender) || 'Sin definir';
    details.appendChild(document.createElement('span')).textContent = `Género: ${genderLabel}`;

    const categoryNames = Array.from(playerCategories)
      .map((categoryId) => categoriesById.get(categoryId)?.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es'));

    details.appendChild(document.createElement('span')).textContent = `Categorías: ${
      categoryNames.length ? categoryNames.join(', ') : 'Sin asignar'
    }`;

    item.appendChild(details);

    leaguePlayersList.appendChild(item);
  });

  state.leaguePlayersLoading = false;
}

async function fetchLeagueDetail(leagueId, { force = false } = {}) {
  const normalized = normalizeId(leagueId);
  if (!normalized) {
    return null;
  }

  if (!force && state.leagueDetails instanceof Map && state.leagueDetails.has(normalized)) {
    return state.leagueDetails.get(normalized);
  }

  try {
    const response = await request(`/leagues/${normalized}`);
    const detail = response?.league || null;
    if (!(state.leagueDetails instanceof Map)) {
      state.leagueDetails = new Map();
    }
    if (detail) {
      state.leagueDetails.set(normalized, detail);
    } else {
      state.leagueDetails.delete(normalized);
    }
    return detail;
  } catch (error) {
    if (state.leagueDetails instanceof Map) {
      state.leagueDetails.delete(normalized);
    }
    throw error;
  }
}

async function getLeaguePaymentData(leagueId, { force = false } = {}) {
  const normalized = normalizeId(leagueId);
  if (!normalized) {
    return { entries: [], fee: null };
  }

  if (!force && state.leaguePayments instanceof Map && state.leaguePayments.has(normalized)) {
    return state.leaguePayments.get(normalized);
  }

  const detail = await fetchLeagueDetail(normalized, { force });
  if (!detail) {
    if (state.leaguePayments instanceof Map) {
      state.leaguePayments.delete(normalized);
    }
    return { entries: [], fee: null };
  }

  const categories = getLeagueCategories(normalized);
  const categoryIds = categories.map((category) => normalizeId(category)).filter(Boolean);

  if (categoryIds.length) {
    await Promise.all(categoryIds.map((categoryId) => loadEnrollments(categoryId, { force })));
  }

  const categoriesById = new Map();
  categories.forEach((category) => {
    const id = normalizeId(category);
    if (id) {
      categoriesById.set(id, category);
    }
  });

  const payments = Array.isArray(detail.payments) ? detail.payments : [];
  const paymentByUser = new Map();
  payments.forEach((payment) => {
    const userId = normalizeId(payment?.user);
    if (!userId) return;
    paymentByUser.set(userId, payment);
  });

  const playerMap = new Map();
  categoryIds.forEach((categoryId) => {
    const enrollments = state.enrollments.get(categoryId) || [];
    enrollments.forEach((enrollment) => {
      const player = enrollment?.user || {};
      const playerId = normalizeId(player);
      if (!playerId) return;
      if (!playerMap.has(playerId)) {
        playerMap.set(playerId, {
          player,
          categories: new Set(),
        });
      }
      playerMap.get(playerId).categories.add(categoryId);
    });
  });

  const feeValue = Number(detail.enrollmentFee);
  const normalizedFee = Number.isFinite(feeValue) && feeValue > 0 ? feeValue : null;

  const createEntry = ({ player, playerId, categories: playerCategories, payment, hasEnrollment }) => {
    const normalizedPlayer = player && typeof player === 'object' ? player : {};
    const amountValue = Number(payment?.amount);
    const resolvedAmount = Number.isFinite(amountValue) && amountValue >= 0
      ? amountValue
      : normalizedFee;

    return {
      player: normalizedPlayer,
      playerId,
      categories: playerCategories,
      paymentRecord: payment || null,
      paymentId: payment ? normalizeId(payment) : '',
      status: payment?.status && PAYMENT_STATUS_LABELS[payment.status] ? payment.status : 'pendiente',
      amount: typeof resolvedAmount === 'number' ? resolvedAmount : null,
      method: payment?.method || '',
      reference: payment?.reference || '',
      notes: payment?.notes || '',
      paidAt: payment?.paidAt || null,
      recordedBy: payment?.recordedBy || null,
      updatedAt: payment?.updatedAt || payment?.createdAt || null,
      hasEnrollment,
    };
  };

  const entries = [];

  playerMap.forEach(({ player, categories: playerCategories }, playerId) => {
    const payment = paymentByUser.get(playerId) || null;
    if (payment) {
      paymentByUser.delete(playerId);
    }
    const categoriesForPlayer = Array.from(playerCategories)
      .map((categoryId) => categoriesById.get(categoryId))
      .filter(Boolean);

    entries.push(
      createEntry({
        player,
        playerId,
        categories: categoriesForPlayer,
        payment,
        hasEnrollment: true,
      })
    );
  });

  paymentByUser.forEach((payment, userId) => {
    const player = typeof payment?.user === 'object' ? payment.user : {};
    entries.push(
      createEntry({
        player,
        playerId: userId,
        categories: [],
        payment,
        hasEnrollment: false,
      })
    );
  });

  entries.sort((a, b) => {
    const statusWeightA = PAYMENT_STATUS_ORDER[a.status] ?? 99;
    const statusWeightB = PAYMENT_STATUS_ORDER[b.status] ?? 99;
    if (statusWeightA !== statusWeightB) {
      return statusWeightA - statusWeightB;
    }
    const nameA = (a.player.fullName || a.player.email || '').toLocaleLowerCase('es');
    const nameB = (b.player.fullName || b.player.email || '').toLocaleLowerCase('es');
    if (nameA && nameB) {
      return nameA.localeCompare(nameB, 'es');
    }
    if (nameA) return -1;
    if (nameB) return 1;
    return 0;
  });

  const result = {
    entries,
    fee: normalizedFee,
  };

  if (!(state.leaguePayments instanceof Map)) {
    state.leaguePayments = new Map();
  }
  state.leaguePayments.set(normalized, result);

  return result;
}

function renderLeaguePayments(entries = [], { fee = null } = {}) {
  if (!leaguePaymentsList) return;

  if (leaguePaymentsCount) {
    leaguePaymentsCount.textContent = String(entries.length);
  }

  updateLeaguePaymentFeeIndicator(fee);

  leaguePaymentsList.innerHTML = '';

  if (!entries.length) {
    if (leaguePaymentsEmpty) {
      leaguePaymentsEmpty.hidden = false;
      leaguePaymentsEmpty.textContent = 'No hay registros de pago para la selección actual.';
    }
    return;
  }

  if (leaguePaymentsEmpty) {
    leaguePaymentsEmpty.hidden = true;
  }

  entries.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'league-payment-item';

    const header = document.createElement('div');
    header.className = 'league-payment-header';

    const playerWrapper = document.createElement('div');
    playerWrapper.innerHTML = buildPlayerCell(entry.player || {}, { includeSchedule: false });
    const playerCell = playerWrapper.firstElementChild;
    if (playerCell) {
      header.appendChild(playerCell);
    }

    const statusMeta = document.createElement('div');
    statusMeta.className = 'league-payment-meta';

    const statusBadge = document.createElement('span');
    statusBadge.className = `tag payment-status payment-status--${entry.status}`;
    statusBadge.textContent = PAYMENT_STATUS_LABELS[entry.status] || entry.status || 'Pendiente';
    statusMeta.appendChild(statusBadge);

    if (Number.isFinite(entry.amount)) {
      const amountSpan = document.createElement('span');
      amountSpan.textContent =
        formatCurrencyValue(entry.amount, DEFAULT_LEAGUE_CURRENCY) ||
        `${entry.amount.toFixed(2)} ${DEFAULT_LEAGUE_CURRENCY}`;
      statusMeta.appendChild(amountSpan);
    }

    if (entry.paidAt) {
      const paidAtSpan = document.createElement('span');
      paidAtSpan.textContent = `Pago: ${formatShortDate(entry.paidAt)}`;
      statusMeta.appendChild(paidAtSpan);
    }

    if (!entry.hasEnrollment) {
      const noteSpan = document.createElement('span');
      noteSpan.textContent = 'Sin inscripción activa';
      statusMeta.appendChild(noteSpan);
    }

    header.appendChild(statusMeta);

    const categoryNames = entry.categories.map((category) => category?.name || '').filter(Boolean);
    const categoriesMeta = document.createElement('div');
    categoriesMeta.className = 'league-payment-meta';
    categoriesMeta.textContent = categoryNames.length
      ? `Categorías: ${categoryNames.join(', ')}`
      : 'Categorías: Sin asignar';
    header.appendChild(categoriesMeta);

    if (entry.player?.email || entry.player?.phone) {
      const contactMeta = document.createElement('div');
      contactMeta.className = 'league-payment-meta';
      if (entry.player.email) {
        contactMeta.appendChild(document.createElement('span')).textContent = entry.player.email;
      }
      if (entry.player.phone) {
        contactMeta.appendChild(document.createElement('span')).textContent = entry.player.phone;
      }
      header.appendChild(contactMeta);
    }

    if (entry.recordedBy?.fullName) {
      const recordedMeta = document.createElement('div');
      recordedMeta.className = 'league-payment-meta';
      recordedMeta.textContent = `Actualizado por ${entry.recordedBy.fullName}`;
      header.appendChild(recordedMeta);
    }

    item.appendChild(header);

    const form = document.createElement('form');
    form.className = 'league-payment-form';
    form.dataset.leaguePaymentForm = 'true';
    if (entry.playerId) {
      form.dataset.userId = entry.playerId;
    }
    if (entry.paymentId) {
      form.dataset.paymentId = entry.paymentId;
    }

    const statusRow = document.createElement('div');
    statusRow.className = 'form-row';

    const statusLabel = document.createElement('label');
    statusLabel.textContent = 'Estado';
    const statusSelect = document.createElement('select');
    statusSelect.name = 'status';
    Object.entries(PAYMENT_STATUS_LABELS).forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (value === entry.status) {
        option.selected = true;
      }
      statusSelect.appendChild(option);
    });
    statusLabel.appendChild(statusSelect);
    statusRow.appendChild(statusLabel);

    const amountLabel = document.createElement('label');
    amountLabel.textContent = 'Importe';
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.name = 'amount';
    amountInput.min = '0';
    amountInput.step = '0.01';
    if (Number.isFinite(entry.amount)) {
      amountInput.value = entry.amount.toFixed(2);
    } else if (Number.isFinite(fee) && fee > 0) {
      const formattedFee =
        formatCurrencyValue(fee, DEFAULT_LEAGUE_CURRENCY) || `${fee.toFixed(2)} ${DEFAULT_LEAGUE_CURRENCY}`;
      amountInput.placeholder = formattedFee;
    }
    amountLabel.appendChild(amountInput);
    statusRow.appendChild(amountLabel);
    form.appendChild(statusRow);

    const detailsRow = document.createElement('div');
    detailsRow.className = 'form-row';

    const methodLabel = document.createElement('label');
    methodLabel.textContent = 'Método';
    const methodInput = document.createElement('input');
    methodInput.type = 'text';
    methodInput.name = 'method';
    methodInput.placeholder = 'Transferencia, efectivo, etc.';
    methodInput.value = entry.method || '';
    methodLabel.appendChild(methodInput);
    detailsRow.appendChild(methodLabel);

    const referenceLabel = document.createElement('label');
    referenceLabel.textContent = 'Referencia';
    const referenceInput = document.createElement('input');
    referenceInput.type = 'text';
    referenceInput.name = 'reference';
    referenceInput.placeholder = 'Identificador o concepto';
    referenceInput.value = entry.reference || '';
    referenceLabel.appendChild(referenceInput);
    detailsRow.appendChild(referenceLabel);
    form.appendChild(detailsRow);

    const notesRow = document.createElement('div');
    notesRow.className = 'form-row';

    const paidAtLabel = document.createElement('label');
    paidAtLabel.textContent = 'Fecha de pago';
    const paidAtInput = document.createElement('input');
    paidAtInput.type = 'date';
    paidAtInput.name = 'paidAt';
    paidAtInput.value = entry.paidAt ? formatDateInput(entry.paidAt) : '';
    paidAtLabel.appendChild(paidAtInput);
    notesRow.appendChild(paidAtLabel);

    const notesLabel = document.createElement('label');
    notesLabel.textContent = 'Notas';
    const notesInput = document.createElement('input');
    notesInput.type = 'text';
    notesInput.name = 'notes';
    notesInput.placeholder = 'Añade una nota interna';
    notesInput.value = entry.notes || '';
    notesLabel.appendChild(notesInput);
    notesRow.appendChild(notesLabel);
    form.appendChild(notesRow);

    const actionsRow = document.createElement('div');
    actionsRow.className = 'form-actions';
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'primary';
    submitButton.textContent = entry.paymentId ? 'Actualizar pago' : 'Registrar pago';
    actionsRow.appendChild(submitButton);
    form.appendChild(actionsRow);

    item.appendChild(form);
    leaguePaymentsList.appendChild(item);
  });
}

async function refreshLeaguePayments({ force = false } = {}) {
  if (!leaguePaymentsList) return;

  const filters = ensureLeaguePaymentFilters();
  const leagueId = filters.league;

  if (!leagueId) {
    if (leaguePaymentsList) {
      leaguePaymentsList.innerHTML = '';
    }
    if (leaguePaymentsCount) {
      leaguePaymentsCount.textContent = '0';
    }
    const hasOptions = getLeaguesWithEnrollmentFee().length > 0;
    if (leaguePaymentsEmpty) {
      leaguePaymentsEmpty.hidden = false;
      leaguePaymentsEmpty.textContent = hasOptions
        ? 'Selecciona una liga con cuota para ver los pagos.'
        : 'Configura una liga con cuota de inscripción para gestionar pagos.';
    }
    updateLeaguePaymentFeeIndicator();
    setStatusMessage(leaguePaymentsStatusMessage, '', '');
    return;
  }

  const usingCachedData = !force && state.leaguePayments instanceof Map && state.leaguePayments.has(leagueId);

  if (!usingCachedData) {
    if (leaguePaymentsStatusMessage) {
      setStatusMessage(leaguePaymentsStatusMessage, 'info', 'Cargando registros de pago...');
    }
    if (leaguePaymentsEmpty) {
      leaguePaymentsEmpty.hidden = false;
      leaguePaymentsEmpty.textContent = 'Cargando registros de pago...';
    }
  }

  const requestToken = ++leaguePaymentsRequestToken;
  state.leaguePaymentsLoading = true;

  try {
    const data = await getLeaguePaymentData(leagueId, { force });
    if (requestToken !== leaguePaymentsRequestToken) {
      return;
    }

    const activeFilters = ensureLeaguePaymentFilters();
    const searchTerm = (activeFilters.search || '').trim().toLowerCase();
    const statusFilter = activeFilters.status || '';

    const filteredEntries = (data.entries || []).filter((entry) => {
      if (statusFilter && entry.status !== statusFilter) {
        return false;
      }
      if (searchTerm) {
        const categoryNames = entry.categories.map((category) => category?.name || '').join(' ');
        const haystack = `${entry.player?.fullName || ''} ${entry.player?.email || ''} ${
          entry.player?.phone || ''
        } ${categoryNames}`
          .toLowerCase()
          .trim();
        if (!haystack.includes(searchTerm)) {
          return false;
        }
      }
      return true;
    });

    renderLeaguePayments(filteredEntries, { fee: data.fee });

    if (leaguePaymentsStatusMessage) {
      setStatusMessage(leaguePaymentsStatusMessage, '', '');
    }
  } catch (error) {
    if (requestToken !== leaguePaymentsRequestToken) {
      return;
    }

    if (leaguePaymentsStatusMessage) {
      setStatusMessage(leaguePaymentsStatusMessage, 'error', error.message);
    }
    if (leaguePaymentsList) {
      leaguePaymentsList.innerHTML = '';
    }
    if (leaguePaymentsCount) {
      leaguePaymentsCount.textContent = '0';
    }
    if (leaguePaymentsEmpty) {
      leaguePaymentsEmpty.hidden = false;
      leaguePaymentsEmpty.textContent = 'No fue posible cargar los registros de pago.';
    }
  } finally {
    if (requestToken === leaguePaymentsRequestToken) {
      state.leaguePaymentsLoading = false;
    }
  }
}

async function handleLeaguePaymentFormSubmit(form) {
  if (!form) return;
  const filters = ensureLeaguePaymentFilters();
  const leagueId = filters.league;
  if (!leagueId) {
    setStatusMessage(leaguePaymentsStatusMessage, 'error', 'Selecciona una liga con cuota.');
    return;
  }

  const paymentId = form.dataset.paymentId || '';
  const userId = form.dataset.userId || '';
  const formData = new FormData(form);

  const payload = {};
  const statusValue = formData.get('status');
  if (statusValue && PAYMENT_STATUS_LABELS[statusValue]) {
    payload.status = statusValue;
  }

  const amountRaw = formData.get('amount');
  if (amountRaw !== null && amountRaw !== undefined) {
    const trimmed = String(amountRaw).trim();
    if (trimmed) {
      const normalizedAmount = Number.parseFloat(trimmed.replace(',', '.'));
      if (Number.isNaN(normalizedAmount) || normalizedAmount < 0) {
        setStatusMessage(leaguePaymentsStatusMessage, 'error', 'Introduce un importe válido.');
        return;
      }
      payload.amount = normalizedAmount;
    }
  }

  ['method', 'reference', 'notes'].forEach((field) => {
    if (formData.has(field)) {
      const value = (formData.get(field) || '').toString().trim();
      payload[field] = value || null;
    }
  });

  const paidAtValue = (formData.get('paidAt') || '').toString().trim();
  if (paidAtValue) {
    payload.paidAt = paidAtValue;
  } else if (paymentId) {
    payload.paidAt = null;
  }

  try {
    setStatusMessage(
      leaguePaymentsStatusMessage,
      'info',
      paymentId ? 'Actualizando pago...' : 'Registrando pago...'
    );

    if (paymentId) {
      await request(`/leagues/${leagueId}/payments/${paymentId}`, { method: 'PATCH', body: payload });
    } else {
      if (!userId) {
        throw new Error('No se puede registrar el pago sin un jugador asociado.');
      }
      await request(`/leagues/${leagueId}/payments`, {
        method: 'POST',
        body: { ...payload, user: userId },
      });
    }

    await fetchLeagueDetail(leagueId, { force: true });
    if (state.leaguePayments instanceof Map) {
      state.leaguePayments.delete(leagueId);
    }

    await refreshLeaguePayments({ force: true });

    setStatusMessage(
      leaguePaymentsStatusMessage,
      'success',
      paymentId ? 'Pago actualizado correctamente.' : 'Pago registrado correctamente.'
    );
  } catch (error) {
    setStatusMessage(leaguePaymentsStatusMessage, 'error', error.message);
  }
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

  const tournaments = Array.isArray(state.tournaments) ? state.tournaments : [];
  tournaments.forEach((tournament) => {
    const tournamentId = normalizeId(tournament);
    const tournamentName = tournament?.name || 'Torneo';
    const tournamentCategories = Array.isArray(tournament.categories) ? tournament.categories : [];
    tournamentCategories.forEach((category) => {
      const pendingCount = Number(
        category?.pendingEnrollmentCount || category?.enrollmentStats?.pending || 0
      );
      if (!Number.isFinite(pendingCount) || pendingCount <= 0) {
        return;
      }

      total += pendingCount;
      const categoryId = normalizeId(category);
      const categoryName = category?.name || 'Categoría';

      alerts.push({
        type: 'tournament-enrollment-request',
        tournamentId,
        categoryId,
        tournamentName,
        categoryName,
        pendingCount,
        countValue: pendingCount,
        scheduledFor: new Date().toISOString(),
        channel: 'torneos',
        title: `${tournamentName} · ${categoryName}`,
        message:
          pendingCount === 1
            ? `Hay 1 solicitud pendiente en ${categoryName} del torneo ${tournamentName}.`
            : `Hay ${pendingCount} solicitudes pendientes en ${categoryName} del torneo ${tournamentName}.`,
      });
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
    const matchingButtons = menuButtons.filter((button) => button.dataset.target === targetId);
    const targetButton =
      matchingButtons.find((button) => button.dataset.submenuToggle !== 'true') || matchingButtons[0];
    const parentTarget = targetButton?.dataset.parentTarget;
    if (parentTarget) {
      activeTargets.add(parentTarget);
    }
  }

  menuButtons.forEach((button) => {
    const target = button.dataset.target;
    button.classList.toggle('active', target ? activeTargets.has(target) : false);
  });

  if (collapsibleMenuGroups.length) {
    collapsibleMenuGroups.forEach((menuGroup) => {
      const shouldExpand = menuGroup.target ? activeTargets.has(menuGroup.target) : false;
      setMenuGroupExpanded(menuGroup, shouldExpand);
    });
  }
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

  updateLeaguePaymentMenuVisibility();

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

function updateLeaguePaymentMenuVisibility() {
  if (!leaguePaymentsMenuButton) return;

  const adminUser = isAdmin();
  const hasFeeLeagues = adminUser && getLeaguesWithEnrollmentFee().length > 0;
  leaguePaymentsMenuButton.hidden = !hasFeeLeagues;

  if (!hasFeeLeagues) {
    if (leaguePaymentsSection) {
      leaguePaymentsSection.hidden = true;
    }
    if (adminUser && state.activeSection === 'section-league-payments') {
      showSection('section-league-dashboard');
    }
  }
}

function updateCourtManagerMenuVisibility() {
  if (!courtManagerMenuButtons.length) return;
  const shouldShow = hasCourtManagementAccess();
  courtManagerMenuButtons.forEach((button) => {
    button.hidden = !shouldShow;
  });

  if (!shouldShow && courtManagerSectionIds.has(state.activeSection)) {
    showSection('section-dashboard');
  }
}

function applyCourtManagerMenuRestrictions() {
  if (!menuButtons.length) return;

  const restricted = isCourtManager() && !isAdmin();
  const allowedTargets = new Set(['section-court-reservations', 'section-court-admin', 'section-account']);

  menuButtons.forEach((button) => {
    if (button.dataset.requiresAdmin === 'true' || button.dataset.requiresCourtManager === 'true') {
      return;
    }

    const initialHidden = menuButtonInitialHidden.get(button) === true;
    if (!restricted) {
      button.hidden = initialHidden;
      return;
    }

    const target = button.dataset.target;
    if (!target || button.dataset.action === 'logout') {
      button.hidden = initialHidden;
      return;
    }

    button.hidden = !allowedTargets.has(target);
  });
}

function showSection(sectionId) {
  if (!sectionId || !appSections.length) return;

  const targetSection = document.getElementById(sectionId);
  if (!targetSection) return;

  let resolvedSectionId = sectionId;
  if (targetSection.dataset.adminOnly === 'true' && !isAdmin()) {
    resolvedSectionId = 'section-dashboard';
    showGlobalMessage('Necesitas permisos de administrador para acceder a esta sección.', 'error');
  } else if (targetSection.dataset.requiresCourtManager === 'true' && !hasCourtManagementAccess()) {
    resolvedSectionId = 'section-dashboard';
    showGlobalMessage('Necesitas permisos de gestor de pistas para acceder a esta sección.', 'error');
  } else if (isCourtManager() && !isAdmin()) {
    const allowed = new Set(['section-court-reservations', 'section-court-admin', 'section-account']);
    if (!allowed.has(sectionId)) {
      resolvedSectionId = 'section-court-admin';
      showGlobalMessage('Tu perfil solo tiene acceso a la gestión de pistas y reservas.', 'error');
    }
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

  if (resolvedSectionId === 'section-dashboard') {
    loadGlobalOverview({ force: false });
  } else if (resolvedSectionId === 'section-league-dashboard') {
    loadLeagueDashboard({ force: false });
  } else if (resolvedSectionId === 'section-league-payments') {
    refreshLeaguePayments().catch((error) => {
      console.warn('No se pudo cargar los pagos de liga', error);
    });
  } else if (resolvedSectionId === 'section-tournament-dashboard') {
    loadTournamentDashboard({ force: false });
  }
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
    const targetId = button.dataset.target;
    if (button.dataset.submenuToggle === 'true') {
      const menuGroup = collapsibleMenuGroupsByTarget.get(targetId || '');
      const expanded = button.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        const isActiveTarget = state.activeSection === targetId;
        const activeNestedButton = menuGroup?.submenu?.querySelector('.menu-button.active');
        if (isActiveTarget || activeNestedButton) {
          return;
        }
      }
      setMenuGroupExpanded(menuGroup, !expanded);
      return;
    }
    showSection(targetId);
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
  state.globalOverview = null;
  state.leagueDashboard = null;
  if (state.leagueDetails instanceof Map) {
    state.leagueDetails.clear();
  } else {
    state.leagueDetails = new Map();
  }
  if (state.leaguePayments instanceof Map) {
    state.leaguePayments.clear();
  } else {
    state.leaguePayments = new Map();
  }
  state.leaguePaymentFilters = {
    league: '',
    status: '',
    search: '',
  };
  state.leaguePaymentsLoading = false;
  state.tournamentDashboard = null;
  state.tournaments = [];
  state.tournamentDetails = new Map();
  state.selectedTournamentId = '';
  state.selectedTournamentCategoriesId = '';
  state.selectedEnrollmentTournamentId = '';
  state.selectedEnrollmentCategoryId = '';
  state.selectedMatchTournamentId = '';
  state.selectedMatchCategoryId = '';
  state.tournamentEnrollments = new Map();
  state.tournamentMatches = new Map();
  state.courtReservations = [];
  state.courtAvailability = [];
  state.courtAdminSchedule = [];
  state.courtAdminBlocks = [];
  state.courtCalendarEvents = [];
  state.courtBlocks = [];
  state.courtCalendarDate = new Date();
  state.reservationPlayers = [];
  state.reservationPlayersLoaded = false;
  state.reservationPlayersLoading = false;
  state.generalChatMessages = [];
  state.noticeUnreadCount = 0;
  updateCategoryControlsAvailability();
  if (leaguesList) {
    leaguesList.innerHTML =
      '<li class="empty-state">Inicia sesión para revisar las ligas disponibles.</li>';
  }
  categoriesList.innerHTML = '<li class="empty-state">Inicia sesión para ver las categorías.</li>';
  if (tournamentsList) {
    tournamentsList.innerHTML =
      '<li class="empty-state">Inicia sesión para consultar los torneos disponibles.</li>';
  }
  if (tournamentDetailTitle) {
    tournamentDetailTitle.textContent = 'Detalle del torneo';
  }
  if (tournamentDetailSubtitle) {
    tournamentDetailSubtitle.textContent = 'Selecciona un torneo para ver la información ampliada.';
  }
  if (tournamentDetailBody) {
    tournamentDetailBody.innerHTML =
      '<p class="empty-state">Inicia sesión para conocer la información de los torneos.</p>';
  }
  if (tournamentCategoriesList) {
    tournamentCategoriesList.innerHTML = '';
  }
  if (tournamentCategoriesEmpty) {
    tournamentCategoriesEmpty.hidden = false;
    tournamentCategoriesEmpty.textContent = 'Inicia sesión para revisar las categorías de los torneos.';
  }
  if (tournamentCategoryTournamentSelect) {
    tournamentCategoryTournamentSelect.innerHTML = '';
    tournamentCategoryTournamentSelect.disabled = true;
  }
  if (tournamentEnrollmentTournamentSelect) {
    tournamentEnrollmentTournamentSelect.innerHTML = '';
    tournamentEnrollmentTournamentSelect.disabled = true;
  }
  if (tournamentEnrollmentCategorySelect) {
    tournamentEnrollmentCategorySelect.innerHTML = '';
    tournamentEnrollmentCategorySelect.disabled = true;
  }
  if (tournamentEnrollmentList) {
    tournamentEnrollmentList.innerHTML = '';
  }
  if (tournamentEnrollmentEmpty) {
    tournamentEnrollmentEmpty.hidden = false;
    tournamentEnrollmentEmpty.textContent = 'Selecciona un torneo para revisar sus inscripciones.';
  }
  if (tournamentMatchTournamentSelect) {
    tournamentMatchTournamentSelect.innerHTML = '';
    tournamentMatchTournamentSelect.disabled = true;
  }
  if (tournamentMatchCategorySelect) {
    tournamentMatchCategorySelect.innerHTML = '';
    tournamentMatchCategorySelect.disabled = true;
  }
  if (tournamentMatchesList) {
    tournamentMatchesList.innerHTML = '';
  }
  if (tournamentMatchesEmpty) {
    tournamentMatchesEmpty.hidden = false;
    tournamentMatchesEmpty.textContent = 'Selecciona un torneo para revisar sus partidos.';
  }
  notificationsList.innerHTML = '<li class="empty-state">Inicia sesión para ver tus notificaciones.</li>';
  upcomingList.innerHTML = '<li class="empty-state">Inicia sesión para consultar el calendario.</li>';
  myMatchesList.innerHTML = '<li class="empty-state">Inicia sesión para consultar tus partidos.</li>';
  updateMatchesMenuBadge(0);
  updateNoticesMenuBadge(0);
  if (pendingApprovalsList) {
    pendingApprovalsList.innerHTML =
      '<li class="empty-state">Inicia sesión para consultar los resultados pendientes.</li>';
  }
  if (courtReservationList) {
    courtReservationList.innerHTML =
      '<li class="empty-state">Inicia sesión para gestionar tus reservas.</li>';
  }
  if (courtAvailabilityList) {
    courtAvailabilityList.innerHTML =
      '<li class="empty-state">Inicia sesión para consultar la disponibilidad de pistas.</li>';
  }
  if (courtAvailabilityEmpty) {
    courtAvailabilityEmpty.hidden = false;
  }
  if (courtAdminSchedule) {
    courtAdminSchedule.innerHTML =
      '<p class="meta">Inicia sesión con una cuenta administradora para ver el detalle de reservas.</p>';
  }
  if (courtAdminEmpty) {
    courtAdminEmpty.hidden = false;
  }
  if (courtCalendarContainer) {
    courtCalendarContainer.innerHTML =
      '<p class="meta">Inicia sesión con una cuenta autorizada para revisar el calendario de pistas.</p>';
  }
  if (courtCalendarLabel) {
    courtCalendarLabel.textContent = '';
  }
  if (courtCalendarStatus) {
    setStatusMessage(courtCalendarStatus, '', '');
  }
  if (courtBlockForm) {
    courtBlockForm.reset();
    setCourtBlockDefaultRange();
  }
  if (courtBlockStatus) {
    setStatusMessage(courtBlockStatus, '', '');
  }
  if (courtBlocksList) {
    courtBlocksList.innerHTML =
      '<li class="empty-state">Inicia sesión con una cuenta autorizada para gestionar bloqueos.</li>';
  }
  if (courtBlocksEmpty) {
    courtBlocksEmpty.hidden = true;
  }
  if (courtReservationParticipantsContainer) {
    courtReservationParticipantsContainer.innerHTML = '';
    courtReservationParticipantsContainer.hidden = true;
  }
  if (courtReservationParticipantsHint) {
    courtReservationParticipantsHint.hidden = true;
    courtReservationParticipantsHint.textContent = defaultCourtReservationParticipantsHint;
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
  state.rankingsByCategory.clear();
  state.rankingsLoading = false;
  state.selectedCategoryId = null;
  if (rankingCategoryList) {
    rankingCategoryList.innerHTML = '';
  }
  if (rankingEmpty) {
    rankingEmpty.hidden = false;
    rankingEmpty.textContent = 'Inicia sesión para consultar los rankings disponibles.';
  }
  setRankingStatusMessage('', '');
  if (globalLeaguesList) {
    globalLeaguesList.innerHTML = '<li class="empty-state">Inicia sesión para ver las ligas activas.</li>';
  }
  if (globalTournamentsList) {
    globalTournamentsList.innerHTML = '<li class="empty-state">Inicia sesión para conocer los torneos disponibles.</li>';
  }
  if (globalUpcomingMatchesList) {
    globalUpcomingMatchesList.innerHTML = '<li class="empty-state">Inicia sesión para ver los próximos partidos.</li>';
  }
  if (leagueRankingCards) {
    leagueRankingCards.innerHTML = '<p class="empty-state">Inicia sesión para consultar los rankings de liga.</p>';
  }
  if (leagueUpcomingMatchesList) {
    leagueUpcomingMatchesList.innerHTML = '<li class="empty-state">Inicia sesión para ver los partidos de liga.</li>';
  }
  if (tournamentDrawCards) {
    tournamentDrawCards.innerHTML = '<p class="empty-state">Inicia sesión para revisar los cuadros de torneo.</p>';
  }
  if (tournamentUpcomingMatchesList) {
    tournamentUpcomingMatchesList.innerHTML = '<li class="empty-state">Inicia sesión para ver los partidos de torneo.</li>';
  }
  if (generalChatMessagesList) {
    generalChatMessagesList.innerHTML =
      '<li class="empty-state">Inicia sesión para revisar los avisos del club.</li>';
  }
  if (generalChatInput) {
    generalChatInput.value = '';
  }
  if (globalLeaguesCount) {
    globalLeaguesCount.textContent = '0';
  }
  if (globalTournamentsCount) {
    globalTournamentsCount.textContent = '0';
  }
  if (globalCategoriesCount) {
    globalCategoriesCount.textContent = '0';
  }
  if (globalCourtsCount) {
    globalCourtsCount.textContent = '0';
  }
  if (leagueMetricPlayers) {
    leagueMetricPlayers.textContent = '0';
  }
  if (leagueMetricCategories) {
    leagueMetricCategories.textContent = '0';
  }
  if (leagueMetricUpcoming) {
    leagueMetricUpcoming.textContent = '0';
  }
  if (tournamentMetricActive) {
    tournamentMetricActive.textContent = '0';
  }
  if (tournamentMetricCategories) {
    tournamentMetricCategories.textContent = '0';
  }
  if (tournamentMetricUpcoming) {
    tournamentMetricUpcoming.textContent = '0';
  }
  updateNotificationCounts(0);
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
  if (leaguePlayersList) {
    leaguePlayersList.innerHTML = '';
  }
  if (leaguePlayersEmpty) {
    leaguePlayersEmpty.hidden = false;
    leaguePlayersEmpty.textContent = 'Inicia sesión para consultar los jugadores inscritos.';
  }
  if (leaguePlayersCount) {
    leaguePlayersCount.textContent = '0';
  }
  if (leaguePlayersLeagueSelect) {
    leaguePlayersLeagueSelect.innerHTML = '<option value="">Selecciona una liga</option>';
    leaguePlayersLeagueSelect.disabled = true;
  }
  if (leaguePlayersCategorySelect) {
    leaguePlayersCategorySelect.innerHTML = '<option value="">Todas las categorías</option>';
    leaguePlayersCategorySelect.disabled = true;
  }
  if (leaguePlayersSearch) {
    leaguePlayersSearch.value = '';
    leaguePlayersSearch.disabled = true;
  }
  if (leaguePlayersGender) {
    leaguePlayersGender.value = '';
    leaguePlayersGender.disabled = true;
  }
  state.leaguePlayersFilters = {
    league: '',
    category: '',
    search: '',
    gender: '',
  };
  leaguePlayersRequestToken = 0;
  state.leaguePlayersLoading = false;
  updateLeaguePaymentControls({ resetSelection: true });
  if (leaguePaymentsList) {
    leaguePaymentsList.innerHTML = '';
  }
  if (leaguePaymentsCount) {
    leaguePaymentsCount.textContent = '0';
  }
  if (leaguePaymentsEmpty) {
    leaguePaymentsEmpty.hidden = false;
    leaguePaymentsEmpty.textContent = 'Inicia sesión para gestionar los pagos de inscripción.';
  }
  setStatusMessage(leaguePaymentsStatusMessage, '', '');
  if (playerDirectoryList) {
    playerDirectoryList.innerHTML = '';
  }
  if (playerDirectoryEmpty) {
    playerDirectoryEmpty.hidden = false;
    playerDirectoryEmpty.textContent = 'Inicia sesión para ver el directorio de usuarios.';
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
  updateTournamentActionAvailability();
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

function isCourtManager() {
  return entityHasRole(state.user, 'court_manager');
}

function hasCourtManagementAccess() {
  return isAdmin() || isCourtManager();
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
  updateCourtManagerMenuVisibility();
  applyCourtManagerMenuRestrictions();
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

function formatCurrencyValue(amount, currency = 'EUR') {
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

function formatTournamentStatusLabel(status) {
  return TOURNAMENT_STATUS_LABELS[status] || 'Sin estado';
}

function formatTournamentCategoryStatusLabel(status) {
  return TOURNAMENT_CATEGORY_STATUS_LABELS[status] || 'Sin estado';
}

function formatTournamentEnrollmentStatusLabel(status) {
  return TOURNAMENT_ENROLLMENT_STATUS_LABELS[status] || 'Sin estado';
}

function formatTournamentMatchStatusLabel(status) {
  return TOURNAMENT_MATCH_STATUS_LABELS[status] || 'Sin estado';
}

function formatTournamentDateRange(tournament) {
  if (!tournament) {
    return 'Fechas por confirmar';
  }

  const { startDate, endDate } = tournament;
  const start = startDate ? formatShortDate(startDate) : '';
  const end = endDate ? formatShortDate(endDate) : '';

  if (start && end) {
    return `${start} – ${end}`;
  }
  if (start) {
    return `Inicio: ${start}`;
  }
  if (end) {
    return `Fin: ${end}`;
  }
  return 'Fechas por confirmar';
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

function formatTimeRangeLabel(start, end) {
  const startLabel = formatTime(start);
  const endLabel = formatTime(end);
  return `${startLabel} – ${endLabel}`;
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

function startOfMonth(date) {
  const copy = new Date(date);
  copy.setDate(1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfMonth(date) {
  const end = startOfMonth(date);
  end.setMonth(end.getMonth() + 1);
  return end;
}

function addMonths(date, months) {
  const copy = new Date(date);
  copy.setDate(1);
  copy.setMonth(copy.getMonth() + months);
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

function formatTimeInputValue(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

function combineDateAndTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) {
    return null;
  }
  const isoString = `${dateValue}T${timeValue}`;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
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
  const { filtersReset } = pruneLeagueCaches();
  updateLeaguePaymentControls({ resetSelection: filtersReset });
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

    const registrationMetaParts = [];
    if (category.registrationWindowOpen === true) {
      registrationMetaParts.push('Inscripciones abiertas');
    } else if (category.registrationWindowOpen === false) {
      registrationMetaParts.push('Inscripciones cerradas');
    }
    if (category.leagueRegistrationCloseDate) {
      registrationMetaParts.push(
        `Cierre de inscripción: ${formatDate(category.leagueRegistrationCloseDate)}`
      );
    }
    if (typeof category.leagueEnrollmentFee === 'number') {
      registrationMetaParts.push(`Cuota: ${formatCurrencyValue(category.leagueEnrollmentFee)}`);
    }
    if (registrationMetaParts.length) {
      const registrationMeta = document.createElement('div');
      registrationMeta.className = 'meta meta-registration';
      registrationMeta.textContent = registrationMetaParts.join(' · ');
      item.appendChild(registrationMeta);
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

function formatDateRangeLabel(startDate, endDate) {
  const start = formatDateOnly(startDate);
  const end = formatDateOnly(endDate);
  if (start && end) {
    if (start === end) {
      return start;
    }
    return `${start} – ${end}`;
  }
  return start || end || '';
}

function renderDashboardMatchList(
  matches = [],
  container,
  emptyMessage,
  { includeScope = false } = {}
) {
  if (!container) return;

  container.innerHTML = '';

  if (!Array.isArray(matches) || !matches.length) {
    container.innerHTML = `<li class="empty-state">${emptyMessage}</li>`;
    return;
  }

  matches.forEach((match) => {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    const players = Array.isArray(match.players)
      ? match.players.map((player) => player.fullName || 'Jugador').join(' vs ')
      : 'Jugadores por definir';
    title.textContent = players;

    if (match.category?.color) {
      const indicator = createCategoryColorIndicator(match.category.color, match.category?.name);
      if (indicator) {
        title.classList.add('with-category-color');
        title.prepend(indicator);
      }
    }

    item.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';

    const dateLabel = formatDate(match.scheduledAt);
    if (dateLabel) {
      meta.appendChild(document.createElement('span')).textContent = dateLabel;
    }

    if (match.court) {
      meta.appendChild(document.createElement('span')).textContent = `Pista ${match.court}`;
    }

    if (match.category?.name) {
      const categoryTag = document.createElement('span');
      categoryTag.className = 'tag match-category-tag';
      categoryTag.textContent = match.category.name;
      applyCategoryTagColor(categoryTag, match.category.color);
      meta.appendChild(categoryTag);
    }

    if (includeScope) {
      if (match.scope === 'tournament' && match.tournament?.name) {
        const scopeTag = document.createElement('span');
        scopeTag.className = 'tag';
        scopeTag.textContent = match.tournament.name;
        meta.appendChild(scopeTag);
      } else if (match.scope === 'league' && match.league?.name) {
        const scopeTag = document.createElement('span');
        scopeTag.className = 'tag';
        scopeTag.textContent = match.league.name;
        meta.appendChild(scopeTag);
      }
    }

    item.appendChild(meta);
    container.appendChild(item);
  });
}

function renderGlobalOverview(overview) {
  state.globalOverview = overview || null;
  const metrics = overview?.metrics || {};

  if (globalLeaguesCount) {
    globalLeaguesCount.textContent = String(metrics.leagues ?? 0);
  }
  if (globalTournamentsCount) {
    globalTournamentsCount.textContent = String(metrics.tournaments ?? 0);
  }
  if (globalCategoriesCount) {
    globalCategoriesCount.textContent = String(metrics.categories ?? 0);
  }
  if (globalCourtsCount) {
    globalCourtsCount.textContent = String(metrics.courts ?? 0);
  }

  renderGlobalLeagues(overview?.leagues || []);
  renderGlobalTournaments(overview?.tournaments || []);
  renderGlobalUpcomingMatches(overview?.upcomingMatches || []);
}

function renderGlobalLeagues(leagues = []) {
  if (!globalLeaguesList) return;
  globalLeaguesList.innerHTML = '';

  if (!Array.isArray(leagues) || !leagues.length) {
    globalLeaguesList.innerHTML = '<li class="empty-state">No hay ligas registradas actualmente.</li>';
    return;
  }

  leagues.forEach((league) => {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = league.name || 'Liga sin nombre';
    item.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';

    if (league.status) {
      const statusLabel = LEAGUE_STATUS_LABELS[league.status] || league.status;
      meta.appendChild(document.createElement('span')).textContent = statusLabel;
    }

    if (league.year) {
      meta.appendChild(document.createElement('span')).textContent = `Temporada ${league.year}`;
    }

    const rangeLabel = formatDateRangeLabel(league.startDate, league.endDate);
    if (rangeLabel) {
      meta.appendChild(document.createElement('span')).textContent = rangeLabel;
    }

    const categoriesCount = Number(league.categoryCount ?? 0);
    const activeCategories = Number(league.activeCategories ?? 0);
    if (categoriesCount) {
      meta.appendChild(document.createElement('span')).textContent = `${categoriesCount} categorías (${activeCategories} activas)`;
    }

    item.appendChild(meta);
    globalLeaguesList.appendChild(item);
  });
}

function renderGlobalTournaments(tournaments = []) {
  if (!globalTournamentsList) return;
  globalTournamentsList.innerHTML = '';

  if (!Array.isArray(tournaments) || !tournaments.length) {
    globalTournamentsList.innerHTML = '<li class="empty-state">No hay torneos programados.</li>';
    return;
  }

  tournaments.forEach((tournament) => {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = tournament.name || 'Torneo sin nombre';
    item.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';

    if (tournament.status) {
      const statusLabel = TOURNAMENT_STATUS_LABELS[tournament.status] || tournament.status;
      meta.appendChild(document.createElement('span')).textContent = statusLabel;
    }

    const rangeLabel = formatDateRangeLabel(tournament.startDate, tournament.endDate);
    if (rangeLabel) {
      meta.appendChild(document.createElement('span')).textContent = rangeLabel;
    }

    const categoriesCount = Number(tournament.categoryCount ?? 0);
    if (categoriesCount) {
      meta.appendChild(document.createElement('span')).textContent = `${categoriesCount} categorías`;
    }

    if (tournament.registrationCloseDate) {
      meta.appendChild(document.createElement('span')).textContent = `Inscripciones hasta ${formatDateOnly(tournament.registrationCloseDate)}`;
    }

    item.appendChild(meta);
    globalTournamentsList.appendChild(item);
  });
}

function renderGlobalUpcomingMatches(matches = []) {
  renderDashboardMatchList(matches, globalUpcomingMatchesList, 'No hay partidos programados.', {
    includeScope: true,
  });
}

function renderLeagueDashboard(summary) {
  state.leagueDashboard = summary || null;
  const metrics = summary?.metrics || {};

  if (leagueMetricPlayers) {
    leagueMetricPlayers.textContent = String(metrics.players ?? 0);
  }
  if (leagueMetricCategories) {
    leagueMetricCategories.textContent = String(metrics.categories ?? 0);
  }
  if (leagueMetricUpcoming) {
    leagueMetricUpcoming.textContent = String(metrics.upcomingMatches ?? 0);
  }

  renderLeagueRankingCards(summary?.categories || []);
  renderDashboardMatchList(
    summary?.upcomingMatches || [],
    leagueUpcomingMatchesList,
    'Todavía no hay partidos programados.'
  );
}

function renderLeagueRankingCards(categories = []) {
  if (!leagueRankingCards) return;
  leagueRankingCards.innerHTML = '';

  if (!Array.isArray(categories) || !categories.length) {
    leagueRankingCards.innerHTML = '<p class="empty-state">Aún no hay categorías disponibles.</p>';
    return;
  }

  categories.forEach((categorySummary) => {
    const card = document.createElement('div');
    card.className = 'collection-card';

    const header = document.createElement('div');
    header.className = 'collection-card__header';

    const title = document.createElement('div');
    title.className = 'collection-card__title';
    if (categorySummary.category?.color) {
      const indicator = createCategoryColorIndicator(
        categorySummary.category.color,
        categorySummary.category?.name
      );
      if (indicator) {
        title.appendChild(indicator);
      }
    }
    title.appendChild(
      document.createTextNode(categorySummary.category?.name || 'Categoría')
    );
    header.appendChild(title);

    if (categorySummary.league?.name) {
      const subtitle = document.createElement('span');
      subtitle.className = 'collection-card__subtitle';
      subtitle.textContent = categorySummary.league.name;
      header.appendChild(subtitle);
    }

    card.appendChild(header);

    const meta = document.createElement('div');
    meta.className = 'collection-card__meta';
    const playerCount = Number(categorySummary.playerCount ?? 0);
    const upcomingCount = Number(categorySummary.upcomingMatches ?? 0);
    meta.textContent = `${playerCount} jugadores · ${upcomingCount} partidos próximos`;
    card.appendChild(meta);

    const ranking = Array.isArray(categorySummary.ranking)
      ? categorySummary.ranking.slice(0, 3)
      : [];

    if (!ranking.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Sin resultados registrados.';
      card.appendChild(empty);
    } else {
      const list = document.createElement('ul');
      list.className = 'collection-card__list';

      ranking.forEach((entry, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'collection-card__list-item';

        const position = document.createElement('span');
        position.className = 'collection-card__position';
        const podiumEmoji = getPodiumEmoji(index);
        position.textContent = podiumEmoji ? `${index + 1}. ${podiumEmoji}` : `${index + 1}.`;
        listItem.appendChild(position);

        const playerInfo = document.createElement('div');
        playerInfo.className = 'collection-card__player';
        const name = document.createElement('strong');
        name.textContent = entry.player?.fullName || 'Jugador';
        playerInfo.appendChild(name);
        const stats = document.createElement('span');
        stats.textContent = `${entry.points ?? 0} pts · ${entry.wins ?? 0} victorias`;
        playerInfo.appendChild(stats);
        listItem.appendChild(playerInfo);

        const matchesPlayed = document.createElement('span');
        matchesPlayed.className = 'collection-card__points';
        matchesPlayed.textContent = `${entry.matchesPlayed ?? 0} jugados`;
        listItem.appendChild(matchesPlayed);

        list.appendChild(listItem);
      });

      card.appendChild(list);
    }

    leagueRankingCards.appendChild(card);
  });
}

function renderTournamentDashboard(summary) {
  state.tournamentDashboard = summary || null;
  const metrics = summary?.metrics || {};

  if (tournamentMetricActive) {
    tournamentMetricActive.textContent = String(metrics.tournaments ?? 0);
  }
  if (tournamentMetricCategories) {
    tournamentMetricCategories.textContent = String(metrics.categories ?? 0);
  }
  if (tournamentMetricUpcoming) {
    tournamentMetricUpcoming.textContent = String(metrics.upcomingMatches ?? 0);
  }

  renderTournamentDrawCards(summary?.categories || []);
  renderDashboardMatchList(
    summary?.upcomingMatches || [],
    tournamentUpcomingMatchesList,
    'No hay partidos de torneo programados.',
    { includeScope: true }
  );
}

function renderTournamentDrawCards(categories = []) {
  if (!tournamentDrawCards) return;
  tournamentDrawCards.innerHTML = '';

  if (!Array.isArray(categories) || !categories.length) {
    tournamentDrawCards.innerHTML = '<p class="empty-state">No hay cuadros publicados por ahora.</p>';
    return;
  }

  categories.forEach((category) => {
    const card = document.createElement('div');
    card.className = 'collection-card';

    const header = document.createElement('div');
    header.className = 'collection-card__header';

    const title = document.createElement('div');
    title.className = 'collection-card__title';
    if (category.color) {
      const indicator = createCategoryColorIndicator(category.color, category.name);
      if (indicator) {
        title.appendChild(indicator);
      }
    }
    title.appendChild(document.createTextNode(category.name || 'Categoría'));
    header.appendChild(title);

    if (category.tournament?.name) {
      const subtitle = document.createElement('span');
      subtitle.className = 'collection-card__subtitle';
      subtitle.textContent = category.tournament.name;
      header.appendChild(subtitle);
    }

    card.appendChild(header);

    const meta = document.createElement('div');
    meta.className = 'collection-card__meta';
    const statusLabel = TOURNAMENT_CATEGORY_STATUS_LABELS[category.status] || category.status;
    meta.textContent = `${statusLabel} · ${category.drawMatches ?? 0} partidos en cuadro`;
    card.appendChild(meta);

    const summary = Array.isArray(category.drawSummary) ? category.drawSummary : [];
    if (!summary.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Aún no se ha definido el cuadro.';
      card.appendChild(empty);
    } else {
      const list = document.createElement('ul');
      list.className = 'collection-card__list';

      summary.forEach((round) => {
        const listItem = document.createElement('li');
        listItem.className = 'collection-card__list-item';
        const label = document.createElement('span');
        label.className = 'collection-card__player';
        const name = document.createElement('strong');
        name.textContent = round.name || 'Ronda';
        label.appendChild(name);
        const stats = document.createElement('span');
        stats.textContent = `${round.completed ?? 0} / ${round.matches ?? 0} partidos completados`;
        label.appendChild(stats);
        listItem.appendChild(label);

        list.appendChild(listItem);
      });

      card.appendChild(list);
    }

    tournamentDrawCards.appendChild(card);
  });
}

async function loadGlobalOverview({ force = true } = {}) {
  if (!state.token) return;

  if (!force && state.globalOverview) {
    renderGlobalOverview(state.globalOverview);
    return;
  }

  try {
    const overview = await request('/dashboard/overview');
    renderGlobalOverview(overview);
  } catch (error) {
    renderGlobalOverview(null);
    showGlobalMessage(error.message, 'error');
  }
}

async function loadLeagueDashboard({ force = true } = {}) {
  if (!state.token) return;

  if (!force && state.leagueDashboard) {
    renderLeagueDashboard(state.leagueDashboard);
    return;
  }

  try {
    const summary = await request('/dashboard/leagues');
    renderLeagueDashboard(summary);
  } catch (error) {
    renderLeagueDashboard(null);
    showGlobalMessage(error.message, 'error');
  }
}

async function loadTournamentDashboard({ force = true } = {}) {
  if (!state.token) return;

  if (!force && state.tournamentDashboard) {
    renderTournamentDashboard(state.tournamentDashboard);
    return;
  }

  try {
    const summary = await request('/dashboard/tournaments');
    renderTournamentDashboard(summary);
  } catch (error) {
    renderTournamentDashboard(null);
    showGlobalMessage(error.message, 'error');
  }
}

function getTournamentById(tournamentId) {
  if (!tournamentId) return null;
  const normalized = typeof tournamentId === 'string' ? tournamentId : normalizeId(tournamentId);
  if (!normalized) return null;
  return state.tournaments.find((tournament) => normalizeId(tournament) === normalized) || null;
}

function getTournamentCategories(tournamentId) {
  const normalized = typeof tournamentId === 'string' ? tournamentId : normalizeId(tournamentId);
  if (!normalized) return [];

  const detail = state.tournamentDetails.get(normalized);
  if (Array.isArray(detail?.categories) && detail.categories.length) {
    return detail.categories;
  }

  const tournament = getTournamentById(normalized);
  if (Array.isArray(tournament?.categories)) {
    return tournament.categories;
  }

  return [];
}

function renderTournaments(tournaments = state.tournaments) {
  if (!tournamentsList) return;
  tournamentsList.innerHTML = '';

  if (!Array.isArray(tournaments) || !tournaments.length) {
    tournamentsList.innerHTML =
      '<li class="empty-state">Registra un torneo para comenzar a organizar nuevos eventos.</li>';
    if (tournamentDetailTitle) {
      tournamentDetailTitle.textContent = 'Detalle del torneo';
    }
    if (tournamentDetailSubtitle) {
      tournamentDetailSubtitle.textContent = 'Selecciona un torneo para ver la información ampliada.';
    }
    if (tournamentDetailBody) {
      tournamentDetailBody.innerHTML =
        '<p class="empty-state">No hay torneos registrados en este momento.</p>';
    }
    return;
  }

  const activeId = state.selectedTournamentId;

  tournaments.forEach((tournament) => {
    const tournamentId = normalizeId(tournament);
    if (!tournamentId) {
      return;
    }

    const item = document.createElement('li');
    if (tournamentId === activeId) {
      item.classList.add('is-active');
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'list-item-button';
    button.dataset.tournamentId = tournamentId;

    const title = document.createElement('strong');
    title.textContent = tournament.name || 'Torneo';
    button.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';

    const statusValue = tournament.status || 'inscripcion';
    const statusTag = document.createElement('span');
    statusTag.className = `tag status-${statusValue}`;
    statusTag.textContent = formatTournamentStatusLabel(statusValue);
    meta.appendChild(statusTag);

    const dateSpan = document.createElement('span');
    dateSpan.textContent = formatTournamentDateRange(tournament);
    meta.appendChild(dateSpan);

    if (tournament.registrationCloseDate) {
      const closeSpan = document.createElement('span');
      closeSpan.textContent = `Inscripciones: ${formatShortDate(tournament.registrationCloseDate)}`;
      meta.appendChild(closeSpan);
    }

    const categoryCount = Array.isArray(tournament.categories) ? tournament.categories.length : 0;
    const categorySpan = document.createElement('span');
    categorySpan.textContent = `${categoryCount} ${categoryCount === 1 ? 'categoría' : 'categorías'}`;
    meta.appendChild(categorySpan);

    const pendingTotal = Array.isArray(tournament.categories)
      ? tournament.categories.reduce((acc, category) => {
          const pending = Number(
            category?.pendingEnrollmentCount || category?.enrollmentStats?.pending || 0
          );
          return Number.isFinite(pending) ? acc + pending : acc;
        }, 0)
      : 0;
    if (isAdmin() && pendingTotal > 0) {
      const pendingSpan = document.createElement('span');
      pendingSpan.className = 'tag';
      pendingSpan.textContent =
        pendingTotal === 1
          ? '1 solicitud pendiente'
          : `${pendingTotal} solicitudes pendientes`;
      meta.appendChild(pendingSpan);
    }

    button.appendChild(meta);
    item.appendChild(button);
    tournamentsList.appendChild(item);
  });
}

function renderTournamentDetail() {
  if (!tournamentDetailBody) return;

  const tournamentId = state.selectedTournamentId;
  updateTournamentActionAvailability();
  if (!tournamentId) {
    if (tournamentDetailTitle) {
      tournamentDetailTitle.textContent = 'Detalle del torneo';
    }
    if (tournamentDetailSubtitle) {
      tournamentDetailSubtitle.textContent = 'Selecciona un torneo para ver la información ampliada.';
    }
    tournamentDetailBody.innerHTML =
      '<p class="empty-state">Selecciona un torneo de la lista para ver sus detalles.</p>';
    return;
  }

  const tournament = getTournamentById(tournamentId);
  const detail = state.tournamentDetails.get(tournamentId) || tournament;
  if (!detail) {
    if (tournamentDetailSubtitle) {
      tournamentDetailSubtitle.textContent = 'Selecciona un torneo para ver la información ampliada.';
    }
    tournamentDetailBody.innerHTML =
      '<p class="empty-state">No se encontró información del torneo seleccionado.</p>';
    return;
  }

  if (tournamentDetailTitle) {
    tournamentDetailTitle.textContent = detail.name || tournament?.name || 'Torneo';
  }
  if (tournamentDetailSubtitle) {
    tournamentDetailSubtitle.textContent = formatTournamentDateRange(detail);
  }

  tournamentDetailBody.innerHTML = '';
  const fragment = document.createDocumentFragment();

  const posterUrl = typeof detail.poster === 'string' ? detail.poster.trim() : '';
  if (posterUrl) {
    const poster = document.createElement('img');
    poster.className = 'tournament-detail__poster';
    poster.src = posterUrl;
    poster.alt = detail.name ? `Afiche del torneo ${detail.name}` : 'Afiche del torneo';
    fragment.appendChild(poster);
  }

  const header = document.createElement('div');
  header.className = 'tournament-detail__header';

  const meta = document.createElement('div');
  meta.className = 'meta';
  const statusValue = detail.status || tournament?.status || 'inscripcion';
  const statusTag = document.createElement('span');
  statusTag.className = `tag status-${statusValue}`;
  statusTag.textContent = formatTournamentStatusLabel(statusValue);
  meta.appendChild(statusTag);

  const dateSpan = document.createElement('span');
  dateSpan.textContent = formatTournamentDateRange(detail);
  meta.appendChild(dateSpan);
  header.appendChild(meta);

  if (detail.description) {
    const description = document.createElement('p');
    description.className = 'tournament-detail__description';
    description.textContent = detail.description;
    header.appendChild(description);
  }

  fragment.appendChild(header);

  const metaItems = [];
  if (detail.startDate) {
    metaItems.push(['Inicio', formatDate(detail.startDate)]);
  }
  if (detail.endDate) {
    metaItems.push(['Finalización', formatDate(detail.endDate)]);
  }
  if (detail.registrationCloseDate) {
    metaItems.push(['Cierre de inscripciones', formatDate(detail.registrationCloseDate)]);
  }
  if (detail.createdAt) {
    metaItems.push(['Creado', formatDate(detail.createdAt)]);
  }

  if (metaItems.length) {
    const metaContainer = document.createElement('div');
    metaContainer.className = 'tournament-detail__meta';
    metaItems.forEach(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'tournament-detail__meta-item';
      const labelSpan = document.createElement('span');
      labelSpan.className = 'tournament-detail__meta-label';
      labelSpan.textContent = label;
      const valueSpan = document.createElement('span');
      valueSpan.textContent = value;
      row.appendChild(labelSpan);
      row.appendChild(valueSpan);
      metaContainer.appendChild(row);
    });
    fragment.appendChild(metaContainer);
  }

  const fees = Array.isArray(detail.fees)
    ? detail.fees.filter((fee) => Number.isFinite(Number(fee.amount)))
    : [];
  if (fees.length) {
    const feesWrapper = document.createElement('div');
    const heading = document.createElement('h4');
    heading.className = 'tournament-section-title';
    heading.textContent = 'Cuotas de inscripción';
    feesWrapper.appendChild(heading);

    const feesList = document.createElement('div');
    feesList.className = 'tournament-detail__fees';
    fees.forEach((fee) => {
      const feeRow = document.createElement('div');
      feeRow.className = 'tournament-fee';

      const labelSpan = document.createElement('span');
      labelSpan.className = 'tournament-fee__label';
      labelSpan.textContent = fee.label || 'Cuota';

      const amountSpan = document.createElement('span');
      const formattedAmount = formatCurrencyValue(fee.amount, fee.currency);
      amountSpan.textContent = formattedAmount || `${Number(fee.amount) || 0}`;

      feeRow.appendChild(labelSpan);
      feeRow.appendChild(amountSpan);
      feesList.appendChild(feeRow);
    });

    feesWrapper.appendChild(feesList);
    fragment.appendChild(feesWrapper);
  }

  const categories = getTournamentCategories(tournamentId);
  if (categories.length) {
    const categoryWrapper = document.createElement('div');
    const heading = document.createElement('h4');
    heading.className = 'tournament-section-title';
    heading.textContent = `Categorías (${categories.length})`;
    categoryWrapper.appendChild(heading);

    const categoryList = document.createElement('div');
    categoryList.className = 'tournament-detail__categories';

    categories
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
      .forEach((category) => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'tournament-detail__category';

        const name = document.createElement('strong');
        name.textContent = category.name || 'Categoría';
        categoryCard.appendChild(name);

        const metaLine = document.createElement('div');
        metaLine.className = 'meta';

        const statusValue = category.status || 'inscripcion';
        const categoryStatus = document.createElement('span');
        categoryStatus.className = `tag status-${statusValue}`;
        categoryStatus.textContent = formatTournamentCategoryStatusLabel(statusValue);
        metaLine.appendChild(categoryStatus);

        if (category.gender) {
          const genderSpan = document.createElement('span');
          genderSpan.textContent = translateGender(category.gender);
          metaLine.appendChild(genderSpan);
        }

        if (category.skillLevel) {
          const skillSpan = document.createElement('span');
          skillSpan.textContent = formatSkillLevelLabel(category.skillLevel);
          metaLine.appendChild(skillSpan);
        }

        const enrollmentStats = category.enrollmentStats || {};
        const totalEnrollments = Number.isFinite(Number(enrollmentStats.total))
          ? Number(enrollmentStats.total)
          : Number.isFinite(Number(category.enrollmentCount))
          ? Number(category.enrollmentCount)
          : 0;
        const confirmedEnrollments = Number.isFinite(Number(enrollmentStats.confirmed))
          ? Number(enrollmentStats.confirmed)
          : 0;
        const enrollmentSpan = document.createElement('span');
        enrollmentSpan.textContent = `${confirmedEnrollments}/${totalEnrollments} confirmadas`;
        metaLine.appendChild(enrollmentSpan);

        const matches = Number.isFinite(Number(category.matches)) ? Number(category.matches) : 0;
        const matchesSpan = document.createElement('span');
        matchesSpan.textContent = `${matches} ${matches === 1 ? 'partido' : 'partidos'}`;
        metaLine.appendChild(matchesSpan);

        const pendingCount = Number.isFinite(Number(enrollmentStats.pending))
          ? Number(enrollmentStats.pending)
          : Number(category.pendingEnrollmentCount || 0);
        if (isAdmin() && pendingCount > 0) {
          const pendingSpan = document.createElement('span');
          pendingSpan.textContent =
            pendingCount === 1
              ? '1 solicitud pendiente'
              : `${pendingCount} solicitudes pendientes`;
          metaLine.appendChild(pendingSpan);
        }

        categoryCard.appendChild(metaLine);

        const actions = document.createElement('div');
        actions.className = 'actions category-actions';
        let hasActions = false;

        const detailId = normalizeId(detail) || tournamentId;
        const categoryId = normalizeId(category);
        const userEnrollment = category.userEnrollment || null;

        if (userEnrollment?.status) {
          const enrollmentStatus = userEnrollment.status;
          const statusTag = document.createElement('span');
          statusTag.className =
            enrollmentStatus === 'confirmada' ? 'tag tag--success' : 'tag';
          statusTag.textContent = formatTournamentEnrollmentStatusLabel(enrollmentStatus);
          actions.appendChild(statusTag);
          hasActions = true;
        }

        if (category.canRequestEnrollment && categoryId) {
          const requestButton = document.createElement('button');
          requestButton.type = 'button';
          requestButton.className = 'primary';
          requestButton.dataset.tournamentAction = 'request-enrollment';
          requestButton.dataset.tournamentId = detailId;
          requestButton.dataset.categoryId = categoryId;
          requestButton.textContent = 'Solicitar inscripción';
          actions.appendChild(requestButton);
          hasActions = true;
        } else if (!userEnrollment && !isAdmin()) {
          const note = document.createElement('span');
          note.className = 'note';
          note.textContent = 'Inscripciones cerradas';
          actions.appendChild(note);
          hasActions = true;
        }

        if (hasActions) {
          categoryCard.appendChild(actions);
        }

        categoryList.appendChild(categoryCard);
      });

    categoryWrapper.appendChild(categoryList);
    fragment.appendChild(categoryWrapper);
  } else {
    const emptyNote = document.createElement('p');
    emptyNote.className = 'tournament-section-note';
    emptyNote.textContent = 'Este torneo aún no tiene categorías registradas.';
    fragment.appendChild(emptyNote);
  }

  tournamentDetailBody.appendChild(fragment);
}

async function openTournamentSelfEnrollmentModal({ tournamentId = state.selectedTournamentId, categoryId = '' } = {}) {
  const normalizedTournamentId = tournamentId ? normalizeId(tournamentId) : '';
  const targetTournamentId = normalizedTournamentId || normalizeId(state.selectedTournamentId);

  if (!targetTournamentId) {
    showGlobalMessage('Selecciona un torneo para solicitar inscripción.', 'info');
    return;
  }

  if (!state.tournamentDetails.has(targetTournamentId)) {
    await refreshTournamentDetail(targetTournamentId);
  }

  const detail = state.tournamentDetails.get(targetTournamentId) || getTournamentById(targetTournamentId);
  if (!detail) {
    showGlobalMessage('No fue posible cargar la información del torneo.', 'error');
    return;
  }

  const categories = getTournamentCategories(targetTournamentId).filter((category) => {
    const id = normalizeId(category);
    if (!id) return false;
    if (category.canRequestEnrollment) return true;
    return categoryId && id === categoryId;
  });

  if (!categories.length) {
    showGlobalMessage('No hay categorías disponibles para solicitar inscripción.', 'info');
    return;
  }

  const requiresShirtSize = Boolean(detail.hasShirt);
  const availableSizes = Array.isArray(detail.shirtSizes)
    ? detail.shirtSizes.filter((size) => typeof size === 'string' && size.trim().length)
    : [];

  const form = document.createElement('form');
  form.className = 'form';

  const categoryLabel = document.createElement('label');
  categoryLabel.textContent = 'Categoría';
  const categorySelect = document.createElement('select');
  categorySelect.name = 'categoryId';
  categorySelect.required = true;

  categories
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
    .forEach((category) => {
      const id = normalizeId(category);
      if (!id) return;
      const option = document.createElement('option');
      option.value = id;
      option.textContent = category.name || 'Categoría';
      categorySelect.appendChild(option);
    });

  if (categoryId) {
    categorySelect.value = categoryId;
  }

  categoryLabel.appendChild(categorySelect);
  form.appendChild(categoryLabel);

  let shirtField = null;

  if (requiresShirtSize) {
    const shirtLabel = document.createElement('label');
    shirtLabel.textContent = 'Talla de camiseta';
    if (availableSizes.length) {
      const shirtSelect = document.createElement('select');
      shirtSelect.name = 'shirtSize';
      shirtSelect.required = true;
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Selecciona una talla';
      shirtSelect.appendChild(placeholder);
      availableSizes.forEach((size) => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size;
        shirtSelect.appendChild(option);
      });
      shirtLabel.appendChild(shirtSelect);
      shirtField = shirtSelect;
    } else {
      const shirtInput = document.createElement('input');
      shirtInput.type = 'text';
      shirtInput.name = 'shirtSize';
      shirtInput.required = true;
      shirtInput.placeholder = 'Indica tu talla';
      shirtInput.maxLength = 20;
      shirtLabel.appendChild(shirtInput);
      shirtField = shirtInput;
    }
    form.appendChild(shirtLabel);
  }

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'primary';
  submitButton.textContent = 'Enviar solicitud';
  actions.appendChild(submitButton);

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'ghost';
  cancelButton.dataset.action = 'cancel';
  cancelButton.textContent = 'Cancelar';
  actions.appendChild(cancelButton);

  form.appendChild(actions);

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const selectedCategory = categorySelect.value;
    if (!selectedCategory) {
      setStatusMessage(status, 'error', 'Selecciona una categoría.');
      return;
    }

    const payload = {};
    if (requiresShirtSize && shirtField) {
      const value = (shirtField.value || '').trim();
      if (!value) {
        setStatusMessage(status, 'error', 'Indica tu talla de camiseta.');
        return;
      }
      payload.shirtSize = value;
    }

    submitButton.disabled = true;
    setStatusMessage(status, 'info', 'Enviando solicitud...');
    try {
      await request(`/tournaments/${targetTournamentId}/categories/${selectedCategory}/enrollments`, {
        method: 'POST',
        body: payload,
      });
      setStatusMessage(status, 'success', 'Solicitud enviada correctamente.');
      closeModal();
      showGlobalMessage('Solicitud enviada. Un administrador la revisará en breve.');
      state.tournamentDetails.delete(targetTournamentId);
      await Promise.all([
        reloadTournaments({ selectTournamentId: targetTournamentId }),
        refreshTournamentDetail(targetTournamentId),
      ]);
      if (state.notificationBase !== null) {
        renderNotifications(state.notificationBase || []);
      }
    } catch (error) {
      setStatusMessage(status, 'error', error.message);
      submitButton.disabled = false;
    }
  });

  cancelButton.addEventListener('click', () => {
    setStatusMessage(status, '', '');
    closeModal();
  });

  openModal({
    title: 'Solicitar inscripción',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });
}

async function loadTournamentDetail(tournamentId) {
  const normalized = typeof tournamentId === 'string' ? tournamentId : normalizeId(tournamentId);
  if (!normalized) {
    return null;
  }

  if (state.tournamentDetails.has(normalized)) {
    return state.tournamentDetails.get(normalized);
  }

  const detail = await request(`/tournaments/${normalized}`);
  if (detail) {
    state.tournamentDetails.set(normalized, detail);
  }
  return detail;
}

async function refreshTournamentDetail(tournamentId = state.selectedTournamentId) {
  const normalized = typeof tournamentId === 'string' ? tournamentId : normalizeId(tournamentId);
  if (!normalized) {
    return;
  }

  pendingTournamentDetailId = normalized;
  try {
    renderTournamentDetail();
    const detail = await loadTournamentDetail(normalized);
    if (!detail || pendingTournamentDetailId !== normalized) {
      return;
    }

    renderTournamentDetail();

    if (state.selectedTournamentCategoriesId === normalized) {
      renderTournamentCategories();
    }

    if (state.selectedEnrollmentTournamentId === normalized) {
      updateEnrollmentCategoryOptions();
    }

    if (state.selectedMatchTournamentId === normalized) {
      updateMatchCategoryOptions();
    }
  } catch (error) {
    if (pendingTournamentDetailId === normalized && tournamentDetailBody) {
      tournamentDetailBody.innerHTML = `<p class="empty-state">${escapeHtml(
        error.message || 'No fue posible cargar el detalle del torneo.'
      )}</p>`;
    }
  } finally {
    if (pendingTournamentDetailId === normalized) {
      pendingTournamentDetailId = null;
    }
  }
}

function renderTournamentCategories({ loading = false } = {}) {
  if (!tournamentCategoriesList || !tournamentCategoriesEmpty) return;
  tournamentCategoriesList.innerHTML = '';

  const tournamentId = state.selectedTournamentCategoriesId;
  if (!tournamentId) {
    tournamentCategoriesEmpty.hidden = false;
    tournamentCategoriesEmpty.textContent = 'Selecciona un torneo para consultar sus categorías.';
    return;
  }

  if (loading) {
    tournamentCategoriesEmpty.hidden = false;
    tournamentCategoriesEmpty.textContent = 'Cargando categorías del torneo...';
    return;
  }

  const categories = getTournamentCategories(tournamentId);
  if (!Array.isArray(categories) || !categories.length) {
    tournamentCategoriesEmpty.hidden = false;
    const hasDetail = state.tournamentDetails.has(tournamentId);
    tournamentCategoriesEmpty.textContent = hasDetail
      ? 'No hay categorías registradas para este torneo.'
      : 'Cargando categorías del torneo...';
    return;
  }

  tournamentCategoriesEmpty.hidden = true;

  categories
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
    .forEach((category) => {
      const item = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = category.name || 'Categoría';
      item.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'meta';

      const statusValue = category.status || 'inscripcion';
      const statusTag = document.createElement('span');
      statusTag.className = `tag status-${statusValue}`;
      statusTag.textContent = formatTournamentCategoryStatusLabel(statusValue);
      meta.appendChild(statusTag);

      if (category.gender) {
        const genderSpan = document.createElement('span');
        genderSpan.textContent = translateGender(category.gender);
        meta.appendChild(genderSpan);
      }

      if (category.skillLevel) {
        const skillSpan = document.createElement('span');
        skillSpan.textContent = formatSkillLevelLabel(category.skillLevel);
        meta.appendChild(skillSpan);
      }

      const enrollmentStats = category.enrollmentStats || {};
      const totalEnrollments = Number.isFinite(Number(enrollmentStats.total))
        ? Number(enrollmentStats.total)
        : Number.isFinite(Number(category.enrollmentCount))
        ? Number(category.enrollmentCount)
        : 0;
      const confirmedEnrollments = Number.isFinite(Number(enrollmentStats.confirmed))
        ? Number(enrollmentStats.confirmed)
        : 0;
      const enrollmentSpan = document.createElement('span');
      enrollmentSpan.textContent = `${confirmedEnrollments}/${totalEnrollments} confirmadas`;
      meta.appendChild(enrollmentSpan);

      const matches = Number.isFinite(Number(category.matches)) ? Number(category.matches) : 0;
      const matchesSpan = document.createElement('span');
      matchesSpan.textContent = `${matches} ${matches === 1 ? 'partido' : 'partidos'}`;
      meta.appendChild(matchesSpan);

      item.appendChild(meta);
      tournamentCategoriesList.appendChild(item);
    });
}

function fillTournamentSelect(select, tournaments, selectedId, placeholder = 'Selecciona un torneo') {
  if (!select) return;

  select.innerHTML = '';
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = tournaments.length ? placeholder : 'Sin torneos disponibles';
  select.appendChild(placeholderOption);

  tournaments.forEach((tournament) => {
    const tournamentId = normalizeId(tournament);
    if (!tournamentId) {
      return;
    }
    const option = document.createElement('option');
    option.value = tournamentId;
    option.textContent = tournament.name || 'Torneo';
    if (tournamentId === selectedId) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.disabled = !tournaments.length;
  select.value = selectedId && !select.disabled ? selectedId : '';
}

function updateTournamentSelectors() {
  const tournaments = Array.isArray(state.tournaments) ? state.tournaments : [];
  const ids = tournaments.map((tournament) => normalizeId(tournament)).filter(Boolean);

  const resolveSelection = (value) => {
    if (!ids.length) {
      return '';
    }
    if (value && ids.includes(value)) {
      return value;
    }
    return ids[0];
  };

  state.selectedTournamentId = resolveSelection(state.selectedTournamentId);
  state.selectedTournamentCategoriesId = resolveSelection(state.selectedTournamentCategoriesId);
  state.selectedEnrollmentTournamentId = resolveSelection(state.selectedEnrollmentTournamentId);
  state.selectedMatchTournamentId = resolveSelection(state.selectedMatchTournamentId);

  fillTournamentSelect(
    tournamentCategoryTournamentSelect,
    tournaments,
    state.selectedTournamentCategoriesId,
    'Selecciona un torneo'
  );
  fillTournamentSelect(
    tournamentEnrollmentTournamentSelect,
    tournaments,
    state.selectedEnrollmentTournamentId,
    'Selecciona un torneo'
  );
  fillTournamentSelect(
    tournamentMatchTournamentSelect,
    tournaments,
    state.selectedMatchTournamentId,
    'Selecciona un torneo'
  );

  renderTournaments(tournaments);
  renderTournamentDetail();
  renderTournamentCategories();
  updateEnrollmentCategoryOptions();
  updateMatchCategoryOptions();
  updateTournamentActionAvailability();
}

function updateEnrollmentCategoryOptions() {
  if (!tournamentEnrollmentCategorySelect) return;

  const tournamentId = state.selectedEnrollmentTournamentId;
  const categories = getTournamentCategories(tournamentId);

  tournamentEnrollmentCategorySelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = categories.length ? 'Selecciona una categoría' : 'Sin categorías disponibles';
  tournamentEnrollmentCategorySelect.appendChild(placeholder);

  if (!tournamentId || !categories.length) {
    tournamentEnrollmentCategorySelect.disabled = true;
    state.selectedEnrollmentCategoryId = '';
    renderTournamentEnrollments([], { loading: false });
    return;
  }

  categories
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
    .forEach((category) => {
      const categoryId = normalizeId(category);
      if (!categoryId) {
        return;
      }
      const option = document.createElement('option');
      option.value = categoryId;
      option.textContent = category.menuTitle || category.name || 'Categoría';
      tournamentEnrollmentCategorySelect.appendChild(option);
    });

  tournamentEnrollmentCategorySelect.disabled = false;

  const availableIds = categories.map((category) => normalizeId(category)).filter(Boolean);
  if (!availableIds.includes(state.selectedEnrollmentCategoryId)) {
    state.selectedEnrollmentCategoryId = availableIds[0] || '';
  }

  tournamentEnrollmentCategorySelect.value = state.selectedEnrollmentCategoryId || '';

  if (state.selectedEnrollmentCategoryId) {
    refreshTournamentEnrollments();
  } else {
    renderTournamentEnrollments([], { loading: false });
  }
}

function updateMatchCategoryOptions() {
  if (!tournamentMatchCategorySelect) return;

  const tournamentId = state.selectedMatchTournamentId;
  const categories = getTournamentCategories(tournamentId);

  tournamentMatchCategorySelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = categories.length ? 'Selecciona una categoría' : 'Sin categorías disponibles';
  tournamentMatchCategorySelect.appendChild(placeholder);

  if (!tournamentId || !categories.length) {
    tournamentMatchCategorySelect.disabled = true;
    state.selectedMatchCategoryId = '';
    renderTournamentMatches([], { loading: false });
    return;
  }

  categories
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
    .forEach((category) => {
      const categoryId = normalizeId(category);
      if (!categoryId) {
        return;
      }
      const option = document.createElement('option');
      option.value = categoryId;
      option.textContent = category.menuTitle || category.name || 'Categoría';
      tournamentMatchCategorySelect.appendChild(option);
    });

  tournamentMatchCategorySelect.disabled = false;

  const availableIds = categories.map((category) => normalizeId(category)).filter(Boolean);
  if (!availableIds.includes(state.selectedMatchCategoryId)) {
    state.selectedMatchCategoryId = availableIds[0] || '';
  }

  tournamentMatchCategorySelect.value = state.selectedMatchCategoryId || '';

  if (state.selectedMatchCategoryId) {
    refreshTournamentMatches();
  } else {
    renderTournamentMatches([], { loading: false });
  }
}

function renderTournamentEnrollments(enrollments = [], { loading = false } = {}) {
  if (!tournamentEnrollmentList || !tournamentEnrollmentEmpty) return;

  tournamentEnrollmentList.innerHTML = '';
  const tournamentId = state.selectedEnrollmentTournamentId;
  const categoryId = state.selectedEnrollmentCategoryId;

  if (!tournamentId || !categoryId) {
    tournamentEnrollmentEmpty.hidden = false;
    tournamentEnrollmentEmpty.textContent =
      'Selecciona una categoría para mostrar las inscripciones registradas.';
    return;
  }

  if (loading) {
    tournamentEnrollmentEmpty.hidden = false;
    tournamentEnrollmentEmpty.textContent = 'Cargando inscripciones...';
    return;
  }

  if (!Array.isArray(enrollments) || !enrollments.length) {
    tournamentEnrollmentEmpty.hidden = false;
    tournamentEnrollmentEmpty.textContent = 'No hay inscripciones registradas todavía.';
    return;
  }

  tournamentEnrollmentEmpty.hidden = true;

  enrollments.forEach((enrollment) => {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = enrollment?.user?.fullName || 'Jugador';
    item.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';

    const statusValue = enrollment?.status || 'pendiente';
    const statusTag = document.createElement('span');
    statusTag.className = `tag status-${statusValue}`;
    statusTag.textContent = formatTournamentEnrollmentStatusLabel(statusValue);
    meta.appendChild(statusTag);

    if (enrollment?.user?.email) {
      const emailSpan = document.createElement('span');
      emailSpan.textContent = enrollment.user.email;
      meta.appendChild(emailSpan);
    }

    if (enrollment?.user?.phone) {
      const phoneSpan = document.createElement('span');
      phoneSpan.textContent = enrollment.user.phone;
      meta.appendChild(phoneSpan);
    }

    if (enrollment?.user?.preferredSchedule) {
      const scheduleSpan = document.createElement('span');
      scheduleSpan.textContent = `Horario: ${translateSchedule(enrollment.user.preferredSchedule)}`;
      meta.appendChild(scheduleSpan);
    }

    item.appendChild(meta);
    tournamentEnrollmentList.appendChild(item);
  });
}

async function fetchTournamentEnrollments(tournamentId, categoryId, { forceReload = false } = {}) {
  if (!tournamentId || !categoryId) {
    return [];
  }

  const cacheKey = `${tournamentId}:${categoryId}`;
  if (!forceReload && state.tournamentEnrollments.has(cacheKey)) {
    return state.tournamentEnrollments.get(cacheKey) || [];
  }

  const response = await request(`/tournaments/${tournamentId}/categories/${categoryId}/enrollments`);
  const list = Array.isArray(response) ? response : [];
  state.tournamentEnrollments.set(cacheKey, list);
  return list;
}

async function ensurePlayersLoaded() {
  if (Array.isArray(state.players) && state.players.length) {
    return state.players;
  }

  try {
    const players = await request('/players');
    state.players = Array.isArray(players) ? players : [];
    return state.players;
  } catch (error) {
    showGlobalMessage('No fue posible cargar la lista de jugadores.', 'error');
    throw error;
  }
}

async function refreshTournamentEnrollments({ forceReload = false } = {}) {
  const tournamentId = state.selectedEnrollmentTournamentId;
  const categoryId = state.selectedEnrollmentCategoryId;

  if (!tournamentId || !categoryId) {
    renderTournamentEnrollments([], { loading: false });
    return;
  }

  const cacheKey = `${tournamentId}:${categoryId}`;
  if (!forceReload && state.tournamentEnrollments.has(cacheKey)) {
    renderTournamentEnrollments(state.tournamentEnrollments.get(cacheKey) || []);
    return;
  }

  pendingTournamentEnrollmentKey = cacheKey;
  renderTournamentEnrollments([], { loading: true });

  try {
    const list = await fetchTournamentEnrollments(tournamentId, categoryId, { forceReload });
    if (pendingTournamentEnrollmentKey === cacheKey) {
      renderTournamentEnrollments(list);
    }
  } catch (error) {
    if (pendingTournamentEnrollmentKey === cacheKey) {
      tournamentEnrollmentList.innerHTML = '';
      tournamentEnrollmentEmpty.hidden = false;
      tournamentEnrollmentEmpty.textContent =
        error.message || 'No fue posible cargar las inscripciones.';
    }
  } finally {
    if (pendingTournamentEnrollmentKey === cacheKey) {
      pendingTournamentEnrollmentKey = '';
    }
  }
}

function renderTournamentMatches(matches = [], { loading = false } = {}) {
  if (!tournamentMatchesList || !tournamentMatchesEmpty) return;

  tournamentMatchesList.innerHTML = '';
  const tournamentId = state.selectedMatchTournamentId;
  const categoryId = state.selectedMatchCategoryId;

  if (!tournamentId || !categoryId) {
    tournamentMatchesEmpty.hidden = false;
    tournamentMatchesEmpty.textContent = 'Selecciona una categoría para revisar sus partidos.';
    return;
  }

  if (loading) {
    tournamentMatchesEmpty.hidden = false;
    tournamentMatchesEmpty.textContent = 'Cargando partidos...';
    return;
  }

  if (!Array.isArray(matches) || !matches.length) {
    tournamentMatchesEmpty.hidden = false;
    tournamentMatchesEmpty.textContent = 'No hay partidos registrados para esta categoría.';
    return;
  }

  tournamentMatchesEmpty.hidden = true;

  matches.forEach((match) => {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    const players = Array.isArray(match?.players)
      ? match.players.map((player) => player?.fullName).filter(Boolean)
      : [];
    title.textContent = players.length ? players.join(' vs ') : 'Partido pendiente';
    item.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'tournament-match-meta';

    if (match.round) {
      const roundSpan = document.createElement('span');
      roundSpan.textContent = `Ronda: ${match.round}`;
      meta.appendChild(roundSpan);
    }

    if (Number.isFinite(Number(match.matchNumber))) {
      const numberSpan = document.createElement('span');
      numberSpan.textContent = `Partido ${match.matchNumber}`;
      meta.appendChild(numberSpan);
    }

    if (match.scheduledAt) {
      const dateSpan = document.createElement('span');
      dateSpan.textContent = formatDate(match.scheduledAt);
      meta.appendChild(dateSpan);
    }

    if (match.court) {
      const courtSpan = document.createElement('span');
      courtSpan.textContent = `Pista: ${match.court}`;
      meta.appendChild(courtSpan);
    }

    const statusValue = match.status || 'pendiente';
    const statusTag = document.createElement('span');
    statusTag.className = `tag status-${statusValue}`;
    statusTag.textContent = formatTournamentMatchStatusLabel(statusValue);
    meta.appendChild(statusTag);

    item.appendChild(meta);
    tournamentMatchesList.appendChild(item);
  });
}

async function refreshTournamentMatches({ forceReload = false } = {}) {
  const tournamentId = state.selectedMatchTournamentId;
  const categoryId = state.selectedMatchCategoryId;

  if (!tournamentId || !categoryId) {
    renderTournamentMatches([], { loading: false });
    return;
  }

  const cacheKey = `${tournamentId}:${categoryId}`;
  if (!forceReload && state.tournamentMatches.has(cacheKey)) {
    renderTournamentMatches(state.tournamentMatches.get(cacheKey) || []);
    return;
  }

  pendingTournamentMatchesKey = cacheKey;
  renderTournamentMatches([], { loading: true });

  try {
    const response = await request(`/tournaments/${tournamentId}/categories/${categoryId}/matches`);
    const list = Array.isArray(response) ? response : [];
    state.tournamentMatches.set(cacheKey, list);
    if (pendingTournamentMatchesKey === cacheKey) {
      renderTournamentMatches(list);
    }
  } catch (error) {
    if (pendingTournamentMatchesKey === cacheKey) {
      tournamentMatchesList.innerHTML = '';
      tournamentMatchesEmpty.hidden = false;
      tournamentMatchesEmpty.textContent =
        error.message || 'No fue posible cargar los partidos del torneo.';
    }
  } finally {
    if (pendingTournamentMatchesKey === cacheKey) {
      pendingTournamentMatchesKey = '';
    }
  }
}

async function reloadTournaments({ selectTournamentId } = {}) {
  let tournaments = [];

  try {
    const response = await request('/tournaments');
    tournaments = Array.isArray(response) ? response : [];
  } catch (error) {
    showGlobalMessage(error.message, 'error');
    throw error;
  }

  state.tournaments = tournaments;

  const normalizedSelection = selectTournamentId ? normalizeId(selectTournamentId) : '';
  if (normalizedSelection) {
    state.selectedTournamentId = normalizedSelection;
    state.selectedTournamentCategoriesId = normalizedSelection;
    state.selectedEnrollmentTournamentId = normalizedSelection;
    state.selectedMatchTournamentId = normalizedSelection;
  }

  updateTournamentSelectors();
  return tournaments;
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

const CALENDAR_MATCH_STATUS_SET = new Set(CALENDAR_MATCH_STATUSES);

function getCalendarMatchesForDisplay() {
  const matches = Array.isArray(state.calendarMatches) ? state.calendarMatches : [];
  return matches.filter((match) => CALENDAR_MATCH_STATUS_SET.has(match.status));
}

function getScheduledCalendarMatches() {
  return getCalendarMatchesForDisplay().filter((match) => Boolean(match.scheduledAt));
}

function findMatchById(matchId) {
  const normalizedId = normalizeId(matchId);
  if (!normalizedId) {
    return null;
  }

  const sources = [
    state.calendarMatches,
    state.upcomingMatches,
    state.myMatches,
    state.pendingApprovalMatches,
    state.completedMatches,
  ];

  for (const source of sources) {
    if (!Array.isArray(source)) continue;
    const found = source.find((item) => normalizeId(item) === normalizedId);
    if (found) {
      return found;
    }
  }

  return null;
}

function isUserMatchParticipant(match, user = state.user) {
  if (!match || !Array.isArray(match.players)) {
    return false;
  }

  const userId = normalizeId(user);
  if (!userId) {
    return false;
  }

  return match.players.some((player) => normalizeId(player) === userId);
}

function collectMatchDetailMessages(match) {
  if (!match) {
    return [];
  }

  const messages = [];
  const resultStatus = match.result?.status || '';

  if (match.status === 'programado') {
    if (match.scheduledAt) {
      const scheduleLabel = formatDate(match.scheduledAt);
      const courtLabel = formatCourtDisplay(match.court);
      messages.push(
        courtLabel ? `Programado para ${scheduleLabel} · ${courtLabel}` : `Programado para ${scheduleLabel}`
      );
    } else if (match.court) {
      const courtLabel = formatCourtDisplay(match.court);
      if (courtLabel) {
        messages.push(`Pista asignada: ${courtLabel}.`);
      }
    }
  } else if (match.status === 'pendiente') {
    messages.push('A la espera de que alguien proponga fecha y hora.');
  } else if (match.status === 'propuesto' && match.proposal) {
    const proposer = getPlayerDisplayName(match.proposal.requestedBy) || 'Un jugador';
    if (match.proposal.proposedFor) {
      messages.push(`${proposer} propuso ${formatDate(match.proposal.proposedFor)}.`);
    } else {
      messages.push(`${proposer} ha propuesto disputar el partido.`);
    }
    if (match.court) {
      const courtLabel = formatCourtDisplay(match.court);
      if (courtLabel) {
        messages.push(`Pista sugerida: ${courtLabel}.`);
      }
    }
    if (match.proposal.message) {
      messages.push(`Mensaje: ${match.proposal.message}`);
    }
  } else if (match.status === 'revision' || resultStatus === 'en_revision') {
    messages.push('Resultado pendiente de confirmación.');
  } else if (match.status === 'caducado') {
    messages.push('El plazo para disputar el partido venció sin puntos.');
  }

  if (resultStatus === 'rechazado') {
    messages.push('El resultado enviado fue rechazado. Vuelve a registrarlo.');
  }

  return messages;
}

function getResultStatusMessage(status) {
  switch (status) {
    case 'confirmado':
      return 'Resultado confirmado.';
    case 'en_revision':
      return 'Resultado pendiente de confirmación.';
    case 'rechazado':
      return 'El resultado enviado fue rechazado.';
    case 'pendiente':
      return 'Resultado pendiente.';
    default:
      return '';
  }
}

function formatCourtDisplay(value) {
  if (!value) {
    return '';
  }

  const court = (typeof value === 'string' ? value : String(value)).trim();
  if (!court) {
    return '';
  }

  return court.toLocaleLowerCase('es-ES').startsWith('pista') ? court : `Pista ${court}`;
}

function getMatchParticipantName(match, participant) {
  if (!participant) {
    return '';
  }

  if (typeof participant === 'object') {
    return getPlayerDisplayName(participant);
  }

  if (typeof participant === 'string' && Array.isArray(match?.players)) {
    const found = match.players.find((player) => normalizeId(player) === participant);
    if (found) {
      return getPlayerDisplayName(found);
    }
  }

  return '';
}

function openMatchViewer(match, { allowResultEdit = false, allowMatchEdit = false } = {}) {
  if (!match) {
    showGlobalMessage('No fue posible cargar los datos del partido.', 'error');
    return;
  }

  const matchId = normalizeId(match);
  const container = document.createElement('div');
  container.className = 'match-viewer';

  const infoSection = document.createElement('div');
  infoSection.className = 'match-viewer__section';
  const infoList = document.createElement('dl');
  infoList.className = 'match-viewer__info';

  const appendInfo = (label, value) => {
    const term = document.createElement('dt');
    term.textContent = label;
    infoList.appendChild(term);
    const detail = document.createElement('dd');
    if (value instanceof Node) {
      detail.appendChild(value);
    } else {
      detail.textContent = value;
    }
    infoList.appendChild(detail);
  };

  const statusTag = document.createElement('span');
  statusTag.className = `tag status-${match.status}`;
  statusTag.textContent = STATUS_LABELS[match.status] || match.status || 'Estado por confirmar';
  appendInfo('Estado', statusTag);

  const categoryLabel = document.createElement('span');
  categoryLabel.className = 'tag match-category-tag';
  categoryLabel.textContent = match.category?.name || 'Sin categoría';
  const categoryColor = match.category ? getCategoryColor(match.category) : '';
  applyCategoryTagColor(categoryLabel, categoryColor);
  appendInfo('Categoría', categoryLabel);

  const scheduleLabel = match.scheduledAt ? formatDate(match.scheduledAt) : 'Por confirmar';
  const courtDisplay = formatCourtDisplay(match.court) || 'Por confirmar';
  appendInfo('Fecha', scheduleLabel);
  appendInfo('Pista', courtDisplay);

  infoSection.appendChild(infoList);
  container.appendChild(infoSection);

  const detailMessages = collectMatchDetailMessages(match);
  if (detailMessages.length) {
    const detailsSection = document.createElement('div');
    detailsSection.className = 'match-viewer__section';
    const detailsList = document.createElement('div');
    detailsList.className = 'match-viewer__details';
    detailMessages.forEach((message) => {
      const paragraph = document.createElement('p');
      paragraph.className = 'meta';
      paragraph.textContent = message;
      detailsList.appendChild(paragraph);
    });
    detailsSection.appendChild(detailsList);
    container.appendChild(detailsSection);
  }

  const warningMessage = getExpirationWarningMessage(match);
  if (warningMessage && match.status !== 'caducado') {
    const warning = document.createElement('p');
    warning.className = 'deadline-warning';
    warning.textContent = warningMessage;
    container.appendChild(warning);
  }

  const playersSection = document.createElement('div');
  playersSection.className = 'match-viewer__section';
  const playersTitle = document.createElement('h4');
  playersTitle.textContent = 'Jugadores';
  playersSection.appendChild(playersTitle);

  const playersList = document.createElement('ul');
  playersList.className = 'match-viewer__players';
  const players = Array.isArray(match.players) ? match.players : [];

  if (!players.length) {
    const empty = document.createElement('li');
    empty.className = 'match-viewer__player';
    empty.textContent = 'Jugadores por definir.';
    playersList.appendChild(empty);
  } else {
    const currentUserId = normalizeId(state.user);
    players.forEach((player) => {
      const item = document.createElement('li');
      item.className = 'match-viewer__player';

      const name = document.createElement('span');
      name.className = 'match-viewer__player-name';
      name.textContent = getPlayerDisplayName(player);
      item.appendChild(name);

      const meta = [];
      if (player?.preferredSchedule) {
        meta.push(`Horario preferido: ${translateSchedule(player.preferredSchedule)}`);
      }
      if (normalizeId(player) === currentUserId) {
        meta.push('Tú');
      }

      if (meta.length) {
        const metaRow = document.createElement('div');
        metaRow.className = 'match-viewer__player-meta';
        meta.forEach((entry) => {
          if (entry === 'Tú') {
            const selfTag = document.createElement('span');
            selfTag.className = 'tag';
            selfTag.textContent = entry;
            metaRow.appendChild(selfTag);
          } else {
            const metaItem = document.createElement('span');
            metaItem.textContent = entry;
            metaRow.appendChild(metaItem);
          }
        });
        item.appendChild(metaRow);
      }

      playersList.appendChild(item);
    });
  }

  playersSection.appendChild(playersList);
  container.appendChild(playersSection);

  const resultSection = document.createElement('div');
  resultSection.className = 'match-viewer__section';
  const resultTitle = document.createElement('h4');
  resultTitle.textContent = 'Resultado';
  resultSection.appendChild(resultTitle);

  const resultStatusMessage = getResultStatusMessage(match.result?.status);
  if (resultStatusMessage) {
    const statusParagraph = document.createElement('p');
    statusParagraph.className = 'meta';
    statusParagraph.textContent = resultStatusMessage;
    resultSection.appendChild(statusParagraph);
  }

  const winnerName = getMatchParticipantName(match, match.result?.winner);
  if (winnerName) {
    const winnerParagraph = document.createElement('p');
    winnerParagraph.className = 'meta';
    winnerParagraph.textContent = `Ganador: ${winnerName}`;
    resultSection.appendChild(winnerParagraph);
  }

  const scoreboard = createResultScoreboard(match);
  const scoreSummary = formatMatchScore(match);

  if (scoreboard) {
    resultSection.appendChild(scoreboard);
  } else if (scoreSummary) {
    const summaryParagraph = document.createElement('p');
    summaryParagraph.className = 'meta';
    summaryParagraph.textContent = scoreSummary;
    resultSection.appendChild(summaryParagraph);
  }

  if (match.result?.notes) {
    const resultNotes = document.createElement('p');
    resultNotes.className = 'match-viewer__notes';
    resultNotes.textContent = match.result.notes;
    resultSection.appendChild(resultNotes);
  }

  const reporterName = getMatchParticipantName(match, match.result?.reportedBy);
  if (reporterName) {
    const reporterParagraph = document.createElement('p');
    reporterParagraph.className = 'meta';
    reporterParagraph.textContent = `Reportado por ${reporterName}.`;
    resultSection.appendChild(reporterParagraph);
  }

  if (resultSection.childNodes.length > 1) {
    container.appendChild(resultSection);
  }

  if (isAdmin() && match.notes) {
    const adminNotesSection = document.createElement('div');
    adminNotesSection.className = 'match-viewer__section';
    const adminNotesTitle = document.createElement('h4');
    adminNotesTitle.textContent = 'Notas internas';
    adminNotesSection.appendChild(adminNotesTitle);
    const adminNotes = document.createElement('p');
    adminNotes.className = 'match-viewer__notes';
    adminNotes.textContent = match.notes;
    adminNotesSection.appendChild(adminNotes);
    container.appendChild(adminNotesSection);
  }

  if (allowMatchEdit || allowResultEdit) {
    const actions = document.createElement('div');
    actions.className = 'match-viewer__actions';

    if (allowResultEdit && matchId) {
      const needsReview = match.status === 'revision' || match.result?.status === 'en_revision';
      const resultButton = document.createElement('button');
      resultButton.type = 'button';
      resultButton.className = 'primary';
      resultButton.textContent = needsReview ? 'Revisar resultado' : 'Registrar resultado';
      resultButton.addEventListener('click', () => {
        closeModal();
        openResultModal(matchId);
      });
      actions.appendChild(resultButton);
    }

    if (allowMatchEdit && matchId) {
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'secondary';
      editButton.textContent = 'Editar partido';
      editButton.addEventListener('click', () => {
        closeModal();
        openMatchModal(matchId);
      });
      actions.appendChild(editButton);
    }

    if (actions.childNodes.length) {
      container.appendChild(actions);
    }
  }

  const modalTitle = Array.isArray(match.players) && match.players.length
    ? match.players.map((player) => getPlayerDisplayName(player)).join(' vs ')
    : 'Detalle del partido';

  openModal({
    title: modalTitle,
    content: (body) => {
      body.appendChild(container);
    },
  });
}

function openCalendarMatch(matchId) {
  if (!matchId) return;

  const match = findMatchById(matchId);
  if (!match) {
    showGlobalMessage('No fue posible cargar los datos del partido.', 'error');
    return;
  }

  const allowMatchEdit = isAdmin();
  const allowResultEdit = allowMatchEdit || isUserMatchParticipant(match);
  openMatchViewer(match, { allowMatchEdit, allowResultEdit });
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
    const statusClass = match.status === 'programado' ? 'confirmed' : 'pending';
    const event = document.createElement('div');
    event.className = `calendar-event ${statusClass}`;
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
    const statusTag = document.createElement('span');
    statusTag.className = `tag status-${match.status}`;
    statusTag.textContent = STATUS_LABELS[match.status] || match.status;
    meta.appendChild(statusTag);

    if (match.category?.name) {
      const categoryTag = document.createElement('span');
      categoryTag.className = 'tag match-category-tag';
      categoryTag.textContent = match.category.name;
      applyCategoryTagColor(categoryTag, categoryColor, { backgroundAlpha: 0.22 });
      meta.appendChild(categoryTag);
    } else {
      const pendingCategory = document.createElement('span');
      pendingCategory.textContent = 'Categoría por confirmar';
      meta.appendChild(pendingCategory);
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

  const matches = getCalendarMatchesForDisplay();

  renderCalendarView({
    container: calendarContainer,
    labelElement: calendarLabel,
    referenceDate: state.calendarDate,
    matches,
    includeUnscheduled: true,
  });
}

function renderGlobalCalendar() {
  if (!globalCalendarContainer) return;

  const confirmedMatches = getScheduledCalendarMatches();
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

async function loadPlayerCourtData() {
  if (!state.token) {
    return;
  }

  try {
    const reservations = await request('/courts/reservations');
    state.courtReservations = Array.isArray(reservations) ? reservations : [];
    renderCourtReservations();
  } catch (error) {
    state.courtReservations = [];
    renderCourtReservations();
    showGlobalMessage(error.message, 'error');
  }

  await refreshCourtAvailability('player');
}

async function refreshCourtAvailability(scope = 'player') {
  const targetDate = scope === 'admin' ? state.courtAdminDate : state.courtAvailabilityDate;
  const formatted = formatDateInput(targetDate) || formatDateInput(new Date());
  if (!formatted) {
    return;
  }

  if (scope === 'admin' && courtAdminStatus) {
    setStatusMessage(courtAdminStatus, 'info', 'Cargando reservas...');
  }

  try {
    const availability = await request(`/courts/availability?date=${formatted}`);
    const courts = Array.isArray(availability?.courts) ? availability.courts : [];
    if (scope === 'admin') {
      state.courtAdminSchedule = courts;
      state.courtAdminBlocks = Array.isArray(availability?.blocks)
        ? availability.blocks
        : [];
      renderCourtAdminSchedule();
      if (courtAdminStatus) {
        setStatusMessage(courtAdminStatus, '', '');
      }
    } else {
      state.courtAvailability = courts;
      renderCourtAvailability();
    }
  } catch (error) {
    if (scope === 'admin') {
      state.courtAdminSchedule = [];
      state.courtAdminBlocks = [];
      renderCourtAdminSchedule();
      if (courtAdminStatus) {
        setStatusMessage(courtAdminStatus, 'error', error.message);
      }
    } else {
      state.courtAvailability = [];
      renderCourtAvailability();
      showGlobalMessage(error.message, 'error');
    }
  }
}

async function loadAdminCourtData() {
  if (!hasCourtManagementAccess()) {
    state.courtAdminSchedule = [];
    state.courtAdminBlocks = [];
    renderCourtAdminSchedule();
    return;
  }

  await refreshCourtAvailability('admin');
}

function createMatchListItem(match, { isResultManagementList = false } = {}) {
  const item = document.createElement('li');
  const matchId = match?._id || match?.id;
  if (matchId) {
    item.dataset.matchId = matchId;
  }

  const categoryColor = match?.category ? getCategoryColor(match.category) : '';
  const title = document.createElement('strong');
  const players = Array.isArray(match?.players)
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
  metaPrimary.appendChild(document.createElement('span')).textContent = formatDate(match?.scheduledAt);
  if (match?.court) {
    metaPrimary.appendChild(document.createElement('span')).textContent = `Pista ${match.court}`;
  }
  if (match?.category?.name) {
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

  if (match?.status === 'pendiente' || match?.status === 'propuesto') {
    const warningMessage = getExpirationWarningMessage(match);
    if (warningMessage) {
      const warning = document.createElement('p');
      warning.className = 'deadline-warning';
      warning.textContent = warningMessage;
      item.appendChild(warning);
    }
  } else if (match?.status === 'caducado') {
    const deadlineDate = getMatchExpirationDate(match);
    const deadlineLabel = formatExpirationDeadline(deadlineDate);
    const warning = document.createElement('p');
    warning.className = 'deadline-warning deadline-warning--expired';
    warning.textContent = deadlineLabel
      ? `El plazo venció el ${deadlineLabel}. El partido caducó sin puntos.`
      : 'El plazo venció. El partido caducó sin puntos.';
    item.appendChild(warning);
  }

  if (match?.status === 'revision' || match?.result?.status === 'en_revision') {
    const pending = document.createElement('div');
    pending.className = 'meta warning';
    pending.textContent = 'Resultado pendiente de validación.';
    item.appendChild(pending);
  }

  if (match?.result?.status === 'confirmado' || match?.status === 'completado') {
    const summary = document.createElement('div');
    summary.className = 'meta result-meta';
    const winner = match?.result?.winner;
    if (winner) {
      const winnerName = getPlayerDisplayName(winner);
      summary.appendChild(document.createElement('span')).textContent = `Ganador: ${winnerName}`;
    }
    const scoreLabel = formatMatchScore(match);
    if (scoreLabel) {
      summary.appendChild(document.createElement('span')).textContent = scoreLabel;
    }
    if (match?.result?.reportedBy) {
      const reporterName = getPlayerDisplayName(match.result.reportedBy);
      summary.appendChild(document.createElement('span')).textContent = `Reportado por ${reporterName}`;
    }
    item.appendChild(summary);

    const scoreboard = createResultScoreboard(match);
    if (!scoreboard && scoreLabel) {
      const fallback = document.createElement('p');
      fallback.className = 'meta';
      fallback.textContent = scoreLabel;
      item.appendChild(fallback);
    }
    if (scoreboard) {
      item.appendChild(scoreboard);
    }
  } else if (match?.result?.status === 'rechazado') {
    const rejected = document.createElement('div');
    rejected.className = 'meta warning';
    rejected.textContent = 'El último resultado fue rechazado.';
    item.appendChild(rejected);
  }

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
        match?.status === 'revision' || match?.result?.status === 'en_revision'
          ? 'Revisar resultado'
          : 'Editar resultado';
    } else {
      editButton.dataset.action = 'edit-match';
      editButton.textContent = 'Editar';
    }
    actions.appendChild(editButton);

    if (!isResultManagementList && matchId && match?.status !== 'completado') {
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
        match?.status === 'revision' || match?.result?.status === 'en_revision'
          ? 'Revisar resultado'
          : 'Registrar resultado';
      actions.appendChild(resultButton);
    }
    item.appendChild(actions);
  }

  return item;
}

function renderMatches(
  matches = [],
  container,
  emptyMessage,
  { listKey = 'upcoming' } = {}
) {
  if (!container) return;

  container.innerHTML = '';

  const baseMatches = Array.isArray(matches) ? matches.slice() : [];
  const filteredMatches = filterMatchesByCategory(baseMatches);

  if (!filteredMatches.length) {
    container.innerHTML = `<li class="empty-state">${emptyMessage}</li>`;
    return;
  }

  const isResultManagementList =
    container === pendingApprovalsList || container === completedMatchesList;

  const grouped = new Map();

  filteredMatches.forEach((match) => {
    const key = getMatchCategoryKey(match);
    let group = grouped.get(key);
    if (!group) {
      const metadata = getMatchCategoryMetadata(key, match);
      group = {
        key,
        name: metadata.name,
        color: metadata.color,
        matches: [],
      };
      grouped.set(key, group);
    }
    group.matches.push(match);
    if (!group.color) {
      const metadata = getMatchCategoryMetadata(key, match);
      group.color = metadata.color;
      if (!group.name || group.name === 'Categoría') {
        group.name = metadata.name;
      }
    }
  });

  const sortedGroups = Array.from(grouped.values()).sort((a, b) => {
    const nameA = (a.name || '').toLocaleLowerCase('es-ES');
    const nameB = (b.name || '').toLocaleLowerCase('es-ES');
    return nameA.localeCompare(nameB);
  });

  sortedGroups.forEach((group) => {
    const totalMatches = group.matches.length;
    const totalPages = Math.max(1, Math.ceil(totalMatches / MATCHES_PER_PAGE));
    const currentPage = getMatchPaginationPage(listKey, group.key);
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    if (safePage !== currentPage) {
      setMatchPaginationPage(listKey, group.key, safePage);
    }
    const startIndex = (safePage - 1) * MATCHES_PER_PAGE;
    const pageMatches = group.matches.slice(startIndex, startIndex + MATCHES_PER_PAGE);

    const groupItem = document.createElement('li');
    groupItem.className = 'match-category-group';
    groupItem.dataset.categoryId = group.key;

    const header = document.createElement('div');
    header.className = 'match-category-group__header';

    const title = document.createElement('div');
    title.className = 'match-category-group__title';
    if (group.color) {
      const indicator = createCategoryColorIndicator(group.color, group.name);
      if (indicator) {
        title.appendChild(indicator);
      }
    }
    const name = document.createElement('strong');
    name.textContent = group.name || UNCATEGORIZED_CATEGORY_LABEL;
    title.appendChild(name);
    header.appendChild(title);

    const count = document.createElement('span');
    count.className = 'match-category-group__count';
    count.textContent = `${totalMatches} ${totalMatches === 1 ? 'partido' : 'partidos'}`;
    header.appendChild(count);

    groupItem.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'match-category-group__matches list';

    pageMatches.forEach((match) => {
      list.appendChild(createMatchListItem(match, { isResultManagementList }));
    });

    groupItem.appendChild(list);

    if (totalPages > 1) {
      const pagination = document.createElement('div');
      pagination.className = 'match-category-group__pagination';

      const info = document.createElement('span');
      info.className = 'match-category-group__pagination-info';
      info.textContent = `Página ${safePage} de ${totalPages}`;
      pagination.appendChild(info);

      const controls = document.createElement('div');
      controls.className = 'match-category-group__pagination-controls';

      const prevButton = document.createElement('button');
      prevButton.type = 'button';
      prevButton.className = 'ghost';
      prevButton.dataset.action = 'paginate';
      prevButton.dataset.list = listKey;
      prevButton.dataset.category = group.key;
      prevButton.dataset.direction = 'previous';
      prevButton.textContent = 'Anterior';
      prevButton.disabled = safePage <= 1;
      controls.appendChild(prevButton);

      const nextButton = document.createElement('button');
      nextButton.type = 'button';
      nextButton.className = 'ghost';
      nextButton.dataset.action = 'paginate';
      nextButton.dataset.list = listKey;
      nextButton.dataset.category = group.key;
      nextButton.dataset.direction = 'next';
      nextButton.textContent = 'Siguiente';
      nextButton.disabled = safePage >= totalPages;
      controls.appendChild(nextButton);

      pagination.appendChild(controls);
      groupItem.appendChild(pagination);
    }

    container.appendChild(groupItem);
  });
}

const MATCH_LIST_CONFIG = {
  upcoming: {
    getMatches: () => state.upcomingMatches,
    container: () => upcomingList,
    emptyMessage: 'No hay partidos programados.',
  },
  pending: {
    getMatches: () => state.pendingApprovalMatches,
    container: () => pendingApprovalsList,
    emptyMessage: 'No hay resultados pendientes por aprobar.',
  },
  completed: {
    getMatches: () => state.completedMatches,
    container: () => completedMatchesList,
    emptyMessage: 'Aún no hay partidos confirmados para mostrar.',
  },
};

function rerenderMatchList(listKey) {
  const config = MATCH_LIST_CONFIG[listKey];
  if (!config) {
    return;
  }
  const container = typeof config.container === 'function' ? config.container() : null;
  if (!container) {
    return;
  }
  const matches = config.getMatches ? config.getMatches() : [];
  renderMatches(Array.isArray(matches) ? matches : [], container, config.emptyMessage, { listKey });
}

function handleMatchPagination(dataset = {}) {
  const listKey = dataset.list || 'upcoming';
  const categoryKey = dataset.category;
  const currentPage = getMatchPaginationPage(listKey, categoryKey);
  let nextPage = currentPage;

  if (dataset.direction === 'previous') {
    nextPage = Math.max(1, currentPage - 1);
  } else if (dataset.direction === 'next') {
    nextPage = currentPage + 1;
  } else if (dataset.page) {
    const parsed = Number(dataset.page);
    if (Number.isFinite(parsed) && parsed > 0) {
      nextPage = Math.floor(parsed);
    }
  }

  setMatchPaginationPage(listKey, categoryKey, nextPage);
  rerenderMatchList(listKey);
}

function getReservationParticipants(reservation) {
  if (!reservation) {
    return [];
  }
  if (Array.isArray(reservation.participants) && reservation.participants.length) {
    return reservation.participants;
  }
  if (reservation.match && Array.isArray(reservation.match.players) && reservation.match.players.length) {
    return reservation.match.players;
  }
  if (reservation.createdBy) {
    return [reservation.createdBy];
  }
  return [];
}

function formatReservationParticipantsLabel(reservation) {
  const participants = getReservationParticipants(reservation);
  if (!participants.length) {
    return '';
  }
  return participants.map((participant) => getPlayerDisplayName(participant)).join(' · ');
}

function renderCourtReservations() {
  if (!courtReservationList) {
    return;
  }

  const reservations = Array.isArray(state.courtReservations) ? state.courtReservations.slice() : [];
  reservations.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  courtReservationList.innerHTML = '';

  if (!reservations.length) {
    if (courtReservationEmpty) {
      courtReservationEmpty.hidden = false;
    }
    return;
  }

  if (courtReservationEmpty) {
    courtReservationEmpty.hidden = true;
  }

  reservations.forEach((reservation) => {
    const item = document.createElement('li');
    item.className = 'court-reservation-item';
    if (reservation.status === 'cancelada') {
      item.classList.add('court-reservation-item--cancelled');
    }

    const reservationId = reservation._id || reservation.id;
    if (reservationId) {
      item.dataset.reservationId = reservationId;
    }

    const title = document.createElement('strong');
    title.textContent = reservation.court ? `Pista ${reservation.court}` : 'Pista por confirmar';
    item.appendChild(title);

    const scheduleRow = document.createElement('div');
    scheduleRow.className = 'meta';
    scheduleRow.appendChild(document.createElement('span')).textContent = formatDate(reservation.startsAt);
    scheduleRow.appendChild(document.createElement('span')).textContent = formatTimeRangeLabel(
      reservation.startsAt,
      reservation.endsAt
    );
    if (reservation.type === 'partido' || reservation.match) {
      const matchTag = document.createElement('span');
      matchTag.className = 'tag';
      matchTag.textContent = 'Partido';
      scheduleRow.appendChild(matchTag);
    } else {
      const manualTag = document.createElement('span');
      manualTag.className = 'tag';
      manualTag.textContent = 'Reserva';
      scheduleRow.appendChild(manualTag);
    }
    if (reservation.status === 'cancelada') {
      const cancelledTag = document.createElement('span');
      cancelledTag.className = 'tag danger';
      cancelledTag.textContent = 'Cancelada';
      scheduleRow.appendChild(cancelledTag);
    }
    item.appendChild(scheduleRow);

    const participants = getReservationParticipants(reservation);
    if (participants.length) {
      const participantsRow = document.createElement('div');
      participantsRow.className = 'meta';
      participantsRow.appendChild(document.createElement('span')).textContent = 'Jugadores:';
      participants.forEach((participant) => {
        participantsRow.appendChild(document.createElement('span')).textContent = getPlayerDisplayName(participant);
      });
      item.appendChild(participantsRow);
    }

    if (reservation.notes && reservation.type !== 'partido') {
      const notesRow = document.createElement('p');
      notesRow.className = 'reservation-notes';
      notesRow.textContent = reservation.notes;
      item.appendChild(notesRow);
    }

    const canCancel =
      reservation.status === 'reservada' && (!reservation.match || reservation.type !== 'partido');
    if (canCancel && reservationId) {
      const actions = document.createElement('div');
      actions.className = 'reservation-actions';
      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.className = 'secondary';
      cancelButton.dataset.action = 'cancel-reservation';
      cancelButton.dataset.reservationId = reservationId;
      cancelButton.textContent = 'Cancelar';
      actions.appendChild(cancelButton);
      item.appendChild(actions);
    }

    courtReservationList.appendChild(item);
  });
}

function renderCourtAvailability() {
  if (courtAvailabilityDateInput) {
    courtAvailabilityDateInput.value = formatDateInput(state.courtAvailabilityDate);
  }
  if (!courtAvailabilityList) {
    return;
  }

  const availability = Array.isArray(state.courtAvailability) ? state.courtAvailability : [];
  courtAvailabilityList.innerHTML = '';

  if (!availability.length) {
    if (courtAvailabilityEmpty) {
      courtAvailabilityEmpty.hidden = false;
    }
    return;
  }

  if (courtAvailabilityEmpty) {
    courtAvailabilityEmpty.hidden = true;
  }

  availability.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'court-availability-item';
    const title = document.createElement('strong');
    title.textContent = entry.court || 'Pista por definir';
    item.appendChild(title);

    const reservations = Array.isArray(entry.reservations) ? entry.reservations : [];
    const blocks = Array.isArray(entry.blocks) ? entry.blocks : [];

    if (!reservations.length && !blocks.length) {
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = 'Disponible todo el día';
      item.appendChild(meta);
    } else {
      blocks.forEach((block) => {
        const blockRow = document.createElement('div');
        blockRow.className = 'meta court-availability-block';
        const timeLabel = formatTimeRangeLabel(block.startsAt, block.endsAt);
        blockRow.appendChild(document.createElement('span')).textContent = `${timeLabel}`;
        const labelParts = [];
        if (block.contextName) {
          labelParts.push(block.contextName);
        }
        if (block.appliesToAllCourts) {
          labelParts.push('Todas las pistas');
        }
        labelParts.push('Bloqueo oficial');
        blockRow.appendChild(document.createElement('span')).textContent = labelParts.join(' · ');
        if (block.notes) {
          blockRow.appendChild(document.createElement('span')).textContent = block.notes;
        }
        item.appendChild(blockRow);
      });

      reservations.forEach((reservation) => {
        const slot = document.createElement('div');
        slot.className = 'meta court-availability-slot';
        slot.appendChild(document.createElement('span')).textContent = formatTimeRangeLabel(
          reservation.startsAt,
          reservation.endsAt
        );
        const participants = getReservationParticipants(reservation);
        if (participants.length) {
          slot.appendChild(document.createElement('span')).textContent = participants
            .map((participant) => getPlayerDisplayName(participant))
            .join(' · ');
        }
        if (reservation.type === 'partido' || reservation.match) {
          const tag = document.createElement('span');
          tag.className = 'tag';
          tag.textContent = 'Partido';
          slot.appendChild(tag);
        }
        if (reservation.createdBy && reservation.type !== 'partido') {
          slot.appendChild(document.createElement('span')).textContent = `Reserva de ${getPlayerDisplayName(
            reservation.createdBy
          )}`;
        }
        item.appendChild(slot);
      });
    }

    courtAvailabilityList.appendChild(item);
  });
}

function renderCourtAdminSchedule() {
  if (courtAdminDateInput) {
    courtAdminDateInput.value = formatDateInput(state.courtAdminDate);
  }
  if (!courtAdminSchedule) {
    return;
  }

  courtAdminSchedule.innerHTML = '';
  const availability = Array.isArray(state.courtAdminSchedule) ? state.courtAdminSchedule : [];

  if (!availability.length) {
    if (courtAdminEmpty) {
      courtAdminEmpty.hidden = false;
    }
    return;
  }

  if (courtAdminEmpty) {
    courtAdminEmpty.hidden = true;
  }

  availability.forEach((entry) => {
    const block = document.createElement('div');
    block.className = 'court-schedule';
    const heading = document.createElement('h4');
    heading.textContent = entry.court || 'Pista';
    block.appendChild(heading);

    const reservations = Array.isArray(entry.reservations) ? entry.reservations : [];
    const blocks = Array.isArray(entry.blocks) ? entry.blocks : [];
    const timeline = [];

    reservations.forEach((reservation) => {
      timeline.push({
        type: 'reservation',
        startsAt: reservation.startsAt,
        endsAt: reservation.endsAt,
        reservation,
      });
    });

    blocks.forEach((blockEntry) => {
      timeline.push({
        type: 'block',
        startsAt: blockEntry.startsAt,
        endsAt: blockEntry.endsAt,
        block: blockEntry,
      });
    });

    timeline.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

    if (!timeline.length) {
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = 'Sin reservas registradas para este día.';
      block.appendChild(meta);
    } else {
      timeline.forEach((timelineEntry) => {
        if (timelineEntry.type === 'block') {
          const { block: blockEntry } = timelineEntry;
          if (!blockEntry) {
            return;
          }

          const row = document.createElement('div');
          row.className = 'court-schedule-row court-schedule-row--block';

          const info = document.createElement('div');
          info.className = 'court-schedule-info';
          info.appendChild(document.createElement('span')).textContent = formatTimeRangeLabel(
            blockEntry.startsAt,
            blockEntry.endsAt
          );

          const details = [];
          if (blockEntry.contextName) {
            details.push(blockEntry.contextName);
          }
          if (blockEntry.appliesToAllCourts) {
            details.push('Todas las pistas');
          } else if (Array.isArray(blockEntry.courts) && blockEntry.courts.length) {
            details.push(`Pistas: ${blockEntry.courts.join(', ')}`);
          }
          details.push('Bloqueo oficial');
          info.appendChild(document.createElement('span')).textContent = details.join(' · ');

          if (blockEntry.notes) {
            info.appendChild(document.createElement('span')).textContent = blockEntry.notes;
          }

          row.appendChild(info);

          if (hasCourtManagementAccess() && blockEntry.id) {
            const actions = document.createElement('div');
            actions.className = 'court-schedule-actions';
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'ghost danger';
            deleteButton.dataset.action = 'delete-block';
            deleteButton.dataset.blockId = blockEntry.id;
            deleteButton.textContent = 'Eliminar bloqueo';
            actions.appendChild(deleteButton);
            row.appendChild(actions);
          }

          block.appendChild(row);
          return;
        }

        const reservation = timelineEntry.reservation;
        const row = document.createElement('div');
        row.className = 'court-schedule-row';

        const info = document.createElement('div');
        info.className = 'court-schedule-info';
        info.appendChild(document.createElement('span')).textContent = formatTimeRangeLabel(
          reservation.startsAt,
          reservation.endsAt
        );
        const participants = getReservationParticipants(reservation);
        if (participants.length) {
          info.appendChild(document.createElement('span')).textContent = participants
            .map((participant) => getPlayerDisplayName(participant))
            .join(' · ');
        }
        if (reservation.type === 'partido' || reservation.match) {
          info.appendChild(document.createElement('span')).textContent = 'Partido de liga';
        } else if (reservation.createdBy) {
          info.appendChild(document.createElement('span')).textContent = `Reserva de ${getPlayerDisplayName(
            reservation.createdBy
          )}`;
        }
        if (reservation.notes && reservation.type !== 'partido') {
          info.appendChild(document.createElement('span')).textContent = reservation.notes;
        }
        row.appendChild(info);

        const actions = document.createElement('div');
        actions.className = 'court-schedule-actions';
        const reservationId = reservation._id || reservation.id;
        if (reservationId && reservation.status === 'reservada' && (!reservation.match || reservation.type !== 'partido')) {
          const cancelButton = document.createElement('button');
          cancelButton.type = 'button';
          cancelButton.className = 'ghost';
          cancelButton.dataset.action = 'cancel-reservation';
          cancelButton.dataset.reservationId = reservationId;
          cancelButton.textContent = 'Cancelar';
          actions.appendChild(cancelButton);
        }
        if (actions.childElementCount) {
          row.appendChild(actions);
        }

        block.appendChild(row);
      });
    }

    courtAdminSchedule.appendChild(block);
  });
}

function isAllDaySegment(start, end) {
  if (!start || !end) {
    return false;
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return false;
  }
  const dayStart = startOfDay(startDate).getTime();
  const nextDayStart = addDays(startOfDay(startDate), 1).getTime();
  return startDate.getTime() === dayStart && endDate.getTime() === nextDayStart;
}

function buildCourtCalendarDayMap(events = []) {
  const grouped = new Map();
  events.forEach((event) => {
    if (!event || !event.startsAt || !event.endsAt) {
      return;
    }
    const start = new Date(event.startsAt);
    const end = new Date(event.endsAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return;
    }

    const safeEnd = end > start ? end : new Date(start.getTime() + 30 * 60 * 1000);
    let cursor = startOfDay(start);
    const finalDay = startOfDay(new Date(safeEnd.getTime() - 1));

    while (cursor.getTime() <= finalDay.getTime()) {
      const dayKey = cursor.getTime();
      if (!grouped.has(dayKey)) {
        grouped.set(dayKey, []);
      }

      const dayStart = cursor;
      const dayEnd = addDays(cursor, 1);
      const displayStartsAt = start > dayStart ? start : dayStart;
      const displayEndsAt = safeEnd < dayEnd ? safeEnd : dayEnd;
      const spansMultipleDays = finalDay.getTime() !== startOfDay(start).getTime();

      grouped.get(dayKey).push({
        ...event,
        displayStartsAt,
        displayEndsAt,
        spansMultipleDays,
      });

      cursor = addDays(cursor, 1);
    }
  });

  grouped.forEach((list) => {
    list.sort((a, b) => {
      const first = new Date(a.displayStartsAt || a.startsAt);
      const second = new Date(b.displayStartsAt || b.startsAt);
      return first - second;
    });
  });

  return grouped;
}

function createCourtCalendarEvent(event) {
  const container = document.createElement('div');
  const type = event.type || 'reservation';
  container.className = `calendar-event calendar-event--${type}`;
  if (event.spansMultipleDays) {
    container.classList.add('calendar-event--spanning');
  }

  const title = document.createElement('strong');
  title.textContent = event.title || 'Reserva de pista';
  container.appendChild(title);

  const displayStart = event.displayStartsAt || event.startsAt;
  const displayEnd = event.displayEndsAt || event.endsAt;
  const timeLabel = isAllDaySegment(displayStart, displayEnd)
    ? 'Todo el día'
    : formatTimeRangeLabel(displayStart, displayEnd);

  const meta = document.createElement('div');
  meta.className = 'meta';
  const courtLabel = event.courtLabel || event.court || 'Pista por confirmar';
  meta.textContent = `${timeLabel} · ${courtLabel}`;
  container.appendChild(meta);

  if (event.subtitle) {
    const subtitle = document.createElement('div');
    subtitle.className = 'meta calendar-event-subtitle';
    subtitle.textContent = event.subtitle;
    container.appendChild(subtitle);
  }

  if (event.notes) {
    const notes = document.createElement('div');
    notes.className = 'meta calendar-event-notes';
    notes.textContent = event.notes;
    container.appendChild(notes);
  }

  if (type === 'match' && event.matchId) {
    bindCalendarEvent(container, event.matchId);
  } else if (type === 'reservation') {
    container.dataset.calendarAction = 'open-reservation';
    container.dataset.startsAt = event.startsAt ? new Date(event.startsAt).toISOString() : '';
    container.dataset.court = event.court || '';
    container.classList.add('calendar-event--actionable');
    container.tabIndex = 0;
    container.setAttribute('role', 'button');
    container.addEventListener('click', () => {
      openReservationEditorFromCalendar(event);
    });
    container.addEventListener('keydown', (keyboardEvent) => {
      if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
        keyboardEvent.preventDefault();
        openReservationEditorFromCalendar(event);
      }
    });
  }

  return container;
}

function renderCourtCalendar() {
  if (!courtCalendarContainer) {
    return;
  }

  const reference = state.courtCalendarDate instanceof Date ? new Date(state.courtCalendarDate) : new Date();
  const monthStart = startOfMonth(reference);
  state.courtCalendarDate = monthStart;

  if (courtCalendarLabel) {
    courtCalendarLabel.textContent = formatMonthLabel(monthStart);
  }

  const events = Array.isArray(state.courtCalendarEvents) ? state.courtCalendarEvents : [];
  const grouped = buildCourtCalendarDayMap(events);

  courtCalendarContainer.innerHTML = '';

  let cursor = startOfWeek(monthStart);
  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const weekRow = document.createElement('div');
    weekRow.className = 'calendar-week';

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const day = addDays(cursor, dayIndex);
      const key = startOfDay(day).getTime();
      const dayEvents = grouped.get(key) || [];
      const column = document.createElement('div');
      column.className = 'calendar-day calendar-day--actionable';
      column.dataset.calendarDate = formatDateInput(day);
      column.tabIndex = 0;
      column.setAttribute('role', 'button');
      column.setAttribute('aria-label', `Agenda del ${formatDateOnly(day)}`);

      if (day.getMonth() !== monthStart.getMonth()) {
        column.classList.add('calendar-day--muted');
      }

      const header = document.createElement('div');
      header.className = 'calendar-day-header';
      header.innerHTML = `<strong>${day.getDate()}</strong><span>${new Intl.DateTimeFormat('es-ES', {
        weekday: 'short',
      }).format(day)}</span>`;
      column.appendChild(header);

      if (!dayEvents.length) {
        const empty = document.createElement('div');
        empty.className = 'calendar-empty';
        empty.textContent = '—';
        column.appendChild(empty);
      } else {
        dayEvents.forEach((event) => {
          column.appendChild(createCourtCalendarEvent(event));
        });
      }

      weekRow.appendChild(column);
    }

    courtCalendarContainer.appendChild(weekRow);
    cursor = addDays(cursor, 7);
    if (cursor.getMonth() > monthStart.getMonth() && cursor.getDate() >= 7) {
      break;
    }
  }
}

function resetCourtCalendarView() {
  if (courtCalendarContainer) {
    courtCalendarContainer.innerHTML =
      '<p class="empty-state">Selecciona un mes para ver las reservas y bloqueos de pistas.</p>';
  }
  if (courtCalendarLabel) {
    const reference = state.courtCalendarDate instanceof Date ? state.courtCalendarDate : new Date();
    courtCalendarLabel.textContent = formatMonthLabel(startOfMonth(reference));
  }
  if (courtBlocksEmpty) {
    courtBlocksEmpty.hidden = false;
  }
}

function renderCourtBlocksList() {
  if (!courtBlocksList) {
    return;
  }

  const blocks = Array.isArray(state.courtBlocks) ? state.courtBlocks.slice() : [];
  blocks.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  courtBlocksList.innerHTML = '';

  if (!blocks.length) {
    if (courtBlocksEmpty) {
      courtBlocksEmpty.hidden = false;
      courtBlocksEmpty.textContent = 'No hay bloqueos registrados para el mes seleccionado.';
      courtBlocksList.appendChild(courtBlocksEmpty);
    } else {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'empty-state';
      emptyItem.textContent = 'No hay bloqueos registrados para el mes seleccionado.';
      courtBlocksList.appendChild(emptyItem);
    }
    return;
  }

  if (courtBlocksEmpty) {
    courtBlocksEmpty.hidden = true;
  }

  blocks.forEach((block) => {
    const item = document.createElement('li');
    item.className = 'court-block-item';

    const header = document.createElement('div');
    header.className = 'court-block-item__header';

    const title = document.createElement('strong');
    title.textContent = block.contextName || 'Bloqueo programado';
    header.appendChild(title);

    const badge = document.createElement('span');
    badge.className = 'tag tag--block';
    badge.textContent = block.contextType === 'league' ? 'Liga' : 'Torneo';
    header.appendChild(badge);

    item.appendChild(header);

    const courts = Array.isArray(block.courts) ? block.courts : [];
    const rangeLabel = formatDateRangeLabel(block.startsAt, block.endsAt);
    const schedule = document.createElement('div');
    schedule.className = 'meta court-block-item__schedule';
    schedule.textContent = `${rangeLabel} · ${formatTimeRangeLabel(block.startsAt, block.endsAt)}`;
    item.appendChild(schedule);

    const courtLabel = document.createElement('div');
    courtLabel.className = 'meta court-block-item__courts';
    courtLabel.textContent = block.appliesToAllCourts
      ? 'Todas las pistas del club'
      : `Pistas: ${courts.join(', ')}`;
    item.appendChild(courtLabel);

    if (block.notes) {
      const notes = document.createElement('div');
      notes.className = 'meta court-block-item__notes';
      notes.textContent = block.notes;
      item.appendChild(notes);
    }

    if (hasCourtManagementAccess() && block.id) {
      const actions = document.createElement('div');
      actions.className = 'court-block-item__actions';
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'ghost danger';
      deleteButton.dataset.action = 'delete-block';
      deleteButton.dataset.blockId = block.id;
      deleteButton.textContent = 'Eliminar bloqueo';
      actions.appendChild(deleteButton);
      item.appendChild(actions);
    }

    courtBlocksList.appendChild(item);
  });
}

async function loadCourtCalendarData() {
  if (!hasCourtManagementAccess()) {
    state.courtCalendarEvents = [];
    state.courtBlocks = [];
    resetCourtCalendarView();
    renderCourtBlocksList();
    return;
  }

  const reference = state.courtCalendarDate instanceof Date ? new Date(state.courtCalendarDate) : new Date();
  const monthStart = startOfMonth(reference);
  const monthEnd = endOfMonth(monthStart);
  state.courtCalendarDate = monthStart;

  if (courtCalendarStatus) {
    setStatusMessage(courtCalendarStatus, 'info', 'Cargando calendario de pistas...');
  }

  const startParam = encodeURIComponent(monthStart.toISOString());
  const endParam = encodeURIComponent(monthEnd.toISOString());

  try {
    const [reservationsResponse, blocksResponse] = await Promise.all([
      request(`/courts/reservations?start=${startParam}&end=${endParam}`),
      request(`/courts/blocks?start=${startParam}&end=${endParam}`),
    ]);

    const reservations = Array.isArray(reservationsResponse) ? reservationsResponse : [];
    const blocks = Array.isArray(blocksResponse) ? blocksResponse : [];

    const events = [];

    reservations.forEach((reservation) => {
      const startsAt = reservation.startsAt ? new Date(reservation.startsAt) : null;
      const endsAt = reservation.endsAt ? new Date(reservation.endsAt) : null;
      if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
        return;
      }

      const participantsLabel = formatReservationParticipantsLabel(reservation);
      const courtLabel = reservation.court || 'Pista por definir';

      if (reservation.match) {
        const players = Array.isArray(reservation.match.players)
          ? reservation.match.players.map((player) => getPlayerDisplayName(player)).join(' vs ')
          : participantsLabel || 'Partido programado';
        const subtitleParts = ['Partido oficial'];
        if (reservation.match.league?.name) {
          subtitleParts.push(reservation.match.league.name);
        }
        if (reservation.match.tournament?.name) {
          subtitleParts.push(reservation.match.tournament.name);
        }

        events.push({
          id: reservation._id || reservation.id,
          type: 'match',
          startsAt,
          endsAt,
          title: players,
          subtitle: subtitleParts.join(' · '),
          court: reservation.court,
          courtLabel,
          matchId: reservation.match._id || reservation.match.id,
        });
        return;
      }

      const createdByLabel = reservation.createdBy
        ? getPlayerDisplayName(reservation.createdBy)
        : 'Reserva manual';
      const subtitle = participantsLabel ? `Participantes: ${participantsLabel}` : '';

      events.push({
        id: reservation._id || reservation.id,
        type: 'reservation',
        startsAt,
        endsAt,
        title: `Reserva de ${createdByLabel}`,
        subtitle,
        notes: reservation.notes || '',
        court: reservation.court,
        courtLabel,
        reservationId: reservation._id || reservation.id,
      });
    });

    const normalizedBlocks = blocks.map((block) => {
      const startsAt = block.startsAt ? new Date(block.startsAt) : null;
      const endsAt = block.endsAt ? new Date(block.endsAt) : null;
      return {
        ...block,
        startsAt,
        endsAt,
      };
    });

    normalizedBlocks.forEach((block) => {
      if (!block.startsAt || !block.endsAt || Number.isNaN(block.startsAt.getTime()) || Number.isNaN(block.endsAt.getTime())) {
        return;
      }
      const courts = Array.isArray(block.courts) ? block.courts : [];
      events.push({
        id: block.id,
        type: 'block',
        startsAt: block.startsAt,
        endsAt: block.endsAt,
        title: block.contextName ? `Bloqueo · ${block.contextName}` : 'Bloqueo de pistas',
        subtitle: block.appliesToAllCourts
          ? 'Aplica a todas las pistas'
          : courts.length
            ? `Pistas: ${courts.join(', ')}`
            : 'Pistas por confirmar',
        notes: block.notes || '',
        courtLabel: block.appliesToAllCourts
          ? 'Todas las pistas'
          : courts.length
            ? courts.join(', ')
            : 'Pistas por confirmar',
      });
    });

    state.courtCalendarEvents = events;
    state.courtBlocks = normalizedBlocks;

    renderCourtCalendar();
    renderCourtBlocksList();
    ensureCourtBlockRangeDefaults(monthStart);
    if (courtCalendarStatus) {
      setStatusMessage(courtCalendarStatus, '', '');
    }
  } catch (error) {
    state.courtCalendarEvents = [];
    state.courtBlocks = [];
    resetCourtCalendarView();
    renderCourtBlocksList();
    if (courtCalendarStatus) {
      setStatusMessage(courtCalendarStatus, 'error', error.message);
    }
  }
}

async function deleteCourtBlock(blockId, { button } = {}) {
  if (!blockId) {
    return false;
  }

  const confirmed = window.confirm('¿Seguro que deseas eliminar este bloqueo de pistas?');
  if (!confirmed) {
    return false;
  }

  if (button) {
    button.disabled = true;
  }

  try {
    await request(`/courts/blocks/${blockId}`, { method: 'DELETE' });
    showGlobalMessage('Bloqueo eliminado correctamente.', 'success');
    await Promise.all([loadAdminCourtData(), loadCourtCalendarData()]);
    return true;
  } catch (error) {
    showGlobalMessage(error.message, 'error');
    return false;
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

async function handleCourtCalendarDaySelection(dateValue) {
  if (!dateValue) {
    return;
  }

  const nextDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(nextDate.getTime())) {
    return;
  }

  state.courtAdminDate = nextDate;
  if (courtAdminDateInput) {
    courtAdminDateInput.value = formatDateInput(nextDate);
  }
  showSection('section-court-admin');
  ensureCourtBlockRangeDefaults(nextDate);
  await refreshCourtAvailability('admin');
}

function openReservationEditorFromCalendar(eventData = {}) {
  if (!courtReservationForm) {
    return;
  }

  showSection('section-court-reservations');

  const start = eventData.startsAt ? new Date(eventData.startsAt) : null;
  if (start && !Number.isNaN(start.getTime())) {
    if (courtReservationDateInput) {
      courtReservationDateInput.value = formatDateInput(start);
    }
    if (courtReservationTimeInput) {
      courtReservationTimeInput.value = formatTimeInputValue(start);
    }
  } else if (state.courtAdminDate && courtReservationDateInput) {
    courtReservationDateInput.value = formatDateInput(state.courtAdminDate);
  }

  if (eventData.court && courtReservationCourtSelect) {
    const options = Array.from(courtReservationCourtSelect.options || []);
    const exists = options.some((option) => option.value === eventData.court);
    if (exists) {
      courtReservationCourtSelect.value = eventData.court;
    }
  }

  courtReservationNotesInput?.focus();
}

async function cancelCourtReservation(reservationId, { button } = {}) {
  if (!reservationId) {
    return false;
  }

  const confirmed = window.confirm('¿Seguro que deseas cancelar la reserva?');
  if (!confirmed) {
    return false;
  }

  if (button) {
    button.disabled = true;
  }

  try {
    await request(`/courts/reservations/${reservationId}`, { method: 'DELETE' });
    showGlobalMessage('Reserva cancelada correctamente.', 'success');
    await loadPlayerCourtData();
    if (hasCourtManagementAccess()) {
      await Promise.all([loadAdminCourtData(), loadCourtCalendarData()]);
    }
    return true;
  } catch (error) {
    showGlobalMessage(error.message, 'error');
    return false;
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

function filterMatchesByCategory(matches = []) {
  return Array.isArray(matches) ? matches : [];
}

function getMatchCategoryKey(match) {
  const normalized = normalizeId(match?.category);
  return normalized || UNCATEGORIZED_CATEGORY_KEY;
}

function getMatchCategoryMetadata(categoryKey, match) {
  if (match?.category && typeof match.category === 'object') {
    return {
      name: match.category.name || UNCATEGORIZED_CATEGORY_LABEL,
      color: getCategoryColor(match.category),
    };
  }

  const fallback = state.categories.find((category) => normalizeId(category) === categoryKey);
  if (fallback) {
    return {
      name: fallback.name || UNCATEGORIZED_CATEGORY_LABEL,
      color: getCategoryColor(fallback),
    };
  }

  if (categoryKey === UNCATEGORIZED_CATEGORY_KEY) {
    return {
      name: UNCATEGORIZED_CATEGORY_LABEL,
      color: '',
    };
  }

  return {
    name: 'Categoría',
    color: '',
  };
}

function getMatchPaginationStore(listKey) {
  if (!state.matchPagination[listKey]) {
    state.matchPagination[listKey] = {};
  }
  return state.matchPagination[listKey];
}

function getMatchPaginationPage(listKey, categoryKey) {
  const store = getMatchPaginationStore(listKey);
  const key = categoryKey || UNCATEGORIZED_CATEGORY_KEY;
  const value = Number(store[key]);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function setMatchPaginationPage(listKey, categoryKey, page) {
  const store = getMatchPaginationStore(listKey);
  const key = categoryKey || UNCATEGORIZED_CATEGORY_KEY;
  const numeric = Number(page);
  store[key] = Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 1;
}

function resetMatchPaginationState(listKey) {
  if (state.matchPagination[listKey]) {
    state.matchPagination[listKey] = {};
  }
}

function resetAllMatchPagination() {
  resetMatchPaginationState('upcoming');
  resetMatchPaginationState('pending');
  resetMatchPaginationState('completed');
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
    const isLeagueEnrollment = notification.type === 'enrollment-request';
    const isTournamentEnrollment = notification.type === 'tournament-enrollment-request';
    const isEnrollmentAlert = isLeagueEnrollment || isTournamentEnrollment;

    title.textContent = isEnrollmentAlert
      ? notification.title || `Solicitudes de inscripción · ${notification.categoryName || 'Categoría'}`
      : notification.title;
    item.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.appendChild(document.createElement('span')).textContent = formatDate(notification.scheduledFor);
    const channelLabel = (() => {
      if (isTournamentEnrollment) return 'TORNEOS';
      if (isLeagueEnrollment) return 'SOLICITUDES';
      return (notification.channel || 'app').toUpperCase();
    })();
    meta.appendChild(document.createElement('span')).textContent = channelLabel;
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
      const actions = document.createElement('div');
      actions.className = 'actions';
      const reviewButton = document.createElement('button');
      reviewButton.type = 'button';
      reviewButton.className = 'primary';
      let hasTarget = false;
      if (isTournamentEnrollment && notification.tournamentId) {
        reviewButton.dataset.reviewTournament = notification.tournamentId;
        if (notification.categoryId) {
          reviewButton.dataset.reviewTournamentCategory = notification.categoryId;
        }
        hasTarget = true;
      } else if (notification.categoryId) {
        reviewButton.dataset.reviewCategory = notification.categoryId;
        hasTarget = true;
      }

      if (hasTarget) {
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

function createRegulationEditor(
  initialContent = '',
  placeholder = 'Describe el reglamento del club con formato enriquecido'
) {
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
  editor.dataset.placeholder = placeholder;

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

  populateCourtReservationCourts();
  populateCourtBlockCourts();
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
  const renderSection = (element, regulation, emptyMessage) => {
    if (!element) return;

    const html = getRegulationHtml(regulation);
    const sanitized = typeof html === 'string' ? html.trim() : '';

    if (!sanitized) {
      element.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
      return;
    }

    element.innerHTML = sanitized;
  };

  renderSection(
    leagueRulesContent,
    state.club?.regulation,
    'Aún no se ha configurado el reglamento de la liga.'
  );
  renderSection(
    tournamentRulesContent,
    state.club?.tournamentRegulation,
    'Aún no se ha configurado el reglamento de torneos.'
  );
}

renderRules();

function setRankingStatusMessage(type, message) {
  if (!rankingStatus) {
    return;
  }
  setStatusMessage(rankingStatus, type, message);
}

function getCategoryById(categoryId) {
  if (!categoryId) return null;
  const categories = Array.isArray(state.categories) ? state.categories : [];
  return (
    categories.find((category) => {
      const id = normalizeId(category);
      return id && id === categoryId;
    }) || null
  );
}

function renderRankingSections() {
  if (!rankingCategoryList) return;

  const categories = Array.isArray(state.categories) ? state.categories.slice() : [];
  rankingCategoryList.innerHTML = '';

  if (!categories.length) {
    rankingEmpty.hidden = false;
    rankingEmpty.textContent = isAdmin()
      ? 'Crea una categoría para ver el ranking.'
      : 'Aún no hay categorías registradas.';
    setRankingStatusMessage('', '');
    return;
  }

  rankingEmpty.hidden = true;

  let anyLoading = false;
  let anyError = false;

  categories
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
    .forEach((category) => {
      const categoryId = normalizeId(category);
      if (!categoryId) {
        return;
      }

      const record = state.rankingsByCategory.get(categoryId);
      const isLoading = record ? record.loading : state.rankingsLoading;
      const rankingData = record?.data || null;
      const errorMessage = record?.error || null;

      if (isLoading) {
        anyLoading = true;
      }
      if (errorMessage) {
        anyError = true;
      }

      const section = document.createElement('section');
      section.className = 'ranking-category';
      section.dataset.categoryId = categoryId;

      const header = document.createElement('div');
      header.className = 'ranking-category__header';

      const title = document.createElement('div');
      title.className = 'ranking-category__title';
      const categoryColor = getCategoryColor(category);
      if (categoryColor) {
        const indicator = createCategoryColorIndicator(categoryColor, category.name);
        if (indicator) {
          title.appendChild(indicator);
        }
      }
      const nameSpan = document.createElement('span');
      nameSpan.textContent = category.name || 'Categoría';
      title.appendChild(nameSpan);
      header.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'ranking-category__meta';

      const genderLabel = translateGender(category.gender);
      if (genderLabel) {
        meta.appendChild(document.createElement('span')).textContent = genderLabel;
      }

      if (category.skillLevel) {
        meta.appendChild(document.createElement('span')).textContent =
          formatSkillLevelLabel(category.skillLevel);
      }

      const statusValue = category.status || 'inscripcion';
      const statusLabel = CATEGORY_STATUS_LABELS[statusValue] || '';
      if (statusLabel) {
        meta.appendChild(document.createElement('span')).textContent = statusLabel;
      }

      const league = resolveLeague(category.league);
      if (league?.name) {
        const leagueParts = [league.name];
        if (league.year) {
          leagueParts.push(String(league.year));
        }
        meta.appendChild(document.createElement('span')).textContent = leagueParts.join(' · ');
      }

      const participantCount = rankingData?.ranking?.length ?? Number(category.enrollmentCount || 0);
      meta.appendChild(document.createElement('span')).textContent = `Participantes: ${participantCount}`;

      header.appendChild(meta);
      section.appendChild(header);

      if (isLoading) {
        const loadingMessage = document.createElement('p');
        loadingMessage.className = 'ranking-category__empty';
        loadingMessage.textContent = 'Cargando ranking...';
        section.appendChild(loadingMessage);
        rankingCategoryList.appendChild(section);
        return;
      }

      if (errorMessage) {
        const errorParagraph = document.createElement('p');
        errorParagraph.className = 'ranking-category__empty';
        errorParagraph.textContent = errorMessage;
        section.appendChild(errorParagraph);
        rankingCategoryList.appendChild(section);
        return;
      }

      const rankingEntries = Array.isArray(rankingData?.ranking) ? rankingData.ranking : [];
      if (!rankingEntries.length) {
        const emptyParagraph = document.createElement('p');
        emptyParagraph.className = 'ranking-category__empty';
        emptyParagraph.textContent = 'Aún no hay resultados para esta categoría.';
        section.appendChild(emptyParagraph);
        rankingCategoryList.appendChild(section);
        return;
      }

      const tableWrapper = document.createElement('div');
      tableWrapper.className = 'ranking-category__table';

      const scrollContainer = document.createElement('div');
      scrollContainer.className = 'ranking-category__table-scroll table-scroll';

      const table = document.createElement('table');
      table.className = 'table';

      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th scope="col">Pos.</th>
          <th scope="col">Jugador</th>
          <th scope="col">Puntos</th>
          <th scope="col">PJ</th>
          <th scope="col">G</th>
          <th scope="col">P</th>
          <th scope="col">Juegos</th>
        </tr>
      `;
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      rankingEntries.forEach((entry, index) => {
        const row = document.createElement('tr');

        const positionCell = document.createElement('td');
        const podiumEmoji = getPodiumEmoji(index);
        positionCell.textContent = podiumEmoji ? `${index + 1} ${podiumEmoji}` : index + 1;
        row.appendChild(positionCell);

        const playerCell = document.createElement('td');
        const playerElement = buildPlayerCell(entry.player, { size: 'sm' });
        const infoContainer = playerElement?.querySelector('.player-cell__info');
        const movementBadge = createMovementBadge(entry);
        if (movementBadge && infoContainer) {
          movementBadge.classList.add('movement-badge--inline');
          infoContainer.appendChild(movementBadge);
        } else if (movementBadge) {
          playerElement.appendChild(movementBadge);
        }
        playerCell.appendChild(playerElement);
        row.appendChild(playerCell);

        row.appendChild(document.createElement('td')).textContent = entry.points ?? 0;
        row.appendChild(document.createElement('td')).textContent = entry.matchesPlayed ?? 0;
        row.appendChild(document.createElement('td')).textContent = entry.wins ?? 0;
        row.appendChild(document.createElement('td')).textContent = entry.losses ?? 0;
        row.appendChild(document.createElement('td')).textContent = entry.gamesWon ?? 0;

        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      scrollContainer.appendChild(table);
      tableWrapper.appendChild(scrollContainer);
      section.appendChild(tableWrapper);

      rankingCategoryList.appendChild(section);
    });

  if (anyLoading) {
    setRankingStatusMessage('info', 'Actualizando rankings...');
  } else if (anyError) {
    setRankingStatusMessage(
      'error',
      'No fue posible cargar algunos rankings. Intenta de nuevo más tarde.'
    );
  } else {
    setRankingStatusMessage('', '');
  }
}

async function fetchCategoryRanking(categoryId, { forceReload = false, suppressError = false } = {}) {
  const normalizedId = typeof categoryId === 'string' ? categoryId : normalizeId(categoryId);
  if (!normalizedId) {
    return null;
  }

  const currentRecord = state.rankingsByCategory.get(normalizedId);
  if (!forceReload && currentRecord && currentRecord.data && !currentRecord.error) {
    return currentRecord.data;
  }

  state.rankingsByCategory.set(normalizedId, {
    loading: true,
    data: currentRecord?.data || null,
    error: null,
  });
  renderRankingSections();

  try {
    const response = await request(`/categories/${normalizedId}/ranking`);
    state.rankingsByCategory.set(normalizedId, {
      loading: false,
      data: response,
      error: null,
    });
    renderRankingSections();
    return response;
  } catch (error) {
    const message = error.message || 'No fue posible cargar el ranking.';
    state.rankingsByCategory.set(normalizedId, {
      loading: false,
      data: null,
      error: message,
    });
    renderRankingSections();
    if (suppressError) {
      return null;
    }
    throw error;
  }
}

async function refreshAllRankings({ forceReload = false } = {}) {
  if (!rankingCategoryList) return;

  const categories = Array.isArray(state.categories) ? state.categories : [];
  const categoryIds = categories.map((category) => normalizeId(category)).filter(Boolean);

  Array.from(state.rankingsByCategory.keys()).forEach((storedId) => {
    if (!categoryIds.includes(storedId)) {
      state.rankingsByCategory.delete(storedId);
    }
  });

  if (!categoryIds.length) {
    state.rankingsLoading = false;
    rankingCategoryList.innerHTML = '';
    rankingEmpty.hidden = false;
    rankingEmpty.textContent = isAdmin()
      ? 'Crea una categoría para ver el ranking.'
      : 'Aún no hay categorías registradas.';
    setRankingStatusMessage('', '');
    return;
  }

  if (!state.selectedCategoryId || !categoryIds.includes(state.selectedCategoryId)) {
    state.selectedCategoryId = categoryIds[0] || null;
  }

  const fetchTargets = categoryIds.filter((categoryId) => {
    if (forceReload) {
      return true;
    }
    const record = state.rankingsByCategory.get(categoryId);
    return !(record && record.data && Array.isArray(record.data.ranking));
  });

  if (!fetchTargets.length) {
    state.rankingsLoading = false;
    renderRankingSections();
    setRankingStatusMessage('', '');
    return;
  }

  state.rankingsLoading = true;
  renderRankingSections();
  setRankingStatusMessage('info', 'Actualizando rankings...');

  for (const categoryId of fetchTargets) {
    await fetchCategoryRanking(categoryId, { forceReload, suppressError: true });
  }

  state.rankingsLoading = false;
  renderRankingSections();

  const hasErrors = fetchTargets.some((categoryId) => {
    const record = state.rankingsByCategory.get(categoryId);
    return Boolean(record?.error);
  });

  if (hasErrors) {
    setRankingStatusMessage(
      'error',
      'No fue posible cargar algunos rankings. Intenta de nuevo más tarde.'
    );
  } else {
    setRankingStatusMessage('', '');
  }
}

async function printRankingSheet(categoryId) {
  const normalizedId = typeof categoryId === 'string' ? categoryId : normalizeId(categoryId);
  const targetId = normalizedId || state.selectedCategoryId;

  if (!targetId) {
    throw new Error('Selecciona una categoría con ranking disponible.');
  }

  let record = state.rankingsByCategory.get(targetId);
  if (!record || !record.data || !Array.isArray(record.data.ranking)) {
    try {
      const data = await fetchCategoryRanking(targetId, { forceReload: false });
      record = { data };
    } catch (error) {
      throw new Error(error.message || 'No fue posible cargar el ranking.');
    }
  }

  const rankingData = record?.data;
  const rankingEntries = Array.isArray(rankingData?.ranking) ? rankingData.ranking : [];
  if (!rankingEntries.length) {
    throw new Error('Esta categoría no tiene ranking disponible.');
  }

  const category = rankingData.category || getCategoryById(targetId);
  const categoryName = category?.name || 'Ranking de la liga';

  const printWindow = window.open('', '_blank', 'width=1024,height=768');
  if (!printWindow) {
    throw new Error('No fue posible abrir la vista de impresión. Permite las ventanas emergentes.');
  }

  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(now);

  const rows = rankingEntries
    .map((entry, index) => {
      const playerMarkup = buildPlayerCellMarkup(entry.player);
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
      <title>Ranking ${escapeHtml(categoryName)}</title>
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
        @media print { body { margin: 16px; } table { box-shadow: none; } }
      </style>
    </head>
    <body>
      <h1>Ranking · ${escapeHtml(categoryName)}</h1>
      <p class="subtitle">Actualizado el ${escapeHtml(formattedDate)}</p>
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

async function openRankingPrintModal(defaultCategoryId = state.selectedCategoryId) {
  if (!rankingCategoryList) return;

  const categories = Array.isArray(state.categories) ? state.categories : [];
  if (!categories.length) {
    showGlobalMessage('No hay categorías disponibles para imprimir.', 'info');
    return;
  }

  const form = document.createElement('form');
  form.className = 'form';

  const categoryLabel = document.createElement('label');
  categoryLabel.textContent = 'Categoría';
  const categorySelect = document.createElement('select');
  categorySelect.name = 'categoryId';
  categorySelect.required = true;

  categories
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
    .forEach((category) => {
      const categoryId = normalizeId(category);
      if (!categoryId) {
        return;
      }
      const option = document.createElement('option');
      option.value = categoryId;
      option.textContent = category.name || 'Categoría';
      categorySelect.appendChild(option);
    });

  if (defaultCategoryId) {
    categorySelect.value = defaultCategoryId;
  }

  categoryLabel.appendChild(categorySelect);
  form.appendChild(categoryLabel);

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'primary';
  submitButton.textContent = 'Imprimir';
  actions.appendChild(submitButton);

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'ghost';
  cancelButton.dataset.action = 'cancel';
  cancelButton.textContent = 'Cancelar';
  actions.appendChild(cancelButton);

  form.appendChild(actions);

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const categoryId = categorySelect.value;
    if (!categoryId) {
      setStatusMessage(status, 'error', 'Selecciona una categoría.');
      return;
    }

    submitButton.disabled = true;
    setStatusMessage(status, 'info', 'Preparando vista de impresión...');
    try {
      await printRankingSheet(categoryId);
      closeModal();
      setStatusMessage(status, '', '');
    } catch (error) {
      setStatusMessage(status, 'error', error.message);
    } finally {
      submitButton.disabled = false;
    }
  });

  cancelButton.addEventListener('click', () => {
    setStatusMessage(status, '', '');
    closeModal();
  });

  openModal({
    title: 'Imprimir ranking',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });
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
      playerDirectoryEmpty.textContent = 'Aún no hay usuarios que coincidan con el filtro seleccionado.';
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

async function loadEnrollments(categoryId, { force = false } = {}) {
  if (!categoryId) {
    return [];
  }

  if (force) {
    state.enrollments.delete(categoryId);
    invalidateLeaguePaymentsByCategory(categoryId);
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

  const registrationCloseDate = formData.get('registrationCloseDate');
  if (registrationCloseDate) {
    payload.registrationCloseDate = registrationCloseDate;
  } else if (isEditing) {
    payload.registrationCloseDate = null;
  }

  const enrollmentFeeRaw = formData.get('enrollmentFee');
  if (enrollmentFeeRaw !== null && enrollmentFeeRaw !== undefined) {
    const trimmed = String(enrollmentFeeRaw).trim();
    if (trimmed) {
      const fee = Number.parseFloat(trimmed);
      if (!Number.isNaN(fee) && fee >= 0) {
        payload.enrollmentFee = fee;
      }
    } else if (isEditing) {
      payload.enrollmentFee = null;
    }
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

function buildTournamentPayload(form, { isEditing = false } = {}) {
  const formData = new FormData(form);
  const payload = {
    name: (formData.get('name') || '').trim(),
  };

  const description = (formData.get('description') || '').trim();
  if (description) {
    payload.description = description;
  } else if (isEditing) {
    payload.description = null;
  }

  ['startDate', 'endDate', 'registrationCloseDate'].forEach((field) => {
    const value = formData.get(field);
    if (value) {
      payload[field] = value;
    } else if (isEditing) {
      payload[field] = null;
    }
  });

  const poster = (formData.get('poster') || '').trim();
  if (poster) {
    payload.poster = poster;
  } else if (isEditing) {
    payload.poster = null;
  }

  const status = (formData.get('status') || '').trim();
  if (status) {
    payload.status = status;
  }

  const feeEntries = Array.from(form.querySelectorAll('[data-fee-entry]'));
  if (feeEntries.length) {
    const fees = feeEntries
      .map((entry) => {
        const label = entry.querySelector('[data-fee-field="label"]')?.value.trim();
        const amountValue = entry.querySelector('[data-fee-field="amount"]')?.value;
        const amount = Number.parseFloat(amountValue);
        if (!label || Number.isNaN(amount) || amount < 0) {
          return null;
        }
        const currencyRaw = entry.querySelector('[data-fee-field="currency"]')?.value.trim();
        const descriptionValue = entry
          .querySelector('[data-fee-field="description"]')
          ?.value.trim();
        return {
          label,
          amount,
          currency: currencyRaw ? currencyRaw.toUpperCase() : 'EUR',
          description: descriptionValue || undefined,
        };
      })
      .filter(Boolean);
    if (fees.length || isEditing) {
      payload.fees = fees;
    }
  } else if (isEditing) {
    payload.fees = [];
  }

  return payload;
}

async function submitTournamentFormData({ form, tournamentId, statusElement }) {
  if (!form) return { success: false };
  const isEditing = Boolean(tournamentId);
  const payload = buildTournamentPayload(form, { isEditing });

  if (!payload.name) {
    setStatusMessage(statusElement, 'error', 'El nombre del torneo es obligatorio.');
    return { success: false };
  }

  setStatusMessage(
    statusElement,
    'info',
    isEditing ? 'Actualizando torneo...' : 'Creando torneo...'
  );

  try {
    const url = isEditing ? `/tournaments/${tournamentId}` : '/tournaments';
    const method = isEditing ? 'PATCH' : 'POST';
    const result = await request(url, { method, body: payload });
    const createdId = normalizeId(result) || normalizeId(tournamentId);
    await reloadTournaments({ selectTournamentId: createdId });
    if (createdId) {
      state.tournamentDetails.delete(createdId);
      await refreshTournamentDetail(createdId);
    }
    setStatusMessage(
      statusElement,
      'success',
      isEditing ? 'Torneo actualizado.' : 'Torneo creado.'
    );
    return { success: true, tournamentId: createdId };
  } catch (error) {
    setStatusMessage(statusElement, 'error', error.message);
    return { success: false };
  }
}

function openTournamentModal(tournamentId = '') {
  if (!isAdmin()) return;
  const normalizedId = tournamentId ? normalizeId(tournamentId) : '';
  const tournament = normalizedId ? getTournamentById(normalizedId) : null;

  const statusOptions = Object.entries(TOURNAMENT_STATUS_LABELS)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');

  const form = document.createElement('form');
  form.className = 'form';
  form.innerHTML = `
    <label>
      Nombre
      <input type="text" name="name" required />
    </label>
    <label>
      Descripción
      <textarea name="description" rows="3" placeholder="Detalles opcionales"></textarea>
    </label>
    <div class="form-grid">
      <label>
        Fecha de inicio
        <input type="date" name="startDate" />
      </label>
      <label>
        Fecha de finalización
        <input type="date" name="endDate" />
      </label>
    </div>
    <label>
      Cierre de inscripciones
      <input type="date" name="registrationCloseDate" />
      <span class="form-hint">Déjalo vacío si las inscripciones cierran el día de inicio.</span>
    </label>
    <label>
      Estado
      <select name="status" required>
        ${statusOptions}
      </select>
    </label>
    <label>
      Cartel o imagen destacada
      <input type="url" name="poster" placeholder="URL opcional del póster" />
    </label>
    <div class="form-section" data-fees-section>
      <div class="form-section__header">
        <h3>Cuotas de inscripción</h3>
        <button type="button" class="secondary" data-action="add-fee">Añadir cuota</button>
      </div>
      <p class="form-hint">Define importes opcionales para la inscripción del torneo.</p>
      <div data-fee-list></div>
    </div>
    <div class="form-actions">
      <button type="submit" class="primary">${tournament ? 'Actualizar' : 'Crear'} torneo</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
    </div>
  `;

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  const feeList = form.querySelector('[data-fee-list]');
  const addFeeButton = form.querySelector('[data-action="add-fee"]');

  function addFeeEntry(data = {}) {
    if (!feeList) return;
    const entry = document.createElement('div');
    entry.className = 'form-section';
    entry.dataset.feeEntry = 'true';
    entry.innerHTML = `
      <div class="form-grid">
        <label>
          Concepto
          <input type="text" data-fee-field="label" placeholder="Ej. Inscripción individual" />
        </label>
        <label>
          Importe
          <input type="number" min="0" step="0.01" data-fee-field="amount" />
        </label>
        <label>
          Divisa
          <input type="text" maxlength="3" data-fee-field="currency" placeholder="EUR" />
        </label>
      </div>
      <label>
        Notas
        <input type="text" data-fee-field="description" placeholder="Información opcional" />
      </label>
      <div class="form-actions">
        <button type="button" class="ghost" data-action="remove-fee">Quitar cuota</button>
      </div>
    `;

    const removeButton = entry.querySelector('[data-action="remove-fee"]');
    removeButton?.addEventListener('click', () => {
      entry.remove();
    });

    feeList.appendChild(entry);

    const labelField = entry.querySelector('[data-fee-field="label"]');
    const amountField = entry.querySelector('[data-fee-field="amount"]');
    const currencyField = entry.querySelector('[data-fee-field="currency"]');
    const descriptionField = entry.querySelector('[data-fee-field="description"]');

    if (labelField && data.label) {
      labelField.value = data.label;
    }
    if (amountField && typeof data.amount !== 'undefined') {
      amountField.value = data.amount;
    }
    if (currencyField && data.currency) {
      currencyField.value = data.currency;
    }
    if (descriptionField && data.description) {
      descriptionField.value = data.description;
    }
  }

  addFeeButton?.addEventListener('click', () => {
    addFeeEntry();
  });

  if (Array.isArray(tournament?.fees) && tournament.fees.length) {
    tournament.fees.forEach((fee) => addFeeEntry(fee));
  }

  form.elements.name.value = tournament?.name || '';
  form.elements.description.value = tournament?.description || '';
  if (form.elements.startDate) {
    form.elements.startDate.value = formatDateInput(tournament?.startDate);
  }
  if (form.elements.endDate) {
    form.elements.endDate.value = formatDateInput(tournament?.endDate);
  }
  if (form.elements.registrationCloseDate) {
    form.elements.registrationCloseDate.value = formatDateInput(
      tournament?.registrationCloseDate
    );
  }
  if (form.elements.poster) {
    form.elements.poster.value = tournament?.poster || '';
  }
  if (form.elements.status) {
    form.elements.status.value = tournament?.status || 'inscripcion';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await submitTournamentFormData({
      form,
      tournamentId: normalizedId,
      statusElement: status,
    });
    if (result.success) {
      closeModal();
    }
  });

  const cancelButton = form.querySelector('[data-action="cancel"]');
  cancelButton?.addEventListener('click', () => {
    setStatusMessage(status, '', '');
    closeModal();
  });

  openModal({
    title: tournament ? 'Editar torneo' : 'Nuevo torneo',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });
}

function buildTournamentCategoryPayload(form) {
  const formData = new FormData(form);
  const payload = {
    name: (formData.get('name') || '').trim(),
    gender: formData.get('gender') || 'masculino',
  };

  const description = (formData.get('description') || '').trim();
  if (description) {
    payload.description = description;
  }

  const menuTitle = (formData.get('menuTitle') || '').trim();
  if (menuTitle) {
    payload.menuTitle = menuTitle;
  }

  const skillLevel = formData.get('skillLevel');
  if (skillLevel) {
    payload.skillLevel = skillLevel;
  }

  const color = formData.get('color');
  if (color) {
    payload.color = color;
  }

  const drawSizeValue = (formData.get('drawSize') || '').trim();
  if (drawSizeValue) {
    const parsed = Number.parseInt(drawSizeValue, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      payload.drawSize = parsed;
    }
  }

  return payload;
}

async function submitTournamentCategoryForm({ form, tournamentId, statusElement }) {
  if (!form || !tournamentId) return { success: false };

  const payload = buildTournamentCategoryPayload(form);
  if (!payload.name) {
    setStatusMessage(statusElement, 'error', 'El nombre de la categoría es obligatorio.');
    return { success: false };
  }

  if (!payload.gender) {
    setStatusMessage(statusElement, 'error', 'Selecciona el género de la categoría.');
    return { success: false };
  }

  setStatusMessage(statusElement, 'info', 'Creando categoría de torneo...');

  try {
    await request(`/tournaments/${tournamentId}/categories`, { method: 'POST', body: payload });
    await reloadTournaments({ selectTournamentId: tournamentId });
    state.tournamentDetails.delete(tournamentId);
    await refreshTournamentDetail(tournamentId);
    setStatusMessage(statusElement, 'success', 'Categoría creada correctamente.');
    return { success: true };
  } catch (error) {
    setStatusMessage(statusElement, 'error', error.message);
    return { success: false };
  }
}

async function openTournamentCategoryModal(defaultTournamentId = '') {
  if (!isAdmin()) return;
  const tournaments = Array.isArray(state.tournaments) ? [...state.tournaments] : [];
  if (!tournaments.length) {
    showGlobalMessage('Registra un torneo antes de crear categorías.', 'error');
    return;
  }

  const normalizedDefault = defaultTournamentId
    ? normalizeId(defaultTournamentId)
    : normalizeId(state.selectedTournamentCategoriesId || state.selectedTournamentId);

  const form = document.createElement('form');
  form.className = 'form';
  form.innerHTML = `
    <label>
      Torneo
      <select name="tournamentId" required></select>
    </label>
    <label>
      Nombre
      <input type="text" name="name" required />
    </label>
    <label>
      Título corto (opcional)
      <input type="text" name="menuTitle" placeholder="Texto para menús o tarjetas" />
    </label>
    <label>
      Descripción
      <textarea name="description" rows="3" placeholder="Detalles opcionales"></textarea>
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
        <select name="skillLevel">
          <option value="">Sin nivel específico</option>
          ${CATEGORY_SKILL_LEVEL_OPTIONS.map(
            (option) => `<option value="${option.value}">${option.label}</option>`
          ).join('')}
        </select>
      </label>
    </div>
    <label>
      Color identificativo
      <input type="color" name="color" value="${DEFAULT_CATEGORY_COLOR}" />
    </label>
    <label>
      Tamaño de cuadro (opcional)
      <input type="number" name="drawSize" min="0" placeholder="Ej. 16" />
    </label>
    <div class="form-actions">
      <button type="submit" class="primary">Crear categoría</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
    </div>
  `;

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  const tournamentSelect = form.elements.tournamentId;
  tournaments
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
    .forEach((tournament) => {
      const option = document.createElement('option');
      option.value = normalizeId(tournament);
      option.textContent = tournament.name || 'Torneo';
      tournamentSelect.appendChild(option);
    });

  if (
    normalizedDefault &&
    Array.from(tournamentSelect.options).some((option) => option.value === normalizedDefault)
  ) {
    tournamentSelect.value = normalizedDefault;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const tournamentId = tournamentSelect.value;
    if (!tournamentId) {
      setStatusMessage(status, 'error', 'Selecciona un torneo.');
      return;
    }

    const result = await submitTournamentCategoryForm({
      form,
      tournamentId,
      statusElement: status,
    });
    if (result.success) {
      closeModal();
    }
  });

  const cancelButton = form.querySelector('[data-action="cancel"]');
  cancelButton?.addEventListener('click', () => {
    setStatusMessage(status, '', '');
    closeModal();
  });

  openModal({
    title: 'Nueva categoría de torneo',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });
}

async function openTournamentEnrollmentModal() {
  if (!isAdmin()) return;
  const tournaments = Array.isArray(state.tournaments) ? [...state.tournaments] : [];
  if (!tournaments.length) {
    showGlobalMessage('Registra un torneo antes de inscribir jugadores.', 'error');
    return;
  }

  const form = document.createElement('form');
  form.className = 'form';
  form.innerHTML = `
    <label>
      Torneo
      <select name="tournamentId" required></select>
    </label>
    <label>
      Categoría
      <select name="categoryId" required disabled>
        <option value="">Selecciona un torneo</option>
      </select>
    </label>
    <label>
      Jugador
      <select name="playerId" required disabled>
        <option value="">Selecciona una categoría</option>
      </select>
    </label>
    <div class="form-actions">
      <button type="submit" class="primary" disabled>Inscribir jugador</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
    </div>
  `;

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  const tournamentSelect = form.elements.tournamentId;
  const categorySelect = form.elements.categoryId;
  const playerSelect = form.elements.playerId;
  const submitButton = form.querySelector('button[type="submit"]');

  tournaments
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
    .forEach((tournament) => {
      const option = document.createElement('option');
      option.value = normalizeId(tournament);
      option.textContent = tournament.name || 'Torneo';
      tournamentSelect.appendChild(option);
    });

  const preferredTournamentId = normalizeId(
    state.selectedEnrollmentTournamentId || state.selectedTournamentId
  );
  if (
    preferredTournamentId &&
    Array.from(tournamentSelect.options).some((option) => option.value === preferredTournamentId)
  ) {
    tournamentSelect.value = preferredTournamentId;
  }

  async function populateCategories(tournamentId) {
    categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';
    categorySelect.disabled = true;

    if (!tournamentId) {
      playerSelect.innerHTML = '<option value="">Selecciona una categoría</option>';
      playerSelect.disabled = true;
      submitButton.disabled = true;
      return;
    }

    if (!state.tournamentDetails.has(tournamentId)) {
      await refreshTournamentDetail(tournamentId);
    }

    const categories = getTournamentCategories(tournamentId);
    categories
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
      .forEach((category) => {
        const id = normalizeId(category);
        if (!id) return;
        const option = document.createElement('option');
        option.value = id;
        option.textContent = category.menuTitle || category.name || 'Categoría';
        categorySelect.appendChild(option);
      });

    categorySelect.disabled = !categories.length;

    if (categories.length) {
      const preferredCategory = normalizeId(state.selectedEnrollmentCategoryId);
      if (
        preferredCategory &&
        categories.some((category) => normalizeId(category) === preferredCategory)
      ) {
        categorySelect.value = preferredCategory;
      }
    }

    await updatePlayerOptions();
  }

  async function updatePlayerOptions() {
    const tournamentId = tournamentSelect.value;
    const categoryId = categorySelect.value;
    playerSelect.innerHTML = '<option value="">Selecciona un jugador</option>';
    playerSelect.disabled = true;
    submitButton.disabled = true;

    if (!tournamentId || !categoryId) {
      return;
    }

    try {
      await ensurePlayersLoaded();
    } catch (error) {
      return;
    }

    let enrollments = [];
    try {
      enrollments = await fetchTournamentEnrollments(tournamentId, categoryId);
    } catch (error) {
      setStatusMessage(status, 'error', error.message);
      return;
    }

    const enrolledIds = new Set(
      enrollments.map((enrollment) => normalizeId(enrollment.user)).filter(Boolean)
    );

    const availablePlayers = state.players
      .filter((player) => entityHasRole(player, 'player'))
      .filter((player) => !enrolledIds.has(normalizeId(player)))
      .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'es'));

    if (!availablePlayers.length) {
      playerSelect.innerHTML = '<option value="">Sin jugadores disponibles</option>';
      playerSelect.disabled = true;
      submitButton.disabled = true;
      return;
    }

    availablePlayers.forEach((player) => {
      const option = document.createElement('option');
      option.value = normalizeId(player);
      option.textContent = player.fullName || player.email || 'Jugador';
      playerSelect.appendChild(option);
    });

    playerSelect.disabled = false;
    submitButton.disabled = !playerSelect.value;
    setStatusMessage(status, '', '');
  }

  tournamentSelect.addEventListener('change', async (event) => {
    setStatusMessage(status, '', '');
    await populateCategories(event.target.value);
    updateTournamentActionAvailability();
  });

  categorySelect.addEventListener('change', async () => {
    setStatusMessage(status, '', '');
    await updatePlayerOptions();
    updateTournamentActionAvailability();
  });

  playerSelect.addEventListener('change', () => {
    submitButton.disabled = !playerSelect.value;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const tournamentId = tournamentSelect.value;
    const categoryId = categorySelect.value;
    const playerId = playerSelect.value;
    if (!tournamentId || !categoryId || !playerId) {
      setStatusMessage(status, 'error', 'Selecciona torneo, categoría y jugador.');
      return;
    }

    setStatusMessage(status, 'info', 'Inscribiendo jugador...');
    submitButton.disabled = true;

    try {
      await request(`/tournaments/${tournamentId}/categories/${categoryId}/enrollments`, {
        method: 'POST',
        body: { userId: playerId },
      });
      state.tournamentEnrollments.delete(`${tournamentId}:${categoryId}`);
      await fetchTournamentEnrollments(tournamentId, categoryId, { forceReload: true });
      if (state.selectedEnrollmentTournamentId === tournamentId) {
        state.selectedEnrollmentCategoryId = categoryId;
        await refreshTournamentEnrollments({ forceReload: true });
      }
      state.tournamentDetails.delete(tournamentId);
      await refreshTournamentDetail(tournamentId);
      updateTournamentActionAvailability();
      setStatusMessage(status, 'success', 'Jugador inscrito correctamente.');
      closeModal();
    } catch (error) {
      submitButton.disabled = false;
      setStatusMessage(status, 'error', error.message);
    }
  });

  const cancelButton = form.querySelector('[data-action="cancel"]');
  cancelButton?.addEventListener('click', () => {
    setStatusMessage(status, '', '');
    closeModal();
  });

  openModal({
    title: 'Inscribir jugador en torneo',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });

  populateCategories(tournamentSelect.value);
}

async function openTournamentDrawModal() {
  if (!isAdmin()) return;
  const tournaments = Array.isArray(state.tournaments) ? [...state.tournaments] : [];
  if (!tournaments.length) {
    showGlobalMessage('Registra un torneo antes de generar cuadros.', 'error');
    return;
  }

  const defaultTournamentId = normalizeId(
    state.selectedMatchTournamentId || state.selectedTournamentId
  );
  const defaultCategoryId = normalizeId(state.selectedMatchCategoryId);

  const form = document.createElement('form');
  form.className = 'form';
  form.innerHTML = `
    <label>
      Torneo
      <select name="tournamentId" required></select>
    </label>
    <label>
      Categoría
      <select name="categoryId" required disabled>
        <option value="">Selecciona un torneo</option>
      </select>
    </label>
    <fieldset class="form-section" data-match-section>
      <div class="form-section__header">
        <h3>Partidos del cuadro</h3>
        <button type="button" class="secondary" data-action="add-match">Añadir partido</button>
      </div>
      <p class="form-hint" data-match-hint>
        Añade los emparejamientos para iniciar el cuadro del torneo.
      </p>
      <div data-match-list></div>
    </fieldset>
    <label class="checkbox-option">
      <input type="checkbox" name="replaceExisting" value="true" />
      Reemplazar los partidos existentes de esta categoría
    </label>
    <div class="form-actions">
      <button type="submit" class="primary" disabled>Generar cuadro</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
    </div>
  `;

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';

  const tournamentSelect = form.elements.tournamentId;
  const categorySelect = form.elements.categoryId;
  const submitButton = form.querySelector('button[type="submit"]');
  const addMatchButton = form.querySelector('[data-action="add-match"]');
  const matchList = form.querySelector('[data-match-list]');
  const matchHint = form.querySelector('[data-match-hint]');

  tournaments
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
    .forEach((tournament) => {
      const option = document.createElement('option');
      option.value = normalizeId(tournament);
      option.textContent = tournament.name || 'Torneo';
      tournamentSelect.appendChild(option);
    });

  if (
    defaultTournamentId &&
    Array.from(tournamentSelect.options).some((option) => option.value === defaultTournamentId)
  ) {
    tournamentSelect.value = defaultTournamentId;
  }

  let currentEnrollments = [];

  function updateMatchControlsAvailability() {
    const hasPlayers = Array.isArray(currentEnrollments) && currentEnrollments.length >= 2;
    const hasCategory = Boolean(categorySelect.value);
    if (matchHint) {
      if (!hasCategory) {
        matchHint.textContent = 'Selecciona un torneo y categoría para comenzar.';
        matchHint.hidden = false;
      } else if (!hasPlayers) {
        matchHint.textContent =
          'Necesitas al menos dos jugadores inscritos en la categoría para generar el cuadro.';
        matchHint.hidden = false;
      } else {
        matchHint.textContent = 'Define cada partido del cuadro en el orden deseado.';
        matchHint.hidden = true;
      }
    }
    if (addMatchButton) {
      addMatchButton.disabled = !hasPlayers;
    }
    submitButton.disabled = !hasPlayers || !matchList?.children.length;
  }

  function getAvailablePlayers() {
    return currentEnrollments
      .map((enrollment) => enrollment.user)
      .filter(Boolean)
      .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'es'));
  }

  function populatePlayerSelect(select, selectedValue = '') {
    if (!select) return;
    const players = getAvailablePlayers();
    select.innerHTML = '<option value="">Selecciona un jugador</option>';
    players.forEach((player) => {
      const option = document.createElement('option');
      option.value = normalizeId(player);
      option.textContent = player.fullName || player.email || 'Jugador';
      select.appendChild(option);
    });
    if (selectedValue && players.some((player) => normalizeId(player) === selectedValue)) {
      select.value = selectedValue;
    }
  }

  function addMatchEntry(data = {}) {
    if (!matchList) return;
    const entry = document.createElement('div');
    entry.className = 'form-section';
    entry.dataset.matchEntry = 'true';
    entry.innerHTML = `
      <div class="form-grid">
        <label>
          Ronda
          <input type="text" data-match-field="round" placeholder="Ej. Cuartos de final" />
        </label>
        <label>
          Nº de partido
          <input type="number" min="1" step="1" data-match-field="matchNumber" />
        </label>
      </div>
      <div class="form-grid">
        <label>
          Jugador A
          <select data-match-field="playerA" required></select>
        </label>
        <label>
          Jugador B
          <select data-match-field="playerB" required></select>
        </label>
      </div>
      <div class="form-grid">
        <label>
          Fecha y hora (opcional)
          <input type="datetime-local" data-match-field="scheduledAt" step="${CALENDAR_TIME_SLOT_STEP_SECONDS}" />
        </label>
        <label>
          Pista (opcional)
          <input type="text" data-match-field="court" placeholder="Nombre de la pista" />
        </label>
      </div>
      <div class="form-actions">
        <button type="button" class="ghost" data-action="remove-match">Quitar partido</button>
      </div>
    `;

    const removeButton = entry.querySelector('[data-action="remove-match"]');
    removeButton?.addEventListener('click', () => {
      entry.remove();
      updateMatchControlsAvailability();
    });

    matchList.appendChild(entry);

    const roundField = entry.querySelector('[data-match-field="round"]');
    const matchNumberField = entry.querySelector('[data-match-field="matchNumber"]');
    const playerASelect = entry.querySelector('[data-match-field="playerA"]');
    const playerBSelect = entry.querySelector('[data-match-field="playerB"]');
    const scheduledField = entry.querySelector('[data-match-field="scheduledAt"]');
    const courtField = entry.querySelector('[data-match-field="court"]');

    populatePlayerSelect(playerASelect, normalizeId(data.playerA));
    populatePlayerSelect(playerBSelect, normalizeId(data.playerB));

    if (roundField && data.round) {
      roundField.value = data.round;
    }
    if (matchNumberField && typeof data.matchNumber !== 'undefined') {
      matchNumberField.value = data.matchNumber;
    }
    if (scheduledField && data.scheduledAt) {
      scheduledField.value = formatDateTimeLocal(data.scheduledAt);
    }
    if (courtField && data.court) {
      courtField.value = data.court;
    }

    playerASelect?.addEventListener('change', () => {
      updateMatchControlsAvailability();
    });
    playerBSelect?.addEventListener('change', () => {
      updateMatchControlsAvailability();
    });

    updateMatchControlsAvailability();
  }

  async function populateMatchesForCategory(tournamentId, categoryId) {
    if (!categoryId) {
      matchList.innerHTML = '';
      currentEnrollments = [];
      updateMatchControlsAvailability();
      return;
    }

    try {
      currentEnrollments = await fetchTournamentEnrollments(tournamentId, categoryId, {
        forceReload: true,
      });
    } catch (error) {
      setStatusMessage(status, 'error', error.message);
      currentEnrollments = [];
    }

    matchList.innerHTML = '';
    updateMatchControlsAvailability();
  }

  async function populateCategories(tournamentId) {
    categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';
    categorySelect.disabled = true;
    currentEnrollments = [];

    if (!tournamentId) {
      matchList.innerHTML = '';
      updateMatchControlsAvailability();
      return;
    }

    if (!state.tournamentDetails.has(tournamentId)) {
      await refreshTournamentDetail(tournamentId);
    }

    const categories = getTournamentCategories(tournamentId);
    categories
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
      .forEach((category) => {
        const id = normalizeId(category);
        if (!id) return;
        const option = document.createElement('option');
        option.value = id;
        option.textContent = category.menuTitle || category.name || 'Categoría';
        categorySelect.appendChild(option);
      });

    categorySelect.disabled = !categories.length;

    if (categories.length && defaultCategoryId) {
      if (categories.some((category) => normalizeId(category) === defaultCategoryId)) {
        categorySelect.value = defaultCategoryId;
      }
    }

    await populateMatchesForCategory(tournamentId, categorySelect.value);
  }

  addMatchButton?.addEventListener('click', () => {
    addMatchEntry();
  });

  tournamentSelect.addEventListener('change', async (event) => {
    await populateCategories(event.target.value);
    updateTournamentActionAvailability();
  });

  categorySelect.addEventListener('change', async (event) => {
    await populateMatchesForCategory(tournamentSelect.value, event.target.value);
    updateTournamentActionAvailability();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const tournamentId = tournamentSelect.value;
    const categoryId = categorySelect.value;
    if (!tournamentId || !categoryId) {
      setStatusMessage(status, 'error', 'Selecciona torneo y categoría.');
      return;
    }

    const entries = matchList ? Array.from(matchList.querySelectorAll('[data-match-entry]')) : [];
    if (!entries.length) {
      setStatusMessage(status, 'error', 'Añade al menos un partido al cuadro.');
      return;
    }

    const matches = [];
    for (const entry of entries) {
      const round = entry.querySelector('[data-match-field="round"]')?.value.trim();
      const matchNumberValue = entry.querySelector('[data-match-field="matchNumber"]')?.value;
      const playerA = entry.querySelector('[data-match-field="playerA"]')?.value;
      const playerB = entry.querySelector('[data-match-field="playerB"]')?.value;
      const scheduledAt = entry.querySelector('[data-match-field="scheduledAt"]')?.value;
      const court = entry.querySelector('[data-match-field="court"]')?.value.trim();

      if (!playerA || !playerB) {
        setStatusMessage(status, 'error', 'Selecciona ambos jugadores en cada partido.');
        return;
      }

      if (playerA === playerB) {
        setStatusMessage(status, 'error', 'Un partido no puede tener el mismo jugador en ambos lados.');
        return;
      }

      const parsedMatchNumber = Number.parseInt(matchNumberValue, 10);
      matches.push({
        round: round || undefined,
        matchNumber: Number.isNaN(parsedMatchNumber) ? undefined : parsedMatchNumber,
        players: [playerA, playerB],
        scheduledAt: scheduledAt || undefined,
        court: court || undefined,
      });
    }

    const replaceExisting = form.elements.replaceExisting?.checked || false;

    setStatusMessage(status, 'info', 'Generando cuadro...');
    submitButton.disabled = true;

    try {
      await request(`/tournaments/${tournamentId}/categories/${categoryId}/matches/generate`, {
        method: 'POST',
        body: { matches, replaceExisting },
      });
      state.tournamentMatches.delete(`${tournamentId}:${categoryId}`);
      state.tournamentDetails.delete(tournamentId);
      state.selectedMatchTournamentId = tournamentId;
      state.selectedMatchCategoryId = categoryId;
      await refreshTournamentDetail(tournamentId);
      await refreshTournamentMatches({ forceReload: true });
      updateTournamentActionAvailability();
      setStatusMessage(status, 'success', 'Cuadro generado correctamente.');
      closeModal();
    } catch (error) {
      submitButton.disabled = false;
      setStatusMessage(status, 'error', error.message);
    }
  });

  const cancelButton = form.querySelector('[data-action="cancel"]');
  cancelButton?.addEventListener('click', () => {
    setStatusMessage(status, '', '');
    closeModal();
  });

  openModal({
    title: 'Generar cuadro de torneo',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });

  await populateCategories(tournamentSelect.value);
  updateMatchControlsAvailability();
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
    <div class="form-grid">
      <label>
        Cierre de inscripciones
        <input type="date" name="registrationCloseDate" />
        <span class="form-hint">Último día para que los jugadores envíen su inscripción.</span>
      </label>
      <label>
        Tarifa de inscripción
        <input type="number" name="enrollmentFee" min="0" step="0.01" placeholder="0.00" />
        <span class="form-hint">Importe total en euros. Déjalo vacío si la inscripción es gratuita.</span>
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
  if (form.elements.registrationCloseDate) {
    form.elements.registrationCloseDate.value = formatDateInput(league?.registrationCloseDate);
  }
  if (form.elements.enrollmentFee) {
    form.elements.enrollmentFee.value =
      typeof league?.enrollmentFee === 'number' ? String(league.enrollmentFee) : '';
  }

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
    title: player ? 'Editar usuario' : 'Nuevo usuario',
    content: (body) => {
      body.appendChild(form);
      body.appendChild(status);
    },
    onClose: () => setStatusMessage(status, '', ''),
  });
}

function openMatchModal(matchId = '') {
  if (!isAdmin()) return;
  const normalizedId = normalizeId(matchId);
  const match = normalizedId ? findMatchById(normalizedId) : null;

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

function openRulesEditorModal(scope = 'league') {
  if (!isAdmin()) return;

  const club = state.club || {};
  const isTournament = scope === 'tournament';
  const existingContent = getRegulationHtml(
    isTournament ? club.tournamentRegulation : club.regulation
  );

  const description = isTournament
    ? 'Redacta el reglamento de torneos con formato enriquecido (negritas, cursivas, encabezados y listas).'
    : 'Redacta el reglamento de la liga con formato enriquecido (negritas, cursivas, encabezados y listas).';
  const placeholder = isTournament
    ? 'Describe el reglamento de torneos con formato enriquecido'
    : 'Describe el reglamento del club con formato enriquecido';

  const form = document.createElement('form');
  form.className = 'form';
  form.innerHTML = `
    <p class="form-hint">
      ${description}
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
  const editor = createRegulationEditor(existingContent, placeholder);
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

    const payload = isTournament
      ? { tournamentRegulation: content }
      : { regulation: content };

    const savingMessage = isTournament
      ? 'Guardando reglamento de torneos...'
      : 'Guardando reglamento...';
    const successMessage = isTournament
      ? 'Reglamento de torneos actualizado correctamente.'
      : 'Reglamento actualizado correctamente.';
    const toastMessage = isTournament
      ? 'Reglamento de torneos actualizado.'
      : 'Reglamento del club actualizado.';

    setStatusMessage(status, 'info', savingMessage);

    try {
      const updated = await request('/club', { method: 'PUT', body: payload });
      renderClubProfile(updated);
      setStatusMessage(status, 'success', successMessage);
      closeModal();
      showGlobalMessage(toastMessage);
    } catch (error) {
      setStatusMessage(status, 'error', error.message);
    }
  });

  form.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
    setStatusMessage(status, '', '');
    closeModal();
  });

  openModal({
    title: isTournament ? 'Editar reglamento de torneos' : 'Editar reglamento del club',
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

  const normalizedId = normalizeId(matchId);
  const match = findMatchById(normalizedId);

  if (!match || !Array.isArray(match.players) || match.players.length < 2) {
    showGlobalMessage('No fue posible cargar los datos del partido.', 'error');
    return;
  }

  if (!isAdmin() && !isUserMatchParticipant(match)) {
    showGlobalMessage('Solo puedes registrar resultados de tus partidos.', 'error');
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
        invalidateLeaguePaymentsByCategory(categoryId);
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
      invalidateLeaguePaymentsByCategory(categoryId);
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
      invalidateLeaguePaymentsByCategory(categoryId);
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
  updateLeaguePlayersControls();
  updateLeaguePaymentControls();
  if (state.activeSection === 'section-league-payments') {
    refreshLeaguePayments({ force: true }).catch((error) => {
      console.warn('No se pudo actualizar los pagos tras recargar las categorías', error);
    });
  }
  await refreshLeaguePlayers();
  await refreshAllRankings({ forceReload: true });
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

    state.courtAvailabilityDate = new Date(state.courtAvailabilityDate || Date.now());
    state.courtAvailabilityDate.setHours(0, 0, 0, 0);
    state.courtAdminDate = new Date(state.courtAdminDate || Date.now());
    state.courtAdminDate.setHours(0, 0, 0, 0);

    state.enrollments.clear();
    state.enrollmentRequests.clear();
    const [leagues, categories, tournaments] = await Promise.all([
      request('/leagues'),
      request('/categories'),
      request('/tournaments').catch(() => []),
    ]);
    state.leagues = Array.isArray(leagues) ? leagues : [];
    renderLeagues(state.leagues);
    updateLeaguePaymentControls();

    const categoryList = Array.isArray(categories) ? categories : [];
    state.categories = categoryList;
    renderCategories(categoryList);
    updateLeaguePlayersControls();
    updateLeaguePaymentControls();
    await refreshLeaguePlayers();
    await refreshAllRankings({ forceReload: true });

    state.tournaments = Array.isArray(tournaments) ? tournaments : [];
    updateTournamentSelectors();
    if (state.selectedTournamentId) {
      await refreshTournamentDetail(state.selectedTournamentId);
    }
    populateCourtBlockEntities();
    ensureCourtBlockRangeDefaults(state.courtAdminDate);

    await Promise.all([
      loadGlobalOverview(),
      loadLeagueDashboard(),
      loadTournamentDashboard(),
    ]);

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
    resetAllMatchPagination();
    renderMatches(
      state.upcomingMatches,
      upcomingList,
      'No hay partidos programados.',
      { listKey: 'upcoming' }
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
      state.pendingApprovalMatches,
      pendingApprovalsList,
      'No hay resultados pendientes por aprobar.',
      { listKey: 'pending' }
    );
    state.completedMatches = Array.isArray(completedMatches) ? completedMatches : [];
    renderMatches(
      state.completedMatches,
      completedMatchesList,
      'Aún no hay partidos confirmados para mostrar.',
      { listKey: 'completed' }
    );
    renderNotifications(notifications);
    if (clubProfile) {
      renderClubProfile(clubProfile);
      if (!courtReservationDateInput?.value) {
        resetCourtReservationForm();
      }
    }
    populateCourtBlockCourts();
    state.seasons = Array.isArray(seasons) ? seasons : [];
    state.calendarMatches = Array.isArray(calendarMatches) ? calendarMatches : [];
    renderAdminMatchList(state.calendarMatches);
    renderAllCalendars();

    await loadPlayerCourtData();
    if (hasCourtManagementAccess()) {
      await Promise.all([loadAdminCourtData(), loadCourtCalendarData()]);
    } else {
      state.courtAdminSchedule = [];
      state.courtAdminBlocks = [];
      renderCourtAdminSchedule();
      resetCourtCalendarView();
    }

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
          invalidateLeaguePaymentsByCategory(selectedCategory);
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

courtReservationForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.token) {
    setStatusMessage(courtReservationStatus, 'error', 'Debes iniciar sesión para reservar una pista.');
    return;
  }

  const dateValue = courtReservationDateInput?.value || '';
  const timeValue = courtReservationTimeInput?.value || '';
  const startsAt = combineDateAndTime(dateValue, timeValue);
  if (!startsAt) {
    setStatusMessage(courtReservationStatus, 'error', 'Selecciona una fecha y hora válidas.');
    return;
  }

  const courtValue = courtReservationCourtSelect?.value || '';
  if (!courtValue) {
    setStatusMessage(courtReservationStatus, 'error', 'Selecciona una pista disponible.');
    return;
  }

  const durationValue = Number(courtReservationDurationSelect?.value || COURT_RESERVATION_DEFAULT_DURATION);
  const duration = Number.isFinite(durationValue) && durationValue > 0 ? durationValue : COURT_RESERVATION_DEFAULT_DURATION;
  const notes = courtReservationNotesInput?.value?.trim();

  const payload = {
    court: courtValue,
    startsAt: startsAt.toISOString(),
    durationMinutes: duration,
  };

  if (notes) {
    payload.notes = notes;
  }

  setStatusMessage(courtReservationStatus, 'info', 'Creando reserva...');
  if (courtReservationSubmit) {
    courtReservationSubmit.disabled = true;
  }

  try {
    await request('/courts/reservations', { method: 'POST', body: payload });
    setStatusMessage(courtReservationStatus, 'success', 'Reserva creada correctamente.');
    resetCourtReservationForm();
    await loadPlayerCourtData();
    if (isAdmin()) {
      await loadAdminCourtData();
    }
  } catch (error) {
    setStatusMessage(courtReservationStatus, 'error', error.message);
  } finally {
    if (courtReservationSubmit) {
      courtReservationSubmit.disabled = false;
    }
  }
});

courtReservationList?.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action="cancel-reservation"]');
  if (!button) {
    return;
  }

  const { reservationId } = button.dataset;
  if (!reservationId) {
    return;
  }

  await cancelCourtReservation(reservationId, { button });
});

courtAvailabilityDateInput?.addEventListener('change', async (event) => {
  const value = event.target.value;
  if (!value) {
    state.courtAvailabilityDate = new Date();
    state.courtAvailabilityDate.setHours(0, 0, 0, 0);
  } else {
    const nextDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(nextDate.getTime())) {
      return;
    }
    state.courtAvailabilityDate = nextDate;
  }
  await refreshCourtAvailability('player');
});

courtAdminDateInput?.addEventListener('change', async (event) => {
  const value = event.target.value;
  if (!value) {
    state.courtAdminDate = new Date();
    state.courtAdminDate.setHours(0, 0, 0, 0);
  } else {
    const nextDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(nextDate.getTime())) {
      return;
    }
    state.courtAdminDate = nextDate;
  }
  await refreshCourtAvailability('admin');
});

courtAdminSchedule?.addEventListener('click', async (event) => {
  const cancelButton = event.target.closest('button[data-action="cancel-reservation"]');
  if (cancelButton) {
    const { reservationId } = cancelButton.dataset;
    if (reservationId) {
      await cancelCourtReservation(reservationId, { button: cancelButton });
    }
    return;
  }

  const blockButton = event.target.closest('button[data-action="delete-block"]');
  if (blockButton) {
    const { blockId } = blockButton.dataset;
    if (blockId) {
      await deleteCourtBlock(blockId, { button: blockButton });
    }
  }
});

courtBlocksList?.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action="delete-block"]');
  if (!button) {
    return;
  }

  const { blockId } = button.dataset;
  if (!blockId) {
    return;
  }

  await deleteCourtBlock(blockId, { button });
});

courtCalendarPrev?.addEventListener('click', async () => {
  const reference = state.courtCalendarDate instanceof Date ? state.courtCalendarDate : new Date();
  state.courtCalendarDate = addMonths(reference, -1);
  await loadCourtCalendarData();
});

courtCalendarNext?.addEventListener('click', async () => {
  const reference = state.courtCalendarDate instanceof Date ? state.courtCalendarDate : new Date();
  state.courtCalendarDate = addMonths(reference, 1);
  await loadCourtCalendarData();
});

courtCalendarContainer?.addEventListener('click', (event) => {
  if (event.target.closest('.calendar-event')) {
    return;
  }

  const day = event.target.closest('[data-calendar-date]');
  if (!day) {
    return;
  }

  const { calendarDate } = day.dataset;
  if (!calendarDate) {
    return;
  }

  handleCourtCalendarDaySelection(calendarDate).catch(() => {});
});

courtCalendarContainer?.addEventListener('keydown', (event) => {
  if (event.target.closest('.calendar-event')) {
    return;
  }

  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  const day = event.target.closest('[data-calendar-date]');
  if (!day) {
    return;
  }

  event.preventDefault();
  const { calendarDate } = day.dataset;
  if (!calendarDate) {
    return;
  }
  handleCourtCalendarDaySelection(calendarDate).catch(() => {});
});

courtBlockContextSelect?.addEventListener('change', () => {
  populateCourtBlockEntities();
});

courtBlockForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!hasCourtManagementAccess()) {
    showGlobalMessage('No tienes permisos para crear bloqueos de pistas.', 'error');
    return;
  }

  const formData = new FormData(courtBlockForm);
  const payload = {
    contextType: formData.get('contextType'),
    contextId: formData.get('contextId'),
    startsAt: formData.get('startsAt'),
    endsAt: formData.get('endsAt'),
  };

  const notesValue = (formData.get('notes') || '').toString().trim();
  if (notesValue) {
    payload.notes = notesValue;
  }

  if (!payload.contextType || !payload.contextId) {
    setStatusMessage(courtBlockStatus, 'error', 'Selecciona la competición asociada al bloqueo.');
    return;
  }

  if (!payload.startsAt || !payload.endsAt) {
    setStatusMessage(courtBlockStatus, 'error', 'Debes indicar la fecha de inicio y fin del bloqueo.');
    return;
  }

  const courts = formData.getAll('courts').filter((value) => typeof value === 'string' && value.trim().length);
  if (courts.length) {
    payload.courts = courts;
  }

  if (courtBlockStatus) {
    setStatusMessage(courtBlockStatus, 'info', 'Guardando bloqueo de pistas...');
  }
  if (courtBlockSubmit) {
    courtBlockSubmit.disabled = true;
  }

  try {
    await request('/courts/blocks', { method: 'POST', body: payload });
    setStatusMessage(courtBlockStatus, 'success', 'Bloqueo registrado correctamente.');

    const baseDate = payload.startsAt ? new Date(payload.startsAt) : state.courtAdminDate;
    courtBlockForm.reset();
    if (courtBlockContextSelect) {
      courtBlockContextSelect.value = payload.contextType || 'league';
    }
    populateCourtBlockEntities();
    if (courtBlockEntitySelect && payload.contextId) {
      courtBlockEntitySelect.value = payload.contextId;
    }
    populateCourtBlockCourts();
    if (baseDate) {
      setCourtBlockDefaultRange(baseDate);
    } else {
      setCourtBlockDefaultRange();
    }

    await Promise.all([loadAdminCourtData(), loadCourtCalendarData()]);
  } catch (error) {
    setStatusMessage(courtBlockStatus, 'error', error.message);
  } finally {
    if (courtBlockSubmit) {
      courtBlockSubmit.disabled = false;
    }
  }
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
  openRankingPrintModal();
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

leagueRulesEditButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  openRulesEditorModal('league');
});

tournamentRulesEditButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  openRulesEditorModal('tournament');
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
    state.rankingsByCategory.clear();
    state.rankingsLoading = false;
    state.notifications = [];
    state.notificationBase = null;
    state.pendingEnrollmentRequestCount = 0;
    state.calendarDate = new Date();
    state.globalCalendarDate = new Date();
    state.matchPagination = { upcoming: {}, pending: {}, completed: {} };
    clearSession();
    updateNotificationCounts([]);
    updateAuthUI();
    showGlobalMessage('Sesión cerrada correctamente.');
    checkSetupStatus();
  });
});

tournamentsList?.addEventListener('click', async (event) => {
  const button = event.target.closest('.list-item-button[data-tournament-id]');
  if (!button) return;

  const tournamentId = normalizeId(button.dataset.tournamentId);
  const previous = state.selectedTournamentId;
  state.selectedTournamentId = tournamentId;

  if (!state.selectedTournamentCategoriesId || state.selectedTournamentCategoriesId === previous) {
    state.selectedTournamentCategoriesId = tournamentId;
  }

  if (!state.selectedEnrollmentTournamentId || state.selectedEnrollmentTournamentId === previous) {
    state.selectedEnrollmentTournamentId = tournamentId;
    state.selectedEnrollmentCategoryId = '';
  }

  if (!state.selectedMatchTournamentId || state.selectedMatchTournamentId === previous) {
    state.selectedMatchTournamentId = tournamentId;
    state.selectedMatchCategoryId = '';
  }

  updateTournamentSelectors();
  if (tournamentId) {
    await refreshTournamentDetail(tournamentId);
  }
});

tournamentCategoryTournamentSelect?.addEventListener('change', async (event) => {
  const value = event.target.value || '';
  state.selectedTournamentCategoriesId = value;
  if (value && !state.tournamentDetails.has(value)) {
    renderTournamentCategories({ loading: true });
    await refreshTournamentDetail(value);
  } else {
    renderTournamentCategories();
  }
});

tournamentEnrollmentTournamentSelect?.addEventListener('change', async (event) => {
  const value = event.target.value || '';
  state.selectedEnrollmentTournamentId = value;
  state.selectedEnrollmentCategoryId = '';
  updateEnrollmentCategoryOptions();
  if (value && !state.tournamentDetails.has(value)) {
    await refreshTournamentDetail(value);
  }
  updateTournamentActionAvailability();
});

tournamentEnrollmentCategorySelect?.addEventListener('change', async (event) => {
  const value = event.target.value || '';
  state.selectedEnrollmentCategoryId = value;
  if (value) {
    await refreshTournamentEnrollments();
  } else {
    renderTournamentEnrollments([], { loading: false });
  }
  updateTournamentActionAvailability();
});

tournamentDetailBody?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-tournament-action]');
  if (!button) return;

  const { tournamentAction, tournamentId, categoryId } = button.dataset;
  if (tournamentAction === 'request-enrollment') {
    openTournamentSelfEnrollmentModal({
      tournamentId: tournamentId || state.selectedTournamentId,
      categoryId: categoryId || '',
    });
  }
});

tournamentMatchTournamentSelect?.addEventListener('change', async (event) => {
  const value = event.target.value || '';
  state.selectedMatchTournamentId = value;
  state.selectedMatchCategoryId = '';
  updateMatchCategoryOptions();
  if (value && !state.tournamentDetails.has(value)) {
    await refreshTournamentDetail(value);
  }
  updateTournamentActionAvailability();
});

tournamentMatchCategorySelect?.addEventListener('change', async (event) => {
  const value = event.target.value || '';
  state.selectedMatchCategoryId = value;
  if (value) {
    await refreshTournamentMatches();
  } else {
    renderTournamentMatches([], { loading: false });
  }
  updateTournamentActionAvailability();
});

notificationsList?.addEventListener('click', async (event) => {
  const tournamentButton = event.target.closest('button[data-review-tournament]');
  if (tournamentButton) {
    const { reviewTournament, reviewTournamentCategory } = tournamentButton.dataset;
    if (reviewTournament) {
      const tournamentId = reviewTournament;
      const categoryId = reviewTournamentCategory || '';
      state.selectedTournamentId = tournamentId;
      state.selectedTournamentCategoriesId = tournamentId;
      state.selectedEnrollmentTournamentId = tournamentId;
      state.selectedMatchTournamentId = tournamentId;
      state.selectedEnrollmentCategoryId = categoryId;
      updateTournamentSelectors();
      await refreshTournamentDetail(tournamentId);
      if (categoryId) {
        await refreshTournamentEnrollments({ forceReload: true });
      } else {
        renderTournamentEnrollments([], { loading: false });
      }
      showSection('section-tournament-enrollments');
    }
    return;
  }

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
    await loadLeagueDashboard();
    await loadGlobalOverview();
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
    invalidateLeaguePaymentsByCategory(categoryId);
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
    invalidateLeaguePaymentsByCategory(categoryId);
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
    invalidateLeaguePaymentsByCategory(categoryId);
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

leaguePlayersLeagueSelect?.addEventListener('change', async (event) => {
  const value = event.target.value || '';
  const filters = ensureLeaguePlayerFilters();
  filters.league = value;
  filters.category = '';
  filters.search = '';
  filters.gender = '';
  updateLeaguePlayersControls();
  await refreshLeaguePlayers();
});

leaguePlayersCategorySelect?.addEventListener('change', async (event) => {
  const value = event.target.value || '';
  const filters = ensureLeaguePlayerFilters();
  filters.category = value;
  await refreshLeaguePlayers();
});

leaguePlayersSearch?.addEventListener('input', (event) => {
  const filters = ensureLeaguePlayerFilters();
  filters.search = (event.target.value || '').trim();
  refreshLeaguePlayers().catch((error) => {
    console.warn('No se pudo actualizar el listado de jugadores de liga', error);
  });
});

leaguePlayersGender?.addEventListener('change', (event) => {
  const filters = ensureLeaguePlayerFilters();
  filters.gender = event.target.value || '';
  refreshLeaguePlayers().catch((error) => {
    console.warn('No se pudo actualizar el listado de jugadores de liga', error);
  });
});

leaguePaymentsLeagueSelect?.addEventListener('change', async (event) => {
  const value = event.target.value || '';
  const filters = ensureLeaguePaymentFilters();
  const previousLeague = filters.league || '';
  filters.league = value;
  if (value !== previousLeague) {
    filters.status = '';
    filters.search = '';
  }
  updateLeaguePaymentControls();
  try {
    await refreshLeaguePayments({ force: value !== previousLeague });
  } catch (error) {
    console.warn('No se pudo actualizar los pagos de liga tras cambiar la liga seleccionada', error);
  }
});

leaguePaymentsStatusSelect?.addEventListener('change', async (event) => {
  const filters = ensureLeaguePaymentFilters();
  filters.status = event.target.value || '';
  try {
    await refreshLeaguePayments();
  } catch (error) {
    console.warn('No se pudo actualizar los pagos de liga al filtrar por estado', error);
  }
});

leaguePaymentsSearchInput?.addEventListener('input', (event) => {
  const filters = ensureLeaguePaymentFilters();
  filters.search = (event.target.value || '').trim();
  refreshLeaguePayments().catch((error) => {
    console.warn('No se pudo actualizar los pagos de liga al filtrar por búsqueda', error);
  });
});

leaguePaymentsList?.addEventListener('submit', (event) => {
  const form = event.target.closest('form[data-league-payment-form="true"]');
  if (!form) {
    return;
  }
  event.preventDefault();
  handleLeaguePaymentFormSubmit(form).catch((error) => {
    console.warn('No se pudo registrar o actualizar el pago de la liga seleccionada', error);
  });
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

  const { action } = button.dataset;
  if (action === 'paginate') {
    event.preventDefault();
    handleMatchPagination(button.dataset);
    return;
  }

  const { matchId } = button.dataset;
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

  const { action } = button.dataset;
  if (action === 'paginate') {
    event.preventDefault();
    handleMatchPagination(button.dataset);
    return;
  }

  const { matchId } = button.dataset;
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

  const { action } = button.dataset;
  if (action === 'paginate') {
    event.preventDefault();
    handleMatchPagination(button.dataset);
    return;
  }

  const { matchId } = button.dataset;
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

tournamentCreateButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  openTournamentModal();
});

tournamentEditButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  const tournamentId = state.selectedTournamentId;
  if (!tournamentId) {
    return;
  }
  openTournamentModal(tournamentId);
});

tournamentCategoryCreateButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  const preferred = state.selectedTournamentCategoriesId || state.selectedTournamentId || '';
  openTournamentCategoryModal(preferred);
});

tournamentEnrollmentAddButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  openTournamentEnrollmentModal();
});

tournamentDrawGenerateButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  openTournamentDrawModal();
});

playerCreateButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  openPlayerModal();
});

matchGenerateButton?.addEventListener('click', () => {
  if (!isAdmin()) return;
  const defaultCategory =
    state.selectedCategoryId || normalizeId(state.categories[0]) || '';
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
