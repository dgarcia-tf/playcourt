function toValidDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveMatchScheduledAt(match) {
  if (!match) {
    return null;
  }

  const scheduledDate = toValidDate(match.scheduledAt);
  if (scheduledDate) {
    return scheduledDate;
  }

  if (match.proposal) {
    const proposedDate = toValidDate(match.proposal.proposedFor);
    if (proposedDate) {
      return proposedDate;
    }
  }

  return null;
}

module.exports = { resolveMatchScheduledAt };
