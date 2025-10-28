import { createCalendarEventsModule } from './features/calendar/events.js';
import { createCalendarModule } from './features/calendar/calendar.js';
import { createChatModule } from './features/chat/chat.js';
import { createCourtsModule } from './features/courts/courts.js';
import { createLeaguesModule } from './features/leagues/leagues.js';
import { createLeagueCategoriesModule } from './features/leagues/categories.js';
import { createLeagueRankingsModule } from './features/leagues/rankings.js';
import { createMatchesModule } from './features/matches/matches.js';
import { createMatchProposalsModule } from './features/matches/proposals.js';
import { createNotificationsModule } from './features/notifications/notifications.js';
import { createPushModule } from './features/notifications/push.js';
import { createTournamentsModule } from './features/tournaments/tournaments.js';
import { createLeaguePaymentsModule } from './features/payments/league-payments.js';
import { createProfileModule } from './features/profile/profile.js';
import { createProfileSettingsModule } from './features/profile/settings.js';
import { createFormComponents } from './components/forms.js';
import { createAppState } from './core/state.js';
import { createAuthModule } from './core/auth.js';
import { createApiClient } from './core/api.js';
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
  formatCurrencyValue,
  formatCurrencyDisplay,
  translateGender,
  translateSchedule,
  formatSkillLevelLabel,
  formatRoles,
  resolveCategoryColor,
  getCategoryColor,
} from './utils/format.js';
import {
  createDomUtils,
  readFileAsDataUrl,
  extractPhotoFromForm,
  applyCategoryColorStyles,
  applyCategoryTagColor,
  createCategoryColorIndicator,
  renderCategoryColorField,
} from './utils/dom.js';
import { sanitizeNoticeHtml } from './utils/sanitize.js';
import {
  API_BASE,
  APP_BRAND_NAME,
  APP_BRAND_SLOGAN,
  NOTICE_LAST_SEEN_PREFIX,
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
  resolveAppBasePath,
  setAppBasePath,
  normalizeHistoryPath,
  normalizeAppPath,
  getSectionIdFromPath,
  buildPathFromSection,
  syncSectionRoute,
} from './config/routes.js';
setAppBasePath(APP_BASE_PATH);
  header.className = 'league-payment-header';
  const playerCell = buildPlayerCell(entry.player || {}, { includeSchedule: false, size: 'sm' });
  header.appendChild(playerCell);
  summary.appendChild(header);
  const headerMeta = document.createElement('div');
  headerMeta.className = 'league-payment-header-meta';
  const statusBadge = document.createElement('span');
  statusBadge.className = `tag payment-status payment-status--${statusValue}`;
  statusBadge.textContent = PAYMENT_STATUS_LABELS[statusValue] || statusValue || 'Pendiente';
  headerMeta.appendChild(statusBadge);
  if (Number.isFinite(entry.amount)) {
    const amountSpan = document.createElement('span');
    amountSpan.className = 'league-payment-amount';
    amountSpan.textContent =
      formatCurrencyValue(entry.amount, DEFAULT_LEAGUE_CURRENCY) ||
      `${entry.amount.toFixed(2)} ${DEFAULT_LEAGUE_CURRENCY}`;
    headerMeta.appendChild(amountSpan);
  }
