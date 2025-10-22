const { Enrollment } = require('../models/Enrollment');
const { Match } = require('../models/Match');
const { League } = require('../models/League');
const { Tournament } = require('../models/Tournament');
const { TournamentMatch, TOURNAMENT_MATCH_STATUS } = require('../models/TournamentMatch');
const { resolveCategoryColor } = require('../utils/colors');
const { resolveMatchScheduledAt } = require('../utils/matchSchedule');

const UPCOMING_LEAGUE_MATCH_STATUSES = ['pendiente', 'propuesto', 'programado', 'revision'];
const COMPLETED_LEAGUE_MATCH_STATUSES = ['completado'];
const UPCOMING_TOURNAMENT_MATCH_STATUSES = [
  TOURNAMENT_MATCH_STATUS.PENDING,
  TOURNAMENT_MATCH_STATUS.SCHEDULED,
  TOURNAMENT_MATCH_STATUS.CONFIRMED,
];
const COMPLETED_TOURNAMENT_MATCH_STATUSES = [TOURNAMENT_MATCH_STATUS.COMPLETED];
const MAX_MATCHES_PER_SECTION = 10;

function normalizeId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value.id) return value.id.toString();
    if (value._id) return value._id.toString();
  }
  return null;
}

function mapPlayers(players = []) {
  return Array.isArray(players)
    ? players.map((player) => ({
        id: normalizeId(player),
        fullName: typeof player === 'object' ? player.fullName : undefined,
        photo: typeof player === 'object' ? player.photo : undefined,
      }))
    : [];
}

function mapLeagueMatch(match) {
  const category = match.category || {};
  const league = (match.league && typeof match.league === 'object'
    ? match.league
    : category.league) || null;
  const scheduledAt = resolveMatchScheduledAt(match);

  return {
    id: normalizeId(match),
    scope: 'league',
    status: match.status,
    scheduledAt,
    court: match.court || null,
    category: category
      ? {
          id: normalizeId(category),
          name: category.name,
          color: resolveCategoryColor(category.color),
        }
      : null,
    league: league
      ? {
          id: normalizeId(league),
          name: league.name,
          year: league.year,
          status: league.status,
        }
      : null,
    players: mapPlayers(match.players),
    result: match.result
      ? {
          status: match.result.status,
          winner: normalizeId(match.result.winner),
          reportedAt: match.result.reportedAt || null,
        }
      : null,
    createdAt: match.createdAt || null,
    updatedAt: match.updatedAt || null,
  };
}

function mapTournamentMatch(match) {
  const category = match.category || {};
  const tournament = match.tournament || (category.tournament || null);
  const scheduledAt = resolveMatchScheduledAt(match);

  return {
    id: normalizeId(match),
    scope: 'tournament',
    status: match.status,
    scheduledAt,
    court: match.court || null,
    category: category
      ? {
          id: normalizeId(category),
          name: category.name,
          color: resolveCategoryColor(category.color),
        }
      : null,
    tournament: tournament
      ? {
          id: normalizeId(tournament),
          name: tournament.name,
          status: tournament.status,
        }
      : null,
    players: mapPlayers(match.players),
    result: match.result
      ? {
          winner: normalizeId(match.result.winner),
          reportedAt: match.result.reportedAt || null,
          status: match.resultStatus || null,
        }
      : null,
    createdAt: match.createdAt || null,
    updatedAt: match.updatedAt || null,
  };
}

function mapEnrollment(enrollment) {
  const category = enrollment.category || {};
  const league = (category.league && typeof category.league === 'object'
    ? category.league
    : null);

  return {
    id: normalizeId(enrollment),
    joinedAt: enrollment.joinedAt || enrollment.createdAt || null,
    category: category
      ? {
          id: normalizeId(category),
          name: category.name,
          color: resolveCategoryColor(category.color),
          status: category.status,
        }
      : null,
    league: league
      ? {
          id: normalizeId(league),
          name: league.name,
          year: league.year,
          status: league.status,
        }
      : null,
  };
}

function mapPaymentRecord(record, container, scope, currentUser) {
  const recordedBy = record.recordedBy && typeof record.recordedBy === 'object'
    ? {
        id: normalizeId(record.recordedBy),
        fullName: record.recordedBy.fullName,
      }
    : null;

  const userInfo = record.user && typeof record.user === 'object'
    ? {
        id: normalizeId(record.user),
        fullName: record.user.fullName,
      }
    : {
        id: normalizeId(record.user) || normalizeId(currentUser),
        fullName: currentUser.fullName,
      };

  return {
    id: normalizeId(record),
    scope,
    status: record.status,
    amount: typeof record.amount === 'number' ? record.amount : null,
    method: record.method || null,
    reference: record.reference || null,
    notes: record.notes || null,
    paidAt: record.paidAt || null,
    recordedAt: record.createdAt || null,
    recordedBy,
    user: userInfo,
    container: {
      id: normalizeId(container),
      name: container.name,
      status: container.status,
      year: container.year,
    },
  };
}

