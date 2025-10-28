import {
  API_BASE,
  APP_BRAND_NAME,
  APP_BRAND_SLOGAN,
  STORAGE_PREFIX,
  STORAGE_KEY,
  REMEMBER_CREDENTIALS_KEY,
  NOTICE_LAST_SEEN_PREFIX,
  MAX_PHOTO_SIZE,
  MAX_POSTER_SIZE,
  MAX_NOTICE_ATTACHMENT_SIZE,
  MAX_NOTICE_ATTACHMENTS,
  MAX_INLINE_NOTICE_IMAGE_SIZE,
  MAX_TOTAL_INLINE_NOTICE_IMAGE_SIZE,
  MAX_NOTICE_RICH_CONTENT_LENGTH,
  MAX_NOTICE_RICH_CONTENT_WITH_IMAGES,
  NOTICE_INLINE_IMAGE_DATA_URL_PATTERN,
  NOTICE_INLINE_IMAGE_SRC_REGEX,
  COURT_RESERVATION_DEFAULT_DURATION,
  CALENDAR_TIME_SLOT_MINUTES,
  CALENDAR_TIME_SLOT_STEP_SECONDS,
  COURT_RESERVATION_FIRST_SLOT_MINUTE,
  COURT_RESERVATION_LAST_SLOT_END_MINUTE,
  SCHEDULE_LABELS,
  WEEKDAY_OPTIONS,
  WEEKDAY_LABEL_BY_VALUE,
  STATUS_LABELS,
  CALENDAR_MATCH_STATUSES,
  MATCH_EXPIRATION_DAYS,
  MATCHES_PER_PAGE,
  LEAGUE_ENROLLED_PAGE_SIZE,
  MATCH_CALENDAR_DEFAULT_DURATION_MINUTES,
  UNCATEGORIZED_CATEGORY_KEY,
  UNCATEGORIZED_CATEGORY_LABEL,
  DAY_IN_MS,
  TOURNAMENT_BRACKET_SIZES,
  TOURNAMENT_CATEGORY_DRAW_SIZE_OPTIONS,
  TOURNAMENT_BRACKET_REPLACEMENT_CONFIRMATION,
  TOURNAMENT_BRACKET_REPLACEMENT_TOOLTIP,
  TOURNAMENT_BRACKET_RESULTS_REPLACEMENT_CONFIRMATION,
  TOURNAMENT_BRACKET_RESULTS_REPLACEMENT_TOOLTIP,
  PUSH_SUPPORTED,
  CATEGORY_STATUS_LABELS,
  CATEGORY_SKILL_LEVEL_OPTIONS,
  DEFAULT_CATEGORY_MATCH_FORMAT,
  CATEGORY_MATCH_FORMAT_OPTIONS,
  TOURNAMENT_MATCH_TYPE_OPTIONS,
  TOURNAMENT_MATCH_TYPE_LABELS,
  MATCH_FORMAT_LABELS,
  MATCH_FORMAT_METADATA,
  LEAGUE_STATUS_LABELS,
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_CATEGORY_STATUS_LABELS,
  TOURNAMENT_ENROLLMENT_STATUS_LABELS,
  TOURNAMENT_ENROLLMENT_ALL_OPTION,
  TOURNAMENT_MATCH_STATUS_LABELS,
  TOURNAMENT_RESULT_STATUS_LABELS,
  DEFAULT_RULE_SECTIONS,
  MOVEMENT_ICON_PATHS,
  MOVEMENT_STYLES,
  CATEGORY_COLOR_PALETTE,
  DEFAULT_CATEGORY_COLOR,
  HEX_COLOR_INPUT_REGEX,
  PAYMENT_STATUS_LABELS,
  LEAGUE_PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_ORDER,
  DEFAULT_LEAGUE_CURRENCY,
  TOURNAMENT_PAYMENT_METHOD_OPTIONS,
  DEFAULT_TOURNAMENT_CURRENCY,
} from './config/constants.js';
import {
  formatCurrencyValue,
  formatCurrencyDisplay,
  translateGender,
  translateSchedule,
  translateRole,
  formatSkillLevelLabel,
  formatRoles,
  hexToRgb,
  hexToRgba,
  resolveCategoryColor,
  getCategoryColor,
} from './utils/format.js';
import { normalizeHexColor, isValidHexColor } from './utils/validation.js';
import {
  formatDate,
  formatShortDate,
  formatTime,
  formatTimeRangeLabel,
  formatDateOnly,
  formatMonthLabel,
  formatDayLabel,
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  addMinutes,
  addDays,
  addMonths,
  formatDateInput,
  roundDateToInterval,
  roundDateUpToInterval,
  formatDateTimeLocal,
  formatTimeInputValue,
  combineDateAndTime,
  formatDateRangeLabel,
  getMatchExpirationDate,
  formatExpirationDeadline,
  formatChatTimestamp,
} from './utils/date.js';
import {
  createDomUtils,
  applyCategoryColorStyles,
  applyCategoryTagColor,
  createCategoryColorIndicator,
  renderCategoryColorField,
  extractPhotoFromForm,
} from './utils/dom.js';
import { sanitizeNoticeHtml } from './utils/sanitize.js';
import {
  DEFAULT_APP_BASE_PATH,
  resolveAppBasePath,
  setAppBasePath,
  normalizeHistoryPath,
  normalizeAppPath,
  getSectionIdFromPath,
  buildPathFromSection,
  syncSectionRoute,
} from './config/routes.js';
import { createAppState } from './core/state.js';
import { createAuthModule } from './core/auth.js';
import { createApiClient } from './core/api.js';
setAppBasePath(APP_BASE_PATH);
const state = createAppState({
});

const {
  entityHasRole,
  isAdmin,
  isCourtManager,
  hasCourtManagementAccess,
  persistSession,
  clearSession,
  restoreSession,
  persistRememberedCredentials,
  clearRememberedCredentials,
  getRememberedCredentials,
} = createAuthModule({ state });

function handleUnauthorized() {
  clearSession();
  state.token = null;
  state.user = null;
  updateAuthUI();
}

const { request } = createApiClient({
  state,
  apiBase: API_BASE,
  onUnauthorized: handleUnauthorized,
});
const {
  setStatusMessage,
  showGlobalMessage,
  openModal,
  closeModal,
  openConfirmationDialog,
  applyRichTextCommand,
} = createDomUtils({
  globalMessage,
  modalOverlay,
  modalBody,
  modalTitle,
});

function formatTournamentMatchFormat(value) {
  if (!value) return '';
  return MATCH_FORMAT_LABELS[value] || value;
  const stored = getRememberedCredentials();
  if (!stored) {
  const savedEmail = typeof stored.email === 'string' ? stored.email : '';
  const savedPassword = typeof stored.password === 'string' ? stored.password : '';
  loginEmailInput.value = savedEmail;
  loginPasswordInput.value = savedPassword;
  loginRememberCheckbox.checked = Boolean(savedEmail || savedPassword);
