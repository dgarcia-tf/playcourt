export function createMatchProposalsModule(deps = {}) {
  const {
    request,
    showGlobalMessage,
    loadAllData,
    createMatchScheduleSlotPicker,
    getClubMatchScheduleTemplates,
    roundDateUpToInterval,
    formatDateInput,
    formatTimeInputValue,
    isValidReservationSlotStart,
    CALENDAR_TIME_SLOT_MINUTES,
  } = deps;

  if (typeof request !== 'function') {
    throw new Error('Missing request dependency for match proposals module.');
  }
  if (typeof showGlobalMessage !== 'function') {
    throw new Error('Missing showGlobalMessage dependency for match proposals module.');
  }
  if (typeof loadAllData !== 'function') {
    throw new Error('Missing loadAllData dependency for match proposals module.');
  }
  if (typeof createMatchScheduleSlotPicker !== 'function') {
    throw new Error('Missing createMatchScheduleSlotPicker dependency for match proposals module.');
  }
  if (typeof getClubMatchScheduleTemplates !== 'function') {
    throw new Error('Missing getClubMatchScheduleTemplates dependency for match proposals module.');
  }
  if (typeof roundDateUpToInterval !== 'function') {
    throw new Error('Missing roundDateUpToInterval dependency for match proposals module.');
  }
  if (typeof formatDateInput !== 'function') {
    throw new Error('Missing formatDateInput dependency for match proposals module.');
  }
  if (typeof formatTimeInputValue !== 'function') {
    throw new Error('Missing formatTimeInputValue dependency for match proposals module.');
  }
  if (typeof isValidReservationSlotStart !== 'function') {
    throw new Error('Missing isValidReservationSlotStart dependency for match proposals module.');
  }
  if (!Number.isFinite(Number(CALENDAR_TIME_SLOT_MINUTES))) {
    throw new Error('Missing CALENDAR_TIME_SLOT_MINUTES constant for match proposals module.');
  }

  let activeProposalForm = null;
  let activeProposalMatchId = null;

  function destroySchedulePicker(form) {
    if (form?._schedulePicker && typeof form._schedulePicker.destroy === 'function') {
      form._schedulePicker.destroy();
    }
  }

  function closeProposalForm() {
    if (activeProposalForm) {
      destroySchedulePicker(activeProposalForm);
      activeProposalForm.remove();
    }
    activeProposalForm = null;
    activeProposalMatchId = null;
  }

  function hasActiveProposalForm() {
    return Boolean(activeProposalForm);
  }

  function attachActiveProposalForm(container, matchId) {
    if (!container || !matchId) {
      return false;
    }
    if (activeProposalForm && activeProposalMatchId === matchId) {
      container.appendChild(activeProposalForm);
      return true;
    }
    return false;
  }

  function openProposalForm(matchId, triggerButton) {
    if (!matchId) {
      return;
    }

    if (activeProposalForm && activeProposalMatchId === matchId) {
      closeProposalForm();
      return;
    }

    closeProposalForm();

    const listItem = triggerButton?.closest('li[data-match-id]');
    if (!listItem) {
      showGlobalMessage('No se pudo abrir el formulario de propuesta.', 'error');
      return;
    }

    const form = document.createElement('form');
    form.className = 'proposal-form';

    const dateInputId = `proposal-${matchId}-datetime`;
    const dayInputId = `${dateInputId}-day`;
    const messageInputId = `proposal-${matchId}-message`;

    const scheduleTemplates = getClubMatchScheduleTemplates();
    const scheduleFieldMarkup = `
      <div class="proposal-form__field">
        <label for="${dayInputId}">Día del partido</label>
        <input type="date" id="${dayInputId}" name="proposedDay" required />
      </div>
      <input type="hidden" name="proposedAt" />
      <input type="hidden" name="proposedCourt" />
      <div class="proposal-form__field proposal-form__field--slots">
        <div class="match-schedule-picker" data-proposal-schedule-picker></div>
        <span class="form-hint">Selecciona una franja disponible.</span>
      </div>
    `;

    form.innerHTML = `
      <h4>Proponer fecha y hora</h4>
      ${scheduleFieldMarkup}
      <div class="proposal-form__field">
        <label for="${messageInputId}">Mensaje (opcional)</label>
        <textarea id="${messageInputId}" name="message" rows="3" placeholder="Mensaje para tu oponente"></textarea>
      </div>
      <p class="proposal-form__error" hidden></p>
      <div class="proposal-form__actions">
        <button type="submit" class="primary">Enviar propuesta</button>
        <button type="button" class="ghost" data-action="cancel">Cancelar</button>
      </div>
    `;

    const proposedDayInput = form.querySelector('input[name="proposedDay"]');
    const proposedAtField = form.querySelector('input[name="proposedAt"]');
    const proposedCourtField = form.querySelector('input[name="proposedCourt"]');
    const schedulePickerContainer = form.querySelector('[data-proposal-schedule-picker]');
    const messageInput = form.querySelector('textarea[name="message"]');
    const cancelButton = form.querySelector('button[data-action="cancel"]');
    const submitButton = form.querySelector('button[type="submit"]');
    const errorMessage = form.querySelector('.proposal-form__error');

    const updateError = (message = '') => {
      if (!errorMessage) return;
      errorMessage.textContent = message;
      errorMessage.hidden = !message;
    };

    const now = new Date();
    const minDateValue = roundDateUpToInterval(now, CALENDAR_TIME_SLOT_MINUTES);
    const defaultDateValue = roundDateUpToInterval(
      new Date(minDateValue.getTime() + 2 * 60 * 60 * 1000),
      CALENDAR_TIME_SLOT_MINUTES,
    );
    const defaultDateString = !Number.isNaN(defaultDateValue.getTime())
      ? formatDateInput(defaultDateValue)
      : '';
    const minDateString = !Number.isNaN(minDateValue.getTime()) ? formatDateInput(minDateValue) : '';
    const defaultTimeValue = !Number.isNaN(defaultDateValue.getTime())
      ? formatTimeInputValue(defaultDateValue)
      : '';
    const defaultSelectionValue = defaultDateString && defaultTimeValue
      ? `${defaultDateString}T${defaultTimeValue}`
      : '';

    if (proposedDayInput) {
      if (minDateString) {
        proposedDayInput.min = minDateString;
      }
      if (defaultDateString) {
        proposedDayInput.value = defaultDateString;
      }
    }

    if (schedulePickerContainer && proposedDayInput && proposedAtField) {
      const schedulePicker = createMatchScheduleSlotPicker({
        container: schedulePickerContainer,
        dateField: proposedDayInput,
        scheduledField: proposedAtField,
        courtField: proposedCourtField,
        templates: scheduleTemplates,
        scope: 'player',
        existingValue: defaultSelectionValue,
        ignoreMatchId: matchId,
        onChange: () => {
          updateError();
        },
      });
      form._schedulePicker = schedulePicker;

      if (defaultSelectionValue) {
        schedulePicker.setSelection({ scheduledAt: defaultSelectionValue });
      }
    }

    cancelButton?.addEventListener('click', (event) => {
      event.preventDefault();
      closeProposalForm();
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      updateError();

      let proposedDate = null;
      let selectedCourt = '';

      const schedulePicker = form._schedulePicker;

      const dayValue = proposedDayInput?.value || '';
      if (!dayValue) {
        updateError('Selecciona el día del partido.');
        proposedDayInput?.focus();
        return;
      }

      const scheduledAtValue = schedulePicker?.getSelection().scheduledAt || proposedAtField?.value || '';
      if (!scheduledAtValue) {
        updateError('Selecciona una franja horaria.');
        schedulePickerContainer?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }

      proposedDate = new Date(scheduledAtValue);
      if (!(proposedDate instanceof Date) || Number.isNaN(proposedDate.getTime())) {
        updateError('La combinación de día y franja no es válida.');
        schedulePickerContainer?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }

      selectedCourt = schedulePicker?.getSelection().court || proposedCourtField?.value || '';

      if (proposedDate && !Number.isNaN(minDateValue.getTime()) && proposedDate < minDateValue) {
        updateError('Selecciona una fecha futura.');
        proposedDayInput?.focus();
        return;
      }

      if (!isValidReservationSlotStart(proposedDate)) {
        updateError('Selecciona un horario válido entre las 08:30 y las 22:15.');
        schedulePickerContainer?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }

      const messageValue = messageInput?.value.trim();

      if (submitButton) submitButton.disabled = true;
      if (cancelButton) cancelButton.disabled = true;

      try {
        await request(`/matches/${matchId}/propose`, {
          method: 'POST',
          body: {
            proposedFor: proposedDate.toISOString(),
            court: selectedCourt || undefined,
            message: messageValue ? messageValue : undefined,
          },
        });
        showGlobalMessage('Se envió la propuesta de partido.', 'info');
        closeProposalForm();
        await loadAllData();
      } catch (error) {
        showGlobalMessage(error.message, 'error');
      } finally {
        if (submitButton) submitButton.disabled = false;
        if (cancelButton) cancelButton.disabled = false;
      }
    });

    form.addEventListener('input', () => {
      updateError();
    });

    activeProposalForm = form;
    activeProposalMatchId = matchId;

    listItem.appendChild(form);
    (proposedDayInput || schedulePickerContainer)?.focus();
  }

  return {
    openProposalForm,
    closeProposalForm,
    hasActiveProposalForm,
    attachActiveProposalForm,
  };
}
