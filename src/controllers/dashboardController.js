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
const { TournamentEnrollment } = require('../models/TournamentEnrollment');

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

function serializeLeagueMatch(match) {
  const category = match.category || {};
  const league = category.league || match.league;

  return {
    id: normalizeId(match),
    scope: 'league',
    scheduledAt: match.scheduledAt,
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
    players: Array.isArray(match.players)
      ? match.players.map((player) => ({
          id: normalizeId(player),
          fullName: typeof player === 'object' ? player.fullName : undefined,
          photo: typeof player === 'object' ? player.photo : undefined,
        }))
      : [],
  };
}

function serializeTournamentMatch(match) {
  return {
    id: normalizeId(match),
    scope: 'tournament',
    scheduledAt: match.scheduledAt,
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
    players: Array.isArray(match.players)
      ? match.players.map((player) => ({
          id: normalizeId(player),
          fullName: typeof player === 'object' ? player.fullName : undefined,
          photo: typeof player === 'object' ? player.photo : undefined,
        }))
      : [],
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

  const [
    leaguesRaw,
    tournamentsRaw,
    leagueMatchesRaw,
    tournamentMatchesRaw,
    leagueCategoryCount,
    tournamentCategoryCount,
  ] = await Promise.all([
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
        populate: { path: 'league', select: 'name' },
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
      .populate('players', 'fullName photo')
      .populate('category', 'name color')
      .populate('tournament', 'name status')
      .sort({ scheduledAt: 1 })
      .limit(12)
      .lean(),
    Category.countDocuments(),
    TournamentCategory.countDocuments(),
  ]);

  const formattedLeagues = leaguesRaw.map((league) => {
    const categories = Array.isArray(league.categories) ? league.categories : [];
    const activeCategories = categories.filter(
      (category) => category?.status === 'en_curso'
    ).length;

    return {
      id: normalizeId(league),
      name: league.name,
      status: league.status,
      year: league.year,
      startDate: league.startDate,
      endDate: league.endDate,
      categoryCount: categories.length,
      activeCategories,
    };
  });

  const formattedTournaments = tournamentsRaw.map((tournament) => {
    const categories = Array.isArray(tournament.categories) ? tournament.categories : [];
    return {
      id: normalizeId(tournament),
      name: tournament.name,
      status: tournament.status,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      registrationCloseDate: tournament.registrationCloseDate,
      categoryCount: categories.length,
    };
  });

  const courtSet = new Set();
  [...leagueMatchesRaw, ...tournamentMatchesRaw].forEach((match) => {
    if (match.court) {
      courtSet.add(match.court.trim().toLowerCase());
    }
  });

  const upcomingMatches = [...leagueMatchesRaw, ...tournamentMatchesRaw]
    .map((match) =>
      match.tournament ? serializeTournamentMatch(match) : serializeLeagueMatch(match)
    )
    .sort((a, b) => {
      const timeA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
      const timeB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    })
    .slice(0, 12);

  const totalCategories = Number(leagueCategoryCount || 0) + Number(tournamentCategoryCount || 0);

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

  let categoryFilter = {};
  if (!isAdmin) {
    const accessibleCategoryIds = await Enrollment.find({ user: userId }).distinct('category');
    if (!accessibleCategoryIds.length) {
      return res.json({
        metrics: { players: 0, categories: 0, upcomingMatches: 0 },
        categories: [],
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
    return res.json({
      metrics: { players: 0, categories: 0, upcomingMatches: 0 },
      categories: [],
      upcomingMatches: [],
    });
  }

  const categoryIds = categories.map((category) => category._id.toString());

  const [enrollments, completedMatches, upcomingMatches] = await Promise.all([
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
  ]);

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

  const categoriesSummary = categories.map((category) => {
    const categoryId = category._id.toString();
    const ranking = buildRanking(
      enrollmentMap.get(categoryId) || [],
      completedMap.get(categoryId) || []
    );
    const categoryPlayerIds = new Set(
      (enrollmentMap.get(categoryId) || []).map((enrollment) => normalizeId(enrollment.user)).filter(Boolean)
    );
    const upcomingCount = (upcomingMap.get(categoryId) || []).length;

    return {
      category: {
        id: categoryId,
        name: category.name,
        color: resolveCategoryColor(category.color),
      },
      league: category.league
        ? {
            id: normalizeId(category.league),
            name: category.league.name,
          }
        : undefined,
      playerCount: categoryPlayerIds.size,
      upcomingMatches: upcomingCount,
      ranking,
    };
  });

  return res.json({
    metrics: {
      players: playerIds.size,
      categories: categories.length,
      upcomingMatches: upcomingMatches.length,
    },
    categories: categoriesSummary,
    upcomingMatches: upcomingMatches.map(serializeLeagueMatch),
  });
}

async function getTournamentDashboard(req, res) {
  const now = new Date();

  const categories = await TournamentCategory.find()
    .populate('tournament', 'name status')
    .sort({ name: 1 })
    .lean();

  if (!categories.length) {
    return res.json({
      metrics: { tournaments: 0, categories: 0, upcomingMatches: 0 },
      categories: [],
      upcomingMatches: [],
    });
  }

  const categoryIds = categories.map((category) => category._id.toString());

  const [upcomingMatches, enrollments] = await Promise.all([
    TournamentMatch.find({
      category: { $in: categoryIds },
      status: { $in: UPCOMING_TOURNAMENT_STATUSES },
      $or: [
        { scheduledAt: { $gte: now } },
        { scheduledAt: { $exists: false } },
        { scheduledAt: null },
      ],
    })
      .populate('players', 'fullName photo')
      .populate('category', 'name color')
      .populate('tournament', 'name status')
      .sort({ scheduledAt: 1 })
      .limit(20)
      .lean(),
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
  categories.forEach((category) => {
    const tournament = category.tournament;
    if (!tournament) return;
    const id = normalizeId(tournament);
    if (!tournamentStatuses.has(id)) {
      tournamentStatuses.set(id, tournament.status);
    }
  });

  const categoriesSummary = categories.map((category) => {
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
      categories: categories.length,
      upcomingMatches: upcomingMatches.length,
    },
    categories: categoriesSummary,
    upcomingMatches: upcomingMatches.map(serializeTournamentMatch),
  });
}

module.exports = {
  getGlobalOverview,
  getLeagueDashboard,
  getTournamentDashboard,
};
