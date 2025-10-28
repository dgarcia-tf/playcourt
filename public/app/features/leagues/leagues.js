export function createLeaguesModule(deps = {}) {
  const {
    state,
    normalizeId,
  } = deps;

  if (!state || typeof state !== 'object') {
    throw new Error('Missing application state for leagues module.');
  }
  if (typeof normalizeId !== 'function') {
    throw new Error('Missing normalizeId helper for leagues module.');
  }

  function ensureRankingFilters() {
    if (!state.rankingFilters || typeof state.rankingFilters !== 'object') {
      state.rankingFilters = { league: '' };
    } else if (typeof state.rankingFilters.league !== 'string') {
      state.rankingFilters.league = String(state.rankingFilters.league || '');
    }
    return state.rankingFilters;
  }

  function ensureCategoryFilters() {
    if (!state.categoryFilters) {
      state.categoryFilters = { league: '' };
    } else if (typeof state.categoryFilters.league !== 'string') {
      state.categoryFilters.league = String(state.categoryFilters.league || '');
    }
    return state.categoryFilters;
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

  function formatLeagueOptionLabel(league) {
    if (!league) return 'Liga';
    const name = league.name || 'Liga';
    const year = league.year ? ` · ${league.year}` : '';
    return `${name}${year}`;
  }

  function compareLeaguesByHistory(leagueA, leagueB) {
    const yearA = Number.parseInt(leagueA?.year, 10);
    const yearB = Number.parseInt(leagueB?.year, 10);
    const hasYearA = Number.isFinite(yearA);
    const hasYearB = Number.isFinite(yearB);
    if (hasYearA || hasYearB) {
      if (!hasYearA) return 1;
      if (!hasYearB) return -1;
      if (yearA !== yearB) {
        return yearA - yearB;
      }
    }

    const startA = Date.parse(leagueA?.startDate);
    const startB = Date.parse(leagueB?.startDate);
    const hasStartA = Number.isFinite(startA);
    const hasStartB = Number.isFinite(startB);
    if (hasStartA || hasStartB) {
      if (!hasStartA) return 1;
      if (!hasStartB) return -1;
      if (startA !== startB) {
        return startA - startB;
      }
    }

    const createdA = Date.parse(leagueA?.createdAt);
    const createdB = Date.parse(leagueB?.createdAt);
    const hasCreatedA = Number.isFinite(createdA);
    const hasCreatedB = Number.isFinite(createdB);
    if (hasCreatedA || hasCreatedB) {
      if (!hasCreatedA) return 1;
      if (!hasCreatedB) return -1;
      if (createdA !== createdB) {
        return createdA - createdB;
      }
    }

    return formatLeagueOptionLabel(leagueA).localeCompare(
      formatLeagueOptionLabel(leagueB),
      'es'
    );
  }

  function getLeagueById(leagueId) {
    const normalized = normalizeId(leagueId);
    if (!normalized) return null;
    if (!Array.isArray(state.leagues)) return null;
    return state.leagues.find((league) => normalizeId(league) === normalized) || null;
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
      filters.search = '';
      filtersReset = true;
    }

    return { filtersReset };
  }

  return {
    ensureRankingFilters,
    ensureCategoryFilters,
    ensureLeaguePlayerFilters,
    ensureLeaguePaymentFilters,
    leagueHasEnrollmentFee,
    getLeaguesWithEnrollmentFee,
    formatLeagueOptionLabel,
    compareLeaguesByHistory,
    getLeagueById,
    getLeagueCategories,
    getLeagueIdForCategory,
    invalidateLeaguePaymentsByCategory,
    pruneLeagueCaches,
  };
}
