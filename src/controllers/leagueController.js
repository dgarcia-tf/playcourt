const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { League, LEAGUE_STATUS } = require('../models/League');
const { refreshLeagueStatusIfExpired } = require('../services/leagueStatusService');
const {
  Category,
  CATEGORY_STATUSES,
  CATEGORY_SKILL_LEVELS,
  MATCH_FORMATS,
  DEFAULT_CATEGORY_MATCH_FORMAT,
} = require('../models/Category');
const { GENDERS } = require('../models/User');
const { Enrollment } = require('../models/Enrollment');
const { EnrollmentRequest } = require('../models/EnrollmentRequest');
const { Match } = require('../models/Match');
const { CourtReservation } = require('../models/CourtReservation');
const { Notification } = require('../models/Notification');
const { Season } = require('../models/Season');
const { CourtBlock, COURT_BLOCK_CONTEXTS } = require('../models/CourtBlock');
const { resolveCategoryColor } = require('../utils/colors');
const { normalizeId } = require('../utils/ranking');
const { canAccessPrivateContent } = require('../utils/accessControl');

const PAYMENT_STATUSES = ['pendiente', 'pagado', 'exento', 'fallido'];
const PAYMENT_STATUS_SET = new Set(PAYMENT_STATUSES);

function normalizePaymentStatus(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase();
}

function normalizeShirtSizes(sizes, hasShirt) {
  if (!hasShirt) {
    return [];
  }

  let values = sizes;
  if (typeof values === 'string') {
    values = values.split(/\r?\n|,/);
  }

  if (!Array.isArray(values)) {
    return [];
  }

  const normalized = values
    .map((size) => (typeof size === 'string' ? size.trim() : ''))
    .filter((size) => size.length);

  const unique = Array.from(new Set(normalized));

  return unique;
}

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    return ['true', '1', 'yes', 'on', 'si', 'sí'].includes(normalized);
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return Boolean(value);
}

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const LEAGUE_POSTER_UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads', 'leagues');

