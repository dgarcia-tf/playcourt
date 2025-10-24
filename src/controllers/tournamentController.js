const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { Tournament, TOURNAMENT_STATUS } = require('../models/Tournament');
const {
  TournamentCategory,
  TOURNAMENT_CATEGORY_STATUSES,
} = require('../models/TournamentCategory');
const {
  TournamentEnrollment,
  TOURNAMENT_ENROLLMENT_STATUS,
} = require('../models/TournamentEnrollment');
const { USER_ROLES, userHasRole } = require('../models/User');
const { TournamentMatch } = require('../models/TournamentMatch');
const { canAccessPrivateContent } = require('../utils/accessControl');
const { hasCategoryMinimumAgeRequirement } = require('../utils/age');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const POSTER_UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads', 'tournaments');

const PAYMENT_STATUSES = ['pendiente', 'pagado', 'exento', 'fallido'];
const PAYMENT_STATUS_SET = new Set(PAYMENT_STATUSES);

function normalizePaymentStatus(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase();
}

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

  return path.posix.join('uploads', 'tournaments', filename);
}

function normalizeFeeCollection(fees = []) {
  if (!Array.isArray(fees)) {
    return [];
  }

  const normalized = [];
  fees.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const label = typeof entry.label === 'string' ? entry.label.trim() : '';
    if (!label) {
      return;
    }

    const amount = Number(entry.amount);
    const memberAmount = Number(entry.memberAmount);
    const nonMemberAmount = Number(entry.nonMemberAmount);

    const hasAmount = Number.isFinite(amount) && amount >= 0;
    const hasMemberAmount = Number.isFinite(memberAmount) && memberAmount >= 0;
    const hasNonMemberAmount = Number.isFinite(nonMemberAmount) && nonMemberAmount >= 0;

    if (!hasAmount && !hasMemberAmount && !hasNonMemberAmount) {
      return;
    }

    const currency =
      typeof entry.currency === 'string' && entry.currency.trim()
        ? entry.currency.trim().toUpperCase()
        : 'EUR';

    const normalizedEntry = {
      label,
      currency,
      description: typeof entry.description === 'string' ? entry.description.trim() : undefined,
    };

    if (hasAmount) {
      normalizedEntry.amount = amount;
    }
    if (hasMemberAmount) {
      normalizedEntry.memberAmount = memberAmount;
    }
    if (hasNonMemberAmount) {
      normalizedEntry.nonMemberAmount = nonMemberAmount;
    }

    normalized.push(normalizedEntry);
  });

  return normalized;
}

function normalizeShirtSizes(sizes, hasShirt) {
  if (!hasShirt) {
    return [];
  }

  if (!Array.isArray(sizes)) {
    return [];
  }

  const normalized = sizes
    .map((size) => (typeof size === 'string' ? size.trim() : ''))
    .filter((size, index, array) => size && array.indexOf(size) === index);

  return normalized;
}

async function createTournament(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    description,
    startDate,
    endDate,
    registrationCloseDate,
    poster,
    fees = [],
    status,
    hasShirt = false,
    hasGiftBag = false,
    shirtSizes = [],
    isPrivate,
  } = req.body;

  if (startDate && endDate && endDate < startDate) {
    return res.status(400).json({ message: 'La fecha de finalización debe ser posterior a la fecha de inicio' });
  }

  if (registrationCloseDate && startDate && registrationCloseDate > startDate) {
    return res.status(400).json({ message: 'La fecha de cierre de inscripciones debe ser anterior al inicio' });
  }

  const payload = {
    name,
    description,
    startDate,
    endDate,
    registrationCloseDate,
    poster,
    fees: normalizeFeeCollection(fees),
    createdBy: req.user.id,
    hasShirt: Boolean(hasShirt),
    hasGiftBag: Boolean(hasGiftBag),
    shirtSizes: normalizeShirtSizes(shirtSizes, Boolean(hasShirt)),
  };

  if (status && Object.values(TOURNAMENT_STATUS).includes(status)) {
    payload.status = status;
  }

  if (typeof isPrivate === 'boolean') {
    payload.isPrivate = isPrivate;
  }

  const tournament = await Tournament.create(payload);
  await tournament.populate('categories');

  return res.status(201).json(tournament);
}

