const { validationResult } = require('express-validator');
const { Enrollment } = require('../models/Enrollment');
const { Category } = require('../models/Category');
const {
  EnrollmentRequest,
  ENROLLMENT_REQUEST_STATUSES,
} = require('../models/EnrollmentRequest');
const { User, USER_ROLES, userHasRole } = require('../models/User');
const { getCategoryReferenceYear, userMeetsCategoryMinimumAge } = require('../utils/age');

async function enrollPlayer(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { categoryId, userId } = req.body;

  if (!userHasRole(req.user, USER_ROLES.ADMIN)) {
    return res
      .status(403)
      .json({ message: 'Solo un administrador puede completar inscripciones.' });
  }

  const playerId = userId || req.user.id;

  const [category, user] = await Promise.all([
    Category.findById(categoryId),
    User.findById(playerId),
  ]);

  if (!category) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }

  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  if (category.status === 'en_curso') {
    return res.status(400).json({ message: 'La categoría está en curso y no admite nuevas inscripciones.' });
  }

  if (category.gender !== user.gender) {
    return res.status(400).json({ message: 'El género del jugador no coincide con la categoría' });
  }

  const minimumAge = Number(category.minimumAge);
  if (Number.isFinite(minimumAge) && minimumAge > 0) {
    if (!user.birthDate) {
      return res.status(400).json({
        message: 'El jugador debe tener una fecha de nacimiento registrada para inscribirse en esta categoría.',
      });
    }

    if (!userMeetsCategoryMinimumAge(category, user)) {
      const referenceYear = getCategoryReferenceYear(category);
      return res.status(400).json({
        message: `La categoría requiere una edad mínima de ${minimumAge} años durante el año ${referenceYear}.`,
      });
    }
  }

  try {
    const enrollment = await Enrollment.create({
      category: category.id,
      user: user.id,
    });

    await enrollment.populate('user', 'fullName email gender phone photo preferredSchedule birthDate');

    await EnrollmentRequest.findOneAndUpdate(
      {
        category: category.id,
        user: user.id,
        status: ENROLLMENT_REQUEST_STATUSES.PENDING,
      },
      {
        status: ENROLLMENT_REQUEST_STATUSES.APPROVED,
        decisionBy: req.user.id,
        decisionAt: new Date(),
      }
    );

    return res.status(201).json(enrollment);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'El jugador ya está inscrito en la categoría' });
    }
    throw error;
  }
}

async function listEnrollments(req, res) {
  const { categoryId } = req.params;
  const enrollments = await Enrollment.find({ category: categoryId }).populate(
    'user',
    'fullName email gender phone photo preferredSchedule notes birthDate'
  );

  return res.json(enrollments);
}

async function removeEnrollment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { categoryId, enrollmentId } = req.params;

  const enrollment = await Enrollment.findOneAndDelete({
    _id: enrollmentId,
    category: categoryId,
  });

  if (!enrollment) {
    return res.status(404).json({ message: 'Inscripción no encontrada' });
  }

  return res.status(204).send();
}

module.exports = {
  enrollPlayer,
  listEnrollments,
  removeEnrollment,
};
