export const API_BASE = '/app/api';
export const APP_BRAND_NAME = 'C.N. Playa San Marcos';
export const APP_BRAND_SLOGAN = 'Liga social de tenis';
export const STORAGE_PREFIX = 'cn-playa-san-marcos';
export const STORAGE_KEY = `${STORAGE_PREFIX}-app-session`;
export const REMEMBER_CREDENTIALS_KEY = `${STORAGE_PREFIX}-remember-credentials`;
export const NOTICE_LAST_SEEN_PREFIX = `${STORAGE_PREFIX}-notices-last-seen:`;
export const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
export const MAX_POSTER_SIZE = 5 * 1024 * 1024;
export const MAX_NOTICE_ATTACHMENT_SIZE = 3 * 1024 * 1024;
export const MAX_NOTICE_ATTACHMENTS = 5;
export const MAX_INLINE_NOTICE_IMAGE_SIZE = MAX_NOTICE_ATTACHMENT_SIZE;
export const MAX_TOTAL_INLINE_NOTICE_IMAGE_SIZE =
  MAX_INLINE_NOTICE_IMAGE_SIZE * 2;
export const MAX_NOTICE_RICH_CONTENT_LENGTH = 12000;
export const MAX_NOTICE_RICH_CONTENT_WITH_IMAGES = 600000;
export const NOTICE_INLINE_IMAGE_DATA_URL_PATTERN =
  /^data:image\/[a-z0-9.+-]+;base64,/i;
export const NOTICE_INLINE_IMAGE_SRC_REGEX =
  /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
export const COURT_RESERVATION_DEFAULT_DURATION = 75;
export const CALENDAR_TIME_SLOT_MINUTES = COURT_RESERVATION_DEFAULT_DURATION;
export const CALENDAR_TIME_SLOT_STEP_SECONDS = CALENDAR_TIME_SLOT_MINUTES * 60;
export const COURT_RESERVATION_FIRST_SLOT_MINUTE = 8 * 60 + 30;
export const COURT_RESERVATION_LAST_SLOT_END_MINUTE = 22 * 60 + 15;

export const SCHEDULE_LABELS = {
  manana: 'Mañana',
  tarde: 'Tarde',
  noche: 'Noche',
  fin_de_semana: 'Fin de semana',
  flexible: 'Flexible',
};

export const WEEKDAY_OPTIONS = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

export const WEEKDAY_LABEL_BY_VALUE = WEEKDAY_OPTIONS.reduce((map, option) => {
  map[option.value] = option.label;
  return map;
}, {});

export const STATUS_LABELS = {
  pendiente: 'Pendiente',
  propuesto: 'Propuesto',
  programado: 'Programado',
  revision: 'Resultado pendiente',
  completado: 'Completado',
  caducado: 'Caducado',
};

export const CALENDAR_MATCH_STATUSES = [
  'pendiente',
  'propuesto',
  'programado',
  'revision',
  'completado',
  'finalizado',
];

export const MATCH_EXPIRATION_DAYS = 15;
export const MATCHES_PER_PAGE = 10;
export const LEAGUE_ENROLLED_PAGE_SIZE = 10;
export const MATCH_CALENDAR_DEFAULT_DURATION_MINUTES = 90;
export const UNCATEGORIZED_CATEGORY_KEY = '__uncategorized__';
export const UNCATEGORIZED_CATEGORY_LABEL = 'Sin categoría';
export const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const TOURNAMENT_BRACKET_SIZES = [8, 16, 32];
export const TOURNAMENT_CATEGORY_DRAW_SIZE_OPTIONS = [8, 16, 32];
export const TOURNAMENT_BRACKET_REPLACEMENT_CONFIRMATION =
  'El cuadro actual desaparecerá y se generará uno nuevo. ¿Deseas continuar?';
export const TOURNAMENT_BRACKET_REPLACEMENT_TOOLTIP =
  'Generar un nuevo cuadro reemplazará el actual.';
export const TOURNAMENT_BRACKET_RESULTS_REPLACEMENT_CONFIRMATION =
  'El cuadro actual tiene resultados registrados. Generar un nuevo cuadro eliminará los resultados anteriores. ¿Deseas continuar?';
export const TOURNAMENT_BRACKET_RESULTS_REPLACEMENT_TOOLTIP =
  'Generar un nuevo cuadro eliminará los resultados registrados en esta categoría.';

export const PUSH_SUPPORTED =
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export const CATEGORY_STATUS_LABELS = {
  inscripcion: 'Inscripción abierta',
  en_curso: 'En curso',
};

export const CATEGORY_SKILL_LEVEL_OPTIONS = [
  { value: 'Iniciación', label: 'Iniciación' },
  { value: 'Intermedio', label: 'Intermedio' },
  { value: 'Avanzado', label: 'Avanzado' },
];

export const DEFAULT_CATEGORY_MATCH_FORMAT = 'two_sets_six_games_super_tb';
export const CATEGORY_MATCH_FORMAT_OPTIONS = [
  {
    value: 'two_sets_six_games_super_tb',
    label: '2 sets a 6 juegos + super tie-break',
  },
  {
    value: 'two_sets_four_games_super_tb',
    label: '2 sets a 4 juegos + super tie-break',
  },
  {
    value: 'single_set_ten_games_super_tb',
    label: '1 set a 10 juegos + super tie-break',
  },
];

