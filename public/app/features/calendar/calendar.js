export function createCalendarModule({
  state,
  playerCourtCalendarContainer,
  playerCourtCalendarLabel,
  playerCourtCalendarDateInput,
  courtCalendarContainer,
  courtCalendarLabel,
  courtCalendarStatus,
  courtCalendarViewButtons,
  courtBlocksList,
  courtBlocksEmpty,
  courtAdminDateInput,
  setStatusMessage,
  formatDateInput,
  formatDayLabel,
  formatMonthLabel,
  formatDateRangeLabel,
  formatTimeRangeLabel,
  startOfDay,
  startOfMonth,
  endOfMonth,
  addDays,
  hasCourtManagementAccess,
  setCalendarViewButtonState,
  request,
  formatReservationParticipantsLabel,
  getReservationMatch,
  getPlayerDisplayName,
  getReservationContextLabel,
  normalizeId,
  ensureCourtBlockRangeDefaults,
  showSection,
  refreshCourtAvailability,
  calendarEvents,
} = {}) {
  if (!state || typeof startOfDay !== 'function') {
    throw new Error('Missing required dependencies for calendar module.');
  }

  const {
    buildPlayerCourtCalendarEvents,
    buildCourtCalendarDayMap,
    createCourtCalendarDaySchedule,
    createCourtCalendarDayBlock,
  } = calendarEvents || {};

  if (
    typeof buildPlayerCourtCalendarEvents !== 'function' ||
    typeof buildCourtCalendarDayMap !== 'function' ||
    typeof createCourtCalendarDaySchedule !== 'function' ||
    typeof createCourtCalendarDayBlock !== 'function'
  ) {
    throw new Error('Missing calendar event helpers.');
  }

  function renderPlayerCourtCalendar() {
    if (!playerCourtCalendarContainer) {
      return;
    }

    const reference =
      state.courtAvailabilityDate instanceof Date
        ? new Date(state.courtAvailabilityDate)
        : new Date();
    if (Number.isNaN(reference.getTime())) {
      return;
    }

    const normalizedReference = startOfDay(reference);
    state.playerCourtCalendarDate = normalizedReference;

    if (playerCourtCalendarDateInput) {
      playerCourtCalendarDateInput.value = formatDateInput(normalizedReference);
    }
    if (playerCourtCalendarLabel) {
      playerCourtCalendarLabel.textContent = formatDayLabel(normalizedReference);
    }

    const availability = Array.isArray(state.courtAvailability) ? state.courtAvailability : [];

    playerCourtCalendarContainer.innerHTML = '';

    if (!availability.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No hay reservas registradas para la fecha seleccionada.';
      playerCourtCalendarContainer.appendChild(empty);
      return;
    }

    const events = buildPlayerCourtCalendarEvents(availability);

    const previousDate = state.courtCalendarDate;
    const previousViewMode = state.courtCalendarViewMode;

    state.courtCalendarDate = normalizedReference;
    state.courtCalendarViewMode = 'day';

    const schedule = createCourtCalendarDaySchedule(normalizedReference, events);
    playerCourtCalendarContainer.appendChild(schedule);

    state.courtCalendarDate = previousDate;
    state.courtCalendarViewMode = previousViewMode;
  }

  function renderCourtCalendar() {
    if (!courtCalendarContainer) {
      return;
    }

    const reference =
      state.courtCalendarDate instanceof Date ? new Date(state.courtCalendarDate) : new Date();
    const normalizedReference = startOfDay(reference);
    state.courtCalendarDate = normalizedReference;

    const viewMode = state.courtCalendarViewMode === 'day' ? 'day' : 'month';
    setCalendarViewButtonState(courtCalendarViewButtons, viewMode);

    const events = Array.isArray(state.courtCalendarEvents) ? state.courtCalendarEvents : [];
    const grouped = buildCourtCalendarDayMap(events);

    courtCalendarContainer.innerHTML = '';

    if (viewMode === 'day') {
      if (courtCalendarLabel) {
        courtCalendarLabel.textContent = formatDayLabel(normalizedReference);
      }
      const key = normalizedReference.getTime();
      const dayEvents = grouped.get(key) || [];
      courtCalendarContainer.appendChild(createCourtCalendarDaySchedule(normalizedReference, dayEvents));
      return;
    }

    const monthStart = startOfMonth(normalizedReference);
    if (courtCalendarLabel) {
      courtCalendarLabel.textContent = formatMonthLabel(monthStart);
    }

    const monthEnd = endOfMonth(monthStart);
    const dayList = document.createElement('div');
    dayList.className = 'calendar-day-list';

    for (let cursor = new Date(monthStart); cursor < monthEnd; cursor = addDays(cursor, 1)) {
      const dayKey = startOfDay(cursor).getTime();
      const dayEvents = grouped.get(dayKey) || [];
      dayList.appendChild(createCourtCalendarDayBlock(cursor, dayEvents));
    }

    courtCalendarContainer.appendChild(dayList);
  }

  function setCourtCalendarViewMode(view) {
    const normalized = view === 'day' ? 'day' : 'month';
    state.courtCalendarViewMode = normalized;
    setCalendarViewButtonState(courtCalendarViewButtons, normalized);
    renderCourtCalendar();
  }

  function resetCourtCalendarView() {
    if (courtCalendarContainer) {
      courtCalendarContainer.innerHTML =
        '<p class="empty-state">Selecciona un periodo para ver las reservas y bloqueos de pistas.</p>';
    }
    if (courtCalendarLabel) {
      const reference =
        state.courtCalendarDate instanceof Date ? state.courtCalendarDate : new Date();
      const normalizedReference = startOfDay(reference);
      courtCalendarLabel.textContent =
        state.courtCalendarViewMode === 'day'
          ? formatDayLabel(normalizedReference)
          : formatMonthLabel(startOfMonth(normalizedReference));
    }
    setCalendarViewButtonState(
      courtCalendarViewButtons,
      state.courtCalendarViewMode === 'day' ? 'day' : 'month'
    );
    if (courtBlocksEmpty) {
      courtBlocksEmpty.hidden = false;
    }
  }

  function renderCourtBlocksList() {
    if (!courtBlocksList) {
      return;
    }

    const blocks = Array.isArray(state.courtBlocks) ? state.courtBlocks.slice() : [];
    blocks.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

    courtBlocksList.innerHTML = '';

    if (!blocks.length) {
      if (courtBlocksEmpty) {
        courtBlocksEmpty.hidden = false;
        courtBlocksEmpty.textContent = 'No hay bloqueos registrados para el mes seleccionado.';
        courtBlocksList.appendChild(courtBlocksEmpty);
      } else {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'empty-state';
        emptyItem.textContent = 'No hay bloqueos registrados para el mes seleccionado.';
        courtBlocksList.appendChild(emptyItem);
      }
      return;
    }

    if (courtBlocksEmpty) {
      courtBlocksEmpty.hidden = true;
    }

    blocks.forEach((block) => {
      const item = document.createElement('li');
      item.className = 'court-block-item';

      const header = document.createElement('div');
      header.className = 'court-block-item__header';

      const title = document.createElement('strong');
      title.textContent = block.contextName || 'Bloqueo programado';
      header.appendChild(title);

      const badge = document.createElement('span');
      badge.className = 'tag tag--block';
      let badgeLabel = 'Bloqueo';
      switch (block.contextType) {
        case 'league':
          badgeLabel = 'Liga';
          break;
        case 'tournament':
          badgeLabel = 'Torneo';
          break;
        case 'lesson':
          badgeLabel = 'Clases';
          break;
        default:
          badgeLabel = 'Bloqueo';
      }
      badge.textContent = badgeLabel;
      header.appendChild(badge);

      item.appendChild(header);

      const courts = Array.isArray(block.courts) ? block.courts : [];
      const rangeLabel = formatDateRangeLabel(block.startsAt, block.endsAt);
      const schedule = document.createElement('div');
      schedule.className = 'meta court-block-item__schedule';
      schedule.textContent = `${rangeLabel} · ${formatTimeRangeLabel(block.startsAt, block.endsAt)}`;
      item.appendChild(schedule);

      const courtLabel = document.createElement('div');
      courtLabel.className = 'meta court-block-item__courts';
      courtLabel.textContent = block.appliesToAllCourts
        ? 'Todas las pistas del club'
        : `Pistas: ${courts.join(', ')}`;
      item.appendChild(courtLabel);

      if (block.notes) {
        const notes = document.createElement('div');
        notes.className = 'meta court-block-item__notes';
        notes.textContent = block.notes;
        item.appendChild(notes);
      }

      if (hasCourtManagementAccess() && block.id) {
        const actions = document.createElement('div');
        actions.className = 'court-block-item__actions';
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'ghost danger';
        deleteButton.dataset.action = 'delete-block';
        deleteButton.dataset.blockId = block.id;
        deleteButton.textContent = 'Eliminar bloqueo';
        actions.appendChild(deleteButton);
        item.appendChild(actions);
      }

      courtBlocksList.appendChild(item);
    });
  }

  async function loadCourtCalendarData() {
    if (!hasCourtManagementAccess()) {
      state.courtCalendarEvents = [];
      state.courtBlocks = [];
      resetCourtCalendarView();
      renderCourtBlocksList();
      return;
    }

    const reference =
      state.courtCalendarDate instanceof Date ? new Date(state.courtCalendarDate) : new Date();
    const normalizedReference = startOfDay(reference);
    const monthStart = startOfMonth(normalizedReference);
    const monthEnd = endOfMonth(monthStart);
    state.courtCalendarDate = normalizedReference;

    if (courtCalendarStatus) {
      setStatusMessage(courtCalendarStatus, 'info', 'Cargando calendario de pistas...');
    }

    const startParam = encodeURIComponent(monthStart.toISOString());
    const endParam = encodeURIComponent(monthEnd.toISOString());

    try {
      const [reservationsResponse, blocksResponse] = await Promise.all([
        request(`/courts/reservations?start=${startParam}&end=${endParam}`),
        request(`/courts/blocks?start=${startParam}&end=${endParam}`),
      ]);

      const reservations = Array.isArray(reservationsResponse) ? reservationsResponse : [];
      const blocks = Array.isArray(blocksResponse) ? blocksResponse : [];

      const events = [];

      reservations.forEach((reservation) => {
        const startsAt = reservation?.startsAt ? new Date(reservation.startsAt) : null;
        const endsAt = reservation?.endsAt ? new Date(reservation.endsAt) : null;
        if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
          return;
        }

        const participantsLabel = formatReservationParticipantsLabel(reservation);
        const courtLabel = reservation.court || 'Pista por definir';
        const match = getReservationMatch(reservation);

        if (match) {
          const players = Array.isArray(match.players)
            ? match.players.map((player) => getPlayerDisplayName(player)).join(' vs ')
            : participantsLabel || 'Partido programado';
          const subtitleParts = [getReservationContextLabel(reservation)];
          const isPreReserved = reservation.status === 'pre_reservada';
          if (isPreReserved) {
            subtitleParts.push('Pre-reserva pendiente de confirmación');
          }
          if (reservation.tournamentMatch) {
            if (match.tournament?.name) {
              subtitleParts.push(match.tournament.name);
            }
            if (match.category?.name) {
              subtitleParts.push(match.category.name);
            }
          } else {
            if (match.league?.name) {
              subtitleParts.push(match.league.name);
            }
            if (match.tournament?.name) {
              subtitleParts.push(match.tournament.name);
            }
          }

          const isTournament = Boolean(reservation.tournamentMatch);
          const eventPayload = {
            id: reservation._id || reservation.id,
            type: isTournament ? 'tournament-match' : 'match',
            startsAt,
            endsAt,
            title: players,
            subtitle: subtitleParts.join(' · '),
            court: reservation.court,
            courtLabel,
            status: reservation.status || 'reservada',
            preReserved: isPreReserved,
          };

          if (isTournament) {
            eventPayload.tournamentMatchId = match._id || match.id;
            eventPayload.tournamentId = normalizeId(match.tournament);
            eventPayload.categoryId = normalizeId(match.category);
          } else {
            eventPayload.matchId = match._id || match.id;
          }

          events.push(eventPayload);
          return;
        }

        const contextLabel = getReservationContextLabel(reservation);
        const ownerLabel = reservation.createdBy ? getPlayerDisplayName(reservation.createdBy) : '';
        const subtitleParts = [];
        if (ownerLabel) {
          subtitleParts.push(`Reserva de ${ownerLabel}`);
        }
        if (participantsLabel) {
          subtitleParts.push(`Jugadores: ${participantsLabel}`);
        }

        events.push({
          id: reservation._id || reservation.id,
          type: 'reservation',
          startsAt,
          endsAt,
          title: contextLabel,
          subtitle: subtitleParts.join(' · '),
          notes: reservation.notes || '',
          court: reservation.court,
          courtLabel,
          reservationId: reservation._id || reservation.id,
          status: reservation.status || 'reservada',
        });
      });

      const normalizedBlocks = blocks.map((block) => {
        const startsAt = block.startsAt ? new Date(block.startsAt) : null;
        const endsAt = block.endsAt ? new Date(block.endsAt) : null;
        return {
          ...block,
          startsAt,
          endsAt,
        };
      });

      normalizedBlocks.forEach((block) => {
        if (!block.startsAt || !block.endsAt || Number.isNaN(block.startsAt.getTime()) || Number.isNaN(block.endsAt.getTime())) {
          return;
        }

        events.push({
          id: block.id,
          type: 'block',
          startsAt: block.startsAt,
          endsAt: block.endsAt,
          title:
            block.contextType === 'lesson'
              ? block.contextName || 'Clases de tenis'
              : block.contextName
              ? `Bloqueo · ${block.contextName}`
              : 'Bloqueo de pistas',
          subtitle: block.appliesToAllCourts
            ? 'Aplica a todas las pistas'
            : block.courts?.length
            ? `Pistas: ${block.courts.join(', ')}`
            : 'Pistas por confirmar',
          notes: block.notes || '',
          courtLabel: block.appliesToAllCourts
            ? 'Todas las pistas'
            : block.courts?.length
            ? block.courts.join(', ')
            : 'Pistas del club',
          appliesToAllCourts: Boolean(block.appliesToAllCourts),
          courts: Array.isArray(block.courts) ? block.courts : [],
          contextType: block.contextType || '',
          contextName: block.contextName || '',
        });
      });

      state.courtCalendarEvents = events;
      state.courtBlocks = normalizedBlocks;

      renderCourtCalendar();
      renderCourtBlocksList();
      ensureCourtBlockRangeDefaults(monthStart);
      if (courtCalendarStatus) {
        setStatusMessage(courtCalendarStatus, '', '');
      }
    } catch (error) {
      state.courtCalendarEvents = [];
      state.courtBlocks = [];
      resetCourtCalendarView();
      renderCourtBlocksList();
      if (courtCalendarStatus) {
        setStatusMessage(courtCalendarStatus, 'error', error.message);
      }
    }
  }

  async function handleCourtCalendarDaySelection(dateValue) {
    if (!dateValue) {
      return;
    }

    const nextDate = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(nextDate.getTime())) {
      return;
    }

    state.courtAdminDate = nextDate;
    if (courtAdminDateInput) {
      courtAdminDateInput.value = formatDateInput(nextDate);
    }
    state.courtCalendarDate = startOfDay(nextDate);
    renderCourtCalendar();
    showSection('section-court-admin');
    ensureCourtBlockRangeDefaults(nextDate);
    await refreshCourtAvailability('admin');
  }

  return {
    renderPlayerCourtCalendar,
    renderCourtCalendar,
    setCourtCalendarViewMode,
    resetCourtCalendarView,
    renderCourtBlocksList,
    loadCourtCalendarData,
    handleCourtCalendarDaySelection,
  };
}

