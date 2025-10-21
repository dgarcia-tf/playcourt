const { Category } = require('../models/Category');
const { Match } = require('../models/Match');
const { Enrollment } = require('../models/Enrollment');
const {
  calculateRanking,
  buildSnapshot,
  attachMovementToRanking,
  normalizeId,
} = require('../utils/ranking');
const mongoose = require('mongoose');

async function getCategoryRanking(req, res) {
  const { categoryId } = req.params;

  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }

  const [enrollments, matches] = await Promise.all([
    Enrollment.find({ category: categoryId }).populate('user', 'fullName email gender photo'),
    Match.find({ category: categoryId })
      .populate('players', 'fullName email gender photo')
      .populate('result.winner', 'fullName email'),
  ]);

  const ranking = calculateRanking(enrollments, matches);

  const currentSnapshot = Array.isArray(category.rankingSnapshot) ? category.rankingSnapshot : [];
  const previousSnapshot = Array.isArray(category.previousRankingSnapshot)
    ? category.previousRankingSnapshot
    : [];

  const { result, snapshot: snapshotWithMovement } = attachMovementToRanking(
    ranking,
    currentSnapshot,
    previousSnapshot
  );

  const snapshotCore = buildSnapshot(ranking);
  const snapshot = snapshotWithMovement.map((entry) => ({
    ...entry,
    user: new mongoose.Types.ObjectId(entry.user),
  }));

  const hasChanged =
    snapshotCore.length !== currentSnapshot.length ||
    snapshotCore.some((entry, index) => {
      const previous = currentSnapshot[index];
      if (!previous) return true;
      const previousUser = normalizeId(previous.user);
      return (
        entry.user !== previousUser ||
        entry.position !== previous.position ||
        entry.points !== previous.points ||
        entry.wins !== previous.wins ||
        entry.gamesWon !== previous.gamesWon
      );
    });

  const storedMovements = new Map(
    currentSnapshot.map((entry) => {
      const id = normalizeId(entry.user);
      if (!id) return null;
      return [id, entry];
    }).filter(Boolean)
  );

  const enrichedResult = hasChanged
    ? result
    : result.map((entry) => {
        const playerId = normalizeId(entry.player?.id || entry.player);
        const stored = storedMovements.get(playerId);
        if (!stored) {
          return entry;
        }
        const fallbackNumber = (value) => (typeof value === 'number' ? value : null);
        const fallbackResult = (value) =>
          value === 'win' || value === 'loss' ? value : null;
        return {
          ...entry,
          movement: stored.movement ?? entry.movement,
          movementDelta: fallbackNumber(stored.movementDelta) ?? entry.movementDelta,
          previousPosition: fallbackNumber(stored.previousPosition) ?? entry.previousPosition,
          lastMatchPoints:
            fallbackNumber(stored.lastMatchPoints) ?? entry.lastMatchPoints ?? null,
          previousMatchPoints:
            fallbackNumber(stored.previousMatchPoints) ?? entry.previousMatchPoints ?? null,
          lastMatchResult:
            fallbackResult(stored.lastMatchResult) ?? entry.lastMatchResult ?? null,
          previousMatchResult:
            fallbackResult(stored.previousMatchResult) ?? entry.previousMatchResult ?? null,
        };
      });

  if (hasChanged) {
    category.previousRankingSnapshot = currentSnapshot;
    category.rankingSnapshot = snapshot;
    category.rankingUpdatedAt = new Date();
    await category.save();
  } else if (!currentSnapshot.length && snapshot.length) {
    category.previousRankingSnapshot = [];
    category.rankingSnapshot = snapshot;
    category.rankingUpdatedAt = new Date();
    await category.save();
  }

  return res.json({
    category: {
      id: category.id,
      name: category.name,
      gender: category.gender,
    },
    ranking: enrichedResult,
  });
}

module.exports = {
  getCategoryRanking,
};
