const mongoose = require('mongoose');
const { Category } = require('../models/Category');
const { Enrollment } = require('../models/Enrollment');
const { Match } = require('../models/Match');
const {
  calculateRanking,
  buildSnapshot,
  attachMovementToRanking,
  normalizeId,
} = require('../utils/ranking');

async function refreshCategoryRanking(categoryId) {
  if (!categoryId) return;

  const [category, enrollments, matches] = await Promise.all([
    Category.findById(categoryId),
    Enrollment.find({ category: categoryId }).populate('user', 'fullName photo email'),
    Match.find({ category: categoryId }),
  ]);

  if (!category) {
    return;
  }

  const ranking = calculateRanking(enrollments, matches);
  const currentSnapshot = Array.isArray(category.rankingSnapshot) ? category.rankingSnapshot : [];
  const previousSnapshot = Array.isArray(category.previousRankingSnapshot)
    ? category.previousRankingSnapshot
    : [];

  const { snapshot: snapshotWithMovement } = attachMovementToRanking(
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
}

module.exports = {
  refreshCategoryRanking,
};