export const TOURNAMENT_MATCH_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'dobles', label: 'Dobles' },
];

export const TOURNAMENT_MATCH_TYPE_LABELS = TOURNAMENT_MATCH_TYPE_OPTIONS.reduce(
  (map, option) => {
    map[option.value] = option.label;
    return map;
  },
  {},
);

export const MATCH_FORMAT_LABELS = CATEGORY_MATCH_FORMAT_OPTIONS.reduce(
  (map, option) => {
    map[option.value] = option.label;
    return map;
  },
  {},
);

export const MATCH_FORMAT_METADATA = {
  two_sets_six_games_super_tb: {
    label: '2 sets a 6 juegos + super tie-break',
    description:
      'Formato de partido: 2 sets a 6 juegos + super tie-break (el super tie-break se juega a 10 puntos).',
    minimumSets: 2,
    setDefinitions: [
      { number: 1, tieBreak: false, label: 'Set 1' },
      { number: 2, tieBreak: false, label: 'Set 2' },
      { number: 3, tieBreak: true, label: 'Super tie-break (10 puntos)' },
    ],
  },
  two_sets_four_games_super_tb: {
    label: '2 sets a 4 juegos + super tie-break',
    description:
      'Formato de partido: 2 sets a 4 juegos + super tie-break (el super tie-break se juega a 10 puntos).',
    minimumSets: 2,
    setDefinitions: [
      { number: 1, tieBreak: false, label: 'Set 1' },
      { number: 2, tieBreak: false, label: 'Set 2' },
      { number: 3, tieBreak: true, label: 'Super tie-break (10 puntos)' },
    ],
  },
  single_set_ten_games_super_tb: {
    label: '1 set a 10 juegos + super tie-break',
    description:
      'Formato de partido: 1 set a 10 juegos + super tie-break (a 10 puntos).',
    minimumSets: 1,
    setDefinitions: [
      { number: 1, tieBreak: false, label: 'Set 1' },
      { number: 2, tieBreak: true, label: 'Super tie-break (10 puntos)' },
    ],
  },
};

export const LEAGUE_STATUS_LABELS = {
  activa: 'Activa',
  cerrada: 'Cerrada',
};

export const TOURNAMENT_STATUS_LABELS = {
  inscripcion: 'Inscripción abierta',
  en_juego: 'En juego',
  finalizado: 'Finalizado',
};

export const TOURNAMENT_CATEGORY_STATUS_LABELS = {
  inscripcion: 'Inscripción abierta',
  cuadros: 'Cuadros definidos',
  en_juego: 'En juego',
  finalizado: 'Finalizado',
};

export const TOURNAMENT_ENROLLMENT_STATUS_LABELS = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
};

export const TOURNAMENT_ENROLLMENT_ALL_OPTION = '__all__';

export const TOURNAMENT_MATCH_STATUS_LABELS = {
  pendiente: 'Pendiente',
  programado: 'Programado',
  confirmado: 'Confirmado',
  rechazado: 'Rechazado',
  completado: 'Completado',
};

export const TOURNAMENT_RESULT_STATUS_LABELS = {
  sin_resultado: 'Sin resultado',
  pendiente_admin: 'Pendiente de validación',
  revision_requerida: 'Revisión requerida',
  confirmado: 'Confirmado',
};

export const DEFAULT_RULE_SECTIONS = [
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
      'Bloques nocturnos: 19:00 – 22:15 · Iluminación LED en todas las pistas rápidas.',
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

export const MOVEMENT_ICON_PATHS = {
  up: 'M12 7l4 4h-3v6h-2v-6H8l4-4z',
  down: 'M12 17l-4-4h3V7h2v6h3l-4 4z',
  same: 'M8 11h8v2H8z',
  new: 'M12 7v4h4v2h-4v4h-2v-4H6v-2h4V7z',
};

export const MOVEMENT_STYLES = {
  up: { color: '#2563eb', background: '#dbeafe' },
  down: { color: '#dc2626', background: '#fee2e2' },
  same: { color: '#475569', background: '#e2e8f0' },
  new: { color: '#0f766e', background: '#ccfbf1' },
};

export const CATEGORY_COLOR_PALETTE = Object.freeze([
  '#2563EB',
  '#9333EA',
  '#F97316',
  '#059669',
]);
export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLOR_PALETTE[0];
export const HEX_COLOR_INPUT_REGEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const PAYMENT_STATUS_LABELS = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  exento: 'Exento',
  fallido: 'Fallido',
};

export const LEAGUE_PAYMENT_METHOD_OPTIONS = ['Transferencia', 'Tarjeta', 'Efectivo'];
export const PAYMENT_STATUS_ORDER = {
  pendiente: 0,
  pagado: 1,
  exento: 2,
  fallido: 3,
};
export const DEFAULT_LEAGUE_CURRENCY = 'EUR';
export const TOURNAMENT_PAYMENT_METHOD_OPTIONS = LEAGUE_PAYMENT_METHOD_OPTIONS;
export const DEFAULT_TOURNAMENT_CURRENCY = 'EUR';
