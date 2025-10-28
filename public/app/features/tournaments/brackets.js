export function createTournamentBracketsModule(deps = {}) {
  const {
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
  } = deps;

  if (!state || typeof state !== 'object') {
    throw new Error('Missing application state for tournament brackets module.');
  }
  if (typeof request !== 'function') {
    throw new Error('Missing request helper for tournament brackets module.');
  }
  if (typeof normalizeId !== 'function') {
    throw new Error('Missing normalizeId helper for tournament brackets module.');
  }
  if (typeof getPlayerDisplayName !== 'function') {
    throw new Error('Missing getPlayerDisplayName helper for tournament brackets module.');
  }
  if (typeof setStatusMessage !== 'function') {
    throw new Error('Missing setStatusMessage helper for tournament brackets module.');
  }
  if (typeof scheduleOnNextAnimationFrame !== 'function') {
    throw new Error('Missing scheduleOnNextAnimationFrame helper for tournament brackets module.');
  }
  if (typeof createBracketMatchCard !== 'function') {
    throw new Error('Missing createBracketMatchCard helper for tournament brackets module.');
  }
  if (typeof createBracketRoundNavigation !== 'function') {
    throw new Error('Missing createBracketRoundNavigation helper for tournament brackets module.');
  }
  if (typeof buildSeedLookup !== 'function') {
    throw new Error('Missing buildSeedLookup helper for tournament brackets module.');
  }
  if (typeof determineInitialBracketRoundIndex !== 'function') {
    throw new Error('Missing determineInitialBracketRoundIndex helper for tournament brackets module.');
  }
  if (typeof fetchTournamentEnrollments !== 'function') {
    throw new Error('Missing fetchTournamentEnrollments helper for tournament brackets module.');
  }
  if (typeof fetchTournamentDoublesPairs !== 'function') {
    throw new Error('Missing fetchTournamentDoublesPairs helper for tournament brackets module.');
  }
  if (typeof hydrateTournamentMatchesWithPairs !== 'function') {
    throw new Error('Missing hydrateTournamentMatchesWithPairs helper for tournament brackets module.');
  }
  if (typeof refreshTournamentDetail !== 'function') {
    throw new Error('Missing refreshTournamentDetail helper for tournament brackets module.');
  }
  if (typeof updateTournamentCategoryCache !== 'function') {
    throw new Error('Missing updateTournamentCategoryCache helper for tournament brackets module.');
  }
  if (typeof updateTournamentActionAvailability !== 'function') {
    throw new Error('Missing updateTournamentActionAvailability helper for tournament brackets module.');
  }
  if (typeof updateBracketSizeSelect !== 'function') {
    throw new Error('Missing updateBracketSizeSelect helper for tournament brackets module.');
  }
  if (typeof getTournamentCategoryById !== 'function') {
    throw new Error('Missing getTournamentCategoryById helper for tournament brackets module.');
  }

  let pendingTournamentBracketKey = '';

  function ensureAlignmentCallbacks() {
    if (!(state.tournamentBracketAlignmentCallbacks instanceof Set)) {
      state.tournamentBracketAlignmentCallbacks = new Set();
    }
    return state.tournamentBracketAlignmentCallbacks;
  }

  function refreshTournamentBracketLayoutColumns() {
    if (!tournamentBracketLayout) {
      return;
    }
    const seedsVisible = tournamentBracketSeedsCard && !tournamentBracketSeedsCard.hidden;
    tournamentBracketLayout.classList.toggle(
      'tournament-bracket-layout--single-column',
      !seedsVisible
    );
  }

  function runTournamentBracketAlignmentCallbacks() {
    const callbacks = ensureAlignmentCallbacks();
    callbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });
  }

  function ensureTournamentBracketResizeHandler() {
    if (typeof window === 'undefined') {
      return;
    }

    if (typeof state.tournamentBracketResizeHandler === 'function') {
      return;
    }

    let pendingFrame = null;
    const handler = () => {
      if (pendingFrame !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(pendingFrame);
        pendingFrame = null;
      }

      const runCallbacks = () => {
        pendingFrame = null;
        runTournamentBracketAlignmentCallbacks();
      };

      if (typeof requestAnimationFrame === 'function') {
        pendingFrame = requestAnimationFrame(runCallbacks);
      } else {
        setTimeout(runCallbacks, 16);
      }
    };

    state.tournamentBracketResizeHandler = handler;
    window.addEventListener('resize', handler);
  }

  function applyTournamentBracketRoundOffsets(grid) {
    if (!(grid instanceof HTMLElement)) {
      return;
    }

    const roundLists = Array.from(grid.querySelectorAll('.bracket-round__matches')).filter(
      (roundList) => {
        const roundSection = roundList.closest('.bracket-round');
        return !(
          roundSection instanceof HTMLElement && roundSection.classList.contains('bracket-round--hidden')
        );
      }
    );

    if (!roundLists.length) {
      grid.style.removeProperty('--bracket-match-height');
      return;
    }

    const baseRound = roundLists[0];
    const baseMatches = Array.from(baseRound.querySelectorAll('.bracket-match')).filter(
      (match) => match instanceof HTMLElement
    );

    const baseMatch = baseMatches[0];
    if (!(baseMatch instanceof HTMLElement)) {
      return;
    }

    const baseHeight = baseMatch.offsetHeight;
    const baseGap = Number.parseInt(getComputedStyle(baseRound).rowGap, 10) || 0;
    const matchStride = baseHeight + baseGap;

    const computeOffset = (roundIndex) => {
      if (roundIndex <= 0) {
        return 0;
      }
      return Math.pow(2, roundIndex - 1) * matchStride - baseGap / 2;
    };

    const computeGap = (roundIndex) => {
      if (roundIndex <= 0) {
        return baseGap;
      }
      const desiredGap = Math.pow(2, roundIndex) * matchStride - baseHeight;
      return Math.max(0, desiredGap);
    };

    roundLists.forEach((roundList, roundIndex) => {
      if (!(roundList instanceof HTMLElement)) {
        return;
      }

      const offset = computeOffset(roundIndex);
      const gap = computeGap(roundIndex);

      if (roundIndex === 0 && offset === 0) {
        roundList.style.removeProperty('--bracket-round-offset');
      } else {
        roundList.style.setProperty('--bracket-round-offset', `${offset}px`);
      }

      roundList.style.setProperty('--bracket-match-gap', `${gap}px`);
    });
  }

  function scheduleTournamentBracketAlignment(section) {
    if (!(section instanceof HTMLElement)) {
      return;
    }

    const grid = section.querySelector('.tournament-bracket-grid');
    if (!(grid instanceof HTMLElement)) {
      return;
    }

    ensureTournamentBracketResizeHandler();

    const callbacks = ensureAlignmentCallbacks();
    const alignmentCallback = () => {
      if (!grid.isConnected) {
        callbacks.delete(alignmentCallback);
        return;
      }

      applyTournamentBracketRoundOffsets(grid);
    };

    callbacks.add(alignmentCallback);
    scheduleOnNextAnimationFrame(alignmentCallback);
  }

  function getTournamentBracketCacheKey(tournamentId, categoryId) {
    if (!tournamentId || !categoryId) {
      return '';
    }
    return `${tournamentId}:${categoryId}`;
  }

  function getCachedTournamentBracketMatches(tournamentId, categoryId) {
    if (!tournamentId || !categoryId) {
      return [];
    }

    if (!(state.tournamentBracketMatches instanceof Map)) {
      return [];
    }

    const cacheKey = getTournamentBracketCacheKey(tournamentId, categoryId);
    const cached = state.tournamentBracketMatches.get(cacheKey);
    return Array.isArray(cached) ? cached : [];
  }

  function buildTournamentBracketGrid(matches = [], { seedByPlayer = new Map(), drawSize = null } = {}) {
    const grid = document.createElement('div');
    grid.className = 'tournament-bracket-grid';

    const rounds = new Map();
    matches.forEach((match) => {
      const roundKey = Number.isFinite(Number(match?.round)) ? Number(match.round) : 0;
      if (!rounds.has(roundKey)) {
        rounds.set(roundKey, []);
      }
      rounds.get(roundKey).push(match);
    });

    const sortedRounds = Array.from(rounds.entries())
      .map(([round, roundMatches]) => ({ round, matches: roundMatches }))
      .sort((a, b) => a.round - b.round);

    const fallbackTitleMap = new Map();
    if (Number.isFinite(drawSize) && drawSize > 0) {
      let remaining = drawSize;
      let roundIndex = 0;
      while (remaining >= 1) {
        const matchCount = Math.max(1, Math.floor(remaining / 2));
        fallbackTitleMap.set(matchCount, `Ronda ${roundIndex + 1}`);
        remaining = matchCount;
        roundIndex += 1;
      }
    }

    const roundSections = [];
    sortedRounds.forEach((roundEntry, roundIndex) => {
      const roundMatches = roundEntry.matches || [];
      const totalRounds = sortedRounds.length;

      const roundSection = document.createElement('section');
      roundSection.className = 'bracket-round';
      roundSection.dataset.roundIndex = String(roundIndex);

      const roundTitle = document.createElement('h5');
      roundTitle.className = 'bracket-round__title';

      const matchCountLabel = Math.max(roundMatches.length, 1);
      const displayName =
        roundEntry.name ||
        fallbackTitleMap.get(matchCountLabel) ||
        `Ronda ${roundEntry.order || roundIndex + 1}`;

      roundTitle.textContent = displayName;
      roundSection.dataset.roundName = displayName;
      roundSection.appendChild(roundTitle);

      const matchList = document.createElement('div');
      matchList.className = 'bracket-round__matches bracket-round__matches--list';

      if (!roundMatches.length) {
        const placeholder = document.createElement('div');
        placeholder.className = 'bracket-round__empty';
        placeholder.textContent = 'Partidos pendientes de definir.';
        matchList.appendChild(placeholder);
      } else {
        roundMatches.forEach((match, matchIndex) => {
          const card = createBracketMatchCard(match, seedByPlayer, {
            roundIndex,
            totalRounds,
            slotIndex: matchIndex,
            useConnectors: true,
          });
          matchList.appendChild(card);
        });
      }

      roundSection.appendChild(matchList);
      grid.appendChild(roundSection);
      roundSections.push(roundSection);
    });

    const initialRoundIndex = determineInitialBracketRoundIndex(sortedRounds);
    const navigation = createBracketRoundNavigation(roundSections, grid, {
      initialRoundIndex,
    });

    if (navigation) {
      const wrapper = document.createElement('div');
      wrapper.className = 'tournament-bracket-grid-wrapper';
      wrapper.appendChild(navigation);
      wrapper.appendChild(grid);
      return wrapper;
    }

    return grid;
  }

  function createTournamentBracketSection({
    title = '',
    matches = [],
    seedByPlayer = new Map(),
    drawSize = null,
  } = {}) {
    const section = document.createElement('section');
    section.className = 'tournament-bracket-section';

    const heading = document.createElement('h4');
    heading.className = 'tournament-bracket-section__title';
    heading.textContent = title || '';
    section.appendChild(heading);

    const grid = buildTournamentBracketGrid(matches, { seedByPlayer, drawSize });
    section.appendChild(grid);

    scheduleTournamentBracketAlignment(section);

    return section;
  }

  function renderTournamentBracket(matches = [], { loading = false, error = '' } = {}) {
    if (!tournamentBracketView || !tournamentBracketEmpty) {
      return;
    }

    tournamentBracketView.innerHTML = '';
    if (tournamentConsolationView) {
      tournamentConsolationView.innerHTML = '';
    }

    const callbacks = ensureAlignmentCallbacks();
    callbacks.clear();

    const hideConsolationCard = (message) => {
      if (tournamentConsolationEmpty) {
        tournamentConsolationEmpty.hidden = false;
        tournamentConsolationEmpty.textContent =
          message || 'El cuadro de consolación se mostrará aquí cuando esté disponible.';
      }
      if (tournamentConsolationViewCard) {
        tournamentConsolationViewCard.hidden = true;
      }
    };

    const showConsolationMessage = (message) => {
      if (tournamentConsolationEmpty) {
        tournamentConsolationEmpty.hidden = false;
        tournamentConsolationEmpty.textContent = message;
      }
      if (tournamentConsolationViewCard) {
        tournamentConsolationViewCard.hidden = false;
      }
    };

    hideConsolationCard();

    const tournamentId = state.selectedBracketTournamentId;
    const categoryId = state.selectedBracketCategoryId;

    if (!tournamentId || !categoryId) {
      tournamentBracketEmpty.hidden = false;
      tournamentBracketEmpty.textContent =
        'Selecciona una categoría para visualizar su cuadro de juego.';
      return;
    }

    if (loading) {
      tournamentBracketEmpty.hidden = false;
      tournamentBracketEmpty.textContent = 'Cargando cuadro de juego...';
      showConsolationMessage('Cargando cuadro de consolación...');
      return;
    }

    if (error) {
      tournamentBracketEmpty.hidden = false;
      tournamentBracketEmpty.textContent = error;
      showConsolationMessage('No fue posible cargar el cuadro de consolación.');
      return;
    }

    const normalizedMatches = Array.isArray(matches) ? matches : [];
    const mainMatches = normalizedMatches.filter((match) => match?.bracketType === 'principal');
    const consolationMatches = normalizedMatches.filter(
      (match) => match?.bracketType === 'consolacion'
    );

    if (!mainMatches.length && !consolationMatches.length) {
      tournamentBracketEmpty.hidden = false;
      tournamentBracketEmpty.textContent = 'Aún no se ha generado el cuadro para esta categoría.';
      showConsolationMessage('Aún no se ha generado el cuadro de consolación para esta categoría.');
      return;
    }

    const category = getTournamentCategoryById(tournamentId, categoryId);
    const seedLookup = buildSeedLookup(category);
    const seedByPlayer = seedLookup.byPlayer;

    if (mainMatches.length) {
      const mainSection = createTournamentBracketSection({
        title: 'Cuadro principal',
        matches: mainMatches,
        seedByPlayer,
        drawSize: category?.drawSize,
      });
      tournamentBracketView.appendChild(mainSection);
      tournamentBracketEmpty.hidden = true;
    } else {
      tournamentBracketEmpty.hidden = false;
      tournamentBracketEmpty.textContent = 'Esta categoría no tiene partidos en el cuadro principal.';
    }

    if (consolationMatches.length && tournamentConsolationView) {
      const consolationSection = createTournamentBracketSection({
        title: 'Cuadro de consolación',
        matches: consolationMatches,
        seedByPlayer,
      });
      tournamentConsolationView.appendChild(consolationSection);
      if (tournamentConsolationEmpty) {
        tournamentConsolationEmpty.hidden = true;
      }
      if (tournamentConsolationViewCard) {
        tournamentConsolationViewCard.hidden = false;
      }
    } else {
      showConsolationMessage('Esta categoría no tiene partidos en el cuadro de consolación.');
    }
  }

  function renderTournamentBracketSeeds({
    tournamentId = '',
    categoryId = '',
    enrollments = [],
    category = null,
    pairs = [],
  } = {}) {
    if (!tournamentBracketSeedsContainer) {
      return;
    }

    tournamentBracketSeedsContainer.innerHTML = '';

    const hasSelection = Boolean(tournamentId && categoryId);
    if (!hasSelection) {
      const message = document.createElement('p');
      message.className = 'empty-state';
      message.textContent = 'Selecciona un torneo y categoría para configurar las siembras.';
      tournamentBracketSeedsContainer.appendChild(message);
      state.tournamentBracketSeedsDirty = false;
      if (tournamentBracketSaveSeedsButton) {
        tournamentBracketSaveSeedsButton.disabled = true;
      }
      return;
    }

    const isDoubles = category?.matchType === 'dobles';
    const participantPluralLabel = isDoubles ? 'parejas' : 'jugadores';

    let participants = [];

    if (isDoubles) {
      participants = (Array.isArray(pairs) ? pairs : [])
        .map((pair) => {
          if (!pair) {
            return null;
          }
          const id = normalizeId(pair);
          if (!id) {
            return null;
          }
          const members = Array.isArray(pair.players)
            ? pair.players.map((member) => (member ? member : null)).filter(Boolean)
            : [];
          if (members.length !== 2) {
            return null;
          }
          return { ...pair, id };
        })
        .filter(Boolean)
        .sort((a, b) => getPlayerDisplayName(a).localeCompare(getPlayerDisplayName(b), 'es'));
    } else {
      const activeEnrollments = Array.isArray(enrollments)
        ? enrollments.filter((entry) => entry && entry.status !== 'cancelada' && entry.user)
        : [];

      participants = activeEnrollments
        .map((entry) => entry.user)
        .filter(Boolean)
        .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'es'));
    }

    const seedLookup = buildSeedLookup(category);
    const drawSizeValue = Number(tournamentBracketSizeSelect?.value);
    const baseDrawSize = Number(category?.drawSize);
    const participantCount = participants.length;
    const drawSize = drawSizeValue || baseDrawSize || participantCount;
    const maxSeeds = Math.max(
      seedLookup.bySeed.size,
      Math.min(participantCount, drawSize || participantCount)
    );

    const editable = isAdmin();

    if (!participants.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = `No hay ${participantPluralLabel} inscritos disponibles para asignar siembras.`;
      tournamentBracketSeedsContainer.appendChild(empty);
      state.tournamentBracketSeedsDirty = false;
      if (tournamentBracketSaveSeedsButton) {
        tournamentBracketSaveSeedsButton.disabled = true;
      }
      return;
    }

    for (let seedNumber = 1; seedNumber <= Math.max(maxSeeds, 1); seedNumber += 1) {
      const entry = document.createElement('div');
      entry.className = 'tournament-seed-entry';

      const label = document.createElement('div');
      label.className = 'tournament-seed-entry__label';
      label.textContent = `Cabeza de serie #${seedNumber}`;
      entry.appendChild(label);

      const assignedPlayerId = seedLookup.bySeed.get(seedNumber);
      if (editable) {
        const select = document.createElement('select');
        select.dataset.seedNumber = String(seedNumber);
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Sin asignar';
        select.appendChild(placeholder);

        participants.forEach((participant) => {
          const option = document.createElement('option');
          const participantId = normalizeId(participant);
          option.value = participantId;
          option.textContent = getPlayerDisplayName(participant);
          if (assignedPlayerId && participantId === assignedPlayerId) {
            option.selected = true;
          }
          select.appendChild(option);
        });

        select.addEventListener('change', () => {
          state.tournamentBracketSeedsDirty = true;
          if (tournamentBracketSaveSeedsButton) {
            tournamentBracketSaveSeedsButton.disabled = false;
          }
          updateTournamentActionAvailability();
        });

        entry.appendChild(select);
      } else {
        const info = document.createElement('div');
        info.className = 'tournament-seed-entry__player';
        if (assignedPlayerId) {
          const participant =
            participants.find((item) => normalizeId(item) === assignedPlayerId) ||
            (Array.isArray(category?.seeds)
              ? category.seeds.find((seed) => normalizeId(seed.player) === assignedPlayerId)?.player
              : null);
          const participantName =
            participant && typeof participant === 'object' ? getPlayerDisplayName(participant) : '';
          info.textContent = participantName || 'Sin asignar';
        } else {
          info.textContent = 'Sin asignar';
        }
        entry.appendChild(info);
      }

      tournamentBracketSeedsContainer.appendChild(entry);
    }

    state.tournamentBracketSeedsDirty = false;
    if (tournamentBracketSaveSeedsButton) {
      tournamentBracketSaveSeedsButton.disabled = !editable;
    }

    updateTournamentActionAvailability();
  }

  function collectTournamentSeedAssignments() {
    if (!tournamentBracketSeedsContainer) {
      return [];
    }

    const selects = tournamentBracketSeedsContainer.querySelectorAll('select[data-seed-number]');
    const assignments = [];
    selects.forEach((select) => {
      const seedNumber = Number(select.dataset.seedNumber);
      const playerId = select.value;
      if (Number.isFinite(seedNumber) && seedNumber > 0 && playerId) {
        assignments.push({ seedNumber, player: playerId });
      }
    });
    return assignments;
  }

  function validateTournamentSeedAssignments(assignments = []) {
    const seenSeeds = new Set();
    const seenPlayers = new Set();
    for (const entry of assignments) {
      const seedNumber = Number(entry?.seedNumber);
      const playerId = normalizeId(entry?.player);
      if (!seedNumber || !playerId) {
        continue;
      }
      if (seenSeeds.has(seedNumber)) {
        return 'Cada número de siembra solo se puede asignar a un participante.';
      }
      if (seenPlayers.has(playerId)) {
        return 'Un participante no puede tener más de una siembra asignada.';
      }
      seenSeeds.add(seedNumber);
      seenPlayers.add(playerId);
    }
    return '';
  }

  async function persistTournamentBracketSeeds(assignments, { silent = false } = {}) {
    if (!isAdmin()) {
      return true;
    }

    const tournamentId = state.selectedBracketTournamentId;
    const categoryId = state.selectedBracketCategoryId;
    if (!tournamentId || !categoryId) {
      return false;
    }

    const payload = Array.isArray(assignments) ? assignments : [];

    try {
      const response = await request(`/tournaments/${tournamentId}/categories/${categoryId}/seeds`, {
        method: 'POST',
        body: { seeds: payload },
      });
      if (response && typeof response === 'object') {
        updateTournamentCategoryCache(tournamentId, response);
      }
      state.tournamentBracketSeedsDirty = false;
      if (tournamentBracketSaveSeedsButton) {
        tournamentBracketSaveSeedsButton.disabled = true;
      }
      if (!silent) {
        setStatusMessage(
          tournamentBracketStatus,
          'success',
          'Cabezas de serie actualizadas correctamente.'
        );
      }
      await refreshTournamentDetail(tournamentId);
      return true;
    } catch (error) {
      if (!silent) {
        setStatusMessage(tournamentBracketStatus, 'error', error.message);
      }
      return false;
    }
  }

  async function refreshTournamentBracketMatches({ forceReload = false } = {}) {
    const tournamentId = state.selectedBracketTournamentId;
    const categoryId = state.selectedBracketCategoryId;

    if (!tournamentId || !categoryId) {
      renderTournamentBracket([], { loading: false });
      return;
    }

    const cacheKey = getTournamentBracketCacheKey(tournamentId, categoryId);
    if (!forceReload && state.tournamentBracketMatches.has(cacheKey)) {
      let cached = state.tournamentBracketMatches.get(cacheKey) || [];
      cached = await hydrateTournamentMatchesWithPairs(cached, {
        tournamentId,
        categoryId,
      });
      state.tournamentBracketMatches.set(cacheKey, cached);
      renderTournamentBracket(cached);
      updateTournamentActionAvailability();
      return;
    }

    pendingTournamentBracketKey = cacheKey;
    renderTournamentBracket([], { loading: true });

    try {
      const response = await request(`/tournaments/${tournamentId}/categories/${categoryId}/matches`);
      let list = Array.isArray(response) ? response : [];
      list = await hydrateTournamentMatchesWithPairs(list, { tournamentId, categoryId });
      state.tournamentBracketMatches.set(cacheKey, list);
      if (pendingTournamentBracketKey === cacheKey) {
        renderTournamentBracket(list);
        updateTournamentActionAvailability();
      }
    } catch (error) {
      if (pendingTournamentBracketKey === cacheKey) {
        renderTournamentBracket([], {
          error: error.message || 'No fue posible cargar el cuadro.',
        });
        updateTournamentActionAvailability();
      }
    } finally {
      if (pendingTournamentBracketKey === cacheKey) {
        pendingTournamentBracketKey = '';
      }
    }
  }

  async function loadTournamentBracketContext({
    tournamentId = state.selectedBracketTournamentId,
    categoryId = state.selectedBracketCategoryId,
    forceMatches = false,
  } = {}) {
    if (!tournamentId || !categoryId) {
      renderTournamentBracketSeeds();
      renderTournamentBracket([], { loading: false });
      return;
    }

    setStatusMessage(tournamentBracketStatus, '', '');

    let category = getTournamentCategoryById(tournamentId, categoryId);
    if (!category) {
      try {
        await refreshTournamentDetail(tournamentId);
        category = getTournamentCategoryById(tournamentId, categoryId);
      } catch (error) {
        setStatusMessage(tournamentBracketStatus, 'error', error.message);
      }
    }

    updateBracketSizeSelect(category);

    let enrollments = [];
    try {
      enrollments = await fetchTournamentEnrollments(tournamentId, categoryId, { forceReload: false });
    } catch (error) {
      setStatusMessage(tournamentBracketStatus, 'error', error.message);
    }

    let pairs = [];
    if (category?.matchType === 'dobles') {
      try {
        pairs = await fetchTournamentDoublesPairs(tournamentId, categoryId, { forceReload: false });
      } catch (error) {
        setStatusMessage(tournamentBracketStatus, 'error', error.message);
      }
    }

    renderTournamentBracketSeeds({
      tournamentId,
      categoryId,
      enrollments,
      category,
      pairs,
    });

    await refreshTournamentBracketMatches({ forceReload: forceMatches });
  }

  return {
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
  };
}
