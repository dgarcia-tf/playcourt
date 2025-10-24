const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Tournament, TOURNAMENT_STATUS } = require('../models/Tournament');
const {
  TournamentCategory,
  TOURNAMENT_CATEGORY_MATCH_TYPES,
  TOURNAMENT_CATEGORY_STATUSES,
} = require('../models/TournamentCategory');
const {
  TournamentEnrollment,
  TOURNAMENT_ENROLLMENT_STATUS,
} = require('../models/TournamentEnrollment');
const { TournamentDoublesPair } = require('../models/TournamentDoublesPair');
const { User, USER_ROLES, userHasRole } = require('../models/User');
const { canAccessPrivateContent } = require('../utils/accessControl');
const { categoryAllowsGender } = require('../utils/gender');
const { hasCategoryMinimumAgeRequirement } = require('../utils/age');

async function ensureTournament(tournamentId) {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    const error = new Error('Torneo no encontrado');
    error.statusCode = 404;
    throw error;
  }

  return tournament;
}

function toPlainObject(document) {
  if (!document) return null;
  if (typeof document.toObject === 'function') {
    return document.toObject({ virtuals: true });
  }
  return document;
}

function sanitizeUser(user) {
  const plain = toPlainObject(user);
  if (!plain) {
    return null;
  }

  const id = plain._id ? plain._id.toString() : plain.id ? plain.id.toString() : '';

  return {
    id,
    _id: id,
    fullName: plain.fullName || '',
    email: plain.email || '',
    phone: plain.phone || '',
    gender: plain.gender || '',
    photo: plain.photo || '',
    birthDate: plain.birthDate || null,
    isMember: Boolean(plain.isMember),
    preferredSchedule: plain.preferredSchedule || null,
    shirtSize: plain.shirtSize || null,
  };
}

function sanitizeCategory(category) {
  const plain = toPlainObject(category);
  if (!plain) {
    return null;
  }

  const id = plain._id ? plain._id.toString() : plain.id ? plain.id.toString() : '';

  if (!id) {
    return null;
  }

  return {
    id,
    _id: id,
    name: plain.name || '',
    menuTitle: plain.menuTitle || '',
    matchType: plain.matchType || '',
    gender: plain.gender || '',
  };
}

function createCategoryEntry(enrollment) {
  const category = sanitizeCategory(enrollment.category);
  const fallbackCategory = category || {
    id: '',
    _id: '',
    name: 'Categoría no disponible',
    menuTitle: 'Categoría no disponible',
    matchType: '',
    gender: '',
  };

  return {
    enrollmentId: enrollment._id ? enrollment._id.toString() : '',
    status: enrollment.status,
    shirtSize: enrollment.shirtSize || null,
    category: fallbackCategory,
  };
}

function collectUniqueShirtSizes(entries = []) {
  const unique = new Set();
  entries.forEach((entry) => {
    const value = typeof entry?.shirtSize === 'string' ? entry.shirtSize.trim() : '';
    if (value) {
      unique.add(value);
    }
  });
  return Array.from(unique.values());
}

function sanitizeEnrollmentMetadata(metadata) {
  if (!metadata) {
    return {};
  }

  if (metadata instanceof Map) {
    return Array.from(metadata.entries()).reduce((acc, [key, value]) => {
      if (typeof key === 'string') {
        acc[key] = typeof value === 'string' ? value : value != null ? String(value) : '';
      }
      return acc;
    }, {});
  }

  if (typeof metadata === 'object') {
    return Object.entries(metadata).reduce((acc, [key, value]) => {
      if (typeof key === 'string') {
        acc[key] = typeof value === 'string' ? value : value != null ? String(value) : '';
      }
      return acc;
    }, {});
  }

  return {};
}

async function getTournamentPlayerCategoryMap(tournamentId, userIds = []) {
  if (!tournamentId) {
    return new Map();
  }

  const filter = { tournament: tournamentId };
  if (Array.isArray(userIds) && userIds.length) {
    filter.user = { $in: userIds };
  }

  const enrollments = await TournamentEnrollment.find(filter)
    .populate('category', 'name menuTitle matchType gender')
    .select('_id category status shirtSize user createdAt')
    .sort({ createdAt: 1 })
    .lean();

  const map = new Map();

  enrollments.forEach((entry) => {
    const userId =
      (entry.user && typeof entry.user.toString === 'function' && entry.user.toString()) ||
      (typeof entry.user === 'string' ? entry.user : '');

    if (!userId) {
      return;
    }

    if (!map.has(userId)) {
      map.set(userId, []);
    }

    map.get(userId).push(createCategoryEntry(entry));
  });

  map.forEach((categoryList) => {
    categoryList.sort((a, b) => {
      const labelA = (a.category?.menuTitle || a.category?.name || '').toLowerCase();
      const labelB = (b.category?.menuTitle || b.category?.name || '').toLowerCase();
      return labelA.localeCompare(labelB, 'es');
    });
  });

  return map;
}

