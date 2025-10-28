import {
  CALENDAR_TIME_SLOT_MINUTES,
  COURT_RESERVATION_FIRST_SLOT_MINUTE,
  COURT_RESERVATION_LAST_SLOT_END_MINUTE,
  DAY_IN_MS,
  MATCH_EXPIRATION_DAYS,
} from '../config/constants.js';

function capitalizeFirstLetter(text) {
  if (!text) {
    return text;
  }
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

export function formatDate(value) {
  if (!value) return 'Por confirmar';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

export function formatShortDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  } catch (error) {
    return '—';
  }
}

export function formatTime(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    return '—';
  }
}

export function formatTimeRangeLabel(start, end) {
  const startLabel = formatTime(start);
  const endLabel = formatTime(end);
  return `${startLabel} – ${endLabel}`;
}

export function formatDateOnly(value, options = {}) {
  try {
    const formatted = new Intl.DateTimeFormat('es-ES', {
      weekday: options.weekday ?? 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(value));
    return capitalizeFirstLetter(formatted);
  } catch (error) {
    return value;
  }
}

export function formatMonthLabel(date) {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch (error) {
    return '';
  }
}

export function formatDayLabel(date) {
  try {
    const formatted = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
    return capitalizeFirstLetter(formatted);
  } catch (error) {
    return formatDateOnly(date);
  }
}

export function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function startOfWeek(date) {
  const copy = startOfDay(date);
  const day = copy.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

export function startOfMonth(date) {
  const copy = new Date(date);
  copy.setDate(1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfMonth(date) {
  const end = startOfMonth(date);
  end.setMonth(end.getMonth() + 1);
  return end;
}

export function addMinutes(date, minutes) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() + minutes);
  return copy;
}

export function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addMonths(date, months) {
  const copy = new Date(date);
  copy.setDate(1);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function formatDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function roundDateToInterval(date, minutes = CALENDAR_TIME_SLOT_MINUTES, mode = 'ceil') {
  const base = new Date(date);
  if (Number.isNaN(base.getTime())) {
    return new Date(NaN);
  }

  base.setSeconds(0, 0);
  const dayStart = startOfDay(base);
  const minutesFromStart = Math.floor((base.getTime() - dayStart.getTime()) / 60000);
  const firstSlot = COURT_RESERVATION_FIRST_SLOT_MINUTE;
  const lastSlotStart = COURT_RESERVATION_LAST_SLOT_END_MINUTE - minutes;

  if (minutesFromStart <= firstSlot) {
    return new Date(dayStart.getTime() + firstSlot * 60 * 1000);
  }

  const offset = Math.max(0, minutesFromStart - firstSlot);
  const stepCount = mode === 'floor' ? Math.floor(offset / minutes) : Math.ceil(offset / minutes);
  let slotMinutes = firstSlot + stepCount * minutes;

  if (mode === 'ceil' && slotMinutes > lastSlotStart) {
    const nextDay = addDays(dayStart, 1);
    return new Date(nextDay.getTime() + firstSlot * 60 * 1000);
  }

  if (slotMinutes > lastSlotStart) {
    slotMinutes = lastSlotStart;
  }

  if (slotMinutes < firstSlot) {
    slotMinutes = firstSlot;
  }

  return new Date(dayStart.getTime() + slotMinutes * 60 * 1000);
}

export function roundDateUpToInterval(date, minutes = CALENDAR_TIME_SLOT_MINUTES) {
  return roundDateToInterval(date, minutes, 'ceil');
}

export function formatDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const datePart = formatDateInput(date);
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${datePart}T${hours}:${minutes}`;
}

export function formatTimeInputValue(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function combineDateAndTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) {
    return null;
  }
  const isoString = `${dateValue}T${timeValue}`;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function formatDateRangeLabel(startDate, endDate) {
  const start = formatDateOnly(startDate);
  const end = formatDateOnly(endDate);
  if (start && end) {
    if (start === end) {
      return start;
    }
    return `${start} – ${end}`;
  }
  return start || end || '';
}

export function getMatchExpirationDate(match) {
  if (!match) return null;

  if (match.expiresAt) {
    const expirationDate = new Date(match.expiresAt);
    if (!Number.isNaN(expirationDate.getTime())) {
      return expirationDate;
    }
  }

  if (match.createdAt) {
    const createdAt = new Date(match.createdAt);
    if (!Number.isNaN(createdAt.getTime())) {
      return new Date(createdAt.getTime() + MATCH_EXPIRATION_DAYS * DAY_IN_MS);
    }
  }

  return null;
}

export function formatExpirationDeadline(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch (error) {
    return null;
  }
}

export function formatChatTimestamp(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    return '';
  }
}
