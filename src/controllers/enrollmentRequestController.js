const { validationResult } = require('express-validator');
const { Enrollment } = require('../models/Enrollment');
const { Category, CATEGORY_STATUSES } = require('../models/Category');
const { EnrollmentRequest, ENROLLMENT_REQUEST_STATUSES } = require('../models/EnrollmentRequest');
const { LEAGUE_STATUS } = require('../models/League');
const { User } = require('../models/User');
const { getCategoryReferenceYear, userMeetsCategoryMinimumAge } = require('../utils/age');

async function requestEnrollment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { categoryId } = req.params;
  const playerId = req.user.id;

  const [category, existingEnrollment, pendingRequest, user] = await Promise.all([
    Category.findById(categoryId).populate('league', 'status registrationCloseDate'),
    Enrollment.findOne({ category: categoryId, user: playerId }),
    EnrollmentRequest.findOne({
      category: categoryId,
      user: playerId,
      status: ENROLLMENT_REQUEST_STATUSES.PENDING,
    }),
    User.findById(playerId).select('gender birthDate'),
  ]);

  if (!category) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }

  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const league = category.league;
  if (league) {
    if (league.status === LEAGUE_STATUS.CLOSED) {
      return res
        .status(400)
        .json({ message: 'La liga está cerrada y no admite nuevas inscripciones.' });
    }

    if (league.registrationCloseDate && new Date() > league.registrationCloseDate) {
      return res
        .status(400)
        .json({ message: 'La fecha máxima de inscripción de la liga ya ha pasado.' });
    }
  }

  if (category.status !== CATEGORY_STATUSES.REGISTRATION) {
    return res
      .status(400)
      .json({ message: 'La categoría no admite nuevas inscripciones en este momento.' });
  }

  if (category.gender !== user.gender) {
    return res
      .status(400)
      .json({ message: 'El género del jugador no coincide con la categoría seleccionada.' });
  }

  const minimumAge = Number(category.minimumAge);
  if (Number.isFinite(minimumAge) && minimumAge > 0) {
    if (!user.birthDate) {
      return res.status(400).json({
        message:
          'Debes registrar tu fecha de nacimiento para solicitar la inscripción en esta categoría.',
      });
    }

    if (!userMeetsCategoryMinimumAge(category, user)) {
      const referenceYear = getCategoryReferenceYear(category);
      return res.status(400).json({
        message: `La categoría requiere una edad mínima de ${minimumAge} años durante el año ${referenceYear}.`,
      });
    }
  }

  if (existingEnrollment) {
    return res.status(409).json({ message: 'Ya estás inscrito en esta categoría.' });
  }

  if (pendingRequest) {
    return res
      .status(409)
      .json({ message: 'Ya existe una solicitud pendiente para esta categoría.' });
  }

  const enrollmentRequest = await EnrollmentRequest.create({
    category: category._id,
    user: playerId,
  });

  await enrollmentRequest.populate('user', 'fullName email phone gender preferredSchedule birthDate');

  return res.status(201).json(enrollmentRequest);
}

async function listEnrollmentRequests(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { categoryId } = req.params;
  const { status } = req.query;

  const validStatuses = Object.values(ENROLLMENT_REQUEST_STATUSES);
  const query = { category: categoryId };
  if (status) {
    const normalizedStatuses = String(status)
      .split(',')
      .map((value) => value.trim())
      .filter((value) => validStatuses.includes(value));
    if (normalizedStatuses.length) {
      query.status = { $in: normalizedStatuses };
    } else {
      query.status = ENROLLMENT_REQUEST_STATUSES.PENDING;
    }
  } else {
    query.status = ENROLLMENT_REQUEST_STATUSES.PENDING;
  }

  const requests = await EnrollmentRequest.find(query)
    .sort({ createdAt: 1 })
    .populate('user', 'fullName email phone gender preferredSchedule birthDate');

  return res.json(requests);
}

async function updateEnrollmentRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { categoryId, requestId } = req.params;
  const { action } = req.body;

  const enrollmentRequest = await EnrollmentRequest.findOne({
    _id: requestId,
    category: categoryId,
  }).populate('user', 'fullName email phone gender preferredSchedule birthDate');

  if (!enrollmentRequest) {
    return res.status(404).json({ message: 'Solicitud no encontrada' });
  }

  if (enrollmentRequest.status !== ENROLLMENT_REQUEST_STATUSES.PENDING) {
    return res.status(400).json({ message: 'La solicitud ya fue revisada previamente.' });
  }

  const decisionAt = new Date();
  enrollmentRequest.decisionBy = req.user.id;
  enrollmentRequest.decisionAt = decisionAt;

  if (action === 'approve') {
    const [category, existingEnrollment] = await Promise.all([
      Category.findById(categoryId).populate('league', 'status registrationCloseDate'),
      Enrollment.findOne({ category: categoryId, user: enrollmentRequest.user.id }),
    ]);

    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    if (category.status !== CATEGORY_STATUSES.REGISTRATION) {
      return res
        .status(400)
        .json({ message: 'La categoría ya no admite nuevas inscripciones.' });
    }

    if (category.league) {
      if (category.league.status === LEAGUE_STATUS.CLOSED) {
        return res
          .status(400)
          .json({ message: 'La liga está cerrada y no admite nuevas inscripciones.' });
      }

      if (
        category.league.registrationCloseDate &&
        new Date() > category.league.registrationCloseDate
      ) {
        return res
          .status(400)
          .json({ message: 'La fecha máxima de inscripción de la liga ya ha pasado.' });
      }
    }

    if (category.gender !== enrollmentRequest.user.gender) {
      return res
        .status(400)
        .json({ message: 'El género del jugador no coincide con la categoría seleccionada.' });
    }

    const minimumAge = Number(category.minimumAge);
    if (Number.isFinite(minimumAge) && minimumAge > 0) {
      if (!enrollmentRequest.user.birthDate) {
        return res.status(400).json({
          message:
            'El jugador debe tener una fecha de nacimiento registrada para inscribirse en esta categoría.',
        });
      }

      if (!userMeetsCategoryMinimumAge(category, enrollmentRequest.user)) {
        const referenceYear = getCategoryReferenceYear(category);
        return res.status(400).json({
          message: `La categoría requiere una edad mínima de ${minimumAge} años durante el año ${referenceYear}.`,
        });
      }
    }

    if (existingEnrollment) {
      enrollmentRequest.status = ENROLLMENT_REQUEST_STATUSES.APPROVED;
      await enrollmentRequest.save();

      return res.json({ request: enrollmentRequest, enrollment: existingEnrollment });
    }

    const enrollment = await Enrollment.create({
      category: category._id,
      user: enrollmentRequest.user.id,
    });

    await enrollment.populate('user', 'fullName email gender phone preferredSchedule birthDate');

    enrollmentRequest.status = ENROLLMENT_REQUEST_STATUSES.APPROVED;
    await enrollmentRequest.save();

    return res.json({ request: enrollmentRequest, enrollment });
  }

  enrollmentRequest.status = ENROLLMENT_REQUEST_STATUSES.REJECTED;
  await enrollmentRequest.save();

  return res.json({ request: enrollmentRequest });
}

module.exports = {
  requestEnrollment,
  listEnrollmentRequests,
  updateEnrollmentRequest,
};
