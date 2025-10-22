const { URLSearchParams } = require('url');

function toDate(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDateForRange(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function sanitizeText(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
}

function buildGoogleCalendarLink({ title, description, location, startsAt, endsAt }) {
  if (!startsAt || !endsAt) {
    return '';
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: sanitizeText(title) || 'Partido programado',
    details: sanitizeText(description),
    location: sanitizeText(location),
    dates: `${formatDateForRange(startsAt)}/${formatDateForRange(endsAt)}`,
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookCalendarLink({ title, description, location, startsAt, endsAt }) {
  if (!startsAt || !endsAt) {
    return '';
  }

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: sanitizeText(title) || 'Partido programado',
    body: sanitizeText(description),
    location: sanitizeText(location),
    startdt: startsAt.toISOString(),
    enddt: endsAt.toISOString(),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function escapeICSValue(value) {
  if (!value) {
    return '';
  }

  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatDateForICS(date) {
  return formatDateForRange(date);
}

function buildICSContent({ title, description, location, startsAt, endsAt }) {
  if (!startsAt || !endsAt) {
    return '';
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CN San Marcos//Liga Social//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${formatDateForICS(startsAt)}-match@cnsanmarcos`,
    `DTSTAMP:${formatDateForICS(new Date())}`,
    `DTSTART:${formatDateForICS(startsAt)}`,
    `DTEND:${formatDateForICS(endsAt)}`,
    `SUMMARY:${escapeICSValue(sanitizeText(title) || 'Partido programado')}`,
  ];

  const sanitizedDescription = sanitizeText(description);
  if (sanitizedDescription) {
    lines.push(`DESCRIPTION:${escapeICSValue(sanitizedDescription)}`);
  }

  const sanitizedLocation = sanitizeText(location);
  if (sanitizedLocation) {
    lines.push(`LOCATION:${escapeICSValue(sanitizedLocation)}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

function generateCalendarMetadata({ title, description, location, startsAt, endsAt }) {
  const startDate = toDate(startsAt);
  const endDate = toDate(endsAt);

  if (!startDate || !endDate || endDate <= startDate) {
    return {};
  }

  const linkOptions = { title, description, location, startsAt: startDate, endsAt: endDate };

  const google = buildGoogleCalendarLink(linkOptions);
  const outlook = buildOutlookCalendarLink(linkOptions);
  const icsContent = buildICSContent(linkOptions);
  const apple = icsContent
    ? `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`
    : '';

  const metadata = {};
  if (google) {
    metadata.calendar_google = google;
  }
  if (outlook) {
    metadata.calendar_outlook = outlook;
  }
  if (apple) {
    metadata.calendar_apple = apple;
  }
  if (icsContent) {
    metadata.calendar_ics = icsContent;
  }

  return metadata;
}

module.exports = {
  generateCalendarMetadata,
};
