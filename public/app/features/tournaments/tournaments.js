import { createTournamentBracketsModule } from './brackets.js';
import { createTournamentEnrollmentsModule } from './enrollments.js';
import { createTournamentPaymentsModule } from '../payments/tournament-payments.js';

export function createTournamentsModule(deps = {}) {
  const {
    DEFAULT_TOURNAMENT_CURRENCY,
    MATCH_FORMAT_LABELS,
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_ORDER,
    TOURNAMENT_BRACKET_REPLACEMENT_TOOLTIP,
    TOURNAMENT_BRACKET_RESULTS_REPLACEMENT_TOOLTIP,
    TOURNAMENT_CATEGORY_STATUS_LABELS,
    TOURNAMENT_ENROLLMENT_ALL_OPTION,
    TOURNAMENT_ENROLLMENT_STATUS_LABELS,
    TOURNAMENT_MATCH_STATUS_LABELS,
    TOURNAMENT_MATCH_TYPE_LABELS,
    TOURNAMENT_PAYMENT_METHOD_OPTIONS,
    TOURNAMENT_RESULT_STATUS_LABELS,
    TOURNAMENT_STATUS_LABELS,
    applyCategoryColorStyles,
    bracketMatchesHaveRecordedResults,
    buildDoublesPairMap,
    buildPlayerCell,
    buildSeedLookup,
    cloneNormalizedDoublesPair,
    closeModal,
    collectEnrollmentShirtSizes,
    createAvatarElement,
    createBracketMatchCard,
    createBracketRoundNavigation,
    createCategoryColorIndicator,
    createMatchScheduleSlotPicker,
    determineInitialBracketRoundIndex,
    ensurePlayersLoaded,
    entityHasRole,
    escapeHtml,
    formatCurrencyValue,
    formatDate,
    formatDateInput,
    formatDateOnly,
    formatDateRangeLabel,
    formatDateTimeLocal,
    formatShortDate,
    getCategoryColor,
    getClubMatchScheduleTemplates,
    getMatchDayKey,
    getPlayerDisplayName,
    globalTournamentsList,
    hasCourtManagementAccess,
    isAdmin,
    matchesRequireDoublesPairs,
    normalizeDoublesPair,
    normalizeId,
    openModal,
    renderDashboardMatchList,
    renderNotifications,
    request,
    scheduleOnNextAnimationFrame,
    setStatusMessage,
    showGlobalMessage,
    showSection,
    state,
    submitTournamentMatchResult,
    submitTournamentMatchSchedule,
    tournamentAdminEnrollButton,
    tournamentBracketEmpty,
    tournamentBracketGenerateButton,
    tournamentBracketLayout,
    tournamentBracketRecalculateButton,
    tournamentBracketSaveSeedsButton,
    tournamentBracketSeedsCard,
    tournamentBracketSeedsContainer,
    tournamentBracketSizeSelect,
    tournamentBracketStatus,
    tournamentBracketTournamentSelect,
    tournamentBracketView,
    tournamentCategoriesEmpty,
    tournamentCategoriesList,
    tournamentCategoriesPoster,
    tournamentCategoryCreateButton,
    tournamentCategoryTournamentSelect,
    tournamentConsolationEmpty,
    tournamentConsolationView,
    tournamentConsolationViewCard,
    tournamentDetailBody,
    tournamentDetailSubtitle,
    tournamentDetailTitle,
    tournamentDoublesContainer,
    tournamentDoublesEmpty,
    tournamentDoublesTournamentSelect,
    tournamentDrawCards,
    tournamentDrawGenerateButton,
    tournamentEditButton,
    tournamentEnrollmentAddButton,
    tournamentEnrollmentCount,
    tournamentEnrollmentEmpty,
    tournamentEnrollmentGender,
    tournamentEnrollmentList,
    tournamentEnrollmentSearch,
    tournamentEnrollmentTournamentSelect,
    tournamentMatchTournamentSelect,
    tournamentMatchesEmpty,
    tournamentMatchesList,
    tournamentMetricActive,
    tournamentMetricCategories,
    tournamentMetricUpcoming,
    tournamentOrderDayInput,
    tournamentOrderDownloadButton,
    tournamentPaymentsCount,
    tournamentPaymentsEmpty,
    tournamentPaymentsFeeBadge,
    tournamentPaymentsGroups,
    tournamentPaymentsMenuButton,
    tournamentPaymentsPaidCount,
    tournamentPaymentsPaidEmpty,
    tournamentPaymentsPaidList,
    tournamentPaymentsPaidTotal,
    tournamentPaymentsPendingCount,
    tournamentPaymentsPendingEmpty,
    tournamentPaymentsPendingList,
    tournamentPaymentsPendingTotal,
    tournamentPaymentsSearchInput,
    tournamentPaymentsSection,
    tournamentPaymentsStatusMessage,
    tournamentPaymentsTournamentSelect,
    tournamentUpcomingMatchesList,
    tournamentsList,
    translateGender,
    translateSchedule,
    updateBracketCategoryOptions,
    updateBracketSizeSelect,
    updateEnrollmentCategoryOptions,
    updateMatchCategoryOptions
  } = deps;

  let pendingTournamentDetailId = null;

  let pendingTournamentMatchesKey = '';

  let pendingTournamentDoublesId = '';

  const {
    clearTournamentEnrollmentFilters,
    ensureTournamentEnrollmentFilters,
    fetchTournamentEnrollments,
    formatTournamentEnrollmentStatusLabel,
    getTournamentEnrollmentCacheKey,
    refreshTournamentEnrollments,
    renderTournamentEnrollments,
    setTournamentEnrollmentFilterAvailability,
    updateTournamentEnrollmentCount,
  } = createTournamentEnrollmentsModule({
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
  });

  const {
    applyTournamentBracketRoundOffsets,
    collectTournamentSeedAssignments,
    createTournamentBracketSection,
    ensureTournamentBracketResizeHandler,
    getCachedTournamentBracketMatches,
    getTournamentBracketCacheKey,
    loadTournamentBracketContext,
    persistTournamentBracketSeeds,
    refreshTournamentBracketLayoutColumns,
    refreshTournamentBracketMatches,
    renderTournamentBracket,
    renderTournamentBracketSeeds,
    runTournamentBracketAlignmentCallbacks,
    scheduleTournamentBracketAlignment,
    validateTournamentSeedAssignments,
  } = createTournamentBracketsModule({
    state,
    request,
    isAdmin,
    normalizeId,
    getPlayerDisplayName,
    setStatusMessage,
    scheduleOnNextAnimationFrame,
    createBracketMatchCard,
    createBracketRoundNavigation,
    buildSeedLookup,
    determineInitialBracketRoundIndex,
    fetchTournamentEnrollments,
    fetchTournamentDoublesPairs,
    hydrateTournamentMatchesWithPairs,
    refreshTournamentDetail,
    updateTournamentCategoryCache,
    updateTournamentActionAvailability,
    updateBracketSizeSelect,
    getTournamentCategoryById,
    tournamentBracketLayout,
    tournamentBracketSeedsCard,
    tournamentBracketSeedsContainer,
    tournamentBracketSaveSeedsButton,
    tournamentBracketSizeSelect,
    tournamentBracketStatus,
    tournamentBracketView,
    tournamentBracketEmpty,
    tournamentConsolationView,
    tournamentConsolationEmpty,
    tournamentConsolationViewCard,
  });

  const tournamentPaymentsModule = createTournamentPaymentsModule({
    state,
    DEFAULT_TOURNAMENT_CURRENCY,
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_ORDER,
    TOURNAMENT_PAYMENT_METHOD_OPTIONS,
    formatCurrencyValue,
    formatShortDate,
    formatDateInput,
    normalizeId,
    setStatusMessage,
    request,
    isAdmin,
    showSection,
    getTournamentsWithEnrollmentFee,
    compareTournamentsBySchedule,
    getTournamentCategories,
    fetchTournamentEnrollments,
    loadTournamentDetail,
    refreshTournamentDetail,
    buildPlayerCell,
    tournamentPaymentsMenuButton,
    tournamentPaymentsSection,
    tournamentPaymentsGroups,
    tournamentPaymentsPendingList,
    tournamentPaymentsPendingEmpty,
    tournamentPaymentsPendingCount,
    tournamentPaymentsPendingTotal,
    tournamentPaymentsPaidList,
    tournamentPaymentsPaidEmpty,
    tournamentPaymentsPaidCount,
    tournamentPaymentsPaidTotal,
    tournamentPaymentsCount,
    tournamentPaymentsTournamentSelect,
    tournamentPaymentsSearchInput,
    tournamentPaymentsEmpty,
    tournamentPaymentsFeeBadge,
    tournamentPaymentsStatusMessage,
  });

  const {
    ensureTournamentPaymentFilters,
    updateTournamentPaymentFeeIndicator,
    formatTournamentPaymentTotal,
    updateTournamentPaymentTotalElement,
    calculateTournamentPaymentTotal,
    resetTournamentPaymentGroups,
    updateTournamentPaymentControls,
    createEmptyTournamentFeeInfo,
    resolveTournamentFeeInfo,
    getTournamentPaymentData,
    createTournamentPaymentItem,
    renderTournamentPayments,
    refreshTournamentPayments,
    handleTournamentPaymentFormSubmit,
    updateTournamentPaymentMenuVisibility,
  } = tournamentPaymentsModule;

  function tournamentHasEnrollmentFee(tournament) {
    if (!tournament) return false;
    const fees = Array.isArray(tournament.fees) ? tournament.fees : [];
    return fees.some((fee) => {
      const memberAmount = Number(fee?.memberAmount);
      const nonMemberAmount = Number(fee?.nonMemberAmount);
      const legacyAmount = Number(fee?.amount);
      return (
        (Number.isFinite(memberAmount) && memberAmount >= 0) ||
        (Number.isFinite(nonMemberAmount) && nonMemberAmount >= 0) ||
        (Number.isFinite(legacyAmount) && legacyAmount >= 0)
      );
    });
  }

  function getTournamentsWithEnrollmentFee() {
    return Array.isArray(state.tournaments)
      ? state.tournaments.filter((tournament) => tournamentHasEnrollmentFee(tournament))
      : [];
  }

  function compareTournamentsBySchedule(tournamentA, tournamentB) {
    const startA = Date.parse(tournamentA?.startDate);
    const startB = Date.parse(tournamentB?.startDate);
    const hasStartA = Number.isFinite(startA);
    const hasStartB = Number.isFinite(startB);
    if (hasStartA || hasStartB) {
      if (!hasStartA) return 1;
      if (!hasStartB) return -1;
      if (startA !== startB) {
        return startA - startB;
      }
    }

    const endA = Date.parse(tournamentA?.endDate);
    const endB = Date.parse(tournamentB?.endDate);
    const hasEndA = Number.isFinite(endA);
    const hasEndB = Number.isFinite(endB);
    if (hasEndA || hasEndB) {
      if (!hasEndA) return 1;
      if (!hasEndB) return -1;
      if (endA !== endB) {
        return endA - endB;
      }
    }

    const nameA = String(tournamentA?.name || '').toLocaleLowerCase('es');
    const nameB = String(tournamentB?.name || '').toLocaleLowerCase('es');
    return nameA.localeCompare(nameB, 'es');
  }

  function formatTournamentMatchType(value) {
    if (!value) return '';
    return TOURNAMENT_MATCH_TYPE_LABELS[value] || value;
  }

  function formatTournamentMatchFormat(value) {
    if (!value) return '';
    return MATCH_FORMAT_LABELS[value] || value;
  }

  function updateTournamentActionAvailability() {
    if (tournamentEditButton) {
      tournamentEditButton.disabled = !state.selectedTournamentId;
    }

    if (tournamentAdminEnrollButton) {
      tournamentAdminEnrollButton.disabled = !state.selectedTournamentId;
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

    const hasBracketSelection =
      Boolean(state.selectedBracketTournamentId) && Boolean(state.selectedBracketCategoryId);

    if (tournamentBracketSaveSeedsButton) {
      tournamentBracketSaveSeedsButton.disabled =
        !isAdmin() || !hasBracketSelection || !state.tournamentBracketSeedsDirty;
    }

    if (tournamentBracketGenerateButton) {
      let disableGenerate = !isAdmin() || !hasBracketSelection;
      let tooltipMessage = '';

      if (!disableGenerate) {
        const matches = getCachedTournamentBracketMatches(
          state.selectedBracketTournamentId,
          state.selectedBracketCategoryId
        );
        if (bracketMatchesHaveRecordedResults(matches)) {
          tooltipMessage = TOURNAMENT_BRACKET_RESULTS_REPLACEMENT_TOOLTIP;
        } else if (matches.length) {
          tooltipMessage = TOURNAMENT_BRACKET_REPLACEMENT_TOOLTIP;
        }
      }

      tournamentBracketGenerateButton.disabled = disableGenerate;
      if (tooltipMessage) {
        tournamentBracketGenerateButton.title = tooltipMessage;
      } else {
        tournamentBracketGenerateButton.removeAttribute('title');
      }
    }

    if (tournamentBracketRecalculateButton) {
      tournamentBracketRecalculateButton.disabled = !isAdmin() || !hasBracketSelection;
    }

    updateTournamentOrderOfPlayControls();
  }

  function getTournamentOrderOfPlayDays(tournamentId) {
    if (!tournamentId) {
      return [];
    }

    if (!(state.tournamentOrderOfPlayDays instanceof Map)) {
      state.tournamentOrderOfPlayDays = new Map();
      return [];
    }

    const days = state.tournamentOrderOfPlayDays.get(tournamentId);
    if (!days) {
      return [];
    }

    return Array.from(days).sort();
  }

  function recomputeTournamentOrderOfPlayDays(tournamentId) {
    if (!(state.tournamentOrderOfPlayDays instanceof Map)) {
      state.tournamentOrderOfPlayDays = new Map();
    }

    const normalizedTournamentId = normalizeId(tournamentId);
    if (!normalizedTournamentId) {
      return;
    }

    const days = new Set();

    if (state.tournamentMatches instanceof Map) {
      const prefix = `${normalizedTournamentId}:`;
      state.tournamentMatches.forEach((matches, key) => {
        if (typeof key !== 'string' || !key.startsWith(prefix)) {
          return;
        }
        if (!Array.isArray(matches)) {
          return;
        }
        matches.forEach((match) => {
          const day = getMatchDayKey(match);
          if (day) {
            days.add(day);
          }
        });
      });
    }

    if (days.size > 0) {
      state.tournamentOrderOfPlayDays.set(normalizedTournamentId, days);
    } else {
      state.tournamentOrderOfPlayDays.delete(normalizedTournamentId);
    }

    if (state.selectedMatchTournamentId === normalizedTournamentId) {
      updateTournamentOrderOfPlayControls();
    }
  }

  function updateTournamentOrderOfPlayControls() {
    if (!tournamentOrderDayInput && !tournamentOrderDownloadButton) {
      return;
    }

    const tournamentId = state.selectedMatchTournamentId || '';
    const hasTournament = Boolean(tournamentId);
    const availableDays = hasTournament ? getTournamentOrderOfPlayDays(tournamentId) : [];

    if (hasTournament && availableDays.length > 0 && !state.selectedOrderOfPlayDay) {
      state.selectedOrderOfPlayDay = availableDays[0];
    }

    if (!hasTournament) {
      state.selectedOrderOfPlayDay = '';
    }

    if (tournamentOrderDayInput) {
      tournamentOrderDayInput.disabled = !hasTournament;
      if (hasTournament) {
        tournamentOrderDayInput.value = state.selectedOrderOfPlayDay || '';
      } else {
        tournamentOrderDayInput.value = '';
      }
    }

    if (tournamentOrderDownloadButton) {
      tournamentOrderDownloadButton.disabled =
        !hasTournament || !state.selectedOrderOfPlayDay;
    }
  }

  function formatTournamentStatusLabel(status) {
    return TOURNAMENT_STATUS_LABELS[status] || 'Sin estado';
  }

  function formatTournamentCategoryStatusLabel(status) {
    return TOURNAMENT_CATEGORY_STATUS_LABELS[status] || 'Sin estado';
  }

  function formatTournamentMatchStatusLabel(status) {
    return TOURNAMENT_MATCH_STATUS_LABELS[status] || 'Sin estado';
  }

  function formatTournamentResultStatusLabel(status) {
    return TOURNAMENT_RESULT_STATUS_LABELS[status] || 'Sin estado';
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

  function renderGlobalTournaments(tournaments = []) {
    if (!globalTournamentsList) return;
    globalTournamentsList.innerHTML = '';

    const list = Array.isArray(tournaments) ? tournaments : [];

    if (!list.length) {
      globalTournamentsList.innerHTML = '<li class="empty-state">No hay torneos programados.</li>';
      return;
    }

    list.forEach((tournament) => {
      const tournamentId = normalizeId(tournament);
      const item = document.createElement('li');
      item.classList.add('global-overview-item');

      const content = document.createElement('div');
      content.className = 'list-item__content';
      item.appendChild(content);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'list-item-button';
      if (tournamentId) {
        button.dataset.globalTournamentId = tournamentId;
        button.setAttribute(
          'aria-label',
          `Inscribirse en el torneo ${tournament.name || 'sin nombre'}`
        );
      } else {
        button.disabled = true;
      }
      content.appendChild(button);

      const title = document.createElement('strong');
      title.textContent = tournament.name || 'Torneo sin nombre';
      button.appendChild(title);

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
        meta.appendChild(document.createElement('span')).textContent =
          categoriesCount === 1 ? '1 categoría' : `${categoriesCount} categorías`;
      }

      if (tournament.registrationCloseDate) {
        meta.appendChild(document.createElement('span')).textContent = `Inscripciones hasta ${formatDateOnly(tournament.registrationCloseDate)}`;
      }

      if (meta.childElementCount) {
        button.appendChild(meta);
      }

      if (tournamentId) {
        const hint = document.createElement('span');
        hint.className = 'note';
        hint.textContent = 'Haz clic para inscribirte';
        button.appendChild(hint);
      }

      const posterUrl = typeof tournament.poster === 'string' ? tournament.poster.trim() : '';
      if (posterUrl) {
        item.classList.add('list-item--with-poster');
        const posterWrapper = document.createElement('div');
        posterWrapper.className = 'list-item__poster';
        const poster = document.createElement('img');
        poster.className = 'list-item__poster-image';
        poster.src = posterUrl;
        poster.alt = tournament.name
          ? `Cartel del torneo ${tournament.name}`
          : 'Cartel del torneo';
        poster.loading = 'lazy';
        posterWrapper.appendChild(poster);
        item.appendChild(posterWrapper);
      }

      globalTournamentsList.appendChild(item);
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

  function getTournamentCategoryById(tournamentId, categoryId) {
    const normalizedCategoryId = normalizeId(categoryId);
    if (!normalizedCategoryId) {
      return null;
    }

    const categories = getTournamentCategories(tournamentId);
    return (
      categories.find((category) => normalizeId(category) === normalizedCategoryId) || null
    );
  }

  function updateTournamentCategoryCache(tournamentId, updatedCategory) {
    const normalizedTournamentId = normalizeId(tournamentId);
    const normalizedCategoryId = normalizeId(updatedCategory);

    if (!normalizedTournamentId || !normalizedCategoryId) {
      return;
    }

    const normalizedCategory = {
      ...updatedCategory,
      _id: normalizedCategoryId,
    };

    const mergeCategories = (categories) => {
      if (!Array.isArray(categories)) {
        return [normalizedCategory];
      }

      let found = false;
      const next = categories.map((category) => {
        if (normalizeId(category) === normalizedCategoryId) {
          found = true;
          return { ...category, ...normalizedCategory };
        }
        return category;
      });

      if (!found) {
        next.push(normalizedCategory);
      }

      return next;
    };

    if (state.tournamentDetails instanceof Map && state.tournamentDetails.has(normalizedTournamentId)) {
      const detail = state.tournamentDetails.get(normalizedTournamentId);
      const categories = mergeCategories(detail?.categories);
      state.tournamentDetails.set(normalizedTournamentId, {
        ...detail,
        categories,
      });
    }

    if (Array.isArray(state.tournaments) && state.tournaments.length) {
      state.tournaments = state.tournaments.map((tournament) => {
        if (normalizeId(tournament) !== normalizedTournamentId) {
          return tournament;
        }
        const categories = mergeCategories(tournament?.categories);
        return { ...tournament, categories };
      });
    }
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

    if (tournamentAdminEnrollButton) {
      tournamentAdminEnrollButton.hidden = true;
      tournamentAdminEnrollButton.disabled = true;
      delete tournamentAdminEnrollButton.dataset.tournamentId;
    }

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

    if (tournamentAdminEnrollButton) {
      const options = detail?.adminEnrollmentOptions;
      const canShow =
        isAdmin() &&
        Boolean(options?.canEnrollPlayers) &&
        Array.isArray(options?.categories) &&
        options.categories.length > 0;
      tournamentAdminEnrollButton.hidden = !canShow;
      tournamentAdminEnrollButton.disabled = !canShow;
      if (canShow) {
        tournamentAdminEnrollButton.dataset.tournamentId = tournamentId;
      } else {
        delete tournamentAdminEnrollButton.dataset.tournamentId;
      }
    }

    tournamentDetailBody.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const layout = document.createElement('div');
    layout.className = 'tournament-detail__layout';

    const content = document.createElement('div');
    content.className = 'tournament-detail__content';
    layout.appendChild(content);

    const posterUrl = typeof detail.poster === 'string' ? detail.poster.trim() : '';
    if (posterUrl) {
      const poster = document.createElement('img');
      poster.className = 'tournament-detail__poster';
      poster.src = posterUrl;
      poster.alt = detail.name ? `Afiche del torneo ${detail.name}` : 'Afiche del torneo';
      layout.appendChild(poster);
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

    const availableEnrollmentCategories = getTournamentCategories(tournamentId).filter((category) => {
      const id = normalizeId(category);
      if (!id) return false;
      return Boolean(category?.canRequestEnrollment);
    });

    if (!isAdmin() && state.token && availableEnrollmentCategories.length) {
      const actions = document.createElement('div');
      actions.className = 'tournament-detail__actions';

      const enrollButton = document.createElement('button');
      enrollButton.type = 'button';
      enrollButton.className = 'primary';
      enrollButton.dataset.tournamentAction = 'open-enrollment';
      enrollButton.dataset.tournamentId = tournamentId;
      enrollButton.textContent = 'Inscribirse';
      actions.appendChild(enrollButton);

      header.appendChild(actions);
    }

    content.appendChild(header);

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

    if (typeof detail.hasShirt === 'boolean') {
      metaItems.push(['Camiseta', detail.hasShirt ? 'Sí' : 'No']);
    }

    if (typeof detail.hasGiftBag === 'boolean') {
      metaItems.push(['Bolsa de regalo', detail.hasGiftBag ? 'Sí' : 'No']);
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
      content.appendChild(metaContainer);
    }

    const fees = Array.isArray(detail.fees)
      ? detail.fees.filter((fee) => {
          const memberAmount = Number(fee.memberAmount);
          const nonMemberAmount = Number(fee.nonMemberAmount);
          const legacyAmount = Number(fee.amount);
          const hasMemberAmount = Number.isFinite(memberAmount) && memberAmount >= 0;
          const hasNonMemberAmount = Number.isFinite(nonMemberAmount) && nonMemberAmount >= 0;
          const hasLegacyAmount = Number.isFinite(legacyAmount) && legacyAmount >= 0;
          return hasMemberAmount || hasNonMemberAmount || hasLegacyAmount;
        })
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
        amountSpan.className = 'tournament-fee__amounts';

        const parts = [];
        const currency = fee.currency;
        const formatAmount = (value) =>
          formatCurrencyValue(value, currency) || `${Number(value) || 0}`;

        const memberAmount = Number(fee.memberAmount);
        if (Number.isFinite(memberAmount) && memberAmount >= 0) {
          parts.push(`Socios: ${formatAmount(memberAmount)}`);
        }

        const nonMemberAmount = Number(fee.nonMemberAmount);
        if (Number.isFinite(nonMemberAmount) && nonMemberAmount >= 0) {
          parts.push(`No socios: ${formatAmount(nonMemberAmount)}`);
        }

        const legacyAmount = Number(fee.amount);
        if (!parts.length && Number.isFinite(legacyAmount) && legacyAmount >= 0) {
          parts.push(formatAmount(legacyAmount));
        }

        amountSpan.textContent = parts.join(' · ');

        feeRow.appendChild(labelSpan);
        feeRow.appendChild(amountSpan);
        feesList.appendChild(feeRow);
      });

      feesWrapper.appendChild(feesList);
      content.appendChild(feesWrapper);
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

          if (category.matchType) {
            const typeSpan = document.createElement('span');
            typeSpan.textContent = formatTournamentMatchType(category.matchType);
            metaLine.appendChild(typeSpan);
          }

          if (category.matchFormat) {
            const formatSpan = document.createElement('span');
            formatSpan.textContent = formatTournamentMatchFormat(category.matchFormat);
            metaLine.appendChild(formatSpan);
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

          if (!category.canRequestEnrollment && !userEnrollment && !isAdmin()) {
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
      content.appendChild(categoryWrapper);
    } else {
      const emptyNote = document.createElement('p');
      emptyNote.className = 'tournament-section-note';
      emptyNote.textContent = 'Este torneo aún no tiene categorías registradas.';
      content.appendChild(emptyNote);
    }

    fragment.appendChild(layout);
    tournamentDetailBody.appendChild(fragment);
  }

  async function openTournamentSelfEnrollmentModal({
    tournamentId = state.selectedTournamentId,
    categoryId = '',
    allowMultiple = false,
  } = {}) {
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

    let categorySelect = null;
    let categoryCountSelect = null;
    let categoryCheckboxes = [];
    let selectionHint = null;

    const sortedCategories = categories
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));

    if (allowMultiple) {
      const countLabel = document.createElement('label');
      countLabel.textContent = 'Número de categorías';
      const countSelect = document.createElement('select');
      countSelect.name = 'categoryCount';
      countSelect.required = true;

      sortedCategories.forEach((_, index) => {
        const option = document.createElement('option');
        const count = index + 1;
        option.value = String(count);
        option.textContent = count === 1 ? '1 categoría' : `${count} categorías`;
        countSelect.appendChild(option);
      });

      countLabel.appendChild(countSelect);
      form.appendChild(countLabel);

      const categoryFieldset = document.createElement('fieldset');
      categoryFieldset.className = 'checkbox-group';
      const legend = document.createElement('legend');
      legend.textContent = 'Categorías disponibles';
      categoryFieldset.appendChild(legend);

      selectionHint = document.createElement('p');
      selectionHint.className = 'form-hint';
      categoryFieldset.appendChild(selectionHint);

      categoryCheckboxes = sortedCategories.map((category) => {
        const id = normalizeId(category);
        if (!id) return null;
        const optionLabel = document.createElement('label');
        optionLabel.className = 'checkbox-option';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'categoryIds';
        checkbox.value = id;
        optionLabel.appendChild(checkbox);
        const text = document.createElement('span');
        text.textContent = category.name || 'Categoría';
        optionLabel.appendChild(text);
        categoryFieldset.appendChild(optionLabel);
        return checkbox;
      }).filter(Boolean);

      form.appendChild(categoryFieldset);

      const updateSelectionHint = () => {
        const desired = Number(countSelect.value || '0');
        const selected = categoryCheckboxes.filter((checkbox) => checkbox.checked).length;
        if (desired > 0) {
          selectionHint.textContent =
            desired === 1
              ? `Selecciona 1 categoría (actualmente ${selected}).`
              : `Selecciona ${desired} categorías (actualmente ${selected}).`;
        } else {
          selectionHint.textContent = 'Selecciona las categorías en las que deseas inscribirte.';
        }
      };

      countSelect.addEventListener('change', () => {
        updateSelectionHint();
      });

      categoryCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          updateSelectionHint();
        });
      });

      updateSelectionHint();
      categoryCountSelect = countSelect;
    } else {
      const categoryLabel = document.createElement('label');
      categoryLabel.textContent = 'Categoría';
      const singleSelect = document.createElement('select');
      singleSelect.name = 'categoryId';
      singleSelect.required = true;

      sortedCategories.forEach((category) => {
        const id = normalizeId(category);
        if (!id) return;
        const option = document.createElement('option');
        option.value = id;
        option.textContent = category.name || 'Categoría';
        singleSelect.appendChild(option);
      });

      if (categoryId) {
        singleSelect.value = categoryId;
      }

      categoryLabel.appendChild(singleSelect);
      form.appendChild(categoryLabel);
      categorySelect = singleSelect;
    }

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
    submitButton.textContent = allowMultiple ? 'Enviar solicitudes' : 'Enviar solicitud';
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
      let selectedCategories = [];

      if (allowMultiple) {
        const desiredCount = Number(categoryCountSelect?.value || '0');
        const checked = categoryCheckboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
        if (!desiredCount || !Number.isFinite(desiredCount)) {
          setStatusMessage(status, 'error', 'Selecciona cuántas categorías deseas.');
          return;
        }
        if (checked.length !== desiredCount) {
          setStatusMessage(
            status,
            'error',
            desiredCount === 1
              ? 'Debes seleccionar exactamente 1 categoría.'
              : `Debes seleccionar exactamente ${desiredCount} categorías.`,
          );
          return;
        }
        selectedCategories = checked;
      } else if (categorySelect) {
        const selectedCategory = categorySelect.value;
        if (!selectedCategory) {
          setStatusMessage(status, 'error', 'Selecciona una categoría.');
          return;
        }
        selectedCategories = [selectedCategory];
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
      setStatusMessage(status, 'info', allowMultiple ? 'Enviando solicitudes...' : 'Enviando solicitud...');

      const processedCategories = [];
      const refreshContext = async () => {
        state.tournamentDetails.delete(targetTournamentId);
        await Promise.all([
          reloadTournaments({ selectTournamentId: targetTournamentId }),
          refreshTournamentDetail(targetTournamentId),
        ]);
        if (state.notificationBase !== null) {
          renderNotifications(state.notificationBase || []);
        }
      };

      try {
        for (const id of selectedCategories) {
          await request(`/tournaments/${targetTournamentId}/categories/${id}/enrollments`, {
            method: 'POST',
            body: payload,
          });
          processedCategories.push(id);
        }

        const successStatusMessage =
          selectedCategories.length > 1
            ? 'Solicitudes enviadas correctamente.'
            : 'Solicitud enviada correctamente.';
        setStatusMessage(status, 'success', successStatusMessage);
        closeModal();
        const successMessage =
          selectedCategories.length > 1
            ? 'Solicitudes enviadas. Un administrador las revisará en breve.'
            : 'Solicitud enviada. Un administrador la revisará en breve.';
        showGlobalMessage(successMessage);
        await refreshContext();
      } catch (error) {
        setStatusMessage(status, 'error', error.message);
        submitButton.disabled = false;
        if (processedCategories.length) {
          await refreshContext();
        }
      }
    });

    cancelButton.addEventListener('click', () => {
      setStatusMessage(status, '', '');
      closeModal();
    });

    openModal({
      title: allowMultiple ? 'Inscribirse en el torneo' : 'Solicitar inscripción',
      content: (body) => {
        body.appendChild(form);
        body.appendChild(status);
      },
      onClose: () => setStatusMessage(status, '', ''),
    });
  }

  async function openTournamentAdminEnrollmentModal({
    tournamentId = state.selectedTournamentId,
  } = {}) {
    if (!isAdmin()) {
      return;
    }

    const normalizedTournamentId = tournamentId
      ? normalizeId(tournamentId)
      : normalizeId(state.selectedTournamentId);

    if (!normalizedTournamentId) {
      showGlobalMessage('Selecciona un torneo para inscribir jugadores.', 'info');
      return;
    }

    if (!state.tournamentDetails.has(normalizedTournamentId)) {
      try {
        await refreshTournamentDetail(normalizedTournamentId);
      } catch (error) {
        showGlobalMessage(
          error.message || 'No fue posible cargar el detalle del torneo.',
          'error'
        );
        return;
      }
    }

    const detail =
      state.tournamentDetails.get(normalizedTournamentId) ||
      getTournamentById(normalizedTournamentId);
    const options = detail?.adminEnrollmentOptions;

    if (
      !options?.canEnrollPlayers ||
      !Array.isArray(options.categories) ||
      options.categories.length === 0
    ) {
      showGlobalMessage('No hay categorías disponibles para inscribir jugadores.', 'info');
      return;
    }

    try {
      await ensurePlayersLoaded();
    } catch (error) {
      return;
    }

    const players = Array.isArray(state.players) ? state.players : [];
    const eligiblePlayers = players
      .filter((player) => entityHasRole(player, 'player'))
      .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'es'));

    if (!eligiblePlayers.length) {
      showGlobalMessage('No hay jugadores disponibles para inscribir.', 'info');
      return;
    }

    const categories = options.categories
      .map((category) => {
        const id = normalizeId(category);
        if (!id) {
          return null;
        }
        const label = category.menuTitle || category.name || 'Categoría';
        return {
          id,
          label,
          gender: category.gender || '',
          matchType: category.matchType || '',
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));

    if (!categories.length) {
      showGlobalMessage('No hay categorías disponibles para inscribir jugadores.', 'info');
      return;
    }

    const rawMaxSelectable = Number(options.maxSelectableCategories);
    const maxSelectable = Number.isFinite(rawMaxSelectable) && rawMaxSelectable > 0
      ? Math.min(rawMaxSelectable, categories.length)
      : categories.length;

    const requiresShirtSize = Boolean(options.requiresShirtSize);
    const hasShirtOption = Boolean(options.hasShirt || requiresShirtSize);
    const allowedShirtSizes = Array.isArray(options.shirtSizes)
      ? options.shirtSizes
          .map((size) => (typeof size === 'string' ? size.trim().toUpperCase() : ''))
          .filter((size, index, array) => size && array.indexOf(size) === index)
      : [];

    const form = document.createElement('form');
    form.className = 'form';

    const playerLabel = document.createElement('label');
    playerLabel.textContent = 'Jugador';
    const playerSelect = document.createElement('select');
    playerSelect.name = 'userId';
    playerSelect.required = true;
    playerSelect.innerHTML = '<option value="">Selecciona un jugador</option>';
    eligiblePlayers.forEach((player) => {
      const option = document.createElement('option');
      option.value = player._id || player.id || '';
      option.textContent = player.fullName || player.email || 'Jugador';
      playerSelect.appendChild(option);
    });
    playerLabel.appendChild(playerSelect);
    form.appendChild(playerLabel);

    let categoryCountSelect = null;
    if (maxSelectable > 1) {
      const countLabel = document.createElement('label');
      countLabel.textContent = 'Número de categorías';
      categoryCountSelect = document.createElement('select');
      categoryCountSelect.name = 'categoryCount';
      categoryCountSelect.required = true;
      for (let count = 1; count <= maxSelectable; count += 1) {
        const option = document.createElement('option');
        option.value = String(count);
        option.textContent = count === 1 ? '1 categoría' : `${count} categorías`;
        categoryCountSelect.appendChild(option);
      }
      countLabel.appendChild(categoryCountSelect);
      form.appendChild(countLabel);
    }

    const categoryFieldset = document.createElement('fieldset');
    categoryFieldset.className = 'checkbox-group';
    const legend = document.createElement('legend');
    legend.textContent = 'Categorías disponibles';
    categoryFieldset.appendChild(legend);

    const selectionHint = document.createElement('p');
    selectionHint.className = 'form-hint';
    categoryFieldset.appendChild(selectionHint);

    const categoryCheckboxes = categories.map((category) => {
      const optionLabel = document.createElement('label');
      optionLabel.className = 'checkbox-option';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'categoryIds';
      checkbox.value = category.id;
      optionLabel.appendChild(checkbox);
      const text = document.createElement('span');
      const details = [];
      if (category.gender) {
        details.push(translateGender(category.gender));
      }
      if (category.matchType) {
        details.push(formatTournamentMatchType(category.matchType));
      }
      text.textContent = details.length
        ? `${category.label} · ${details.join(' · ')}`
        : category.label;
      optionLabel.appendChild(text);
      categoryFieldset.appendChild(optionLabel);
      return checkbox;
    });

    form.appendChild(categoryFieldset);

    let shirtField = null;
    if (hasShirtOption) {
      const shirtLabel = document.createElement('label');
      shirtLabel.textContent = 'Talla de camiseta';
      const hint = document.createElement('span');
      hint.className = 'form-hint';
      hint.textContent = requiresShirtSize
        ? 'Obligatoria para completar la inscripción.'
        : 'Opcional; si no se indica se mantendrá la registrada en el perfil.';
      shirtLabel.appendChild(hint);

      if (allowedShirtSizes.length) {
        const select = document.createElement('select');
        select.name = 'shirtSize';
        select.innerHTML = '<option value="">Selecciona una talla</option>';
        allowedShirtSizes.forEach((size) => {
          const option = document.createElement('option');
          option.value = size;
          option.textContent = size;
          select.appendChild(option);
        });
        if (requiresShirtSize) {
          select.required = true;
        }
        shirtField = select;
        shirtLabel.appendChild(select);
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'shirtSize';
        input.placeholder = 'Ej. S, M, L, XL';
        if (requiresShirtSize) {
          input.required = true;
        }
        shirtField = input;
        shirtLabel.appendChild(input);
      }

      form.appendChild(shirtLabel);
    }

    const actions = document.createElement('div');
    actions.className = 'form-actions';

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'primary';
    submitButton.textContent = 'Inscribir jugador';
    submitButton.disabled = true;
    actions.appendChild(submitButton);

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'ghost';
    cancelButton.textContent = 'Cancelar';
    actions.appendChild(cancelButton);

    form.appendChild(actions);

    const status = document.createElement('p');
    status.className = 'status-message';
    status.style.display = 'none';

    const parseDesiredCount = () => {
      if (!categoryCountSelect) {
        return null;
      }
      const value = Number(categoryCountSelect.value || '0');
      return Number.isFinite(value) && value > 0 ? Math.min(value, maxSelectable) : null;
    };

    const countSelectedCategories = () =>
      categoryCheckboxes.filter((checkbox) => checkbox.checked).length;

    const updateSelectionHint = () => {
      if (!selectionHint) {
        return;
      }
      const desired = parseDesiredCount();
      const selected = countSelectedCategories();
      if (desired) {
        selectionHint.textContent =
          desired === 1
            ? `Selecciona 1 categoría (actualmente ${selected}).`
            : `Selecciona ${desired} categorías (actualmente ${selected}).`;
        return;
      }
      if (maxSelectable && maxSelectable < categories.length) {
        selectionHint.textContent =
          maxSelectable === 1
            ? 'Selecciona una única categoría disponible.'
            : `Selecciona hasta ${maxSelectable} categorías (actualmente ${selected}).`;
        return;
      }
      selectionHint.textContent = 'Selecciona las categorías en las que participará el jugador.';
    };

    const getSelectionLimit = () => {
      const desired = parseDesiredCount();
      if (desired) {
        return Math.min(desired, maxSelectable);
      }
      return maxSelectable;
    };

    const enforceCategoryLimit = () => {
      const limit = Math.max(1, getSelectionLimit());
      const selected = countSelectedCategories();
      categoryCheckboxes.forEach((checkbox) => {
        if (!checkbox.checked) {
          checkbox.disabled = selected >= limit;
        } else {
          checkbox.disabled = false;
        }
      });
      updateSelectionHint();
    };

    const getShirtValue = () => {
      if (!shirtField) {
        return '';
      }
      return (shirtField.value || '').trim();
    };

    const updateSubmitState = () => {
      const playerSelected = Boolean(playerSelect.value);
      const selectedCount = countSelectedCategories();
      const desired = parseDesiredCount();
      const limit = getSelectionLimit();
      const categoriesValid =
        selectedCount > 0 && (desired ? selectedCount === desired : selectedCount <= limit);
      const shirtValid = requiresShirtSize ? Boolean(getShirtValue()) : true;
      submitButton.disabled = !(playerSelected && categoriesValid && shirtValid);
    };

    function applyDefaultShirtSize() {
      if (!shirtField) {
        return;
      }
      const playerId = playerSelect.value || '';
      const player = eligiblePlayers.find((entry) => normalizeId(entry) === playerId);
      const defaultSize = player?.shirtSize
        ? String(player.shirtSize).trim().toUpperCase()
        : '';
      if (!defaultSize) {
        updateSubmitState();
        return;
      }
      if (shirtField.tagName === 'SELECT') {
        const optionsList = Array.from(shirtField.options);
        const matching = optionsList.find(
          (option) => (option.value || '').toUpperCase() === defaultSize
        );
        if (matching) {
          shirtField.value = matching.value;
        }
      } else if (!shirtField.value) {
        shirtField.value = defaultSize;
      }
      updateSubmitState();
    }

    categoryCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        enforceCategoryLimit();
        updateSubmitState();
        setStatusMessage(status, '', '');
      });
    });

    if (categoryCountSelect) {
      categoryCountSelect.addEventListener('change', () => {
        enforceCategoryLimit();
        updateSubmitState();
        setStatusMessage(status, '', '');
      });
    }

    playerSelect.addEventListener('change', () => {
      applyDefaultShirtSize();
      updateSubmitState();
      setStatusMessage(status, '', '');
    });

    if (shirtField) {
      const eventName = shirtField.tagName === 'SELECT' ? 'change' : 'input';
      shirtField.addEventListener(eventName, () => {
        updateSubmitState();
        setStatusMessage(status, '', '');
      });
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const playerId = playerSelect.value || '';
      if (!playerId) {
        setStatusMessage(status, 'error', 'Selecciona un jugador.');
        return;
      }

      const selectedCategories = categoryCheckboxes
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.value);

      if (!selectedCategories.length) {
        setStatusMessage(status, 'error', 'Selecciona al menos una categoría.');
        return;
      }

      const desired = parseDesiredCount();
      const limit = getSelectionLimit();
      if (desired && selectedCategories.length !== desired) {
        setStatusMessage(
          status,
          'error',
          desired === 1
            ? 'Debes seleccionar exactamente 1 categoría.'
            : `Debes seleccionar exactamente ${desired} categorías.`,
        );
        return;
      }

      if (selectedCategories.length > limit) {
        setStatusMessage(
          status,
          'error',
          limit === 1
            ? 'Solo puedes seleccionar una categoría para este jugador.'
            : `Solo puedes seleccionar hasta ${limit} categorías para este jugador.`,
        );
        return;
      }

      let shirtSizeValue = getShirtValue();
      if (requiresShirtSize && !shirtSizeValue) {
        setStatusMessage(status, 'error', 'Indica la talla de camiseta del jugador.');
        return;
      }

      if (shirtSizeValue) {
        shirtSizeValue = shirtSizeValue.toUpperCase();
      }

      submitButton.disabled = true;
      setStatusMessage(status, 'info', 'Inscribiendo jugador...');

      const payload = {
        userId: playerId,
        categories: selectedCategories,
      };

      if (desired) {
        payload.categoryCount = desired;
      }

      if (shirtSizeValue) {
        payload.shirtSize = shirtSizeValue;
      }

      try {
        const response = await request(`/tournaments/${normalizedTournamentId}/enrollments`, {
          method: 'POST',
          body: payload,
        });
        const created = Array.isArray(response?.enrollments)
          ? response.enrollments
          : [];
        const processedCount = created.length || selectedCategories.length;
        const successMessage =
          processedCount > 1
            ? 'Jugador inscrito en las categorías seleccionadas.'
            : 'Jugador inscrito correctamente.';
        setStatusMessage(status, 'success', successMessage);
        closeModal();
        showGlobalMessage(successMessage);
        state.tournamentDetails.delete(normalizedTournamentId);
        await Promise.all([
          reloadTournaments({ selectTournamentId: normalizedTournamentId }),
          refreshTournamentDetail(normalizedTournamentId),
        ]);
      } catch (error) {
        submitButton.disabled = false;
        setStatusMessage(status, 'error', error.message);
      }
    });

    cancelButton.addEventListener('click', () => {
      setStatusMessage(status, '', '');
      closeModal();
    });

    enforceCategoryLimit();
    updateSubmitState();
    applyDefaultShirtSize();
    setStatusMessage(status, '', '');

    openModal({
      title: 'Inscribir jugador en el torneo',
      content: (body) => {
        body.appendChild(form);
        body.appendChild(status);
      },
      onClose: () => setStatusMessage(status, '', ''),
    });
  }

  async function loadTournamentDetail(tournamentId, { force = false } = {}) {
    const normalized = typeof tournamentId === 'string' ? tournamentId : normalizeId(tournamentId);
    if (!normalized) {
      return null;
    }

    if (!force && state.tournamentDetails.has(normalized)) {
      return state.tournamentDetails.get(normalized);
    }

    if (force && state.tournamentDetails instanceof Map) {
      state.tournamentDetails.delete(normalized);
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
      const detail = await loadTournamentDetail(normalized, { force: true });
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

      if (state.selectedBracketTournamentId === normalized) {
        updateBracketCategoryOptions();
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

  function updateTournamentCategoriesPoster(detail) {
    if (!tournamentCategoriesPoster) return;

    tournamentCategoriesPoster.innerHTML = '';

    const posterUrl = typeof detail?.poster === 'string' ? detail.poster.trim() : '';
    if (!posterUrl) {
      tournamentCategoriesPoster.hidden = true;
      return;
    }

    const poster = document.createElement('img');
    poster.className = 'tournament-categories__poster-image';
    poster.src = posterUrl;
    poster.alt = detail?.name ? `Cartel del torneo ${detail.name}` : 'Cartel del torneo';
    poster.loading = 'lazy';
    tournamentCategoriesPoster.appendChild(poster);
    tournamentCategoriesPoster.hidden = false;
  }

  function renderTournamentCategories({ loading = false } = {}) {
    if (!tournamentCategoriesList || !tournamentCategoriesEmpty) return;
    tournamentCategoriesList.innerHTML = '';

    const tournamentId = state.selectedTournamentCategoriesId;
    if (!tournamentId) {
      updateTournamentCategoriesPoster(null);
      tournamentCategoriesEmpty.hidden = false;
      tournamentCategoriesEmpty.textContent = 'Selecciona un torneo para consultar sus categorías.';
      return;
    }

    const detail = state.tournamentDetails.get(tournamentId) || getTournamentById(tournamentId);
    updateTournamentCategoriesPoster(detail);

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

    const admin = isAdmin();
    const tournamentPosterUrl = typeof detail?.poster === 'string' ? detail.poster.trim() : '';
    const tournamentName = detail?.name || '';
    tournamentCategoriesEmpty.hidden = true;

    categories
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
      .forEach((category) => {
        const item = document.createElement('li');
        const content = document.createElement('div');
        content.className = 'list-item__content';
        item.appendChild(content);

        const categoryId = normalizeId(category);
        if (categoryId) {
          item.dataset.categoryId = categoryId;
        }

        const categoryColor = getCategoryColor(category);
        if (categoryColor) {
          applyCategoryColorStyles(item, categoryColor, { backgroundAlpha: 0.14, borderAlpha: 0.3 });
        }

        const title = document.createElement('strong');
        title.textContent = category.name || 'Categoría';
        if (categoryColor) {
          const indicator = createCategoryColorIndicator(categoryColor, category.name);
          if (indicator) {
            title.classList.add('with-category-color');
            title.prepend(indicator);
          }
        }
        content.appendChild(title);

        const meta = document.createElement('div');
        meta.className = 'meta meta-category';

        if (category.gender) {
          const genderSpan = document.createElement('span');
          genderSpan.textContent = translateGender(category.gender);
          meta.appendChild(genderSpan);
        }

        if (category.matchType) {
          const matchTypeSpan = document.createElement('span');
          matchTypeSpan.textContent = formatTournamentMatchType(category.matchType);
          meta.appendChild(matchTypeSpan);
        }

        if (category.matchFormat) {
          const formatSpan = document.createElement('span');
          formatSpan.textContent = formatTournamentMatchFormat(category.matchFormat);
          meta.appendChild(formatSpan);
        }

        const statusValue = category.status || 'inscripcion';
        const statusTag = document.createElement('span');
        statusTag.className = `tag category-status category-status--${statusValue}`;
        statusTag.textContent = formatTournamentCategoryStatusLabel(statusValue);
        meta.appendChild(statusTag);

        content.appendChild(meta);

        if (category.description) {
          const description = document.createElement('p');
          description.textContent = category.description;
          content.appendChild(description);
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
        const pendingEnrollments = Number.isFinite(Number(enrollmentStats.pending))
          ? Number(enrollmentStats.pending)
          : Number(category.pendingEnrollmentCount || 0);

        const enrollmentSummary = document.createElement('div');
        enrollmentSummary.className = 'meta meta-enrollment';
        enrollmentSummary.textContent = `Inscripciones confirmadas: ${confirmedEnrollments}/${totalEnrollments}`;
        content.appendChild(enrollmentSummary);

        if (admin && pendingEnrollments > 0) {
          const pendingSummary = document.createElement('div');
          pendingSummary.className = 'meta meta-enrollment';
          pendingSummary.textContent =
            pendingEnrollments === 1
              ? '1 solicitud pendiente'
              : `${pendingEnrollments} solicitudes pendientes`;
          content.appendChild(pendingSummary);
        }

        const matches = Number.isFinite(Number(category.matches)) ? Number(category.matches) : 0;
        const matchesMeta = document.createElement('div');
        matchesMeta.className = 'meta meta-matches';
        matchesMeta.textContent = `${matches} ${matches === 1 ? 'partido' : 'partidos'}`;
        content.appendChild(matchesMeta);

        const actions = document.createElement('div');
        actions.className = 'actions category-actions';
        let hasActions = false;

        const detailId = normalizeId(category?.tournament) || tournamentId;
        const userEnrollment = category.userEnrollment || null;

        if (admin) {
          const editButton = document.createElement('button');
          editButton.type = 'button';
          editButton.className = 'secondary';
          editButton.dataset.tournamentCategoryAction = 'edit';
          editButton.dataset.tournamentId = tournamentId;
          editButton.dataset.categoryId = categoryId;
          editButton.textContent = 'Editar';
          actions.appendChild(editButton);
          hasActions = true;

          if (categoryId) {
            const manageButton = document.createElement('button');
            manageButton.type = 'button';
            manageButton.dataset.tournamentCategoryAction = 'enrollments';
            manageButton.dataset.tournamentId = tournamentId;
            manageButton.dataset.categoryId = categoryId;
            if (pendingEnrollments > 0) {
              manageButton.className = 'primary';
              manageButton.textContent =
                pendingEnrollments === 1
                  ? 'Revisar solicitud'
                  : `Revisar ${pendingEnrollments} solicitudes`;
            } else {
              manageButton.className = 'ghost';
              manageButton.textContent = 'Gestionar inscripciones';
            }
            actions.appendChild(manageButton);
          }

          const deleteButton = document.createElement('button');
          deleteButton.type = 'button';
          deleteButton.className = 'danger';
          deleteButton.dataset.tournamentCategoryAction = 'delete';
          deleteButton.dataset.tournamentId = tournamentId;
          deleteButton.dataset.categoryId = categoryId;
          deleteButton.textContent = 'Eliminar';
          actions.appendChild(deleteButton);
        } else if (categoryId) {
          if (userEnrollment?.status) {
            const enrollmentStatus = userEnrollment.status;
            const statusClass = enrollmentStatus === 'confirmada' ? 'tag tag--success' : 'tag';
            const enrollmentTag = document.createElement('span');
            enrollmentTag.className = statusClass;
            enrollmentTag.textContent = formatTournamentEnrollmentStatusLabel(enrollmentStatus);
            actions.appendChild(enrollmentTag);
            hasActions = true;
          }

          if (category.canRequestEnrollment) {
            const requestButton = document.createElement('button');
            requestButton.type = 'button';
            requestButton.className = 'primary';
            requestButton.dataset.tournamentAction = 'request-enrollment';
            requestButton.dataset.tournamentId = detailId;
            requestButton.dataset.categoryId = categoryId;
            requestButton.textContent = 'Solicitar inscripción';
            actions.appendChild(requestButton);
            hasActions = true;
          } else if (!userEnrollment) {
            const note = document.createElement('span');
            note.className = 'note';
            note.textContent = 'Inscripciones cerradas';
            actions.appendChild(note);
            hasActions = true;
          }
        }

        if (!admin && userEnrollment?.status === 'cancelada') {
          const cancelledTag = document.createElement('span');
          cancelledTag.className = 'tag';
          cancelledTag.textContent = 'Inscripción cancelada';
          actions.appendChild(cancelledTag);
          hasActions = true;
        }

        if (hasActions || admin) {
          content.appendChild(actions);
        }

        const rawCategoryPoster = typeof category.poster === 'string' ? category.poster.trim() : '';
        const posterUrl = rawCategoryPoster || tournamentPosterUrl;
        if (posterUrl) {
          item.classList.add('list-item--with-poster');
          const posterWrapper = document.createElement('div');
          posterWrapper.className = 'list-item__poster';
          const poster = document.createElement('img');
          poster.className = 'list-item__poster-image';
          poster.src = posterUrl;
          if (rawCategoryPoster && category.name) {
            poster.alt = `Cartel de la categoría ${category.name}`;
          } else if (tournamentName) {
            poster.alt = `Cartel del torneo ${tournamentName}`;
          } else {
            poster.alt = 'Cartel del torneo';
          }
          poster.loading = 'lazy';
          posterWrapper.appendChild(poster);
          item.appendChild(posterWrapper);
        }

        tournamentCategoriesList.appendChild(item);
      });
  }

  function createTournamentDoublesCategoryCard(group) {
    const category = group?.category || {};
    const players = Array.isArray(group?.players) ? group.players : [];
    const pairs = Array.isArray(group?.pairs) ? group.pairs : [];

    const card = document.createElement('div');
    card.className = 'collection-card';

    const header = document.createElement('div');
    header.className = 'collection-card__header';

    const title = document.createElement('div');
    title.className = 'collection-card__title';
    const categoryColor = category.color;
    if (categoryColor) {
      const indicator = createCategoryColorIndicator(categoryColor, category.name);
      if (indicator) {
        title.appendChild(indicator);
      }
    }
    title.appendChild(
      document.createTextNode(category.menuTitle || category.name || 'Categoría de dobles')
    );
    header.appendChild(title);

    if (category.status) {
      const statusLabel = formatTournamentCategoryStatusLabel(category.status);
      if (statusLabel) {
        const subtitle = document.createElement('span');
        subtitle.className = 'collection-card__subtitle';
        subtitle.textContent = statusLabel;
        header.appendChild(subtitle);
      }
    }

    card.appendChild(header);

    const metaParts = [];
    const genderLabel = translateGender(category.gender);
    if (genderLabel) {
      metaParts.push(genderLabel);
    }
    const matchTypeLabel = formatTournamentMatchType(category.matchType);
    if (matchTypeLabel) {
      metaParts.push(matchTypeLabel);
    }
    const playerCount = players.length;
    metaParts.push(`${playerCount} ${playerCount === 1 ? 'jugador' : 'jugadores'}`);
    const pairCount = pairs.length;
    metaParts.push(`${pairCount} ${pairCount === 1 ? 'pareja' : 'parejas'}`);

    if (metaParts.length) {
      const meta = document.createElement('div');
      meta.className = 'collection-card__meta';
      meta.textContent = metaParts.join(' · ');
      card.appendChild(meta);
    }

    if (!players.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Sin inscripciones registradas.';
      card.appendChild(empty);
      return card;
    }

    const categoryId = normalizeId(category);
    const pairByPlayerId = new Map();
    pairs.forEach((pair) => {
      const members = Array.isArray(pair.players) ? pair.players : [];
      members.forEach((member) => {
        const memberId = normalizeId(member);
        if (memberId) {
          pairByPlayerId.set(memberId, pair);
        }
      });
    });

    const formatMetadataLabel = (key) => {
      if (!key) return '';
      return key
        .toString()
        .split(/[_\s]+/)
        .filter(Boolean)
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(' ');
    };

    const list = document.createElement('ul');
    list.className = 'collection-card__list';

    players.forEach((entry) => {
      const listItem = document.createElement('li');
      listItem.className = 'collection-card__list-item';

      const playerInfo = document.createElement('div');
      playerInfo.className = 'collection-card__player';

      const name = document.createElement('strong');
      const playerName = entry?.user?.fullName || entry?.user?.email || 'Jugador';
      name.textContent = playerName;
      playerInfo.appendChild(name);

      const details = [];
      const email = typeof entry?.user?.email === 'string' ? entry.user.email.trim() : '';
      if (email) {
        details.push(email);
      }
      const phone = typeof entry?.user?.phone === 'string' ? entry.user.phone.trim() : '';
      if (phone) {
        details.push(phone);
      }
      const scheduleValue = entry?.user?.preferredSchedule;
      if (scheduleValue) {
        details.push(`Horario: ${translateSchedule(scheduleValue)}`);
      }
      const seedNumber = Number(entry?.seedNumber);
      if (Number.isFinite(seedNumber) && seedNumber > 0) {
        details.push(`Siembra ${seedNumber}`);
      }
      const shirtSize = typeof entry?.shirtSize === 'string' ? entry.shirtSize.trim() : '';
      if (shirtSize) {
        details.push(`Talla ${shirtSize}`);
      }
      if (entry?.enrolledAt) {
        details.push(`Inscrito: ${formatShortDate(entry.enrolledAt)}`);
      }

      const metadata = entry?.metadata && typeof entry.metadata === 'object' ? entry.metadata : {};
      Object.entries(metadata).forEach(([key, value]) => {
        const text = typeof value === 'string' ? value.trim() : '';
        if (!text) {
          return;
        }
        const label = formatMetadataLabel(key);
        details.push(label ? `${label}: ${text}` : text);
      });

      const playerId = normalizeId(entry?.user);
      const pair = playerId ? pairByPlayerId.get(playerId) : null;
      if (pair) {
        const partners = Array.isArray(pair.players) ? pair.players : [];
        const partnerEntry = partners.find((member) => {
          const memberId = normalizeId(member);
          return memberId && memberId !== playerId;
        });
        const partnerNames = partners
          .map((member) => member.fullName || member.email || '')
          .filter(Boolean);
        const partnerName = partnerEntry?.fullName || partnerEntry?.email || partnerNames.join(' / ');
        if (partnerName) {
          details.push(`Pareja: ${partnerName}`);
        }
      }

      if (entry?.notes) {
        details.push(`Notas: ${entry.notes}`);
      }

      if (details.length) {
        const detailLine = document.createElement('span');
        detailLine.textContent = details.join(' · ');
        playerInfo.appendChild(detailLine);
      }

      listItem.appendChild(playerInfo);

      const statusValue = entry?.status;
      if (statusValue) {
        const statusTag = document.createElement('span');
        statusTag.className = statusValue === 'confirmada' ? 'tag tag--success' : 'tag';
        statusTag.textContent = formatTournamentEnrollmentStatusLabel(statusValue);
        listItem.appendChild(statusTag);
      }

      list.appendChild(listItem);
    });

    card.appendChild(list);

    const pairsTitle = document.createElement('h4');
    pairsTitle.className = 'collection-card__subtitle';
    pairsTitle.textContent = 'Parejas registradas';
    card.appendChild(pairsTitle);

    if (pairs.length) {
      const pairList = document.createElement('ul');
      pairList.className = 'collection-card__list';

      pairs.forEach((pair) => {
        const item = document.createElement('li');
        item.className = 'collection-card__list-item';

        const pairInfo = document.createElement('div');
        pairInfo.className = 'collection-card__player';
        const members = Array.isArray(pair.players) ? pair.players : [];
        const names = members.map((player) => player.fullName || player.email || 'Jugador');

        if (members.length) {
          const membersWrapper = document.createElement('div');
          membersWrapper.className = 'doubles-pair-members';

          members.forEach((player) => {
            const member = document.createElement('div');
            member.className = 'doubles-pair-member';

            member.appendChild(createAvatarElement(player, { size: 'sm' }));

            const memberName = document.createElement('strong');
            memberName.className = 'doubles-pair-member__name';
            memberName.textContent = player.fullName || player.email || 'Jugador';
            member.appendChild(memberName);

            membersWrapper.appendChild(member);
          });

          pairInfo.appendChild(membersWrapper);
        } else {
          const pairLabel = names.length ? names.join(' · ') : 'Pareja';
          const pairName = document.createElement('strong');
          pairName.textContent = pairLabel;
          pairInfo.appendChild(pairName);
        }

        if (pair.createdAt) {
          const created = document.createElement('span');
          created.textContent = `Creada: ${formatShortDate(pair.createdAt)}`;
          pairInfo.appendChild(created);
        }

        item.appendChild(pairInfo);

        if (isAdmin()) {
          const deleteButton = document.createElement('button');
          deleteButton.type = 'button';
          deleteButton.className = 'danger';
          deleteButton.textContent = 'Eliminar pareja';
          deleteButton.dataset.action = 'delete-pair';
          deleteButton.dataset.pairId = normalizeId(pair);
          deleteButton.dataset.categoryId = categoryId;
          item.appendChild(deleteButton);
        }

        pairList.appendChild(item);
      });

      card.appendChild(pairList);
    } else {
      const emptyPairs = document.createElement('p');
      emptyPairs.className = 'empty-state';
      emptyPairs.textContent = 'Aún no hay parejas registradas.';
      card.appendChild(emptyPairs);
    }

    if (isAdmin()) {
      const availablePlayers = players.filter((entry) => {
        const userId = normalizeId(entry?.user);
        if (!userId) {
          return false;
        }
        return !pairByPlayerId.has(userId);
      });

      const formWrapper = document.createElement('div');
      formWrapper.className = 'collection-card__form doubles-pair-form-wrapper';

      if (availablePlayers.length >= 2) {
        const form = document.createElement('form');
        form.className = 'doubles-pair-form';
        form.dataset.categoryId = categoryId;

        const playerOneField = document.createElement('label');
        playerOneField.className = 'inline-field';
        playerOneField.textContent = 'Jugador 1';
        const playerOneSelect = document.createElement('select');
        playerOneSelect.name = 'playerA';
        playerOneSelect.innerHTML = '<option value="">Selecciona jugador</option>';
        availablePlayers.forEach((entry) => {
          const option = document.createElement('option');
          option.value = normalizeId(entry?.user);
          option.textContent = entry?.user?.fullName || entry?.user?.email || 'Jugador';
          playerOneSelect.appendChild(option);
        });
        playerOneField.appendChild(playerOneSelect);

        const playerTwoField = document.createElement('label');
        playerTwoField.className = 'inline-field';
        playerTwoField.textContent = 'Jugador 2';
        const playerTwoSelect = document.createElement('select');
        playerTwoSelect.name = 'playerB';
        playerTwoSelect.innerHTML = '<option value="">Selecciona jugador</option>';
        availablePlayers.forEach((entry) => {
          const option = document.createElement('option');
          option.value = normalizeId(entry?.user);
          option.textContent = entry?.user?.fullName || entry?.user?.email || 'Jugador';
          playerTwoSelect.appendChild(option);
        });
        playerTwoField.appendChild(playerTwoSelect);

        const actions = document.createElement('div');
        actions.className = 'doubles-pair-form__actions';
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'secondary';
        submitButton.textContent = 'Crear pareja';
        actions.appendChild(submitButton);

        form.appendChild(playerOneField);
        form.appendChild(playerTwoField);
        form.appendChild(actions);

        formWrapper.appendChild(form);
      } else {
        const info = document.createElement('p');
        info.className = 'meta';
        info.textContent = 'No hay suficientes jugadores sin pareja para crear una nueva.';
        formWrapper.appendChild(info);
      }

      card.appendChild(formWrapper);
    }

    return card;
  }

  function renderTournamentDoubles(list = null, { loading = false, error = '' } = {}) {
    if (!tournamentDoublesContainer || !tournamentDoublesEmpty) {
      return;
    }

    tournamentDoublesContainer.innerHTML = '';

    const tournamentId = state.selectedDoublesTournamentId;
    const normalizedId = normalizeId(tournamentId);

    if (!normalizedId) {
      tournamentDoublesEmpty.hidden = false;
      tournamentDoublesEmpty.textContent = 'Selecciona un torneo para ver las inscripciones de dobles.';
      return;
    }

    if (loading) {
      tournamentDoublesEmpty.hidden = false;
      tournamentDoublesEmpty.textContent = 'Cargando inscripciones de dobles...';
      return;
    }

    if (error) {
      tournamentDoublesEmpty.hidden = false;
      tournamentDoublesEmpty.textContent = error;
      return;
    }

    if (!state.tournamentDoubles.has(normalizedId) && list === null) {
      tournamentDoublesEmpty.hidden = false;
      tournamentDoublesEmpty.textContent = 'Selecciona un torneo para ver las inscripciones de dobles.';
      return;
    }

    const groups = Array.isArray(list)
      ? list
      : state.tournamentDoubles.get(normalizedId) || [];

    if (!groups.length) {
      tournamentDoublesEmpty.hidden = false;
      tournamentDoublesEmpty.textContent = 'No hay inscripciones de dobles registradas.';
      return;
    }

    groups.forEach((group) => {
      const card = createTournamentDoublesCategoryCard(group);
      if (card) {
        tournamentDoublesContainer.appendChild(card);
      }
    });

    if (!tournamentDoublesContainer.childElementCount) {
      tournamentDoublesEmpty.hidden = false;
      tournamentDoublesEmpty.textContent = 'No hay inscripciones de dobles registradas.';
      return;
    }

    tournamentDoublesEmpty.hidden = true;
    tournamentDoublesEmpty.textContent = '';
  }

  async function refreshTournamentDoubles({ force = false } = {}) {
    const tournamentId = state.selectedDoublesTournamentId;
    const normalizedId = normalizeId(tournamentId);

    if (!normalizedId) {
      renderTournamentDoubles([], { loading: false });
      return;
    }

    if (!force && state.tournamentDoubles.has(normalizedId)) {
      renderTournamentDoubles();
      return;
    }

    pendingTournamentDoublesId = normalizedId;
    renderTournamentDoubles([], { loading: true });

    try {
      const response = await request(`/tournaments/${normalizedId}/doubles`, {
        requireAuth: Boolean(state.token),
      });
      const groups = Array.isArray(response) ? response : [];
      state.tournamentDoubles.set(normalizedId, groups);
      if (pendingTournamentDoublesId === normalizedId) {
        renderTournamentDoubles(groups);
      }
    } catch (error) {
      if (pendingTournamentDoublesId === normalizedId) {
        renderTournamentDoubles([], {
          error: error.message || 'No fue posible cargar las parejas de dobles.',
        });
      }
    } finally {
      if (pendingTournamentDoublesId === normalizedId) {
        pendingTournamentDoublesId = '';
      }
    }
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
    state.selectedDoublesTournamentId = resolveSelection(state.selectedDoublesTournamentId);
    state.selectedBracketTournamentId = resolveSelection(state.selectedBracketTournamentId);

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
    fillTournamentSelect(
      tournamentDoublesTournamentSelect,
      tournaments,
      state.selectedDoublesTournamentId,
      'Selecciona un torneo'
    );
    fillTournamentSelect(
      tournamentBracketTournamentSelect,
      tournaments,
      state.selectedBracketTournamentId,
      'Selecciona un torneo'
    );

    renderTournaments(tournaments);
    renderTournamentDetail();
    renderTournamentCategories();
    updateEnrollmentCategoryOptions();
    updateMatchCategoryOptions();
    updateBracketCategoryOptions();
    renderTournamentDoubles();
    updateTournamentActionAvailability();
  }

  function getTournamentDoublesPairCacheKey(tournamentId, categoryId) {
    if (!tournamentId || !categoryId) {
      return '';
    }
    return `${tournamentId}:${categoryId}`;
  }

  async function hydrateTournamentMatchesWithPairs(matches, options = {}) {
    const list = Array.isArray(matches) ? matches : [];
    if (!list.length) {
      return list;
    }

    const includesDoubles = list.some((match) => match && match.playerType === 'TournamentDoublesPair');
    if (!includesDoubles) {
      return list;
    }

    const needsExternalPairs = matchesRequireDoublesPairs(list);

    let pairMap = new Map();
    const tournamentId = normalizeId(options.tournamentId);
    const categoryId = normalizeId(options.categoryId);

    if (needsExternalPairs && tournamentId && categoryId) {
      try {
        const pairs = await fetchTournamentDoublesPairs(tournamentId, categoryId, { forceReload: false });
        pairMap = buildDoublesPairMap(pairs);
      } catch (error) {
        pairMap = new Map();
      }
    }

    return list.map((match) => {
      if (!match || match.playerType !== 'TournamentDoublesPair') {
        return match;
      }

      const players = Array.isArray(match.players) ? match.players : [];
      const resolvedPlayers = players.map((player) => {
        if (player && typeof player === 'object') {
          if (Array.isArray(player.players) && player.players.length) {
            return cloneNormalizedDoublesPair(normalizeDoublesPair(player)) || player;
          }
          const playerId = normalizeId(player);
          if (playerId && pairMap.has(playerId)) {
            return cloneNormalizedDoublesPair(pairMap.get(playerId)) || player;
          }
          return normalizeDoublesPair(player) || player;
        }

        const playerId = normalizeId(player);
        if (playerId && pairMap.has(playerId)) {
          return cloneNormalizedDoublesPair(pairMap.get(playerId)) || player;
        }
        if (playerId) {
          return { id: playerId, _id: playerId, players: [] };
        }
        return player;
      });

      const normalizedPlayers = resolvedPlayers.map((entry) => normalizeDoublesPair(entry) || entry);

      return {
        ...match,
        playerType: 'TournamentDoublesPair',
        players: normalizedPlayers,
      };
    });
  }

  async function fetchTournamentDoublesPairs(tournamentId, categoryId, { forceReload = false } = {}) {
    if (!tournamentId || !categoryId) {
      return [];
    }

    const cacheKey = getTournamentDoublesPairCacheKey(tournamentId, categoryId);
    if (!forceReload && state.tournamentDoublesPairs.has(cacheKey)) {
      const cached = state.tournamentDoublesPairs.get(cacheKey) || [];
      return cached.map((pair) => cloneNormalizedDoublesPair(pair) || pair).filter(Boolean);
    }

    const response = await request(
      `/tournaments/${tournamentId}/categories/${categoryId}/doubles-pairs`,
      { requireAuth: Boolean(state.token) }
    );
    const list = Array.isArray(response) ? response : [];
    const normalizedList = list
      .map((pair) => normalizeDoublesPair(pair))
      .filter((pair) => Boolean(pair && pair.id));
    state.tournamentDoublesPairs.set(cacheKey, normalizedList);
    return normalizedList.map((pair) => cloneNormalizedDoublesPair(pair) || pair).filter(Boolean);
  }

  function renderTournamentMatches(matches = [], { loading = false } = {}) {
    if (!tournamentMatchesList || !tournamentMatchesEmpty) return;

    tournamentMatchesList.innerHTML = '';
    const tournamentId = state.selectedMatchTournamentId;
    const categoryId = state.selectedMatchCategoryId;

    updateTournamentOrderOfPlayControls();

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
      item.classList.add('tournament-match-item');
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

      const result = match?.result || null;
      const rawScore = typeof result?.score === 'string' ? result.score.trim() : '';
      const rawNotes = typeof result?.notes === 'string' ? result.notes.trim() : '';
      const winnerId = normalizeId(result?.winner);
      const hasResultInfo = Boolean(rawScore || rawNotes || winnerId);

      if (hasResultInfo) {
        const resultContainer = document.createElement('div');
        resultContainer.className = 'tournament-match-result';

        const header = document.createElement('div');
        header.className = 'tournament-match-result__header';

        const statusValue = match.resultStatus || 'sin_resultado';
        const statusTag = document.createElement('span');
        statusTag.className = `tag tournament-match-result__status tournament-match-result__status--${statusValue}`;
        statusTag.textContent = formatTournamentResultStatusLabel(statusValue);
        header.appendChild(statusTag);

        if (rawScore) {
          const scoreSpan = document.createElement('span');
          scoreSpan.className = 'tournament-match-result__score';
          scoreSpan.textContent = `Marcador: ${rawScore}`;
          header.appendChild(scoreSpan);
        }

        resultContainer.appendChild(header);

        if (winnerId) {
          let winnerName = '';
          if (Array.isArray(match?.players)) {
            const winnerPlayer = match.players.find((player) => normalizeId(player) === winnerId);
            winnerName = winnerPlayer ? getPlayerDisplayName(winnerPlayer) : '';
          }
          const winnerParagraph = document.createElement('p');
          winnerParagraph.className = 'tournament-match-result__meta';
          winnerParagraph.textContent = winnerName ? `Ganador: ${winnerName}` : 'Ganador asignado en el cuadro';
          resultContainer.appendChild(winnerParagraph);
        }

        if (rawNotes) {
          const notesParagraph = document.createElement('p');
          notesParagraph.className = 'tournament-match-result__notes';
          notesParagraph.textContent = rawNotes;
          resultContainer.appendChild(notesParagraph);
        }

        item.appendChild(resultContainer);
      }

      if (isAdmin()) {
        const matchId = normalizeId(match);
        if (matchId) {
          const actions = document.createElement('div');
          actions.className = 'tournament-match-item__actions';

          const scheduleButton = document.createElement('button');
          scheduleButton.type = 'button';
          const hasSchedule = Boolean(match?.scheduledAt);
          scheduleButton.className = hasSchedule ? 'secondary' : 'primary';
          scheduleButton.dataset.action = 'schedule-tournament-match';
          scheduleButton.dataset.matchId = matchId;
          const tournamentIdAttr =
            normalizeId(match?.tournament) || state.selectedMatchTournamentId || '';
          const categoryIdAttr =
            normalizeId(match?.category) || state.selectedMatchCategoryId || '';
          scheduleButton.dataset.tournamentId = tournamentIdAttr;
          scheduleButton.dataset.categoryId = categoryIdAttr;
          scheduleButton.textContent = hasSchedule ? 'Editar horario' : 'Programar partido';
          actions.appendChild(scheduleButton);

          const hasResult = hasResultInfo;
          const resultButton = document.createElement('button');
          resultButton.type = 'button';
          resultButton.className = hasResult ? 'ghost' : 'secondary';
          resultButton.dataset.action = 'record-tournament-result';
          resultButton.dataset.matchId = matchId;
          resultButton.dataset.tournamentId = tournamentIdAttr;
          resultButton.dataset.categoryId = categoryIdAttr;
          resultButton.textContent = hasResult ? 'Editar resultado' : 'Registrar resultado';
          actions.appendChild(resultButton);

          item.appendChild(actions);
        }
      }
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
      let cached = state.tournamentMatches.get(cacheKey) || [];
      cached = await hydrateTournamentMatchesWithPairs(cached, {
        tournamentId,
        categoryId,
      });
      state.tournamentMatches.set(cacheKey, cached);
      recomputeTournamentOrderOfPlayDays(tournamentId);
      renderTournamentMatches(cached);
      return;
    }

    pendingTournamentMatchesKey = cacheKey;
    renderTournamentMatches([], { loading: true });

    try {
      const response = await request(`/tournaments/${tournamentId}/categories/${categoryId}/matches`);
      let list = Array.isArray(response) ? response : [];
      list = await hydrateTournamentMatchesWithPairs(list, { tournamentId, categoryId });
      state.tournamentMatches.set(cacheKey, list);
      recomputeTournamentOrderOfPlayDays(tournamentId);
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
      state.selectedDoublesTournamentId = normalizedSelection;
    }

    const validTournamentIds = new Set(
      tournaments.map((tournament) => normalizeId(tournament)).filter(Boolean)
    );
    state.tournamentDoubles = new Map(
      Array.from(state.tournamentDoubles.entries()).filter(([id]) => validTournamentIds.has(id))
    );
    state.tournamentDoublesPairs = new Map(
      Array.from(state.tournamentDoublesPairs.entries()).filter(([key]) => {
        const [tournamentKey] = String(key).split(':');
        return validTournamentIds.has(tournamentKey);
      })
    );
    state.tournamentBracketMatches = new Map(
      Array.from(state.tournamentBracketMatches.entries()).filter(([key]) => {
        const [tournamentKey] = String(key).split(':');
        return validTournamentIds.has(tournamentKey);
      })
    );

    updateTournamentSelectors();
    updateTournamentPaymentControls();

    if (state.activeSection === 'section-tournament-doubles' && state.selectedDoublesTournamentId) {
      await refreshTournamentDoubles({ force: true });
    }
    return tournaments;
  }

  function clearTournamentState(tournamentId) {
    const normalized = normalizeId(tournamentId);
    if (!normalized) {
      return;
    }

    if (state.tournamentDetails instanceof Map) {
      state.tournamentDetails.delete(normalized);
    }

    const deleteEntriesWithPrefix = (map) => {
      if (!(map instanceof Map)) {
        return;
      }

      Array.from(map.keys()).forEach((key) => {
        if (String(key).startsWith(`${normalized}:`)) {
          map.delete(key);
        }
      });
    };

    deleteEntriesWithPrefix(state.tournamentEnrollments);
    deleteEntriesWithPrefix(state.tournamentMatches);
    deleteEntriesWithPrefix(state.tournamentDoublesPairs);
    deleteEntriesWithPrefix(state.tournamentBracketMatches);

    if (state.tournamentPayments instanceof Map) {
      state.tournamentPayments.delete(normalized);
    }

    if (state.tournamentDoubles instanceof Map) {
      state.tournamentDoubles.delete(normalized);
    }

    if (state.tournamentOrderOfPlayDays instanceof Map) {
      state.tournamentOrderOfPlayDays.delete(normalized);
    }

    if (state.selectedMatchTournamentId === normalized) {
      state.selectedOrderOfPlayDay = '';
      updateTournamentOrderOfPlayControls();
    }

    if (
      state.tournamentPaymentFilters &&
      typeof state.tournamentPaymentFilters === 'object' &&
      state.tournamentPaymentFilters.tournament === normalized
    ) {
      state.tournamentPaymentFilters.tournament = '';
      state.tournamentPaymentFilters.search = '';
    }
  }

  function findTournamentMatchContext(matchId) {
    const normalizedId = normalizeId(matchId);
    if (!normalizedId) {
      return null;
    }

    const parseKey = (key = '') => {
      if (!key) {
        return { tournamentId: '', categoryId: '' };
      }
      const [tournamentId = '', categoryId = ''] = key.split(':');
      return {
        tournamentId: tournamentId || '',
        categoryId: categoryId || '',
      };
    };

    const sources = [
      state.tournamentMatches instanceof Map ? state.tournamentMatches : null,
      state.tournamentBracketMatches instanceof Map ? state.tournamentBracketMatches : null,
    ].filter(Boolean);

    for (const source of sources) {
      for (const [key, matches] of source.entries()) {
        if (!Array.isArray(matches)) continue;
        const found = matches.find((entry) => normalizeId(entry) === normalizedId);
        if (found) {
          const context = parseKey(key);
          return {
            match: found,
            tournamentId: context.tournamentId,
            categoryId: context.categoryId,
          };
        }
      }
    }

    return null;
  }

  async function applyTournamentMatchUpdate(updatedMatch) {
    const normalizedId = normalizeId(updatedMatch);
    if (!normalizedId) {
      return;
    }

    const hydrationTasks = [];
    const tournamentsToRecompute = new Set();

    const processMap = (map, trackOrderOfPlay = false) => {
      if (!(map instanceof Map)) {
        return;
      }

      map.forEach((matches, key) => {
        if (!Array.isArray(matches)) {
          return;
        }

        let changed = false;
        const nextMatches = matches.map((entry) => {
          if (normalizeId(entry) === normalizedId) {
            changed = true;
            return updatedMatch;
          }
          return entry;
        });

        if (!changed) {
          return;
        }

        map.set(key, nextMatches);

        if (trackOrderOfPlay) {
          const [tournamentId = ''] = (key || '').split(':');
          if (tournamentId) {
            tournamentsToRecompute.add(tournamentId);
          }
        }

        const [tournamentId = '', categoryId = ''] = (key || '').split(':');
        hydrationTasks.push(
          (async () => {
            try {
              const hydrated = await hydrateTournamentMatchesWithPairs(nextMatches, {
                tournamentId,
                categoryId,
              });
              map.set(key, hydrated);
            } catch (error) {
              map.set(key, nextMatches);
            }
          })()
        );
      });
    };

    processMap(state.tournamentMatches, true);
    processMap(state.tournamentBracketMatches);

    if (hydrationTasks.length) {
      await Promise.all(hydrationTasks);
    }

    tournamentsToRecompute.forEach((tournamentId) => {
      recomputeTournamentOrderOfPlayDays(tournamentId);
    });
  }

  function openTournamentMatchScheduleModal(matchId, context = {}) {
    if (!isAdmin()) return;
    const normalizedMatchId = normalizeId(matchId);
    if (!normalizedMatchId) {
      showGlobalMessage('Selecciona un partido válido.', 'error');
      return;
    }

    let resolvedTournamentId = normalizeId(context.tournamentId) || '';
    let resolvedCategoryId = normalizeId(context.categoryId) || '';
    let match = context.match || null;

    if (!match) {
      const located = findTournamentMatchContext(normalizedMatchId);
      if (located) {
        match = located.match;
        resolvedTournamentId = resolvedTournamentId || normalizeId(located.tournamentId) || '';
        resolvedCategoryId = resolvedCategoryId || normalizeId(located.categoryId) || '';
      }
    }

    if (!resolvedTournamentId) {
      resolvedTournamentId =
        normalizeId(state.selectedMatchTournamentId) ||
        normalizeId(state.selectedBracketTournamentId) ||
        '';
    }

    if (!resolvedCategoryId) {
      resolvedCategoryId =
        normalizeId(state.selectedMatchCategoryId) ||
        normalizeId(state.selectedBracketCategoryId) ||
        '';
    }

    if (!match && resolvedTournamentId && resolvedCategoryId) {
      const cacheKey = `${resolvedTournamentId}:${resolvedCategoryId}`;
      if (state.tournamentMatches instanceof Map && state.tournamentMatches.has(cacheKey)) {
        const list = state.tournamentMatches.get(cacheKey) || [];
        match = list.find((entry) => normalizeId(entry) === normalizedMatchId) || match;
      }
      if (!match && state.tournamentBracketMatches instanceof Map) {
        const bracketMatches = state.tournamentBracketMatches.get(cacheKey);
        if (Array.isArray(bracketMatches)) {
          match = bracketMatches.find((entry) => normalizeId(entry) === normalizedMatchId) || match;
        }
      }
    }

    if (!match) {
      showGlobalMessage('No se encontró el partido del torneo.', 'error');
      return;
    }

    const tournament = getTournamentById(resolvedTournamentId) || {};
    let category = getTournamentCategoryById(resolvedTournamentId, resolvedCategoryId);

    if (!category && resolvedTournamentId) {
      const detail = state.tournamentDetails.get(resolvedTournamentId);
      if (detail && Array.isArray(detail.categories)) {
        category = detail.categories.find((entry) => normalizeId(entry) === resolvedCategoryId) || null;
      }
    }

    const scheduleTemplates = getClubMatchScheduleTemplates();
    const scheduleFieldMarkup = `
      <div class="match-schedule-field">
        <input
          type="date"
          name="scheduledDate"
          data-match-schedule="date"
          class="sr-only"
          aria-label="Día del partido"
        />
        <input type="hidden" name="scheduledAt" />
        <input type="hidden" name="court" />
        <div class="match-schedule-picker" data-match-schedule="picker"></div>
        <div class="match-schedule-actions">
          <button type="button" class="ghost" data-match-schedule="clear">Dejar sin horario</button>
          <span class="form-hint">Selecciona una franja para reservar la pista automáticamente.</span>
        </div>
      </div>
    `;

    const statusOptions = Object.entries(TOURNAMENT_MATCH_STATUS_LABELS)
      .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
      .join('');

    const form = document.createElement('form');
    form.className = 'form';
    form.innerHTML = `
      <label>
        Torneo
        <input type="text" name="tournamentLabel" readonly />
      </label>
      <label>
        Categoría
        <input type="text" name="categoryLabel" readonly />
      </label>
      <div class="form-grid">
        <label>
          Jugador 1
          <input type="text" name="playerLabel1" readonly />
        </label>
        <label>
          Jugador 2
          <input type="text" name="playerLabel2" readonly />
        </label>
      </div>
      <label>
        Estado
        <select name="status" required>
          ${statusOptions}
        </select>
      </label>
      ${scheduleFieldMarkup}
      <p class="form-hint" data-match-court-info></p>
      <label class="checkbox-option">
        <input type="checkbox" name="notifyPlayers" value="true" />
        Notificar a los jugadores por correo y push
      </label>
      <div class="form-actions">
        <button type="submit" class="primary">Guardar horario</button>
        <button type="button" class="ghost" data-action="cancel">Cancelar</button>
      </div>
    `;

    const statusMessage = document.createElement('p');
    statusMessage.className = 'status-message';
    statusMessage.style.display = 'none';

    const tournamentField = form.elements.tournamentLabel;
    const categoryField = form.elements.categoryLabel;
    const playerOneField = form.elements.playerLabel1;
    const playerTwoField = form.elements.playerLabel2;
    const statusField = form.elements.status;
    const scheduledField = form.elements.scheduledAt;
    const courtField = form.elements.court;
    const scheduleDateField = form.elements.scheduledDate;
    const schedulePickerContainer = form.querySelector('[data-match-schedule="picker"]');
    const scheduleClearButton = form.querySelector('button[data-match-schedule="clear"]');
    const notifyField = form.elements.notifyPlayers;
    const courtInfoElement = form.querySelector('[data-match-court-info]');
    const cancelButton = form.querySelector('button[data-action="cancel"]');
    const submitButton = form.querySelector('button[type="submit"]');

    const playerNames = Array.isArray(match?.players)
      ? match.players.map((player, index) => {
          if (typeof player === 'object' && player) {
            return getPlayerDisplayName(player) || `Jugador ${index + 1}`;
          }
          const playerId = normalizeId(player);
          if (!playerId) {
            return `Jugador ${index + 1} por definir`;
          }
          const statePlayer = Array.isArray(state.players)
            ? state.players.find((item) => normalizeId(item) === playerId)
            : null;
          return getPlayerDisplayName(statePlayer) || `Jugador ${index + 1}`;
        })
      : [];

    if (tournamentField) {
      tournamentField.value = tournament?.name || 'Torneo';
    }
    if (categoryField) {
      categoryField.value = category?.name || 'Categoría';
    }
    if (playerOneField) {
      playerOneField.value = playerNames[0] || 'Jugador por definir';
    }
    if (playerTwoField) {
      playerTwoField.value = playerNames[1] || 'Jugador por definir';
    }

    const metaParts = [];
    if (Number.isFinite(Number(match?.matchNumber))) {
      metaParts.push(`Partido ${match.matchNumber}`);
    }
    if (match?.round) {
      metaParts.push(`Ronda: ${match.round}`);
    }
    if (metaParts.length) {
      const metaInfo = document.createElement('p');
      metaInfo.className = 'form-hint';
      metaInfo.textContent = metaParts.join(' · ');
      form.prepend(metaInfo);
    }

    const scheduledValue = formatDateTimeLocal(match?.scheduledAt);
    if (scheduledField) {
      scheduledField.value = scheduledValue;
    }
    if (courtField) {
      courtField.value = match?.court || '';
    }

    if (statusField) {
      const currentStatus = match?.status && TOURNAMENT_MATCH_STATUS_LABELS[match.status]
        ? match.status
        : scheduledValue
        ? 'programado'
        : 'pendiente';
      statusField.value = currentStatus;
    }

    const updateCourtInfoDisplay = () => {
      if (!courtInfoElement) {
        return;
      }
      const selectedCourt = courtField?.value?.trim();
      if (selectedCourt) {
        courtInfoElement.textContent = `Pista seleccionada: ${selectedCourt}.`;
        return;
      }
      if (match?.court && scheduledValue && scheduledField?.value === scheduledValue) {
        courtInfoElement.textContent = `Pista asignada automáticamente: ${match.court}.`;
        return;
      }
      courtInfoElement.textContent =
        'La pista se asignará automáticamente según la disponibilidad del club al guardar el horario.';
    };

    updateCourtInfoDisplay();

    scheduleDateField?.addEventListener('change', updateCourtInfoDisplay);
    scheduleDateField?.addEventListener('input', updateCourtInfoDisplay);

    if (notifyField) {
      notifyField.checked = !match?.scheduledAt;
    }

    let schedulePicker = null;
    if (schedulePickerContainer && scheduleDateField && scheduledField) {
      schedulePicker = createMatchScheduleSlotPicker({
        container: schedulePickerContainer,
        dateField: scheduleDateField,
        scheduledField,
        courtField,
        templates: scheduleTemplates,
        scope: 'admin',
        existingValue: scheduledField?.value || '',
        existingCourt: courtField?.value || match?.court || '',
        ignoreMatchId: match?._id || '',
        ignoreManualLimit: hasCourtManagementAccess(),
        onChange: () => {
          updateCourtInfoDisplay();
          if (statusField) {
            const hasSchedule = Boolean(scheduledField.value);
            if (hasSchedule && statusField.value === 'pendiente') {
              statusField.value = 'programado';
            } else if (!hasSchedule && statusField.value === 'programado') {
              statusField.value = 'pendiente';
            }
          }
        },
      });

      scheduleClearButton?.addEventListener('click', (event) => {
        event.preventDefault();
        schedulePicker.clear();
        updateCourtInfoDisplay();
      });
    }

    if (!schedulePicker && scheduledField && statusField) {
      const updateStatusForSchedule = () => {
        const hasSchedule = Boolean(scheduledField.value);
        if (hasSchedule && statusField.value === 'pendiente') {
          statusField.value = 'programado';
        } else if (!hasSchedule && statusField.value === 'programado') {
          statusField.value = 'pendiente';
        }
      };
      scheduledField.addEventListener('input', updateStatusForSchedule);
      scheduledField.addEventListener('change', updateStatusForSchedule);
      updateStatusForSchedule();
    }

    cancelButton?.addEventListener('click', (event) => {
      event.preventDefault();
      setStatusMessage(statusMessage, '', '');
      closeModal();
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!isAdmin()) return;

      const succeeded = await submitTournamentMatchSchedule({
        form,
        tournamentId: resolvedTournamentId,
        categoryId: resolvedCategoryId,
        matchId: normalizedMatchId,
        statusElement: statusMessage,
        submitButton,
      });

      if (succeeded) {
        closeModal();
      }
    });

    openModal({
      title: match?.scheduledAt ? 'Editar horario del partido' : 'Programar partido',
      content: (body) => {
        body.appendChild(form);
        body.appendChild(statusMessage);
      },
      onClose: () => {
        setStatusMessage(statusMessage, '', '');
        schedulePicker?.destroy();
      },
    });
  }

  function openTournamentMatchResultModal(matchId, context = {}) {
    if (!isAdmin()) return;

    const normalizedMatchId = normalizeId(matchId);
    if (!normalizedMatchId) {
      showGlobalMessage('Selecciona un partido válido.', 'error');
      return;
    }

    let resolvedTournamentId = normalizeId(context.tournamentId) || '';
    let resolvedCategoryId = normalizeId(context.categoryId) || '';
    let match = context.match || null;

    if (!match) {
      const located = findTournamentMatchContext(normalizedMatchId);
      if (located) {
        match = located.match;
        resolvedTournamentId = resolvedTournamentId || normalizeId(located.tournamentId) || '';
        resolvedCategoryId = resolvedCategoryId || normalizeId(located.categoryId) || '';
      }
    }

    if (!resolvedTournamentId) {
      resolvedTournamentId =
        normalizeId(state.selectedMatchTournamentId) ||
        normalizeId(state.selectedBracketTournamentId) ||
        '';
    }

    if (!resolvedCategoryId) {
      resolvedCategoryId =
        normalizeId(state.selectedMatchCategoryId) ||
        normalizeId(state.selectedBracketCategoryId) ||
        '';
    }

    if (!match && resolvedTournamentId && resolvedCategoryId) {
      const cacheKey = `${resolvedTournamentId}:${resolvedCategoryId}`;
      if (state.tournamentMatches instanceof Map && state.tournamentMatches.has(cacheKey)) {
        const list = state.tournamentMatches.get(cacheKey) || [];
        match = list.find((entry) => normalizeId(entry) === normalizedMatchId) || match;
      }
      if (!match && state.tournamentBracketMatches instanceof Map) {
        const bracketMatches = state.tournamentBracketMatches.get(cacheKey);
        if (Array.isArray(bracketMatches)) {
          match = bracketMatches.find((entry) => normalizeId(entry) === normalizedMatchId) || match;
        }
      }
    }

    if (!match) {
      showGlobalMessage('No se encontró el partido del torneo.', 'error');
      return;
    }

    const tournament = getTournamentById(resolvedTournamentId) || {};
    let category = getTournamentCategoryById(resolvedTournamentId, resolvedCategoryId);

    if (!category && resolvedTournamentId) {
      const detail = state.tournamentDetails.get(resolvedTournamentId);
      if (detail && Array.isArray(detail.categories)) {
        category = detail.categories.find((entry) => normalizeId(entry) === resolvedCategoryId) || null;
      }
    }

    const players = Array.isArray(match?.players) ? match.players.filter(Boolean) : [];
    const winnerOptions = players
      .map((player, index) => {
        const playerId = normalizeId(player);
        if (!playerId) {
          return '';
        }
        const label = getPlayerDisplayName(player) || `Jugador ${index + 1}`;
        return `<option value="${playerId}">${escapeHtml(label)}</option>`;
      })
      .filter(Boolean)
      .join('');

    const form = document.createElement('form');
    form.className = 'form';
    form.innerHTML = `
      <p class="form-hint">
        Registra el resultado definitivo del partido. El cuadro se actualizará automáticamente tras guardarlo.
      </p>
      <label>
        Torneo
        <input type="text" name="tournamentLabel" readonly />
      </label>
      <label>
        Categoría
        <input type="text" name="categoryLabel" readonly />
      </label>
      <div class="form-grid">
        <label>
          Jugador 1
          <input type="text" name="playerLabel1" readonly />
        </label>
        <label>
          Jugador 2
          <input type="text" name="playerLabel2" readonly />
        </label>
      </div>
      <label>
        Ganador
        <select name="winner" required>
          <option value="">Selecciona al ganador</option>
          ${winnerOptions}
        </select>
        <span class="form-hint">Solo puedes escoger entre los jugadores asignados.</span>
      </label>
      <label>
        Marcador
        <input type="text" name="score" placeholder="Ej: 6-4 3-6 10-8" maxlength="60" />
        <span class="form-hint">Introduce el marcador final o utiliza "WO" si corresponde.</span>
      </label>
      <label>
        Notas
        <textarea name="notes" rows="3" maxlength="300" placeholder="Información adicional del partido"></textarea>
      </label>
      <div class="form-actions">
        <button type="submit" class="primary">Guardar resultado</button>
        <button type="button" class="ghost" data-action="cancel">Cancelar</button>
      </div>
    `;

    const statusMessage = document.createElement('p');
    statusMessage.className = 'status-message';
    statusMessage.style.display = 'none';

    const tournamentField = form.elements.tournamentLabel;
    const categoryField = form.elements.categoryLabel;
    const playerOneField = form.elements.playerLabel1;
    const playerTwoField = form.elements.playerLabel2;
    const winnerField = form.elements.winner;
    const scoreField = form.elements.score;
    const notesField = form.elements.notes;
    const cancelButton = form.querySelector('button[data-action="cancel"]');
    const submitButton = form.querySelector('button[type="submit"]');

    const playerNames = players.map((player, index) => {
      if (typeof player === 'object' && player) {
        return getPlayerDisplayName(player) || `Jugador ${index + 1}`;
      }
      const playerId = normalizeId(player);
      if (!playerId) {
        return `Jugador ${index + 1}`;
      }
      const statePlayer = Array.isArray(state.players)
        ? state.players.find((item) => normalizeId(item) === playerId)
        : null;
      return getPlayerDisplayName(statePlayer) || `Jugador ${index + 1}`;
    });

    if (tournamentField) {
      tournamentField.value = tournament?.name || 'Torneo';
    }
    if (categoryField) {
      categoryField.value = category?.name || 'Categoría';
    }
    if (playerOneField) {
      playerOneField.value = playerNames[0] || 'Jugador por definir';
    }
    if (playerTwoField) {
      playerTwoField.value = playerNames[1] || 'Jugador por definir';
    }

    if (winnerField && players.length === 0) {
      winnerField.disabled = true;
      if (submitButton) {
        submitButton.disabled = true;
      }
      setStatusMessage(
        statusMessage,
        'warning',
        'Asigna jugadores al partido antes de registrar el resultado.'
      );
    } else {
      setStatusMessage(statusMessage, '', '');
    }

    const existingWinnerId = normalizeId(match?.result?.winner);
    if (winnerField && existingWinnerId) {
      winnerField.value = existingWinnerId;
    }

    if (scoreField && typeof match?.result?.score === 'string') {
      scoreField.value = match.result.score;
    }
    if (notesField && typeof match?.result?.notes === 'string') {
      notesField.value = match.result.notes;
    }

    cancelButton?.addEventListener('click', (event) => {
      event.preventDefault();
      setStatusMessage(statusMessage, '', '');
      closeModal();
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!isAdmin()) return;

      const succeeded = await submitTournamentMatchResult({
        form,
        tournamentId: resolvedTournamentId,
        categoryId: resolvedCategoryId,
        matchId: normalizedMatchId,
        statusElement: statusMessage,
        submitButton,
      });

      if (succeeded) {
        closeModal();
      }
    });

    openModal({
      title: match?.result?.winner ? 'Editar resultado del partido' : 'Registrar resultado del partido',
      content: (body) => {
        body.appendChild(form);
        body.appendChild(statusMessage);
      },
      onClose: () => setStatusMessage(statusMessage, '', ''),
    });
  }
  return {
    applyTournamentBracketRoundOffsets,
    applyTournamentMatchUpdate,
    buildTournamentBracketGrid,
    calculateTournamentPaymentTotal,
    clearTournamentEnrollmentFilters,
    clearTournamentState,
    collectTournamentSeedAssignments,
    compareTournamentsBySchedule,
    createEmptyTournamentFeeInfo,
    createTournamentBracketSection,
    createTournamentDoublesCategoryCard,
    createTournamentPaymentItem,
    ensureTournamentBracketResizeHandler,
    ensureTournamentEnrollmentFilters,
    ensureTournamentPaymentFilters,
    fetchTournamentDoublesPairs,
    fetchTournamentEnrollments,
    fillTournamentSelect,
    findTournamentMatchContext,
    formatTournamentCategoryStatusLabel,
    formatTournamentDateRange,
    formatTournamentEnrollmentStatusLabel,
    formatTournamentMatchFormat,
    formatTournamentMatchStatusLabel,
    formatTournamentMatchType,
    formatTournamentPaymentTotal,
    formatTournamentResultStatusLabel,
    formatTournamentStatusLabel,
    getCachedTournamentBracketMatches,
    getTournamentBracketCacheKey,
    getTournamentById,
    getTournamentCategories,
    getTournamentCategoryById,
    getTournamentDoublesPairCacheKey,
    getTournamentEnrollmentCacheKey,
    getTournamentOrderOfPlayDays,
    getTournamentPaymentData,
    getTournamentsWithEnrollmentFee,
    handleTournamentPaymentFormSubmit,
    hydrateTournamentMatchesWithPairs,
    loadTournamentBracketContext,
    loadTournamentDashboard,
    loadTournamentDetail,
    openTournamentAdminEnrollmentModal,
    openTournamentMatchResultModal,
    openTournamentMatchScheduleModal,
    openTournamentSelfEnrollmentModal,
    persistTournamentBracketSeeds,
    recomputeTournamentOrderOfPlayDays,
    refreshTournamentBracketLayoutColumns,
    refreshTournamentBracketMatches,
    refreshTournamentDetail,
    refreshTournamentDoubles,
    refreshTournamentEnrollments,
    refreshTournamentMatches,
    refreshTournamentPayments,
    reloadTournaments,
    renderGlobalTournaments,
    renderTournamentBracket,
    renderTournamentBracketSeeds,
    renderTournamentCategories,
    renderTournamentDashboard,
    renderTournamentDetail,
    renderTournamentDoubles,
    renderTournamentDrawCards,
    renderTournamentEnrollments,
    renderTournamentMatches,
    renderTournamentPayments,
    renderTournaments,
    resetTournamentPaymentGroups,
    resolveTournamentFeeInfo,
    runTournamentBracketAlignmentCallbacks,
    scheduleTournamentBracketAlignment,
    setTournamentEnrollmentFilterAvailability,
    tournamentHasEnrollmentFee,
    updateTournamentActionAvailability,
    updateTournamentCategoriesPoster,
    updateTournamentCategoryCache,
    updateTournamentEnrollmentCount,
    updateTournamentOrderOfPlayControls,
    updateTournamentPaymentControls,
    updateTournamentPaymentFeeIndicator,
    updateTournamentPaymentMenuVisibility,
    updateTournamentPaymentTotalElement,
    updateTournamentSelectors,
    validateTournamentSeedAssignments
  };
}
