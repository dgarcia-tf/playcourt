const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Tournament, TOURNAMENT_STATUS } = require('../models/Tournament');
const {
  TournamentCategory,
  TOURNAMENT_CATEGORY_STATUSES,
} = require('../models/TournamentCategory');
const {
  TournamentEnrollment,
  TOURNAMENT_ENROLLMENT_STATUS,
} = require('../models/TournamentEnrollment');
const { TournamentMatch } = require('../models/TournamentMatch');

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
    const amount = Number(entry.amount);
    if (!label || !Number.isFinite(amount) || amount < 0) {
      return;
    }

    normalized.push({
      label,
      amount,
      currency: typeof entry.currency === 'string' && entry.currency.trim()
        ? entry.currency.trim().toUpperCase()
        : 'EUR',
      description: typeof entry.description === 'string' ? entry.description.trim() : undefined,
    });
  });

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
  };

  if (status && Object.values(TOURNAMENT_STATUS).includes(status)) {
    payload.status = status;
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
      select: 'name gender skillLevel status color menuTitle',
    });

  return res.json(tournaments);
}

async function getTournamentDetail(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId } = req.params;

  const tournament = await Tournament.findById(tournamentId).populate({
    path: 'categories',
    populate: {
      path: 'seeds.player',
      select: 'fullName gender rating photo',
    },
  });

  if (!tournament) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const categoryIds = (tournament.categories || []).map((category) => category._id || category);

  const [enrollmentsByCategory, matchCounts] = await Promise.all([
    TournamentEnrollment.aggregate([
      { $match: { tournament: new mongoose.Types.ObjectId(tournament.id) } },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          confirmadas: {
            $sum: {
              $cond: [{ $eq: ['$status', TOURNAMENT_ENROLLMENT_STATUS.CONFIRMED] }, 1, 0],
            },
          },
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
  ]);

  const enrollmentMap = new Map();
  enrollmentsByCategory.forEach((entry) => {
    enrollmentMap.set(String(entry._id), {
      total: entry.total,
      confirmed: entry.confirmadas,
    });
  });

  const matchMap = new Map();
  matchCounts.forEach((entry) => {
    matchMap.set(String(entry._id), entry.total);
  });

  const categoriesWithStats = (tournament.categories || []).map((category) => {
    const plainCategory =
      category && typeof category.toObject === 'function' ? category.toObject() : category;
    const categoryId = plainCategory._id ? plainCategory._id.toString() : String(plainCategory);
    const stats = enrollmentMap.get(categoryId) || { total: 0, confirmed: 0 };
    const totalMatches = matchMap.get(categoryId) || 0;

    return {
      ...plainCategory,
      enrollmentStats: stats,
      matches: totalMatches,
    };
  });

  const result = tournament.toObject();
  result.categories = categoriesWithStats;

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

  if (updates.status && Object.values(TOURNAMENT_STATUS).includes(updates.status)) {
    tournament.status = updates.status;
  }

  await tournament.save();
  await tournament.populate('categories');

  return res.json(tournament);
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

  const allowedStatuses = ['pendiente', 'pagado', 'exento', 'fallido'];

  const record = {
    user: user ? new mongoose.Types.ObjectId(user) : undefined,
    amount: Number.isFinite(Number(amount)) ? Number(amount) : undefined,
    status: allowedStatuses.includes(status) ? status : undefined,
    method,
    reference,
    notes,
    paidAt: paidAt ? new Date(paidAt) : undefined,
    recordedBy: req.user.id,
  };

  if (!record.status) {
    record.status = 'pendiente';
  }

  tournament.payments.push(record);
  await tournament.save();

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
    const allowedStatuses = ['pendiente', 'pagado', 'exento', 'fallido'];
    if (allowedStatuses.includes(updates.status)) {
      payment.status = updates.status;
    }
  }

  ['method', 'reference', 'notes'].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      payment[field] = updates[field];
    }
  });

  if (Object.prototype.hasOwnProperty.call(updates, 'paidAt')) {
    payment.paidAt = updates.paidAt ? new Date(updates.paidAt) : undefined;
  }

  payment.recordedBy = req.user.id;

  await tournament.save();

  return res.json(payment);
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
  TOURNAMENT_STATUS,
  TOURNAMENT_CATEGORY_STATUSES,
  TOURNAMENT_ENROLLMENT_STATUS,
};
