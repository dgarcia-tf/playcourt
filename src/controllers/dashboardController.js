const { Match } = require('../models/Match');
const { Category } = require('../models/Category');
const { Notification } = require('../models/Notification');
const { Enrollment } = require('../models/Enrollment');
const { USER_ROLES, userHasRole } = require('../models/User');
const { calculateRanking } = require('../utils/ranking');
const { resolveCategoryColor } = require('../utils/colors');

function buildRanking(enrollments = [], matches = []) {
  return calculateRanking(enrollments, matches)
    .slice()
    .map((entry, index) => ({
      ...entry,
      position: index + 1,
    }));
}

function serializeMatch(match) {
  return {
    id: match.id,
    category: match.category
      ? {
          id: match.category.id,
          name: match.category.name,
          color: resolveCategoryColor(match.category.color),
        }
      : undefined,
    scheduledAt: match.scheduledAt,
    court: match.court,
    status: match.status,
    players: Array.isArray(match.players)
      ? match.players.map((player) => ({
          id: typeof player === 'string' ? player : player.id,
          fullName: typeof player === 'object' ? player.fullName : undefined,
          photo: typeof player === 'object' ? player.photo : undefined,
        }))
      : [],
  };
}

function serializeNotification(notification) {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    channel: notification.channel,
    scheduledFor: notification.scheduledFor,
    match: notification.match
      ? {
          id: notification.match.id,
          scheduledAt: notification.match.scheduledAt,
          court: notification.match.court,
          category: notification.match.category
            ? {
                id: notification.match.category.id,
                name: notification.match.category.name,
                color: resolveCategoryColor(notification.match.category.color),
              }
            : undefined,
        }
      : undefined,
  };
}

async function getSummary(req, res) {
  const { categoryId: requestedCategoryId } = req.query;
  const now = new Date();
  const userId = req.user.id;
  const isAdmin = userHasRole(req.user, USER_ROLES.ADMIN);

  let category = null;
  let derivedCategoryId = requestedCategoryId;
  let accessibleCategoryIds = null;

  if (!isAdmin) {
    const playerCategoryEnrollments = await Enrollment.find({ user: userId })
      .select('category')
      .sort({ createdAt: 1 })
      .lean();

    accessibleCategoryIds = [];
    playerCategoryEnrollments.forEach((enrollment) => {
      const id = enrollment.category?.toString();
      if (id && !accessibleCategoryIds.includes(id)) {
        accessibleCategoryIds.push(id);
      }
    });
  }

  if (!derivedCategoryId) {
    if (!isAdmin) {
      derivedCategoryId = accessibleCategoryIds?.[0];
    } else {
      const fallbackEnrollment = await Enrollment.findOne({ user: userId })
        .sort({ createdAt: 1 })
        .select('category');
      if (fallbackEnrollment?.category) {
        derivedCategoryId = fallbackEnrollment.category.toString();
      } else {
        category = await Category.findOne().sort({ createdAt: 1 });
        if (category) {
          derivedCategoryId = category.id;
        }
      }
    }
  }

  if (derivedCategoryId && !category) {
    if (!isAdmin && accessibleCategoryIds && !accessibleCategoryIds.includes(derivedCategoryId)) {
      return res.status(403).json({ message: 'No tienes acceso a esta categoría' });
    }
    category = await Category.findById(derivedCategoryId);
    if (!category && requestedCategoryId) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
  }

  if (!category) {
    const emptySummary = {
      scope: 'global',
      metrics: { players: 0, categories: 0, upcomingMatches: 0, pendingNotifications: 0 },
      ranking: [],
      upcomingMatches: [],
      notifications: [],
    };
    return res.json(emptySummary);
  }

  const categoryId = category.id;

  const enrollmentFilter = { category: categoryId };
  const upcomingFilter = {
    status: { $in: ['pendiente', 'propuesto', 'programado', 'revision'] },
    $or: [{ scheduledAt: { $gte: now } }, { scheduledAt: { $exists: false } }, { scheduledAt: null }],
    category: categoryId,
  };
  const completedFilter = { status: 'completado', 'result.status': 'confirmado', category: categoryId };

  const [
    enrollments,
    completedMatches,
    upcomingMatchesRaw,
    notificationsRaw,
    totalCategories,
    upcomingMatchesCount,
  ] =
    await Promise.all([
      Enrollment.find(enrollmentFilter).populate('user', 'fullName photo'),
      Match.find(completedFilter)
        .populate('players', 'fullName photo')
        .populate('result.winner', 'fullName')
        .populate('category', 'name color'),
      Match.find(upcomingFilter)
        .populate('players', 'fullName photo')
        .populate('category', 'name color')
        .sort({ scheduledAt: 1 })
        .limit(5),
      Notification.find({ status: 'pendiente', recipients: userId })
        .populate({
          path: 'match',
          populate: { path: 'category', select: 'name color' },
        })
        .sort({ scheduledFor: 1 })
        .limit(20),
      Category.countDocuments(),
      Match.countDocuments(upcomingFilter),
    ]);

  const notificationsFiltered = notificationsRaw.filter(
    (notification) => notification.match?.category?.id === categoryId
  );

  const ranking = buildRanking(enrollments, completedMatches).slice(0, 5);

  const playersSet = new Set();
  enrollments.forEach((enrollment) => {
    const key = enrollment.user?.id || enrollment.user?._id?.toString();
    if (key) {
      playersSet.add(key);
    }
  });

  const categoriesCount = isAdmin ? totalCategories ?? 0 : accessibleCategoryIds?.length ?? 0;

  return res.json({
    scope: 'category',
    category: {
      id: category.id,
      name: category.name,
      gender: category.gender,
      color: resolveCategoryColor(category.color),
    },
    metrics: {
      players: playersSet.size,
      categories: categoriesCount,
      upcomingMatches: upcomingMatchesCount,
      pendingNotifications: notificationsFiltered.length,
    },
    ranking,
    upcomingMatches: upcomingMatchesRaw.map(serializeMatch),
    notifications: notificationsFiltered.slice(0, 5).map(serializeNotification),
  });
}

module.exports = {
  getSummary,
};