async function removeFileIfExists(filePath) {
  if (!filePath) {
    return;
  }

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

function buildPosterPublicPath(filename) {
  if (!filename) {
    return undefined;
  }

  return path.posix.join('uploads', 'leagues', filename);
}

async function createLeague(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    year,
    description,
    poster,
    startDate,
    endDate,
    registrationCloseDate,
    enrollmentFee,
    status,
    isPrivate,
    hasShirt = false,
    shirtSizes = [],
    categories = [],
    newCategories = [],
  } = req.body;

  if (startDate && endDate && endDate < startDate) {
    return res.status(400).json({ message: 'La fecha de finalización debe ser posterior a la fecha de inicio' });
  }

  if (startDate && registrationCloseDate && registrationCloseDate > startDate) {
    return res.status(400).json({
      message: 'La fecha máxima de inscripción debe ser anterior o igual al inicio de la liga',
    });
  }

  const distinctCategories = [...new Set((categories || []).map((id) => id.toString()))];

  const allowedSkillLevels = new Set(Object.values(CATEGORY_SKILL_LEVELS));
  const allowedMatchFormats = new Set(Object.values(MATCH_FORMATS));
  const normalizedNewCategories = Array.isArray(newCategories)
    ? newCategories
        .filter((category) => category && typeof category === 'object')
        .map((category) => {
          const name = typeof category.name === 'string' ? category.name.trim() : '';
          const description =
            typeof category.description === 'string' ? category.description.trim() : '';
          const gender = category.gender;
          const rawSkillLevel =
            typeof category.skillLevel === 'string' ? category.skillLevel.trim() : '';
          const skillLevel = rawSkillLevel || CATEGORY_SKILL_LEVELS.INTERMEDIATE;
          const rawMatchFormat =
            typeof category.matchFormat === 'string' ? category.matchFormat.trim() : '';
          const matchFormat = allowedMatchFormats.has(rawMatchFormat)
            ? rawMatchFormat
            : DEFAULT_CATEGORY_MATCH_FORMAT;

          return {
            name,
            description,
            gender,
            skillLevel,
            status: category.status,
            matchFormat,
            _rawSkillLevel: rawSkillLevel,
            _rawMatchFormat: rawMatchFormat,
          };
        })
    : [];

  if (normalizedNewCategories.some((category) => !category.name || !category.gender)) {
    return res
      .status(400)
      .json({ message: 'Las nuevas categorías deben incluir nombre y género válidos.' });
  }

  if (
    normalizedNewCategories.some(
      (category) => !Object.values(GENDERS).includes(category.gender)
    )
  ) {
    return res.status(400).json({ message: 'Alguna de las nuevas categorías tiene un género inválido.' });
  }

  if (
    normalizedNewCategories.some(
      (category) => category._rawSkillLevel && !allowedSkillLevels.has(category._rawSkillLevel)
    )
  ) {
    return res.status(400).json({ message: 'Alguna de las nuevas categorías tiene un nivel inválido.' });
  }

  if (
    normalizedNewCategories.some(
      (category) => category._rawMatchFormat && !allowedMatchFormats.has(category._rawMatchFormat)
    )
  ) {
    return res.status(400).json({ message: 'Alguna de las nuevas categorías tiene un formato de partido inválido.' });
  }

  if (
    normalizedNewCategories.some(
      (category) =>
        category.status && !Object.values(CATEGORY_STATUSES).includes(category.status)
    )
  ) {
    return res
      .status(400)
      .json({ message: 'Alguna de las nuevas categorías tiene un estado inválido.' });
  }

  const duplicateKey = (category) => `${category.name.toLowerCase()}::${category.gender}`;
  const duplicateSet = new Set();
  for (const category of normalizedNewCategories) {
    const key = duplicateKey(category);
    if (duplicateSet.has(key)) {
      return res.status(400).json({ message: 'No se pueden repetir nombre y género en nuevas categorías.' });
    }
    duplicateSet.add(key);
  }

  if (distinctCategories.length) {
    const foundCategories = await Category.find({ _id: { $in: distinctCategories } }).select('league name');
    if (foundCategories.length !== distinctCategories.length) {
      return res.status(400).json({ message: 'Alguna de las categorías especificadas no existe' });
    }

    const alreadyAssigned = foundCategories.find((category) => category.league);

    if (alreadyAssigned) {
      return res.status(409).json({
        message: `La categoría ${alreadyAssigned.name} ya está asignada a otra liga`,
      });
    }
  }

  const payload = {
    name,
    year,
    description,
    startDate,
    endDate,
    registrationCloseDate,
    enrollmentFee: typeof enrollmentFee === 'number' ? enrollmentFee : undefined,
    categories: distinctCategories.map((id) => new mongoose.Types.ObjectId(id)),
    createdBy: req.user.id,
    hasShirt: Boolean(hasShirt),
    shirtSizes: normalizeShirtSizes(shirtSizes, Boolean(hasShirt)),
  };

  if (typeof isPrivate === 'boolean') {
    payload.isPrivate = isPrivate;
  }

  const trimmedPoster = typeof poster === 'string' ? poster.trim() : '';
  if (trimmedPoster) {
    payload.poster = trimmedPoster;
  }

  if (typeof status !== 'undefined') {
    payload.status = status;
  }

  if (status === LEAGUE_STATUS.CLOSED) {
    payload.closedAt = new Date();
    payload.endDate = payload.endDate || payload.closedAt;
  }

  const league = await League.create(payload);

  if (distinctCategories.length) {
    await Category.updateMany(
      { _id: { $in: distinctCategories } },
      {
        league: league._id,
        startDate: league.startDate || null,
        endDate: league.endDate || null,
      }
    );
  }

  let createdCategories = [];
  if (normalizedNewCategories.length) {
    try {
      createdCategories = await Category.insertMany(
        normalizedNewCategories.map(({ _rawSkillLevel, _rawMatchFormat, ...category }) => ({
          ...category,
          status: category.status || CATEGORY_STATUSES.REGISTRATION,
          league: league._id,
          startDate: league.startDate || null,
          endDate: league.endDate || null,
        }))
      );
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: 'Ya existe una categoría con el mismo nombre y género en esta liga.',
        });
      }
      throw error;
    }
  }

  if (createdCategories.length) {
    league.categories.push(...createdCategories.map((category) => category._id));
    await league.save();
  }

  await league.populate(
    'categories',
    'name gender skillLevel startDate endDate status color matchFormat'
  );

  return res.status(201).json(league);
}