function groupPayments(records) {
  return records.reduce(
    (acc, record) => {
      const amount = typeof record.amount === 'number' ? record.amount : 0;
      if (record.status === 'pagado') {
        acc.paid += amount;
      } else if (record.status === 'pendiente') {
        acc.pending += amount;
      }
      acc.total += amount;
      return acc;
    },
    { paid: 0, pending: 0, total: 0 }
  );
}

async function getAccountSummary(req, res) {
  const userId = req.user.id;

  const [
    enrollmentsRaw,
    upcomingLeagueMatchesRaw,
    recentLeagueMatchesRaw,
    upcomingTournamentMatchesRaw,
    recentTournamentMatchesRaw,
    leaguesWithPayments,
    tournamentsWithPayments,
  ] = await Promise.all([
    Enrollment.find({ user: userId })
      .populate({
        path: 'category',
        select: 'name color status league',
        populate: { path: 'league', select: 'name year status' },
      })
      .sort({ joinedAt: -1, createdAt: -1 })
      .lean(),
    Match.find({
      players: userId,
      status: { $in: UPCOMING_LEAGUE_MATCH_STATUSES },
    })
      .populate('players', 'fullName photo')
      .populate({
        path: 'category',
        select: 'name color league',
        populate: { path: 'league', select: 'name year status' },
      })
      .populate('league', 'name year status')
      .sort({ scheduledAt: 1, createdAt: 1 })
      .limit(MAX_MATCHES_PER_SECTION)
      .lean(),
    Match.find({
      players: userId,
      status: { $in: COMPLETED_LEAGUE_MATCH_STATUSES },
    })
      .populate('players', 'fullName photo')
      .populate({
        path: 'category',
        select: 'name color league',
        populate: { path: 'league', select: 'name year status' },
      })
      .populate('league', 'name year status')
      .sort({ scheduledAt: -1, updatedAt: -1 })
      .limit(MAX_MATCHES_PER_SECTION)
      .lean(),
    TournamentMatch.find({
      players: userId,
      status: { $in: UPCOMING_TOURNAMENT_MATCH_STATUSES },
    })
      .populate('players', 'fullName photo')
      .populate('category', 'name color tournament')
      .populate('tournament', 'name status')
      .sort({ scheduledAt: 1, createdAt: 1 })
      .limit(MAX_MATCHES_PER_SECTION)
      .lean(),
    TournamentMatch.find({
      players: userId,
      status: { $in: COMPLETED_TOURNAMENT_MATCH_STATUSES },
    })
      .populate('players', 'fullName photo')
      .populate('category', 'name color tournament')
      .populate('tournament', 'name status')
      .sort({ scheduledAt: -1, updatedAt: -1 })
      .limit(MAX_MATCHES_PER_SECTION)
      .lean(),
    League.find({ 'payments.user': userId })
      .select('name year status payments')
      .populate({ path: 'payments.user', select: 'fullName' })
      .populate({ path: 'payments.recordedBy', select: 'fullName' })
      .lean(),
    Tournament.find({ 'payments.user': userId })
      .select('name status payments')
      .populate({ path: 'payments.user', select: 'fullName' })
      .populate({ path: 'payments.recordedBy', select: 'fullName' })
      .lean(),
  ]);

  const enrollments = enrollmentsRaw.map((enrollment) => mapEnrollment(enrollment));

  const upcomingMatches = [
    ...upcomingLeagueMatchesRaw.map((match) => mapLeagueMatch(match)),
    ...upcomingTournamentMatchesRaw.map((match) => mapTournamentMatch(match)),
  ].sort((a, b) => {
    const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
    const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
    return dateA - dateB;
  });

  const recentMatches = [
    ...recentLeagueMatchesRaw.map((match) => mapLeagueMatch(match)),
    ...recentTournamentMatchesRaw.map((match) => mapTournamentMatch(match)),
  ].sort((a, b) => {
    const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
    const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
    return dateB - dateA;
  });

  const leaguePayments = leaguesWithPayments.flatMap((league) => {
    const payments = Array.isArray(league.payments) ? league.payments : [];
    return payments
      .filter((payment) => normalizeId(payment.user) === userId)
      .map((payment) => mapPaymentRecord(payment, league, 'league', req.user));
  });

  const tournamentPayments = tournamentsWithPayments.flatMap((tournament) => {
    const payments = Array.isArray(tournament.payments) ? tournament.payments : [];
    return payments
      .filter((payment) => normalizeId(payment.user) === userId)
      .map((payment) => mapPaymentRecord(payment, tournament, 'tournament', req.user));
  });

  const paymentRecords = [...leaguePayments, ...tournamentPayments].sort((a, b) => {
    const dateA = a.recordedAt ? new Date(a.recordedAt).getTime() : 0;
    const dateB = b.recordedAt ? new Date(b.recordedAt).getTime() : 0;
    return dateB - dateA;
  });

  const paymentTotals = groupPayments(paymentRecords);

  return res.json({
    user: {
      id: req.user.id,
      fullName: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone,
      isMember: Boolean(req.user.isMember),
      membershipNumber: req.user.membershipNumber || null,
    },
    enrollments,
    matches: {
      upcoming: upcomingMatches,
      recent: recentMatches,
    },
    payments: {
      totals: paymentTotals,
      records: paymentRecords,
    },
  });
}

module.exports = {
  getAccountSummary,
};
