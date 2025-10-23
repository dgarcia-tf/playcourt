const { validationResult } = require('express-validator');
const { Tournament, TOURNAMENT_STATUS } = require('../models/Tournament');
const { TournamentCategory } = require('../models/TournamentCategory');
const {
  TournamentEnrollment,
  TOURNAMENT_ENROLLMENT_STATUS,
} = require('../models/TournamentEnrollment');
const { User, USER_ROLES, userHasRole } = require('../models/User');
const { canAccessPrivateContent } = require('../utils/accessControl');
const { categoryAllowsGender } = require('../utils/gender');

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

async function createTournamentEnrollment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;
  const requestedUserId = req.body?.userId;
  const requestedShirtSize = typeof req.body?.shirtSize === 'string' ? req.body.shirtSize.trim() : '';
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

  if (tournament.hasShirt && !requestedShirtSize) {
    return res.status(400).json({ message: 'Debe indicar la talla de camiseta para completar la inscripción' });
  }

  if (
    requestedShirtSize &&
    tournament.hasShirt &&
    Array.isArray(tournament.shirtSizes) &&
    tournament.shirtSizes.length &&
    !tournament.shirtSizes.includes(requestedShirtSize)
  ) {
    return res.status(400).json({ message: 'La talla de camiseta seleccionada no es válida para este torneo' });
  }

  try {
    const enrollment = await TournamentEnrollment.create({
      tournament: tournament.id,
      category: category.id,
      user: user.id,
      status: TOURNAMENT_ENROLLMENT_STATUS.PENDING,
      shirtSize: requestedShirtSize || undefined,
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
  createTournamentEnrollment,
  listTournamentEnrollments,
  listTournamentPlayers,
  updateEnrollmentStatus,
  removeTournamentEnrollment,
};
