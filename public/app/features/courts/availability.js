export function createCourtAvailabilityModule({
  state,
  request,
  showGlobalMessage,
  setStatusMessage,
  hasCourtManagementAccess,
  formatDateInput,
  formatTimeRangeLabel,
  formatDateTimeLocal,
  roundDateUpToInterval,
  addMinutes,
  getClubCourtNames,
  courtAvailabilityDateInput,
  courtAvailabilityList,
  courtAvailabilityEmpty,
  courtAdminDateInput,
  courtAdminSchedule,
  courtAdminEmpty,
  courtAdminStatus,
  courtBlockForm,
  courtBlockContextSelect,
  courtBlockEntitySelect,
  courtBlockCourtsSelect,
  courtBlockStartInput,
  courtBlockEndInput,
  courtBlockSubmit,
  courtBlockStatus,
  courtBlocksList,
  courtBlocksEmpty,
  playerCourtCalendarStatus,
  COURT_RESERVATION_DEFAULT_DURATION,
  CALENDAR_TIME_SLOT_MINUTES,
  getReservationParticipants,
  getReservationContext,
  getReservationContextLabel,
  getPlayerDisplayName,
} = {}) {
  if (!state || typeof request !== 'function') {
    throw new Error('Missing required court availability dependencies.');
  }

  if (typeof formatDateInput !== 'function' || typeof formatTimeRangeLabel !== 'function') {
    throw new Error('Missing formatting helpers for court availability.');
  }

  if (typeof formatDateTimeLocal !== 'function' || typeof roundDateUpToInterval !== 'function') {
    throw new Error('Missing date helpers for court availability.');
  }

  if (typeof getReservationParticipants !== 'function' || typeof getPlayerDisplayName !== 'function') {
    throw new Error('Missing participant helpers for court availability.');
  }

  let renderPlayerCourtCalendar = () => {};
  let loadCourtCalendarData = async () => {};

  function populateCourtBlockCourts() {
    if (!courtBlockCourtsSelect) {
      return;
    }

    const previousSelection = new Set(
      Array.from(courtBlockCourtsSelect.selectedOptions || []).map((option) => option.value)
    );
    const courtNames = getClubCourtNames();
    courtBlockCourtsSelect.innerHTML = '';

    if (!courtNames.length) {
      const option = new Option(
        'Añade pistas en la sección del club para poder bloquearlas',
        '',
        true,
        true
      );
      option.disabled = true;
      courtBlockCourtsSelect.appendChild(option);
      courtBlockCourtsSelect.disabled = true;
      return;
    }

    courtBlockCourtsSelect.disabled = false;
    courtNames.forEach((name) => {
      const option = new Option(name, name, false, previousSelection.has(name));
      courtBlockCourtsSelect.appendChild(option);
    });
  }

  function populateCourtBlockEntities() {
    if (!courtBlockEntitySelect) {
      return;
    }

    const contextType = courtBlockContextSelect?.value || 'league';

    if (contextType === 'lesson') {
      courtBlockEntitySelect.innerHTML = '';
      const clubId = state.club?._id || state.club?.id || '';
      if (!clubId) {
        const option = new Option(
          'Configura el perfil del club para habilitar los bloqueos de clases.',
          '',
          true,
          true
        );
        option.disabled = true;
        courtBlockEntitySelect.appendChild(option);
        courtBlockEntitySelect.disabled = true;
        if (courtBlockSubmit) {
          courtBlockSubmit.disabled = true;
        }
        return;
      }

      const label = state.club?.name ? `Clases de tenis · ${state.club.name}` : 'Clases de tenis';
      const option = new Option(label, clubId, true, true);
      courtBlockEntitySelect.appendChild(option);
      courtBlockEntitySelect.disabled = false;
      courtBlockEntitySelect.value = clubId;
      if (courtBlockSubmit) {
        courtBlockSubmit.disabled = false;
      }
      return;
    }

    const entities =
      contextType === 'league'
        ? Array.isArray(state.leagues)
          ? state.leagues
          : []
        : Array.isArray(state.tournaments)
          ? state.tournaments
          : [];

    const previousValue = courtBlockEntitySelect.value;
    courtBlockEntitySelect.innerHTML = '';

    if (!entities.length) {
      const message =
        contextType === 'league'
          ? 'No hay ligas activas para asignar bloqueos.'
          : 'No hay torneos activos para asignar bloqueos.';
      const option = new Option(message, '', true, true);
      option.disabled = true;
      courtBlockEntitySelect.appendChild(option);
      courtBlockEntitySelect.disabled = true;
      if (courtBlockSubmit) {
        courtBlockSubmit.disabled = true;
      }
      return;
    }

    courtBlockEntitySelect.disabled = false;
    if (courtBlockSubmit) {
      courtBlockSubmit.disabled = false;
    }

    const options = entities.map((entity) => {
      const id = entity?._id || entity?.id;
      const labelParts = [];
      if (entity?.name) {
        labelParts.push(entity.name);
      }
      if (entity?.year) {
        labelParts.push(entity.year);
      }
      const label = labelParts.length ? labelParts.join(' · ') : 'Competición';
      return { id, label };
    });

    let resolvedValue = previousValue;
    if (!options.some((option) => option.id === resolvedValue)) {
      resolvedValue = options[0]?.id || '';
    }

    options.forEach((option) => {
      if (!option.id) {
        return;
      }
      const element = new Option(option.label, option.id, false, option.id === resolvedValue);
      courtBlockEntitySelect.appendChild(element);
    });

    courtBlockEntitySelect.value = resolvedValue;
  }

  function setCourtBlockDefaultRange(baseDate = new Date()) {
    if (!courtBlockStartInput || !courtBlockEndInput) {
      return;
    }

    const reference = new Date(baseDate);
    if (Number.isNaN(reference.getTime())) {
      return;
    }

    if (reference.getHours() === 0 && reference.getMinutes() === 0) {
      reference.setHours(8, 30, 0, 0);
    }

    const start = roundDateUpToInterval(reference, CALENDAR_TIME_SLOT_MINUTES);
    const end = addMinutes(start, COURT_RESERVATION_DEFAULT_DURATION);
    courtBlockStartInput.value = formatDateTimeLocal(start);
    courtBlockEndInput.value = formatDateTimeLocal(end);
  }

  function ensureCourtBlockRangeDefaults(baseDate = new Date()) {
    if (!courtBlockStartInput || !courtBlockEndInput) {
      return;
    }

    if (!courtBlockStartInput.value || !courtBlockEndInput.value) {
      setCourtBlockDefaultRange(baseDate);
    }
  }

  function renderCourtAvailability() {
    if (courtAvailabilityDateInput) {
      courtAvailabilityDateInput.value = formatDateInput(state.courtAvailabilityDate);
    }
    if (!courtAvailabilityList) {
      return;
    }

    const availability = Array.isArray(state.courtAvailability) ? state.courtAvailability : [];
    courtAvailabilityList.innerHTML = '';

    if (!availability.length) {
      if (courtAvailabilityEmpty) {
        courtAvailabilityEmpty.hidden = false;
      }
      return;
    }

    if (courtAvailabilityEmpty) {
      courtAvailabilityEmpty.hidden = true;
    }

    availability.forEach((entry) => {
      const item = document.createElement('li');
      item.className = 'court-availability-item';
      const title = document.createElement('strong');
      title.textContent = entry.court || 'Pista por definir';
      item.appendChild(title);

      const reservations = Array.isArray(entry.reservations) ? entry.reservations : [];
      const blocks = Array.isArray(entry.blocks) ? entry.blocks : [];

      if (!reservations.length && !blocks.length) {
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = 'Disponible todo el día';
        item.appendChild(meta);
      } else {
        blocks.forEach((block) => {
          const blockRow = document.createElement('div');
          blockRow.className = 'meta court-availability-block';
          const timeLabel = formatTimeRangeLabel(block.startsAt, block.endsAt);
          blockRow.appendChild(document.createElement('span')).textContent = `${timeLabel}`;
          const labelParts = [];
          if (block.contextName) {
            labelParts.push(block.contextName);
          }
          if (block.appliesToAllCourts) {
            labelParts.push('Todas las pistas');
          }
          labelParts.push('Bloqueo oficial');
          blockRow.appendChild(document.createElement('span')).textContent = labelParts.join(' · ');
          if (block.notes) {
            blockRow.appendChild(document.createElement('span')).textContent = block.notes;
          }
          item.appendChild(blockRow);
        });

        reservations.forEach((reservation) => {
          const slot = document.createElement('div');
          slot.className = 'meta court-availability-slot';
          slot.appendChild(document.createElement('span')).textContent = formatTimeRangeLabel(
            reservation.startsAt,
            reservation.endsAt
          );
          const participants = getReservationParticipants(reservation);
          if (participants.length) {
            slot.appendChild(document.createElement('span')).textContent = participants
              .map((participant) => getPlayerDisplayName(participant))
              .join(' · ');
          }
          const contextLabel = getReservationContextLabel(reservation);
          if (contextLabel) {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = contextLabel;
            slot.appendChild(tag);
          }
          if (reservation.status === 'pre_reservada') {
            slot.classList.add('court-availability-slot--pending');
            const pendingTag = document.createElement('span');
            pendingTag.className = 'tag';
            pendingTag.textContent = 'Pre-reserva';
            slot.appendChild(pendingTag);
          }
          if (reservation.createdBy && getReservationContext(reservation) === 'private') {
            slot.appendChild(document.createElement('span')).textContent = `Reserva de ${getPlayerDisplayName(
              reservation.createdBy
            )}`;
          }
          item.appendChild(slot);
        });
      }

      courtAvailabilityList.appendChild(item);
    });
  }

  function renderCourtAdminSchedule() {
    if (courtAdminDateInput) {
      courtAdminDateInput.value = formatDateInput(state.courtAdminDate);
    }
    if (!courtAdminSchedule) {
      return;
    }

    courtAdminSchedule.innerHTML = '';
    const availability = Array.isArray(state.courtAdminSchedule) ? state.courtAdminSchedule : [];

    if (!availability.length) {
      if (courtAdminEmpty) {
        courtAdminEmpty.hidden = false;
      }
      return;
    }

    if (courtAdminEmpty) {
      courtAdminEmpty.hidden = true;
    }

    availability.forEach((entry) => {
      const block = document.createElement('div');
      block.className = 'court-schedule';
      const heading = document.createElement('h4');
      heading.textContent = entry.court || 'Pista';
      block.appendChild(heading);

      const reservations = Array.isArray(entry.reservations) ? entry.reservations : [];
      const blocks = Array.isArray(entry.blocks) ? entry.blocks : [];
      const timeline = [];

      reservations.forEach((reservation) => {
        timeline.push({
          type: 'reservation',
          startsAt: reservation.startsAt,
          endsAt: reservation.endsAt,
          reservation,
        });
      });

      blocks.forEach((blockEntry) => {
        timeline.push({
          type: 'block',
          startsAt: blockEntry.startsAt,
          endsAt: blockEntry.endsAt,
          block: blockEntry,
        });
      });

      timeline.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

      if (!timeline.length) {
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = 'Sin reservas registradas para este día.';
        block.appendChild(meta);
      } else {
        timeline.forEach((timelineEntry) => {
          if (timelineEntry.type === 'block') {
            const { block: blockEntry } = timelineEntry;
            if (!blockEntry) {
              return;
            }

            const row = document.createElement('div');
            row.className = 'court-schedule-row court-schedule-row--block';

            const info = document.createElement('div');
            info.className = 'court-schedule-info';
            info.appendChild(document.createElement('span')).textContent = formatTimeRangeLabel(
              blockEntry.startsAt,
              blockEntry.endsAt
            );

            const details = [];
            if (blockEntry.contextName) {
              details.push(blockEntry.contextName);
            }
            if (blockEntry.appliesToAllCourts) {
              details.push('Todas las pistas');
            } else if (Array.isArray(blockEntry.courts) && blockEntry.courts.length) {
              details.push(`Pistas: ${blockEntry.courts.join(', ')}`);
            }
            details.push('Bloqueo oficial');
            info.appendChild(document.createElement('span')).textContent = details.join(' · ');

            if (blockEntry.notes) {
              info.appendChild(document.createElement('span')).textContent = blockEntry.notes;
            }

            row.appendChild(info);

            if (hasCourtManagementAccess() && blockEntry.id) {
              const actions = document.createElement('div');
              actions.className = 'court-schedule-actions';
              const deleteButton = document.createElement('button');
              deleteButton.type = 'button';
              deleteButton.className = 'ghost danger';
              deleteButton.dataset.action = 'delete-block';
              deleteButton.dataset.blockId = blockEntry.id;
              deleteButton.textContent = 'Eliminar bloqueo';
              actions.appendChild(deleteButton);
              row.appendChild(actions);
            }

            block.appendChild(row);
            return;
          }

          const reservation = timelineEntry.reservation;
          const row = document.createElement('div');
          row.className = 'court-schedule-row';

          const info = document.createElement('div');
          info.className = 'court-schedule-info';
          info.appendChild(document.createElement('span')).textContent = formatTimeRangeLabel(
            reservation.startsAt,
            reservation.endsAt
          );
          const participants = getReservationParticipants(reservation);
          if (participants.length) {
            info.appendChild(document.createElement('span')).textContent = participants
              .map((participant) => getPlayerDisplayName(participant))
              .join(' · ');
          }
          const context = getReservationContext(reservation);
          info.appendChild(document.createElement('span')).textContent = getReservationContextLabel(reservation);
          if (context === 'private' && reservation.createdBy) {
            info.appendChild(document.createElement('span')).textContent = `Reserva de ${getPlayerDisplayName(
              reservation.createdBy
            )}`;
          }
          if (reservation.status === 'pre_reservada') {
            info.appendChild(document.createElement('span')).textContent = 'Pre-reserva pendiente de confirmación';
          }
          if (reservation.notes && context === 'private') {
            info.appendChild(document.createElement('span')).textContent = reservation.notes;
          }
          row.appendChild(info);

          const actions = document.createElement('div');
          actions.className = 'court-schedule-actions';
          const reservationId = reservation._id || reservation.id;
          if (reservationId && reservation.status === 'reservada' && context === 'private') {
            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.className = 'ghost';
            cancelButton.dataset.action = 'cancel-reservation';
            cancelButton.dataset.reservationId = reservationId;
            cancelButton.textContent = 'Cancelar';
            actions.appendChild(cancelButton);
          }
          if (actions.childElementCount) {
            row.appendChild(actions);
          }

          block.appendChild(row);
        });
      }

      courtAdminSchedule.appendChild(block);
    });
  }

  async function deleteCourtBlock(blockId, { button } = {}) {
    if (!blockId) {
      return false;
    }

    const confirmed = window.confirm('¿Seguro que deseas eliminar este bloqueo de pistas?');
    if (!confirmed) {
      return false;
    }

    if (button) {
      button.disabled = true;
    }

    try {
      await request(`/courts/blocks/${blockId}`, { method: 'DELETE' });
      showGlobalMessage('Bloqueo eliminado correctamente.', 'success');
      await Promise.all([loadAdminCourtData(), loadCourtCalendarData()]);
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

  async function refreshCourtAvailability(
    scope = 'player',
    { court: courtValue = '', ignoreManualLimit = false } = {}
  ) {
    const normalizedCourt = typeof courtValue === 'string' ? courtValue.trim() : '';
    const targetDate = scope === 'admin' ? state.courtAdminDate : state.courtAvailabilityDate;
    const formatted = formatDateInput(targetDate) || formatDateInput(new Date());
    if (!formatted) {
      return;
    }

    const normalizedIgnoreManualLimit = Boolean(ignoreManualLimit);

    if (scope === 'admin' && courtAdminStatus) {
      setStatusMessage(courtAdminStatus, 'info', 'Cargando reservas...');
    } else if (scope === 'player' && playerCourtCalendarStatus) {
      setStatusMessage(playerCourtCalendarStatus, 'info', 'Cargando disponibilidad de pistas...');
    }

    try {
      const params = new URLSearchParams({ date: formatted });
      if (normalizedCourt) {
        params.append('court', normalizedCourt);
      }
      if (normalizedIgnoreManualLimit) {
        params.append('ignoreManualLimit', 'true');
      }
      const availability = await request(`/courts/availability?${params.toString()}`);
      const courts = Array.isArray(availability?.courts) ? availability.courts : [];
      if (scope === 'admin') {
        state.courtAdminCourt = normalizedCourt;
        state.courtAdminSchedule = courts;
        state.courtAdminBlocks = Array.isArray(availability?.blocks) ? availability.blocks : [];
        state.courtAdminIgnoreManualLimit = normalizedIgnoreManualLimit;
        renderCourtAdminSchedule();
        if (courtAdminStatus) {
          setStatusMessage(courtAdminStatus, '', '');
        }
      } else {
        state.courtAvailabilityCourt = normalizedCourt;
        state.courtAvailability = courts;
        state.courtAvailabilityIgnoreManualLimit = normalizedIgnoreManualLimit;
        renderCourtAvailability();
        renderPlayerCourtCalendar();
        if (playerCourtCalendarStatus) {
          setStatusMessage(playerCourtCalendarStatus, '', '');
        }
      }
    } catch (error) {
      if (scope === 'admin') {
        state.courtAdminCourt = normalizedCourt;
        state.courtAdminSchedule = [];
        state.courtAdminBlocks = [];
        state.courtAdminIgnoreManualLimit = normalizedIgnoreManualLimit;
        renderCourtAdminSchedule();
        if (courtAdminStatus) {
          setStatusMessage(courtAdminStatus, 'error', error.message);
        }
      } else {
        state.courtAvailabilityCourt = normalizedCourt;
        state.courtAvailability = [];
        state.courtAvailabilityIgnoreManualLimit = normalizedIgnoreManualLimit;
        renderCourtAvailability();
        renderPlayerCourtCalendar();
        if (playerCourtCalendarStatus) {
          setStatusMessage(playerCourtCalendarStatus, 'error', error.message);
        } else {
          showGlobalMessage(error.message, 'error');
        }
      }
    }
  }

  async function loadAdminCourtData() {
    if (!hasCourtManagementAccess()) {
      state.courtAdminSchedule = [];
      state.courtAdminBlocks = [];
      renderCourtAdminSchedule();
      return;
    }

    await refreshCourtAvailability('admin');
  }

  function registerCalendarHooks({
    renderPlayerCourtCalendar: renderCalendar,
    loadCourtCalendarData: loadCalendar,
  } = {}) {
    if (typeof renderCalendar === 'function') {
      renderPlayerCourtCalendar = renderCalendar;
    }
    if (typeof loadCalendar === 'function') {
      loadCourtCalendarData = loadCalendar;
    }
  }

  return {
    populateCourtBlockCourts,
    populateCourtBlockEntities,
    setCourtBlockDefaultRange,
    ensureCourtBlockRangeDefaults,
    renderCourtAvailability,
    renderCourtAdminSchedule,
    deleteCourtBlock,
    refreshCourtAvailability,
    loadAdminCourtData,
    registerCalendarHooks,
  };
}
