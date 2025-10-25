const { Match } = require('../models/Match');
const { Category } = require('../models/Category');
const { Enrollment } = require('../models/Enrollment');
const { USER_ROLES, userHasRole } = require('../models/User');
const { calculateRanking } = require('../utils/ranking');
const { resolveCategoryColor } = require('../utils/colors');
const { League, LEAGUE_STATUS } = require('../models/League');
const { Tournament, TOURNAMENT_STATUS } = require('../models/Tournament');
const { TournamentCategory } = require('../models/TournamentCategory');
const {
  TournamentMatch,
  TOURNAMENT_MATCH_STATUS,
} = require('../models/TournamentMatch');
const { resolveMatchScheduledAt } = require('../utils/matchSchedule');
const { TournamentEnrollment } = require('../models/TournamentEnrollment');
const { canAccessPrivateContent } = require('../utils/accessControl');

const UPCOMING_LEAGUE_STATUSES = ['pendiente', 'propuesto', 'programado', 'revision'];
const UPCOMING_TOURNAMENT_STATUSES = [
  TOURNAMENT_MATCH_STATUS.PENDING,
  TOURNAMENT_MATCH_STATUS.SCHEDULED,
  TOURNAMENT_MATCH_STATUS.CONFIRMED,
];

function normalizeId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value.id) return value.id.toString();
    if (value._id) return value._id.toString();
  }
  return '';
}

function buildRanking(enrollments = [], matches = []) {
  return calculateRanking(enrollments, matches)
    .slice(0, 3)
    .map((entry, index) => ({
      ...entry,
      position: index + 1,
    }));
}

function serializeMatchPlayers(players = []) {
  if (!Array.isArray(players)) {
    return [];
  }

  return players
    .map((player) => {
      if (!player) {
        return null;
      }

      const serialized = {
        id: normalizeId(player),
        fullName: typeof player === 'object' ? player.fullName : undefined,
        photo: typeof player === 'object' ? player.photo : undefined,
      };

      if (player && typeof player === 'object' && Array.isArray(player.players)) {
        const nestedPlayers = player.players
          .map((member) => {
            if (!member) return null;
            return {
              id: normalizeId(member),
              fullName: typeof member === 'object' ? member.fullName : undefined,
              photo: typeof member === 'object' ? member.photo : undefined,
              email: typeof member === 'object' ? member.email : undefined,
            };
          })
          .filter((member) => member && (member.id || member.fullName || member.photo || member.email));

        if (nestedPlayers.length) {
          serialized.players = nestedPlayers;
        }
      }

      if (serialized.id || serialized.fullName || serialized.photo || serialized.players) {
        return serialized;
      }

      return null;
    })
    .filter(Boolean);
}

function serializeLeagueMatch(match) {
  const category = match.category || {};
  const league = category.league || match.league;
  const scheduledAt = resolveMatchScheduledAt(match);

  return {
    id: normalizeId(match),
    scope: 'league',
    scheduledAt,
    court: match.court,
    status: match.status,
    category: category
      ? {
          id: normalizeId(category),
          name: category.name,
          color: resolveCategoryColor(category.color),
        }
      : undefined,
    league: league
      ? {
          id: normalizeId(league),
          name: league.name,
        }
      : undefined,
    players: serializeMatchPlayers(match.players),
  };
}

function serializeTournamentMatch(match) {
  const scheduledAt = resolveMatchScheduledAt(match);

  return {
    id: normalizeId(match),
    scope: 'tournament',
    scheduledAt,
    court: match.court,
    status: match.status,
    category: match.category
      ? {
          id: normalizeId(match.category),
          name: match.category.name,
          color: resolveCategoryColor(match.category.color),
        }
      : undefined,
    tournament: match.tournament
      ? {
          id: normalizeId(match.tournament),
          name: match.tournament.name,
        }
      : undefined,
    players: serializeMatchPlayers(match.players),
  };
}

