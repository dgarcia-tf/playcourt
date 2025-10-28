export function createTournamentEnrollmentsModule(deps = {}) {
  const {
    state,
    request,
    buildPlayerCell,
    collectEnrollmentShirtSizes,
    TOURNAMENT_ENROLLMENT_ALL_OPTION,
    TOURNAMENT_ENROLLMENT_STATUS_LABELS,
    tournamentEnrollmentList,
    tournamentEnrollmentEmpty,
    tournamentEnrollmentCount,
    tournamentEnrollmentSearch,
    tournamentEnrollmentGender,
  } = deps;

  if (!state || typeof state !== 'object') {
    throw new Error('Missing application state for tournament enrollments module.');
  }
  if (typeof request !== 'function') {
    throw new Error('Missing request helper for tournament enrollments module.');
  }
  if (typeof buildPlayerCell !== 'function') {
    throw new Error('Missing buildPlayerCell helper for tournament enrollments module.');
  }
  if (typeof collectEnrollmentShirtSizes !== 'function') {
    throw new Error('Missing collectEnrollmentShirtSizes helper for tournament enrollments module.');
  }

  let pendingTournamentEnrollmentKey = '';

  function formatTournamentEnrollmentStatusLabel(status) {
    return TOURNAMENT_ENROLLMENT_STATUS_LABELS?.[status] || 'Sin estado';
  }

  function ensureTournamentEnrollmentFilters() {
    if (!state.tournamentEnrollmentFilters) {
      state.tournamentEnrollmentFilters = { search: '', gender: '' };
    }
    return state.tournamentEnrollmentFilters;
  }

  function clearTournamentEnrollmentFilters() {
    const filters = ensureTournamentEnrollmentFilters();
    filters.search = '';
    filters.gender = '';
    if (tournamentEnrollmentSearch) {
      tournamentEnrollmentSearch.value = '';
    }
    if (tournamentEnrollmentGender) {
      tournamentEnrollmentGender.value = '';
    }
  }

  function setTournamentEnrollmentFilterAvailability(enabled) {
    const filters = ensureTournamentEnrollmentFilters();
    if (tournamentEnrollmentSearch) {
      tournamentEnrollmentSearch.disabled = !enabled;
      tournamentEnrollmentSearch.value = enabled ? filters.search || '' : '';
      if (!enabled) {
        filters.search = '';
      }
    }
    if (tournamentEnrollmentGender) {
      tournamentEnrollmentGender.disabled = !enabled;
      tournamentEnrollmentGender.value = enabled ? filters.gender || '' : '';
      if (!enabled) {
        filters.gender = '';
      }
    }
  }

  function updateTournamentEnrollmentCount(total) {
    if (tournamentEnrollmentCount) {
      tournamentEnrollmentCount.textContent = String(Number.isFinite(total) ? total : 0);
    }
  }

  function getTournamentEnrollmentCacheKey(tournamentId, categoryId) {
    if (!tournamentId || !categoryId) {
      return '';
    }
    return `${tournamentId}:${categoryId}`;
  }

  function renderTournamentEnrollments(enrollments = [], { loading = false } = {}) {
    if (!tournamentEnrollmentList || !tournamentEnrollmentEmpty) return;

    tournamentEnrollmentList.innerHTML = '';
    const tournamentId = state.selectedEnrollmentTournamentId;
    const categoryId = state.selectedEnrollmentCategoryId;
    const hasSelection = Boolean(tournamentId && categoryId);
    const isAllPlayersView = categoryId === TOURNAMENT_ENROLLMENT_ALL_OPTION;

    setTournamentEnrollmentFilterAvailability(hasSelection);

    if (!hasSelection) {
      updateTournamentEnrollmentCount(0);
      tournamentEnrollmentEmpty.hidden = false;
      tournamentEnrollmentEmpty.textContent =
        'Selecciona un torneo para consultar los jugadores inscritos.';
      return;
    }

    if (loading) {
      updateTournamentEnrollmentCount(0);
      tournamentEnrollmentEmpty.hidden = false;
      tournamentEnrollmentEmpty.textContent = isAllPlayersView
        ? 'Cargando jugadores...'
        : 'Cargando inscripciones...';
      return;
    }

    const filters = ensureTournamentEnrollmentFilters();
    const searchFilter = (filters.search || '').trim().toLowerCase();
    const genderFilter = (filters.gender || '').trim().toLowerCase();

    const filteredEnrollments = enrollments.filter((enrollment) => {
      if (!enrollment) {
        return false;
      }

      const user = enrollment?.user || {};
      if (!user) {
        return false;
      }

      if (searchFilter) {
        const tokens = [];
        if (user.fullName) tokens.push(user.fullName);
        if (user.email) tokens.push(user.email);
        if (user.phone) tokens.push(user.phone);

        const categories = Array.isArray(enrollment?.tournamentCategories)
          ? enrollment.tournamentCategories
          : [];
        categories.forEach((category) => {
          const statusLabel = formatTournamentEnrollmentStatusLabel(category?.status || '');
          const name = category?.category?.menuTitle || category?.category?.name || '';
          if (name) tokens.push(name);
          if (statusLabel) tokens.push(statusLabel);
        });

        const searchSource = tokens
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchSource.includes(searchFilter)) {
          return false;
        }
      }

      if (genderFilter) {
        const userGender = (user.gender || '').toLowerCase();
        if (userGender !== genderFilter) {
          return false;
        }
      }

      return true;
    });

    updateTournamentEnrollmentCount(filteredEnrollments.length);

    if (!filteredEnrollments.length) {
      tournamentEnrollmentEmpty.hidden = false;
      tournamentEnrollmentEmpty.textContent = isAllPlayersView
        ? 'No hay jugadores que coincidan con los filtros aplicados.'
        : 'No hay inscripciones que coincidan con los filtros aplicados.';
      return;
    }

    tournamentEnrollmentEmpty.hidden = true;

    filteredEnrollments.forEach((enrollment) => {
      const user = enrollment?.user || {};
      const categories = Array.isArray(enrollment?.tournamentCategories)
        ? enrollment.tournamentCategories
        : [];

      const item = document.createElement('li');
      item.className = 'tournament-player-entry';

      const playerCell = buildPlayerCell(user, { includeSchedule: true, size: 'sm' });
      playerCell.classList.add('tournament-player-entry__player');
      item.appendChild(playerCell);

      if (categories.length) {
        const categoryRow = document.createElement('div');
        categoryRow.className = 'tournament-player-entry__categories';

        categories.forEach((category) => {
          const statusValue = category?.status || 'pendiente';
          const label = category?.category?.menuTitle || category?.category?.name || 'Categoría';
          const tag = document.createElement('span');
          tag.className = `tag status-${statusValue}`;
          tag.textContent = label;
          const statusLabel = formatTournamentEnrollmentStatusLabel(statusValue);
          if (statusLabel && statusLabel !== label) {
            tag.title = statusLabel;
          }
          categoryRow.appendChild(tag);
        });

        item.appendChild(categoryRow);
      }

      const meta = document.createElement('div');
      meta.className = 'meta tournament-player-entry__meta';

      const shirtSizes = collectEnrollmentShirtSizes(enrollment);
      if (shirtSizes.length) {
        const shirtSpan = document.createElement('span');
        shirtSpan.textContent =
          shirtSizes.length === 1
            ? `Camiseta: ${shirtSizes[0]}`
            : `Camisetas: ${shirtSizes.join(', ')}`;
        meta.appendChild(shirtSpan);
      }

      if (user.email) {
        const emailSpan = document.createElement('span');
        emailSpan.textContent = user.email;
        meta.appendChild(emailSpan);
      }

      if (user.phone) {
        const phoneSpan = document.createElement('span');
        phoneSpan.textContent = user.phone;
        meta.appendChild(phoneSpan);
      }

      if (meta.childElementCount) {
        item.appendChild(meta);
      }

      tournamentEnrollmentList.appendChild(item);
    });
  }

  async function fetchTournamentEnrollments(
    tournamentId,
    categoryId,
    { forceReload = false } = {}
  ) {
    if (!tournamentId || !categoryId) {
      return [];
    }

    const cacheKey = getTournamentEnrollmentCacheKey(tournamentId, categoryId);
    if (!forceReload && state.tournamentEnrollments.has(cacheKey)) {
      return state.tournamentEnrollments.get(cacheKey) || [];
    }

    const endpoint =
      categoryId === TOURNAMENT_ENROLLMENT_ALL_OPTION
        ? `/tournaments/${tournamentId}/enrollments`
        : `/tournaments/${tournamentId}/categories/${categoryId}/enrollments`;

    const response = await request(endpoint);
    const list = Array.isArray(response) ? response : [];
    state.tournamentEnrollments.set(cacheKey, list);
    return list;
  }

  async function refreshTournamentEnrollments({ forceReload = false } = {}) {
    const tournamentId = state.selectedEnrollmentTournamentId;
    const categoryId = state.selectedEnrollmentCategoryId;

    if (!tournamentId || !categoryId) {
      renderTournamentEnrollments([], { loading: false });
      return;
    }

    const cacheKey = getTournamentEnrollmentCacheKey(tournamentId, categoryId);
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
        if (tournamentEnrollmentList) {
          tournamentEnrollmentList.innerHTML = '';
        }
        if (tournamentEnrollmentEmpty) {
          tournamentEnrollmentEmpty.hidden = false;
          tournamentEnrollmentEmpty.textContent =
            error.message || 'No fue posible cargar las inscripciones.';
        }
        updateTournamentEnrollmentCount(0);
      }
    } finally {
      if (pendingTournamentEnrollmentKey === cacheKey) {
        pendingTournamentEnrollmentKey = '';
      }
    }
  }

  return {
    clearTournamentEnrollmentFilters,
    ensureTournamentEnrollmentFilters,
    fetchTournamentEnrollments,
    formatTournamentEnrollmentStatusLabel,
    getTournamentEnrollmentCacheKey,
    refreshTournamentEnrollments,
    renderTournamentEnrollments,
    setTournamentEnrollmentFilterAvailability,
    updateTournamentEnrollmentCount,
  };
}