async function listTournaments(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { status } = req.query;
  const query = {};
  if (status) {
    query.status = status;
  }

  const tournaments = await Tournament.find(query)
    .sort({ startDate: 1, createdAt: -1 })
    .populate({
      path: 'categories',
      select: 'name gender matchType matchFormat status color menuTitle',
    });
  if (!tournaments.length) {
    return res.json([]);
  }

  const canSeePrivate = canAccessPrivateContent(req.user);
  const visibleTournaments = canSeePrivate
    ? tournaments
    : tournaments.filter((tournament) => !tournament.isPrivate);

  if (!visibleTournaments.length) {
    return res.json([]);
  }

  const categoryIdSet = new Set();
  visibleTournaments.forEach((tournament) => {
    (tournament.categories || []).forEach((category) => {
      const id = category?._id ? category._id.toString() : category?.toString?.();
      if (id) {
        categoryIdSet.add(id);
      }
    });
  });

  const categoryIds = Array.from(categoryIdSet);
  let statsByCategory = new Map();

  if (categoryIds.length) {
    const enrollmentStats = await TournamentEnrollment.aggregate([
      {
        $match: {
          category: {
            $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
      },
      {
        $group: {
          _id: { category: '$category', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);

    statsByCategory = enrollmentStats.reduce((map, entry) => {
      const categoryId = entry._id.category.toString();
      const status = entry._id.status;
      if (!map.has(categoryId)) {
        map.set(categoryId, { total: 0, confirmed: 0, pending: 0, cancelled: 0 });
      }
      const stats = map.get(categoryId);
      stats.total += entry.count;
      if (status === TOURNAMENT_ENROLLMENT_STATUS.CONFIRMED) {
        stats.confirmed += entry.count;
      } else if (status === TOURNAMENT_ENROLLMENT_STATUS.PENDING) {
        stats.pending += entry.count;
      } else if (status === TOURNAMENT_ENROLLMENT_STATUS.CANCELLED) {
        stats.cancelled += entry.count;
      }
      return map;
    }, new Map());
  }

  const result = visibleTournaments.map((tournament) => {
    const plain = tournament.toObject();
    if (Array.isArray(plain.categories)) {
      plain.categories = plain.categories.map((category) => {
        const categoryId = category?._id ? category._id.toString() : '';
        const stats = categoryId ? statsByCategory.get(categoryId) : null;
        return {
          ...category,
          enrollmentStats: {
            total: stats?.total || 0,
            confirmed: stats?.confirmed || 0,
            pending: stats?.pending || 0,
            cancelled: stats?.cancelled || 0,
          },
          pendingEnrollmentCount: stats?.pending || 0,
        };
      });
    }
    return plain;
  });

  return res.json(result);
}

async function getTournamentDetail(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId } = req.params;

  const tournament = await Tournament.findById(tournamentId)
    .populate({
      path: 'categories',
      populate: {
        path: 'seeds.player',
        select: 'fullName gender rating photo',
      },
    })
    .populate({
      path: 'payments.user',
      select: 'fullName email phone photo preferredSchedule isMember',
    })
    .populate({ path: 'payments.recordedBy', select: 'fullName email' });

  if (!tournament) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  if (tournament.isPrivate && !canAccessPrivateContent(req.user)) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const categoryIds = (tournament.categories || []).map((category) => category._id || category);

  const userId = req.user?.id || req.user?._id;
  const hasPrivateAccess = canAccessPrivateContent(req.user);
  const [enrollmentStats, matchCounts, userEnrollments] = await Promise.all([
    TournamentEnrollment.aggregate([
      {
        $match: { tournament: new mongoose.Types.ObjectId(tournament.id) },
      },
      {
        $group: {
          _id: { category: '$category', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]),
    TournamentMatch.aggregate([
      { $match: { tournament: new mongoose.Types.ObjectId(tournament.id) } },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
        },
      },
    ]),
    userId
      ? TournamentEnrollment.find({
          tournament: tournament.id,
          user: userId,
        })
          .lean()
      : [],
  ]);

  const statsByCategory = enrollmentStats.reduce((map, entry) => {
    const categoryId = entry._id.category.toString();
    const status = entry._id.status;
    if (!map.has(categoryId)) {
      map.set(categoryId, { total: 0, confirmed: 0, pending: 0, cancelled: 0 });
    }
    const stats = map.get(categoryId);
    stats.total += entry.count;
    if (status === TOURNAMENT_ENROLLMENT_STATUS.CONFIRMED) {
      stats.confirmed += entry.count;
    } else if (status === TOURNAMENT_ENROLLMENT_STATUS.PENDING) {
      stats.pending += entry.count;
    } else if (status === TOURNAMENT_ENROLLMENT_STATUS.CANCELLED) {
      stats.cancelled += entry.count;
    }
    return map;
  }, new Map());

  const userEnrollmentMap = new Map();
  userEnrollments.forEach((enrollment) => {
    const rawCategoryId = enrollment?.category;
    const categoryId = rawCategoryId ? rawCategoryId.toString() : '';
    if (categoryId) {
      userEnrollmentMap.set(categoryId, enrollment);
    }
  });

  const matchMap = new Map();
  matchCounts.forEach((entry) => {
    matchMap.set(String(entry._id), entry.total);
  });

  const now = new Date();
  const registrationDeadline = tournament.registrationCloseDate
    ? new Date(tournament.registrationCloseDate)
    : null;
  const tournamentAllowsEnrollment =
    tournament.status === TOURNAMENT_STATUS.REGISTRATION &&
    (!registrationDeadline || now <= registrationDeadline);

  const categoriesWithStats = (tournament.categories || []).map((category) => {
    const plainCategory =
      category && typeof category.toObject === 'function' ? category.toObject() : category;
    const categoryId = plainCategory._id ? plainCategory._id.toString() : String(plainCategory);
    const stats = statsByCategory.get(categoryId) || {
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
    };
    const totalMatches = matchMap.get(categoryId) || 0;
    const userEnrollment = userEnrollmentMap.get(categoryId) || null;
    const categoryAllowsEnrollment =
      plainCategory.status === TOURNAMENT_CATEGORY_STATUSES.REGISTRATION;
    const hasMinimumAgeRequirement = hasCategoryMinimumAgeRequirement(plainCategory);
    const canRequestEnrollment = Boolean(req.user) &&
      tournamentAllowsEnrollment &&
      categoryAllowsEnrollment &&
      (!tournament.isPrivate || hasPrivateAccess) &&
      (!userEnrollment || userEnrollment.status === TOURNAMENT_ENROLLMENT_STATUS.CANCELLED) &&
      !hasMinimumAgeRequirement;

    return {
      ...plainCategory,
      enrollmentStats: stats,
      matches: totalMatches,
      pendingEnrollmentCount: stats.pending,
      userEnrollment: userEnrollment
        ? {
            id: userEnrollment._id ? userEnrollment._id.toString() : undefined,
            status: userEnrollment.status,
            shirtSize: userEnrollment.shirtSize || null,
          }
        : null,
      canRequestEnrollment,
    };
  });

  const result = tournament.toObject();
  const toTimestamp = (value) => (value ? new Date(value).getTime() : -Infinity);
  const isAdmin = userHasRole(req.user, USER_ROLES.ADMIN);
  result.categories = isAdmin
    ? categoriesWithStats
    : categoriesWithStats.filter((category) => !hasCategoryMinimumAgeRequirement(category));
  result.materials = Array.isArray(result.materials) ? result.materials : [];
  result.payments = Array.isArray(result.payments)
    ? [...result.payments].sort((a, b) => {
        const paidDiff = toTimestamp(b.paidAt) - toTimestamp(a.paidAt);
        if (paidDiff !== 0) {
          return paidDiff;
        }
        return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
      })
    : [];

  if (isAdmin) {
    const availableCategories = categoriesWithStats.filter(
      (category) => category.status === TOURNAMENT_CATEGORY_STATUSES.REGISTRATION
    );

    const shirtSizes = Array.isArray(tournament.shirtSizes) ? tournament.shirtSizes : [];
    const canAdminEnrollPlayers =
      tournamentAllowsEnrollment && availableCategories.length > 0 && (!tournament.isPrivate || hasPrivateAccess);

    result.canAdminEnrollPlayers = canAdminEnrollPlayers;
    result.adminEnrollmentOptions = {
      canEnrollPlayers: canAdminEnrollPlayers,
      hasShirt: Boolean(tournament.hasShirt),
      requiresShirtSize: Boolean(tournament.hasShirt),
      maxSelectableCategories: availableCategories.length,
      shirtSizes,
      categories: availableCategories.map((category) => ({
        id: category._id ? category._id.toString() : String(category.id),
        name: category.name || '',
        menuTitle: category.menuTitle || '',
        gender: category.gender || '',
        matchType: category.matchType || '',
        status: category.status,
      })),
    };
  }

  return res.json(result);
}

async function updateTournament(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId } = req.params;
  const updates = req.body || {};

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const { startDate, endDate, registrationCloseDate } = updates;

  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    return res
      .status(400)
      .json({ message: 'La fecha de finalización debe ser posterior a la fecha de inicio' });
  }

  if (registrationCloseDate && startDate && new Date(registrationCloseDate) > new Date(startDate)) {
    return res
      .status(400)
      .json({ message: 'La fecha de cierre de inscripciones debe ser anterior al inicio' });
  }

  if (typeof updates.fees !== 'undefined') {
    tournament.fees = normalizeFeeCollection(updates.fees);
  }

  ['name', 'description', 'startDate', 'endDate', 'registrationCloseDate', 'poster'].forEach(
    (field) => {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        tournament[field] = updates[field];
      }
    }
  );

  if (Object.prototype.hasOwnProperty.call(updates, 'hasShirt')) {
    tournament.hasShirt = Boolean(updates.hasShirt);
    if (!tournament.hasShirt) {
      tournament.shirtSizes = [];
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'hasGiftBag')) {
    tournament.hasGiftBag = Boolean(updates.hasGiftBag);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'shirtSizes')) {
    tournament.shirtSizes = normalizeShirtSizes(updates.shirtSizes, tournament.hasShirt);
  }

  if (updates.status && Object.values(TOURNAMENT_STATUS).includes(updates.status)) {
    tournament.status = updates.status;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'isPrivate')) {
    tournament.isPrivate = Boolean(updates.isPrivate);
  }

  await tournament.save();
  await tournament.populate('categories');

  return res.json(tournament);
}

async function uploadTournamentPoster(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId } = req.params;
  const { file } = req;

  if (!file) {
    return res.status(400).json({ message: 'No se recibió ningún archivo de imagen' });
  }

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    await removeFileIfExists(file.path);
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const previousPosterFile = tournament.posterFile?.filename
    ? path.join(POSTER_UPLOAD_DIR, tournament.posterFile.filename)
    : null;

  const relativePosterPath = buildPosterPublicPath(file.filename);
  tournament.poster = relativePosterPath ? `/${relativePosterPath}` : undefined;
  tournament.posterFile = {
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  };

  await tournament.save();

  if (previousPosterFile) {
    await removeFileIfExists(previousPosterFile);
  }

  return res.status(201).json({ poster: tournament.poster, posterFile: tournament.posterFile });
}

