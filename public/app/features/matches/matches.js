export function createMatchesModule(deps = {}) {
  const {
    state,
    MATCHES_PER_PAGE,
    UNCATEGORIZED_CATEGORY_KEY,
    UNCATEGORIZED_CATEGORY_LABEL,
    MATCH_CALENDAR_DEFAULT_DURATION_MINUTES,
    STATUS_LABELS = {},
    upcomingList,
    pendingApprovalsList,
    completedMatchesList,
    myMatchesList,
    getCategoryColor,
    createCategoryColorIndicator,
    applyCategoryColorStyles,
    applyCategoryTagColor,
    formatDate,
    getExpirationWarningMessage,
    getMatchExpirationDate,
    formatExpirationDeadline,
    getPlayerDisplayName,
    formatMatchScore,
    createResultScoreboard,
    isAdmin,
    normalizeId,
    getResultConfirmation,
    updateMatchesMenuBadge,
    matchProposals = {},
  } = deps;

  if (!state || typeof state !== 'object') {
    throw new Error('Missing application state for matches module.');
  }
  if (!Number.isFinite(Number(MATCHES_PER_PAGE)) || MATCHES_PER_PAGE <= 0) {
    throw new Error('Missing MATCHES_PER_PAGE constant for matches module.');
  }
  if (typeof UNCATEGORIZED_CATEGORY_KEY !== 'string') {
    throw new Error('Missing UNCATEGORIZED_CATEGORY_KEY constant for matches module.');
  }
  if (typeof UNCATEGORIZED_CATEGORY_LABEL !== 'string') {
    throw new Error('Missing UNCATEGORIZED_CATEGORY_LABEL constant for matches module.');
  }
  if (!Number.isFinite(Number(MATCH_CALENDAR_DEFAULT_DURATION_MINUTES))) {
    throw new Error('Missing MATCH_CALENDAR_DEFAULT_DURATION_MINUTES constant for matches module.');
  }
  if (!(upcomingList instanceof Element)) {
    throw new Error('Missing upcomingList element for matches module.');
  }
  if (!(pendingApprovalsList instanceof Element)) {
    throw new Error('Missing pendingApprovalsList element for matches module.');
  }
  if (!(completedMatchesList instanceof Element)) {
    throw new Error('Missing completedMatchesList element for matches module.');
  }
  if (!(myMatchesList instanceof Element)) {
    throw new Error('Missing myMatchesList element for matches module.');
  }
  if (typeof getCategoryColor !== 'function') {
    throw new Error('Missing getCategoryColor dependency for matches module.');
  }
  if (typeof createCategoryColorIndicator !== 'function') {
    throw new Error('Missing createCategoryColorIndicator dependency for matches module.');
  }
  if (typeof applyCategoryColorStyles !== 'function') {
    throw new Error('Missing applyCategoryColorStyles dependency for matches module.');
  }
  if (typeof applyCategoryTagColor !== 'function') {
    throw new Error('Missing applyCategoryTagColor dependency for matches module.');
  }
  if (typeof formatDate !== 'function') {
    throw new Error('Missing formatDate dependency for matches module.');
  }
  if (typeof getExpirationWarningMessage !== 'function') {
    throw new Error('Missing getExpirationWarningMessage dependency for matches module.');
  }
  if (typeof getMatchExpirationDate !== 'function') {
    throw new Error('Missing getMatchExpirationDate dependency for matches module.');
  }
  if (typeof formatExpirationDeadline !== 'function') {
    throw new Error('Missing formatExpirationDeadline dependency for matches module.');
  }
  if (typeof getPlayerDisplayName !== 'function') {
    throw new Error('Missing getPlayerDisplayName dependency for matches module.');
  }
  if (typeof formatMatchScore !== 'function') {
    throw new Error('Missing formatMatchScore dependency for matches module.');
  }
  if (typeof createResultScoreboard !== 'function') {
    throw new Error('Missing createResultScoreboard dependency for matches module.');
  }
  if (typeof isAdmin !== 'function') {
    throw new Error('Missing isAdmin dependency for matches module.');
  }
  if (typeof normalizeId !== 'function') {
    throw new Error('Missing normalizeId dependency for matches module.');
  }
  if (typeof getResultConfirmation !== 'function') {
    throw new Error('Missing getResultConfirmation dependency for matches module.');
  }
  if (typeof updateMatchesMenuBadge !== 'function') {
    throw new Error('Missing updateMatchesMenuBadge dependency for matches module.');
  }

  const {
    closeProposalForm = () => {},
    hasActiveProposalForm = () => false,
    attachActiveProposalForm = () => false,
  } = matchProposals;

  function getMatchCalendarDurationMinutes(match) {
    const duration = Number(match?.durationMinutes);
    if (Number.isFinite(duration) && duration > 0) {
      return Math.round(duration);
    }
    return MATCH_CALENDAR_DEFAULT_DURATION_MINUTES;
  }

  function formatCalendarDateTimeUTC(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
  }

  function escapeICSValue(value = '') {
    return String(value)
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\r?\n/g, '\\n');
  }

  function buildMatchCalendarSummary(match, playersLabel) {
    if (playersLabel && playersLabel !== 'Jugadores por definir') {
      return `Partido: ${playersLabel}`;
    }
    if (match?.category?.name) {
      return `Partido de ${match.category.name}`;
    }
    return 'Partido programado';
  }

  function buildMatchCalendarDescription(match, playersLabel, startDate) {
    const descriptionParts = [];
    if (playersLabel) {
      descriptionParts.push(`Jugadores: ${playersLabel}.`);
    }
    const formattedDate = formatDate(startDate);
    if (formattedDate && formattedDate !== 'Por confirmar') {
      descriptionParts.push(`Horario: ${formattedDate}.`);
    }
    if (match?.category?.name) {
      descriptionParts.push(`Categoría: ${match.category.name}.`);
    }
    if (typeof match?.notes === 'string') {
      const trimmedNotes = match.notes.trim();
      if (trimmedNotes) {
        descriptionParts.push(trimmedNotes);
      }
    }
    return descriptionParts.join(' ').trim();
  }

  function buildMatchCalendarLocation(match) {
    if (!match) {
      return '';
    }
    const locationParts = [];
    if (match.court) {
      locationParts.push(`Pista ${match.court}`);
    }
    const facilityName = typeof match.facility?.name === 'string' ? match.facility.name.trim() : '';
    if (facilityName) {
      locationParts.push(facilityName);
    }
    return locationParts.join(' · ');
  }

  function buildGoogleCalendarUrl({ summary, description, location, startDate, endDate }) {
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', summary);
    const start = formatCalendarDateTimeUTC(startDate);
    const end = formatCalendarDateTimeUTC(endDate);
    if (!start || !end) {
      return null;
    }
    url.searchParams.set('dates', `${start}/${end}`);
    if (description) {
      url.searchParams.set('details', description);
    }
    if (location) {
      url.searchParams.set('location', location);
    }
    return url.toString();
  }

  function buildOutlookCalendarUrl({ summary, description, location, startDate, endDate }) {
    const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
    url.searchParams.set('path', '/calendar/action/compose');
    url.searchParams.set('rru', 'addevent');
    url.searchParams.set('subject', summary);
    if (description) {
      url.searchParams.set('body', description);
    }
    if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
      return null;
    }
    if (!(endDate instanceof Date) || Number.isNaN(endDate.getTime())) {
      return null;
    }
    url.searchParams.set('startdt', startDate.toISOString());
    url.searchParams.set('enddt', endDate.toISOString());
    url.searchParams.set('allday', 'false');
    if (location) {
      url.searchParams.set('location', location);
    }
    return url.toString();
  }

  function buildMatchCalendarFileName(match, startDate, playersLabel) {
    const baseParts = [];
    if (playersLabel) {
      baseParts.push(playersLabel);
    } else if (match?.category?.name) {
      baseParts.push(match.category.name);
    } else {
      baseParts.push('partido');
    }
    if (startDate instanceof Date && !Number.isNaN(startDate.getTime())) {
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const hours = String(startDate.getHours()).padStart(2, '0');
      const minutes = String(startDate.getMinutes()).padStart(2, '0');
      baseParts.push(`${year}${month}${day}-${hours}${minutes}`);
    }

    const combined = baseParts.join(' ');
    const slug = combined
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    return `${slug || 'partido'}.ics`;
  }

  function buildAppleCalendarDataUrl(match, summary, description, location, startDate, endDate, playersLabel) {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'PRODID:-//C.N. Playa San Marcos//Matches//ES',
      'BEGIN:VEVENT',
    ];

    const uidSource = match?._id || match?.id || `${startDate.getTime()}-${endDate.getTime()}`;
    const dtStart = formatCalendarDateTimeUTC(startDate);
    const dtEnd = formatCalendarDateTimeUTC(endDate);
    if (!dtStart || !dtEnd) {
      return null;
    }
    lines.push(`UID:match-${uidSource}@cnplayasanmarcos`);
    lines.push(`DTSTAMP:${formatCalendarDateTimeUTC(new Date())}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    if (summary) {
      lines.push(`SUMMARY:${escapeICSValue(summary)}`);
    }
    if (description) {
      lines.push(`DESCRIPTION:${escapeICSValue(description)}`);
    }
    if (location) {
      lines.push(`LOCATION:${escapeICSValue(location)}`);
    }
    lines.push('END:VEVENT');
    lines.push('END:VCALENDAR');

    const content = `${lines.join('\r\n')}\r\n`;
    const encoded = encodeURIComponent(content);
    const filename = buildMatchCalendarFileName(match, startDate, playersLabel);

    return { url: `data:text/calendar;charset=utf-8,${encoded}`, filename };
  }

  function createMatchCalendarActions(match, playersLabel) {
    if (!match?.scheduledAt || match?.status !== 'programado') {
      return null;
    }

    const startDate = new Date(match.scheduledAt);
    if (Number.isNaN(startDate.getTime())) {
      return null;
    }

    const durationMinutes = getMatchCalendarDurationMinutes(match);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const summary = buildMatchCalendarSummary(match, playersLabel);
    const description = buildMatchCalendarDescription(match, playersLabel, startDate);
    const location = buildMatchCalendarLocation(match);

    const googleUrl = buildGoogleCalendarUrl({ summary, description, location, startDate, endDate });
    const outlookUrl = buildOutlookCalendarUrl({ summary, description, location, startDate, endDate });
    const appleData = buildAppleCalendarDataUrl(
      match,
      summary,
      description,
      location,
      startDate,
      endDate,
      playersLabel,
    );

    if (!googleUrl && !outlookUrl && !appleData) {
      return null;
    }

    const container = document.createElement('div');
    container.className = 'match-calendar-actions';

    const label = document.createElement('span');
    label.className = 'match-calendar-actions__label';
    label.textContent = 'Añadir a tu calendario:';
    container.appendChild(label);

    if (googleUrl) {
      const googleLink = document.createElement('a');
      googleLink.className = 'ghost match-calendar-actions__link';
      googleLink.href = googleUrl;
      googleLink.target = '_blank';
      googleLink.rel = 'noopener noreferrer';
      googleLink.textContent = 'Google';
      container.appendChild(googleLink);
    }

    if (outlookUrl) {
      const outlookLink = document.createElement('a');
      outlookLink.className = 'ghost match-calendar-actions__link';
      outlookLink.href = outlookUrl;
      outlookLink.target = '_blank';
      outlookLink.rel = 'noopener noreferrer';
      outlookLink.textContent = 'Outlook';
      container.appendChild(outlookLink);
    }

    if (appleData) {
      const appleLink = document.createElement('a');
      appleLink.className = 'ghost match-calendar-actions__link';
      appleLink.href = appleData.url;
      appleLink.download = appleData.filename;
      appleLink.textContent = 'Apple';
      container.appendChild(appleLink);
    }

    return container;
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

    const calendarActions = createMatchCalendarActions(match, players);
    if (calendarActions) {
      item.appendChild(calendarActions);
    }

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

  function renderMatches(matches = [], container, emptyMessage, { listKey = 'upcoming' } = {}) {
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

  function renderMyMatches(matches = []) {
    const hadActiveProposalForm = Boolean(hasActiveProposalForm());
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
          match.proposal.proposedFor,
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
        rejected.textContent = 'El último resultado fue rechazado.';
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

      if (attachActiveProposalForm(item, matchId)) {
        proposalFormAttached = true;
      }

      myMatchesList.appendChild(item);
    });

    if (hadActiveProposalForm && !proposalFormAttached) {
      closeProposalForm();
    }
  }

  return {
    renderMatches,
    renderMyMatches,
    resetAllMatchPagination,
    handleMatchPagination,
  };
}
