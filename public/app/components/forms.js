export function createFormComponents(deps = {}) {
  const {
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
  } = deps;

  if (!state) {
    throw new Error('createFormComponents requires the application state.');
  }

  if (typeof isAdmin !== 'function') {
    throw new Error('createFormComponents requires an isAdmin helper.');
  }

  if (typeof normalizeId !== 'function') {
    throw new Error('createFormComponents requires a normalizeId helper.');
  }

  if (typeof getPlayerDisplayName !== 'function') {
    throw new Error('createFormComponents requires a getPlayerDisplayName helper.');
  }

  const escapeHtmlSafe =
    typeof escapeHtml === 'function'
      ? escapeHtml
      : (value) =>
          String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

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

  function parseScoreStringSets(rawScore, playerIds = []) {
    if (typeof rawScore !== 'string' || playerIds.length < 2) {
      return [];
    }

    const cleaned = rawScore.trim();
    if (!cleaned) {
      return [];
    }

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
    }

    return sets;
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

  function extractResultSets(match) {
    const players = Array.isArray(match?.players) ? match.players : [];
    const playerIds = players.map((player) => normalizeId(player));
    const rawSets = Array.isArray(match?.result?.sets) ? match.result.sets : [];

    if (!playerIds.length) {
      return [];
    }

    const normalizedSets = rawSets
      .map((set, index) => {
        const number = Number.isFinite(Number(set?.number)) ? Number(set.number) : index + 1;
        const tieBreak = Boolean(set?.tieBreak);
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

    if (normalizedSets.length) {
      return normalizedSets;
    }

    return parseScoreStringSets(match?.result?.score, playerIds);
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
        tieBreak: Boolean(set.tieBreak),
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
        typeof getPlayerDisplayName === 'function'
          ? getPlayerDisplayName(participant.player)
          : typeof participant.player === 'object'
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
        const name =
          typeof player === 'object' ? player.fullName || player.email || 'Jugador' : 'Jugador';
        return `${name}: ${games} juego${games === 1 ? '' : 's'}`;
      })
      .join(' · ');
  }

  function getResultConfirmation(match, userId) {
    const normalizedUserId = userId ? normalizeId(userId) : normalizeId(state.user);
    if (!match?.result?.confirmations || !normalizedUserId) return null;
    const confirmations = match.result.confirmations;
    if (typeof confirmations.get === 'function') {
      return confirmations.get(normalizedUserId) || null;
    }
    if (typeof confirmations === 'object') {
      return confirmations[normalizedUserId] || null;
    }
    return null;
  }

  function findMatchById(matchId) {
    const normalizedMatchId = normalizeId(matchId);
    if (!normalizedMatchId) {
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
      const found = source.find((item) => normalizeId(item) === normalizedMatchId);
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

  function normalizeDayLabel(label) {
    if (typeof label !== 'string') return '';
    return label
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  const WEEKDAY_VALUE_BY_LABEL = Array.isArray(WEEKDAY_OPTIONS)
    ? WEEKDAY_OPTIONS.reduce((map, option) => {
        map[normalizeDayLabel(option.label)] = option.value;
        return map;
      }, {})
    : {};

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

      if (Array.isArray(WEEKDAY_OPTIONS)) {
        WEEKDAY_OPTIONS.forEach((option) => {
          const opt = document.createElement('option');
          opt.value = option.value;
          opt.textContent = option.label;
          daySelect.appendChild(opt);
        });
      }

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
      customInput.value = data.customLabel || '';
      opensInput.value = data.opensAt || '';
      closesInput.value = data.closesAt || '';

      const syncCustomVisibility = () => {
        const value = daySelect.value;
        const isCustom = value === 'custom';
        customLabel.hidden = !isCustom;
        if (!isCustom) {
          customInput.value = '';
        } else if (!customInput.value) {
          customInput.focus();
        }
      };

      daySelect.addEventListener('change', syncCustomVisibility);
      syncCustomVisibility();
    }

    function addSchedule(data) {
      createScheduleItem(data);
      updateEmptyState();
    }

    const normalized = Array.isArray(initialSchedules)
      ? initialSchedules.map(normalizeScheduleForEditor).filter(Boolean)
      : [];

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
            label = WEEKDAY_LABEL_BY_VALUE?.[dayValue] || '';
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

    addButton.addEventListener('click', () => {
      addSchedule({ dayValue: '', customLabel: '', opensAt: '', closesAt: '' });
    });

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
    }

    function addCourt(data) {
      createCourtItem(data);
      updateEmptyState();
    }

    const normalized = Array.isArray(initialCourts)
      ? initialCourts.map(normalizeCourtForEditor).filter((entry) => entry.name)
      : [];

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

    addButton.addEventListener('click', () => {
      addCourt({ name: '', surface: '', indoor: false, lights: true, notes: '' });
    });

    return {
      element: wrapper,
      getValue,
      addCourt,
    };
  }

  function createRegulationEditor(initialContent = '', placeholder = '') {
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

    const sanitizedInitial = typeof sanitizeNoticeHtml === 'function'
      ? sanitizeNoticeHtml(initialContent) || ''
      : '';
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
      if (typeof applyRichTextCommand === 'function') {
        applyRichTextCommand(editor, command, {
          level: button.dataset.level,
          list: button.dataset.list,
        });
      }
    });

    container.append(toolbar, editor);

    function getValue() {
      const rawHtml = editor.innerHTML || '';
      return typeof sanitizeNoticeHtml === 'function' ? sanitizeNoticeHtml(rawHtml) : rawHtml;
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

  async function populateMatchPlayerSelects(
    form,
    categoryId,
    selectedPlayers = [],
    statusElement,
  ) {
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
      const enrollments = typeof loadEnrollments === 'function'
        ? await loadEnrollments(categoryId)
        : [];
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
      if (typeof setStatusMessage === 'function') {
        setStatusMessage(statusElement, 'error', error.message);
      }
    }
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
          <option value="activa">${LEAGUE_STATUS_LABELS?.activa || 'Activa'}</option>
          <option value="cerrada">${LEAGUE_STATUS_LABELS?.cerrada || 'Cerrada'}</option>
        </select>
      </label>
    </div>
    <label>
      Visibilidad
      <select name="isPrivate" required>
        <option value="false">Pública</option>
        <option value="true">Privada</option>
      </select>
      <span class="form-hint">Las ligas privadas solo están disponibles para socios y se ocultarán al resto de usuarios.</span>
    </label>
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
    if (form.elements.isPrivate) {
      form.elements.isPrivate.value = league?.isPrivate ? 'true' : 'false';
    }
    form.elements.description.value = league?.description || '';
    if (form.elements.poster) {
      form.elements.poster.value = league?.poster || '';
    }
    form.elements.startDate.value = formatDateInput ? formatDateInput(league?.startDate) : '';
    form.elements.endDate.value = formatDateInput ? formatDateInput(league?.endDate) : '';
    if (form.elements.registrationCloseDate) {
      form.elements.registrationCloseDate.value = formatDateInput
        ? formatDateInput(league?.registrationCloseDate)
        : '';
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
          const parts = [category.name || 'Categoría'];
          if (typeof translateGender === 'function') {
            parts.push(translateGender(category.gender));
          }
          const linkedLeague = typeof resolveLeague === 'function' ? resolveLeague(category.league) : null;
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
          setStatusMessage?.(posterUploadStatus, 'error', 'Selecciona una imagen para el cartel.');
          return;
        }

        const file = fileInput.files[0];
        if (!file.type.startsWith('image/')) {
          setStatusMessage?.(posterUploadStatus, 'error', 'El archivo seleccionado debe ser una imagen.');
          return;
        }

        if (file.size > MAX_POSTER_SIZE) {
          setStatusMessage?.(
            posterUploadStatus,
            'error',
            'La imagen supera el tamaño máximo permitido (5 MB).',
          );
          return;
        }

        const formData = new FormData();
        formData.append('poster', file);

        setStatusMessage?.(posterUploadStatus, 'info', 'Subiendo cartel...');

        try {
          const result = await request(`/leagues/${normalizedId}/poster`, {
            method: 'POST',
            body: formData,
          });
          setStatusMessage?.(posterUploadStatus, 'success', 'Cartel actualizado.');
          if (form.elements.poster) {
            form.elements.poster.value = result?.poster || '';
          }
          fileInput.value = '';
          await loadAllData?.();
        } catch (error) {
          setStatusMessage?.(posterUploadStatus, 'error', error.message);
        }
      });
    }

    const status = document.createElement('p');
    status.className = 'status-message';
    status.style.display = 'none';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const succeeded = await submitLeagueFormData?.({
        form,
        leagueId: normalizedId,
        statusElement: status,
      });
      if (succeeded) {
        closeModal?.();
      }
    });

    const cancelButton = form.querySelector('[data-action="cancel"]');
    cancelButton?.addEventListener('click', () => {
      setStatusMessage?.(status, '', '');
      closeModal?.();
    });

    openModal?.({
      title: league ? 'Editar liga' : 'Nueva liga',
      content: (body) => {
        body.appendChild(form);
        body.appendChild(status);
      },
      onClose: () => setStatusMessage?.(status, '', ''),
    });
  }

  function openPlayerModal(playerId = '') {
    if (!isAdmin()) return;
    const normalizedId = playerId || '';
    const player = normalizedId
      ? state.players.find((item) => normalizeId(item) === normalizedId)
      : null;

    const scheduleOptions = Object.entries(SCHEDULE_LABELS || {})
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
          <option value="mixto">Mixto</option>
        </select>
      </label>
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
      Talla de camiseta
      <select name="shirtSize" required>
        <option value="">Selecciona</option>
        <option value="XS">XS</option>
        <option value="S">S</option>
        <option value="M">M</option>
        <option value="L">L</option>
        <option value="XL">XL</option>
        <option value="XXL">XXL</option>
      </select>
    </label>
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
      <button type="submit" class="primary">${player ? 'Actualizar' : 'Crear'}</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
      ${player ? '<button type="button" class="danger" data-action="delete">Eliminar</button>' : ''}
    </div>
  `;

    form.elements.fullName.value = player?.fullName || '';
    form.elements.email.value = player?.email || '';
    form.elements.gender.value = player?.gender || 'masculino';
    form.elements.birthDate.value = formatDateInput ? formatDateInput(player?.birthDate) : '';
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
    }

    if (currentRoles.includes('admin')) {
      currentRoles = currentRoles.filter((role) => role !== 'player');
    }

    roleInputs.forEach((input) => {
      input.checked = currentRoles.includes(input.value);
    });

    function enforceRoleExclusivity() {
      if (adminInput?.checked) {
        if (playerInput) {
          playerInput.checked = false;
          playerInput.disabled = true;
        }
      } else if (playerInput) {
        playerInput.disabled = false;
        if (!roleInputs.some((input) => input !== playerInput && input.checked)) {
          playerInput.checked = true;
        }
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
    }

    if (membershipInput) {
      membershipInput.value = player?.membershipNumber || '';
    }

    if (membershipVerifiedInput) {
      membershipVerifiedInput.checked = Boolean(player?.membershipNumberVerified);
    }

    function updateMembershipControls({ clearWhenDisabled = false } = {}) {
      toggleMembershipField?.(membershipCheckbox, membershipWrapper, membershipInput, {
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
      });
    }

    const status = document.createElement('p');
    status.className = 'status-message';
    status.style.display = 'none';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const succeeded = await submitPlayerFormData?.({
        form,
        playerId: normalizedId,
        statusElement: status,
      });
      if (succeeded) {
        closeModal?.();
      }
    });

    const cancelButton = form.querySelector('[data-action="cancel"]');
    cancelButton?.addEventListener('click', () => {
      setStatusMessage?.(status, '', '');
      closeModal?.();
    });

    const deleteButton = form.querySelector('[data-action="delete"]');
    deleteButton?.addEventListener('click', async () => {
      if (!normalizedId) return;
      const confirmed = window.confirm('¿Seguro que deseas eliminar este jugador?');
      if (!confirmed) return;

      setStatusMessage?.(status, 'info', 'Eliminando jugador...');
      try {
        await request(`/players/${normalizedId}`, { method: 'DELETE' });
        setStatusMessage?.(status, 'success', 'Jugador eliminado.');
        closeModal?.();
        await loadAllData?.();
      } catch (error) {
        setStatusMessage?.(status, 'error', error.message);
      }
    });

    openModal?.({
      title: player ? 'Editar usuario' : 'Nuevo usuario',
      content: (body) => {
        body.appendChild(form);
        body.appendChild(status);
      },
      onClose: () => setStatusMessage?.(status, '', ''),
    });
  }

  function openMatchModal(matchId = '') {
    if (!isAdmin()) return;
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
      }
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
      }
      categoriesByLeague.get(key).push(category);
      if (leagueId) {
        registerLeague(category.league || stateLeagueMap.get(leagueId));
      }
    });

    if (match?.league) {
      registerLeague(match.league);
    }

    const statusOptions = Object.entries(STATUS_LABELS || {})
      .map(([value, label]) => `<option value="${value}">${escapeHtmlSafe(label)}</option>`)
      .join('');

    const scheduleTemplates = typeof getClubMatchScheduleTemplates === 'function'
      ? getClubMatchScheduleTemplates()
      : [];
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

    const form = document.createElement('form');
    form.className = 'form';
    form.innerHTML = `
      <label>
        Liga
        <select name="leagueId" required>
          <option value="">Selecciona una liga</option>
        </select>
      </label>
      <label>
        Categoría
        <select name="categoryId" required disabled>
          <option value="">Selecciona una categoría</option>
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
      ${scheduleFieldMarkup}
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

    const leagueField = form.elements.leagueId;
    const categoryField = form.elements.categoryId;
    const scheduledField = form.elements.scheduledAt;
    const courtField = form.elements.court;
    const scheduleDateField = form.elements.scheduledDate;
    const schedulePickerContainer = form.querySelector('[data-match-schedule="picker"]');
    const scheduleClearButton = form.querySelector('button[data-match-schedule="clear"]');
    const statusField = form.elements.status;
    const notesField = form.elements.notes;
    const submitButton = form.querySelector('button[type="submit"]');

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
        const info = leagueDetailsMap.get(key) || stateLeagueMap.get(key) || { _id: key };
        leagueOptionEntries.push({ id: key, info });
      });

      leagueOptionEntries
        .sort((a, b) => (a.info?.name || '').localeCompare(b.info?.name || '', 'es'))
        .forEach(({ id, info }) => {
          const isClosed = info?.status === 'cerrada';
          const isCurrentSelection = currentMatchLeagueId && currentMatchLeagueId === id;
          if (isClosed && !isCurrentSelection) {
            return;
          }

          const option = document.createElement('option');
          option.value = id;
          option.textContent = formatLeagueLabel(info);
          if (isClosed) {
            option.textContent += ' (cerrada)';
          }
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
      }

      const normalizedCategories = categoryList
        .map((entry) => ({ id: normalizeId(entry), category: entry }))
        .filter((entry) => entry.id)
        .sort((a, b) => (a.category.name || '').localeCompare(b.category.name || '', 'es'));

      if (!normalizedCategories.length) {
        return '';
      }

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
      }
      return leagueField.value || '';
    };

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
      statusField.value = match?.status || 'pendiente';
    }
    if (scheduledField) {
      scheduledField.value = typeof formatDateTimeLocal === 'function'
        ? formatDateTimeLocal(match?.scheduledAt)
        : match?.scheduledAt || '';
    }
    if (courtField) {
      courtField.value = match?.court || '';
    }

    let schedulePicker = null;
    if (
      schedulePickerContainer &&
      scheduleDateField &&
      scheduledField &&
      typeof createMatchScheduleSlotPicker === 'function'
    ) {
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

      schedulePicker = createMatchScheduleSlotPicker({
        container: schedulePickerContainer,
        dateField: scheduleDateField,
        scheduledField,
        courtField,
        templates: scheduleTemplates,
        scope: 'admin',
        existingValue: scheduledField?.value || '',
        existingCourt: match?.court || '',
        ignoreMatchId: match?._id || '',
        onChange: updateStatusForSchedule,
      });

      scheduleClearButton?.addEventListener('click', (event) => {
        event.preventDefault();
        schedulePicker.clear();
        updateStatusForSchedule();
      });

      updateStatusForSchedule();
    }
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
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const succeeded = await submitMatchFormData?.({
        form,
        matchId: normalizedId,
        statusElement: status,
        creating: !match,
      });
      if (succeeded) {
        closeModal?.();
      }
    });

    const cancelButton = form.querySelector('[data-action="cancel"]');
    cancelButton?.addEventListener('click', () => {
      setStatusMessage(status, '', '');
      closeModal?.();
    });

    openModal?.({
      title: match ? 'Editar partido' : 'Nuevo partido',
      content: (body) => {
        body.appendChild(form);
        body.appendChild(status);
      },
      onClose: () => {
        setStatusMessage(status, '', '');
        schedulePicker?.destroy?.();
      },
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
        const logoData = await extractPhotoFromForm?.(form, 'logo');
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
        renderClubProfile?.(nextClub);
        setStatusMessage(status, 'success', 'Información actualizada correctamente.');
        closeModal?.();
        showGlobalMessage?.('Información del club actualizada.');
      } catch (error) {
        setStatusMessage(status, 'error', error.message);
      }
    });

    form.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      setStatusMessage(status, '', '');
      closeModal?.();
    });

    openModal?.({
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
        renderClubProfile?.(updated);
        setStatusMessage(status, 'success', successMessage);
        closeModal?.();
        showGlobalMessage?.(toastMessage);
      } catch (error) {
        setStatusMessage(status, 'error', error.message);
      }
    });

    form.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      setStatusMessage(status, '', '');
      closeModal?.();
    });

    openModal?.({
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
      showGlobalMessage?.('Crea al menos una categoría antes de generar partidos.', 'warning');
      return;
    }

    const categories = Array.isArray(state.categories) ? [...state.categories] : [];
    const leagues = Array.isArray(state.leagues) ? [...state.leagues] : [];
    const stateLeagueMap = new Map();
    leagues.forEach((league) => {
      const id = normalizeId(league);
      if (id && !stateLeagueMap.has(id)) {
        stateLeagueMap.set(id, league);
      }
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
      }
      categoriesByLeague.get(key).push(category);
      if (leagueId) {
        registerLeague(category.league || stateLeagueMap.get(leagueId));
      }
    });

    const normalizedPreselectedCategoryId = preselectedCategoryId
      ? normalizeId(preselectedCategoryId)
      : '';
    let initialLeagueId = '';
    if (normalizedPreselectedCategoryId) {
      const categoryEntry = categories.find(
        (item) => normalizeId(item) === normalizedPreselectedCategoryId
      );
      if (categoryEntry) {
        initialLeagueId = normalizeId(categoryEntry.league);
        if (!initialLeagueId && categoriesByLeague.has(UNASSIGNED_LEAGUE_VALUE)) {
          initialLeagueId = UNASSIGNED_LEAGUE_VALUE;
        }
      }
    }

    const form = document.createElement('form');
    form.className = 'form';
    form.innerHTML = `
      <label>
        Liga
        <select name="leagueId" required>
          <option value="">Selecciona una liga</option>
        </select>
      </label>
      <label>
        Categoría
        <select name="categoryId" required disabled>
          <option value="">Selecciona una categoría</option>
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

    const leagueSelect = form.elements.leagueId;
    const categorySelect = form.elements.categoryId;
    const submitButton = form.querySelector('button[type="submit"]');

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

    if (leagueSelect) {
      const leagueOptionEntries = [];
      categoriesByLeague.forEach((list, key) => {
        if (key === UNASSIGNED_LEAGUE_VALUE) return;
        if (!Array.isArray(list) || !list.length) return;
        const info = leagueDetailsMap.get(key) || stateLeagueMap.get(key) || { _id: key };
        leagueOptionEntries.push({ id: key, info });
      });

      leagueOptionEntries
        .sort((a, b) => (a.info?.name || '').localeCompare(b.info?.name || '', 'es'))
        .forEach(({ id, info }) => {
          if (info?.status === 'cerrada') {
            return;
          }

          const option = document.createElement('option');
          option.value = id;
          option.textContent = formatLeagueLabel(info);
          leagueSelect.appendChild(option);
        });

      if (categoriesByLeague.has(UNASSIGNED_LEAGUE_VALUE)) {
        const option = document.createElement('option');
        option.value = UNASSIGNED_LEAGUE_VALUE;
        option.textContent = 'Sin liga asignada';
        leagueSelect.appendChild(option);
      }

      const enabledLeagueOptions = Array.from(leagueSelect.options || []).filter(
        (option) => option.value && !option.disabled
      );
      if (!enabledLeagueOptions.length) {
        leagueSelect.disabled = true;
        if (categorySelect) {
          categorySelect.disabled = true;
        }
        if (submitButton) {
          submitButton.disabled = true;
        }
        setStatusMessage(
          status,
          'warning',
          'Todas las ligas activas están cerradas. No es posible generar partidos pendientes.'
        );
      }
    }

    const resolveCategoriesForLeague = (leagueId) => {
      if (!leagueId) return [];
      if (leagueId === UNASSIGNED_LEAGUE_VALUE) {
        return categoriesByLeague.get(UNASSIGNED_LEAGUE_VALUE) || [];
      }
      return categoriesByLeague.get(leagueId) || [];
    };

    const updateCategoryOptions = ({ leagueId, targetCategoryId } = {}) => {
      if (!categorySelect) return '';
      categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';
      categorySelect.disabled = true;

      const categoryList = resolveCategoriesForLeague(leagueId);
      if (!categoryList.length) {
        return '';
      }

      const normalizedCategories = categoryList
        .map((entry) => ({ id: normalizeId(entry), category: entry }))
        .filter((entry) => entry.id)
        .sort((a, b) => (a.category.name || '').localeCompare(b.category.name || '', 'es'));

      if (!normalizedCategories.length) {
        return '';
      }

      normalizedCategories.forEach((entry) => {
        const option = new Option(entry.category.name || 'Categoría', entry.id);
        categorySelect.appendChild(option);
      });

      categorySelect.disabled = false;

      const desiredValue = targetCategoryId && normalizedCategories.some((entry) => entry.id === targetCategoryId)
        ? targetCategoryId
        : normalizedCategories.length === 1
        ? normalizedCategories[0].id
        : '';
      if (desiredValue) {
        categorySelect.value = desiredValue;
      } else {
        categorySelect.value = '';
      }

      return categorySelect.value || '';
    };

    const selectInitialLeague = (desiredLeagueId) => {
      if (!leagueSelect) return '';
      const options = Array.from(leagueSelect.options || []);
      const desiredOption = options.find(
        (option) => option.value === desiredLeagueId && !option.disabled
      );
      if (desiredOption) {
        leagueSelect.value = desiredOption.value;
      } else if (leagueSelect.value) {
        const currentOption = leagueSelect.options[leagueSelect.selectedIndex];
        if (currentOption?.disabled) {
          leagueSelect.value = '';
        }
      }
      if (!leagueSelect.value) {
        const availableOptions = options.filter((option) => option.value && !option.disabled);
        if (availableOptions.length === 1) {
          leagueSelect.value = availableOptions[0].value;
        } else {
          leagueSelect.value = '';
        }
      }
      return leagueSelect.value || '';
    };

    const selectedLeagueId = selectInitialLeague(initialLeagueId);
    updateCategoryOptions({
      leagueId: selectedLeagueId,
      targetCategoryId: normalizedPreselectedCategoryId,
    });

    leagueSelect?.addEventListener('change', (event) => {
      setStatusMessage(status, '', '');
      updateCategoryOptions({ leagueId: event.target.value });
    });

    categorySelect?.addEventListener('change', () => {
      setStatusMessage(status, '', '');
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const categoryId = categorySelect ? categorySelect.value : '';
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
        await loadAllData?.();
        closeModal?.();
        showGlobalMessage?.(message);
      } catch (error) {
        setStatusMessage(status, 'error', error.message);
      }
    });

    form.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      setStatusMessage(status, '', '');
      closeModal?.();
    });

    openModal?.({
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
      showGlobalMessage?.('No fue posible cargar los datos del partido.', 'error');
      return;
    }

    if (!isAdmin() && !isUserMatchParticipant(match)) {
      showGlobalMessage?.('Solo puedes registrar resultados de tus partidos.', 'error');
      return;
    }

    const participants = getMatchScores(match);
    if (participants.length < 2) {
      showGlobalMessage?.('No fue posible identificar a los jugadores del partido.', 'error');
      return;
    }
    const currentWinnerId = normalizeId(match.result?.winner);
    const existingSets = getMatchSets(match);
    const matchFormat = match?.category?.matchFormat || DEFAULT_CATEGORY_MATCH_FORMAT;
    const fallbackFormat =
      MATCH_FORMAT_METADATA?.[DEFAULT_CATEGORY_MATCH_FORMAT] ||
      MATCH_FORMAT_METADATA?.two_sets_six_games_super_tb || {
        description: '',
        minimumSets: 2,
        setDefinitions: [
          { number: 1, tieBreak: false, label: 'Set 1' },
          { number: 2, tieBreak: false, label: 'Set 2' },
          { number: 3, tieBreak: true, label: 'Super tie-break' },
        ],
      };
    const formatDefinition = MATCH_FORMAT_METADATA?.[matchFormat] || fallbackFormat;
    const baseSetDefinitions =
      Array.isArray(formatDefinition.setDefinitions) && formatDefinition.setDefinitions.length
        ? formatDefinition.setDefinitions
        : fallbackFormat.setDefinitions;
    const setDefinitionMap = new Map(
      (baseSetDefinitions || []).map((definition) => [definition.number, { ...definition }])
    );
    existingSets.forEach((set) => {
      if (!setDefinitionMap.has(set.number)) {
        setDefinitionMap.set(set.number, {
          number: set.number,
          tieBreak: Boolean(set.tieBreak),
          label: set.tieBreak ? 'Super tie-break' : `Set ${set.number}`,
        });
      }
    });
    const orderedDefinitions = Array.from(setDefinitionMap.values()).sort((a, b) => a.number - b.number);
    const setDefinitions = orderedDefinitions.length
      ? orderedDefinitions
      : [
          { number: 1, tieBreak: false, label: 'Set 1' },
          { number: 2, tieBreak: false, label: 'Set 2' },
          { number: 3, tieBreak: true, label: 'Super tie-break' },
        ];
    const minimumSets = Number.isFinite(formatDefinition.minimumSets)
      ? formatDefinition.minimumSets
      : fallbackFormat.minimumSets;
    const formatHintMarkup = formatDefinition.description
      ? `<p class="form-hint match-format-hint">${escapeHtmlSafe(formatDefinition.description)}</p>`
      : '';

    const form = document.createElement('form');
    form.className = 'form';

    const playersMarkup = participants
      .map(({ player, id }) => {
        const name = player?.fullName || player?.email || 'Jugador';
        const safeName = escapeHtmlSafe(name);
        const checked = currentWinnerId === id ? 'checked' : '';
        return `
          <label class="radio-field">
            <input type="radio" name="winner" value="${id}" ${checked} required />
            <span>${safeName}</span>
          </label>
        `;
      })
      .join('');

    const setRows = setDefinitions
      .map((definition) => {
        const { number: setNumber, tieBreak: isTieBreak } = definition;
        const stored = existingSets.find((set) => set.number === setNumber);
        const legend = definition.label || (isTieBreak ? 'Super tie-break' : `Set ${setNumber}`);
        const inputs = participants
          .map(({ id, player }) => {
            const currentValue = stored?.scores?.[id] ?? 0;
            const name = player?.fullName || player?.email || 'Jugador';
            const safeName = escapeHtmlSafe(name);
            return `
              <label>
                ${safeName}
                <input type="number" name="set${setNumber}-${id}" min="0" step="1" value="${
                  Number.isFinite(currentValue) ? currentValue : 0
                }" />
              </label>
            `;
          })
          .join('');

        return `
          <fieldset data-set="${setNumber}">
            <legend>${escapeHtmlSafe(legend)}</legend>
            <div class="form-grid">${inputs}</div>
          </fieldset>
        `;
      })
      .join('');

    form.innerHTML = `
      ${formatHintMarkup}
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

      const setsPayload = setDefinitions
        .map(({ number: setNumber, tieBreak }) => {
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
            tieBreak: Boolean(tieBreak),
            scores,
          };
        })
        .filter(Boolean);

      if (setsPayload.length < minimumSets) {
        const setLabel = minimumSets === 1 ? 'un set' : `${minimumSets} sets`;
        setStatusMessage(status, 'error', `Introduce al menos ${setLabel} para registrar el resultado.`);
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
        closeModal?.();
        await loadAllData?.();
      } catch (error) {
        setStatusMessage(status, 'error', error.message);
      }
    });

    form.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      closeModal?.();
    });

    openModal?.({
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
      showGlobalMessage?.('Categoría no encontrada.', 'error');
      return;
    }

    try {
      await loadEnrollments?.(categoryId);
    } catch (error) {
      showGlobalMessage?.(error.message, 'error');
    }

    let requestLoadError = null;
    try {
      state.enrollmentRequests.delete(categoryId);
      await loadEnrollmentRequests?.(categoryId);
    } catch (error) {
      requestLoadError = error;
    }

    if (!Array.isArray(state.players) || !state.players.length) {
      try {
        const players = await request('/players');
        state.players = Array.isArray(players) ? players : [];
      } catch (error) {
        showGlobalMessage?.('No fue posible cargar la lista de jugadores.', 'error');
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
        .filter((player) => entityHasRole?.(player, 'player') && !enrolledIds.has(normalizeId(player)))
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
      const actionButton = event.target.closest('button[data-action]');
      if (actionButton) {
        const action = actionButton.dataset.action;
        const requestId = actionButton.dataset.requestId;
        if (!action || !requestId) {
          return;
        }

        const buttons = Array.from(
          container.querySelectorAll(`button[data-request-id="${requestId}"]`)
        );
        const previousLabels = new Map();
        buttons.forEach((btn) => {
          previousLabels.set(btn, btn.textContent);
          btn.disabled = true;
          btn.textContent = 'Procesando...';
        });

        try {
          const decision = action === 'approve-request' ? 'approve' : 'reject';
          const successMessage =
            decision === 'approve'
              ? 'Solicitud aprobada. El jugador ha sido inscrito.'
              : 'Solicitud rechazada.';
          await request(`/categories/${categoryId}/enrollment-requests/${requestId}`, {
            method: 'POST',
            body: { decision },
          });
          await loadEnrollmentRequests?.(categoryId, { force: true });
          await loadEnrollments?.(categoryId);
          await reloadCategories?.();
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
        invalidateLeaguePaymentsByCategory?.(categoryId);
        await loadEnrollments?.(categoryId);
        renderEnrollmentEntries();
        refreshSelect();
        await reloadCategories?.();
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
        invalidateLeaguePaymentsByCategory?.(categoryId);
        await loadEnrollments?.(categoryId);
        await loadEnrollmentRequests?.(categoryId, { force: true });
        await reloadCategories?.();
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

    openModal?.({
      title: `Inscripciones · ${category.name}`,
      content: (body) => {
        body.appendChild(container);
      },
      onClose: () => setStatusMessage(status, '', ''),
    });

    if (focusRequests) {
      requestList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

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
            const label = escapeHtmlSafe(category.name || 'Categoría');
            return `<option value="${id}">${label}</option>`;
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
      form.elements.startDate.value = formatDateInput ? formatDateInput(season.startDate) : '';
    }
    if (season?.endDate) {
      form.elements.endDate.value = formatDateInput ? formatDateInput(season.endDate) : '';
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
        closeModal?.();
        await loadAllData?.();
      } catch (error) {
        setStatusMessage(status, 'error', error.message);
      }
    });

    form.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      closeModal?.();
    });

    if (season) {
      form.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
        const confirmed = window.confirm('¿Eliminar esta temporada de forma permanente?');
        if (!confirmed) return;
        setStatusMessage(status, 'info', 'Eliminando temporada...');
        try {
          await request(`/seasons/${normalizedId}`, { method: 'DELETE' });
          setStatusMessage(status, 'success', 'Temporada eliminada.');
          closeModal?.();
          await loadAllData?.();
        } catch (error) {
          setStatusMessage(status, 'error', error.message);
        }
      });
    }

    openModal?.({
      title: season ? 'Editar temporada' : 'Nueva temporada',
      content: (body) => {
        body.appendChild(form);
        body.appendChild(status);
      },
      onClose: () => setStatusMessage(status, '', ''),
    });
  }

  return {
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
  };
}
