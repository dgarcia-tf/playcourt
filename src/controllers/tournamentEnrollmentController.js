const { validationResult } = require('express-validator');
const { Tournament, TOURNAMENT_STATUS } = require('../models/Tournament');
const { TournamentCategory } = require('../models/TournamentCategory');
const {
  TournamentEnrollment,
  TOURNAMENT_ENROLLMENT_STATUS,
} = require('../models/TournamentEnrollment');
const { User, USER_ROLES, userHasRole } = require('../models/User');

async function ensureTournamentAndCategory(tournamentId, categoryId) {
  const [tournament, category] = await Promise.all([
    Tournament.findById(tournamentId),
    TournamentCategory.findOne({ _id: categoryId, tournament: tournamentId }),
  ]);

  if (!tournament) {
    const error = new Error('Torneo no encontrado');
    error.statusCode = 404;
    throw error;
  }

  if (!category) {
    const error = new Error('Categoría no encontrada');
    error.statusCode = 404;
    throw error;
  }

  return { tournament, category };
}

async function createTournamentEnrollment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;
  const requestedUserId = req.body?.userId;
  const isAdmin = userHasRole(req.user, USER_ROLES.ADMIN);
  const playerId = requestedUserId && (isAdmin || requestedUserId === req.user.id)
    ? requestedUserId
    : req.user.id;

  if (requestedUserId && requestedUserId !== req.user.id && !isAdmin) {
    return res.status(403).json({ message: 'Solo un administrador puede inscribir a otro jugador' });
  }

  let tournament;
  let category;
  try {
    ({ tournament, category } = await ensureTournamentAndCategory(tournamentId, categoryId));
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  if (tournament.status !== TOURNAMENT_STATUS.REGISTRATION) {
    return res.status(400).json({ message: 'El torneo no acepta nuevas inscripciones' });
  }

  if (tournament.registrationCloseDate && new Date() > tournament.registrationCloseDate) {
    return res.status(400).json({ message: 'El período de inscripción está cerrado' });
  }

  const user = await User.findById(playerId);
  if (!user) {
    return res.status(404).json({ message: 'Jugador no encontrado' });
  }

  if (user.gender && category.gender && user.gender !== category.gender) {
    return res.status(400).json({ message: 'El género del jugador no coincide con la categoría' });
  }

  try {
    const enrollment = await TournamentEnrollment.create({
      tournament: tournament.id,
      category: category.id,
      user: user.id,
      status: TOURNAMENT_ENROLLMENT_STATUS.PENDING,
    });

    await enrollment.populate('user', 'fullName email gender phone photo');
    return res.status(201).json(enrollment);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'El jugador ya está inscrito en esta categoría' });
    }
    throw error;
  }
}

async function listTournamentEnrollments(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId } = req.params;

  const enrollments = await TournamentEnrollment.find({
    tournament: tournamentId,
    category: categoryId,
  })
    .populate('user', 'fullName email gender phone photo birthDate')
    .sort({ createdAt: 1 });

  return res.json(enrollments);
}

async function updateEnrollmentStatus(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId, enrollmentId } = req.params;
  const { status } = req.body;

  const enrollment = await TournamentEnrollment.findOne({
    _id: enrollmentId,
    tournament: tournamentId,
    category: categoryId,
  });

  if (!enrollment) {
    return res.status(404).json({ message: 'Inscripción no encontrada' });
  }

  if (!Object.values(TOURNAMENT_ENROLLMENT_STATUS).includes(status)) {
    return res.status(400).json({ message: 'Estado de inscripción inválido' });
  }

  enrollment.status = status;
  await enrollment.save();

  return res.json(enrollment);
}

async function removeTournamentEnrollment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { tournamentId, categoryId, enrollmentId } = req.params;

  const enrollment = await TournamentEnrollment.findOneAndDelete({
    _id: enrollmentId,
    tournament: tournamentId,
    category: categoryId,
  });

  if (!enrollment) {
    return res.status(404).json({ message: 'Inscripción no encontrada' });
  }

  return res.status(204).send();
}

module.exports = {
  createTournamentEnrollment,
  listTournamentEnrollments,
  updateEnrollmentStatus,
  removeTournamentEnrollment,
};
