export function createCourtReservationsModule({
  state,
  request,
  showGlobalMessage,
  setStatusMessage,
  formatDate,
  formatDateInput,
  formatTime,
  formatTimeRangeLabel,
  formatTimeInputValue,
  formatCourtDisplay,
  combineDateAndTime,
  roundDateUpToInterval,
  addMinutes,
  startOfDay,
  normalizeId,
  getPlayerDisplayName,
  getClubCourtNames,
  hasCourtManagementAccess,
  openModal,
  closeModal,
  buildMatchTeams,
  courtReservationList,
  courtReservationEmpty,
  courtReservationForm,
  courtReservationDateInput,
  courtReservationTimeInput,
  courtReservationDurationSelect,
  courtReservationCourtSelect,
  courtReservationNotesInput,
  courtReservationStatus,
  courtReservationSubmit,
  COURT_RESERVATION_DEFAULT_DURATION,
  COURT_RESERVATION_FIRST_SLOT_MINUTE,
  COURT_RESERVATION_LAST_SLOT_END_MINUTE,
} = {}) {
  if (!state || typeof request !== 'function') {
    throw new Error('Missing required court reservation dependencies.');
  }

  if (typeof formatDate !== 'function' || typeof formatTime !== 'function') {
    throw new Error('Missing date formatting helpers for court reservations.');
  }

  if (typeof formatTimeRangeLabel !== 'function' || typeof formatTimeInputValue !== 'function') {
    throw new Error('Missing time formatting helpers for court reservations.');
  }

  if (typeof combineDateAndTime !== 'function' || typeof roundDateUpToInterval !== 'function') {
    throw new Error('Missing scheduling helpers for court reservations.');
  }

  if (typeof addMinutes !== 'function' || typeof startOfDay !== 'function') {
    throw new Error('Missing date math helpers for court reservations.');
  }

  if (typeof normalizeId !== 'function' || typeof getPlayerDisplayName !== 'function') {
    throw new Error('Missing identity helpers for court reservations.');
  }

  if (typeof buildMatchTeams !== 'function') {
    throw new Error('Missing match helper for court reservations.');
  }

  if (typeof openModal !== 'function' || typeof closeModal !== 'function') {
    throw new Error('Missing modal helpers for court reservations.');
  }

  let refreshCourtAvailability = async () => {};
  let loadAdminCourtData = async () => {};
  let loadCourtCalendarData = async () => {};

  function getReservationSlotStartsForDate(baseDate = new Date()) {
    const reference = new Date(baseDate);
    if (Number.isNaN(reference.getTime())) {
      return [];
    }

    const dayStart = startOfDay(reference);
    const slots = [];
    const lastSlotStart = COURT_RESERVATION_LAST_SLOT_END_MINUTE - COURT_RESERVATION_DEFAULT_DURATION;
    for (
      let minute = COURT_RESERVATION_FIRST_SLOT_MINUTE;
      minute <= lastSlotStart;
      minute += COURT_RESERVATION_DEFAULT_DURATION
    ) {
      slots.push(addMinutes(dayStart, minute));
    }

    const now = new Date();
    const isToday = startOfDay(now).getTime() === dayStart.getTime();

    if (!isToday) {
      return slots;
    }

    return slots.filter((slot) => slot.getTime() >= now.getTime());
  }

  function getReservationSlotEnd(start) {
    return addMinutes(start, COURT_RESERVATION_DEFAULT_DURATION);
  }

  function formatReservationSlotLabel(start) {
    return formatTime(start);
  }

  function isValidReservationSlotStart(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return false;
    }
    const startMinutes = date.getHours() * 60 + date.getMinutes();
    const earliest = COURT_RESERVATION_FIRST_SLOT_MINUTE;
    const latestStart = COURT_RESERVATION_LAST_SLOT_END_MINUTE - COURT_RESERVATION_DEFAULT_DURATION;
    if (startMinutes < earliest || startMinutes > latestStart) {
      return false;
    }
    return (startMinutes - earliest) % COURT_RESERVATION_DEFAULT_DURATION === 0;
  }

  function getReservationMatch(reservation) {
    if (!reservation) {
      return null;
    }
    if (reservation.tournamentMatch) {
      return reservation.tournamentMatch;
    }
    if (reservation.match) {
      return reservation.match;
    }
    return null;
  }

  function getReservationContext(reservation) {
    const match = getReservationMatch(reservation);
    if (match && reservation && reservation.tournamentMatch) {
      return 'tournament';
    }
    if (match) {
      return 'league';
    }
    return 'private';
  }

  function getReservationContextLabel(reservation) {
    const context = getReservationContext(reservation);
    if (context === 'tournament') {
      return 'Partido de torneo';
    }
    if (context === 'league') {
      return 'Partido de liga';
    }
    return 'Partido privado';
  }

  function getReservationParticipants(reservation) {
    if (!reservation) {
      return [];
    }
    if (Array.isArray(reservation.participants) && reservation.participants.length) {
      return reservation.participants;
    }
    const match = getReservationMatch(reservation);
    if (match && Array.isArray(match.players) && match.players.length) {
      return match.players;
    }
    if (reservation.createdBy) {
      return [reservation.createdBy];
    }
    return [];
  }

  function formatReservationParticipantsLabel(reservation) {
    const participants = getReservationParticipants(reservation);
    if (!participants.length) {
      return '';
    }
    return participants.map((participant) => getPlayerDisplayName(participant)).join(' · ');
  }

  function formatMatchPlayersLabel(players = []) {
    if (!Array.isArray(players)) {
      return '';
    }

    const teams = buildMatchTeams(players);
    if (teams.length) {
      const teamLabels = teams
        .map((team) => {
          const memberNames = team
            .map((player) => {
              const name = getPlayerDisplayName(player);
              return typeof name === 'string' ? name.trim() : '';
            })
            .filter(Boolean);
          return memberNames.join(' / ');
        })
        .filter(Boolean);

      if (teamLabels.length) {
        return teamLabels.join(' vs ');
      }
    }

    const playerLabels = players
      .map((player) => {
        const name = getPlayerDisplayName(player);
        return typeof name === 'string' ? name.trim() : '';
      })
      .filter(Boolean);

    return playerLabels.join(' vs ');
  }

  function formatReservationPlayerOptionLabel(player) {
    if (!player) {
      return 'Jugador';
    }
    const name = typeof player.fullName === 'string' ? player.fullName.trim() : '';
    const email = typeof player.email === 'string' ? player.email.trim() : '';
    if (name && email) {
      return `${name} · ${email}`;
    }
    return name || email || 'Jugador';
  }

  function getSelectableReservationPlayers() {
    const players = Array.isArray(state.reservationPlayers) ? state.reservationPlayers : [];
    const currentUserId = normalizeId(state.user);
    return players.filter((player) => {
      const playerId = normalizeId(player);
      return playerId && playerId !== currentUserId;
    });
  }

  async function ensureReservationPlayersLoaded() {
    if (Array.isArray(state.reservationPlayers) && state.reservationPlayers.length) {
      return state.reservationPlayers;
    }

    try {
      const players = await request('/courts/reservations/players');
      state.reservationPlayers = Array.isArray(players) ? players : [];
    } catch (error) {
      state.reservationPlayers = [];
      throw error;
    }

    return state.reservationPlayers;
  }

  function renderCourtReservations() {
    if (!courtReservationList) {
      return;
    }

    const reservations = Array.isArray(state.courtReservations) ? state.courtReservations.slice() : [];
    reservations.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

    courtReservationList.innerHTML = '';

    if (!reservations.length) {
      if (courtReservationEmpty) {
        courtReservationEmpty.hidden = false;
      }
      return;
    }

    if (courtReservationEmpty) {
      courtReservationEmpty.hidden = true;
    }

    reservations.forEach((reservation) => {
      const item = document.createElement('li');
      item.className = 'court-reservation-item';
      if (reservation.status === 'cancelada') {
        item.classList.add('court-reservation-item--cancelled');
      }
      if (reservation.status === 'pre_reservada') {
        item.classList.add('court-reservation-item--pending');
      }

      const reservationId = reservation._id || reservation.id;
      if (reservationId) {
        item.dataset.reservationId = reservationId;
      }

      const title = document.createElement('strong');
      title.textContent = reservation.court ? `Pista ${reservation.court}` : 'Pista por confirmar';
      item.appendChild(title);

      const scheduleRow = document.createElement('div');
      scheduleRow.className = 'meta';
      scheduleRow.appendChild(document.createElement('span')).textContent = formatDate(reservation.startsAt);
      scheduleRow.appendChild(document.createElement('span')).textContent = formatTimeRangeLabel(
        reservation.startsAt,
        reservation.endsAt
      );
      const contextTag = document.createElement('span');
      contextTag.className = 'tag';
      contextTag.textContent = getReservationContextLabel(reservation);
      scheduleRow.appendChild(contextTag);
      if (reservation.status === 'pre_reservada') {
        const pendingTag = document.createElement('span');
        pendingTag.className = 'tag';
        pendingTag.textContent = 'Pre-reserva';
        scheduleRow.appendChild(pendingTag);
      }
      if (reservation.status === 'cancelada') {
        const cancelledTag = document.createElement('span');
        cancelledTag.className = 'tag danger';
        cancelledTag.textContent = 'Cancelada';
        scheduleRow.appendChild(cancelledTag);
      }
      item.appendChild(scheduleRow);

      const participants = getReservationParticipants(reservation);
      if (participants.length) {
        const participantsRow = document.createElement('div');
        participantsRow.className = 'meta';
        participantsRow.appendChild(document.createElement('span')).textContent = 'Jugadores:';
        participants.forEach((participant) => {
          participantsRow.appendChild(document.createElement('span')).textContent = getPlayerDisplayName(participant);
        });
        item.appendChild(participantsRow);
      }

      if (reservation.notes && getReservationContext(reservation) === 'private') {
        const notesRow = document.createElement('p');
        notesRow.className = 'reservation-notes';
        notesRow.textContent = reservation.notes;
        item.appendChild(notesRow);
      }

      const hasOfficialMatch = Boolean(getReservationMatch(reservation));
      const canCancel = reservation.status === 'reservada' && !hasOfficialMatch;
      if (canCancel && reservationId) {
        const actions = document.createElement('div');
        actions.className = 'reservation-actions';
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'secondary';
        cancelButton.dataset.action = 'cancel-reservation';
        cancelButton.dataset.reservationId = reservationId;
        cancelButton.textContent = 'Cancelar';
        actions.appendChild(cancelButton);
        item.appendChild(actions);
      }

      courtReservationList.appendChild(item);
    });
  }

  function populateCourtReservationCourts() {
    if (!courtReservationCourtSelect) {
      return;
    }

    const currentValue = courtReservationCourtSelect.value;
    const courtNames = getClubCourtNames();
    courtReservationCourtSelect.innerHTML = '';

    if (!courtNames.length) {
      const option = new Option('Añade pistas en la sección del club para habilitar las reservas', '');
      option.disabled = true;
      option.selected = true;
      courtReservationCourtSelect.appendChild(option);
      courtReservationCourtSelect.disabled = true;
      if (courtReservationSubmit) {
        courtReservationSubmit.disabled = true;
      }
      return;
    }

    courtReservationCourtSelect.disabled = false;
    if (courtReservationSubmit) {
      courtReservationSubmit.disabled = false;
    }

    let resolvedValue = currentValue && courtNames.includes(currentValue) ? currentValue : courtNames[0];
    courtNames.forEach((name) => {
      const option = new Option(name, name, false, name === resolvedValue);
      courtReservationCourtSelect.appendChild(option);
    });
    courtReservationCourtSelect.value = resolvedValue;
  }

  function populateCourtReservationTimeOptions(reference, selectedValue, options = {}) {
    if (!courtReservationTimeInput) {
      return [];
    }

    let baseDate;
    if (reference instanceof Date) {
      baseDate = new Date(reference);
    } else if (typeof reference === 'string' && reference) {
      baseDate = new Date(`${reference}T00:00:00`);
    } else if (courtReservationDateInput?.value) {
      baseDate = new Date(`${courtReservationDateInput.value}T00:00:00`);
    } else {
      baseDate = new Date();
    }

    if (Number.isNaN(baseDate.getTime())) {
      baseDate = new Date();
    }

    const slots = getReservationSlotStartsForDate(baseDate);
    const resolvedSelected = selectedValue || courtReservationTimeInput.value || '';
    const fragment = document.createDocumentFragment();
    let matchedSelected = false;

    slots.forEach((slot) => {
      const value = formatTimeInputValue(slot);
      const option = new Option(formatReservationSlotLabel(slot), value, false, value === resolvedSelected);
      if (value === resolvedSelected) {
        matchedSelected = true;
      }
      fragment.appendChild(option);
    });

    courtReservationTimeInput.innerHTML = '';

    if (!slots.length) {
      const emptyOption = new Option('Sin horarios disponibles', '', true, true);
      emptyOption.disabled = true;
      fragment.appendChild(emptyOption);
      courtReservationTimeInput.appendChild(fragment);
      courtReservationTimeInput.disabled = true;
      return slots;
    }

    courtReservationTimeInput.disabled = false;
    courtReservationTimeInput.appendChild(fragment);

    if (!matchedSelected && resolvedSelected) {
      const fallbackDate = combineDateAndTime(formatDateInput(baseDate), resolvedSelected);
      if (fallbackDate && !Number.isNaN(fallbackDate.getTime())) {
        const fallbackEnd =
          options.endsAt instanceof Date && !Number.isNaN(options.endsAt.getTime())
            ? options.endsAt
            : getReservationSlotEnd(fallbackDate);
        const fallbackOption = new Option(
          formatTimeRangeLabel(fallbackDate, fallbackEnd),
          resolvedSelected,
          true,
          true
        );
        courtReservationTimeInput.appendChild(fallbackOption);
        matchedSelected = true;
      }
    }

    if (!matchedSelected) {
      courtReservationTimeInput.value = formatTimeInputValue(slots[0]);
    }

    return slots;
  }

  function resetCourtReservationForm() {
    if (!courtReservationForm) {
      return;
    }

    const baseDate = roundDateUpToInterval(new Date(), COURT_RESERVATION_DEFAULT_DURATION);
    const dateValue = formatDateInput(baseDate);
    if (courtReservationDateInput) {
      courtReservationDateInput.value = dateValue;
    }
    populateCourtReservationTimeOptions(baseDate, formatTimeInputValue(baseDate));
    if (courtReservationDurationSelect) {
      courtReservationDurationSelect.value = String(COURT_RESERVATION_DEFAULT_DURATION);
    }
    if (courtReservationNotesInput) {
      courtReservationNotesInput.value = '';
    }
    populateCourtReservationCourts();
    setStatusMessage(courtReservationStatus, '', '');
  }

  async function openReservationEditorFromCalendar(eventData = {}) {
    if (!state.token) {
      showGlobalMessage('Debes iniciar sesión para reservar una pista.', 'error');
      return;
    }

    let defaultStart = eventData.startsAt ? new Date(eventData.startsAt) : null;
    if (!defaultStart || Number.isNaN(defaultStart.getTime())) {
      defaultStart = roundDateUpToInterval(new Date(), COURT_RESERVATION_DEFAULT_DURATION);
    }
    const defaultTimeValue = formatTimeInputValue(defaultStart);
    const defaultDateValue = formatDateInput(defaultStart);
    const defaultCourt = typeof eventData.court === 'string' ? eventData.court : '';

    try {
      await ensureReservationPlayersLoaded();
    } catch (error) {
      showGlobalMessage(error.message, 'error');
      return;
    }

    const selectablePlayers = getSelectableReservationPlayers();
    const courtNames = getClubCourtNames();
    const defaultGameType = eventData.gameType === 'dobles' ? 'dobles' : 'individual';

    const form = document.createElement('form');
    form.className = 'form reservation-modal-form';

    const scheduleGrid = document.createElement('div');
    scheduleGrid.className = 'form-grid';

    const dateField = document.createElement('label');
    dateField.className = 'inline-field';
    dateField.appendChild(document.createTextNode('Fecha'));
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.required = true;
    if (defaultDateValue) {
      dateInput.value = defaultDateValue;
    }
    dateField.appendChild(dateInput);
    scheduleGrid.appendChild(dateField);

    const timeField = document.createElement('label');
    timeField.className = 'inline-field';
    timeField.appendChild(document.createTextNode('Hora'));
    const timeSelect = document.createElement('select');
    timeSelect.required = true;
    timeField.appendChild(timeSelect);
    scheduleGrid.appendChild(timeField);

    const courtField = document.createElement('label');
    courtField.className = 'inline-field';
    courtField.appendChild(document.createTextNode('Pista'));
    const courtSelect = document.createElement('select');
    courtSelect.required = true;
    courtField.appendChild(courtSelect);
    scheduleGrid.appendChild(courtField);

    form.appendChild(scheduleGrid);

    const gameTypeFieldset = document.createElement('fieldset');
    gameTypeFieldset.className = 'inline-field';
    const gameTypeLegend = document.createElement('legend');
    gameTypeLegend.textContent = 'Formato';
    gameTypeFieldset.appendChild(gameTypeLegend);
    const gameTypeOptions = document.createElement('div');
    gameTypeOptions.className = 'reservation-game-type-options';
    gameTypeFieldset.appendChild(gameTypeOptions);

    const participantsFieldset = document.createElement('fieldset');
    const participantsLegend = document.createElement('legend');
    participantsLegend.textContent = 'Jugadores invitados';
    participantsFieldset.appendChild(participantsLegend);
    const participantsContainer = document.createElement('div');
    participantsContainer.className = 'reservation-participants-grid';
    participantsFieldset.appendChild(participantsContainer);

    const participantsHint = document.createElement('p');
    participantsHint.className = 'reservation-form-hint';
    participantsFieldset.appendChild(participantsHint);

    form.appendChild(gameTypeFieldset);
    form.appendChild(participantsFieldset);

    const notesField = document.createElement('label');
    notesField.className = 'inline-field';
    notesField.appendChild(document.createTextNode('Notas (opcional)'));
    const notesInput = document.createElement('textarea');
    notesInput.rows = 2;
    notesInput.maxLength = 500;
    notesInput.placeholder = 'Añade información relevante para el rival o el club';
    notesField.appendChild(notesInput);
    form.appendChild(notesField);

    const status = document.createElement('p');
    status.className = 'status-message';
    form.appendChild(status);

    const actions = document.createElement('div');
    actions.className = 'form-actions';
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'secondary';
    cancelButton.textContent = 'Cancelar';
    actions.appendChild(cancelButton);
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'primary';
    submitButton.textContent = 'Guardar reserva';
    actions.appendChild(submitButton);
    form.appendChild(actions);

    const gameTypeOptionsData = [
      { value: 'individual', label: 'Partido individual' },
      { value: 'dobles', label: 'Partido de dobles' },
    ];

    gameTypeOptionsData.forEach((option) => {
      const wrapper = document.createElement('label');
      wrapper.className = 'reservation-game-type-option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'reservation-game-type';
      input.value = option.value;
      input.checked = option.value === defaultGameType;
      wrapper.appendChild(input);
      const text = document.createElement('span');
      text.textContent = option.label;
      wrapper.appendChild(text);
      gameTypeOptions.appendChild(wrapper);
    });

    const gameTypeInputs = Array.from(gameTypeOptions.querySelectorAll('input[name="reservation-game-type"]'));

    const populateTimeOptions = (baseDate, selectedValue) => {
      timeSelect.innerHTML = '';
      const slots = getReservationSlotStartsForDate(baseDate);
      if (!slots.length) {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Sin horarios disponibles';
        placeholder.disabled = true;
        placeholder.selected = true;
        timeSelect.appendChild(placeholder);
        timeSelect.disabled = true;
        return;
      }

      timeSelect.disabled = false;
      const fragment = document.createDocumentFragment();
      slots.forEach((slot) => {
        const option = document.createElement('option');
        option.value = formatTimeInputValue(slot);
        option.textContent = formatReservationSlotLabel(slot);
        if (selectedValue && option.value === selectedValue) {
          option.selected = true;
        }
        fragment.appendChild(option);
      });
      timeSelect.appendChild(fragment);
      if (!timeSelect.value && timeSelect.options.length) {
        timeSelect.selectedIndex = 0;
      }
    };

    const populateCourtOptions = () => {
      courtSelect.innerHTML = '';
      if (!courtNames.length) {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'No hay pistas disponibles';
        placeholder.disabled = true;
        placeholder.selected = true;
        courtSelect.appendChild(placeholder);
        courtSelect.disabled = true;
        return;
      }

      courtSelect.disabled = false;
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Selecciona una pista';
      placeholder.disabled = true;
      placeholder.selected = true;
      courtSelect.appendChild(placeholder);

      courtNames.forEach((courtName) => {
        const option = document.createElement('option');
        option.value = courtName;
        option.textContent = formatCourtDisplay(courtName) || courtName;
        courtSelect.appendChild(option);
      });

      if (defaultCourt) {
        const exists = courtNames.some((name) => name === defaultCourt);
        if (exists) {
          courtSelect.value = defaultCourt;
        }
      }
    };

    const getSelectedGameType = () => {
      const checked = form.querySelector('input[name="reservation-game-type"]:checked');
      return checked?.value === 'dobles' ? 'dobles' : 'individual';
    };

    const getRequiredParticipantCount = () => (getSelectedGameType() === 'dobles' ? 3 : 1);

    let isSubmittingReservation = false;

    const updateSubmitState = () => {
      if (isSubmittingReservation) {
        return;
      }

      const requiredParticipants = getRequiredParticipantCount();
      const hasEnoughPlayers = selectablePlayers.length >= requiredParticipants;
      const hasCourts = courtNames.length > 0;

      submitButton.disabled = !hasCourts || !hasEnoughPlayers;

      if (!hasCourts) {
        setStatusMessage(status, 'error', 'No hay pistas configuradas para realizar reservas.');
      } else if (!hasEnoughPlayers) {
        setStatusMessage(
          status,
          'error',
          requiredParticipants === 3
            ? 'No hay suficientes jugadores disponibles para crear una reserva de dobles.'
            : 'Todavía no hay otro jugador disponible para completar la reserva.'
        );
      } else {
        setStatusMessage(status, '', '');
      }
    };

    const renderParticipantInputs = () => {
      const requiredParticipants = getRequiredParticipantCount();
      participantsContainer.innerHTML = '';
      participantsContainer.classList.toggle('reservation-participants-grid--doubles', requiredParticipants > 1);

      if (!selectablePlayers.length) {
        participantsHint.textContent = 'Todavía no hay otros jugadores disponibles para añadir a la reserva.';
        updateSubmitState();
        return;
      }

      if (requiredParticipants === 3 && selectablePlayers.length < 3) {
        participantsHint.textContent =
          'Necesitas tres jugadores adicionales para una reserva de dobles. Añade más jugadores al club o elige un formato individual.';
      } else if (requiredParticipants === 1) {
        participantsHint.textContent = 'Añade al segundo jugador para completar la reserva individual.';
      } else {
        participantsHint.textContent = 'Añade a los otros tres jugadores para completar la reserva de dobles.';
      }

      for (let index = 0; index < requiredParticipants; index += 1) {
        const field = document.createElement('label');
        field.className = 'reservation-participant-field';
        field.appendChild(document.createTextNode(`Jugador ${index + 2}`));
        const select = document.createElement('select');
        select.required = true;
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Selecciona un jugador';
        select.appendChild(placeholder);

        selectablePlayers.forEach((player) => {
          const playerId = normalizeId(player);
          if (!playerId) {
            return;
          }
          const option = new Option(formatReservationPlayerOptionLabel(player), playerId);
          select.appendChild(option);
        });

        field.appendChild(select);
        participantsContainer.appendChild(field);
      }

      updateSubmitState();
    };

    populateTimeOptions(defaultStart, defaultTimeValue);
    populateCourtOptions();
    renderParticipantInputs();

    dateInput.addEventListener('change', () => {
      const value = dateInput.value;
      const nextDate = value ? new Date(`${value}T00:00:00`) : null;
      const baseDate = nextDate && !Number.isNaN(nextDate.getTime()) ? nextDate : new Date();
      populateTimeOptions(baseDate, timeSelect.value);
    });

    gameTypeInputs.forEach((input) => {
      input.addEventListener('change', () => {
        renderParticipantInputs();
      });
    });

    cancelButton.addEventListener('click', () => {
      closeModal();
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (submitButton.disabled) {
        return;
      }

      const dateValue = dateInput.value;
      const timeValue = timeSelect.value;
      const startsAt = combineDateAndTime(dateValue, timeValue);

      if (!startsAt) {
        setStatusMessage(status, 'error', 'Selecciona una fecha y hora válidas.');
        return;
      }

      if (!isValidReservationSlotStart(startsAt)) {
        setStatusMessage(
          status,
          'error',
          'Selecciona un horario válido de 75 minutos entre las 08:30 y las 22:15.'
        );
        return;
      }

      const courtValue = courtSelect.value;
      if (!courtValue) {
        setStatusMessage(status, 'error', 'Selecciona una pista disponible.');
        return;
      }

      const participantSelects = Array.from(participantsContainer.querySelectorAll('select'));
      const participantIds = participantSelects.map((select) => select.value).filter(Boolean);
      if (participantIds.length !== participantSelects.length) {
        setStatusMessage(status, 'error', 'Selecciona todos los jugadores requeridos para la reserva.');
        return;
      }

      const uniqueParticipants = new Set(participantIds);
      if (uniqueParticipants.size !== participantIds.length) {
        setStatusMessage(status, 'error', 'Cada jugador solo puede aparecer una vez en la reserva.');
        return;
      }

      const gameType = getSelectedGameType();
      const requiredParticipants = getRequiredParticipantCount();
      if (participantIds.length < requiredParticipants) {
        setStatusMessage(status, 'error', 'Añade a todos los jugadores necesarios para la reserva.');
        return;
      }

      const payload = {
        court: courtValue,
        startsAt: startsAt.toISOString(),
        durationMinutes: COURT_RESERVATION_DEFAULT_DURATION,
        gameType,
        participants: participantIds,
      };

      const notes = notesInput.value?.trim();
      if (notes) {
        payload.notes = notes;
      }

      isSubmittingReservation = true;
      submitButton.disabled = true;
      setStatusMessage(status, 'info', 'Creando reserva...');

      try {
        await request('/courts/reservations', { method: 'POST', body: payload });
        await loadPlayerCourtData();
        if (hasCourtManagementAccess()) {
          await Promise.all([loadAdminCourtData(), loadCourtCalendarData()]);
        }
        closeModal();
        showGlobalMessage('Reserva creada correctamente.', 'success');
      } catch (error) {
        setStatusMessage(status, 'error', error.message);
      } finally {
        isSubmittingReservation = false;
        submitButton.disabled = false;
        updateSubmitState();
      }
    });

    openModal({
      title: 'Reservar pista',
      content: (body) => {
        body.appendChild(form);
      },
      onClose: () => {
        isSubmittingReservation = false;
        setStatusMessage(status, '', '');
      },
    });

    updateSubmitState();
  }

  async function cancelCourtReservation(reservationId, { button } = {}) {
    if (!reservationId) {
      return false;
    }

    const confirmed = window.confirm('¿Seguro que deseas cancelar la reserva?');
    if (!confirmed) {
      return false;
    }

    if (button) {
      button.disabled = true;
    }

    try {
      await request(`/courts/reservations/${reservationId}`, { method: 'DELETE' });
      showGlobalMessage('Reserva cancelada correctamente.', 'success');
      await loadPlayerCourtData();
      if (hasCourtManagementAccess()) {
        await Promise.all([loadAdminCourtData(), loadCourtCalendarData()]);
      }
      return true;
    } catch (error) {
      showGlobalMessage(error.message, 'error');
      return false;
    } finally {
      if (button) {
        button.disabled = false;
      }
    }
  }

  async function loadPlayerCourtData() {
    if (!state.token) {
      return;
    }

    try {
      const reservations = await request('/courts/reservations');
      state.courtReservations = Array.isArray(reservations) ? reservations : [];
      renderCourtReservations();
    } catch (error) {
      state.courtReservations = [];
      renderCourtReservations();
      showGlobalMessage(error.message, 'error');
    }

    await refreshCourtAvailability('player');
  }

  function registerCourtDataReloaders({
    refreshAvailability,
    loadAdminData,
    loadCalendarData,
  } = {}) {
    if (typeof refreshAvailability === 'function') {
      refreshCourtAvailability = refreshAvailability;
    }
    if (typeof loadAdminData === 'function') {
      loadAdminCourtData = loadAdminData;
    }
    if (typeof loadCalendarData === 'function') {
      loadCourtCalendarData = loadCalendarData;
    }
  }

  return {
    getReservationSlotStartsForDate,
    getReservationSlotEnd,
    formatReservationSlotLabel,
    isValidReservationSlotStart,
    getReservationMatch,
    getReservationContext,
    getReservationContextLabel,
    getReservationParticipants,
    formatReservationParticipantsLabel,
    formatMatchPlayersLabel,
    formatReservationPlayerOptionLabel,
    getSelectableReservationPlayers,
    ensureReservationPlayersLoaded,
    renderCourtReservations,
    populateCourtReservationCourts,
    populateCourtReservationTimeOptions,
    resetCourtReservationForm,
    openReservationEditorFromCalendar,
    cancelCourtReservation,
    loadPlayerCourtData,
    registerCourtDataReloaders,
  };
}
