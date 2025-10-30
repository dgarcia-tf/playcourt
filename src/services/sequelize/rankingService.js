const { Op } = require('sequelize');
const { getSequelize } = require('../../config/database');
const {
  calculateRanking,
  buildSnapshot,
  attachMovementToRanking,
  normalizeId,
} = require('../../utils/ranking');

async function refreshCategoryRanking(categoryId) {
  if (!categoryId) return;

  const sequelize = getSequelize();
  const { Category, Enrollment, Match, User } = sequelize.models;

  const [category, enrollments, matches] = await Promise.all([
    Category.findByPk(categoryId),
    Enrollment.findAll({
      where: { categoryId },
      include: [{
        model: User,
        as: 'player',
        attributes: ['id', 'fullName', 'photo', 'email']
      }]
    }),
    Match.findAll({
      where: { categoryId }
    })
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
    user: entry.user
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
    await category.update({
      previousRankingSnapshot: currentSnapshot,
      rankingSnapshot: snapshot,
      rankingUpdatedAt: new Date()
    });
  } else if (!currentSnapshot.length && snapshot.length) {
    await category.update({
      previousRankingSnapshot: [],
      rankingSnapshot: snapshot,
      rankingUpdatedAt: new Date()
    });
  }
}

module.exports = {
  refreshCategoryRanking,
};