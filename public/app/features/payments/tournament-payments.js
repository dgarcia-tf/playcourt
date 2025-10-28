export function createTournamentPaymentsModule(deps = {}) {
  const {
    state,
    DEFAULT_TOURNAMENT_CURRENCY,
    PAYMENT_STATUS_LABELS = {},
    PAYMENT_STATUS_ORDER = {},
    TOURNAMENT_PAYMENT_METHOD_OPTIONS = [],
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
  } = deps;

  if (!state || typeof state !== 'object') {
    throw new Error('Missing application state for tournament payments module.');
  }
  if (typeof formatCurrencyValue !== 'function') {
    throw new Error('Missing formatCurrencyValue dependency for tournament payments module.');
  }
  if (typeof formatShortDate !== 'function') {
    throw new Error('Missing formatShortDate dependency for tournament payments module.');
  }
  if (typeof formatDateInput !== 'function') {
    throw new Error('Missing formatDateInput dependency for tournament payments module.');
  }
  if (typeof normalizeId !== 'function') {
    throw new Error('Missing normalizeId dependency for tournament payments module.');
  }
  if (typeof setStatusMessage !== 'function') {
    throw new Error('Missing setStatusMessage dependency for tournament payments module.');
  }
  if (typeof request !== 'function') {
    throw new Error('Missing request dependency for tournament payments module.');
  }
  if (typeof isAdmin !== 'function') {
    throw new Error('Missing isAdmin dependency for tournament payments module.');
  }
  if (typeof showSection !== 'function') {
    throw new Error('Missing showSection dependency for tournament payments module.');
  }
  if (typeof getTournamentsWithEnrollmentFee !== 'function') {
    throw new Error('Missing getTournamentsWithEnrollmentFee dependency for tournament payments module.');
  }
  if (typeof compareTournamentsBySchedule !== 'function') {
    throw new Error('Missing compareTournamentsBySchedule dependency for tournament payments module.');
  }
  if (typeof getTournamentCategories !== 'function') {
    throw new Error('Missing getTournamentCategories dependency for tournament payments module.');
  }
  if (typeof fetchTournamentEnrollments !== 'function') {
    throw new Error('Missing fetchTournamentEnrollments dependency for tournament payments module.');
  }
  if (typeof loadTournamentDetail !== 'function') {
    throw new Error('Missing loadTournamentDetail dependency for tournament payments module.');
  }
  if (typeof refreshTournamentDetail !== 'function') {
    throw new Error('Missing refreshTournamentDetail dependency for tournament payments module.');
  }
  if (typeof buildPlayerCell !== 'function') {
    throw new Error('Missing buildPlayerCell dependency for tournament payments module.');
  }

  function ensureTournamentPaymentFilters() {
    if (!state.tournamentPaymentFilters) {
      state.tournamentPaymentFilters = {
        tournament: '',
        search: '',
      };
    }
    return state.tournamentPaymentFilters;
  }

  function updateTournamentPaymentFeeIndicator(feeInfo) {
    if (!tournamentPaymentsFeeBadge) return;

    const info = feeInfo || createEmptyTournamentFeeInfo();

    const formatEntry = (entry, fallbackLabel = '') => {
      if (!entry || !Number.isFinite(entry.amount)) {
        return '';
      }
      const entryCurrency = entry.currency || info.currency || DEFAULT_TOURNAMENT_CURRENCY;
      const formatted =
        formatCurrencyValue(entry.amount, entryCurrency) ||
        `${entry.amount.toFixed(2)} ${entryCurrency}`;
      const label = (entry.label || fallbackLabel || '').toString().trim();
      return label ? `${label}: ${formatted}` : formatted;
    };

    const parts = [];
    const memberText = formatEntry(info.member);
    if (memberText) {
      parts.push(memberText);
    }
    const nonMemberText = formatEntry(info.nonMember);
    if (nonMemberText) {
      parts.push(nonMemberText);
    }

    if (!parts.length) {
      const generalText = formatEntry(info.general, 'Cuota');
      if (generalText) {
        parts.push(generalText);
      }
    }

    if (parts.length) {
      tournamentPaymentsFeeBadge.textContent = `Cuota sugerida por categoría: ${parts.join(' · ')}`;
      tournamentPaymentsFeeBadge.hidden = false;
    } else {
      tournamentPaymentsFeeBadge.textContent = '';
      tournamentPaymentsFeeBadge.hidden = true;
    }
  }

  function formatTournamentPaymentTotal(amount = 0, currency = DEFAULT_TOURNAMENT_CURRENCY) {
    const numericAmount = Number(amount);
    const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
    const resolvedCurrency = currency || DEFAULT_TOURNAMENT_CURRENCY;
    return (
      formatCurrencyValue(safeAmount, resolvedCurrency) || `${safeAmount.toFixed(2)} ${resolvedCurrency}`
    );
  }

  function updateTournamentPaymentTotalElement(
    element,
    amount = 0,
    currency = DEFAULT_TOURNAMENT_CURRENCY
  ) {
    if (!element) return;
    element.textContent = formatTournamentPaymentTotal(amount, currency);
  }

  function calculateTournamentPaymentTotal(entries = []) {
    if (!Array.isArray(entries)) {
      return 0;
    }
    return entries.reduce((total, entry) => {
      const amount = Number(entry?.amount);
      return Number.isFinite(amount) ? total + amount : total;
    }, 0);
  }

  function resetTournamentPaymentGroups() {
    if (tournamentPaymentsPendingList) {
      tournamentPaymentsPendingList.innerHTML = '';
    }
    if (tournamentPaymentsPaidList) {
      tournamentPaymentsPaidList.innerHTML = '';
    }
    if (tournamentPaymentsPendingCount) {
      tournamentPaymentsPendingCount.textContent = '0';
    }
    if (tournamentPaymentsPaidCount) {
      tournamentPaymentsPaidCount.textContent = '0';
    }
    updateTournamentPaymentTotalElement(
      tournamentPaymentsPendingTotal,
      0,
      DEFAULT_TOURNAMENT_CURRENCY
    );
    updateTournamentPaymentTotalElement(tournamentPaymentsPaidTotal, 0, DEFAULT_TOURNAMENT_CURRENCY);
    if (tournamentPaymentsPendingEmpty) {
      tournamentPaymentsPendingEmpty.hidden = true;
    }
    if (tournamentPaymentsPaidEmpty) {
      tournamentPaymentsPaidEmpty.hidden = true;
    }
  }

  function updateTournamentPaymentControls({ resetSelection = false } = {}) {
    if (!tournamentPaymentsTournamentSelect) return;

    const filters = ensureTournamentPaymentFilters();
    const previousTournament = resetSelection ? '' : filters.tournament || '';
    const tournamentsWithFee = getTournamentsWithEnrollmentFee();
    const sorted = tournamentsWithFee.slice().sort(compareTournamentsBySchedule);

    tournamentPaymentsTournamentSelect.innerHTML =
      '<option value="">Selecciona un torneo con cuotas</option>';

    const availableIds = new Set();
    sorted.forEach((tournament) => {
      const id = normalizeId(tournament);
      if (!id || availableIds.has(id)) {
        return;
      }
      availableIds.add(id);
      const option = document.createElement('option');
      option.value = id;
      option.textContent = tournament.name || 'Torneo';
      tournamentPaymentsTournamentSelect.appendChild(option);
    });

    let nextTournament = '';
    if (previousTournament && availableIds.has(previousTournament)) {
      nextTournament = previousTournament;
    } else if (availableIds.size) {
      const firstOption = tournamentPaymentsTournamentSelect.options[1];
      nextTournament = firstOption?.value || '';
    }

    const resolvedTournament = nextTournament || '';
    const selectionChanged = resolvedTournament !== previousTournament;

    filters.tournament = resolvedTournament;
    if (resetSelection || selectionChanged || !resolvedTournament) {
      filters.search = '';
    }

    tournamentPaymentsTournamentSelect.value = resolvedTournament;
    tournamentPaymentsTournamentSelect.disabled = !availableIds.size;

    const hasSelection = Boolean(resolvedTournament);

    updateTournamentPaymentMenuVisibility();

    if (tournamentPaymentsSearchInput) {
      tournamentPaymentsSearchInput.value = hasSelection ? filters.search || '' : '';
      tournamentPaymentsSearchInput.disabled = !hasSelection;
    }

    if (!hasSelection) {
      if (tournamentPaymentsCount) {
        tournamentPaymentsCount.textContent = '0';
      }
      resetTournamentPaymentGroups();
      if (tournamentPaymentsEmpty) {
        tournamentPaymentsEmpty.hidden = false;
        tournamentPaymentsEmpty.textContent = availableIds.size
          ? 'Selecciona un torneo con cuotas para gestionar los pagos.'
          : 'Configura cuotas de inscripción para habilitar el seguimiento de pagos.';
      }
      updateTournamentPaymentFeeIndicator(null);
      setStatusMessage(tournamentPaymentsStatusMessage, '', '');
      return;
    }

    if (tournamentPaymentsEmpty) {
      tournamentPaymentsEmpty.hidden = true;
    }

    refreshTournamentPayments({ force: resetSelection || selectionChanged });
  }

  let tournamentPaymentsRequestToken = 0;

  function createEmptyTournamentFeeInfo() {
    return {
      currency: DEFAULT_TOURNAMENT_CURRENCY,
      member: null,
      nonMember: null,
      general: null,
      memberTiers: {},
      nonMemberTiers: {},
      generalTiers: {},
    };
  }

  function resolveTournamentFeeInfo(detail) {
    const fees = Array.isArray(detail?.fees) ? detail.fees : [];

    const info = createEmptyTournamentFeeInfo();

    const normalizeCurrency = (value) => {
      if (!value) return '';
      const trimmed = value.toString().trim();
      return trimmed ? trimmed.toUpperCase() : '';
    };

    const parseCategoryCount = (label) => {
      if (!label) return null;
      const match = label.match(/(\d+)/);
      if (!match) {
        return null;
      }
      const count = Number(match[1]);
      return Number.isFinite(count) && count > 0 ? count : null;
    };

    let resolvedCurrency = '';

    fees.forEach((fee) => {
      const baseLabel = fee?.label ? fee.label.toString().trim() : '';
      const normalized = {
        amount: Number(fee?.amount),
        currency: normalizeCurrency(fee?.currency),
        label: baseLabel,
      };

      const memberAmount = Number(fee?.memberAmount);
      const nonMemberAmount = Number(fee?.nonMemberAmount);
      const legacyAmount = Number(fee?.amount);

      const hasMember = Number.isFinite(memberAmount) && memberAmount >= 0;
      const hasNonMember = Number.isFinite(nonMemberAmount) && nonMemberAmount >= 0;
      const hasLegacy = Number.isFinite(legacyAmount) && legacyAmount >= 0;

      if (hasMember || hasNonMember || hasLegacy) {
        if (!resolvedCurrency && normalized.currency) {
          resolvedCurrency = normalized.currency;
        }

        const normalizedLabel = baseLabel.toLowerCase();
        const memberCount = parseCategoryCount(fee?.memberLabel || baseLabel);
        const nonMemberCount = parseCategoryCount(fee?.nonMemberLabel || baseLabel);
        const generalCount = parseCategoryCount(baseLabel);

        if (hasMember) {
          info.member = {
            amount: memberAmount,
            currency: normalizeCurrency(fee?.memberCurrency) || normalized.currency,
            label: fee?.memberLabel || baseLabel || 'Socio',
          };
          if (memberCount) {
            info.memberTiers[memberCount] = info.member;
          }
        }

        if (hasNonMember) {
          info.nonMember = {
            amount: nonMemberAmount,
            currency: normalizeCurrency(fee?.nonMemberCurrency) || normalized.currency,
            label: fee?.nonMemberLabel || baseLabel || 'No socio',
          };
          if (nonMemberCount) {
            info.nonMemberTiers[nonMemberCount] = info.nonMember;
          }
        }

        if (hasLegacy) {
          info.general = {
            amount: legacyAmount,
            currency: normalized.currency,
            label: normalized.label || 'General',
          };
          if (generalCount) {
            info.generalTiers[generalCount] = info.general;
          }
        }

        if (!info.member && hasMember) {
          info.member = {
            amount: memberAmount,
            currency: normalizeCurrency(fee?.memberCurrency) || normalized.currency,
            label: fee?.memberLabel || 'Socio',
          };
        }

        if (!info.nonMember && hasNonMember) {
          info.nonMember = {
            amount: nonMemberAmount,
            currency: normalizeCurrency(fee?.nonMemberCurrency) || normalized.currency,
            label: fee?.nonMemberLabel || 'No socio',
          };
        }

        if (!info.general && hasLegacy) {
          info.general = {
            amount: legacyAmount,
            currency: normalized.currency,
            label: normalized.label || 'Cuota',
          };
        }

        if (!resolvedCurrency) {
          resolvedCurrency =
            info.member?.currency || info.nonMember?.currency || info.general?.currency || '';
        }

        if (!resolvedCurrency && normalized.currency) {
          resolvedCurrency = normalized.currency;
        }

        if (!info.currency && resolvedCurrency) {
          info.currency = resolvedCurrency;
        }

        if (!info.currency) {
          info.currency = DEFAULT_TOURNAMENT_CURRENCY;
        }
      }
    });

    const fallbackCurrency =
      info.currency ||
      info.member?.currency ||
      info.nonMember?.currency ||
      info.general?.currency ||
      DEFAULT_TOURNAMENT_CURRENCY;

    info.currency = fallbackCurrency;

    ['member', 'nonMember', 'general'].forEach((key) => {
      if (info[key] && !info[key].currency) {
        info[key].currency = fallbackCurrency;
      }
    });

    return info;
  }

  async function getTournamentPaymentData(tournamentId, { force = false } = {}) {
    const normalized = normalizeId(tournamentId);
    if (!normalized) {
      return {
        entries: [],
        feeInfo: createEmptyTournamentFeeInfo(),
        currency: DEFAULT_TOURNAMENT_CURRENCY,
      };
    }

    if (!force && state.tournamentPayments instanceof Map && state.tournamentPayments.has(normalized)) {
      return state.tournamentPayments.get(normalized);
    }

    if (force && state.tournamentPayments instanceof Map) {
      state.tournamentPayments.delete(normalized);
    }

    if (force && state.tournamentDetails instanceof Map && state.tournamentDetails.has(normalized)) {
      state.tournamentDetails.delete(normalized);
    }

    const detail = await loadTournamentDetail(normalized);
    if (!detail) {
      if (state.tournamentPayments instanceof Map) {
        state.tournamentPayments.delete(normalized);
      }
      return {
        entries: [],
        feeInfo: createEmptyTournamentFeeInfo(),
        currency: DEFAULT_TOURNAMENT_CURRENCY,
      };
    }

    const categories = getTournamentCategories(normalized);
    const categoryIds = categories.map((category) => normalizeId(category)).filter(Boolean);

    const categoriesById = new Map();
    categories.forEach((category) => {
      const id = normalizeId(category);
      if (id) {
        categoriesById.set(id, category);
      }
    });

    const enrollmentMap = new Map();
    await Promise.all(
      categoryIds.map(async (categoryId) => {
        try {
          const enrollments = await fetchTournamentEnrollments(normalized, categoryId, {
            forceReload: force,
          });
          enrollmentMap.set(categoryId, Array.isArray(enrollments) ? enrollments : []);
        } catch (error) {
          const cacheKey = `${normalized}:${categoryId}`;
          const cached = state.tournamentEnrollments.get(cacheKey) || [];
          enrollmentMap.set(categoryId, cached);
        }
      })
    );

    const payments = Array.isArray(detail.payments) ? detail.payments : [];
    const paymentByUser = new Map();
    payments.forEach((payment) => {
      const userId = normalizeId(payment?.user);
      if (!userId) return;
      paymentByUser.set(userId, payment);
    });

    const playerMap = new Map();
    enrollmentMap.forEach((enrollments, categoryId) => {
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

    const feeInfo = resolveTournamentFeeInfo(detail);
    const baseCurrency =
      feeInfo.currency ||
      feeInfo.member?.currency ||
      feeInfo.nonMember?.currency ||
      feeInfo.general?.currency ||
      DEFAULT_TOURNAMENT_CURRENCY;

    const computeSuggestedAmount = (player, playerCategories = []) => {
      const categoryCount = Array.isArray(playerCategories) ? playerCategories.length : 0;
      if (categoryCount <= 0) {
        return null;
      }

      const isMember = Boolean(player?.isMember);
      const getTierEntry = (entry, tiers, count) => {
        if (!count || !tiers) {
          return entry;
        }
        const tierEntry = tiers[String(count)] || tiers[count];
        if (Number.isFinite(tierEntry?.amount) && tierEntry.amount >= 0) {
          return tierEntry;
        }
        return entry;
      };

      const memberEntry = getTierEntry(feeInfo.member, feeInfo.memberTiers, categoryCount);
      const nonMemberEntry = getTierEntry(feeInfo.nonMember, feeInfo.nonMemberTiers, categoryCount);
      const generalEntry = getTierEntry(feeInfo.general, feeInfo.generalTiers, categoryCount);

      let targetEntry = null;
      if (isMember && memberEntry) {
        targetEntry = memberEntry;
      } else if (!isMember && nonMemberEntry) {
        targetEntry = nonMemberEntry;
      } else {
        targetEntry = generalEntry || memberEntry || nonMemberEntry;
      }

      if (!targetEntry || !Number.isFinite(targetEntry.amount) || targetEntry.amount < 0) {
        return null;
      }

      return {
        amount: targetEntry.amount,
        currency: targetEntry.currency || feeInfo.currency || baseCurrency,
        categoryCount,
        isMember,
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

      const suggestion = computeSuggestedAmount(player, categoriesForPlayer);

      entries.push({
        player,
        playerId,
        categories: categoriesForPlayer,
        paymentRecord: payment || null,
        paymentId: payment ? normalizeId(payment) : '',
        status: payment?.status && PAYMENT_STATUS_LABELS[payment.status]
          ? payment.status
          : 'pendiente',
        amount: typeof payment?.amount === 'number' && Number.isFinite(payment.amount)
          ? payment.amount
          : null,
        recordedAmount: Number.isFinite(payment?.amount) ? Number(payment.amount) : null,
        suggestedAmount: suggestion?.amount ?? null,
        suggestion,
        currency: payment?.currency || suggestion?.currency || baseCurrency,
        method: payment?.method || '',
        reference: payment?.reference || '',
        notes: payment?.notes || '',
        paidAt: payment?.paidAt || null,
        recordedBy: payment?.recordedBy || null,
        updatedAt: payment?.updatedAt || payment?.createdAt || null,
        hasEnrollment: true,
      });
    });

    paymentByUser.forEach((payment, userId) => {
      const player = typeof payment?.user === 'object' ? payment.user : {};
      entries.push({
        player,
        playerId: userId,
        categories: [],
        paymentRecord: payment || null,
        paymentId: payment ? normalizeId(payment) : '',
        status: payment?.status && PAYMENT_STATUS_LABELS[payment.status]
          ? payment.status
          : 'pendiente',
        amount: typeof payment?.amount === 'number' && Number.isFinite(payment.amount)
          ? payment.amount
          : null,
        recordedAmount: Number.isFinite(payment?.amount) ? Number(payment.amount) : null,
        suggestedAmount: null,
        suggestion: null,
        currency: payment?.currency || baseCurrency,
        method: payment?.method || '',
        reference: payment?.reference || '',
        notes: payment?.notes || '',
        paidAt: payment?.paidAt || null,
        recordedBy: payment?.recordedBy || null,
        updatedAt: payment?.updatedAt || payment?.createdAt || null,
        hasEnrollment: false,
      });
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
      feeInfo,
      currency: baseCurrency,
    };

    if (!(state.tournamentPayments instanceof Map)) {
      state.tournamentPayments = new Map();
    }
    state.tournamentPayments.set(normalized, result);

    return result;
  }

  function createTournamentPaymentItem(entry, { feeInfo = null } = {}) {
    const listItem = document.createElement('li');
    listItem.className = 'tournament-payment-entry';

    const item = document.createElement('details');
    item.className = 'tournament-payment-item';
    const statusValue = entry.status || 'pendiente';
    item.dataset.paymentStatus = statusValue;
    if (statusValue !== 'pagado') {
      item.open = true;
    }

    const summary = document.createElement('summary');

    const header = document.createElement('div');
    header.className = 'tournament-payment-header';
    const playerCell = buildPlayerCell(entry.player || {}, { includeSchedule: false, size: 'sm' });
    header.appendChild(playerCell);
    summary.appendChild(header);

    const headerMeta = document.createElement('div');
    headerMeta.className = 'tournament-payment-header-meta';

    const statusBadge = document.createElement('span');
    statusBadge.className = `tag payment-status payment-status--${statusValue}`;
    statusBadge.textContent = PAYMENT_STATUS_LABELS[statusValue] || statusValue || 'Pendiente';
    headerMeta.appendChild(statusBadge);

    const entryCurrency = entry.currency || feeInfo?.currency || DEFAULT_TOURNAMENT_CURRENCY;
    const suggestion = entry.suggestion || null;
    const hasRecordedAmount = typeof entry.recordedAmount === 'number' && Number.isFinite(entry.recordedAmount);
    const hasSuggestedAmount = typeof entry.suggestedAmount === 'number' && Number.isFinite(entry.suggestedAmount);
    const recordedAmountValue = hasRecordedAmount ? entry.recordedAmount : null;
    const suggestedAmountValue = hasSuggestedAmount ? entry.suggestedAmount : null;

    if (Number.isFinite(entry.amount)) {
      const amountSpan = document.createElement('span');
      amountSpan.className = 'tournament-payment-amount';
      amountSpan.textContent =
        formatCurrencyValue(entry.amount, entryCurrency) ||
        `${entry.amount.toFixed(2)} ${entryCurrency}`;
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
    body.className = 'tournament-payment-body';

    const categoryNames = Array.isArray(entry.categories)
      ? entry.categories.map((category) => category?.name || '').filter(Boolean)
      : [];
    const categoriesMeta = document.createElement('div');
    categoriesMeta.className = 'tournament-payment-meta';
    categoriesMeta.textContent = categoryNames.length
      ? `Categorías: ${categoryNames.join(', ')}`
      : 'Categorías: Sin asignar';
    body.appendChild(categoriesMeta);

    if (entry.player?.email || entry.player?.phone) {
      const contactMeta = document.createElement('div');
      contactMeta.className = 'tournament-payment-meta';
      if (entry.player.email) {
        contactMeta.appendChild(document.createElement('span')).textContent = entry.player.email;
      }
      if (entry.player.phone) {
        contactMeta.appendChild(document.createElement('span')).textContent = entry.player.phone;
      }
      body.appendChild(contactMeta);
    }

    if (suggestion && Number.isFinite(suggestion.amount)) {
      const suggestionMeta = document.createElement('div');
      suggestionMeta.className = 'tournament-payment-meta';
      const membershipLabel = suggestion.isMember ? 'socio' : 'no socio';
      const categoryLabel = suggestion.categoryCount === 1 ? 'categoría' : 'categorías';
      const suggestionCurrency = suggestion.currency || entryCurrency;
      const formattedSuggestion =
        formatCurrencyValue(suggestion.amount, suggestionCurrency) ||
        `${suggestion.amount.toFixed(2)} ${suggestionCurrency}`;
      suggestionMeta.textContent = `Importe sugerido (${suggestion.categoryCount} ${categoryLabel} · ${membershipLabel}): ${formattedSuggestion}`;
      body.appendChild(suggestionMeta);
    }

    if (entry.reference) {
      const referenceMeta = document.createElement('div');
      referenceMeta.className = 'tournament-payment-meta';
      referenceMeta.textContent = `Referencia: ${entry.reference}`;
      body.appendChild(referenceMeta);
    }

    if (entry.recordedBy?.fullName) {
      const recordedMeta = document.createElement('div');
      recordedMeta.className = 'tournament-payment-meta';
      recordedMeta.textContent = `Actualizado por ${entry.recordedBy.fullName}`;
      body.appendChild(recordedMeta);
    }

    const form = document.createElement('form');
    form.className = 'tournament-payment-form';
    form.dataset.tournamentPaymentForm = 'true';
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

    if (hasRecordedAmount) {
      amountInput.value = recordedAmountValue.toFixed(2);
    } else if (hasSuggestedAmount) {
      amountInput.value = suggestedAmountValue.toFixed(2);
    } else {
      const fallbackEntry = feeInfo?.member || feeInfo?.nonMember || feeInfo?.general || null;
      const fallbackAmount = Number(fallbackEntry?.amount);
      const fallbackCurrency = fallbackEntry?.currency || feeInfo?.currency || entryCurrency;
      if (Number.isFinite(fallbackAmount) && fallbackAmount >= 0) {
        const formatted =
          formatCurrencyValue(fallbackAmount, fallbackCurrency) ||
          `${fallbackAmount.toFixed(2)} ${fallbackCurrency}`;
        amountInput.placeholder = formatted;
      }
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

    let matchedMethod = false;
    TOURNAMENT_PAYMENT_METHOD_OPTIONS.forEach((label) => {
      const option = document.createElement('option');
      option.value = label;
      option.textContent = label;
      if (methodValueLower && methodValueLower === label.toLowerCase()) {
        option.selected = true;
        matchedMethod = true;
      }
      methodSelect.appendChild(option);
    });

    if (!matchedMethod && methodValue) {
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

  function renderTournamentPayments(
    entries = [],
    { feeInfo = null, currency = DEFAULT_TOURNAMENT_CURRENCY } = {}
  ) {
    if (!tournamentPaymentsGroups) return;

    if (tournamentPaymentsCount) {
      tournamentPaymentsCount.textContent = String(entries.length);
    }

    updateTournamentPaymentFeeIndicator(feeInfo);

    resetTournamentPaymentGroups();

    const pendingEntries = entries.filter((entry) => (entry.status || 'pendiente') !== 'pagado');
    const paidEntries = entries.filter((entry) => (entry.status || 'pendiente') === 'pagado');

    updateTournamentPaymentTotalElement(
      tournamentPaymentsPendingTotal,
      calculateTournamentPaymentTotal(pendingEntries),
      currency
    );
    updateTournamentPaymentTotalElement(
      tournamentPaymentsPaidTotal,
      calculateTournamentPaymentTotal(paidEntries),
      currency
    );

    if (!entries.length) {
      if (tournamentPaymentsPendingCount) {
        tournamentPaymentsPendingCount.textContent = '0';
      }
      if (tournamentPaymentsPaidCount) {
        tournamentPaymentsPaidCount.textContent = '0';
      }
      if (tournamentPaymentsPendingEmpty) {
        tournamentPaymentsPendingEmpty.hidden = false;
        tournamentPaymentsPendingEmpty.textContent = 'No hay pagos pendientes.';
      }
      if (tournamentPaymentsPaidEmpty) {
        tournamentPaymentsPaidEmpty.hidden = false;
        tournamentPaymentsPaidEmpty.textContent = 'No hay pagos registrados.';
      }
      if (tournamentPaymentsEmpty) {
        tournamentPaymentsEmpty.hidden = false;
        tournamentPaymentsEmpty.textContent = 'No hay registros de pago para la selección actual.';
      }
      return;
    }

    if (tournamentPaymentsEmpty) {
      tournamentPaymentsEmpty.hidden = true;
    }

    const groups = [
      {
        entries: pendingEntries,
        list: tournamentPaymentsPendingList,
        emptyElement: tournamentPaymentsPendingEmpty,
        countElement: tournamentPaymentsPendingCount,
        emptyText: 'No hay pagos pendientes.',
      },
      {
        entries: paidEntries,
        list: tournamentPaymentsPaidList,
        emptyElement: tournamentPaymentsPaidEmpty,
        countElement: tournamentPaymentsPaidCount,
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
        list.appendChild(createTournamentPaymentItem(entry, { feeInfo }));
      });
    });
  }

  async function refreshTournamentPayments({ force = false } = {}) {
    if (!tournamentPaymentsGroups) return;

    const filters = ensureTournamentPaymentFilters();
    const tournamentId = filters.tournament;

    if (!tournamentId) {
      resetTournamentPaymentGroups();
      if (tournamentPaymentsCount) {
        tournamentPaymentsCount.textContent = '0';
      }
      const hasOptions = getTournamentsWithEnrollmentFee().length > 0;
      if (tournamentPaymentsEmpty) {
        tournamentPaymentsEmpty.hidden = false;
        tournamentPaymentsEmpty.textContent = hasOptions
          ? 'Selecciona un torneo con cuotas para gestionar los pagos.'
          : 'Configura cuotas de inscripción para habilitar el seguimiento de pagos.';
      }
      updateTournamentPaymentFeeIndicator(null);
      setStatusMessage(tournamentPaymentsStatusMessage, '', '');
      return;
    }

    const usingCachedData =
      !force &&
      state.tournamentPayments instanceof Map &&
      state.tournamentPayments.has(tournamentId);

    if (!usingCachedData) {
      resetTournamentPaymentGroups();
      if (tournamentPaymentsStatusMessage) {
        setStatusMessage(tournamentPaymentsStatusMessage, 'info', 'Cargando registros de pago...');
      }
      if (tournamentPaymentsEmpty) {
        tournamentPaymentsEmpty.hidden = false;
        tournamentPaymentsEmpty.textContent = 'Cargando registros de pago...';
      }
    }

    const requestToken = ++tournamentPaymentsRequestToken;
    state.tournamentPaymentsLoading = true;

    try {
      const data = await getTournamentPaymentData(tournamentId, { force });
      if (requestToken !== tournamentPaymentsRequestToken) {
        return;
      }

      const activeFilters = ensureTournamentPaymentFilters();
      const searchTerm = (activeFilters.search || '').trim().toLowerCase();

      const filteredEntries = (data.entries || []).filter((entry) => {
        if (searchTerm) {
          const categoryNames = Array.isArray(entry.categories)
            ? entry.categories.map((category) => category?.name || '').join(' ')
            : '';
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

      renderTournamentPayments(filteredEntries, { feeInfo: data.feeInfo, currency: data.currency });

      if (tournamentPaymentsStatusMessage) {
        setStatusMessage(tournamentPaymentsStatusMessage, '', '');
      }
    } catch (error) {
      if (requestToken !== tournamentPaymentsRequestToken) {
        return;
      }

      if (tournamentPaymentsStatusMessage) {
        setStatusMessage(tournamentPaymentsStatusMessage, 'error', error.message);
      }
      resetTournamentPaymentGroups();
      if (tournamentPaymentsCount) {
        tournamentPaymentsCount.textContent = '0';
      }
      if (tournamentPaymentsEmpty) {
        tournamentPaymentsEmpty.hidden = false;
        tournamentPaymentsEmpty.textContent = 'No fue posible cargar los registros de pago.';
      }
    } finally {
      if (requestToken === tournamentPaymentsRequestToken) {
        state.tournamentPaymentsLoading = false;
      }
    }
  }

  async function handleTournamentPaymentFormSubmit(form) {
    if (!form) return;
    const filters = ensureTournamentPaymentFilters();
    const tournamentId = filters.tournament;
    if (!tournamentId) {
      setStatusMessage(tournamentPaymentsStatusMessage, 'error', 'Selecciona un torneo con cuotas.');
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
          setStatusMessage(tournamentPaymentsStatusMessage, 'error', 'Introduce un importe válido.');
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
        tournamentPaymentsStatusMessage,
        'info',
        paymentId ? 'Actualizando pago...' : 'Registrando pago...'
      );

      if (paymentId) {
        await request(`/tournaments/${tournamentId}/payments/${paymentId}`, { method: 'PATCH', body: payload });
      } else {
        if (!userId) {
          throw new Error('No se puede registrar el pago sin un jugador asociado.');
        }
        await request(`/tournaments/${tournamentId}/payments`, {
          method: 'POST',
          body: { ...payload, user: userId },
        });
      }

      if (state.tournamentDetails instanceof Map) {
        state.tournamentDetails.delete(tournamentId);
      }
      await loadTournamentDetail(tournamentId);
      if (state.selectedTournamentId === tournamentId) {
        await refreshTournamentDetail(tournamentId);
      }

      if (state.tournamentPayments instanceof Map) {
        state.tournamentPayments.delete(tournamentId);
      }

      await refreshTournamentPayments({ force: true });

      setStatusMessage(
        tournamentPaymentsStatusMessage,
        'success',
        paymentId ? 'Pago actualizado correctamente.' : 'Pago registrado correctamente.'
      );
    } catch (error) {
      setStatusMessage(tournamentPaymentsStatusMessage, 'error', error.message);
    }
  }

  function updateTournamentPaymentMenuVisibility() {
    if (!tournamentPaymentsMenuButton) return;

    const adminUser = isAdmin();
    const hasFeeTournaments = adminUser && getTournamentsWithEnrollmentFee().length > 0;
    tournamentPaymentsMenuButton.hidden = !hasFeeTournaments;

    if (!hasFeeTournaments) {
      if (tournamentPaymentsSection) {
        tournamentPaymentsSection.hidden = true;
      }
      if (adminUser && state.activeSection === 'section-tournament-payments') {
        showSection('section-tournament-dashboard');
      }
    }
  }

  return {
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
  };
}