async function getLeagueOverview(req, res) {
  const { leagueId, includeClosed } = req.query;

  const rawLeagueIds = Array.isArray(leagueId)
    ? leagueId.filter((value) => typeof value === 'string')
    : typeof leagueId === 'string' && leagueId
      ? [leagueId]
      : [];

  const normalizedLeagueIds = rawLeagueIds
    .map((id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null))
    .filter(Boolean);

  if (rawLeagueIds.length && !normalizedLeagueIds.length) {
    return res.status(400).json({ message: 'Identificador de liga inválido' });
  }

  const leagueQuery = normalizedLeagueIds.length ? { _id: { $in: normalizedLeagueIds } } : {};
  const includeClosedLeagues = includeClosed || normalizedLeagueIds.length > 0;

  const leagueDocuments = await League.find(leagueQuery);
  await Promise.all(leagueDocuments.map((league) => refreshLeagueStatusIfExpired(league)));

  const canSeePrivate = canAccessPrivateContent(req.user);
  const visibleLeagueDocuments = canSeePrivate
    ? leagueDocuments
    : leagueDocuments.filter((league) => !league.isPrivate);

  if (!visibleLeagueDocuments.length) {
    return res.json({
      active: [],
      archived: [],
      rankingFilters: { active: [], finished: [], all: [] },
    });
  }

  const leagues = visibleLeagueDocuments.map((league) => league.toObject());

  const leagueIds = leagues.map((league) => league._id);

  const categories = await Category.find({ league: { $in: leagueIds } })
    .select(
      'name gender skillLevel status matchFormat color league rankingUpdatedAt startDate endDate'
    )
    .sort({ startDate: -1, endDate: -1, createdAt: -1, name: 1 })
    .lean();

  const categoryById = new Map();
  const categoriesByLeague = new Map();

  categories.forEach((category) => {
    const leagueId = normalizeId(category.league);
    const categoryId = normalizeId(category);
    categoryById.set(categoryId, category);
    if (!categoriesByLeague.has(leagueId)) {
      categoriesByLeague.set(leagueId, []);
    }
    categoriesByLeague.get(leagueId).push(category);
  });

  const categoryIds = categories.map((category) => category._id);

  const enrollments = categoryIds.length
    ? await Enrollment.find({ category: { $in: categoryIds } })
        .populate('user', 'fullName email phone gender photo')
        .lean()
    : [];

  const enrollmentCountByCategory = new Map();
  const playersByLeague = new Map();

  enrollments.forEach((enrollment) => {
    const categoryId = normalizeId(enrollment.category);
    const category = categoryById.get(categoryId);
    if (!category) {
      return;
    }

    enrollmentCountByCategory.set(
      categoryId,
      (enrollmentCountByCategory.get(categoryId) || 0) + 1
    );

    const leagueId = normalizeId(category.league);
    if (!leagueId) {
      return;
    }

    if (!playersByLeague.has(leagueId)) {
      playersByLeague.set(leagueId, new Map());
    }

    const playerMap = playersByLeague.get(leagueId);
    const user = enrollment.user;
    const userId = normalizeId(user);

    if (!userId || playerMap.has(userId)) {
      return;
    }

    playerMap.set(userId, {
      id: userId,
      fullName: typeof user?.fullName === 'string' ? user.fullName : '',
      email: user?.email || null,
      gender: user?.gender || null,
      phone: user?.phone || null,
      photo: user?.photo || null,
    });
  });

  const toSortableName = (value) => (typeof value === 'string' ? value : '');
  const toChronoTimestamp = (value) => {
    if (!value) {
      return Number.POSITIVE_INFINITY;
    }

    const date = value instanceof Date ? value : new Date(value);
    const time = date.getTime();
    return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
  };

  const compareChronologically = (a, b) => {
    const startDiff = toChronoTimestamp(a.startDate) - toChronoTimestamp(b.startDate);
    if (startDiff !== 0) {
      return startDiff;
    }

    const endDiff = toChronoTimestamp(a.endDate) - toChronoTimestamp(b.endDate);
    if (endDiff !== 0) {
      return endDiff;
    }

    return toSortableName(a.name).localeCompare(toSortableName(b.name), 'es', {
      sensitivity: 'base',
    });
  };

  const buildLeaguePayload = (league) => {
    const leagueId = normalizeId(league);
    const rawCategories = categoriesByLeague.get(leagueId) || [];

    const categoriesPayload = rawCategories
      .map((category) => {
        const categoryId = normalizeId(category);
        const enrollmentCount = enrollmentCountByCategory.get(categoryId) || 0;
        const normalizedColor = resolveCategoryColor(category.color);

        return {
          id: categoryId,
          name: category.name,
          gender: category.gender,
          skillLevel: category.skillLevel,
          status: category.status,
          matchFormat: category.matchFormat,
          color: normalizedColor,
          startDate: category.startDate || null,
          endDate: category.endDate || null,
          rankingUpdatedAt: category.rankingUpdatedAt || null,
          enrollmentCount,
        };
      })
      .sort(compareChronologically);

    const playerMap = playersByLeague.get(leagueId) || new Map();
    const players = Array.from(playerMap.values()).sort((a, b) =>
      toSortableName(a.fullName).localeCompare(toSortableName(b.fullName), 'es', {
        sensitivity: 'base',
      })
    );

    const totalEnrollments = categoriesPayload.reduce(
      (acc, category) => acc + category.enrollmentCount,
      0
    );

    return {
      id: leagueId,
      name: league.name,
      year: league.year || null,
      status: league.status,
      startDate: league.startDate || null,
      endDate: league.endDate || null,
      registrationCloseDate: league.registrationCloseDate || null,
      enrollmentFee:
        typeof league.enrollmentFee === 'number' ? league.enrollmentFee : null,
      categories: categoriesPayload,
      categoryCount: categoriesPayload.length,
      enrollmentCount: totalEnrollments,
      players,
      playerCount: players.length,
    };
  };

  const activeLeagues = [];
  const archivedLeagues = [];

  leagues.forEach((league) => {
    const payload = buildLeaguePayload(league);
    if (league.status === LEAGUE_STATUS.CLOSED) {
      if (!includeClosedLeagues) {
        return;
      }

      payload.players = [];
      payload.playerCount = 0;
      archivedLeagues.push(payload);
    } else {
      activeLeagues.push(payload);
    }
  });

  activeLeagues.sort(compareChronologically);
  archivedLeagues.sort(compareChronologically);

  const buildRankingFilter = (league) => ({
    leagueId: league.id,
    leagueName: league.name,
    year: league.year,
    status: league.status,
    startDate: league.startDate,
    endDate: league.endDate,
    categories: league.categories.map((category) => ({
      id: category.id,
      name: category.name,
      gender: category.gender,
      skillLevel: category.skillLevel,
      status: category.status,
      rankingUpdatedAt: category.rankingUpdatedAt,
    })),
  });

  const rankingFilters = {
    active: activeLeagues.map(buildRankingFilter),
    finished: archivedLeagues.map(buildRankingFilter),
  };

  const rankingFilterOrder = [...activeLeagues, ...archivedLeagues]
    .sort((a, b) => {
      const aClosed = a.status === LEAGUE_STATUS.CLOSED;
      const bClosed = b.status === LEAGUE_STATUS.CLOSED;
      if (aClosed !== bClosed) {
        return aClosed ? 1 : -1;
      }

      return compareChronologically(a, b);
    })
    .map(buildRankingFilter);

  rankingFilters.all = rankingFilterOrder;

  return res.json({ active: activeLeagues, archived: archivedLeagues, rankingFilters });
}

