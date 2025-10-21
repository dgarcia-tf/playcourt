const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Season } = require('../models/Season');
const { Category } = require('../models/Category');

async function createSeason(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, year, description, startDate, endDate, categories = [] } = req.body;

  if (startDate && endDate && endDate < startDate) {
    return res.status(400).json({ message: 'La fecha de finalización debe ser posterior a la fecha de inicio' });
  }

  if (categories.length > 0) {
    const existingCategories = await Category.countDocuments({ _id: { $in: categories } });
    if (existingCategories !== categories.length) {
      return res.status(400).json({ message: 'Alguna de las categorías especificadas no existe' });
    }
  }

  const season = await Season.create({
    name,
    year,
    description,
    startDate,
    endDate,
    categories,
    createdBy: req.user.id,
  });

  return res.status(201).json(season);
}

async function listSeasons(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { year } = req.query;
  const query = {};
  if (year) {
    query.year = Number(year);
  }

  const seasons = await Season.find(query)
    .sort({ year: -1, startDate: 1 })
    .populate('categories', 'name gender skillLevel color');

  return res.json(seasons);
}

async function getSeasonDetail(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { seasonId } = req.params;

  const season = await Season.findById(seasonId).populate('categories', 'name gender skillLevel color');
  if (!season) {
    return res.status(404).json({ message: 'Temporada no encontrada' });
  }

  return res.json({ season });
}

async function addCategoryToSeason(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { seasonId } = req.params;
  const { categoryId } = req.body;

  const season = await Season.findById(seasonId);
  if (!season) {
    return res.status(404).json({ message: 'Temporada no encontrada' });
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }

  if (!Array.isArray(season.categories)) {
    season.categories = [];
  }

  const alreadyLinked = season.categories.map((id) => id.toString()).includes(categoryId);
  if (!alreadyLinked) {
    season.categories.push(new mongoose.Types.ObjectId(categoryId));
    await season.save();
  }

  return res.json(await season.populate('categories', 'name gender skillLevel color'));
}

async function updateSeason(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { seasonId } = req.params;
  const { name, year, description, startDate, endDate, categories } = req.body;

  const season = await Season.findById(seasonId);
  if (!season) {
    return res.status(404).json({ message: 'Temporada no encontrada' });
  }

  if (name) {
    season.name = name.trim();
  }

  if (typeof year !== 'undefined') {
    season.year = year;
  }

  if (typeof description !== 'undefined') {
    season.description = description ? description.trim() : undefined;
  }

  if (typeof startDate !== 'undefined') {
    season.startDate = startDate || undefined;
  }

  if (typeof endDate !== 'undefined') {
    season.endDate = endDate || undefined;
  }

  if (season.startDate && season.endDate && season.endDate < season.startDate) {
    return res.status(400).json({ message: 'La fecha de finalización debe ser posterior a la fecha de inicio' });
  }

  if (Array.isArray(categories)) {
    const distinct = [...new Set(categories.map((id) => id.toString()))];
    const existingCategories = await Category.countDocuments({ _id: { $in: distinct } });
    if (existingCategories !== distinct.length) {
      return res.status(400).json({ message: 'Alguna de las categorías especificadas no existe' });
    }
    season.categories = distinct.map((id) => new mongoose.Types.ObjectId(id));
  }

  await season.save();

  await season.populate('categories', 'name gender skillLevel color');

  return res.json(season);
}

async function deleteSeason(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { seasonId } = req.params;

  const season = await Season.findByIdAndDelete(seasonId);
  if (!season) {
    return res.status(404).json({ message: 'Temporada no encontrada' });
  }

  return res.status(204).send();
}

module.exports = {
  createSeason,
  listSeasons,
  getSeasonDetail,
  addCategoryToSeason,
  updateSeason,
  deleteSeason,
};
