const { validationResult } = require('express-validator');
const {
  Category,
  CATEGORY_SKILL_LEVELS,
  CATEGORY_STATUSES,
  MATCH_FORMATS,
  DEFAULT_CATEGORY_MATCH_FORMAT,
} = require('../models/Category');
const { League, LEAGUE_STATUS } = require('../models/League');
const { Match } = require('../models/Match');
const { Enrollment } = require('../models/Enrollment');
const {
  EnrollmentRequest,
  ENROLLMENT_REQUEST_STATUSES,
} = require('../models/EnrollmentRequest');
const { USER_ROLES, userHasRole } = require('../models/User');
const { getCategoryReferenceYear, userMeetsCategoryMinimumAge } = require('../utils/age');
const { DEFAULT_CATEGORY_COLOR, normalizeHexColor, resolveCategoryColor } = require('../utils/colors');

async function createCategory(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    description,
    gender,
    skillLevel,
    status,
    leagueId,
    minimumAge,
    color,
    matchFormat,
  } = req.body;

  const league = await League.findById(leagueId);
  if (!league) {
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  const normalizedSkillLevel =
    typeof skillLevel === 'string' && skillLevel.trim()
      ? skillLevel.trim()
      : CATEGORY_SKILL_LEVELS.INTERMEDIATE;

  try {
    const normalizedColor = normalizeHexColor(color);
    const normalizedMatchFormat = Object.values(MATCH_FORMATS).includes(matchFormat)
      ? matchFormat
      : DEFAULT_CATEGORY_MATCH_FORMAT;

    const category = await Category.create({
      name,
      description,
      gender,
      skillLevel: normalizedSkillLevel,
      startDate: league.startDate || undefined,
      endDate: league.endDate || undefined,
      status,
      league: league._id,
      minimumAge: minimumAge === null || minimumAge === undefined ? undefined : minimumAge,
      color: normalizedColor || undefined,
      matchFormat: normalizedMatchFormat,
    });

    if (!Array.isArray(league.categories)) {
      league.categories = [];
    }

    const alreadyLinked = league.categories.map((id) => id.toString()).includes(category._id.toString());
    if (!alreadyLinked) {
      league.categories.push(category._id);
      await league.save();
    }

    return res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: 'Ya existe una categoría con ese nombre y género en esta liga' });
    }
    throw error;
  }
}

