const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Tournament } = require('../models/Tournament');
const {
  TournamentCategory,
  TOURNAMENT_CATEGORY_STATUSES,
} = require('../models/TournamentCategory');
const {
  TournamentEnrollment,
  TOURNAMENT_ENROLLMENT_STATUS,
} = require('../models/TournamentEnrollment');
const { DEFAULT_CATEGORY_COLOR, isValidCategoryColor, resolveCategoryColor } = require('../utils/colors');

function sanitizeDrawRounds(rounds = []) {
  if (!Array.isArray(rounds)) {
    return [];
  }

  const safeObjectId = (value) => {
    if (!value) return undefined;
    try {
      return new mongoose.Types.ObjectId(value);
    } catch (error) {
      return undefined;
    }
  };

  return rounds
    .filter((round) => round && typeof round === 'object')
    .map((round, index) => {
      const name = typeof round.name === 'string' && round.name.trim() ? round.name.trim() : `Ronda ${
        index + 1
      }`;
      const order = Number.isFinite(Number(round.order)) ? Number(round.order) : index;
      const matches = Array.isArray(round.matches)
        ? round.matches
            .filter((match) => match && typeof match === 'object')
            .map((match, matchIndex) => {
              const normalizedMatchNumber = Number.isFinite(Number(match.matchNumber))
                ? Number(match.matchNumber)
                : matchIndex + 1;
              return {
                matchNumber: normalizedMatchNumber,
                playerA: safeObjectId(match.playerA),
                playerB: safeObjectId(match.playerB),
                seedA: Number.isFinite(Number(match.seedA)) ? Number(match.seedA) : undefined,
                seedB: Number.isFinite(Number(match.seedB)) ? Number(match.seedB) : undefined,
                winner: safeObjectId(match.winner),
                notes: typeof match.notes === 'string' ? match.notes.trim() : undefined,
              };
            })
        : [];

      return {
        name,
        order,
        matches,
      };
    });
}

async function createTournamentCategory(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId } = req.params;
  const { name, description, gender, skillLevel, menuTitle, color, drawSize } = req.body;

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    return res.status(404).json({ message: 'Torneo no encontrado' });
  }

  const payload = {
    name,
    description,
    gender,
    skillLevel,
    menuTitle,
    color:
      color && isValidCategoryColor(color)
        ? resolveCategoryColor(color)
        : DEFAULT_CATEGORY_COLOR,
    drawSize,
    tournament: tournament.id,
  };

  let category;
  try {
    category = await TournamentCategory.create(payload);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: 'Ya existe una categoría con el mismo nombre y género en este torneo.' });
    }
    throw error;
  }

  tournament.categories.push(category._id);
  await tournament.save();

  return res.status(201).json(category);
}

async function listTournamentCategories(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId } = req.params;
  const categories = await TournamentCategory.find({ tournament: tournamentId })
    .sort({ createdAt: 1 })
    .populate('seeds.player', 'fullName gender rating photo');

  return res.json(categories);
}

async function getTournamentCategory(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;

  const category = await TournamentCategory.findOne({ _id: categoryId, tournament: tournamentId })
    .populate('seeds.player', 'fullName gender rating photo')
    .lean();

  if (!category) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }

  const enrollmentCount = await TournamentEnrollment.countDocuments({
    category: categoryId,
    tournament: tournamentId,
  });

  return res.json({ ...category, enrollmentCount });
}

async function updateTournamentCategory(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;
  const updates = req.body || {};

  const category = await TournamentCategory.findOne({ _id: categoryId, tournament: tournamentId });
  if (!category) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }

  ['name', 'description', 'menuTitle', 'color'].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      category[field] = updates[field];
    }
  });

  if (Object.prototype.hasOwnProperty.call(updates, 'skillLevel')) {
    category.skillLevel = updates.skillLevel;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'drawSize')) {
    const size = Number(updates.drawSize);
    category.drawSize = Number.isFinite(size) && size >= 0 ? size : category.drawSize;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
    const allowedStatuses = Object.values(TOURNAMENT_CATEGORY_STATUSES);
    if (allowedStatuses.includes(updates.status)) {
      category.status = updates.status;
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'color') && !updates.color) {
    category.color = undefined;
  }

  await category.save();

  return res.json(category);
}

async function deleteTournamentCategory(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;

  const category = await TournamentCategory.findOneAndDelete({
    _id: categoryId,
    tournament: tournamentId,
  });

  if (!category) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }

  await Promise.all([
    TournamentEnrollment.deleteMany({ category: categoryId }),
    Tournament.findByIdAndUpdate(tournamentId, { $pull: { categories: categoryId } }),
  ]);

  return res.status(204).send();
}

async function configureTournamentDraw(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;
  const { rounds } = req.body;

  const category = await TournamentCategory.findOne({ _id: categoryId, tournament: tournamentId });
  if (!category) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }

  category.draw = sanitizeDrawRounds(rounds);
  category.status = TOURNAMENT_CATEGORY_STATUSES.DRAW;
  await category.save();

  return res.json(category);
}

async function assignTournamentSeeds(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;
  const { seeds = [] } = req.body;

  const category = await TournamentCategory.findOne({ _id: categoryId, tournament: tournamentId });
  if (!category) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }

  const enrollments = await TournamentEnrollment.find({
    tournament: tournamentId,
    category: categoryId,
    status: { $ne: TOURNAMENT_ENROLLMENT_STATUS.CANCELLED },
  }).select('user');
  const enrolledUsers = new Set(enrollments.map((enrollment) => enrollment.user.toString()));

  const normalizedSeeds = Array.isArray(seeds)
    ? seeds
        .filter((seed) => seed && typeof seed === 'object')
        .map((seed) => ({
          player: new mongoose.Types.ObjectId(seed.player),
          seedNumber: Number(seed.seedNumber),
        }))
        .filter(
          (seed) =>
            seed.player &&
            seed.seedNumber &&
            Number.isFinite(seed.seedNumber) &&
            seed.seedNumber > 0 &&
            enrolledUsers.has(seed.player.toString())
        )
    : [];

  const uniqueBySeed = new Map();
  const seenPlayers = new Set();
  normalizedSeeds.forEach((seed) => {
    const key = seed.seedNumber;
    const playerKey = seed.player.toString();
    if (!uniqueBySeed.has(key) && !seenPlayers.has(playerKey)) {
      uniqueBySeed.set(key, seed);
      seenPlayers.add(playerKey);
    }
  });

  const deduplicatedSeeds = Array.from(uniqueBySeed.values()).sort(
    (a, b) => a.seedNumber - b.seedNumber
  );

  category.seeds = deduplicatedSeeds;
  await category.save();

  return res.json(category);
}

module.exports = {
  createTournamentCategory,
  listTournamentCategories,
  getTournamentCategory,
  updateTournamentCategory,
  deleteTournamentCategory,
  configureTournamentDraw,
  assignTournamentSeeds,
};
