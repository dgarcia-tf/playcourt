const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { League, LEAGUE_STATUS } = require('../models/League');
const {
  Category,
  CATEGORY_STATUSES,
  CATEGORY_SKILL_LEVELS,
  MATCH_FORMATS,
  DEFAULT_CATEGORY_MATCH_FORMAT,
} = require('../models/Category');
const { GENDERS } = require('../models/User');

async function createLeague(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    year,
    description,
    startDate,
    endDate,
    registrationCloseDate,
    enrollmentFee,
    status,
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
  };

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

async function listLeagues(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { year, status } = req.query;

  const query = {};
  if (year) {
    query.year = Number(year);
  }

  if (status) {
    query.status = status;
  }

  const leagues = await League.find(query)
    .sort({ createdAt: -1, startDate: 1 })
    .populate('categories', 'name gender skillLevel color matchFormat');

  return res.json(leagues);
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

  const result = league.toObject();
  result.payments = Array.isArray(result.payments) ? result.payments : [];

  return res.json({ league: result });
}

async function addLeaguePaymentRecord(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { leagueId } = req.params;
  const { user, amount, status, method, reference, notes, paidAt } = req.body;

  const league = await League.findById(leagueId);
  if (!league) {
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  const record = {
    status: PAYMENT_STATUSES.includes(status) ? status : 'pendiente',
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
    if (PAYMENT_STATUSES.includes(updates.status)) {
      payment.status = updates.status;
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
    startDate,
    endDate,
    registrationCloseDate,
    enrollmentFee,
    status,
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

  return res.json(league);
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

  if (Array.isArray(league.categories) && league.categories.length) {
    await Category.updateMany(
      { _id: { $in: league.categories.map((id) => id.toString()) } },
      { $unset: { league: '' } }
    );
  }

  await league.deleteOne();

  return res.status(204).send();
}

module.exports = {
  createLeague,
  listLeagues,
  getLeagueDetail,
  addLeaguePaymentRecord,
  updateLeaguePaymentRecord,
  updateLeague,
  deleteLeague,
};
const PAYMENT_STATUSES = ['pendiente', 'pagado', 'exento', 'fallido'];

