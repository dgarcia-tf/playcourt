export function createCalendarEventsModule({
  startOfDay,
  addDays,
  addMinutes,
  formatTimeRangeLabel,
  formatCourtDisplay,
  formatReservationParticipantsLabel,
  getReservationMatch,
  formatMatchPlayersLabel,
  getReservationContextLabel,
  normalizeId,
  getPlayerDisplayName,
  normalizeCourtKey,
  getClubCourtNames,
  formatDateInput,
  formatDateOnly,
  formatDayLabel,
  getReservationSlotStartsForDate,
  getReservationSlotEnd,
  formatReservationSlotLabel,
  openReservationEditorFromCalendar,
  bindCalendarEvent,
  openTournamentMatchScheduleModal,
  parseDateSafe,
  COURT_RESERVATION_DEFAULT_DURATION,
  getSelectedCourtCalendarDate,
} = {}) {
  if (typeof startOfDay !== 'function' || typeof addDays !== 'function') {
    throw new Error('Missing required date helpers for calendar events module.');
  }

  function isAllDaySegment(start, end) {
    if (!start || !end) {
      return false;
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return false;
    }
    const dayStart = startOfDay(startDate).getTime();
    const nextDayStart = addDays(startOfDay(startDate), 1).getTime();
    return startDate.getTime() === dayStart && endDate.getTime() === nextDayStart;
  }

  function buildCourtCalendarDayMap(events = []) {
    const grouped = new Map();
    events.forEach((event) => {
      if (!event || !event.startsAt || !event.endsAt) {
        return;
      }
      const start = new Date(event.startsAt);
      const end = new Date(event.endsAt);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return;
      }

      const safeEnd = end > start ? end : new Date(start.getTime() + 30 * 60 * 1000);
      let cursor = startOfDay(start);
      const finalDay = startOfDay(new Date(safeEnd.getTime() - 1));

      while (cursor.getTime() <= finalDay.getTime()) {
        const dayKey = cursor.getTime();
        if (!grouped.has(dayKey)) {
          grouped.set(dayKey, []);
        }

        const dayStart = cursor;
        const dayEnd = addDays(cursor, 1);
        const displayStartsAt = start > dayStart ? start : dayStart;
        const displayEndsAt = safeEnd < dayEnd ? safeEnd : dayEnd;
        const spansMultipleDays = finalDay.getTime() !== startOfDay(start).getTime();

        grouped.get(dayKey).push({
          ...event,
          displayStartsAt,
          displayEndsAt,
          spansMultipleDays,
        });

        cursor = addDays(cursor, 1);
      }
    });

    grouped.forEach((list) => {
      list.sort((a, b) => {
        const first = new Date(a.displayStartsAt || a.startsAt);
        const second = new Date(b.displayStartsAt || b.startsAt);
        return first - second;
      });
    });

    return grouped;
  }

  function createCourtCalendarEvent(event) {
    const container = document.createElement('div');
    const type = event.type || 'reservation';
    container.className = `calendar-event calendar-event--${type}`;
    if (event.status === 'pre_reservada' || event.preReserved) {
      container.classList.add('calendar-event--pre-reservation');
    }
    if (event.spansMultipleDays) {
      container.classList.add('calendar-event--spanning');
    }

    const title = document.createElement('strong');
    title.textContent = event.title || 'Reserva de pista';
    container.appendChild(title);

    const displayStart = event.displayStartsAt || event.startsAt;
    const displayEnd = event.displayEndsAt || event.endsAt;
    const timeLabel = isAllDaySegment(displayStart, displayEnd)
      ? 'Todo el día'
      : formatTimeRangeLabel(displayStart, displayEnd);

    const meta = document.createElement('div');
    meta.className = 'meta';
    const courtLabel = event.courtLabel || event.court || 'Pista por confirmar';
    meta.textContent = `${timeLabel} · ${courtLabel}`;
    container.appendChild(meta);

    if (event.subtitle) {
      const subtitle = document.createElement('div');
      subtitle.className = 'meta calendar-event-subtitle';
      subtitle.textContent = event.subtitle;
      container.appendChild(subtitle);
    }

    if (event.notes) {
      const notes = document.createElement('div');
      notes.className = 'meta calendar-event-notes';
      notes.textContent = event.notes;
      container.appendChild(notes);
    }

    if (type === 'match' && event.matchId) {
      bindCalendarEvent(container, event.matchId);
    } else if (type === 'tournament-match' && event.tournamentMatchId) {
      container.dataset.tournamentMatchId = event.tournamentMatchId;
      if (event.tournamentId) {
        container.dataset.tournamentId = event.tournamentId;
      }
      if (event.categoryId) {
        container.dataset.categoryId = event.categoryId;
      }
      container.classList.add('calendar-event--actionable');
      container.tabIndex = 0;
      container.setAttribute('role', 'button');
      const openTournamentMatch = () => {
        openTournamentMatchScheduleModal(event.tournamentMatchId, {
          tournamentId: event.tournamentId,
          categoryId: event.categoryId,
        });
      };
      container.addEventListener('click', openTournamentMatch);
      container.addEventListener('keydown', (keyboardEvent) => {
        if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
          keyboardEvent.preventDefault();
          openTournamentMatch();
        }
      });
    } else if (type === 'reservation') {
      container.dataset.calendarAction = 'open-reservation';
      container.dataset.startsAt = event.startsAt ? new Date(event.startsAt).toISOString() : '';
      container.dataset.court = event.court || '';
      container.classList.add('calendar-event--actionable');
      container.tabIndex = 0;
      container.setAttribute('role', 'button');
      container.addEventListener('click', () => {
        openReservationEditorFromCalendar(event);
      });
      container.addEventListener('keydown', (keyboardEvent) => {
        if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
          keyboardEvent.preventDefault();
          openReservationEditorFromCalendar(event);
        }
      });
    }

    return container;
  }

  function getCourtCalendarEventBounds(event) {
    if (!event) {
      return { start: null, end: null };
    }

    const start = parseDateSafe(event.displayStartsAt || event.startsAt);
    if (!start) {
      return { start: null, end: null };
    }

    const rawEnd = parseDateSafe(event.displayEndsAt || event.endsAt);
    const end =
      rawEnd && rawEnd > start ? rawEnd : addMinutes(start, COURT_RESERVATION_DEFAULT_DURATION);

    return { start, end };
  }

  function getCourtCalendarCourts(events = []) {
    const seen = new Set();
    const courts = [];

    const register = (rawName) => {
      if (!rawName) {
        return;
      }
      const name = String(rawName).trim();
      if (!name) {
        return;
      }
      const key = normalizeCourtKey(name);
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      courts.push({
        key,
        name,
        label: formatCourtDisplay(name) || name,
      });
    };

    getClubCourtNames().forEach(register);

    events.forEach((event) => {
      if (!event) {
        return;
      }
      if (event.type === 'block') {
        const blockCourts = Array.isArray(event.courts) ? event.courts : [];
        blockCourts.forEach(register);
      } else if (event.court) {
        register(event.court);
      }
    });

    return courts;
  }

  function isCourtCalendarEventForCourt(event, courtName) {
    if (!event || !courtName) {
      return false;
    }

    if (event.appliesToAllCourts) {
      return true;
    }

    if (event.type === 'block') {
      if (event.appliesToAllCourts) {
        return true;
      }
      const courts = Array.isArray(event.courts) ? event.courts : [];
      const normalizedCourt = normalizeCourtKey(courtName);
      return courts.some((name) => normalizeCourtKey(name) === normalizedCourt);
    }

    if (!event.court) {
      return false;
    }

    return normalizeCourtKey(event.court) === normalizeCourtKey(courtName);
  }

  function doesCourtCalendarEventOverlapSlot(entry, slotStart, slotEnd) {
    if (!entry || !entry.start || !entry.end) {
      return false;
    }

    return entry.start < slotEnd && entry.end > slotStart;
  }

  function createCourtCalendarDayBlock(date, events = [], { interactive = true } = {}) {
    const day = startOfDay(date instanceof Date ? date : new Date(date));
    const container = document.createElement('div');
    container.className = 'calendar-day';

    const formattedDate = formatDateInput(day);
    if (formattedDate) {
      container.dataset.calendarDate = formattedDate;
      const selectedValue = formatDateInput(
        typeof getSelectedCourtCalendarDate === 'function' ? getSelectedCourtCalendarDate() : null
      );
      if (selectedValue && selectedValue === formattedDate) {
        container.classList.add('calendar-day--selected');
        container.setAttribute('aria-current', 'date');
      }
      const todayValue = formatDateInput(new Date());
      if (todayValue && todayValue === formattedDate) {
        container.classList.add('calendar-day--today');
      }
    }

    if (interactive) {
      container.classList.add('calendar-day--actionable');
      container.tabIndex = 0;
      container.setAttribute('role', 'button');
      container.setAttribute('aria-label', `Agenda del ${formatDateOnly(day)}`);
    }

    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.innerHTML = `<strong>${day.getDate()}</strong><span>${new Intl.DateTimeFormat('es-ES', {
      weekday: 'short',
    }).format(day)}</span>`;
    container.appendChild(header);

    if (!events.length) {
      const empty = document.createElement('div');
      empty.className = 'calendar-empty';
      empty.textContent = '—';
      container.appendChild(empty);
      return container;
    }

    events.forEach((event) => {
      container.appendChild(createCourtCalendarEvent(event));
    });

    return container;
  }

  function createCourtCalendarDaySchedule(date, events = []) {
    const dayReference = startOfDay(date instanceof Date ? date : new Date(date));
    const formattedDate = formatDateInput(dayReference);

    const normalizedEvents = events
      .map((event) => {
        const bounds = getCourtCalendarEventBounds(event);
        if (!bounds.start || !bounds.end) {
          return null;
        }
        return { event, start: bounds.start, end: bounds.end };
      })
      .filter(Boolean);

    const courts = getCourtCalendarCourts(events);

    if (!courts.length) {
      return createCourtCalendarDayBlock(dayReference, events, { interactive: false });
    }

    const container = document.createElement('div');
    container.className = 'calendar-day calendar-day--schedule';
    if (formattedDate) {
      container.dataset.calendarDate = formattedDate;
      const selectedValue = formatDateInput(
        typeof getSelectedCourtCalendarDate === 'function' ? getSelectedCourtCalendarDate() : null
      );
      if (selectedValue && selectedValue === formattedDate) {
        container.classList.add('calendar-day--selected');
        container.setAttribute('aria-current', 'date');
      }
      const todayValue = formatDateInput(new Date());
      if (todayValue && todayValue === formattedDate) {
        container.classList.add('calendar-day--today');
      }
    }
    container.setAttribute('aria-label', `Agenda detallada del ${formatDateOnly(dayReference)}`);

    const header = document.createElement('div');
    header.className = 'calendar-day-header calendar-day-schedule__header';
    const dayLabel = formatDayLabel(dayReference);
    const [weekdayLabel, ...restParts] = dayLabel.split(', ');
    const headerTitle = document.createElement('strong');
    headerTitle.textContent = weekdayLabel || dayLabel;
    header.appendChild(headerTitle);
    const restLabel = restParts.join(', ');
    if (restLabel) {
      const headerDetail = document.createElement('span');
      headerDetail.textContent = restLabel;
      header.appendChild(headerDetail);
    }
    container.appendChild(header);

    const scroller = document.createElement('div');
    scroller.className = 'calendar-day-schedule';
    container.appendChild(scroller);

    const grid = document.createElement('div');
    grid.className = 'calendar-day-schedule__grid';
    grid.style.setProperty('--calendar-schedule-court-count', courts.length);
    scroller.appendChild(grid);

    const headerRow = document.createElement('div');
    headerRow.className = 'calendar-day-schedule__row calendar-day-schedule__row--header';
    headerRow.style.setProperty('--calendar-schedule-court-count', courts.length);
    const timeHeaderCell = document.createElement('div');
    timeHeaderCell.className = 'calendar-day-schedule__cell calendar-day-schedule__cell--time';
    timeHeaderCell.textContent = 'Horario';
    headerRow.appendChild(timeHeaderCell);
    courts.forEach((court, index) => {
      const courtCell = document.createElement('div');
      courtCell.className =
        'calendar-day-schedule__cell calendar-day-schedule__cell--court calendar-day-schedule__cell--header';
      courtCell.textContent = court.label;
      if (index === courts.length - 1) {
        courtCell.classList.add('calendar-day-schedule__cell--last-column');
      }
      headerRow.appendChild(courtCell);
    });
    grid.appendChild(headerRow);

    const slots = getReservationSlotStartsForDate(dayReference);

    slots.forEach((slotStart, slotIndex) => {
      const slotStartDate = new Date(slotStart);
      const slotEndDate = getReservationSlotEnd(slotStartDate);

      const row = document.createElement('div');
      row.className = 'calendar-day-schedule__row calendar-day-schedule__row--body';
      row.style.setProperty('--calendar-schedule-court-count', courts.length);

      const timeCell = document.createElement('div');
      timeCell.className = 'calendar-day-schedule__cell calendar-day-schedule__cell--time';
      timeCell.textContent = formatReservationSlotLabel(slotStartDate);
      if (slotIndex === slots.length - 1) {
        timeCell.classList.add('calendar-day-schedule__cell--last-row');
      }
      row.appendChild(timeCell);

      courts.forEach((court, courtIndex) => {
        const cell = document.createElement('div');
        cell.className = 'calendar-day-schedule__cell calendar-day-schedule__cell--court';
        if (slotIndex === slots.length - 1) {
          cell.classList.add('calendar-day-schedule__cell--last-row');
        }
        if (courtIndex === courts.length - 1) {
          cell.classList.add('calendar-day-schedule__cell--last-column');
        }

        const slotEvents = normalizedEvents.filter(
          (entry) =>
            isCourtCalendarEventForCourt(entry.event, court.name) &&
            doesCourtCalendarEventOverlapSlot(entry, slotStartDate, slotEndDate)
        );

        if (!slotEvents.length) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'calendar-day-schedule__slot-button';
          button.textContent = 'Reservar';
          button.setAttribute(
            'aria-label',
            `Reservar ${court.label} · ${formatReservationSlotLabel(slotStartDate)}`
          );
          button.addEventListener('click', (event) => {
            event.stopPropagation();
            openReservationEditorFromCalendar({
              startsAt: slotStartDate,
              endsAt: slotEndDate,
              court: court.name,
            });
          });
          cell.appendChild(button);
        } else {
          cell.classList.add('calendar-day-schedule__cell--busy');
          slotEvents
            .sort((a, b) => a.start - b.start)
            .forEach((entry) => {
              const eventElement = createCourtCalendarEvent(entry.event);
              eventElement.classList.add('calendar-schedule-event');
              cell.appendChild(eventElement);
            });
        }

        row.appendChild(cell);
      });

      grid.appendChild(row);
    });

    const unassignedSeen = new Set();
    const unassignedEvents = events.filter((event) => {
      if (!event) {
        return false;
      }
      if (event.type === 'block') {
        if (event.appliesToAllCourts) {
          return false;
        }
        const courtsList = Array.isArray(event.courts) ? event.courts.filter(Boolean) : [];
        if (courtsList.length) {
          return false;
        }
      } else if (event.court) {
        return false;
      }

      const key = event.id || `${event.type}:${event.startsAt}`;
      if (unassignedSeen.has(key)) {
        return false;
      }
      unassignedSeen.add(key);
      return true;
    });

    if (unassignedEvents.length) {
      const unassignedSection = document.createElement('div');
      unassignedSection.className = 'calendar-day-schedule__unassigned';
      const title = document.createElement('p');
      title.className = 'calendar-day-schedule__unassigned-title';
      title.textContent = 'Eventos sin pista asignada';
      unassignedSection.appendChild(title);
      const list = document.createElement('div');
      list.className = 'calendar-day-schedule__unassigned-list';
      unassignedEvents.forEach((event) => {
        const eventElement = createCourtCalendarEvent(event);
        eventElement.classList.add('calendar-schedule-event');
        list.appendChild(eventElement);
      });
      unassignedSection.appendChild(list);
      container.appendChild(unassignedSection);
    }

    return container;
  }

  function buildPlayerCourtCalendarEvents(availability = []) {
    const events = [];

    availability.forEach((entry) => {
      if (!entry) {
        return;
      }

      const courtName = entry.court || '';
      const courtLabel = formatCourtDisplay(courtName) || courtName || 'Pista por confirmar';
      const reservations = Array.isArray(entry.reservations) ? entry.reservations : [];
      const blocks = Array.isArray(entry.blocks) ? entry.blocks : [];

      reservations.forEach((reservation) => {
        if (!reservation) {
          return;
        }

        const startsAt = reservation.startsAt ? new Date(reservation.startsAt) : null;
        const endsAt = reservation.endsAt ? new Date(reservation.endsAt) : null;

        if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
          return;
        }

        const participantsLabel = formatReservationParticipantsLabel(reservation);
        const reservationCourtLabel = formatCourtDisplay(reservation.court) || courtLabel;
        const match = getReservationMatch(reservation);
        if (match) {
          const playersLabel =
            formatMatchPlayersLabel(match.players) || participantsLabel || 'Partido programado';
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
            title: playersLabel,
            subtitle: subtitleParts.join(' · '),
            court: reservation.court || courtName,
            courtLabel: reservationCourtLabel,
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
          court: reservation.court || courtName,
          courtLabel: reservationCourtLabel,
          reservationId: reservation._id || reservation.id,
          status: reservation.status || 'reservada',
        });
      });

      blocks.forEach((block) => {
        if (!block) {
          return;
        }

        const startsAt = block.startsAt ? new Date(block.startsAt) : null;
        const endsAt = block.endsAt ? new Date(block.endsAt) : null;

        if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
          return;
        }

        const appliesToAllCourts = Boolean(block.appliesToAllCourts);
        const blockCourts = Array.isArray(block.courts) ? block.courts : [];
        const baseTitle =
          block.contextType === 'lesson'
            ? block.contextName || 'Clases de tenis'
            : block.contextName
            ? `Bloqueo · ${block.contextName}`
            : 'Bloqueo de pistas';
        const subtitle = appliesToAllCourts
          ? 'Aplica a todas las pistas'
          : blockCourts.length
          ? `Pistas: ${blockCourts.join(', ')}`
          : 'Pistas por confirmar';

        events.push({
          id: block.id,
          type: 'block',
          startsAt,
          endsAt,
          title: baseTitle,
          subtitle,
          notes: block.notes || '',
          courtLabel: appliesToAllCourts
            ? 'Todas las pistas'
            : blockCourts.length
            ? blockCourts.join(', ')
            : courtLabel,
          appliesToAllCourts,
          courts: blockCourts,
          contextType: block.contextType || '',
          contextName: block.contextName || '',
        });
      });
    });

    return events;
  }

  return {
    isAllDaySegment,
    buildCourtCalendarDayMap,
    createCourtCalendarEvent,
    getCourtCalendarEventBounds,
    getCourtCalendarCourts,
    isCourtCalendarEventForCourt,
    doesCourtCalendarEventOverlapSlot,
    createCourtCalendarDayBlock,
    createCourtCalendarDaySchedule,
    buildPlayerCourtCalendarEvents,
  };
}