async function ensureTournamentAndCategory(tournamentId, categoryId) {
  const [tournament, category] = await Promise.all([
    Tournament.findById(tournamentId),
    TournamentCategory.findOne({ _id: categoryId, tournament: tournamentId }),
  ]);

  if (!tournament) {
    const error = new Error('Torneo no encontrado');
    error.statusCode = 404;
    throw error;
  }

  if (!category) {
    const error = new Error('Categoría no encontrada');
    error.statusCode = 404;
    throw error;
  }

  return { tournament, category };
}

async function ensureTournamentAndCategories(tournamentId, categoryIds = []) {
  const normalizedIds = Array.from(
    new Set(
      categoryIds
        .map((id) => (typeof id === 'string' ? id.trim() : ''))
        .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
    )
  );

  const [tournament, categories] = await Promise.all([
    Tournament.findById(tournamentId),
    TournamentCategory.find({ _id: { $in: normalizedIds }, tournament: tournamentId }),
  ]);

  if (!tournament) {
    const error = new Error('Torneo no encontrado');
    error.statusCode = 404;
    throw error;
  }

  if (normalizedIds.length !== categories.length) {
    const error = new Error('Una o más categorías no pertenecen al torneo');
    error.statusCode = 404;
    throw error;
  }

  const categoryMap = new Map(
    categories.map((category) => [category._id ? category._id.toString() : category.id, category])
  );

  const orderedCategories = normalizedIds.map((id) => categoryMap.get(id));

  if (orderedCategories.some((category) => !category)) {
    const error = new Error('Una o más categorías no pertenecen al torneo');
    error.statusCode = 404;
    throw error;
  }

  return { tournament, categories: orderedCategories };
}

async function createTournamentEnrollment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;
  const requestedUserId = req.body?.userId;
  const requestedShirtSize = typeof req.body?.shirtSize === 'string' ? req.body.shirtSize.trim() : '';
  let resolvedShirtSize = requestedShirtSize ? requestedShirtSize.toUpperCase() : '';
  const isAdmin = userHasRole(req.user, USER_ROLES.ADMIN);
  const playerId = requestedUserId && (isAdmin || requestedUserId === req.user.id)
    ? requestedUserId
    : req.user.id;

  if (requestedUserId && requestedUserId !== req.user.id && !isAdmin) {
    return res.status(403).json({ message: 'Solo un administrador puede inscribir a otro jugador' });
  }

  let tournament;
  let category;
  try {
    ({ tournament, category } = await ensureTournamentAndCategory(tournamentId, categoryId));
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  if (tournament.isPrivate && !canAccessPrivateContent(req.user)) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  if (tournament.status !== TOURNAMENT_STATUS.REGISTRATION) {
    return res.status(400).json({ message: 'El torneo no acepta nuevas inscripciones' });
  }

  if (tournament.registrationCloseDate && new Date() > tournament.registrationCloseDate) {
    return res.status(400).json({ message: 'El período de inscripción está cerrado' });
  }

  if (hasCategoryMinimumAgeRequirement(category) && !userHasRole(req.user, USER_ROLES.ADMIN)) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }

  const user = await User.findById(playerId);
  if (!user) {
    return res.status(404).json({ message: 'Jugador no encontrado' });
  }

  if (tournament.isPrivate && !user.isMember) {
    return res.status(403).json({ message: 'Solo los socios pueden inscribirse en este torneo.' });
  }

  if (user.gender && category.gender && !categoryAllowsGender(category.gender, user.gender)) {
    return res.status(400).json({ message: 'El género del jugador no coincide con la categoría' });
  }

  if (!resolvedShirtSize && tournament.hasShirt) {
    const userShirtSize = typeof user.shirtSize === 'string' ? user.shirtSize.trim().toUpperCase() : '';
    if (userShirtSize) {
      resolvedShirtSize = userShirtSize;
    }
  }

  if (tournament.hasShirt && !resolvedShirtSize) {
    return res
      .status(400)
      .json({ message: 'Debe indicar la talla de camiseta para completar la inscripción' });
  }

  if (
    resolvedShirtSize &&
    tournament.hasShirt &&
    Array.isArray(tournament.shirtSizes) &&
    tournament.shirtSizes.length
  ) {
    const allowedSizes = tournament.shirtSizes
      .map((size) => (typeof size === 'string' ? size.trim().toUpperCase() : ''))
      .filter((size, index, array) => size && array.indexOf(size) === index);

    if (!allowedSizes.includes(resolvedShirtSize)) {
      return res
        .status(400)
        .json({ message: 'La talla de camiseta seleccionada no es válida para este torneo' });
    }
  }

  try {
    const enrollment = await TournamentEnrollment.create({
      tournament: tournament.id,
      category: category.id,
      user: user.id,
      status: TOURNAMENT_ENROLLMENT_STATUS.PENDING,
      shirtSize: resolvedShirtSize || undefined,
    });

    await enrollment.populate('user', 'fullName email gender phone photo isMember');
    return res.status(201).json(enrollment);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'El jugador ya está inscrito en esta categoría' });
    }
    throw error;
  }
}