async function deleteTournament(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId } = req.params;

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  await Promise.all([
    TournamentCategory.deleteMany({ tournament: tournament.id }),
    TournamentEnrollment.deleteMany({ tournament: tournament.id }),
    TournamentMatch.deleteMany({ tournament: tournament.id }),
  ]);
  await tournament.deleteOne();

  return res.status(204).send();
}

async function addMaterialRecord(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId } = req.params;
  const { name, description, assignedTo, delivered, deliveredAt, notes } = req.body;

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const record = {
    name,
    description,
    assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined,
    delivered: Boolean(delivered),
    deliveredAt: deliveredAt ? new Date(deliveredAt) : undefined,
    notes,
  };

  tournament.materials.push(record);
  await tournament.save();

  return res.status(201).json(tournament.materials[tournament.materials.length - 1]);
}

async function updateMaterialRecord(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, materialId } = req.params;
  const updates = req.body || {};

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const material = tournament.materials.id(materialId);
  if (!material) {
    return res.status(404).json({ message: 'Entrega de material no encontrada' });
  }

  ['name', 'description', 'notes'].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      material[field] = updates[field];
    }
  });

  if (Object.prototype.hasOwnProperty.call(updates, 'assignedTo')) {
    material.assignedTo = updates.assignedTo
      ? new mongoose.Types.ObjectId(updates.assignedTo)
      : undefined;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'delivered')) {
    material.delivered = Boolean(updates.delivered);
    material.deliveredAt = updates.delivered ? new Date() : null;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'deliveredAt')) {
    material.deliveredAt = updates.deliveredAt ? new Date(updates.deliveredAt) : null;
  }

  await tournament.save();

  return res.json(material);
}

