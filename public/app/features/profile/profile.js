export function createProfileModule(deps = {}) {
  const {
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
    STATUS_LABELS = {},
    PAYMENT_STATUS_LABELS = {},
    setStatusMessage,
    request,
    persistSession,
  } = deps;

  if (!state || typeof state !== 'object') {
    throw new Error('Missing application state for profile module.');
  }
  if (typeof formatShortDate !== 'function') {
    throw new Error('Missing formatShortDate dependency for profile module.');
  }
  if (typeof translateSchedule !== 'function') {
    throw new Error('Missing translateSchedule dependency for profile module.');
  }
  if (typeof formatDateInput !== 'function') {
    throw new Error('Missing formatDateInput dependency for profile module.');
  }
  if (typeof getPushStatusLabel !== 'function') {
    throw new Error('Missing getPushStatusLabel dependency for profile module.');
  }
  if (typeof formatCurrencyDisplay !== 'function') {
    throw new Error('Missing formatCurrencyDisplay dependency for profile module.');
  }
  if (typeof formatDate !== 'function') {
    throw new Error('Missing formatDate dependency for profile module.');
  }
  if (typeof normalizeId !== 'function') {
    throw new Error('Missing normalizeId dependency for profile module.');
  }
  if (typeof getPlayerDisplayName !== 'function') {
    throw new Error('Missing getPlayerDisplayName dependency for profile module.');
  }
  if (typeof createResultScoreboard !== 'function') {
    throw new Error('Missing createResultScoreboard dependency for profile module.');
  }
  if (typeof formatMatchScore !== 'function') {
    throw new Error('Missing formatMatchScore dependency for profile module.');
  }
  if (!PAYMENT_STATUS_LABELS || typeof PAYMENT_STATUS_LABELS !== 'object') {
    throw new Error('Missing PAYMENT_STATUS_LABELS dependency for profile module.');
  }
  if (typeof setStatusMessage !== 'function') {
    throw new Error('Missing setStatusMessage dependency for profile module.');
  }
  if (typeof request !== 'function') {
    throw new Error('Missing request dependency for profile module.');
  }
  if (typeof persistSession !== 'function') {
    throw new Error('Missing persistSession dependency for profile module.');
  }

  function toggleMembershipField(checkbox, wrapper, input, { clearWhenDisabled = false } = {}) {
    if (!wrapper || !checkbox) {
      return;
    }

    const isMember = checkbox.checked;
    wrapper.hidden = !isMember;

    if (input) {
      input.disabled = !isMember;
      if (!isMember && clearWhenDisabled) {
        input.value = '';
      }
    }
  }

  function fillProfileForm() {
    if (!profileForm || !state.user) return;

    const { elements } = profileForm;
    if (!elements) return;

    elements.fullName.value = state.user.fullName || '';
    elements.email.value = state.user.email || '';
    elements.phone.value = state.user.phone || '';
    if (elements.preferredSchedule) {
      elements.preferredSchedule.value = state.user.preferredSchedule || 'flexible';
    }
    if (elements.shirtSize) {
      elements.shirtSize.value = state.user.shirtSize || '';
    }
    if (elements.gender) {
      elements.gender.value = state.user.gender || 'masculino';
    }
    if (elements.birthDate) {
      elements.birthDate.value = formatDateInput(state.user.birthDate);
    }
    if (elements.isMember) {
      elements.isMember.checked = state.user.isMember === true;
    }
    if (elements.membershipNumber) {
      elements.membershipNumber.value = state.user.membershipNumber || '';
    }
    if (elements.photo) {
      elements.photo.value = '';
    }
    if (elements.notes) {
      elements.notes.value = state.user.notes || '';
    }
    if (elements.password) {
      elements.password.value = '';
    }
    if (elements.notifyMatchRequests) {
      elements.notifyMatchRequests.checked = state.user.notifyMatchRequests !== false;
    }
    if (elements.notifyMatchResults) {
      elements.notifyMatchResults.checked = state.user.notifyMatchResults !== false;
    }

    toggleMembershipField(
      profileIsMemberCheckbox,
      profileMembershipWrapper,
      profileMembershipNumberInput,
      { clearWhenDisabled: !state.user.isMember }
    );
  }

  function updateProfileCard() {
    if (!state.user) return;

    if (profileName) {
      profileName.textContent = state.user.fullName || '';
    }
    const photo = state.user.photo;
    if (profileAvatar) {
      profileAvatar.style.backgroundImage = photo ? `url('${photo}')` : '';
    }
    if (accountPhoto) {
      accountPhoto.style.backgroundImage = photo ? `url('${photo}')` : '';
    }

    if (accountFullName) {
      accountFullName.textContent = state.user.fullName || '—';
    }

    if (accountEmail) {
      accountEmail.textContent = state.user.email || '—';
    }

    if (accountPhone) {
      accountPhone.textContent = state.user.phone || '—';
    }

    if (accountMembershipStatus) {
      if (state.user.isMember) {
        accountMembershipStatus.textContent = state.user.membershipNumberVerified
          ? 'Socio del club (validado)'
          : 'Socio del club (pendiente de validación)';
      } else {
        accountMembershipStatus.textContent = 'No es socio';
      }
    }

    if (accountMembershipNumber) {
      accountMembershipNumber.textContent = state.user.membershipNumber || '—';
    }

    if (accountMembershipNumberRow) {
      const showMembershipNumber = Boolean(state.user.isMember && state.user.membershipNumber);
      accountMembershipNumberRow.hidden = !showMembershipNumber;
    }

    if (accountBirthDate) {
      accountBirthDate.textContent = state.user.birthDate
        ? formatShortDate(state.user.birthDate)
        : '—';
    }

    if (accountShirtSize) {
      accountShirtSize.textContent = state.user.shirtSize || '—';
    }

    if (accountSchedule) {
      accountSchedule.textContent = state.user.preferredSchedule
        ? translateSchedule(state.user.preferredSchedule)
        : 'Sin preferencia definida';
    }

    if (accountNotes) {
      accountNotes.textContent = state.user.notes || 'Sin notas registradas.';
    }

    if (accountPushStatus) {
      accountPushStatus.textContent = getPushStatusLabel();
    }

    if (profileForm && !profileForm.hidden) {
      fillProfileForm();
    }
  }

  function populateAccountList(listElement, emptyElement, items, renderItem) {
    if (!listElement) {
      return;
    }

    listElement.innerHTML = '';
    const entries = Array.isArray(items)
      ? items
          .map((item) => (typeof renderItem === 'function' ? renderItem(item) : null))
          .filter(Boolean)
      : [];

    if (!entries.length) {
      listElement.hidden = true;
      if (emptyElement) {
        emptyElement.hidden = false;
      }
      return;
    }

    const fragment = document.createDocumentFragment();
    entries.forEach((entry) => {
      fragment.appendChild(entry);
    });

    listElement.hidden = false;
    listElement.appendChild(fragment);
    if (emptyElement) {
      emptyElement.hidden = true;
    }
  }

  function createAccountEnrollmentItem(enrollment) {
    if (!enrollment) {
      return null;
    }

    const item = document.createElement('li');
    const content = document.createElement('div');
    content.className = 'list-item__content';

    const leagueName = enrollment.league?.name || 'Liga';
    const leagueYear = enrollment.league?.year;
    const title = document.createElement('strong');
    title.textContent = leagueYear ? `${leagueName} · ${leagueYear}` : leagueName;
    content.appendChild(title);

    if (enrollment.category?.name) {
      const categorySpan = document.createElement('span');
      categorySpan.textContent = `Categoría: ${enrollment.category.name}`;
      content.appendChild(categorySpan);
    }

    item.appendChild(content);

    const meta = document.createElement('div');
    meta.className = 'meta';
    if (enrollment.joinedAt) {
      meta.appendChild(document.createElement('span')).textContent = `Inscripción: ${formatShortDate(
        enrollment.joinedAt
      )}`;
    }

    item.appendChild(meta);
    return item;
  }

  function createAccountMatchItem(match, { variant = 'upcoming' } = {}) {
    if (!match) {
      return null;
    }

    const item = document.createElement('li');
    const content = document.createElement('div');
    content.className = 'list-item__content';

    const container = match.scope === 'league' ? match.league : match.tournament;
    const titleParts = [];
    if (container?.name) {
      titleParts.push(container.name);
    }
    if (match.category?.name) {
      titleParts.push(match.category.name);
    }

    const title = document.createElement('strong');
    title.textContent = titleParts.length ? titleParts.join(' · ') : 'Partido';
    content.appendChild(title);

    const participants = Array.isArray(match.players)
      ? match.players
          .map((player) => getPlayerDisplayName(player))
          .filter(Boolean)
      : [];
    if (participants.length) {
      const participantsSpan = document.createElement('span');
      participantsSpan.textContent = participants.join(' vs ');
      content.appendChild(participantsSpan);
    }

    item.appendChild(content);

    const meta = document.createElement('div');
    meta.className = 'meta';

    if (match.scheduledAt) {
      meta.appendChild(document.createElement('span')).textContent = formatDate(match.scheduledAt);
    }

    if (match.court) {
      meta.appendChild(document.createElement('span')).textContent = `Pista: ${match.court}`;
    }

    if (match.status) {
      const statusLabel = STATUS_LABELS[match.status] || match.status;
      if (statusLabel) {
        const statusTag = document.createElement('span');
        statusTag.className = 'tag';
        statusTag.textContent = statusLabel;
        meta.appendChild(statusTag);
      }
    }

    if (variant === 'recent') {
      const winnerId = normalizeId(match.result?.winner);
      if (winnerId) {
        let winnerName = '';
        if (Array.isArray(match.players)) {
          const winner = match.players.find((player) => normalizeId(player) === winnerId);
          if (winner) {
            winnerName = getPlayerDisplayName(winner);
          }
        }
        if (winnerName) {
          meta.appendChild(document.createElement('span')).textContent = `Ganador: ${winnerName}`;
        }
      } else if (match.result?.status) {
        const resultLabel = STATUS_LABELS[match.result.status] || match.result.status;
        meta.appendChild(document.createElement('span')).textContent = `Resultado: ${resultLabel}`;
      } else {
        meta.appendChild(document.createElement('span')).textContent = 'Resultado: pendiente';
      }

      const scoreboard = createResultScoreboard(match);
      let scoreSummary = formatMatchScore(match);

      if (!scoreSummary && match.scope === 'tournament' && match.result?.score) {
        const rawScore = match.result.score.trim();
        if (rawScore) {
          scoreSummary = /^marcador:/i.test(rawScore) ? rawScore : `Marcador: ${rawScore}`;
        }
      }

      if (scoreboard) {
        item.appendChild(scoreboard);
      } else if (scoreSummary) {
        const summaryRow = document.createElement('div');
        summaryRow.className = 'meta';
        summaryRow.textContent = scoreSummary;
        item.appendChild(summaryRow);
      }

      if (match.updatedAt) {
        meta.appendChild(document.createElement('span')).textContent = `Actualizado: ${formatShortDate(
          match.updatedAt
        )}`;
      }
    }

    item.appendChild(meta);
    return item;
  }

  function createAccountPaymentItem(record) {
    if (!record) {
      return null;
    }

    const item = document.createElement('li');
    const content = document.createElement('div');
    content.className = 'list-item__content';

    const titleParts = [];
    if (record.container?.name) {
      titleParts.push(record.container.name);
    }
    if (record.scope === 'league') {
      titleParts.push('Liga');
    } else if (record.scope === 'tournament') {
      titleParts.push('Torneo');
    }

    const title = document.createElement('strong');
    title.textContent = titleParts.length ? titleParts.join(' · ') : 'Pago';
    content.appendChild(title);

    if (record.reference) {
      const referenceSpan = document.createElement('span');
      referenceSpan.textContent = `Referencia: ${record.reference}`;
      content.appendChild(referenceSpan);
    }

    if (record.notes) {
      const notesSpan = document.createElement('span');
      notesSpan.textContent = record.notes;
      content.appendChild(notesSpan);
    }

    item.appendChild(content);

    const meta = document.createElement('div');
    meta.className = 'meta';

    if (record.status) {
      const statusBadge = document.createElement('span');
      statusBadge.className = `tag payment-status payment-status--${record.status}`;
      statusBadge.textContent = PAYMENT_STATUS_LABELS[record.status] || record.status;
      meta.appendChild(statusBadge);
    }

    if (typeof record.amount === 'number' && Number.isFinite(record.amount)) {
      meta.appendChild(document.createElement('span')).textContent = formatCurrencyDisplay(record.amount);
    }

    if (record.paidAt) {
      meta.appendChild(document.createElement('span')).textContent = `Pago: ${formatShortDate(record.paidAt)}`;
    } else if (record.recordedAt) {
      meta.appendChild(document.createElement('span')).textContent = `Registrado: ${formatShortDate(
        record.recordedAt
      )}`;
    }

    if (record.method) {
      meta.appendChild(document.createElement('span')).textContent = `Método: ${record.method}`;
    }

    item.appendChild(meta);
    return item;
  }

  function renderAccountSummary(summary) {
    state.accountSummary = summary || null;

    if (!accountDashboardCard) {
      return;
    }

    if (accountDashboardRefresh) {
      accountDashboardRefresh.hidden = !state.token;
    }

    if (summary?.user && state.user) {
      const summaryUser = summary.user;
      let updated = false;
      const nextUser = { ...state.user };
      if (typeof summaryUser.fullName === 'string' && summaryUser.fullName && summaryUser.fullName !== nextUser.fullName) {
        nextUser.fullName = summaryUser.fullName;
        updated = true;
      }
      if (typeof summaryUser.email === 'string' && summaryUser.email && summaryUser.email !== nextUser.email) {
        nextUser.email = summaryUser.email;
        updated = true;
      }
      if (typeof summaryUser.phone === 'string' && summaryUser.phone && summaryUser.phone !== nextUser.phone) {
        nextUser.phone = summaryUser.phone;
        updated = true;
      }
      if (typeof summaryUser.isMember === 'boolean' && summaryUser.isMember !== nextUser.isMember) {
        nextUser.isMember = summaryUser.isMember;
        updated = true;
      }
      if (summaryUser.membershipNumber !== undefined && summaryUser.membershipNumber !== nextUser.membershipNumber) {
        nextUser.membershipNumber = summaryUser.membershipNumber;
        updated = true;
      }
      if (
        typeof summaryUser.membershipNumberVerified === 'boolean' &&
        summaryUser.membershipNumberVerified !== nextUser.membershipNumberVerified
      ) {
        nextUser.membershipNumberVerified = summaryUser.membershipNumberVerified;
        updated = true;
      }

      if (updated) {
        state.user = nextUser;
        persistSession();
        updateProfileCard();
      }
    }

    if (!summary) {
      if (accountDashboard) {
        accountDashboard.hidden = true;
      }
      if (accountDashboardEmpty) {
        accountDashboardEmpty.hidden = false;
        accountDashboardEmpty.textContent = state.token
          ? 'Tus inscripciones, partidos y pagos aparecerán aquí en cuanto participes en la liga.'
          : 'Inicia sesión para consultar tu actividad personal.';
      }

      if (accountEnrollmentsCount) accountEnrollmentsCount.textContent = '0';
      if (accountUpcomingCount) accountUpcomingCount.textContent = '0';
      if (accountRecentCount) accountRecentCount.textContent = '0';
      if (accountPaymentsCount) accountPaymentsCount.textContent = '0';
      if (accountPaymentsPaid) accountPaymentsPaid.textContent = formatCurrencyDisplay(0);
      if (accountPaymentsPending) accountPaymentsPending.textContent = formatCurrencyDisplay(0);
      if (accountPaymentsTotal) accountPaymentsTotal.textContent = formatCurrencyDisplay(0);

      populateAccountList(accountEnrollmentsList, accountEnrollmentsEmpty, [], () => null);
      populateAccountList(accountUpcomingList, accountUpcomingEmpty, [], () => null);
      populateAccountList(accountRecentList, accountRecentEmpty, [], () => null);
      populateAccountList(accountPaymentsList, accountPaymentsEmpty, [], () => null);
      return;
    }

    if (accountDashboard) {
      accountDashboard.hidden = false;
    }
    if (accountDashboardEmpty) {
      accountDashboardEmpty.hidden = true;
    }

    const enrollments = Array.isArray(summary.enrollments) ? summary.enrollments : [];
    const upcomingMatches = Array.isArray(summary.matches?.upcoming) ? summary.matches.upcoming : [];
    const recentMatches = Array.isArray(summary.matches?.recent) ? summary.matches.recent : [];
    const paymentRecords = Array.isArray(summary.payments?.records) ? summary.payments.records : [];
    const totals = summary.payments?.totals || { paid: 0, pending: 0, total: 0 };

    if (accountEnrollmentsCount) accountEnrollmentsCount.textContent = enrollments.length.toString();
    if (accountUpcomingCount) accountUpcomingCount.textContent = upcomingMatches.length.toString();
    if (accountRecentCount) accountRecentCount.textContent = recentMatches.length.toString();
    if (accountPaymentsCount) accountPaymentsCount.textContent = paymentRecords.length.toString();
    if (accountPaymentsPaid) accountPaymentsPaid.textContent = formatCurrencyDisplay(totals.paid);
    if (accountPaymentsPending) accountPaymentsPending.textContent = formatCurrencyDisplay(totals.pending);
    if (accountPaymentsTotal) accountPaymentsTotal.textContent = formatCurrencyDisplay(totals.total);

    populateAccountList(accountEnrollmentsList, accountEnrollmentsEmpty, enrollments, createAccountEnrollmentItem);
    populateAccountList(accountUpcomingList, accountUpcomingEmpty, upcomingMatches, (match) =>
      createAccountMatchItem(match, { variant: 'upcoming' })
    );
    populateAccountList(accountRecentList, accountRecentEmpty, recentMatches, (match) =>
      createAccountMatchItem(match, { variant: 'recent' })
    );
    populateAccountList(accountPaymentsList, accountPaymentsEmpty, paymentRecords, createAccountPaymentItem);
  }

  async function loadAccountSummary({ force = true } = {}) {
    if (!force && state.accountSummary) {
      renderAccountSummary(state.accountSummary);
      return state.accountSummary;
    }

    if (state.accountSummaryLoading) {
      return state.accountSummary;
    }

    state.accountSummaryLoading = true;
    if (accountDashboardStatus) {
      setStatusMessage(accountDashboardStatus, 'info', 'Cargando resumen personal...');
    }
    if (accountDashboardRefresh) {
      accountDashboardRefresh.disabled = true;
    }

    try {
      const summary = await request('/account/summary');
      renderAccountSummary(summary);
      if (accountDashboardStatus) {
        setStatusMessage(accountDashboardStatus, '', '');
      }
      return summary;
    } catch (error) {
      console.warn('No se pudo cargar el resumen de cuenta', error);
      if (accountDashboardStatus) {
        setStatusMessage(accountDashboardStatus, 'error', error.message);
      }
      if (!state.accountSummary) {
        renderAccountSummary(null);
      }
      return null;
    } finally {
      state.accountSummaryLoading = false;
      if (accountDashboardRefresh) {
        accountDashboardRefresh.disabled = false;
      }
    }
  }

  return {
    updateProfileCard,
    fillProfileForm,
    toggleMembershipField,
    renderAccountSummary,
    loadAccountSummary,
  };
}