async function createTournamentAdminEnrollment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId } = req.params;
  const requestedCategories = Array.isArray(req.body?.categories) ? req.body.categories : [];
  const requestedUserId = req.body?.userId;
  const categoryCount = req.body?.categoryCount;
  const rawShirtSize = typeof req.body?.shirtSize === 'string' ? req.body.shirtSize.trim() : '';
  const normalizedShirtSize = rawShirtSize ? rawShirtSize.toUpperCase() : '';

  const categoryIds = requestedCategories
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);

  const distinctCategoryIds = Array.from(new Set(categoryIds));

  if (!requestedUserId) {
    return res.status(400).json({ message: 'Debe seleccionar un jugador para inscribir.' });
  }

  if (!distinctCategoryIds.length) {
    return res.status(400).json({ message: 'Debe seleccionar al menos una categoría.' });
  }

  const normalizedCategoryCount =
    categoryCount !== undefined && categoryCount !== null && categoryCount !== ''
      ? Number(categoryCount)
      : null;

  if (
    normalizedCategoryCount !== null &&
    Number.isFinite(normalizedCategoryCount) &&
    normalizedCategoryCount > 0 &&
    normalizedCategoryCount !== distinctCategoryIds.length
  ) {
    return res
      .status(400)
      .json({ message: 'La cantidad de categorías seleccionadas no coincide con la selección.' });
  }

  let context;
  try {
    context = await ensureTournamentAndCategories(tournamentId, distinctCategoryIds);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  const { tournament, categories } = context;

  if (tournament.isPrivate && !canAccessPrivateContent(req.user)) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  if (tournament.status !== TOURNAMENT_STATUS.REGISTRATION) {
    return res.status(400).json({ message: 'El torneo no acepta nuevas inscripciones' });
  }

  if (tournament.registrationCloseDate && new Date() > tournament.registrationCloseDate) {
    return res.status(400).json({ message: 'El período de inscripción está cerrado' });
  }

  const user = await User.findById(requestedUserId);
  if (!user) {
    return res.status(404).json({ message: 'Jugador no encontrado' });
  }

  if (tournament.isPrivate && !user.isMember) {
    return res.status(403).json({ message: 'Solo los socios pueden inscribirse en este torneo.' });
  }

  const closedCategories = categories.filter(
    (category) => category.status !== TOURNAMENT_CATEGORY_STATUSES.REGISTRATION
  );
  if (closedCategories.length) {
    return res
      .status(400)
      .json({ message: 'Una o más categorías seleccionadas no están abiertas a inscripciones.' });
  }

  const genderMismatch = categories.find(
    (category) => user.gender && category.gender && !categoryAllowsGender(category.gender, user.gender)
  );

  if (genderMismatch) {
    return res
      .status(400)
      .json({ message: 'El género del jugador no coincide con alguna de las categorías seleccionadas.' });
  }

  let resolvedShirtSize = normalizedShirtSize;

  if (!resolvedShirtSize && tournament.hasShirt) {
    const userShirtSize = typeof user.shirtSize === 'string' ? user.shirtSize.trim().toUpperCase() : '';
    if (userShirtSize) {
      resolvedShirtSize = userShirtSize;
    }
  }

  if (tournament.hasShirt && !resolvedShirtSize) {
    return res
      .status(400)
      .json({ message: 'Debe indicar la talla de camiseta para completar la inscripción.' });
  }

  if (
    resolvedShirtSize &&
    tournament.hasShirt &&
    Array.isArray(tournament.shirtSizes) &&
    tournament.shirtSizes.length
  ) {
    const allowedSizes = tournament.shirtSizes
      .map((size) => (typeof size === 'string' ? size.trim().toUpperCase() : ''))
      .filter((size, index, array) => size && array.indexOf(size) === index);

    if (!allowedSizes.includes(resolvedShirtSize)) {
      return res
        .status(400)
        .json({ message: 'La talla de camiseta seleccionada no es válida para este torneo.' });
    }
  }

  const existingEnrollments = await TournamentEnrollment.find({
    tournament: tournament.id,
    category: { $in: distinctCategoryIds },
    user: user.id,
  })
    .select('category status')
    .lean();

  if (existingEnrollments.length) {
    return res
      .status(409)
      .json({ message: 'El jugador ya está inscrito en alguna de las categorías seleccionadas.' });
  }

  const enrollmentPayload = categories.map((category) => ({
    tournament: tournament.id,
    category: category.id,
    user: user.id,
    status: TOURNAMENT_ENROLLMENT_STATUS.PENDING,
    shirtSize: resolvedShirtSize || undefined,
  }));

  const createdEnrollments = await TournamentEnrollment.insertMany(enrollmentPayload, { ordered: true });

  await TournamentEnrollment.populate(createdEnrollments, [
    { path: 'user', select: 'fullName email gender phone photo isMember' },
    { path: 'category', select: 'name menuTitle matchType gender' },
  ]);

  const response = createdEnrollments.map((enrollment) => ({
    id: enrollment._id ? enrollment._id.toString() : undefined,
    _id: enrollment._id,
    tournament: enrollment.tournament,
    category: sanitizeCategory(enrollment.category),
    status: enrollment.status,
    shirtSize: enrollment.shirtSize || null,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
    user: sanitizeUser(enrollment.user),
  }));

  return res.status(201).json({ enrollments: response });
}