function summarizeDraw(category) {
  const rounds = Array.isArray(category.draw) ? category.draw : [];
  return rounds
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((round) => {
      const matches = Array.isArray(round.matches) ? round.matches : [];
      const completed = matches.filter((match) => normalizeId(match?.winner)).length;
      return {
        name: round.name,
        matches: matches.length,
        completed,
      };
    });
}

async function getGlobalOverview(req, res) {
  const now = new Date();

  const [leaguesRaw, tournamentsRaw, leagueMatchesRaw, tournamentMatchesRaw] = await Promise.all([
    League.find()
      .populate('categories', 'status')
      .sort({ startDate: 1, createdAt: 1 })
      .lean(),
    Tournament.find()
      .populate('categories', 'status')
      .sort({ startDate: 1, createdAt: 1 })
      .lean(),
    Match.find({
      status: { $in: UPCOMING_LEAGUE_STATUSES },
      $or: [
        { scheduledAt: { $gte: now } },
        { scheduledAt: { $exists: false } },
        { scheduledAt: null },
      ],
    })
      .populate('players', 'fullName photo')
      .populate({
        path: 'category',
        select: 'name color league',
        populate: { path: 'league', select: 'name isPrivate' },
      })
      .sort({ scheduledAt: 1 })
      .limit(12)
      .lean(),
    TournamentMatch.find({
      status: { $in: UPCOMING_TOURNAMENT_STATUSES },
      $or: [
        { scheduledAt: { $gte: now } },
        { scheduledAt: { $exists: false } },
        { scheduledAt: null },
      ],
    })
      .populate({
        path: 'players',
        select: 'fullName photo email players',
        options: { strictPopulate: false },
        populate: {
          path: 'players',
          select: 'fullName photo email',
          options: { strictPopulate: false },
        },
      })
      .populate('category', 'name color matchFormat')
      .populate('tournament', 'name status isPrivate')
      .sort({ scheduledAt: 1 })
      .limit(12)
      .lean({ virtuals: true }),
  ]);

  const canSeePrivate = canAccessPrivateContent(req.user);

  const visibleLeaguesRaw = canSeePrivate
    ? leaguesRaw
    : leaguesRaw.filter((league) => !league.isPrivate);
  const visibleTournamentsRaw = canSeePrivate
    ? tournamentsRaw
    : tournamentsRaw.filter((tournament) => !tournament.isPrivate);

  const visibleLeagueIds = new Set(visibleLeaguesRaw.map((league) => normalizeId(league)));
  const visibleTournamentIds = new Set(
    visibleTournamentsRaw.map((tournament) => normalizeId(tournament))
  );

  const formattedLeagues = visibleLeaguesRaw.map((league) => {
    const categories = Array.isArray(league.categories) ? league.categories : [];
    const activeCategories = categories.filter(
      (category) => category?.status === 'en_curso'
    ).length;
    const poster = typeof league.poster === 'string' ? league.poster.trim() : '';

    return {
      id: normalizeId(league),
      name: league.name,
      status: league.status,
      year: league.year,
      startDate: league.startDate,
      endDate: league.endDate,
      poster: poster || undefined,
      categoryCount: categories.length,
      activeCategories,
    };
  });

  const formattedTournaments = visibleTournamentsRaw.map((tournament) => {
    const categories = Array.isArray(tournament.categories) ? tournament.categories : [];
    const poster = typeof tournament.poster === 'string' ? tournament.poster.trim() : '';
    return {
      id: normalizeId(tournament),
      name: tournament.name,
      status: tournament.status,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      registrationCloseDate: tournament.registrationCloseDate,
      poster: poster || undefined,
      categoryCount: categories.length,
    };
  });

  const filteredLeagueMatches = leagueMatchesRaw
    .filter((match) => {
      const leagueId = normalizeId(match.category?.league || match.league);
      return !leagueId || visibleLeagueIds.has(leagueId);
    })
    .filter((match) => match.status === 'programado');

  const filteredTournamentMatches = tournamentMatchesRaw
    .filter((match) => {
      const tournamentId = normalizeId(match.tournament);
      return !tournamentId || visibleTournamentIds.has(tournamentId);
    })
    .filter((match) => match.status === TOURNAMENT_MATCH_STATUS.SCHEDULED);

  const courtSet = new Set();
  [...filteredLeagueMatches, ...filteredTournamentMatches].forEach((match) => {
    if (match.court) {
      courtSet.add(match.court.trim().toLowerCase());
    }
  });

  const upcomingMatches = [...filteredLeagueMatches, ...filteredTournamentMatches]
    .map((match) =>
      match.tournament ? serializeTournamentMatch(match) : serializeLeagueMatch(match)
    )
    .sort((a, b) => {
      const timeA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
      const timeB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    })
    .slice(0, 12);

  const totalCategories =
    visibleLeaguesRaw.reduce((sum, league) => sum + (league.categories?.length || 0), 0) +
    visibleTournamentsRaw.reduce(
      (sum, tournament) => sum + (tournament.categories?.length || 0),
      0
    );

  const metrics = {
    leagues: formattedLeagues.filter((league) => league.status !== LEAGUE_STATUS.CLOSED).length,
    tournaments: formattedTournaments.filter(
      (tournament) => tournament.status !== TOURNAMENT_STATUS.FINISHED
    ).length,
    categories: totalCategories,
    courts: courtSet.size,
  };

  return res.json({
    metrics,
    leagues: formattedLeagues,
    tournaments: formattedTournaments,
    upcomingMatches,
  });
}

