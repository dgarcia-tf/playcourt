export function createLeaguePaymentsModule(deps = {}) {
  const {
    state,
    DEFAULT_LEAGUE_CURRENCY,
    PAYMENT_STATUS_LABELS = {},
    PAYMENT_STATUS_ORDER = {},
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
  } = deps;

  if (!state || typeof state !== 'object') {
    throw new Error('Missing application state for league payments module.');
  }
  if (typeof ensureLeaguePaymentFilters !== 'function') {
    throw new Error('Missing ensureLeaguePaymentFilters dependency for league payments module.');
  }
  if (typeof getLeaguesWithEnrollmentFee !== 'function') {
    throw new Error('Missing getLeaguesWithEnrollmentFee dependency for league payments module.');
  }
  if (typeof compareLeaguesByHistory !== 'function') {
    throw new Error('Missing compareLeaguesByHistory dependency for league payments module.');
  }
  if (typeof getLeagueCategories !== 'function') {
    throw new Error('Missing getLeagueCategories dependency for league payments module.');
  }
  if (typeof resolveLeague !== 'function') {
    throw new Error('Missing resolveLeague dependency for league payments module.');
  }
  if (typeof normalizeId !== 'function') {
    throw new Error('Missing normalizeId dependency for league payments module.');
  }
  if (typeof loadEnrollments !== 'function') {
    throw new Error('Missing loadEnrollments dependency for league payments module.');
  }
  if (typeof fetchLeagueDetail !== 'function') {
    throw new Error('Missing fetchLeagueDetail dependency for league payments module.');
  }
  if (typeof renderLeagueDetail !== 'function') {
    throw new Error('Missing renderLeagueDetail dependency for league payments module.');
  }
  if (typeof buildPlayerCell !== 'function') {
    throw new Error('Missing buildPlayerCell dependency for league payments module.');
  }
  if (typeof formatCurrencyValue !== 'function') {
    throw new Error('Missing formatCurrencyValue dependency for league payments module.');
  }
  if (typeof formatShortDate !== 'function') {
    throw new Error('Missing formatShortDate dependency for league payments module.');
  }
  if (typeof formatDateInput !== 'function') {
    throw new Error('Missing formatDateInput dependency for league payments module.');
  }
  if (typeof setStatusMessage !== 'function') {
    throw new Error('Missing setStatusMessage dependency for league payments module.');
  }
  if (typeof request !== 'function') {
    throw new Error('Missing request dependency for league payments module.');
  }
  if (typeof isAdmin !== 'function') {
    throw new Error('Missing isAdmin dependency for league payments module.');
  }
  if (typeof showSection !== 'function') {
    throw new Error('Missing showSection dependency for league payments module.');
  }

  function updateLeaguePaymentFeeIndicator(feeValue) {
    if (!leaguePaymentsFeeBadge) return;

    let resolvedFee = feeValue;
    if (typeof resolvedFee === 'undefined') {
      const filters = ensureLeaguePaymentFilters();
      const league = resolveLeague(filters.league);
      const fee = league ? Number(league.enrollmentFee) : Number.NaN;
      resolvedFee = Number.isFinite(fee) ? fee : null;
    }

    if (Number.isFinite(resolvedFee) && resolvedFee > 0) {
      const formatted = formatCurrencyValue(resolvedFee, DEFAULT_LEAGUE_CURRENCY);
      leaguePaymentsFeeBadge.textContent =
        formatted || `${resolvedFee.toFixed(2)} ${DEFAULT_LEAGUE_CURRENCY}`;
      leaguePaymentsFeeBadge.hidden = false;
    } else {
      leaguePaymentsFeeBadge.textContent = '';
      leaguePaymentsFeeBadge.hidden = true;
    }
  }

  function formatLeaguePaymentTotal(amount = 0) {
    const numericAmount = Number(amount);
    const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
    return (
      formatCurrencyValue(safeAmount, DEFAULT_LEAGUE_CURRENCY) ||
      `${safeAmount.toFixed(2)} ${DEFAULT_LEAGUE_CURRENCY}`
    );
  }

  function updateLeaguePaymentTotalElement(element, amount = 0) {
    if (!element) return;
    element.textContent = formatLeaguePaymentTotal(amount);
  }

  function calculateLeaguePaymentTotal(entries = []) {
    if (!Array.isArray(entries)) {
      return 0;
    }
    return entries.reduce((total, entry) => {
      const amount = Number(entry?.amount);
      return Number.isFinite(amount) ? total + amount : total;
    }, 0);
  }

  function resetLeaguePaymentGroups() {
    if (leaguePaymentsPendingList) {
      leaguePaymentsPendingList.innerHTML = '';
    }
    if (leaguePaymentsPaidList) {
      leaguePaymentsPaidList.innerHTML = '';
    }
    if (leaguePaymentsPendingCount) {
      leaguePaymentsPendingCount.textContent = '0';
    }
    if (leaguePaymentsPaidCount) {
      leaguePaymentsPaidCount.textContent = '0';
    }
    updateLeaguePaymentTotalElement(leaguePaymentsPendingTotal, 0);
    updateLeaguePaymentTotalElement(leaguePaymentsPaidTotal, 0);
    if (leaguePaymentsPendingEmpty) {
      leaguePaymentsPendingEmpty.hidden = true;
    }
    if (leaguePaymentsPaidEmpty) {
      leaguePaymentsPaidEmpty.hidden = true;
    }
  }

  function updateLeaguePaymentControls({ resetSelection = false } = {}) {
    if (!leaguePaymentsLeagueSelect) return;

    const filters = ensureLeaguePaymentFilters();
    const previousLeague = resetSelection ? '' : filters.league || '';
    const leaguesWithFee = getLeaguesWithEnrollmentFee();
    const sorted = leaguesWithFee.slice().sort(compareLeaguesByHistory);

    const availableIds = new Set();
    leaguePaymentsLeagueSelect.innerHTML =
      '<option value="">Selecciona una liga con cuota</option>';

    sorted.forEach((league) => {
      const id = normalizeId(league);
      if (!id || availableIds.has(id)) {
        return;
      }
      availableIds.add(id);
      const option = document.createElement('option');
      option.value = id;
      option.textContent = league.name || 'Liga';
      leaguePaymentsLeagueSelect.appendChild(option);
    });

    let nextLeague = '';
    if (previousLeague && availableIds.has(previousLeague)) {
      nextLeague = previousLeague;
    } else if (availableIds.size) {
      const firstOption = leaguePaymentsLeagueSelect.options[1];
      nextLeague = firstOption?.value || '';
    }

    const resolvedLeague = nextLeague || '';
    const selectionChanged = resolvedLeague !== previousLeague;

    filters.league = resolvedLeague;
    if (resetSelection || selectionChanged || !resolvedLeague) {
      filters.search = '';
    }

    leaguePaymentsLeagueSelect.value = resolvedLeague;
    leaguePaymentsLeagueSelect.disabled = !availableIds.size;

    const hasSelection = Boolean(resolvedLeague);

    if (leaguePaymentsSearchInput) {
      leaguePaymentsSearchInput.value = hasSelection ? filters.search || '' : '';
      leaguePaymentsSearchInput.disabled = !hasSelection;
    }

    if (!hasSelection) {
      resetLeaguePaymentGroups();
      if (leaguePaymentsCount) {
        leaguePaymentsCount.textContent = '0';
      }
      if (leaguePaymentsEmpty) {
        leaguePaymentsEmpty.hidden = false;
        leaguePaymentsEmpty.textContent = availableIds.size
          ? 'Selecciona una liga con cuota para ver los pagos.'
          : 'Configura una liga con cuota de inscripción para gestionar pagos.';
      }
      updateLeaguePaymentFeeIndicator();
      updateLeaguePaymentMenuVisibility();
      setStatusMessage(leaguePaymentsStatusMessage, '', '');
      return;
    }

    if (leaguePaymentsEmpty) {
      leaguePaymentsEmpty.hidden = true;
    }

    updateLeaguePaymentFeeIndicator();
    updateLeaguePaymentMenuVisibility();

    if (selectionChanged && state.activeSection === 'section-league-payments') {
      refreshLeaguePayments().catch((error) => {
        console.warn('No se pudo actualizar el listado de pagos de liga', error);
      });
    }
  }

  let leaguePaymentsRequestToken = 0;

  async function getLeaguePaymentData(leagueId, { force = false } = {}) {
    const normalized = normalizeId(leagueId);
    if (!normalized) {
      return { entries: [], fee: null };
    }

    if (!force && state.leaguePayments instanceof Map && state.leaguePayments.has(normalized)) {
      return state.leaguePayments.get(normalized);
    }

    const detail = await fetchLeagueDetail(normalized, { force });
    if (!detail) {
      if (state.leaguePayments instanceof Map) {
        state.leaguePayments.delete(normalized);
      }
      return { entries: [], fee: null };
    }

    const categories = getLeagueCategories(normalized);
    const categoryIds = categories.map((category) => normalizeId(category)).filter(Boolean);

    if (categoryIds.length) {
      await Promise.all(
        categoryIds.map((categoryId) =>
          loadEnrollments(categoryId, { force }).catch((error) => {
            console.warn('No fue posible cargar las inscripciones de la categoría', categoryId, error);
            throw error;
          })
        )
      );
    }

    const categoriesById = new Map();
    categories.forEach((category) => {
      const id = normalizeId(category);
      if (id) {
        categoriesById.set(id, category);
      }
    });

    const payments = Array.isArray(detail.payments) ? detail.payments : [];
    const paymentByUser = new Map();
    payments.forEach((payment) => {
      const userId = normalizeId(payment?.user);
      if (!userId) return;
      paymentByUser.set(userId, payment);
    });

    const playerMap = new Map();
    categoryIds.forEach((categoryId) => {
      const enrollments = state.enrollments.get(categoryId) || [];
      enrollments.forEach((enrollment) => {
        const player = enrollment?.user || {};
        const playerId = normalizeId(player);
        if (!playerId) return;
        if (!playerMap.has(playerId)) {
          playerMap.set(playerId, {
            player,
            categories: new Set(),
          });
        }
        playerMap.get(playerId).categories.add(categoryId);
      });
    });

    const feeValue = Number(detail.enrollmentFee);
    const normalizedFee = Number.isFinite(feeValue) && feeValue > 0 ? feeValue : null;

    const createEntry = ({ player, playerId, categories: playerCategories, payment, hasEnrollment }) => {
      const normalizedPlayer = player && typeof player === 'object' ? player : {};
      const amountValue = Number(payment?.amount);
      const resolvedAmount = Number.isFinite(amountValue) && amountValue >= 0 ? amountValue : normalizedFee;

      return {
        player: normalizedPlayer,
        playerId,
        categories: playerCategories,
        paymentRecord: payment || null,
        paymentId: payment ? normalizeId(payment) : '',
        status: payment?.status && PAYMENT_STATUS_LABELS[payment.status]
          ? payment.status
          : 'pendiente',
        amount: typeof resolvedAmount === 'number' ? resolvedAmount : null,
        method: payment?.method || '',
        reference: payment?.reference || '',
        notes: payment?.notes || '',
        paidAt: payment?.paidAt || null,
        recordedBy: payment?.recordedBy || null,
        updatedAt: payment?.updatedAt || payment?.createdAt || null,
        hasEnrollment,
      };
    };

    const entries = [];

    playerMap.forEach(({ player, categories: playerCategories }, playerId) => {
      const payment = paymentByUser.get(playerId) || null;
      if (payment) {
        paymentByUser.delete(playerId);
      }
      const categoriesForPlayer = Array.from(playerCategories)
        .map((categoryId) => categoriesById.get(categoryId))
        .filter(Boolean);

      entries.push(
        createEntry({
          player,
          playerId,
          categories: categoriesForPlayer,
          payment,
          hasEnrollment: true,
        })
      );
    });

    paymentByUser.forEach((payment, userId) => {
      const player = typeof payment?.user === 'object' ? payment.user : {};
      entries.push(
        createEntry({
          player,
          playerId: userId,
          categories: [],
          payment,
          hasEnrollment: false,
        })
      );
    });

    entries.sort((a, b) => {
      const statusWeightA = PAYMENT_STATUS_ORDER[a.status] ?? 99;
      const statusWeightB = PAYMENT_STATUS_ORDER[b.status] ?? 99;
      if (statusWeightA !== statusWeightB) {
        return statusWeightA - statusWeightB;
      }
      const nameA = (a.player.fullName || a.player.email || '').toLocaleLowerCase('es');
      const nameB = (b.player.fullName || b.player.email || '').toLocaleLowerCase('es');
      if (nameA && nameB) {
        return nameA.localeCompare(nameB, 'es');
      }
      if (nameA) return -1;
      if (nameB) return 1;
      return 0;
    });

    const result = {
      entries,
      fee: normalizedFee,
    };

    if (!(state.leaguePayments instanceof Map)) {
      state.leaguePayments = new Map();
    }
    state.leaguePayments.set(normalized, result);

    return result;
  }

  function createLeaguePaymentItem(entry, { fee = null } = {}) {
    const listItem = document.createElement('li');
    listItem.className = 'league-payment-entry';

    const item = document.createElement('details');
    item.className = 'league-payment-item';
    const statusValue = entry.status || 'pendiente';
    item.dataset.paymentStatus = statusValue;
    if (statusValue !== 'pagado') {
      item.open = true;
    }

    const summary = document.createElement('summary');

    const header = document.createElement('div');
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

    if (entry.paidAt) {
      const paidAtSpan = document.createElement('span');
      paidAtSpan.textContent = `Pago: ${formatShortDate(entry.paidAt)}`;
      headerMeta.appendChild(paidAtSpan);
    }

    if (!entry.hasEnrollment) {
      const noteSpan = document.createElement('span');
      noteSpan.textContent = 'Sin inscripción activa';
      headerMeta.appendChild(noteSpan);
    }

    summary.appendChild(headerMeta);
    item.appendChild(summary);

    const body = document.createElement('div');
    body.className = 'league-payment-body';

    const categoryNames = Array.isArray(entry.categories)
      ? entry.categories.map((category) => category?.name || '').filter(Boolean)
      : [];
    const categoriesMeta = document.createElement('div');
    categoriesMeta.className = 'league-payment-meta';
    categoriesMeta.textContent = categoryNames.length
      ? `Categorías: ${categoryNames.join(', ')}`
      : 'Categorías: Sin asignar';
    body.appendChild(categoriesMeta);

    if (entry.player?.email || entry.player?.phone) {
      const contactMeta = document.createElement('div');
      contactMeta.className = 'league-payment-meta';
      if (entry.player.email) {
        contactMeta.appendChild(document.createElement('span')).textContent = entry.player.email;
      }
      if (entry.player.phone) {
        contactMeta.appendChild(document.createElement('span')).textContent = entry.player.phone;
      }
      body.appendChild(contactMeta);
    }

    if (entry.reference) {
      const referenceMeta = document.createElement('div');
      referenceMeta.className = 'league-payment-meta';
      referenceMeta.textContent = `Referencia: ${entry.reference}`;
      body.appendChild(referenceMeta);
    }

    if (entry.recordedBy?.fullName) {
      const recordedMeta = document.createElement('div');
      recordedMeta.className = 'league-payment-meta';
      recordedMeta.textContent = `Actualizado por ${entry.recordedBy.fullName}`;
      body.appendChild(recordedMeta);
    }

    const form = document.createElement('form');
    form.className = 'league-payment-form';
    form.dataset.leaguePaymentForm = 'true';
    if (entry.playerId) {
      form.dataset.userId = entry.playerId;
    }
    if (entry.paymentId) {
      form.dataset.paymentId = entry.paymentId;
    }

    const statusRow = document.createElement('div');
    statusRow.className = 'form-row';

    const statusLabel = document.createElement('label');
    statusLabel.textContent = 'Estado';
    const statusSelect = document.createElement('select');
    statusSelect.name = 'status';
    Object.entries(PAYMENT_STATUS_LABELS).forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (value === statusValue) {
        option.selected = true;
      }
      statusSelect.appendChild(option);
    });
    statusLabel.appendChild(statusSelect);
    statusRow.appendChild(statusLabel);

    const amountLabel = document.createElement('label');
    amountLabel.textContent = 'Importe';
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.name = 'amount';
    amountInput.min = '0';
    amountInput.step = '0.01';
    if (Number.isFinite(entry.amount)) {
      amountInput.value = entry.amount.toFixed(2);
    } else if (Number.isFinite(fee)) {
      amountInput.placeholder =
        formatCurrencyValue(fee, DEFAULT_LEAGUE_CURRENCY) ||
        `${fee.toFixed(2)} ${DEFAULT_LEAGUE_CURRENCY}`;
    }
    amountLabel.appendChild(amountInput);
    statusRow.appendChild(amountLabel);

    form.appendChild(statusRow);

    const detailsRow = document.createElement('div');
    detailsRow.className = 'form-row';

    const methodLabel = document.createElement('label');
    methodLabel.textContent = 'Método';
    const methodSelect = document.createElement('select');
    methodSelect.name = 'method';
    const methodValue = (entry.method || '').toString().trim();
    const methodValueLower = methodValue.toLowerCase();
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Sin especificar';
    if (!methodValue) {
      placeholderOption.selected = true;
    }
    methodSelect.appendChild(placeholderOption);
    if (methodValue) {
      const customOption = document.createElement('option');
      customOption.value = methodValue;
      customOption.textContent = methodValue;
      customOption.selected = true;
      methodSelect.appendChild(customOption);
    }
    methodLabel.appendChild(methodSelect);
    detailsRow.appendChild(methodLabel);

    const referenceLabel = document.createElement('label');
    referenceLabel.textContent = 'Referencia';
    const referenceInput = document.createElement('input');
    referenceInput.type = 'text';
    referenceInput.name = 'reference';
    referenceInput.placeholder = 'Identificador o concepto';
    referenceInput.value = entry.reference || '';
    referenceLabel.appendChild(referenceInput);
    detailsRow.appendChild(referenceLabel);
    form.appendChild(detailsRow);

    const notesRow = document.createElement('div');
    notesRow.className = 'form-row';

    const paidAtLabel = document.createElement('label');
    paidAtLabel.textContent = 'Fecha de pago';
    const paidAtInput = document.createElement('input');
    paidAtInput.type = 'date';
    paidAtInput.name = 'paidAt';
    paidAtInput.value = entry.paidAt ? formatDateInput(entry.paidAt) : '';
    paidAtLabel.appendChild(paidAtInput);
    notesRow.appendChild(paidAtLabel);

    const notesLabel = document.createElement('label');
    notesLabel.textContent = 'Notas';
    const notesInput = document.createElement('input');
    notesInput.type = 'text';
    notesInput.name = 'notes';
    notesInput.placeholder = 'Añade una nota interna';
    notesInput.value = entry.notes || '';
    notesLabel.appendChild(notesInput);
    notesRow.appendChild(notesLabel);
    form.appendChild(notesRow);

    const actionsRow = document.createElement('div');
    actionsRow.className = 'form-actions';
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'primary';
    submitButton.textContent = entry.paymentId ? 'Actualizar pago' : 'Registrar pago';
    actionsRow.appendChild(submitButton);
    form.appendChild(actionsRow);

    body.appendChild(form);
    item.appendChild(body);

    listItem.appendChild(item);

    return listItem;
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
    updateLeaguePaymentTotalElement(
      leaguePaymentsPaidTotal,
      calculateLeaguePaymentTotal(paidEntries)
    );

    if (!entries.length) {
      if (leaguePaymentsPendingCount) {
        leaguePaymentsPendingCount.textContent = '0';
      }
      if (leaguePaymentsPaidCount) {
        leaguePaymentsPaidCount.textContent = '0';
      }
      if (leaguePaymentsPendingEmpty) {
        leaguePaymentsPendingEmpty.hidden = false;
        leaguePaymentsPendingEmpty.textContent = 'No hay pagos pendientes.';
      }
      if (leaguePaymentsPaidEmpty) {
        leaguePaymentsPaidEmpty.hidden = false;
        leaguePaymentsPaidEmpty.textContent = 'No hay pagos registrados.';
      }
      if (leaguePaymentsEmpty) {
        leaguePaymentsEmpty.hidden = false;
        leaguePaymentsEmpty.textContent = 'No hay registros de pago para la selección actual.';
      }
      return;
    }

    if (leaguePaymentsEmpty) {
      leaguePaymentsEmpty.hidden = true;
    }

    const groups = [
      {
        entries: pendingEntries,
        list: leaguePaymentsPendingList,
        emptyElement: leaguePaymentsPendingEmpty,
        countElement: leaguePaymentsPendingCount,
        emptyText: 'No hay pagos pendientes.',
      },
      {
        entries: paidEntries,
        list: leaguePaymentsPaidList,
        emptyElement: leaguePaymentsPaidEmpty,
        countElement: leaguePaymentsPaidCount,
        emptyText: 'No hay pagos registrados.',
      },
    ];

    groups.forEach(({ entries: groupEntries, list, emptyElement, countElement, emptyText }) => {
      if (countElement) {
        countElement.textContent = String(groupEntries.length);
      }

      if (!list) {
        return;
      }

      if (!groupEntries.length) {
        if (emptyElement) {
          emptyElement.hidden = false;
          emptyElement.textContent = emptyText;
        }
        return;
      }

      if (emptyElement) {
        emptyElement.hidden = true;
      }

      groupEntries.forEach((entry) => {
        list.appendChild(createLeaguePaymentItem(entry, { fee }));
      });
    });
  }

  async function refreshLeaguePayments({ force = false } = {}) {
    if (!leaguePaymentsGroups) return;

    const filters = ensureLeaguePaymentFilters();
    const leagueId = filters.league;

    if (!leagueId) {
      resetLeaguePaymentGroups();
      if (leaguePaymentsCount) {
        leaguePaymentsCount.textContent = '0';
      }
      const hasOptions = getLeaguesWithEnrollmentFee().length > 0;
      if (leaguePaymentsEmpty) {
        leaguePaymentsEmpty.hidden = false;
        leaguePaymentsEmpty.textContent = hasOptions
          ? 'Selecciona una liga con cuota para ver los pagos.'
          : 'Configura una liga con cuota de inscripción para gestionar pagos.';
      }
      updateLeaguePaymentFeeIndicator();
      setStatusMessage(leaguePaymentsStatusMessage, '', '');
      return;
    }

    const usingCachedData =
      !force && state.leaguePayments instanceof Map && state.leaguePayments.has(leagueId);

    if (!usingCachedData) {
      resetLeaguePaymentGroups();
      if (leaguePaymentsStatusMessage) {
        setStatusMessage(leaguePaymentsStatusMessage, 'info', 'Cargando registros de pago...');
      }
      if (leaguePaymentsEmpty) {
        leaguePaymentsEmpty.hidden = false;
        leaguePaymentsEmpty.textContent = 'Cargando registros de pago...';
      }
    }

    const requestToken = ++leaguePaymentsRequestToken;
    state.leaguePaymentsLoading = true;

    try {
      const data = await getLeaguePaymentData(leagueId, { force });
      if (requestToken !== leaguePaymentsRequestToken) {
        return;
      }

      const activeFilters = ensureLeaguePaymentFilters();
      const searchTerm = (activeFilters.search || '').trim().toLowerCase();

      const filteredEntries = (data.entries || []).filter((entry) => {
        if (searchTerm) {
          const categoryNames = entry.categories.map((category) => category?.name || '').join(' ');
          const haystack = `${entry.player?.fullName || ''} ${entry.player?.email || ''} ${
            entry.player?.phone || ''
          } ${categoryNames}`
            .toLowerCase()
            .trim();
          if (!haystack.includes(searchTerm)) {
            return false;
          }
        }
        return true;
      });

      renderLeaguePayments(filteredEntries, { fee: data.fee });

      if (leaguePaymentsStatusMessage) {
        setStatusMessage(leaguePaymentsStatusMessage, '', '');
      }
    } catch (error) {
      if (requestToken !== leaguePaymentsRequestToken) {
        return;
      }

      if (leaguePaymentsStatusMessage) {
        setStatusMessage(leaguePaymentsStatusMessage, 'error', error.message);
      }
      resetLeaguePaymentGroups();
      if (leaguePaymentsCount) {
        leaguePaymentsCount.textContent = '0';
      }
      if (leaguePaymentsEmpty) {
        leaguePaymentsEmpty.hidden = false;
        leaguePaymentsEmpty.textContent = 'No fue posible cargar los registros de pago.';
      }
    } finally {
      if (requestToken === leaguePaymentsRequestToken) {
        state.leaguePaymentsLoading = false;
      }
    }
  }

  async function handleLeaguePaymentFormSubmit(form) {
    if (!form) return;
    const filters = ensureLeaguePaymentFilters();
    const leagueId = filters.league;
    if (!leagueId) {
      setStatusMessage(leaguePaymentsStatusMessage, 'error', 'Selecciona una liga con cuota.');
      return;
    }

    const paymentId = form.dataset.paymentId || '';
    const userId = form.dataset.userId || '';
    const formData = new FormData(form);

    const payload = {};
    const statusValue = formData.get('status');
    if (statusValue && PAYMENT_STATUS_LABELS[statusValue]) {
      payload.status = statusValue;
    }

    const amountRaw = formData.get('amount');
    if (amountRaw !== null && amountRaw !== undefined) {
      const trimmed = String(amountRaw).trim();
      if (trimmed) {
        const normalizedAmount = Number.parseFloat(trimmed.replace(',', '.'));
        if (Number.isNaN(normalizedAmount) || normalizedAmount < 0) {
          setStatusMessage(leaguePaymentsStatusMessage, 'error', 'Introduce un importe válido.');
          return;
        }
        payload.amount = normalizedAmount;
      }
    }

    ['method', 'reference', 'notes'].forEach((field) => {
      if (formData.has(field)) {
        const value = (formData.get(field) || '').toString().trim();
        payload[field] = value || null;
      }
    });

    const paidAtValue = (formData.get('paidAt') || '').toString().trim();
    if (paidAtValue) {
      payload.paidAt = paidAtValue;
    } else if (paymentId) {
      payload.paidAt = null;
    }

    try {
      setStatusMessage(
        leaguePaymentsStatusMessage,
        'info',
        paymentId ? 'Actualizando pago...' : 'Registrando pago...'
      );

      if (paymentId) {
        await request(`/leagues/${leagueId}/payments/${paymentId}`, { method: 'PATCH', body: payload });
      } else {
        if (!userId) {
          throw new Error('No se puede registrar el pago sin un jugador asociado.');
        }
        await request(`/leagues/${leagueId}/payments`, {
          method: 'POST',
          body: { ...payload, user: userId },
        });
      }

      await fetchLeagueDetail(leagueId, { force: true });
      if (state.selectedLeagueId === leagueId) {
        renderLeagueDetail();
      }
      if (state.leaguePayments instanceof Map) {
        state.leaguePayments.delete(leagueId);
      }

      await refreshLeaguePayments({ force: true });

      setStatusMessage(
        leaguePaymentsStatusMessage,
        'success',
        paymentId ? 'Pago actualizado correctamente.' : 'Pago registrado correctamente.'
      );
    } catch (error) {
      setStatusMessage(leaguePaymentsStatusMessage, 'error', error.message);
    }
  }

  function updateLeaguePaymentMenuVisibility() {
    if (!leaguePaymentsMenuButton) return;

    const adminUser = isAdmin();
    const hasFeeLeagues = adminUser && getLeaguesWithEnrollmentFee().length > 0;
    leaguePaymentsMenuButton.hidden = !hasFeeLeagues;

    if (!hasFeeLeagues) {
      if (leaguePaymentsSection) {
        leaguePaymentsSection.hidden = true;
      }
      if (adminUser && state.activeSection === 'section-league-payments') {
        showSection('section-league-dashboard');
      }
    }
  }

  return {
    updateLeaguePaymentControls,
    refreshLeaguePayments,
    handleLeaguePaymentFormSubmit,
    updateLeaguePaymentMenuVisibility,
    resetLeaguePaymentGroups,
  };
}