async function listTournamentEnrollments(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;

  let context;
  try {
    context = await ensureTournamentAndCategory(tournamentId, categoryId);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  if (context.tournament.isPrivate && !canAccessPrivateContent(req.user)) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const enrollments = await TournamentEnrollment.find({
    tournament: tournamentId,
    category: categoryId,
  })
    .populate(
      'user',
      'fullName email gender phone photo birthDate isMember preferredSchedule shirtSize'
    )
    .populate('category', 'name menuTitle matchType gender')
    .sort({ createdAt: 1 });

  const plainEnrollments = enrollments.map((entry) => {
    const plain = entry.toObject({ virtuals: true });
    return {
      id: plain._id ? plain._id.toString() : undefined,
      _id: plain._id,
      tournament: plain.tournament,
      category: sanitizeCategory(plain.category),
      status: plain.status,
      seedNumber: plain.seedNumber,
      notes: plain.notes || null,
      shirtSize: plain.shirtSize || null,
      metadata: plain.metadata || {},
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
      user: sanitizeUser(plain.user),
    };
  });

  const userIds = plainEnrollments
    .map((enrollment) => enrollment?.user?.id)
    .filter((id) => typeof id === 'string' && id);

  const categoryMap = await getTournamentPlayerCategoryMap(tournamentId, userIds);

  const result = plainEnrollments.map((enrollment) => {
    const userId = enrollment?.user?.id;
    const categories = userId ? categoryMap.get(userId) || [] : [];
    return {
      ...enrollment,
      tournamentCategories: categories,
    };
  });

  return res.json(result);
}

async function listTournamentPlayers(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId } = req.params;

  let tournament;
  try {
    tournament = await ensureTournament(tournamentId);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  if (tournament.isPrivate && !canAccessPrivateContent(req.user)) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const categoryMap = await getTournamentPlayerCategoryMap(tournamentId);
  const userIds = Array.from(categoryMap.keys());

  if (!userIds.length) {
    return res.json([]);
  }

  const users = await User.find({ _id: { $in: userIds } })
    .select('fullName email gender phone photo birthDate isMember preferredSchedule shirtSize')
    .lean();

  const userMap = new Map(
    users.map((user) => {
      const id = user._id ? user._id.toString() : '';
      return [id, user];
    })
  );

  const players = userIds
    .map((userId) => {
      const user = userMap.get(userId);
      if (!user) {
        return null;
      }

      const tournamentCategories = categoryMap.get(userId) || [];
      const enrollmentShirtSizes = collectUniqueShirtSizes(tournamentCategories);
      const shirtSize = enrollmentShirtSizes[0] || (user.shirtSize || null);

      return {
        id: userId,
        user: sanitizeUser(user),
        tournamentCategories,
        shirtSizes: enrollmentShirtSizes,
        shirtSize,
        enrollmentCount: tournamentCategories.length,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const nameA = (a.user?.fullName || '').toLowerCase();
      const nameB = (b.user?.fullName || '').toLowerCase();
      return nameA.localeCompare(nameB, 'es');
    });

  return res.json(players);
}

async function listTournamentDoublesPlayers(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId } = req.params;

  let tournament;
  try {
    tournament = await ensureTournament(tournamentId);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  if (tournament.isPrivate && !canAccessPrivateContent(req.user)) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const doublesCategories = await TournamentCategory.find({
    tournament: tournamentId,
    matchType: TOURNAMENT_CATEGORY_MATCH_TYPES.DOUBLES,
  })
    .select('_id name menuTitle matchType gender color status')
    .sort({ menuTitle: 1, name: 1 })
    .lean();

  if (!doublesCategories.length) {
    return res.json([]);
  }

  const categoryGroups = doublesCategories.reduce((map, category) => {
    const id = category?._id ? category._id.toString() : '';
    if (id) {
      map.set(id, {
        category: {
          ...sanitizeCategory(category),
          color: category.color || null,
          status: category.status || null,
        },
        players: [],
      });
    }
    return map;
  }, new Map());

  if (!categoryGroups.size) {
    return res.json([]);
  }

  const categoryIds = Array.from(categoryGroups.keys());

  const enrollments = await TournamentEnrollment.find({
    tournament: tournamentId,
    category: { $in: categoryIds },
  })
    .populate('user', 'fullName email gender phone photo birthDate isMember preferredSchedule shirtSize')
    .select('_id category status shirtSize seedNumber notes metadata createdAt updatedAt')
    .sort({ createdAt: 1 })
    .lean();

  enrollments.forEach((enrollment) => {
    const categoryId =
      (enrollment.category && typeof enrollment.category.toString === 'function'
        ? enrollment.category.toString()
        : typeof enrollment.category === 'string'
        ? enrollment.category
        : '') || '';

    if (!categoryGroups.has(categoryId)) {
      return;
    }

    if (enrollment.status === TOURNAMENT_ENROLLMENT_STATUS.CANCELLED) {
      return;
    }

    const user = sanitizeUser(enrollment.user);
    if (!user) {
      return;
    }

    categoryGroups.get(categoryId).players.push({
      id: enrollment._id ? enrollment._id.toString() : undefined,
      status: enrollment.status,
      seedNumber:
        typeof enrollment.seedNumber === 'number' && Number.isFinite(enrollment.seedNumber)
          ? enrollment.seedNumber
          : null,
      shirtSize: enrollment.shirtSize || null,
      notes: enrollment.notes || '',
      metadata: sanitizeEnrollmentMetadata(enrollment.metadata),
      user,
      enrolledAt: enrollment.createdAt || null,
      updatedAt: enrollment.updatedAt || null,
    });
  });

  const pairMap = new Map();

  if (categoryIds.length) {
    const pairs = await TournamentDoublesPair.find({
      tournament: tournamentId,
      category: { $in: categoryIds },
    })
      .populate('players', 'fullName email gender phone photo birthDate isMember preferredSchedule shirtSize')
      .sort({ createdAt: 1 })
      .lean();

    pairs.forEach((pair) => {
      const pairCategoryId = pair.category ? pair.category.toString() : '';
      if (!pairCategoryId || !categoryGroups.has(pairCategoryId)) {
        return;
      }

      const players = Array.isArray(pair.players)
        ? pair.players.map((player) => sanitizeUser(player)).filter(Boolean)
        : [];

      if (players.length !== 2) {
        return;
      }

      const entry = {
        id: pair._id ? pair._id.toString() : undefined,
        players,
        createdAt: pair.createdAt || null,
        createdBy: pair.createdBy ? pair.createdBy.toString() : null,
      };

      if (!pairMap.has(pairCategoryId)) {
        pairMap.set(pairCategoryId, []);
      }

      pairMap.get(pairCategoryId).push(entry);
    });
  }

  const doublesData = Array.from(categoryGroups.entries()).map(([categoryId, group]) => {
    const pairs = pairMap.get(categoryId) || [];

    group.players.sort((a, b) => {
      const nameA = (a.user?.fullName || '').toLowerCase();
      const nameB = (b.user?.fullName || '').toLowerCase();
      if (nameA && nameB) {
        return nameA.localeCompare(nameB, 'es');
      }
      if (nameA) return -1;
      if (nameB) return 1;
      const timeA = a.enrolledAt ? new Date(a.enrolledAt).getTime() : Infinity;
      const timeB = b.enrolledAt ? new Date(b.enrolledAt).getTime() : Infinity;
      return timeA - timeB;
    });
    pairs.sort((pairA, pairB) => {
      const labelA = pairA.players
        .map((player) => (player.fullName || player.email || '').toLowerCase())
        .join(' ');
      const labelB = pairB.players
        .map((player) => (player.fullName || player.email || '').toLowerCase())
        .join(' ');
      return labelA.localeCompare(labelB, 'es');
    });

    return {
      ...group,
      pairs,
    };
  });

  return res.json(doublesData);
}

async function listTournamentCategoryDoublesPairs(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;

  let context;
  try {
    context = await ensureTournamentAndCategory(tournamentId, categoryId);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  const { tournament, category } = context;

  if (tournament.isPrivate && !canAccessPrivateContent(req.user)) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  if (category.matchType !== TOURNAMENT_CATEGORY_MATCH_TYPES.DOUBLES) {
    return res.json([]);
  }

  const pairs = await TournamentDoublesPair.find({
    tournament: tournamentId,
    category: categoryId,
  })
    .populate('players', 'fullName email gender phone photo birthDate isMember preferredSchedule shirtSize')
    .sort({ createdAt: 1 })
    .lean();

  const payload = pairs
    .map((pair) => {
      const players = Array.isArray(pair.players)
        ? pair.players.map((player) => sanitizeUser(player)).filter(Boolean)
        : [];

      if (players.length !== 2) {
        return null;
      }

      return {
        id: pair._id ? pair._id.toString() : undefined,
        _id: pair._id,
        players,
        createdAt: pair.createdAt || null,
        createdBy: pair.createdBy ? pair.createdBy.toString() : null,
      };
    })
    .filter(Boolean);

  return res.json(payload);
}

async function createTournamentDoublesPair(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;
  const { players } = req.body;

  let context;
  try {
    context = await ensureTournamentAndCategory(tournamentId, categoryId);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  const { category } = context;

  if (category.matchType !== TOURNAMENT_CATEGORY_MATCH_TYPES.DOUBLES) {
    return res
      .status(400)
      .json({ message: 'Solo se pueden crear parejas en categorías de dobles.' });
  }

  if (!Array.isArray(players) || players.length !== 2) {
    return res.status(400).json({ message: 'Debes seleccionar exactamente dos jugadores.' });
  }

  const normalizedPlayers = players
    .map((player) => {
      if (!player) return '';
      try {
        return new mongoose.Types.ObjectId(player).toString();
      } catch (error) {
        return '';
      }
    })
    .filter(Boolean);

  if (normalizedPlayers.length !== 2 || normalizedPlayers[0] === normalizedPlayers[1]) {
    return res.status(400).json({ message: 'Los jugadores deben ser distintos.' });
  }

  const sortedPlayers = [...normalizedPlayers].sort();

  const enrollments = await TournamentEnrollment.find({
    tournament: tournamentId,
    category: categoryId,
    user: { $in: sortedPlayers },
    status: { $ne: TOURNAMENT_ENROLLMENT_STATUS.CANCELLED },
  })
    .populate('user', 'fullName email gender phone photo birthDate isMember preferredSchedule shirtSize')
    .lean();

  if (enrollments.length !== 2) {
    return res
      .status(400)
      .json({ message: 'Ambos jugadores deben estar inscritos en la categoría.' });
  }

  const existingPair = await TournamentDoublesPair.findOne({
    tournament: tournamentId,
    category: categoryId,
    players: sortedPlayers,
  }).select('_id');

  if (existingPair) {
    return res.status(409).json({ message: 'La pareja ya está registrada en esta categoría.' });
  }

  const conflictingPair = await TournamentDoublesPair.findOne({
    tournament: tournamentId,
    category: categoryId,
    players: {
      $in: sortedPlayers.map((playerId) => new mongoose.Types.ObjectId(playerId)),
    },
  }).select('_id players');

  if (conflictingPair) {
    return res
      .status(409)
      .json({ message: 'Uno de los jugadores ya forma parte de otra pareja en esta categoría.' });
  }

  const pair = await TournamentDoublesPair.create({
    tournament: tournamentId,
    category: categoryId,
    players: sortedPlayers,
    createdBy: req.user.id,
  });

  const sanitizedPlayers = enrollments
    .map((enrollment) => sanitizeUser(enrollment.user))
    .filter(Boolean)
    .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'es'));

  return res.status(201).json({
    id: pair._id.toString(),
    players: sanitizedPlayers,
    createdAt: pair.createdAt,
    createdBy: pair.createdBy ? pair.createdBy.toString() : null,
  });
}

async function deleteTournamentDoublesPair(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId, pairId } = req.params;

  let context;
  try {
    context = await ensureTournamentAndCategory(tournamentId, categoryId);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  const { category } = context;

  if (category.matchType !== TOURNAMENT_CATEGORY_MATCH_TYPES.DOUBLES) {
    return res
      .status(400)
      .json({ message: 'Solo se pueden eliminar parejas en categorías de dobles.' });
  }

  const pair = await TournamentDoublesPair.findOne({
    _id: pairId,
    tournament: tournamentId,
    category: categoryId,
  });

  if (!pair) {
    return res.status(404).json({ message: 'Pareja no encontrada.' });
  }

  await TournamentDoublesPair.deleteOne({ _id: pairId });

  return res.status(204).send();
}

async function updateEnrollmentStatus(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId, enrollmentId } = req.params;
  const { status } = req.body;
  const requestedShirtSize = Object.prototype.hasOwnProperty.call(req.body, 'shirtSize')
    ? typeof req.body.shirtSize === 'string'
      ? req.body.shirtSize.trim()
      : ''
    : undefined;

  let context;
  try {
    context = await ensureTournamentAndCategory(tournamentId, categoryId);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  const enrollment = await TournamentEnrollment.findOne({
    _id: enrollmentId,
    tournament: tournamentId,
    category: categoryId,
  });

  if (!enrollment) {
    return res.status(404).json({ message: 'Inscripción no encontrada' });
  }

  if (status && !Object.values(TOURNAMENT_ENROLLMENT_STATUS).includes(status)) {
    return res.status(400).json({ message: 'Estado de inscripción inválido' });
  }

  if (status) {
    enrollment.status = status;
  }

  if (typeof requestedShirtSize !== 'undefined') {
    if (context.tournament.hasShirt && !requestedShirtSize) {
      return res
        .status(400)
        .json({ message: 'Debe indicar la talla de camiseta cuando el torneo incluye camisetas' });
    }

    if (
      requestedShirtSize &&
      context.tournament.hasShirt &&
      Array.isArray(context.tournament.shirtSizes) &&
      context.tournament.shirtSizes.length &&
      !context.tournament.shirtSizes.includes(requestedShirtSize)
    ) {
      return res
        .status(400)
        .json({ message: 'La talla de camiseta seleccionada no es válida para este torneo' });
    }

    enrollment.shirtSize = requestedShirtSize || undefined;
  }

  await enrollment.save();

  return res.json(enrollment);
}

async function removeTournamentEnrollment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId, enrollmentId } = req.params;

  const enrollment = await TournamentEnrollment.findOneAndDelete({
    _id: enrollmentId,
    tournament: tournamentId,
    category: categoryId,
  });

  if (!enrollment) {
    return res.status(404).json({ message: 'Inscripción no encontrada' });
  }

  return res.status(204).send();
}

module.exports = {
  createTournamentAdminEnrollment,
  createTournamentEnrollment,
  listTournamentEnrollments,
  listTournamentPlayers,
  listTournamentDoublesPlayers,
  listTournamentCategoryDoublesPairs,
  createTournamentDoublesPair,
  deleteTournamentDoublesPair,
  updateEnrollmentStatus,
  removeTournamentEnrollment,
};