async function listLeagues(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { year, status, includeClosed } = req.query;

  const query = {};
  if (year) {
    query.year = Number(year);
  }

  const leagues = await League.find(query).populate(
    'categories',
    'name gender skillLevel color matchFormat'
  );

  await Promise.all(leagues.map((league) => refreshLeagueStatusIfExpired(league)));

  let filteredLeagues = leagues;

  if (status && typeof status === 'string') {
    filteredLeagues = leagues.filter((league) => league.status === status);
  } else if (!includeClosed) {
    filteredLeagues = leagues.filter((league) => league.status !== LEAGUE_STATUS.CLOSED);
  }

  if (!canAccessPrivateContent(req.user)) {
    filteredLeagues = filteredLeagues.filter((league) => !league.isPrivate);
  }

  const toTimestamp = (value) => {
    if (!value) {
      return Number.POSITIVE_INFINITY;
    }

    const date = value instanceof Date ? value : new Date(value);
    const time = date.getTime();
    return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
  };

  const resolveChronoValue = (league) => {
    const timestamps = [
      toTimestamp(league.startDate),
      toTimestamp(league.endDate),
      toTimestamp(league.createdAt),
    ];

    const numericYear = Number(league.year);
    if (Number.isFinite(numericYear)) {
      const yearTimestamp = new Date(numericYear, 0, 1).getTime();
      if (Number.isFinite(yearTimestamp)) {
        timestamps.push(yearTimestamp);
      }
    }

    return timestamps.reduce(
      (min, value) => (value < min ? value : min),
      Number.POSITIVE_INFINITY
    );
  };

  const compareByName = (a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' });

  filteredLeagues.sort((a, b) => {
    const aActive = a.status === LEAGUE_STATUS.ACTIVE;
    const bActive = b.status === LEAGUE_STATUS.ACTIVE;
    if (aActive !== bActive) {
      return aActive ? -1 : 1;
    }

    const chronoA = resolveChronoValue(a);
    const chronoB = resolveChronoValue(b);
    if (chronoA !== chronoB) {
      if (!Number.isFinite(chronoA)) {
        return 1;
      }
      if (!Number.isFinite(chronoB)) {
        return -1;
      }
      return chronoA - chronoB;
    }

    return compareByName(a, b);
  });

  return res.json(filteredLeagues);
}

async function getLeagueDetail(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { leagueId } = req.params;

  const league = await League.findById(leagueId)
    .populate('categories', 'name gender skillLevel color matchFormat')
    .populate('payments.user', 'fullName email phone photo preferredSchedule')
    .populate('payments.recordedBy', 'fullName email');
  if (!league) {
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  if (league.isPrivate && !canAccessPrivateContent(req.user)) {
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  await refreshLeagueStatusIfExpired(league);

  const result = league.toObject();
  const toTimestamp = (value) => (value ? new Date(value).getTime() : -Infinity);
  result.hasShirt = Boolean(result.hasShirt);
  result.shirtSizes = Array.isArray(result.shirtSizes)
    ? result.shirtSizes.filter((size) => typeof size === 'string' && size.trim()).map((size) => size.trim())
    : [];
  result.payments = Array.isArray(result.payments)
    ? [...result.payments].sort((a, b) => {
        const paidDiff = toTimestamp(b.paidAt) - toTimestamp(a.paidAt);
        if (paidDiff !== 0) {
          return paidDiff;
        }
        return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
      })
    : [];

  return res.json({ league: result });
}

async function listLeagueEnrollments(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { leagueId } = req.params;

  const league = await League.findById(leagueId).select(
    'name year status startDate endDate isPrivate'
  );

  if (!league) {
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  if (league.isPrivate && !canAccessPrivateContent(req.user)) {
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  await refreshLeagueStatusIfExpired(league);

  const categories = await Category.find({ league: leagueId }).select(
    'name gender skillLevel color matchFormat status minimumAge'
  );

  const leagueSummary = {
    id: league.id,
    name: league.name,
    year: league.year || null,
    status: league.status,
    startDate: league.startDate || null,
    endDate: league.endDate || null,
    hasShirt: Boolean(league.hasShirt),
    shirtSizes: normalizeShirtSizes(league.shirtSizes || [], Boolean(league.hasShirt)),
  };

  const normalizeMinimumAge = (value) => {
    if (value === undefined || value === null) {
      return null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  if (!categories.length) {
    return res.json({
      league: leagueSummary,
      totalPlayers: 0,
      players: [],
      categories: categories.map((category) => ({
        id: category._id.toString(),
        name: category.name,
        gender: category.gender,
        skillLevel: category.skillLevel,
        matchFormat: category.matchFormat,
        color: resolveCategoryColor(category.color),
        status: category.status,
        minimumAge: normalizeMinimumAge(category.minimumAge),
        enrollmentCount: 0,
        players: [],
      })),
    });
  }

  const categoryIds = categories.map((category) => category._id);

  const enrollments = await Enrollment.find({ category: { $in: categoryIds } })
    .populate('user', 'fullName email gender phone photo preferredSchedule birthDate')
    .populate('category', 'name gender skillLevel color matchFormat status minimumAge');

  const categoryPlayerMap = new Map();
  const playerMap = new Map();

  enrollments.forEach((enrollment) => {
    const user = enrollment.user;
    const category = enrollment.category;

    if (!user || !category) {
      return;
    }

    const categoryId = category._id ? category._id.toString() : String(category);
    const userId = user._id ? user._id.toString() : String(user);
    const rawShirtSize = typeof enrollment.shirtSize === 'string' ? enrollment.shirtSize.trim() : '';
    const shirtSize = rawShirtSize || null;

    const categoryPayload = {
      id: categoryId,
      name: category.name,
      gender: category.gender,
      skillLevel: category.skillLevel,
      matchFormat: category.matchFormat,
      color: resolveCategoryColor(category.color),
      status: category.status,
      minimumAge: normalizeMinimumAge(category.minimumAge),
    };

    const userPayload = {
      id: userId,
      fullName: user.fullName,
      email: user.email,
      gender: user.gender,
      phone: user.phone,
      photo: user.photo || null,
      preferredSchedule: user.preferredSchedule || null,
      birthDate: user.birthDate || null,
      shirtSize,
    };

    if (!playerMap.has(userId)) {
      playerMap.set(userId, { ...userPayload, categories: [] });
    }

    const playerEntry = playerMap.get(userId);
    if (shirtSize && !playerEntry.shirtSize) {
      playerEntry.shirtSize = shirtSize;
    }
    if (!playerEntry.categories.some((entry) => entry.id === categoryId)) {
      playerEntry.categories.push(categoryPayload);
    }

    if (!categoryPlayerMap.has(categoryId)) {
      categoryPlayerMap.set(categoryId, []);
    }

    const categoryPlayers = categoryPlayerMap.get(categoryId);
    if (!categoryPlayers.some((player) => player.id === userId)) {
      categoryPlayers.push({ ...userPayload });
    }
  });

  const sortByName = (a, b) =>
    String(a.fullName || '').localeCompare(String(b.fullName || ''), 'es', {
      sensitivity: 'base',
    });

  const players = Array.from(playerMap.values()).map((player) => ({
    ...player,
    categories: player.categories.sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), 'es', {
        sensitivity: 'base',
      })
    ),
  }));

  players.sort(sortByName);

  const categoriesPayload = categories.map((category) => {
    const categoryId = category._id.toString();
    const playersInCategory = categoryPlayerMap.get(categoryId) || [];
    playersInCategory.sort(sortByName);

    return {
      id: categoryId,
      name: category.name,
      gender: category.gender,
      skillLevel: category.skillLevel,
      matchFormat: category.matchFormat,
      color: resolveCategoryColor(category.color),
      status: category.status,
      minimumAge: normalizeMinimumAge(category.minimumAge),
      enrollmentCount: playersInCategory.length,
      players: playersInCategory,
    };
  });

  return res.json({
    league: leagueSummary,
    totalPlayers: players.length,
    players,
    categories: categoriesPayload,
  });
}

async function addLeaguePaymentRecord(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { leagueId } = req.params;
  const { user, amount, status, method, reference, notes, paidAt, shirtDelivered } = req.body;

  const league = await League.findById(leagueId);
  if (!league) {
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  const normalizedStatus = normalizePaymentStatus(status);
  const record = {
    status: PAYMENT_STATUS_SET.has(normalizedStatus) ? normalizedStatus : 'pendiente',
    recordedBy: req.user.id,
  };

  if (user) {
    record.user = new mongoose.Types.ObjectId(user);
  }

  const numericAmount = Number(amount);
  if (Number.isFinite(numericAmount) && numericAmount >= 0) {
    record.amount = numericAmount;
  } else if (Number.isFinite(Number(league.enrollmentFee))) {
    record.amount = Number(league.enrollmentFee);
  }

  const trimmedMethod = typeof method === 'string' ? method.trim() : '';
  if (trimmedMethod) {
    record.method = trimmedMethod;
  }

  const trimmedReference = typeof reference === 'string' ? reference.trim() : '';
  if (trimmedReference) {
    record.reference = trimmedReference;
  }

  const trimmedNotes = typeof notes === 'string' ? notes.trim() : '';
  if (trimmedNotes) {
    record.notes = trimmedNotes;
  }

  if (paidAt) {
    record.paidAt = new Date(paidAt);
  }

  record.shirtDelivered = parseBoolean(shirtDelivered);

  league.payments.push(record);
  await league.save();

  await league.populate([
    { path: 'payments.user', select: 'fullName email phone photo preferredSchedule' },
    { path: 'payments.recordedBy', select: 'fullName email' },
  ]);

  return res.status(201).json(league.payments[league.payments.length - 1]);
}

async function updateLeaguePaymentRecord(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { leagueId, paymentId } = req.params;
  const updates = req.body || {};

  const league = await League.findById(leagueId);
  if (!league) {
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  const payment = league.payments.id(paymentId);
  if (!payment) {
    return res.status(404).json({ message: 'Registro de pago no encontrado' });
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'user')) {
    payment.user = updates.user ? new mongoose.Types.ObjectId(updates.user) : undefined;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'amount')) {
    const numericAmount = Number(updates.amount);
    if (Number.isFinite(numericAmount) && numericAmount >= 0) {
      payment.amount = numericAmount;
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
    const normalizedStatus = normalizePaymentStatus(updates.status);
    if (PAYMENT_STATUS_SET.has(normalizedStatus)) {
      payment.status = normalizedStatus;
    }
  }

  ['method', 'reference', 'notes'].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      const value = typeof updates[field] === 'string' ? updates[field].trim() : updates[field];
      payment[field] = value ? value : undefined;
    }
  });

  if (Object.prototype.hasOwnProperty.call(updates, 'paidAt')) {
    payment.paidAt = updates.paidAt ? new Date(updates.paidAt) : undefined;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'shirtDelivered')) {
    payment.shirtDelivered = parseBoolean(updates.shirtDelivered);
  }

  payment.recordedBy = req.user.id;

  await league.save();

  await league.populate([
    { path: 'payments.user', select: 'fullName email phone photo preferredSchedule' },
    { path: 'payments.recordedBy', select: 'fullName email' },
  ]);

  const updatedPayment = league.payments.id(paymentId);

  return res.json(updatedPayment);
}

async function updateLeague(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { leagueId } = req.params;
  const {
    name,
    year,
    description,
    poster,
    startDate,
    endDate,
    registrationCloseDate,
    enrollmentFee,
    status,
    isPrivate,
    hasShirt,
    shirtSizes,
    categories,
  } = req.body;

  const league = await League.findById(leagueId);
  if (!league) {
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  if (name) {
    league.name = name.trim();
  }

  if (typeof year !== 'undefined') {
    league.year = year;
  }

  if (typeof description !== 'undefined') {
    league.description = description ? description.trim() : undefined;
  }

  const previousPosterFilename = league.posterFile?.filename;
  const previousPosterPublicPath = previousPosterFilename
    ? `/${buildPosterPublicPath(previousPosterFilename)}`
    : null;
  let posterFileToRemove = null;
  if (typeof poster !== 'undefined') {
    const trimmedPoster = typeof poster === 'string' ? poster.trim() : '';
    if (trimmedPoster) {
      if (previousPosterPublicPath && trimmedPoster !== previousPosterPublicPath) {
        posterFileToRemove = path.join(LEAGUE_POSTER_UPLOAD_DIR, previousPosterFilename);
        league.posterFile = undefined;
      }
      league.poster = trimmedPoster;
    } else {
      if (previousPosterFilename) {
        posterFileToRemove = path.join(LEAGUE_POSTER_UPLOAD_DIR, previousPosterFilename);
      }
      league.poster = undefined;
      league.posterFile = undefined;
    }
  }

  if (typeof startDate !== 'undefined') {
    league.startDate = startDate || undefined;
  }

  if (typeof endDate !== 'undefined') {
    league.endDate = endDate || undefined;
  }

  if (typeof registrationCloseDate !== 'undefined') {
    league.registrationCloseDate = registrationCloseDate || undefined;
  }

  if (league.startDate && league.endDate && league.endDate < league.startDate) {
    return res.status(400).json({ message: 'La fecha de finalización debe ser posterior a la fecha de inicio' });
  }

  if (
    league.startDate &&
    league.registrationCloseDate &&
    league.registrationCloseDate > league.startDate
  ) {
    return res.status(400).json({
      message: 'La fecha máxima de inscripción debe ser anterior o igual al inicio de la liga',
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'hasShirt')) {
    league.hasShirt = Boolean(hasShirt);
    if (!league.hasShirt) {
      league.shirtSizes = [];
    }
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'shirtSizes')) {
    league.shirtSizes = normalizeShirtSizes(shirtSizes, league.hasShirt);
  }

  if (typeof enrollmentFee !== 'undefined') {
    league.enrollmentFee = enrollmentFee === null ? undefined : enrollmentFee;
  }

  if (typeof status !== 'undefined') {
    league.status = status;
    if (status === LEAGUE_STATUS.CLOSED) {
      league.closedAt = league.closedAt || new Date();
      if (!league.endDate) {
        league.endDate = league.closedAt;
      }
    } else if (status === LEAGUE_STATUS.ACTIVE) {
      league.closedAt = undefined;
    }
  }

  if (typeof isPrivate !== 'undefined') {
    league.isPrivate = Boolean(isPrivate);
  }

  if (Array.isArray(categories)) {
    const distinct = [...new Set(categories.map((id) => id.toString()))];
    const foundCategories = await Category.find({ _id: { $in: distinct } }).select('league name');
    if (foundCategories.length !== distinct.length) {
      return res.status(400).json({ message: 'Alguna de las categorías especificadas no existe' });
    }

    const conflicts = foundCategories.filter(
      (category) => category.league && category.league.toString() !== leagueId
    );

    if (conflicts.length) {
      return res.status(409).json({
        message: `La categoría ${conflicts[0].name} ya está asignada a otra liga`,
      });
    }

    const currentIds = (league.categories || []).map((id) => id.toString());
    const toRemove = currentIds.filter((id) => !distinct.includes(id));
    const toAdd = distinct.filter((id) => !currentIds.includes(id));

    if (toRemove.length) {
      await Category.updateMany({ _id: { $in: toRemove } }, { $unset: { league: '' } });
    }

    if (toAdd.length) {
      await Category.updateMany({ _id: { $in: toAdd } }, { league: league._id });
    }

    league.categories = distinct.map((id) => new mongoose.Types.ObjectId(id));
  }

  await league.save();

  await league.populate('categories', 'name gender skillLevel color');

  if (posterFileToRemove) {
    await removeFileIfExists(posterFileToRemove);
  }

  return res.json(league);
}

async function uploadLeaguePoster(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { leagueId } = req.params;
  const { file } = req;

  if (!file) {
    return res.status(400).json({ message: 'No se recibió ningún archivo de imagen' });
  }

  const league = await League.findById(leagueId);
  if (!league) {
    await removeFileIfExists(file.path);
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  const previousPosterPath = league.posterFile?.filename
    ? path.join(LEAGUE_POSTER_UPLOAD_DIR, league.posterFile.filename)
    : null;

  const relativePosterPath = buildPosterPublicPath(file.filename);
  league.poster = relativePosterPath ? `/${relativePosterPath}` : undefined;
  league.posterFile = {
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  };

  await league.save();

  if (previousPosterPath) {
    await removeFileIfExists(previousPosterPath);
  }

  return res.status(201).json({ poster: league.poster, posterFile: league.posterFile });
}

async function deleteLeague(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { leagueId } = req.params;

  const league = await League.findById(leagueId);
  if (!league) {
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  const posterPath = league.posterFile?.filename
    ? path.join(LEAGUE_POSTER_UPLOAD_DIR, league.posterFile.filename)
    : null;
  const performDelete = async (session = null) => {
    const categoriesQuery = Category.find({ league: league._id }).select('_id').lean();
    if (session) {
      categoriesQuery.session(session);
    }
    const categories = await categoriesQuery;
    const categoryIds = categories.map((category) => category._id);

    const matchQuery = { $or: [{ league: league._id }] };
    if (categoryIds.length) {
      matchQuery.$or.push({ category: { $in: categoryIds } });
    }

    const matchesQuery = Match.find(matchQuery).select('_id').lean();
    if (session) {
      matchesQuery.session(session);
    }
    const matches = await matchesQuery;
    const matchIds = matches.map((match) => match._id);

    const tasks = [];

    const deleteMatches = Match.deleteMany(matchQuery);
    if (session) {
      deleteMatches.session(session);
    }
    tasks.push(deleteMatches);

    const deleteCourtBlocks = CourtBlock.deleteMany({
      contextType: COURT_BLOCK_CONTEXTS.LEAGUE,
      context: league._id,
    });
    if (session) {
      deleteCourtBlocks.session(session);
    }
    tasks.push(deleteCourtBlocks);

    if (categoryIds.length) {
      const enrollmentDelete = Enrollment.deleteMany({ category: { $in: categoryIds } });
      if (session) {
        enrollmentDelete.session(session);
      }

      const enrollmentRequestDelete = EnrollmentRequest.deleteMany({ category: { $in: categoryIds } });
      if (session) {
        enrollmentRequestDelete.session(session);
      }

      const seasonUpdate = Season.updateMany(
        { categories: { $in: categoryIds } },
        { $pull: { categories: { $in: categoryIds } } }
      );
      if (session) {
        seasonUpdate.session(session);
      }

      const categoryDelete = Category.deleteMany({ _id: { $in: categoryIds } });
      if (session) {
        categoryDelete.session(session);
      }

      tasks.push(enrollmentDelete, enrollmentRequestDelete, seasonUpdate, categoryDelete);
    }

    if (matchIds.length) {
      const reservationDelete = CourtReservation.deleteMany({ match: { $in: matchIds } });
      if (session) {
        reservationDelete.session(session);
      }

      const notificationDelete = Notification.deleteMany({ match: { $in: matchIds } });
      if (session) {
        notificationDelete.session(session);
      }

      tasks.push(reservationDelete, notificationDelete);
    }

    await Promise.all(tasks);

    const leagueDelete = League.deleteOne({ _id: league._id });
    if (session) {
      leagueDelete.session(session);
    }

    await leagueDelete;
  };

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await performDelete(session);
    });
  } catch (error) {
    if (error?.code === 20 || error?.codeName === 'IllegalOperation') {
      await performDelete();
    } else {
      throw error;
    }
  } finally {
    await session.endSession();
  }

  if (posterPath) {
    await removeFileIfExists(posterPath);
  }

  return res.status(204).send();
}

module.exports = {
  createLeague,
  getLeagueOverview,
  listLeagues,
  getLeagueDetail,
  listLeagueEnrollments,
  addLeaguePaymentRecord,
  updateLeaguePaymentRecord,
  uploadLeaguePoster,
  updateLeague,
  deleteLeague,
};

