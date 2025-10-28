export function createLeagueRankingsModule(deps = {}) {
  const {
    state,
    request,
    ensureRankingFilters,
    getCategoryColor,
    createCategoryColorIndicator,
    translateGender,
    formatSkillLevelLabel,
    CATEGORY_STATUS_LABELS = {},
    resolveLeague,
    buildPlayerCell,
    buildPlayerCellMarkup,
    createMovementBadge,
    getPodiumEmoji,
    normalizeId,
    isAdmin,
    rankingCategoryList,
    rankingEmpty,
    rankingStatus,
    rankingLeagueFilter,
    setStatusMessage,
    showGlobalMessage,
    getLeagueCategories,
    getLeagueIdForCategory,
    formatLeagueOptionLabel,
    openModal,
    closeModal,
    escapeHtml,
  } = deps;

  if (!state || typeof state !== 'object') {
    throw new Error('Missing application state for league rankings module.');
  }
  if (typeof request !== 'function') {
    throw new Error('Missing request dependency for league rankings module.');
  }
  if (typeof ensureRankingFilters !== 'function') {
    throw new Error('Missing ensureRankingFilters dependency for league rankings module.');
  }
  if (typeof getCategoryColor !== 'function') {
    throw new Error('Missing getCategoryColor dependency for league rankings module.');
  }
  if (typeof createCategoryColorIndicator !== 'function') {
    throw new Error('Missing createCategoryColorIndicator dependency for league rankings module.');
  }
  if (typeof translateGender !== 'function') {
    throw new Error('Missing translateGender dependency for league rankings module.');
  }
  if (typeof formatSkillLevelLabel !== 'function') {
    throw new Error('Missing formatSkillLevelLabel dependency for league rankings module.');
  }
  if (typeof resolveLeague !== 'function') {
    throw new Error('Missing resolveLeague dependency for league rankings module.');
  }
  if (typeof buildPlayerCell !== 'function') {
    throw new Error('Missing buildPlayerCell dependency for league rankings module.');
  }
  if (typeof buildPlayerCellMarkup !== 'function') {
    throw new Error('Missing buildPlayerCellMarkup dependency for league rankings module.');
  }
  if (typeof createMovementBadge !== 'function') {
    throw new Error('Missing createMovementBadge dependency for league rankings module.');
  }
  if (typeof getPodiumEmoji !== 'function') {
    throw new Error('Missing getPodiumEmoji dependency for league rankings module.');
  }
  if (typeof normalizeId !== 'function') {
    throw new Error('Missing normalizeId dependency for league rankings module.');
  }
  if (typeof isAdmin !== 'function') {
    throw new Error('Missing isAdmin dependency for league rankings module.');
  }
  if (typeof setStatusMessage !== 'function') {
    throw new Error('Missing setStatusMessage dependency for league rankings module.');
  }
  if (typeof showGlobalMessage !== 'function') {
    throw new Error('Missing showGlobalMessage dependency for league rankings module.');
  }
  if (typeof getLeagueCategories !== 'function') {
    throw new Error('Missing getLeagueCategories dependency for league rankings module.');
  }
  if (typeof getLeagueIdForCategory !== 'function') {
    throw new Error('Missing getLeagueIdForCategory dependency for league rankings module.');
  }
  if (typeof formatLeagueOptionLabel !== 'function') {
    throw new Error('Missing formatLeagueOptionLabel dependency for league rankings module.');
  }
  if (typeof openModal !== 'function' || typeof closeModal !== 'function') {
    throw new Error('Missing modal utilities for league rankings module.');
  }
  if (typeof escapeHtml !== 'function') {
    throw new Error('Missing escapeHtml dependency for league rankings module.');
  }

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
    const filters = ensureRankingFilters();
    const leagueFilter = filters.league || '';
    const filteredCategories = leagueFilter
      ? categories.filter((category) => normalizeId(category?.league) === leagueFilter)
      : categories;
    rankingCategoryList.innerHTML = '';

    if (!categories.length) {
      if (rankingEmpty) {
        rankingEmpty.hidden = false;
        rankingEmpty.textContent = isAdmin()
          ? 'Crea una categoría para ver el ranking.'
          : 'Aún no hay categorías registradas.';
      }
      setRankingStatusMessage('', '');
      state.selectedCategoryId = null;
      return;
    }

    if (!filteredCategories.length) {
      if (rankingEmpty) {
        rankingEmpty.hidden = false;
        rankingEmpty.textContent = 'No hay categorías con ranking para la liga seleccionada.';
      }
      setRankingStatusMessage('', '');
      state.selectedCategoryId = null;
      return;
    }

    if (rankingEmpty) {
      rankingEmpty.hidden = true;
    }

    let anyLoading = false;
    let anyError = false;

    const sortedCategories = filteredCategories
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));

    const availableIds = sortedCategories
      .map((category) => normalizeId(category))
      .filter(Boolean);

    if (!availableIds.includes(state.selectedCategoryId)) {
      state.selectedCategoryId = availableIds[0] || null;
    }

    sortedCategories.forEach((category) => {
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
    const categoryMap = new Map();
    const categoryIds = categories
      .map((category) => {
        const id = normalizeId(category);
        if (id) {
          categoryMap.set(id, category);
        }
        return id;
      })
      .filter(Boolean);

    Array.from(state.rankingsByCategory.keys()).forEach((storedId) => {
      if (!categoryIds.includes(storedId)) {
        state.rankingsByCategory.delete(storedId);
      }
    });

    if (!categoryIds.length) {
      state.rankingsLoading = false;
      rankingCategoryList.innerHTML = '';
      if (rankingEmpty) {
        rankingEmpty.hidden = false;
        rankingEmpty.textContent = isAdmin()
          ? 'Crea una categoría para ver el ranking.'
          : 'Aún no hay categorías registradas.';
      }
      setRankingStatusMessage('', '');
      state.selectedCategoryId = null;
      return;
    }

    const filters = ensureRankingFilters();
    const leagueFilter = filters.league || '';
    const filteredCategoryIds = leagueFilter
      ? categoryIds.filter((categoryId) => {
          const category = categoryMap.get(categoryId);
          return normalizeId(category?.league) === leagueFilter;
        })
      : categoryIds;

    if (filteredCategoryIds.length) {
      if (!state.selectedCategoryId || !filteredCategoryIds.includes(state.selectedCategoryId)) {
        state.selectedCategoryId = filteredCategoryIds[0] || null;
      }
    } else if (leagueFilter) {
      state.selectedCategoryId = null;
    } else if (!state.selectedCategoryId || !categoryIds.includes(state.selectedCategoryId)) {
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
    const leagues = Array.isArray(state.leagues) ? state.leagues.slice() : [];

    if (!leagues.length) {
      showGlobalMessage('No hay ligas disponibles para imprimir.', 'info');
      return;
    }

    if (!categories.length) {
      showGlobalMessage('No hay categorías disponibles para imprimir.', 'info');
      return;
    }

    const rankingFilters = ensureRankingFilters();
    const normalizedDefaultCategoryId = defaultCategoryId ? normalizeId(defaultCategoryId) : '';
    const defaultLeagueFromCategory = normalizedDefaultCategoryId
      ? getLeagueIdForCategory(normalizedDefaultCategoryId)
      : '';

    const form = document.createElement('form');
    form.className = 'form';

    const status = document.createElement('p');
    status.className = 'status-message';
    status.style.display = 'none';

    const leagueLabel = document.createElement('label');
    leagueLabel.textContent = 'Liga';
    const leagueSelect = document.createElement('select');
    leagueSelect.name = 'leagueId';
    leagueSelect.required = true;

    const categoryLabel = document.createElement('label');
    categoryLabel.textContent = 'Categoría';
    const categorySelect = document.createElement('select');
    categorySelect.name = 'categoryId';
    categorySelect.required = true;

    let submitButton = null;

    const updateCategoryOptions = (leagueId, { preserveSelection = false } = {}) => {
      const previousValue = preserveSelection ? categorySelect.value : '';
      categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';

      const options = getLeagueCategories(leagueId)
        .slice()
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));

      const availableIds = new Set();
      options.forEach((category) => {
        const categoryId = normalizeId(category);
        if (!categoryId || availableIds.has(categoryId)) {
          return;
        }
        availableIds.add(categoryId);
        const option = document.createElement('option');
        option.value = categoryId;
        option.textContent = category.name || 'Categoría';
        categorySelect.appendChild(option);
      });

      let nextValue = '';
      if (preserveSelection && previousValue && availableIds.has(previousValue)) {
        nextValue = previousValue;
      } else if (normalizedDefaultCategoryId && availableIds.has(normalizedDefaultCategoryId)) {
        nextValue = normalizedDefaultCategoryId;
      } else if (availableIds.size) {
        nextValue = availableIds.values().next().value;
      }

      categorySelect.value = nextValue || '';

      const hasOptions = Boolean(availableIds.size);
      categorySelect.disabled = !hasOptions;

      if (submitButton) {
        submitButton.disabled = !hasOptions;
      }

      if (!hasOptions) {
        setStatusMessage(status, 'info', 'Esta liga no tiene categorías disponibles.');
      } else {
        setStatusMessage(status, '', '');
      }

      return { hasOptions, nextValue };
    };

    leagueSelect.innerHTML = '<option value="">Selecciona una liga</option>';

    const toChronoTimestamp = (value) => {
      if (!value) {
        return Number.POSITIVE_INFINITY;
      }
      const date = value instanceof Date ? value : new Date(value);
      const time = date.getTime();
      return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
    };

    const getLeagueChronoValue = (league) => {
      if (!league || typeof league !== 'object') {
        return Number.POSITIVE_INFINITY;
      }

      const startTimestamp = toChronoTimestamp(league.startDate);
      if (Number.isFinite(startTimestamp)) {
        return startTimestamp;
      }

      const numericYear = Number(league.year);
      if (Number.isFinite(numericYear)) {
        const normalizedYear = Math.trunc(numericYear);
        const yearDate = new Date(normalizedYear, 0, 1);
        const yearTimestamp = yearDate.getTime();
        if (Number.isFinite(yearTimestamp)) {
          return yearTimestamp;
        }
      }

      const createdTimestamp = toChronoTimestamp(league.createdAt);
      if (Number.isFinite(createdTimestamp)) {
        return createdTimestamp;
      }

      return Number.POSITIVE_INFINITY;
    };

    leagues.sort((a, b) => {
      const chronoDiff = getLeagueChronoValue(a) - getLeagueChronoValue(b);
      if (chronoDiff !== 0) {
        return chronoDiff;
      }
      return formatLeagueOptionLabel(a).localeCompare(formatLeagueOptionLabel(b), 'es', {
        sensitivity: 'base',
      });
    });

    const availableLeagueIds = new Set();
    leagues.forEach((league) => {
      const leagueId = normalizeId(league);
      if (!leagueId || availableLeagueIds.has(leagueId)) {
        return;
      }
      availableLeagueIds.add(leagueId);
      const option = document.createElement('option');
      option.value = leagueId;
      option.textContent = formatLeagueOptionLabel(league);
      leagueSelect.appendChild(option);
    });

    let initialLeagueId = defaultLeagueFromCategory || rankingFilters.league || '';
    if (!initialLeagueId || !availableLeagueIds.has(initialLeagueId)) {
      initialLeagueId = availableLeagueIds.values().next()?.value || '';
    }

    if (initialLeagueId) {
      leagueSelect.value = initialLeagueId;
      rankingFilters.league = initialLeagueId;
    }

    leagueLabel.appendChild(leagueSelect);
    form.appendChild(leagueLabel);

    categoryLabel.appendChild(categorySelect);
    form.appendChild(categoryLabel);

    const actions = document.createElement('div');
    actions.className = 'form-actions';

    submitButton = document.createElement('button');
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

    const { hasOptions } = updateCategoryOptions(initialLeagueId);
    submitButton.disabled = !hasOptions;

    leagueSelect.addEventListener('change', () => {
      const filters = ensureRankingFilters();
      filters.league = leagueSelect.value || '';
      updateCategoryOptions(leagueSelect.value, { preserveSelection: true });
    });

    categorySelect.addEventListener('change', () => {
      if (submitButton) {
        submitButton.disabled = !categorySelect.value;
      }
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const leagueId = leagueSelect.value;
      if (!leagueId) {
        setStatusMessage(status, 'error', 'Selecciona una liga.');
        return;
      }

      const categoryId = categorySelect.value;
      if (!categoryId) {
        setStatusMessage(status, 'error', 'Selecciona una categoría.');
        return;
      }

      submitButton.disabled = true;
      setStatusMessage(status, 'info', 'Preparando vista de impresión...');
      try {
        const filters = ensureRankingFilters();
        filters.league = leagueId;
        await printRankingSheet(categoryId);
        closeModal();
        setStatusMessage(status, '', '');
      } catch (error) {
        setStatusMessage(status, 'error', error.message);
      } finally {
        submitButton.disabled = !categorySelect.value;
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

  function updateRankingFilterControls({ renderOnChange = true } = {}) {
    if (!rankingLeagueFilter) return;

    const filters = ensureRankingFilters();
    const previousValue = filters.league || '';

    rankingLeagueFilter.innerHTML = '';

    const categories = Array.isArray(state.categories) ? state.categories : [];
    const leagueOptions = new Map();

    const toChronoTimestamp = (value) => {
      if (!value) {
        return Number.POSITIVE_INFINITY;
      }

      const date = value instanceof Date ? value : new Date(value);
      const time = date.getTime();
      return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
    };

    const compareChronologically = (a, b) => {
      if (!a && !b) {
        return 0;
      }
      if (!a) {
        return 1;
      }
      if (!b) {
        return -1;
      }

      const startDiff = toChronoTimestamp(a.startDate) - toChronoTimestamp(b.startDate);
      if (startDiff !== 0) {
        return startDiff;
      }

      const endDiff = toChronoTimestamp(a.endDate) - toChronoTimestamp(b.endDate);
      if (endDiff !== 0) {
        return endDiff;
      }

      const nameA = typeof a.name === 'string' ? a.name : '';
      const nameB = typeof b.name === 'string' ? b.name : '';
      return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
    };

    categories.forEach((category) => {
      const league = resolveLeague(category.league);
      const leagueId = league ? normalizeId(league) : normalizeId(category.league);
      if (!leagueId || leagueOptions.has(leagueId)) {
        return;
      }
      const label = league ? formatLeagueOptionLabel(league) : 'Liga';
      leagueOptions.set(leagueId, { label, league });
    });

    const sortedOptions = Array.from(leagueOptions.entries()).sort((a, b) => {
      const leagueA = a[1].league;
      const leagueB = b[1].league;
      const diff = compareChronologically(leagueA, leagueB);
      if (diff !== 0) {
        return diff;
      }
      return a[1].label.localeCompare(b[1].label, 'es');
    });

    sortedOptions.forEach(([leagueId, data]) => {
      const option = document.createElement('option');
      option.value = leagueId;
      option.textContent = data.label;
      rankingLeagueFilter.appendChild(option);
    });

    const availableIds = new Set(sortedOptions.map(([leagueId]) => leagueId));
    let nextValue = '';
    if (availableIds.has(previousValue)) {
      nextValue = previousValue;
    } else if (sortedOptions.length) {
      nextValue = sortedOptions[0][0];
    }
    const selectionChanged = nextValue !== previousValue;

    filters.league = nextValue;
    rankingLeagueFilter.value = nextValue;
    rankingLeagueFilter.disabled = !availableIds.size;

    if (selectionChanged && renderOnChange) {
      renderRankingSections();
    }
  }

  return {
    setRankingStatusMessage,
    renderRankingSections,
    refreshAllRankings,
    openRankingPrintModal,
    updateRankingFilterControls,
  };
}