async function listCategories(req, res) {
  const { leagueId } = req.query;

  const query = {};
  if (leagueId) {
    query.league = leagueId;
  }

  const categories = await Category.find(query)
    .sort({ name: 1 })
    .populate(
      'league',
      'name year status startDate endDate registrationCloseDate enrollmentFee'
    )
    .lean();

  if (!categories.length) {
    return res.json([]);
  }

  const categoryIds = categories.map((category) => category._id);

  const isAdmin = userHasRole(req.user, USER_ROLES.ADMIN);
  const currentGender = req.user?.gender;

  const [counts, myEnrollments, myPendingRequests, pendingCounts] = await Promise.all([
    Enrollment.aggregate([
      { $match: { category: { $in: categoryIds } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
    Enrollment.find({
      category: { $in: categoryIds },
      user: req.user.id,
    })
      .select('category')
      .lean(),
    EnrollmentRequest.find({
      category: { $in: categoryIds },
      user: req.user.id,
      status: ENROLLMENT_REQUEST_STATUSES.PENDING,
    })
      .select('category')
      .lean(),
    isAdmin
      ? EnrollmentRequest.aggregate([
          {
            $match: {
              category: { $in: categoryIds },
              status: ENROLLMENT_REQUEST_STATUSES.PENDING,
            },
          },
          { $group: { _id: '$category', count: { $sum: 1 } } },
        ])
      : [],
  ]);

  const countMap = new Map(
    counts.map((entry) => [entry._id.toString(), entry.count])
  );
  const enrolledSet = new Set(
    myEnrollments.map((enrollment) => enrollment.category.toString())
  );
  const pendingRequestMap = new Map(
    myPendingRequests.map((request) => [request.category.toString(), request._id.toString()])
  );
  const pendingCountMap = new Map(
    (pendingCounts || []).map((entry) => [entry._id.toString(), entry.count])
  );

  const now = new Date();

  const payload = categories.map((category) => {
    const resolvedColor = resolveCategoryColor(category.color);
    const meetsMinimumAge = userMeetsCategoryMinimumAge(category, req.user);
    const minimumAgeReferenceYear =
      category.minimumAge === undefined || category.minimumAge === null
        ? null
        : Number(category.minimumAge) > 0
        ? getCategoryReferenceYear(category)
        : null;
    const league = category.league || null;
    const registrationCloseDate =
      league?.registrationCloseDate instanceof Date
        ? league.registrationCloseDate
        : league?.registrationCloseDate
        ? new Date(league.registrationCloseDate)
        : null;
    const registrationWindowOpen =
      (!registrationCloseDate || now <= registrationCloseDate) &&
      (!league || league.status !== LEAGUE_STATUS.CLOSED);
    const leagueEnrollmentFee =
      typeof league?.enrollmentFee === 'number' ? league.enrollmentFee : null;

    const resolvedMatchFormat = Object.values(MATCH_FORMATS).includes(category.matchFormat)
      ? category.matchFormat
      : DEFAULT_CATEGORY_MATCH_FORMAT;

    return {
      ...category,
      matchFormat: resolvedMatchFormat,
      color: resolvedColor,
      enrollmentCount: countMap.get(category._id.toString()) || 0,
      isEnrolled: enrolledSet.has(category._id.toString()),
      pendingRequestId: pendingRequestMap.get(category._id.toString()) || null,
      canRequestEnrollment:
        Boolean(currentGender) &&
          category.status === CATEGORY_STATUSES.REGISTRATION &&
          category.gender === currentGender &&
          meetsMinimumAge &&
          !enrolledSet.has(category._id.toString()) &&
        !pendingRequestMap.has(category._id.toString()) &&
        registrationWindowOpen,
      pendingRequestCount: pendingCountMap.get(category._id.toString()) || 0,
      meetsMinimumAgeRequirement: meetsMinimumAge,
      minimumAgeReferenceYear,
      leagueRegistrationCloseDate: registrationCloseDate
        ? registrationCloseDate.toISOString()
        : null,
      leagueEnrollmentFee,
      registrationWindowOpen,
    };
  });

  return res.json(payload);
}

async function updateCategory(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { categoryId } = req.params;
  const {
    name,
    description,
    gender,
    skillLevel,
    startDate,
    endDate,
    status,
    leagueId,
    minimumAge,
    color,
    matchFormat,
  } = req.body;

  const isEmptyValue = (value) => value === undefined || value === null || value === '';
  const hasStartDateInput = !isEmptyValue(startDate);
  const hasEndDateInput = !isEmptyValue(endDate);

  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }

  if (name) {
    category.name = name;
  }
  if (description !== undefined) {
    category.description = description;
  }
  if (gender) {
    category.gender = gender;
  }
  if (skillLevel !== undefined) {
    category.skillLevel =
      typeof skillLevel === 'string' && skillLevel.trim()
        ? skillLevel.trim()
        : CATEGORY_SKILL_LEVELS.INTERMEDIATE;
  }
  if (startDate !== undefined) {
    category.startDate = hasStartDateInput ? startDate : undefined;
  }
  if (endDate !== undefined) {
    category.endDate = hasEndDateInput ? endDate : undefined;
  }

  if (status) {
    category.status = status;
  }

  if (minimumAge !== undefined) {
    category.minimumAge = minimumAge === null ? undefined : minimumAge;
  }

  if (color !== undefined) {
    if (color === null) {
      category.color = DEFAULT_CATEGORY_COLOR;
    } else {
      const normalizedColor = normalizeHexColor(color);
      category.color = normalizedColor || DEFAULT_CATEGORY_COLOR;
    }
  }

  if (matchFormat !== undefined) {
    category.matchFormat = Object.values(MATCH_FORMATS).includes(matchFormat)
      ? matchFormat
      : DEFAULT_CATEGORY_MATCH_FORMAT;
  }

  if (leagueId) {
    if (!category.league || category.league.toString() !== leagueId) {
      const newLeague = await League.findById(leagueId);
      if (!newLeague) {
        return res.status(404).json({ message: 'Liga no encontrada' });
      }

      const previousLeagueId = category.league ? category.league.toString() : null;

      category.league = newLeague._id;

      if (startDate === undefined) {
        category.startDate = newLeague.startDate || undefined;
      }
      if (endDate === undefined) {
        category.endDate = newLeague.endDate || undefined;
      }

      if (!Array.isArray(newLeague.categories)) {
        newLeague.categories = [];
      }

      const alreadyLinked = newLeague.categories
        .map((id) => id.toString())
        .includes(category._id.toString());
      if (!alreadyLinked) {
        newLeague.categories.push(category._id);
        await newLeague.save();
      }

      if (previousLeagueId) {
        await League.findByIdAndUpdate(previousLeagueId, {
          $pull: { categories: category._id },
        });
      }
    }
  }

  try {
    await category.save();
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: 'Ya existe una categoría con ese nombre y género en esta liga' });
    }
    throw error;
  }

  return res.json(category);
}

async function deleteCategory(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { categoryId } = req.params;

  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }

  const tasks = [
    Match.deleteMany({ category: categoryId }),
    Enrollment.deleteMany({ category: categoryId }),
    EnrollmentRequest.deleteMany({ category: categoryId }),
    category.deleteOne(),
  ];

  if (category.league) {
    tasks.push(
      League.findByIdAndUpdate(category.league, {
        $pull: { categories: category._id },
      })
    );
  }

  await Promise.all(tasks);

  return res.status(204).send();
}

module.exports = {
  createCategory,
  listCategories,
  updateCategory,
  deleteCategory,
};