async function removeMaterialRecord(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, materialId } = req.params;

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const material = tournament.materials.id(materialId);
  if (!material) {
    return res.status(404).json({ message: 'Entrega de material no encontrada' });
  }

  material.deleteOne();
  await tournament.save();

  return res.status(204).send();
}

async function addPaymentRecord(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId } = req.params;
  const { user, amount, status, method, reference, notes, paidAt } = req.body;

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const numericAmount = Number(amount);
  const normalizedStatus = normalizePaymentStatus(status);
  const record = {
    user: user ? new mongoose.Types.ObjectId(user) : undefined,
    amount: Number.isFinite(numericAmount) && numericAmount >= 0 ? numericAmount : undefined,
    status: PAYMENT_STATUS_SET.has(normalizedStatus) ? normalizedStatus : 'pendiente',
    method: typeof method === 'string' ? method.trim() || undefined : undefined,
    reference: typeof reference === 'string' ? reference.trim() || undefined : undefined,
    notes: typeof notes === 'string' ? notes.trim() || undefined : undefined,
    paidAt: paidAt ? new Date(paidAt) : undefined,
    recordedBy: req.user.id,
  };

  tournament.payments.push(record);
  await tournament.save();

  await tournament.populate([
    {
      path: 'payments.user',
      select: 'fullName email phone photo preferredSchedule isMember',
    },
    { path: 'payments.recordedBy', select: 'fullName email' },
  ]);

  return res.status(201).json(tournament.payments[tournament.payments.length - 1]);
}