async function getLeagueDashboard(req, res) {
  const now = new Date();
  const userId = req.user.id;
  const isAdmin = userHasRole(req.user, USER_ROLES.ADMIN);
  const activeLeaguesPromise = League.countDocuments({ status: LEAGUE_STATUS.ACTIVE });

  let categoryFilter = {};
  if (!isAdmin) {
    const accessibleCategoryIds = await Enrollment.find({ user: userId }).distinct('category');
    if (!accessibleCategoryIds.length) {
      const activeLeagues = await activeLeaguesPromise;
      return res.json({
        metrics: { players: 0, categories: 0, upcomingMatches: 0, activeLeagues },
        leagueRankings: [],
        upcomingMatches: [],
      });
    }
    categoryFilter = { _id: { $in: accessibleCategoryIds } };
  }

  const categories = await Category.find(categoryFilter)
    .populate('league', 'name status')
    .sort({ name: 1 })
    .lean();

  if (!categories.length) {
    const activeLeagues = await activeLeaguesPromise;
    return res.json({
      metrics: { players: 0, categories: 0, upcomingMatches: 0, activeLeagues },
      leagueRankings: [],
      upcomingMatches: [],
    });
  }

  const categoryIds = categories.map((category) => category._id.toString());

  const [enrollments, completedMatches, upcomingMatchesRaw, activeLeagues] = await Promise.all([
    Enrollment.find({ category: { $in: categoryIds } })
      .populate('user', 'fullName photo')
      .lean(),
    Match.find({
      category: { $in: categoryIds },
      status: 'completado',
      'result.status': 'confirmado',
    })
      .populate('players', 'fullName photo')
      .populate({
        path: 'category',
        select: 'name color league',
        populate: { path: 'league', select: 'name' },
      })
      .lean(),
    Match.find({
      category: { $in: categoryIds },
      status: { $in: UPCOMING_LEAGUE_STATUSES },
      $or: [
        { scheduledAt: { $gte: now } },
        { scheduledAt: { $exists: false } },
        { scheduledAt: null },
      ],
    })
      .populate('players', 'fullName photo')
      .populate({
        path: 'category',
        select: 'name color league',
        populate: { path: 'league', select: 'name' },
      })
      .sort({ scheduledAt: 1 })
      .limit(20)
      .lean(),
    activeLeaguesPromise,
  ]);

  const upcomingMatches = upcomingMatchesRaw.filter((match) => match.status === 'programado');

  const enrollmentMap = new Map();
  const completedMap = new Map();
  const upcomingMap = new Map();
  const playerIds = new Set();

  enrollments.forEach((enrollment) => {
    const categoryId = normalizeId(enrollment.category);
    if (!categoryId) return;
    if (!enrollmentMap.has(categoryId)) {
      enrollmentMap.set(categoryId, []);
    }
    enrollmentMap.get(categoryId).push(enrollment);
    const userIdValue = normalizeId(enrollment.user);
    if (userIdValue) {
      playerIds.add(userIdValue);
    }
  });

  completedMatches.forEach((match) => {
    const categoryId = normalizeId(match.category);
    if (!categoryId) return;
    if (!completedMap.has(categoryId)) {
      completedMap.set(categoryId, []);
    }
    completedMap.get(categoryId).push(match);
  });

  upcomingMatches.forEach((match) => {
    const categoryId = normalizeId(match.category);
    if (!categoryId) return;
    if (!upcomingMap.has(categoryId)) {
      upcomingMap.set(categoryId, []);
    }
    upcomingMap.get(categoryId).push(match);
  });

  const leagueRankingsMap = new Map();
  const categoriesById = new Map();

  categories.forEach((category) => {
    categoriesById.set(category._id.toString(), category);
  });

  const enrolledPlayers = [];

  categories.forEach((category) => {
    const categoryId = category._id.toString();
    const ranking = buildRanking(
      enrollmentMap.get(categoryId) || [],
      completedMap.get(categoryId) || []
    );
    const categoryPlayerIds = new Set(
      (enrollmentMap.get(categoryId) || []).map((enrollment) => normalizeId(enrollment.user)).filter(Boolean)
    );
    const upcomingCount = (upcomingMap.get(categoryId) || []).length;

    const league = category.league
      ? {
          id: normalizeId(category.league),
          name: category.league.name,
          status: category.league.status,
        }
      : undefined;

    if (league && league.status === LEAGUE_STATUS.ACTIVE) {
      if (!leagueRankingsMap.has(league.id)) {
        leagueRankingsMap.set(league.id, {
          league: {
            id: league.id,
            name: league.name,
          },
          categories: [],
        });
      }
      leagueRankingsMap.get(league.id).categories.push({
        category: {
          id: categoryId,
          name: category.name,
          color: resolveCategoryColor(category.color),
        },
        playerCount: categoryPlayerIds.size,
        upcomingMatches: upcomingCount,
        ranking,
      });
    }
  });

  enrollments.forEach((enrollment) => {
    const categoryId = normalizeId(enrollment.category);
    if (!categoryId) return;

    const category = categoriesById.get(categoryId);
    if (!category) return;

    const leagueId = normalizeId(category.league);
    if (!leagueId) return;

    const league = category.league;
    if (!league || league.status !== LEAGUE_STATUS.ACTIVE) {
      return;
    }

    const user = enrollment.user;
    if (!user) {
      return;
    }

    enrolledPlayers.push({
      player: {
        id: normalizeId(user),
        fullName: user.fullName,
        photo: user.photo,
      },
      category: {
        id: categoryId,
        name: category.name,
        color: resolveCategoryColor(category.color),
      },
      league: {
        id: leagueId,
        name: league.name,
      },
    });
  });

  enrolledPlayers.sort((a, b) => {
    const leagueCompare = (a.league?.name || '').localeCompare(b.league?.name || '', 'es', {
      sensitivity: 'base',
    });
    if (leagueCompare !== 0) {
      return leagueCompare;
    }

    const categoryCompare = (a.category?.name || '').localeCompare(b.category?.name || '', 'es', {
      sensitivity: 'base',
    });
    if (categoryCompare !== 0) {
      return categoryCompare;
    }

    return (a.player?.fullName || '').localeCompare(b.player?.fullName || '', 'es', {
      sensitivity: 'base',
    });
  });

  return res.json({
    metrics: {
      players: playerIds.size,
      categories: categories.length,
      upcomingMatches: upcomingMatches.length,
      activeLeagues,
    },
    leagueRankings: Array.from(leagueRankingsMap.values()),
    upcomingMatches: upcomingMatches.map(serializeLeagueMatch),
    enrolledPlayers,
  });
}

