const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { League, LEAGUE_STATUS } = require('../models/League');
const { Category, CATEGORY_STATUSES, CATEGORY_SKILL_LEVELS } = require('../models/Category');
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

          return {
            name,
            description,
            gender,
            skillLevel,
            status: category.status,
            _rawSkillLevel: rawSkillLevel,
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
        normalizedNewCategories.map(({ _rawSkillLevel, ...category }) => ({
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

  await league.populate('categories', 'name gender skillLevel startDate endDate status color');

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
    .populate('categories', 'name gender skillLevel color');

  return res.json(leagues);
}

async function getLeagueDetail(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { leagueId } = req.params;

  const league = await League.findById(leagueId).populate('categories', 'name gender skillLevel color');
  if (!league) {
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  return res.json({ league });
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
  updateLeague,
  deleteLeague,
};