async function updatePaymentRecord(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, paymentId } = req.params;
  const updates = req.body || {};

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const payment = tournament.payments.id(paymentId);
  if (!payment) {
    return res.status(404).json({ message: 'Registro de pago no encontrado' });
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'user')) {
    payment.user = updates.user ? new mongoose.Types.ObjectId(updates.user) : undefined;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'amount')) {
    const amount = Number(updates.amount);
    payment.amount = Number.isFinite(amount) && amount >= 0 ? amount : payment.amount;
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

  payment.recordedBy = req.user.id;

  await tournament.save();

  await tournament.populate([
    {
      path: 'payments.user',
      select: 'fullName email phone photo preferredSchedule isMember',
    },
    { path: 'payments.recordedBy', select: 'fullName email' },
  ]);

  const updatedPayment = tournament.payments.id(paymentId);

  return res.json(updatedPayment);
}

module.exports = {
  createTournament,
  listTournaments,
  getTournamentDetail,
  updateTournament,
  deleteTournament,
  addMaterialRecord,
  updateMaterialRecord,
  removeMaterialRecord,
  addPaymentRecord,
  updatePaymentRecord,
  uploadTournamentPoster,
  TOURNAMENT_STATUS,
  TOURNAMENT_CATEGORY_STATUSES,
  TOURNAMENT_ENROLLMENT_STATUS,
};