async function getTournamentDashboard(req, res) {
  const now = new Date();

  const categories = await TournamentCategory.find()
    .populate('tournament', 'name status isPrivate')
    .sort({ name: 1 })
    .lean();

  if (!categories.length) {
    return res.json({
      metrics: { tournaments: 0, categories: 0, upcomingMatches: 0 },
      categories: [],
      upcomingMatches: [],
    });
  }

  const canSeePrivate = canAccessPrivateContent(req.user);
  const visibleCategories = canSeePrivate
    ? categories
    : categories.filter((category) => !category.tournament?.isPrivate);

  if (!visibleCategories.length) {
    return res.json({
      metrics: { tournaments: 0, categories: 0, upcomingMatches: 0 },
      categories: [],
      upcomingMatches: [],
    });
  }

  const categoryIds = visibleCategories.map((category) => category._id.toString());

  const [upcomingMatchesRaw, enrollments] = await Promise.all([
    TournamentMatch.find({
      category: { $in: categoryIds },
      status: { $in: UPCOMING_TOURNAMENT_STATUSES },
      $or: [
        { scheduledAt: { $gte: now } },
        { scheduledAt: { $exists: false } },
        { scheduledAt: null },
      ],
    })
      .populate({
        path: 'players',
        select: 'fullName photo email players',
        options: { strictPopulate: false },
        populate: {
          path: 'players',
          select: 'fullName photo email',
          options: { strictPopulate: false },
        },
      })
      .populate('category', 'name color matchFormat')
      .populate('tournament', 'name status isPrivate')
      .sort({ scheduledAt: 1 })
      .limit(20)
      .lean({ virtuals: true }),
    TournamentEnrollment.find({ category: { $in: categoryIds } }).lean(),
  ]);

  const enrollmentCounts = new Map();
  enrollments.forEach((enrollment) => {
    const categoryId = normalizeId(enrollment.category);
    if (!categoryId) return;
    const current = enrollmentCounts.get(categoryId) || 0;
    enrollmentCounts.set(categoryId, current + 1);
  });

  const tournamentStatuses = new Map();
  visibleCategories.forEach((category) => {
    const tournament = category.tournament;
    if (!tournament) return;
    const id = normalizeId(tournament);
    if (!tournamentStatuses.has(id)) {
      tournamentStatuses.set(id, tournament.status);
    }
  });

  const visibleTournamentIds = new Set(
    visibleCategories
      .map((category) => normalizeId(category.tournament))
      .filter(Boolean)
  );

  const filteredUpcomingMatches = upcomingMatchesRaw
    .filter((match) => {
      const tournamentId = normalizeId(match.tournament);
      return !tournamentId || visibleTournamentIds.has(tournamentId);
    })
    .filter((match) => match.status === TOURNAMENT_MATCH_STATUS.SCHEDULED);

  const categoriesSummary = visibleCategories.map((category) => {
    const categoryId = category._id.toString();
    const drawSummary = summarizeDraw(category);
    const drawMatches = drawSummary.reduce((acc, round) => acc + round.matches, 0);

    return {
      category: {
        id: categoryId,
        name: category.name,
        color: resolveCategoryColor(category.color),
      },
      status: category.status,
      tournament: category.tournament
        ? {
            id: normalizeId(category.tournament),
            name: category.tournament.name,
          }
        : undefined,
      playerCount: enrollmentCounts.get(categoryId) || 0,
      drawMatches,
      drawSummary,
    };
  });

  const activeTournamentCount = Array.from(tournamentStatuses.values()).filter(
    (status) => status !== TOURNAMENT_STATUS.FINISHED
  ).length;

  return res.json({
    metrics: {
      tournaments: activeTournamentCount,
      categories: visibleCategories.length,
      upcomingMatches: filteredUpcomingMatches.length,
    },
    categories: categoriesSummary,
    upcomingMatches: filteredUpcomingMatches.map(serializeTournamentMatch),
  });
}

module.exports = {
  getGlobalOverview,
  getLeagueDashboard,
  getTournamentDashboard,
};
