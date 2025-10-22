const mongoose = require('mongoose');
const { League, LEAGUE_STATUS } = require('../models/League');

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

function isLeagueDocument(league) {
  return Boolean(league && typeof league === 'object' && typeof league.isModified === 'function');
}

async function resolveLeagueDocument(leagueInput) {
  if (!leagueInput) {
    return null;
  }

  if (isLeagueDocument(leagueInput)) {
    return leagueInput;
  }

  if (leagueInput instanceof mongoose.Types.ObjectId) {
    return League.findById(leagueInput);
  }

  if (typeof leagueInput === 'string') {
    return League.findById(leagueInput);
  }

  if (leagueInput && (leagueInput._id || leagueInput.id)) {
    return League.findById(leagueInput._id || leagueInput.id);
  }

  return null;
}

async function refreshLeagueStatusIfExpired(leagueInput) {
  const league = await resolveLeagueDocument(leagueInput);
  if (!league) {
    return null;
  }

  if (league.status === LEAGUE_STATUS.CLOSED) {
    return league;
  }

  const now = new Date();
  const endDate = toDate(league.endDate);

  if (endDate && now >= endDate) {
    league.status = LEAGUE_STATUS.CLOSED;
    if (!league.closedAt) {
      league.closedAt = now;
    }
    if (!league.endDate) {
      league.endDate = endDate;
    }
    await league.save();
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
  ensureLeagueIsOpen,
  refreshLeagueStatusIfExpired,
};