function renderLeaguePayments(entries = [], { fee = null } = {}) {
  if (!leaguePaymentsGroups) return;
  if (leaguePaymentsCount) {
    leaguePaymentsCount.textContent = String(entries.length);
  }
  updateLeaguePaymentFeeIndicator(fee);
  resetLeaguePaymentGroups();
  const pendingEntries = entries.filter((entry) => (entry.status || 'pendiente') !== 'pagado');
  const paidEntries = entries.filter((entry) => (entry.status || 'pendiente') === 'pagado');
  updateLeaguePaymentTotalElement(
    leaguePaymentsPendingTotal,
    calculateLeaguePaymentTotal(pendingEntries)
  );
  updateLeaguePaymentTotalElement(leaguePaymentsPaidTotal, calculateLeaguePaymentTotal(paidEntries));
async function refreshLeaguePayments({ force = false } = {}) {
  if (!leaguePaymentsGroups) return;
  const filters = ensureLeaguePaymentFilters();
  const leagueId = filters.league;
  if (!leagueId) {
    resetLeaguePaymentGroups();
    if (leaguePaymentsCount) {
      leaguePaymentsCount.textContent = '0';
    const hasOptions = getLeaguesWithEnrollmentFee().length > 0;
    if (leaguePaymentsEmpty) {
      leaguePaymentsEmpty.hidden = false;
      leaguePaymentsEmpty.textContent = hasOptions
        ? 'Selecciona una liga con cuota para ver los pagos.'
        : 'Configura una liga con cuota de inscripción para gestionar pagos.';
    updateLeaguePaymentFeeIndicator();
    setStatusMessage(leaguePaymentsStatusMessage, '', '');
  const usingCachedData = !force && state.leaguePayments instanceof Map && state.leaguePayments.has(leagueId);
  if (!usingCachedData) {
    resetLeaguePaymentGroups();
    if (leaguePaymentsStatusMessage) {
      setStatusMessage(leaguePaymentsStatusMessage, 'info', 'Cargando registros de pago...');
    if (leaguePaymentsEmpty) {
      leaguePaymentsEmpty.hidden = false;
      leaguePaymentsEmpty.textContent = 'Cargando registros de pago...';




function renderGlobalUpcomingMatches(matches = []) {
  renderDashboardMatchList(matches, globalUpcomingMatchesList, 'No hay partidos programados.', {
    includeScope: true,
  });
}
function renderLeagueDashboard(summary) {
  const previousSummary = state.leagueDashboard;
  const nextSummary = summary || null;
  const isSameReference = previousSummary && nextSummary && previousSummary === nextSummary;
  state.leagueDashboard = nextSummary;
  if (!isSameReference) {
    state.leagueDashboardPlayersPage = 1;
  }
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
  const leagueGroups = Array.isArray(summary?.leagueRankings) ? summary.leagueRankings : [];
  const activeLeaguesValue = Number(metrics.activeLeagues);
  const activeLeaguesCount = Number.isFinite(activeLeaguesValue)
    ? activeLeaguesValue
    : leagueGroups.length;
function updateEnrollmentCategoryOptions() {
  if (!tournamentEnrollmentCategorySelect) return;
  const tournamentId = state.selectedEnrollmentTournamentId;
  const categories = getTournamentCategories(tournamentId);
  tournamentEnrollmentCategorySelect.innerHTML = '';
  const allOption = document.createElement('option');
  allOption.value = TOURNAMENT_ENROLLMENT_ALL_OPTION;
  allOption.textContent = 'Todos los jugadores';
  tournamentEnrollmentCategorySelect.appendChild(allOption);

  if (!tournamentId) {
    tournamentEnrollmentCategorySelect.disabled = true;
    state.selectedEnrollmentCategoryId = TOURNAMENT_ENROLLMENT_ALL_OPTION;
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
      const option = document.createElement('option');
      option.value = categoryId;
      option.textContent = category.menuTitle || category.name || 'Categoría';
      tournamentEnrollmentCategorySelect.appendChild(option);
  tournamentEnrollmentCategorySelect.disabled = false;
  const availableIds = [TOURNAMENT_ENROLLMENT_ALL_OPTION].concat(
    categories.map((category) => normalizeId(category)).filter(Boolean)
  );
  if (!availableIds.includes(state.selectedEnrollmentCategoryId)) {
    state.selectedEnrollmentCategoryId = TOURNAMENT_ENROLLMENT_ALL_OPTION;
    clearTournamentEnrollmentFilters();
  tournamentEnrollmentCategorySelect.value = state.selectedEnrollmentCategoryId;
  refreshTournamentEnrollments();
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
  tournamentMatchCategorySelect.value = state.selectedMatchCategoryId || '';
  if (state.selectedMatchCategoryId) {
    refreshTournamentMatches();
  } else {
    renderTournamentMatches([], { loading: false });
}
function updateBracketCategoryOptions() {
  if (!tournamentBracketCategorySelect) {
    return;
  const tournamentId = state.selectedBracketTournamentId;
  const categories = getTournamentCategories(tournamentId);
  tournamentBracketCategorySelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = categories.length
    ? 'Selecciona una categoría'
    : 'Sin categorías disponibles';
  tournamentBracketCategorySelect.appendChild(placeholder);
  if (!tournamentId || !categories.length) {
    tournamentBracketCategorySelect.disabled = true;
    state.selectedBracketCategoryId = '';
    renderTournamentBracketSeeds();
    renderTournamentBracket([], { loading: false });
    updateTournamentActionAvailability();
    return;
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
      tournamentBracketCategorySelect.appendChild(option);
    });
  tournamentBracketCategorySelect.disabled = false;
  const availableIds = categories.map((category) => normalizeId(category)).filter(Boolean);
  if (!availableIds.includes(state.selectedBracketCategoryId)) {
    state.selectedBracketCategoryId = '';
  tournamentBracketCategorySelect.value = state.selectedBracketCategoryId || '';
  if (state.selectedBracketCategoryId) {
    loadTournamentBracketContext({
      tournamentId,
      categoryId: state.selectedBracketCategoryId,
      forceMatches: false,
  } else {
    renderTournamentBracketSeeds({
      tournamentId,
      categoryId: '',
      enrollments: [],
      category: null,
      pairs: [],
    });
    renderTournamentBracket([], { loading: false });
  updateTournamentActionAvailability();
}
function collectEnrollmentShirtSizes(enrollment) {
  const sizes = new Set();
  const pushSize = (value) => {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (normalized) {
      sizes.add(normalized);
    }
  };
  pushSize(enrollment?.shirtSize);
  if (Array.isArray(enrollment?.shirtSizes)) {
    enrollment.shirtSizes.forEach(pushSize);
  }
  const categories = Array.isArray(enrollment?.tournamentCategories)
    ? enrollment.tournamentCategories
    : [];
  categories.forEach((category) => pushSize(category?.shirtSize));
  pushSize(enrollment?.user?.shirtSize);
  return Array.from(sizes.values());
}
function normalizeDoublesPair(pair) {
  if (!pair || typeof pair !== 'object') {
    return null;
  }
  const normalized = { ...pair };
  const id = normalizeId(pair);
  if (id) {
    normalized.id = id;
    if (!normalized._id) {
      normalized._id = id;
    }
  const members = Array.isArray(pair.players)
    ? pair.players
        .map((member) => {
          if (!member) {
            return null;
          }
          if (typeof member === 'object') {
            const memberId = normalizeId(member);
            return {
              ...member,
              id: memberId || member.id || member._id || '',
              _id: memberId || member._id || member.id || '',
            };
          }
          if (typeof member === 'string') {
            const trimmed = member.trim();
            if (!trimmed) {
              return null;
            }
            return { id: trimmed, _id: trimmed, fullName: trimmed };
          }
          return null;
        })
        .filter(Boolean)
    : [];
  normalized.players = members;
  if (!normalized.fullName || !normalized.fullName.trim()) {
    const names = members
      .map((member) => {
        if (!member || typeof member !== 'object') {
          return '';
        }
        if (typeof member.fullName === 'string' && member.fullName.trim()) {
          return member.fullName.trim();
        }
        if (typeof member.email === 'string' && member.email.trim()) {
          return member.email.trim();
        }
        return '';
      })
      .filter((name) => Boolean(name && name.trim()));
    if (names.length) {
      normalized.fullName = names.join(' / ');
    }
  return normalized;
}
function cloneNormalizedDoublesPair(pair) {
  if (!pair || typeof pair !== 'object') {
    return null;
  const players = Array.isArray(pair.players)
    ? pair.players.map((member) => (member && typeof member === 'object' ? { ...member } : member))
  return { ...pair, players };
}
function buildDoublesPairMap(pairs = []) {
  const map = new Map();
  (Array.isArray(pairs) ? pairs : []).forEach((pair) => {
    const normalized = normalizeDoublesPair(pair);
    if (normalized && normalized.id) {
      map.set(normalized.id, normalized);
    }
  });
  return map;
}
function matchesRequireDoublesPairs(matches = []) {
  return matches.some((match) => {
    if (!match || match.playerType !== 'TournamentDoublesPair') {
      return false;
    }
    const players = Array.isArray(match.players) ? match.players : [];
    if (!players.length) {
      return false;
    }
    return players.some((player) => {
      if (!player) {
        return false;
      if (typeof player === 'object') {
        return !Array.isArray(player.players) || !player.players.length;
      }
      return true;
  });
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
function createBracketPlayerAvatar(player, placeholderLabel = '') {
  const avatarGroup = document.createElement('div');
  avatarGroup.className = 'bracket-player__avatars';
  const members = Array.isArray(player?.players)
    ? player.players.filter(Boolean)
    : [];
  if (members.length) {
    avatarGroup.classList.add('bracket-player__avatars--pair');
    members.forEach((member) => {
      const avatar = createAvatarElement(member, { size: 'sm' });
      avatar.classList.add('bracket-player__avatar');
      avatarGroup.appendChild(avatar);
    });
    return avatarGroup;
  }
  const avatar = document.createElement('div');
  avatar.className = 'player-avatar player-avatar--sm bracket-player__avatar';
  const photo = typeof player?.photo === 'string' ? player.photo : '';
  if (photo) {
    const image = document.createElement('img');
    image.src = photo;
    image.alt = `Avatar de ${getPlayerDisplayName(player)}`;
    avatar.appendChild(image);
  } else {
    avatar.classList.add('player-avatar--placeholder');
    const textSource = placeholderLabel || getPlayerDisplayName(player);
    const initial = textSource ? textSource.trim().charAt(0).toUpperCase() : '—';
    avatar.textContent = initial || '—';
  }
  avatarGroup.appendChild(avatar);

  return avatarGroup;
function createBracketMatchCard(match, seedByPlayer = new Map(), options = {}) {
  const {
    roundIndex = 0,
    totalRounds = 1,
    slotIndex = 0,
    isPlaceholder = false,
    matchNumber = '',
    placeholderLabels = [],
    useConnectors = true,
  } = options;
  const matchId = match ? normalizeId(match) : '';
  const editable = Boolean(matchId) && isAdmin();
  const card = document.createElement('div');
  card.className = 'bracket-match';
  if (matchId) {
    card.dataset.matchId = matchId;
  const displayMatchNumber = match?.matchNumber || matchNumber;
  if (displayMatchNumber) {
    card.dataset.matchNumber = `${displayMatchNumber}`;
  const previousMatchIds = Array.isArray(match?.previousMatches)
    ? match.previousMatches
        .map((previous) => normalizeId(previous))
        .filter((value, index, list) => Boolean(value) && list.indexOf(value) === index)
    : [];
  if (previousMatchIds.length) {
    card.dataset.previousMatchIds = previousMatchIds.join(',');
  const placeholderSources = [];
  if (Array.isArray(placeholderLabels)) {
    placeholderSources.push(...placeholderLabels);
  if (typeof match?.placeholderA === 'string') {
    placeholderSources.push(match.placeholderA);
  }
  if (typeof match?.placeholderB === 'string') {
    placeholderSources.push(match.placeholderB);
  const placeholderMatchNumbers = new Set();
  placeholderSources.forEach((text) => {
    if (typeof text !== 'string' || !/partido/i.test(text)) {
      return;
    const numberRegex = /\d+/g;
    numberRegex.lastIndex = 0;
    let matchResult = null;
    while ((matchResult = numberRegex.exec(text))) {
      const [numberValue] = matchResult;
      if (numberValue) {
        placeholderMatchNumbers.add(numberValue);
  });
  if (placeholderMatchNumbers.size) {
    card.dataset.previousMatchNumbers = Array.from(placeholderMatchNumbers).join(',');
  if (useConnectors && roundIndex > 0) {
    card.classList.add('bracket-match--has-prev');
  }
  if (useConnectors && roundIndex < totalRounds - 1) {
    card.classList.add('bracket-match--has-next');
    card.classList.add(slotIndex % 2 === 0 ? 'bracket-match--top' : 'bracket-match--bottom');
  }
  if (isPlaceholder) {
    card.classList.add('bracket-match--placeholder');
  }
  const header = document.createElement('div');
  header.className = 'bracket-match__header';
  const label = document.createElement('span');
  label.className = 'bracket-match__label';
  label.textContent = displayMatchNumber ? `Partido ${displayMatchNumber}` : 'Partido';
  header.appendChild(label);
  const statusValue = match?.status || 'pendiente';
  const pendingLabel = formatTournamentMatchStatusLabel('pendiente') || 'Pendiente';
  const statusLabel =
    !isPlaceholder && typeof statusValue === 'string'
      ? formatTournamentMatchStatusLabel(statusValue) || statusValue
      : pendingLabel;
  const statusSpan = document.createElement('span');
  statusSpan.className = 'bracket-match__status';
  statusSpan.textContent = statusLabel || pendingLabel;
  header.appendChild(statusSpan);
  card.appendChild(header);
  const playersContainer = document.createElement('div');
  playersContainer.className = 'bracket-match__players';
  const players = Array.isArray(match?.players) ? match.players : [];
  const winnerId = resolveWinnerId(match);
  const sets = getMatchSets(match);
  const scoreParticipants = getMatchScores(match);
  const participantById = new Map();
  scoreParticipants.forEach((participant) => {
    if (participant?.id) {
      participantById.set(participant.id, participant);
  });
  const canRenderInlineScores =
    !isPlaceholder &&
    sets.length > 0 &&
    players.every((player) => {
      if (!player) {
        return false;
      const playerId = normalizeId(player);
      return Boolean(playerId && participantById.has(playerId));
  for (let index = 0; index < 2; index += 1) {
    const player = players[index];
    const wrapper = document.createElement('div');
    wrapper.className = 'bracket-player';
    const seedSpan = document.createElement('span');
    seedSpan.className = 'bracket-player__seed';
    const rawPlaceholderLabel =
      placeholderLabels[index] || (index === 0 ? match?.placeholderA : match?.placeholderB) || '';
    const displayPlaceholder = rawPlaceholderLabel && rawPlaceholderLabel.trim() ? rawPlaceholderLabel : 'Pendiente';
    if (player) {
      const playerId = normalizeId(player);
      const seedNumber = seedByPlayer.get(playerId);
      seedSpan.textContent = seedNumber ? `#${seedNumber}` : '';
    } else {
      seedSpan.textContent = '';
    }
    wrapper.appendChild(seedSpan);
    wrapper.appendChild(createBracketPlayerAvatar(player, player ? '' : displayPlaceholder));
    const nameSpan = document.createElement('span');
    nameSpan.className = 'bracket-player__name';
    if (player) {
      nameSpan.textContent = getPlayerDisplayName(player);
    } else {
      nameSpan.textContent = displayPlaceholder;
      wrapper.classList.add('bracket-player--placeholder');
      nameSpan.classList.add('bracket-player__name--placeholder');
    wrapper.appendChild(nameSpan);
    const statusSpan = document.createElement('span');
    statusSpan.className = 'bracket-player__status';
    let playerId = '';
    if (player) {
      playerId = normalizeId(player);
      if (winnerId && playerId === winnerId) {
        wrapper.classList.add('bracket-player--winner');
        statusSpan.textContent = 'Ganador';
      } else if (winnerId) {
        wrapper.classList.add('bracket-player--eliminated');
        statusSpan.textContent = 'Eliminado';
      }
    wrapper.appendChild(statusSpan);
    if (player && playerId && canRenderInlineScores) {
      const participant = participantById.get(playerId) || null;
      if (participant) {
        wrapper.classList.add('bracket-player--with-score');
        wrapper.style.setProperty('--player-sets-count', Math.max(sets.length, 1));
        const scoresContainer = document.createElement('div');
        scoresContainer.className = 'bracket-player__scores';
        sets.forEach((set, setIndex) => {
          const scoreSpan = document.createElement('span');
          scoreSpan.className = 'bracket-player__score';
          const scoreValue = Number(set.scores?.[participant.id]);
          const displayValue = Number.isFinite(scoreValue) && scoreValue >= 0 ? Math.floor(scoreValue) : '';
          scoreSpan.textContent = displayValue;
          if (set.tieBreak) {
            scoreSpan.classList.add('bracket-player__score--tiebreak');
            scoreSpan.setAttribute('aria-label', `Super tie-break set ${setIndex + 1}: ${displayValue}`);
          } else if (displayValue !== '') {
            scoreSpan.setAttribute('aria-label', `Set ${setIndex + 1}: ${displayValue}`);
          }
          if (winnerId && participant.id === winnerId) {
            scoreSpan.classList.add('bracket-player__score--winner');
          }
          scoresContainer.appendChild(scoreSpan);
        });
        wrapper.appendChild(scoresContainer);
      }
    playersContainer.appendChild(wrapper);
  }
  card.appendChild(playersContainer);
  const scoreboard = !isPlaceholder && !canRenderInlineScores ? createResultScoreboard(match) : null;
  if (scoreboard) {
    card.appendChild(scoreboard);
  } else if (match?.result?.score) {
    const scoreMeta = document.createElement('div');
    scoreMeta.className = 'bracket-match__meta';
    scoreMeta.textContent = match.result.score;
    card.appendChild(scoreMeta);
  const meta = document.createElement('div');
  meta.className = 'bracket-match__meta';
  if (match?.scheduledAt) {
    const dateSpan = document.createElement('span');
    dateSpan.textContent = formatDate(match.scheduledAt);
    meta.appendChild(dateSpan);
  if (match?.court) {
    const courtSpan = document.createElement('span');
    courtSpan.textContent = `Pista: ${match.court}`;
    meta.appendChild(courtSpan);
  if (match?.result?.notes) {
    const notesSpan = document.createElement('span');
    notesSpan.textContent = match.result.notes;
    meta.appendChild(notesSpan);
  if (meta.childElementCount) {
    card.appendChild(meta);
  if (editable) {
    const actions = document.createElement('div');
    actions.className = 'bracket-match__actions';
    const scheduleButton = document.createElement('button');
    scheduleButton.type = 'button';
    const hasSchedule = Boolean(match?.scheduledAt);
    scheduleButton.className = hasSchedule
      ? 'secondary bracket-match__action'
      : 'primary bracket-match__action';
    scheduleButton.dataset.action = 'schedule-tournament-match';
    scheduleButton.dataset.matchId = matchId;
    const bracketTournamentId =
      normalizeId(match?.tournament) || state.selectedBracketTournamentId || '';
    const bracketCategoryId =
      normalizeId(match?.category) || state.selectedBracketCategoryId || '';
    scheduleButton.dataset.tournamentId = bracketTournamentId;
    scheduleButton.dataset.categoryId = bracketCategoryId;
    scheduleButton.textContent = hasSchedule ? 'Editar horario' : 'Programar partido';
    actions.appendChild(scheduleButton);
    const resultWinnerId = normalizeId(match?.result?.winner);
    const resultScore = typeof match?.result?.score === 'string' ? match.result.score.trim() : '';
    const hasResult = Boolean(resultWinnerId || resultScore);
    const resultButton = document.createElement('button');
    resultButton.type = 'button';
    resultButton.className = hasResult ? 'ghost bracket-match__action' : 'secondary bracket-match__action';
    resultButton.dataset.action = 'record-tournament-result';
    resultButton.dataset.matchId = matchId;
    resultButton.dataset.tournamentId = bracketTournamentId;
    resultButton.dataset.categoryId = bracketCategoryId;
    resultButton.textContent = hasResult ? 'Editar resultado' : 'Registrar resultado';
    actions.appendChild(resultButton);
    card.appendChild(actions);

  return card;
function determineInitialBracketRoundIndex(roundEntries = []) {
  if (!Array.isArray(roundEntries) || roundEntries.length === 0) {
    return 0;
  }

  for (let index = 0; index < roundEntries.length; index += 1) {
    const roundMatches = Array.isArray(roundEntries[index]?.matches)
      ? roundEntries[index].matches
      : [];
    const hasPendingMatch = roundMatches.some(
      (match) => !bracketMatchesHaveRecordedResults([match])
    );
    if (hasPendingMatch) {
      return index;
    }
  return roundEntries.length - 1;
function createBracketRoundNavigation(roundSections = [], grid, { initialRoundIndex = 0 } = {}) {
  const sections = Array.isArray(roundSections)
    ? roundSections.filter((section) => section instanceof HTMLElement)
    : [];
  if (!(grid instanceof HTMLElement) || sections.length <= 1) {
    return null;
  const nav = document.createElement('div');
  nav.className = 'bracket-round-nav';
  nav.setAttribute('aria-label', 'Navegación de rondas del cuadro');
  const prevButton = document.createElement('button');
  prevButton.type = 'button';
  prevButton.className = 'bracket-round-nav__control bracket-round-nav__control--prev';
  prevButton.setAttribute('aria-label', 'Ronda anterior');
  prevButton.title = 'Ronda anterior';
  prevButton.innerHTML = '<span aria-hidden="true">‹</span>';
  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'bracket-round-nav__control bracket-round-nav__control--next';
  nextButton.setAttribute('aria-label', 'Ronda siguiente');
  nextButton.title = 'Ronda siguiente';
  nextButton.innerHTML = '<span aria-hidden="true">›</span>';
  const buttonList = document.createElement('div');
  buttonList.className = 'bracket-round-nav__list';
  nav.appendChild(prevButton);
  nav.appendChild(buttonList);
  nav.appendChild(nextButton);
  const totalRounds = sections.length;
  const useFocusMode = totalRounds > 5;
  grid.classList.toggle('tournament-bracket-grid--focus-mode', useFocusMode);
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const roundButtons = sections.map((section, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bracket-round-nav__button';
    const rawLabel = section.dataset.roundName ||
      section.querySelector('.bracket-round__title')?.textContent;
    const label = typeof rawLabel === 'string' && rawLabel.trim() ? rawLabel.trim() : `Ronda ${
      index + 1
    }`;
    button.textContent = label;
    button.setAttribute('aria-label', label);
    button.dataset.roundIndex = String(index);
    button.addEventListener('click', () => {
      setActiveRound(index);
    });
    buttonList.appendChild(button);
    return button;
  });
  let activeRoundIndex = clamp(initialRoundIndex, 0, totalRounds - 1);
  const setActiveRound = (index) => {
    const clampedIndex = clamp(index, 0, totalRounds - 1);
    activeRoundIndex = clampedIndex;
    grid.dataset.activeRoundIndex = String(clampedIndex);
    nav.dataset.activeRoundIndex = String(clampedIndex);
    sections.forEach((section, sectionIndex) => {
      const isActive = sectionIndex === clampedIndex;
      const isPrevious = sectionIndex === clampedIndex - 1;
      const isNext = sectionIndex === clampedIndex + 1;
      const shouldHide = useFocusMode && Math.abs(sectionIndex - clampedIndex) > 1;
      section.classList.toggle('bracket-round--active', isActive);
      section.classList.toggle('bracket-round--previous', isPrevious);
      section.classList.toggle('bracket-round--next', isNext);
      section.classList.toggle('bracket-round--hidden', shouldHide);
    });
    roundButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === clampedIndex;
      button.classList.toggle('bracket-round-nav__button--active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      button.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
    prevButton.disabled = clampedIndex <= 0;
    nextButton.disabled = clampedIndex >= totalRounds - 1;
    scheduleOnNextAnimationFrame(() => applyTournamentBracketRoundOffsets(grid));
  };
  prevButton.addEventListener('click', () => {
    setActiveRound(activeRoundIndex - 1);
  });
  nextButton.addEventListener('click', () => {
    setActiveRound(activeRoundIndex + 1);
  });
  nav.addEventListener('keydown', (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    const buttonTarget = target ? target.closest('.bracket-round-nav__button') : null;
    if (!buttonTarget) {
      return;
    }
    let handled = false;
    if (event.key === 'ArrowLeft') {
      setActiveRound(activeRoundIndex - 1);
      handled = true;
    } else if (event.key === 'ArrowRight') {
      setActiveRound(activeRoundIndex + 1);
      handled = true;
    } else if (event.key === 'Home') {
      setActiveRound(0);
      handled = true;
    } else if (event.key === 'End') {
      setActiveRound(totalRounds - 1);
      handled = true;
    }
    if (handled) {
      event.preventDefault();
      const activeButton = roundButtons[activeRoundIndex];
      if (activeButton) {
        activeButton.focus();
      }
    }
  });
  setActiveRound(activeRoundIndex);
  return nav;
function updateBracketSizeSelect(category) {
  if (!tournamentBracketSizeSelect) {
    return;
  }
  if (!tournamentBracketSizeSelect.childElementCount) {
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecciona un tamaño';
    tournamentBracketSizeSelect.appendChild(placeholder);
    TOURNAMENT_BRACKET_SIZES.forEach((size) => {
      const option = document.createElement('option');
      option.value = String(size);
      option.textContent = `${size} jugadores`;
      tournamentBracketSizeSelect.appendChild(option);
  }
  const drawSize = Number(category?.drawSize);
  if (TOURNAMENT_BRACKET_SIZES.includes(drawSize)) {
    tournamentBracketSizeSelect.value = String(drawSize);
  } else {
    tournamentBracketSizeSelect.value = '';
  }
  tournamentBracketSizeSelect.disabled = !isAdmin();
  if (tournamentBracketSizeWrapper) {
    tournamentBracketSizeWrapper.hidden = !isAdmin();
  }
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
  if (!playerIds.length) {
    return [];
  const normalizedSets = rawSets
    .map((set, index) => {
      const number = Number.isFinite(Number(set?.number)) ? Number(set.number) : index + 1;
      const tieBreak = Boolean(set?.tieBreak);
      const scoresMap = extractScoreMap(set?.scores);
      const scores = {};
      playerIds.forEach((playerId) => {
        const value = Number(scoresMap.get(playerId));
        scores[playerId] = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
      const total = Object.values(scores).reduce((acc, value) => acc + value, 0);
      if (total === 0) {
        return null;
      }
      return { number, tieBreak, scores };
    })
    .filter(Boolean);
  if (normalizedSets.length) {
    return normalizedSets;
  return parseScoreStringSets(match?.result?.score, playerIds);
function parseScoreStringSets(rawScore, playerIds = []) {
  if (typeof rawScore !== 'string' || playerIds.length < 2) {
    return [];
  const cleaned = rawScore.trim();
  if (!cleaned) {
    return [];
  const sets = [];
  const regex = /([\d]{1,2})\s*[-–—xX/]\s*([\d]{1,2})/g;
  let matchResult;
  while ((matchResult = regex.exec(cleaned)) !== null) {
    const firstScore = Number(matchResult[1]);
    const secondScore = Number(matchResult[2]);
    if (!Number.isFinite(firstScore) || !Number.isFinite(secondScore)) {
      continue;
    }
    const segment = matchResult[0];
    const scores = {};
    scores[playerIds[0]] = Math.max(0, Math.floor(firstScore));
    scores[playerIds[1]] = Math.max(0, Math.floor(secondScore));
    const maximumScore = Math.max(scores[playerIds[0]], scores[playerIds[1]]);
    const minimumScore = Math.min(scores[playerIds[0]], scores[playerIds[1]]);
    const tieBreak =
      /tb|tie|super/i.test(segment) ||
      /[\[\]()]/.test(segment) ||
      maximumScore >= 8 ||
      (maximumScore === 7 && minimumScore === 6);
    sets.push({
      number: sets.length + 1,
      tieBreak,
      scores,
    });
  return sets;
function aggregateSetsForPlayers(sets, playerIds = []) {
  if (!Array.isArray(sets) || !sets.length) {
    return null;
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
  return totals;
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
      tieBreak: Boolean(set.tieBreak),
      scores: normalizedScores,
    };
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
function resolveWinnerId(match) {
  const winner = match?.result?.winner;
  if (!winner) {
    return '';
  }
  if (typeof winner === 'string') {
    return winner;
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

      row.appendChild(scoreCell);
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

  return scores
    .map(({ player, games }) => {
      const name = typeof player === 'object' ? player.fullName || player.email || 'Jugador' : 'Jugador';
      return `${name}: ${games} juego${games === 1 ? '' : 's'}`;
    })
    .join(' · ');
function getResultConfirmation(match, userId) {
  if (!match?.result?.confirmations || !userId) return null;
  const confirmations = match.result.confirmations;
  if (typeof confirmations.get === 'function') {
    return confirmations.get(userId) || null;
  }
  if (typeof confirmations === 'object') {
    return confirmations[userId] || null;
  return null;
}
function getProposalCalendarDate(match) {
  if (!match || match.status !== 'propuesto') {
    return null;
  const proposal = match.proposal || {};
  const proposalStatus = proposal.status || 'pendiente';
  if (proposalStatus !== 'pendiente') {
    return null;
  const proposedFor = proposal.proposedFor;
  if (!proposedFor) {
    return null;
  }
  const proposedDate = new Date(proposedFor);
  if (Number.isNaN(proposedDate.getTime())) {
    return null;
  return proposedDate;
function getMatchCalendarDate(match) {
  if (!match) {
    return null;
  if (match.scheduledAt) {
    const scheduledDate = new Date(match.scheduledAt);
    if (!Number.isNaN(scheduledDate.getTime())) {
      return scheduledDate;
    }

  return getProposalCalendarDate(match);
function buildCalendarDataset(matches = []) {
  const scheduled = [];
  const unscheduled = [];

  matches.forEach((match) => {
    const calendarDate = getMatchCalendarDate(match);
    if (calendarDate) {
      if (match.scheduledAt) {
        scheduled.push(match);
      } else {
        scheduled.push({ ...match, scheduledAt: calendarDate.toISOString() });
      }
    } else {
      unscheduled.push(match);
  });

  scheduled.sort((a, b) => {
    const firstDate = getMatchCalendarDate(a);
    const secondDate = getMatchCalendarDate(b);
    if (!firstDate || !secondDate) {
      return 0;
    return firstDate - secondDate;
  });
  const grouped = new Map();
  scheduled.forEach((match) => {
    const matchDate = getMatchCalendarDate(match);
    if (!matchDate) {
      return;
    }
    const key = startOfDay(matchDate).getTime();
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(match);
  });
  grouped.forEach((dayMatches) => {
    dayMatches.sort((a, b) => {
      const firstDate = getMatchCalendarDate(a);
      const secondDate = getMatchCalendarDate(b);
      if (!firstDate || !secondDate) {
        return 0;
      }
      return firstDate - secondDate;
    });
  });
  return { grouped, unscheduled };
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
function isUserMatchParticipant(match, user = state.user) {
  if (!match || !Array.isArray(match.players)) {
    return false;
  const userId = normalizeId(user);
  if (!userId) {
    return false;
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
  } else if (match.status === 'pendiente') {
    messages.push('A la espera de que alguien proponga fecha y hora.');
  } else if (match.status === 'propuesto' && match.proposal) {
    const proposer = getPlayerDisplayName(match.proposal.requestedBy) || 'Un jugador';
    if (match.proposal.proposedFor) {
      messages.push(`${proposer} propuso ${formatDate(match.proposal.proposedFor)}.`);
    } else {
      messages.push(`${proposer} ha propuesto disputar el partido.`);
    if (match.court) {
      const courtLabel = formatCourtDisplay(match.court);
      if (courtLabel) {
        messages.push(`Pista sugerida: ${courtLabel}.`);
      }
    if (match.proposal.message) {
      messages.push(`Mensaje: ${match.proposal.message}`);
  } else if (match.status === 'revision' || resultStatus === 'en_revision') {
    messages.push('Resultado pendiente de confirmación.');
  } else if (match.status === 'caducado') {
    messages.push('El plazo para disputar el partido venció sin puntos.');
  }
  if (resultStatus === 'rechazado') {
    messages.push('El resultado enviado fue rechazado. Vuelve a registrarlo.');
  }
  return messages;
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
function formatCourtDisplay(value) {
  if (!value) {
    return '';
  const court = (typeof value === 'string' ? value : String(value)).trim();
  if (!court) {
    return '';
  }
  return court.toLocaleLowerCase('es-ES').startsWith('pista') ? court : `Pista ${court}`;
function getMatchParticipantName(match, participant) {
  if (!participant) {
    return '';
  if (typeof participant === 'object') {
    return getPlayerDisplayName(participant);
  if (typeof participant === 'string' && Array.isArray(match?.players)) {
    const found = match.players.find((player) => normalizeId(player) === participant);
    if (found) {
      return getPlayerDisplayName(found);
  return '';
function openMatchViewer(match, { allowResultEdit = false, allowMatchEdit = false } = {}) {
  if (!match) {
    showGlobalMessage('No fue posible cargar los datos del partido.', 'error');
    return;
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
  const warningMessage = getExpirationWarningMessage(match);
  if (warningMessage && match.status !== 'caducado') {
    const warning = document.createElement('p');
    warning.className = 'deadline-warning';
    warning.textContent = warningMessage;
    container.appendChild(warning);
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
  const winnerName = getMatchParticipantName(match, match.result?.winner);
  if (winnerName) {
    const winnerParagraph = document.createElement('p');
    winnerParagraph.className = 'meta';
    winnerParagraph.textContent = `Ganador: ${winnerName}`;
    resultSection.appendChild(winnerParagraph);
  const scoreboard = createResultScoreboard(match);
  const scoreSummary = formatMatchScore(match);
  if (scoreboard) {
    resultSection.appendChild(scoreboard);
  } else if (scoreSummary) {
    const summaryParagraph = document.createElement('p');
    summaryParagraph.className = 'meta';
    summaryParagraph.textContent = scoreSummary;
    resultSection.appendChild(summaryParagraph);
  if (match.result?.notes) {
    const resultNotes = document.createElement('p');
    resultNotes.className = 'match-viewer__notes';
    resultNotes.textContent = match.result.notes;
    resultSection.appendChild(resultNotes);
  const reporterName = getMatchParticipantName(match, match.result?.reportedBy);
  if (reporterName) {
    const reporterParagraph = document.createElement('p');
    reporterParagraph.className = 'meta';
    reporterParagraph.textContent = `Reportado por ${reporterName}.`;
    resultSection.appendChild(reporterParagraph);
  if (resultSection.childNodes.length > 1) {
    container.appendChild(resultSection);
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
    if (actions.childNodes.length) {
      container.appendChild(actions);
  }
  const modalTitle = Array.isArray(match.players) && match.players.length
    ? match.players.map((player) => getPlayerDisplayName(player)).join(' vs ')
    : 'Detalle del partido';
  openModal({
    title: modalTitle,
    content: (body) => {
      body.appendChild(container);
    },
function openCalendarMatch(matchId) {
  if (!matchId) return;
  const match = findMatchById(matchId);
  if (!match) {
    showGlobalMessage('No fue posible cargar los datos del partido.', 'error');
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
  });
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
  const matchId = normalizeId(match);
  if (matchId) {
    bindCalendarEvent(container, matchId);
  }
  return container;
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

    if (categoryColor) {
      applyCategoryColorStyles(event, categoryColor, { backgroundAlpha: 0.18, borderAlpha: 0.32 });

    block.appendChild(event);
  container.appendChild(block);
}
function createCalendarDayBlock(date, events = [], { weekdayLength = 'short' } = {}) {
  const dayBlock = document.createElement('div');
  dayBlock.className = 'calendar-day';
  const header = document.createElement('div');
  header.className = 'calendar-day-header';
  const normalizedLength = weekdayLength === 'long' ? 'long' : 'short';
  header.innerHTML = `<strong>${date.getDate()}</strong><span>${new Intl.DateTimeFormat('es-ES', {
    weekday: normalizedLength,
  }).format(date)}</span>`;
  dayBlock.appendChild(header);
  if (!events.length) {
    const empty = document.createElement('div');
    empty.className = 'calendar-empty';
    empty.textContent = '—';
    dayBlock.appendChild(empty);
    return dayBlock;
  }
  events.forEach((match) => {
    dayBlock.appendChild(createCalendarEvent(match));
  });
  return dayBlock;
}
function normalizeCourtKey(value) {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^pista\s+/i, '')
    .trim();
}
function getCalendarCourtsForDay(events = []) {
  const configuredCourts = Array.isArray(state.club?.courts) ? state.club.courts : [];
  const courtMap = new Map();
  const registerCourt = (rawName) => {
    if (!rawName) return;
    const key = normalizeCourtKey(rawName);
    if (!key) return;
    if (courtMap.has(key)) {
      return;
    }
    const display = formatCourtDisplay(rawName) || rawName;
    courtMap.set(key, {
      key,
      name: rawName,
      label: display,
  };
  configuredCourts.forEach((court) => {
    if (court?.name) {
      registerCourt(court.name);
  });
  events.forEach((event) => {
    if (event?.match?.court || event?.court) {
      registerCourt(event.match?.court || event.court);
  });
  return Array.from(courtMap.values());
}
function createCalendarDaySchedule(date, events = []) {
  const normalizedDate = startOfDay(date instanceof Date ? date : new Date(date));
  let slots = getReservationSlotStartsForDate(normalizedDate);
  const normalizedEvents = events
    .map((match) => {
      if (!match?.scheduledAt) {
        return null;
      const scheduledAt = new Date(match.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime())) {
        return null;
      return {
        match,
        scheduledAt,
        courtKey: normalizeCourtKey(match.court),
      };
    })
    .filter(Boolean);

  const courts = getCalendarCourtsForDay(normalizedEvents);
  const unassignedMatches = normalizedEvents.filter((item) => !item.courtKey).map((item) => item.match);
  const matchesByCourt = normalizedEvents.reduce((map, item) => {
    if (!item.courtKey) {
      return map;
    }
    if (!map.has(item.courtKey)) {
      map.set(item.courtKey, []);
    map.get(item.courtKey).push(item);
    return map;
  }, new Map());
  matchesByCourt.forEach((list) => {
    list.sort((a, b) => a.scheduledAt - b.scheduledAt);
  });
  const scheduledWithCourt = normalizedEvents.filter((item) => item.courtKey);
  if (!slots.length && scheduledWithCourt.length) {
    const earliestMatchTime = scheduledWithCourt.reduce(
      (min, item) => Math.min(min, item.scheduledAt.getTime()),
      scheduledWithCourt[0].scheduledAt.getTime()
    );
    slots = [
      roundDateToInterval(new Date(earliestMatchTime), CALENDAR_TIME_SLOT_MINUTES, 'floor'),
    ];
  if (slots.length && scheduledWithCourt.length) {
    const earliestTime = scheduledWithCourt.reduce(
      (min, item) => Math.min(min, item.scheduledAt.getTime()),
      scheduledWithCourt[0].scheduledAt.getTime()
    );
    const latestTime = scheduledWithCourt.reduce(
      (max, item) => Math.max(max, item.scheduledAt.getTime()),
      scheduledWithCourt[0].scheduledAt.getTime()
    );
    const dayStartTime = normalizedDate.getTime();
    const dayEndTime = addDays(normalizedDate, 1).getTime();
    while (earliestTime < slots[0].getTime() && slots[0].getTime() > dayStartTime) {
      const previousSlot = addMinutes(slots[0], -COURT_RESERVATION_DEFAULT_DURATION);
      slots.unshift(previousSlot);
    }
    let lastSlotEndTime = getReservationSlotEnd(slots[slots.length - 1]).getTime();
    while (latestTime >= lastSlotEndTime && slots[slots.length - 1].getTime() < dayEndTime) {
      const nextSlot = addMinutes(slots[slots.length - 1], COURT_RESERVATION_DEFAULT_DURATION);
      if (nextSlot.getTime() === slots[slots.length - 1].getTime()) {
        break;
      }
      if (nextSlot.getTime() >= dayEndTime) {
        break;
      }
      slots.push(nextSlot);
      lastSlotEndTime = getReservationSlotEnd(slots[slots.length - 1]).getTime();
    }
  if (!courts.length || !slots.length) {
    const fallbackContainer = document.createElement('div');
    fallbackContainer.className = 'calendar-day-list';
    fallbackContainer.appendChild(createCalendarDayBlock(date, events, { weekdayLength: 'long' }));
    if (unassignedMatches.length) {
      const unassignedSection = document.createElement('div');
      unassignedSection.className = 'calendar-day-schedule__unassigned';
      const title = document.createElement('p');
      title.className = 'calendar-day-schedule__unassigned-title';
      title.textContent = 'Partidos sin pista asignada';
      unassignedSection.appendChild(title);
      const list = document.createElement('div');
      list.className = 'calendar-day-schedule__unassigned-list';
      unassignedMatches.forEach((match) => {
        const event = createCalendarEvent(match);
        event.classList.add('calendar-schedule-event');
        list.appendChild(event);
      });
      unassignedSection.appendChild(list);
      fallbackContainer.appendChild(unassignedSection);
    }
    return fallbackContainer;
  const block = document.createElement('div');
  block.className = 'calendar-day calendar-day--schedule';
  const header = document.createElement('div');
  header.className = 'calendar-day-header calendar-day-schedule__header';
  header.innerHTML = `<strong>${normalizedDate.getDate()}</strong><span>${new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
  }).format(normalizedDate)}</span>`;
  block.appendChild(header);
  const scroller = document.createElement('div');
  scroller.className = 'calendar-day-schedule';
  block.appendChild(scroller);
  const grid = document.createElement('div');
  grid.className = 'calendar-day-schedule__grid';
  grid.style.setProperty('--calendar-schedule-court-count', courts.length);
  scroller.appendChild(grid);
  const headerRow = document.createElement('div');
  headerRow.className = 'calendar-day-schedule__row calendar-day-schedule__row--header';
  headerRow.style.setProperty('--calendar-schedule-court-count', courts.length);
  const timeHeaderCell = document.createElement('div');
  timeHeaderCell.className = 'calendar-day-schedule__cell calendar-day-schedule__cell--time';
  timeHeaderCell.textContent = 'Horario';
  headerRow.appendChild(timeHeaderCell);
  courts.forEach((court, index) => {
    const courtCell = document.createElement('div');
    courtCell.className = 'calendar-day-schedule__cell calendar-day-schedule__cell--court calendar-day-schedule__cell--header';
    courtCell.textContent = court.label;
    if (index === courts.length - 1) {
      courtCell.classList.add('calendar-day-schedule__cell--last-column');
    }
    headerRow.appendChild(courtCell);
  });
  grid.appendChild(headerRow);
  slots.forEach((slotStart, slotIndex) => {
    const slotEnd = getReservationSlotEnd(slotStart);
    const row = document.createElement('div');
    row.className = 'calendar-day-schedule__row calendar-day-schedule__row--body';
    row.style.setProperty('--calendar-schedule-court-count', courts.length);
    const timeCell = document.createElement('div');
    timeCell.className = 'calendar-day-schedule__cell calendar-day-schedule__cell--time';
    timeCell.textContent = formatReservationSlotLabel(slotStart);
    if (slotIndex === slots.length - 1) {
      timeCell.classList.add('calendar-day-schedule__cell--last-row');
    }
    row.appendChild(timeCell);
    courts.forEach((court, courtIndex) => {
      const cell = document.createElement('div');
      cell.className = 'calendar-day-schedule__cell calendar-day-schedule__cell--court';
      if (slotIndex === slots.length - 1) {
        cell.classList.add('calendar-day-schedule__cell--last-row');
      }
      if (courtIndex === courts.length - 1) {
        cell.classList.add('calendar-day-schedule__cell--last-column');
      }
      const matchesForCourt = matchesByCourt.get(court.key) || [];
      const slotMatches = matchesForCourt.filter(
        (item) => item.scheduledAt >= slotStart && item.scheduledAt < slotEnd
      );
      if (!slotMatches.length) {
        const empty = document.createElement('span');
        empty.className = 'calendar-day-schedule__empty';
        empty.textContent = 'Libre';
        cell.appendChild(empty);
      } else {
        slotMatches.forEach((item) => {
          const event = createCalendarEvent(item.match);
          event.classList.add('calendar-schedule-event');
          cell.appendChild(event);
        });
      }
      row.appendChild(cell);
    });
    grid.appendChild(row);
  });
  if (unassignedMatches.length) {
    const unassignedSection = document.createElement('div');
    unassignedSection.className = 'calendar-day-schedule__unassigned';
    const title = document.createElement('p');
    title.className = 'calendar-day-schedule__unassigned-title';
    title.textContent = 'Partidos sin pista asignada';
    unassignedSection.appendChild(title);
    const list = document.createElement('div');
    list.className = 'calendar-day-schedule__unassigned-list';
    unassignedMatches.forEach((match) => {
      const event = createCalendarEvent(match);
      event.classList.add('calendar-schedule-event');
      list.appendChild(event);
    });
    unassignedSection.appendChild(list);
    block.appendChild(unassignedSection);
  return block;
function renderCalendarView({
  container,
  labelElement,
  referenceDate,
  matches,
  includeUnscheduled = false,
  viewMode = 'month',
}) {
  if (!container) return;
  const reference =
    referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
      ? new Date(referenceDate)
      : new Date();
  const list = Array.isArray(matches) ? matches : [];
  const { grouped, unscheduled } = buildCalendarDataset(list);
  container.innerHTML = '';
  const mode = viewMode === 'day' ? 'day' : 'month';
  if (mode === 'day') {
    const dayReference = startOfDay(reference);
    if (labelElement) {
      labelElement.textContent = formatDayLabel(dayReference);
    }
    const key = dayReference.getTime();
    const events = grouped.get(key) || [];
    container.appendChild(createCalendarDaySchedule(dayReference, events));
  } else {
    const monthStart = startOfMonth(reference);
    if (labelElement) {
      labelElement.textContent = formatMonthLabel(monthStart);
    }
    const dayList = document.createElement('div');
    dayList.className = 'calendar-day-list';
    for (let cursor = new Date(monthStart); cursor < endOfMonth(monthStart); cursor = addDays(cursor, 1)) {
      const key = startOfDay(cursor).getTime();
      const events = grouped.get(key) || [];
      dayList.appendChild(createCalendarDayBlock(cursor, events));
    }
    container.appendChild(dayList);
  }
  if (includeUnscheduled) {
    renderUnscheduledMatches(unscheduled, container);
  }
}
function setCalendarViewButtonState(buttons, activeView) {
  if (!buttons) return;
  buttons.forEach((button) => {
    const view =
      button.dataset.globalCalendarView ||
      button.dataset.calendarView ||
      button.dataset.courtCalendarView ||
      '';
    const isActive = view === activeView;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
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
    viewMode: 'month',
}
function renderGlobalCalendar() {
  if (!globalCalendarContainer) return;
  const confirmedMatches = getScheduledCalendarMatches();
  const viewMode = state.globalCalendarViewMode === 'day' ? 'day' : 'month';
  renderCalendarView({
    container: globalCalendarContainer,
    labelElement: globalCalendarLabel,
    referenceDate: state.globalCalendarDate,
    matches: confirmedMatches,
    viewMode,
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
  if (state.globalCalendarViewMode === 'day') {
    const base = startOfDay(reference);
    state.globalCalendarDate = addDays(base, step);
  } else {
    state.globalCalendarDate = new Date(reference.getFullYear(), reference.getMonth() + step, 1);
  }
  renderGlobalCalendar();
}
async 
async  = {}
) {
  const normalizedCourt = typeof courtValue === 'string' ? courtValue.trim() : '';
  const targetDate = scope === 'admin' ? state.courtAdminDate : state.courtAvailabilityDate;
  const formatted = formatDateInput(targetDate) || formatDateInput(new Date());
  if (!formatted) {
    return;
  }
  const normalizedIgnoreManualLimit = Boolean(ignoreManualLimit);
  if (scope === 'admin' && courtAdminStatus) {
    setStatusMessage(courtAdminStatus, 'info', 'Cargando reservas...');
  } else if (scope === 'player' && playerCourtCalendarStatus) {
    setStatusMessage(playerCourtCalendarStatus, 'info', 'Cargando disponibilidad de pistas...');
  }
  try {
    const params = new URLSearchParams({ date: formatted });
    if (normalizedCourt) {
      params.append('court', normalizedCourt);
    if (normalizedIgnoreManualLimit) {
      params.append('ignoreManualLimit', 'true');
    const availability = await request(`/courts/availability?${params.toString()}`);
    const courts = Array.isArray(availability?.courts) ? availability.courts : [];
    if (scope === 'admin') {
      state.courtAdminCourt = normalizedCourt;
      state.courtAdminSchedule = courts;
      state.courtAdminBlocks = Array.isArray(availability?.blocks)
        ? availability.blocks
        : [];
      state.courtAdminIgnoreManualLimit = normalizedIgnoreManualLimit;
      renderCourtAdminSchedule();
      if (courtAdminStatus) {
        setStatusMessage(courtAdminStatus, '', '');
      }
    } else {
      state.courtAvailabilityCourt = normalizedCourt;
      state.courtAvailability = courts;
      state.courtAvailabilityIgnoreManualLimit = normalizedIgnoreManualLimit;
      renderCourtAvailability();
      renderPlayerCourtCalendar();
      if (playerCourtCalendarStatus) {
        setStatusMessage(playerCourtCalendarStatus, '', '');
  } catch (error) {
    if (scope === 'admin') {
      state.courtAdminCourt = normalizedCourt;
      state.courtAdminSchedule = [];
      state.courtAdminBlocks = [];
      state.courtAdminIgnoreManualLimit = normalizedIgnoreManualLimit;
      renderCourtAdminSchedule();
      if (courtAdminStatus) {
        setStatusMessage(courtAdminStatus, 'error', error.message);
      }
    } else {
      state.courtAvailabilityCourt = normalizedCourt;
      state.courtAvailability = [];
      state.courtAvailabilityIgnoreManualLimit = normalizedIgnoreManualLimit;
      renderCourtAvailability();
      renderPlayerCourtCalendar();
      if (playerCourtCalendarStatus) {
        setStatusMessage(playerCourtCalendarStatus, 'error', error.message);
      } else {
        showGlobalMessage(error.message, 'error');
      }
    }
  }
}
async 
function renderNotifications(notifications = []) {
  const baseList = Array.isArray(notifications) ? [...notifications] : [];
  state.notificationBase = baseList;
const state = createAppState();

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

const { request } = createApiClient({
  state,
  onUnauthorized: () => {
    clearSession();
    state.token = null;
    state.user = null;
    updateAuthUI();
});
    closesAt,
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
    function syncCustomField() {
      const isCustom = daySelect.value === 'custom' || !daySelect.value;
      customLabel.hidden = !isCustom;
      if (!isCustom) {
        customInput.placeholder = `Ej. ${WEEKDAY_LABEL_BY_VALUE[daySelect.value] || 'Horario'}`;
        customInput.placeholder = 'Nombre de la franja';
    daySelect.addEventListener('change', syncCustomField);
    syncCustomField();
    updateEmptyState();
  function addSchedule(data) {
    createScheduleItem(data);
  addButton.addEventListener('click', () => {
    addSchedule({ dayValue: '', customLabel: '', opensAt: '', closesAt: '' });
  const normalized = Array.isArray(initialSchedules) ? initialSchedules.map(normalizeScheduleForEditor) : [];
  if (normalized.length) {
    normalized.forEach((entry) => addSchedule(entry));
  if (!list.children.length) {
    addSchedule({ dayValue: '', customLabel: '', opensAt: '', closesAt: '' });
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
  return {
    element: wrapper,
    getValue,
    addSchedule,
  };
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
  function addCourt(data) {
    createCourtItem(data);
  addButton.addEventListener('click', () => {
    addCourt({ name: '', surface: '', indoor: false, lights: true, notes: '' });
  });
  const normalized = Array.isArray(initialCourts) ? initialCourts.map(normalizeCourtForEditor) : [];
  if (normalized.length) {
    normalized.forEach((entry) => addCourt(entry));
  if (!list.children.length) {
    addCourt({ name: '', surface: '', indoor: false, lights: true, notes: '' });
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
      .filter(Boolean);
  return {
    element: wrapper,
    getValue,
    addCourt,
  };
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
const notificationsModule = createNotificationsModule({
  state,
  notificationsList,
  notificationsMenuBadge,
  metricNotifications,
  formatDate,
  normalizeId,
  isAdmin,
});
const { renderNotifications, updateNotificationCounts } = notificationsModule;

  editor.setAttribute('role', 'textbox');
  editor.setAttribute('aria-multiline', 'true');
  editor.dataset.placeholder = placeholder;
  const sanitizedInitial = sanitizeNoticeHtml(initialContent) || '';
  if (sanitizedInitial) {
    editor.innerHTML = sanitizedInitial;
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
  container.append(toolbar, editor);

  function getValue() {
    const rawHtml = editor.innerHTML || '';
    return sanitizeNoticeHtml(rawHtml);
  return {
    element: container,
    getValue,
  };
function parseFacilitiesInput(rawValue) {
  if (typeof rawValue !== 'string') return [];
  return rawValue
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
function renderClubProfile(club = {}) {
  state.club = club || {};
  const name = typeof club.name === 'string' && club.name.trim() ? club.name.trim() : APP_BRAND_NAME;
  const slogan =
    typeof club.slogan === 'string' && club.slogan.trim() ? club.slogan.trim() : APP_BRAND_SLOGAN;
  if (clubNameHeading) {
    clubNameHeading.textContent = name;
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
  if (clubDescription) {
    clubDescription.textContent = club.description?.trim() || 'Actualiza la descripción del club para compartir la filosofía y servicios disponibles.';
  }
  const contactBits = [];
  if (club.contactPhone) {
    contactBits.push(`Tel: ${club.contactPhone}`);
  }
  if (club.contactEmail) {
    contactBits.push(`Email: ${club.contactEmail}`);
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
const pushModule = createPushModule({
  state,
  request,
  showGlobalMessage,
  accountPushStatus,
  pushSettingsCard,
  pushStatusText,
  pushEnableButton,
  pushDisableButton,
  pushPermissionWarning,
  pushUnsupportedWarning,
});
const {
  getPushStatusLabel,
  updatePushSettingsUI,
  ensurePushServiceWorker,
  syncPushSubscriptionState,
  enablePushNotifications,
  disablePushNotifications,
} = pushModule;

const profileModule = createProfileModule({
  state,
  profileName,
  profileAvatar,
  profileForm,
  profileIsMemberCheckbox,
  profileMembershipWrapper,
  profileMembershipNumberInput,
  accountPhoto,
  accountFullName,
  accountEmail,
  accountPhone,
  accountMembershipStatus,
  accountMembershipNumber,
  accountMembershipNumberRow,
  accountBirthDate,
  accountShirtSize,
  accountSchedule,
  accountNotes,
  accountPushStatus,
  accountDashboardCard,
  accountDashboard,
  accountDashboardEmpty,
  accountDashboardStatus,
  accountDashboardRefresh,
  accountEnrollmentsCount,
  accountUpcomingCount,
  accountRecentCount,
  accountPaymentsCount,
  accountPaymentsPaid,
  accountPaymentsPending,
  accountPaymentsTotal,
  accountEnrollmentsList,
  accountEnrollmentsEmpty,
  accountUpcomingList,
  accountUpcomingEmpty,
  accountRecentList,
  accountRecentEmpty,
  accountPaymentsList,
  accountPaymentsEmpty,
  formatShortDate,
  translateSchedule,
  formatDateInput,
  getPushStatusLabel,
  formatCurrencyDisplay,
  formatDate,
  normalizeId,
  getPlayerDisplayName,
  createResultScoreboard,
  formatMatchScore,
  STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  setStatusMessage,
  request,
  persistSession,
});
const {
  updateProfileCard,
  fillProfileForm,
  toggleMembershipField,
  renderAccountSummary,
  loadAccountSummary,
} = profileModule;

const profileSettingsModule = createProfileSettingsModule({
  state,
  profileForm,
  profileEditButton,
  profileCancelButton,
  profileStatus,
  profileIsMemberCheckbox,
  profileMembershipWrapper,
  profileMembershipNumberInput,
  accountOverview,
  setStatusMessage,
  request,
  extractPhotoFromForm,
  persistSession,
  showGlobalMessage,
  fillProfileForm,
  updateProfileCard,
  toggleMembershipField,
});
const {
  toggleProfileForm,
  handleProfileMembershipChange,
  handleProfileEditClick,
  handleProfileCancelClick,
  handleProfileFormSubmit,
} = profileSettingsModule;

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
      if (entry.closesAt) {
        rangeParts.push(entry.closesAt);
      }
      const range = rangeParts.length ? ` · ${rangeParts.join(' – ')}` : '';
      item.textContent = `${entry.label}${range}`;
      clubScheduleList.appendChild(item);
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
    clubCourtsList.hidden = !courts.length;
  if (clubCourtsEmpty) {
    clubCourtsEmpty.hidden = Boolean(courts.length);
  const facilities = Array.isArray(club.facilities) ? club.facilities : [];
  if (clubFacilitiesList) {
    clubFacilitiesList.innerHTML = '';
    facilities.forEach((facility) => {
      const item = document.createElement('li');
      item.textContent = facility;
      clubFacilitiesList.appendChild(item);
    });
    clubFacilitiesList.hidden = !facilities.length;
  if (clubFacilitiesEmpty) {
    clubFacilitiesEmpty.hidden = Boolean(facilities.length);
  populateCourtReservationCourts();
  populateCourtBlockCourts();
  populateCourtBlockEntities();
  populateAdminMatchCourtOptions();
  const currentScheduledValue = adminMatchDate?.value || '';
  const currentSlot = currentScheduledValue.includes('T')
    ? currentScheduledValue.split('T')[1]
    : '';
  updateAdminMatchScheduleVisibility({
    selectedTime: currentSlot,
    selectedCourt: adminMatchCourt?.value || '',
  });
  renderRules();
  if (clubStatus) {
    setStatusMessage(clubStatus, '', '');
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
const NOTICE_ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const NOTICE_ALLOWED_IMAGE_SCHEMES = new Set(['http:', 'https:']);
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
  'IMG',
]);
function sanitizeNoticeHtml(html) {
  if (typeof html !== 'string' || !html.trim()) {
    return '';
  const template = document.createElement('template');
  template.innerHTML = html;
  const cleanNode = (node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
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
            continue;
          }
        }
        if (!NOTICE_ALLOWED_TAGS.has(child.tagName)) {
          const fragment = document.createDocumentFragment();
          while (child.firstChild) {
            fragment.appendChild(child.firstChild);
          }
          child.replaceWith(fragment);
          cleanNode(fragment);
          continue;
        }
        if (child.tagName === 'IMG') {
          const attributes = Array.from(child.attributes);
          let hasValidSource = false;
          for (const attribute of attributes) {
            const name = attribute.name.toLowerCase();
            if (name === 'src') {
              const value = attribute.value.trim();
              if (NOTICE_INLINE_IMAGE_DATA_URL_PATTERN.test(value)) {
                child.setAttribute('src', value);
                hasValidSource = true;
              } else if (value) {
                try {
                  const url = new URL(value, window.location.origin);
                  if (NOTICE_ALLOWED_IMAGE_SCHEMES.has(url.protocol)) {
                    child.setAttribute('src', url.toString());
                    hasValidSource = true;
                  } else {
                    child.removeAttribute(attribute.name);
                  }
                } catch (error) {
                  child.removeAttribute(attribute.name);
                }
              } else {
                child.removeAttribute(attribute.name);
              }
              continue;
            }
            if (name === 'alt') {
              const altText = attribute.value.trim().slice(0, 240);
              child.setAttribute('alt', altText);
              continue;
            }
            child.removeAttribute(attribute.name);
          }
          if (!hasValidSource) {
            child.remove();
            continue;
          }
          if (!child.hasAttribute('alt')) {
            child.setAttribute('alt', '');
          }
          continue;
        }
        const attributes = Array.from(child.attributes);
        for (const attribute of attributes) {
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
                  continue;
                }
                child.setAttribute('href', url.toString());
                child.setAttribute('rel', 'noopener noreferrer');
                child.setAttribute('target', '_blank');
              } catch (error) {
                child.removeAttribute(attribute.name);
              }
              continue;
            }
            if (name === 'title') {
              continue;
            }
            if (name === 'rel') {
              child.setAttribute('rel', 'noopener noreferrer');
              continue;
            }
            if (name === 'target') {
              child.setAttribute('target', '_blank');
              continue;
            }
          }
          child.removeAttribute(attribute.name);
        }
        cleanNode(child);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
      } else if (child.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        cleanNode(child);
  cleanNode(template.content);
  return template.innerHTML.trim();
function applyRichTextCommand(editor, command, { level, list, onAttachment, onImage } = {}) {
  if (!editor || !command) {
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
    case 'list':
      if (list === 'ordered') {
        document.execCommand('insertOrderedList');
      } else {
        document.execCommand('insertUnorderedList');
      break;
    case 'quote':
      document.execCommand('formatBlock', false, 'blockquote');
      break;
    case 'link': {
      const url = window.prompt('Introduce la URL del enlace (incluye https://)');
      if (!url) {
        break;
      let sanitizedUrl = url.trim();
      if (sanitizedUrl && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(sanitizedUrl)) {
        sanitizedUrl = `https://${sanitizedUrl}`;
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
      break;
    case 'clear':
      document.execCommand('removeFormat');
      document.execCommand('formatBlock', false, 'p');
      break;
    case 'attachment':
      if (typeof onAttachment === 'function') {
        onAttachment();
      break;
    case 'image':
      if (typeof onImage === 'function') {
        onImage();
      }
      break;
      break;
function renderRules() {
  const renderSection = (element, regulation, emptyMessage) => {
    if (!element) return;
    const html = getRegulationHtml(regulation);
    const sanitized = typeof html === 'string' ? html.trim() : '';
    if (!sanitized) {
      element.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
      return;
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
renderRules();
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
    if (
      previous &&
      Array.from(adminEnrollmentPlayer.options).some((option) => option.value === previous)
    ) {
      adminEnrollmentPlayer.value = previous;
    }
      <input type="text" name="name" required />
        Año
        <input type="number" name="year" min="2000" placeholder="Opcional" />
      </label>
      <label>
        Estado
        <select name="status" required>
          <option value="activa">${LEAGUE_STATUS_LABELS.activa}</option>
          <option value="cerrada">${LEAGUE_STATUS_LABELS.cerrada}</option>
      Visibilidad
      <select name="isPrivate" required>
        <option value="false">Pública</option>
        <option value="true">Privada</option>
      </select>
      <span class="form-hint">Las ligas privadas solo están disponibles para socios y se ocultarán al resto de usuarios.</span>
      Descripción
      <textarea name="description" rows="2" maxlength="280" placeholder="Detalles opcionales"></textarea>
      <label>
        Inicio
        <input type="date" name="startDate" />
      <label>
        Fin
        <input type="date" name="endDate" />
    <div class="form-grid">
      <label>
        Cierre de inscripciones
        <input type="date" name="registrationCloseDate" />
        <span class="form-hint">Último día para que los jugadores envíen su inscripción.</span>
      <label>
        Tarifa de inscripción
        <input type="number" name="enrollmentFee" min="0" step="0.01" placeholder="0.00" />
        <span class="form-hint">Importe total en euros. Déjalo vacío si la inscripción es gratuita.</span>
    <label>
      Categorías asociadas
      <select name="categories" multiple size="6"></select>
      <span class="form-hint">Selecciona categorías existentes para vincularlas a esta liga.</span>
    </label>
      <button type="submit" class="primary">${league ? 'Actualizar' : 'Crear'} liga</button>
  form.elements.name.value = league?.name || '';
  if (form.elements.year) {
    form.elements.year.value = league?.year ? String(league.year) : '';
  if (form.elements.status) {
    form.elements.status.value = league?.status || 'activa';
  if (form.elements.isPrivate) {
    form.elements.isPrivate.value = league?.isPrivate ? 'true' : 'false';
  form.elements.description.value = league?.description || '';
  if (form.elements.poster) {
    form.elements.poster.value = league?.poster || '';
  form.elements.startDate.value = formatDateInput(league?.startDate);
  form.elements.endDate.value = formatDateInput(league?.endDate);
  if (form.elements.registrationCloseDate) {
    form.elements.registrationCloseDate.value = formatDateInput(league?.registrationCloseDate);
  }
  if (form.elements.enrollmentFee) {
    form.elements.enrollmentFee.value =
      typeof league?.enrollmentFee === 'number' ? String(league.enrollmentFee) : '';
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
  const formActions = form.querySelector('.form-actions');
  if (league && normalizedId && formActions) {
    const uploadSection = document.createElement('div');
    uploadSection.className = 'form-section league-poster-upload';
    uploadSection.innerHTML = `
      <h3>Cartel de la liga</h3>
      <p class="form-hint">Sube una imagen en formato JPG o PNG (máximo 5&nbsp;MB).</p>
      <label>
        Selecciona una imagen
        <input type="file" name="posterFile" accept="image/*" />
      </label>
      <div class="form-actions">
        <button type="button" class="secondary" data-action="upload-poster">Subir cartel</button>
      </div>
    `;
    const posterUploadStatus = document.createElement('p');
    posterUploadStatus.className = 'status-message';
    posterUploadStatus.style.display = 'none';
    uploadSection.appendChild(posterUploadStatus);
    formActions.before(uploadSection);
    const uploadButton = uploadSection.querySelector('[data-action="upload-poster"]');
    const fileInput = uploadSection.querySelector('input[name="posterFile"]');
    uploadButton?.addEventListener('click', async () => {
      if (!fileInput?.files?.length) {
        setStatusMessage(posterUploadStatus, 'error', 'Selecciona una imagen para el cartel.');
        return;
      }
      const file = fileInput.files[0];
      if (!file.type.startsWith('image/')) {
        setStatusMessage(posterUploadStatus, 'error', 'El archivo seleccionado debe ser una imagen.');
        return;
      }
      if (file.size > MAX_POSTER_SIZE) {
        setStatusMessage(
          posterUploadStatus,
          'error',
          'La imagen supera el tamaño máximo permitido (5 MB).'
        );
        return;
      const formData = new FormData();
      formData.append('poster', file);

      setStatusMessage(posterUploadStatus, 'info', 'Subiendo cartel...');

      try {
        const result = await request(`/leagues/${normalizedId}/poster`, {
          method: 'POST',
          body: formData,
        });
        setStatusMessage(posterUploadStatus, 'success', 'Cartel actualizado.');
        if (form.elements.poster) {
          form.elements.poster.value = result?.poster || '';
        }
        fileInput.value = '';
        await loadAllData();
      } catch (error) {
        setStatusMessage(posterUploadStatus, 'error', error.message);
    const succeeded = await submitLeagueFormData({
      leagueId: normalizedId,
    title: league ? 'Editar liga' : 'Nueva liga',
function openPlayerModal(playerId = '') {
  const normalizedId = playerId || '';
  const player = normalizedId
    ? state.players.find((item) => normalizeId(item) === normalizedId)
    : null;
  const scheduleOptions = Object.entries(SCHEDULE_LABELS)
  form.enctype = 'multipart/form-data';
      Nombre completo
      <input type="text" name="fullName" required />
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
        Género
        <select name="gender" required>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="mixto">Mixto</option>
      <fieldset class="checkbox-group">
        <legend>Roles</legend>
        <label class="checkbox-option">
          <input type="checkbox" name="roles" value="player" />
          Jugador
        </label>
        <label class="checkbox-option">
          <input type="checkbox" name="roles" value="court_manager" />
          Gestor de pistas
        </label>
        <label class="checkbox-option">
          <input type="checkbox" name="roles" value="admin" />
          Administrador
        </label>
      </fieldset>
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
      Talla de camiseta
      <select name="shirtSize" required>
        <option value="">Selecciona</option>
        <option value="XS">XS</option>
        <option value="S">S</option>
        <option value="M">M</option>
        <option value="L">L</option>
        <option value="XL">XL</option>
        <option value="XXL">XXL</option>
    <div class="form-grid">
      <label class="checkbox-option checkbox-option--stacked">
        <input type="checkbox" name="isMember" value="true" />
        Es socio del club
        <span class="form-hint">Marca esta opción si dispone de número de socio.</span>
      </label>
      <label data-membership-wrapper hidden>
        Nº de socio
        <input type="text" name="membershipNumber" maxlength="50" />
        <span class="form-hint">Introduce el número asignado por el club.</span>
      </label>
      <label class="checkbox-option" data-membership-verified-wrapper hidden>
        <input type="checkbox" name="membershipNumberVerified" value="true" />
        Nº de socio verificado
        <span class="form-hint">
          Marca esta casilla cuando hayas comprobado el número con el registro del club.
        </span>
      </label>
    </div>
      Notas
      <textarea name="notes" rows="2" maxlength="500" placeholder="Preferencias adicionales"></textarea>
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
      <button type="submit" class="primary">${player ? 'Actualizar' : 'Crear'}</button>
      ${
        player ? '<button type="button" class="danger" data-action="delete">Eliminar</button>' : ''
      }
  form.elements.fullName.value = player?.fullName || '';
  form.elements.email.value = player?.email || '';
  form.elements.gender.value = player?.gender || 'masculino';
  form.elements.birthDate.value = formatDateInput(player?.birthDate);
  form.elements.phone.value = player?.phone || '';
  form.elements.preferredSchedule.value = player?.preferredSchedule || 'flexible';
  form.elements.shirtSize.value = player?.shirtSize || '';
  form.elements.notes.value = player?.notes || '';
  form.elements.notifyMatchRequests.checked = player ? player.notifyMatchRequests !== false : true;
  form.elements.notifyMatchResults.checked = player ? player.notifyMatchResults !== false : true;
  const roleInputs = Array.from(form.querySelectorAll('input[name="roles"]'));
  const adminInput = roleInputs.find((input) => input.value === 'admin');
  const playerInput = roleInputs.find((input) => input.value === 'player');
  const currentRolesRaw = Array.isArray(player?.roles)
    ? player.roles
    : player?.role
    ? [player.role]
    : [];
  let currentRoles = currentRolesRaw
    .map((role) => (typeof role === 'string' ? role.toLowerCase() : ''))
    .filter(Boolean);
  if (!currentRoles.length) {
    currentRoles = ['player'];
  if (currentRoles.includes('admin')) {
    currentRoles = currentRoles.filter((role) => role !== 'player');
  roleInputs.forEach((input) => {
    input.checked = currentRoles.includes(input.value);
  function enforceRoleExclusivity() {
    if (adminInput?.checked) {
      if (playerInput) {
        playerInput.checked = false;
        playerInput.disabled = true;
    } else if (playerInput) {
      playerInput.disabled = false;
      if (!roleInputs.some((input) => input !== playerInput && input.checked)) {
        playerInput.checked = true;
    }
  }
  roleInputs.forEach((input) => {
    input.addEventListener('change', enforceRoleExclusivity);
  });
  enforceRoleExclusivity();

  const membershipCheckbox = form.elements.isMember;
  const membershipWrapper = form.querySelector('[data-membership-wrapper]');
  const membershipInput = form.elements.membershipNumber;
  const membershipVerifiedWrapper = form.querySelector('[data-membership-verified-wrapper]');
  const membershipVerifiedInput = form.elements.membershipNumberVerified;

  if (membershipCheckbox) {
    membershipCheckbox.checked = Boolean(player?.isMember);

  if (membershipInput) {
    membershipInput.value = player?.membershipNumber || '';
  if (membershipVerifiedInput) {
    membershipVerifiedInput.checked = Boolean(player?.membershipNumberVerified);
  }
  function updateMembershipControls({ clearWhenDisabled = false } = {}) {
    toggleMembershipField(membershipCheckbox, membershipWrapper, membershipInput, {
      clearWhenDisabled,
    });
    if (!membershipVerifiedWrapper) {
      return;
    }

    const isMemberSelected = Boolean(membershipCheckbox?.checked);
    membershipVerifiedWrapper.hidden = !isMemberSelected;

    if (membershipVerifiedInput) {
      membershipVerifiedInput.disabled = !isMemberSelected;
      if (!isMemberSelected && (clearWhenDisabled || !player)) {
        membershipVerifiedInput.checked = false;
      }
    }
  }

  if (membershipCheckbox) {
    updateMembershipControls({ clearWhenDisabled: !player });
    membershipCheckbox.addEventListener('change', () => {
      updateMembershipControls({ clearWhenDisabled: false });
      if (!membershipCheckbox.checked && membershipVerifiedInput) {
        membershipVerifiedInput.checked = false;
      }
  } else {
    updateMembershipControls({ clearWhenDisabled: true });
  }

  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';
    const succeeded = await submitPlayerFormData({
      playerId: normalizedId,
  const deleteButton = form.querySelector('[data-action="delete"]');
  deleteButton?.addEventListener('click', async () => {
    if (!normalizedId) return;
    const confirmed = window.confirm('¿Seguro que deseas eliminar este jugador?');
    if (!confirmed) return;
    setStatusMessage(status, 'info', 'Eliminando jugador...');
      await request(`/players/${normalizedId}`, { method: 'DELETE' });
      setStatusMessage(status, 'success', 'Jugador eliminado.');
      await loadAllData();
    title: player ? 'Editar usuario' : 'Nuevo usuario',
function openMatchModal(matchId = '') {
  const normalizedId = normalizeId(matchId);
  const match = normalizedId ? findMatchById(normalizedId) : null;
  const categories = Array.isArray(state.categories) ? [...state.categories] : [];
  const leagues = Array.isArray(state.leagues) ? [...state.leagues] : [];
  const currentMatchLeagueId = match ? normalizeId(match.league) : '';
  const stateLeagueMap = new Map();
  leagues.forEach((league) => {
    const id = normalizeId(league);
    if (id && !stateLeagueMap.has(id)) {
      stateLeagueMap.set(id, league);
  });
  const categoriesByLeague = new Map();
  const leagueDetailsMap = new Map();
  const UNASSIGNED_LEAGUE_VALUE = '__unassigned__';
  const registerLeague = (league) => {
    if (!league) return;
    const id = normalizeId(league);
    if (!id || leagueDetailsMap.has(id)) return;
    if (typeof league === 'object') {
      leagueDetailsMap.set(id, league);
    } else if (stateLeagueMap.has(id)) {
      leagueDetailsMap.set(id, stateLeagueMap.get(id));
    } else {
      leagueDetailsMap.set(id, { _id: id });
    }
  };
  categories.forEach((category) => {
    const leagueId = normalizeId(category.league);
    const key = leagueId || UNASSIGNED_LEAGUE_VALUE;
    if (!categoriesByLeague.has(key)) {
      categoriesByLeague.set(key, []);
    categoriesByLeague.get(key).push(category);
    if (leagueId) {
      registerLeague(category.league || stateLeagueMap.get(leagueId));
  });
  if (match?.league) {
    registerLeague(match.league);
  const statusOptions = Object.entries(STATUS_LABELS)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');
      Liga
      <select name="leagueId" required>
        <option value="">Selecciona una liga</option>
      </select>
      <select name="categoryId" required disabled>
        <option value="">Selecciona una categoría</option>
      </select>
        <select name="player1" required>
          <option value="">Selecciona jugador 1</option>
        </select>
        <select name="player2" required>
          <option value="">Selecciona jugador 2</option>
        </select>
    <label>
      Notas internas
      <textarea name="notes" rows="3" maxlength="500" placeholder="Comentarios o recordatorios"></textarea>
      <button type="submit" class="primary">${match ? 'Actualizar' : 'Crear'} partido</button>
  const status = document.createElement('p');
  status.className = 'status-message';
  status.style.display = 'none';
  const leagueField = form.elements.leagueId;
  const categoryField = form.elements.categoryId;
  const statusField = form.elements.status;
  const notesField = form.elements.notes;
  const formatLeagueLabel = (league) => {
    if (!league || typeof league !== 'object') {
      return 'Liga';
    }
    const parts = [];
    const name = typeof league.name === 'string' && league.name.trim() ? league.name.trim() : 'Liga';
    parts.push(name);
    if (league.year) {
      parts.push(league.year);
    }
    return parts.join(' · ');
  };

  if (leagueField) {
    const leagueOptionEntries = [];
    categoriesByLeague.forEach((list, key) => {
      if (key === UNASSIGNED_LEAGUE_VALUE) return;
      if (!Array.isArray(list) || !list.length) return;
      const info =
        leagueDetailsMap.get(key) || stateLeagueMap.get(key) || { _id: key };
      leagueOptionEntries.push({ id: key, info });
    });

    leagueOptionEntries
      .sort((a, b) => (a.info?.name || '').localeCompare(b.info?.name || '', 'es'))
      .forEach(({ id, info }) => {
        const isClosed = info?.status === 'cerrada';
        const isCurrentSelection = currentMatchLeagueId && currentMatchLeagueId === id;
        if (isClosed && !isCurrentSelection) {
          return;

        const option = document.createElement('option');
        option.value = id;
        option.textContent = formatLeagueLabel(info);
        if (isClosed) {
          option.textContent += ' (cerrada)';
        leagueField.appendChild(option);
      });
    if (categoriesByLeague.has(UNASSIGNED_LEAGUE_VALUE)) {
      const option = document.createElement('option');
      option.value = UNASSIGNED_LEAGUE_VALUE;
      option.textContent = 'Sin liga asignada';
      leagueField.appendChild(option);
    }
    const enabledLeagueOptions = Array.from(leagueField.options || []).filter(
      (option) => option.value && !option.disabled
    );
    if (!match && !enabledLeagueOptions.length) {
      leagueField.disabled = true;
      if (submitButton) {
        submitButton.disabled = true;
      }
      setStatusMessage(
        status,
        'warning',
        'Todas las ligas activas están cerradas. No es posible crear nuevos partidos.'
      );
    }
  const resolveCategoriesForLeague = (leagueId) => {
    if (!leagueId) return [];
    if (leagueId === UNASSIGNED_LEAGUE_VALUE) {
      return categoriesByLeague.get(UNASSIGNED_LEAGUE_VALUE) || [];
    }
    return categoriesByLeague.get(leagueId) || [];
  };
  const updateCategoryOptions = ({ leagueId, targetCategoryId, preserveSelection = false } = {}) => {
    if (!categoryField) return '';
    const previousValue = categoryField.value || '';
    categoryField.innerHTML = '<option value="">Selecciona una categoría</option>';
    categoryField.disabled = true;
    const categoryList = resolveCategoriesForLeague(leagueId);
    if (!categoryList.length) {
      return '';

    const normalizedCategories = categoryList
      .map((entry) => ({ id: normalizeId(entry), category: entry }))
      .filter((entry) => entry.id)
      .sort((a, b) => (a.category.name || '').localeCompare(b.category.name || '', 'es'));

    if (!normalizedCategories.length) {
      return '';

    normalizedCategories.forEach((entry) => {
      const option = new Option(entry.category.name || 'Categoría', entry.id);
      categoryField.appendChild(option);
    });

    categoryField.disabled = false;

    const desiredValue = targetCategoryId || (preserveSelection ? previousValue : '');
    if (desiredValue && normalizedCategories.some((entry) => entry.id === desiredValue)) {
      categoryField.value = desiredValue;
    } else if (normalizedCategories.length === 1) {
      categoryField.value = normalizedCategories[0].id;
    } else {
      categoryField.value = '';
    }

    return categoryField.value || '';
  };

  const categoryValue = match ? normalizeId(match.category) : '';
  let initialLeagueId = '';
  if (categoryValue) {
    const categoryEntry = categories.find((item) => normalizeId(item) === categoryValue);
    if (categoryEntry) {
      initialLeagueId = normalizeId(categoryEntry.league);
      if (!initialLeagueId && categoriesByLeague.has(UNASSIGNED_LEAGUE_VALUE)) {
        initialLeagueId = UNASSIGNED_LEAGUE_VALUE;
      }
    }
  } else if (match?.league) {
    initialLeagueId = normalizeId(match.league);
  }

  const selectInitialLeague = (desiredLeagueId) => {
    if (!leagueField) return '';
    const options = Array.from(leagueField.options || []);
    const isDesiredEnabled =
      desiredLeagueId &&
      options.some((option) => option.value === desiredLeagueId && !option.disabled);
    if (isDesiredEnabled) {
      leagueField.value = desiredLeagueId;
    } else if (leagueField.value) {
      const currentOption = leagueField.options[leagueField.selectedIndex];
      if (currentOption?.disabled) {
        leagueField.value = '';
      }
    }
    if (!leagueField.value) {
      const availableOptions = options.filter((option) => option.value && !option.disabled);
      if (availableOptions.length === 1) {
        leagueField.value = availableOptions[0].value;
      } else {
        leagueField.value = '';
      }
    return leagueField.value || '';
  const selectedLeagueId = selectInitialLeague(initialLeagueId);
  const initialCategorySelection = updateCategoryOptions({
    leagueId: selectedLeagueId,
    targetCategoryId: categoryValue,
  });
  if (leagueField) {
    leagueField.addEventListener('change', (event) => {
      setStatusMessage(status, '', '');
      const nextCategoryId = updateCategoryOptions({ leagueId: event.target.value });
      populateMatchPlayerSelects(form, nextCategoryId, [], status).catch((error) => {
        console.warn('No fue posible cargar jugadores inscritos', error);
      });
    });
  }
  if (statusField) {

const leaguePaymentsModule = createLeaguePaymentsModule({
  state,
  DEFAULT_LEAGUE_CURRENCY,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_ORDER,
  ensureLeaguePaymentFilters,
  getLeaguesWithEnrollmentFee,
  compareLeaguesByHistory,
  getLeagueCategories,
  resolveLeague,
  normalizeId,
  loadEnrollments,
  fetchLeagueDetail,
  renderLeagueDetail,
  buildPlayerCell,
  formatCurrencyValue,
  formatShortDate,
  formatDateInput,
  setStatusMessage,
  request,
  isAdmin,
  showSection,
  leaguePaymentsMenuButton,
  leaguePaymentsSection,
  leaguePaymentsGroups,
  leaguePaymentsPendingList,
  leaguePaymentsPendingEmpty,
  leaguePaymentsPendingCount,
  leaguePaymentsPendingTotal,
  leaguePaymentsPaidList,
  leaguePaymentsPaidEmpty,
  leaguePaymentsPaidCount,
  leaguePaymentsPaidTotal,
  leaguePaymentsCount,
  leaguePaymentsLeagueSelect,
  leaguePaymentsSearchInput,
  leaguePaymentsEmpty,
  leaguePaymentsFeeBadge,
  leaguePaymentsStatusMessage,
});

const {
  updateLeaguePaymentControls,
  refreshLeaguePayments,
  handleLeaguePaymentFormSubmit,
  updateLeaguePaymentMenuVisibility,
  resetLeaguePaymentGroups,
} = leaguePaymentsModule;

    statusField.value = match?.status || 'pendiente';
  }
  if (scheduledField) {
    scheduledField.value = formatDateTimeLocal(match?.scheduledAt);
  }
  if (courtField) {
    courtField.value = match?.court || '';
  let schedulePicker = null;
  if (schedulePickerContainer && scheduleDateField && scheduledField) {
    const updateStatusForSchedule = () => {
      if (!statusField) {
        return;
      }
      const hasSchedule = Boolean(scheduledField.value);
      if (hasSchedule && statusField.value === 'pendiente') {
        statusField.value = 'programado';
      } else if (!hasSchedule && statusField.value === 'programado') {
        statusField.value = 'pendiente';
      }
    };

      existingCourt: match?.court || '',
      onChange: updateStatusForSchedule,
      updateStatusForSchedule();
  if (notesField) {
    notesField.value = match?.result?.notes || match?.notes || '';
  }
  const selectedPlayers = Array.isArray(match?.players)
    ? match.players.map((player) => normalizeId(player))
    : [];
  const initialCategoryId = initialCategorySelection || categoryField.value;

  populateMatchPlayerSelects(form, initialCategoryId, selectedPlayers, status).catch((error) => {
    console.warn('No fue posible cargar jugadores inscritos', error);
  });

  categoryField.addEventListener('change', (event) => {
    setStatusMessage(status, '', '');
    populateMatchPlayerSelects(form, event.target.value, [], status).catch((error) => {
      console.warn('No fue posible cargar jugadores inscritos', error);
    });
    const succeeded = await submitMatchFormData({
      matchId: normalizedId,
      statusElement: status,
      creating: !match,
  const cancelButton = form.querySelector('[data-action="cancel"]');
  cancelButton?.addEventListener('click', () => {
    setStatusMessage(status, '', '');
    closeModal();
  });

    title: match ? 'Editar partido' : 'Nuevo partido',
const {
  setStatusMessage,
  showGlobalMessage,
  openModal,
  closeModal,
  openConfirmationDialog,
  applyRichTextCommand,
} = createDomUtils({ globalMessage, modalOverlay, modalBody, modalTitle });

const {
  openLeagueModal,
  openPlayerModal,
  openMatchModal,
  openClubModal,
  openRulesEditorModal,
  openGenerateMatchesModal,
  openResultModal,
  openEnrollmentModal,
  openSeasonModal,
  populateMatchPlayerSelects,
  createResultScoreboard,
  formatMatchScore,
  getMatchScores,
  getMatchSets,
  getResultConfirmation,
  isUserMatchParticipant,
} = createFormComponents({
  state,
  isAdmin,
  normalizeId,
  translateGender,
  resolveLeague,
  formatDateInput,
  formatDate,
  formatTime,
  translateSchedule,
  SCHEDULE_LABELS,
  LEAGUE_STATUS_LABELS,
  MAX_POSTER_SIZE,
  request,
  loadAllData,
  setStatusMessage,
  submitLeagueFormData,
  submitPlayerFormData,
  submitMatchFormData,
  closeModal,
  openModal,
  showGlobalMessage,
  toggleMembershipField,
  STATUS_LABELS,
  getClubMatchScheduleTemplates,
  createMatchScheduleSlotPicker,
  formatDateTimeLocal,
  loadEnrollments,
  loadEnrollmentRequests,
  invalidateLeaguePaymentsByCategory,
  reloadCategories,
  extractPhotoFromForm,
  renderClubProfile,
  applyRichTextCommand,
  sanitizeNoticeHtml,
  getRegulationHtml,
  entityHasRole,
  DEFAULT_CATEGORY_MATCH_FORMAT,
  MATCH_FORMAT_METADATA,
  WEEKDAY_OPTIONS,
  WEEKDAY_LABEL_BY_VALUE,
  getPlayerDisplayName,
  escapeHtml,
});

