const { getSequelize } = require('../../config/database');

const LEAGUE_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed'
};

function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function resolveLeagueInstance(leagueInput) {
  if (!leagueInput) {
    return null;
  }

  const sequelize = getSequelize();
  const { League } = sequelize.models;

  if (leagueInput instanceof League) {
    return leagueInput;
  }

  const leagueId = typeof leagueInput === 'object' ? leagueInput.id : leagueInput;
  return await League.findByPk(leagueId);
}

async function refreshLeagueStatusIfExpired(leagueInput) {
  const league = await resolveLeagueInstance(leagueInput);
  if (!league) {
    return null;
  }

  if (league.status === LEAGUE_STATUS.CLOSED) {
    return league;
  }

  const now = new Date();
  const endDate = toDate(league.endDate);

  if (endDate && now >= endDate) {
    await league.update({
      status: LEAGUE_STATUS.CLOSED,
      closedAt: league.closedAt || now,
      endDate: league.endDate || endDate
    });
  }

  return league;
}

async function ensureLeagueIsOpen(leagueInput, message = 'La liga está cerrada.') {
  const league = await refreshLeagueStatusIfExpired(leagueInput);

  if (league && league.status === LEAGUE_STATUS.CLOSED) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }

  return league;
}

module.exports = {
  LEAGUE_STATUS,
  ensureLeagueIsOpen,
  refreshLeagueStatusIfExpired,
};