const { validationResult } = require('express-validator');
const {
  User,
  USER_ROLES,
  GENDERS,
  PREFERRED_SCHEDULES,
  normalizeRoles,
  normalizePreferredSchedule,
} = require('../models/User');
const { hashPassword } = require('../utils/password');

function sanitizeUser(user) {
  const payload = user.toObject({ virtuals: false });
  if (!payload.photo && typeof payload.photoUrl === 'string') {
    payload.photo = payload.photoUrl;
  }
  delete payload.photoUrl;
  delete payload.password;
  const roles = user.getRoles ? user.getRoles() : normalizeRoles(user.roles || user.role);
  payload.roles = roles;
  payload.role = roles.includes(USER_ROLES.ADMIN) ? USER_ROLES.ADMIN : roles[0] || USER_ROLES.PLAYER;
  payload.notifyMatchRequests = user.notifyMatchRequests;
  payload.notifyMatchResults = user.notifyMatchResults;
  payload.birthDate = user.birthDate;
  return payload;
}

async function listPlayers(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { role, search } = req.query;
  const filter = {};

  if (role) {
    filter.$or = [{ roles: role }, { role }];
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ fullName: regex }, { email: regex }];
  }

  const players = await User.find(filter).sort({ fullName: 1 });
  return res.json(players.map((player) => sanitizeUser(player)));
}

async function createPlayer(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    fullName,
    email,
    password,
    gender,
    birthDate,
    role = USER_ROLES.PLAYER,
    roles: rolesInput,
    phone,
    photo,
    preferredSchedule = PREFERRED_SCHEDULES.FLEXIBLE,
    notes,
    notifyMatchRequests,
    notifyMatchResults,
  } = req.body;

  const schedule = normalizePreferredSchedule(preferredSchedule);
  const normalizedNotes = typeof notes === 'string' ? notes.trim() : notes;
  const normalizedPhoto = typeof photo === 'string' ? photo.trim() : photo;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'Ya existe un usuario registrado con ese correo' });
  }

  const roles = normalizeRoles(rolesInput ?? role);

  const user = await User.create({
    fullName,
    email,
    password: hashPassword(password),
    gender,
    birthDate,
    roles,
    role: roles.includes(USER_ROLES.ADMIN) ? USER_ROLES.ADMIN : roles[0],
    phone: phone.trim(),
    photo: normalizedPhoto || undefined,
    preferredSchedule: schedule,
    notes: normalizedNotes || undefined,
    notifyMatchRequests: typeof notifyMatchRequests === 'boolean' ? notifyMatchRequests : true,
    notifyMatchResults: typeof notifyMatchResults === 'boolean' ? notifyMatchResults : true,
  });

  return res.status(201).json(sanitizeUser(user));
}

async function updatePlayer(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { playerId } = req.params;
  const {
    fullName,
    email,
    gender,
    role,
    roles: rolesInput,
    password,
    phone,
    photo,
    preferredSchedule,
    notes,
    notifyMatchRequests,
    notifyMatchResults,
    birthDate,
  } = req.body;

  const player = await User.findById(playerId).select('+password');
  if (!player) {
    return res.status(404).json({ message: 'Jugador no encontrado' });
  }

  if (email && email !== player.email) {
    const duplicate = await User.findOne({ email });
    if (duplicate) {
      return res.status(409).json({ message: 'Ya existe otro usuario con ese correo' });
    }
    player.email = email;
  }

  if (fullName) {
    player.fullName = fullName;
  }

  if (gender) {
    player.gender = gender;
  }

  if (rolesInput || role) {
    const roles = normalizeRoles(rolesInput ?? role);
    player.roles = roles;
    player.role = roles.includes(USER_ROLES.ADMIN) ? USER_ROLES.ADMIN : roles[0];
  }

  if (password) {
    player.password = hashPassword(password);
  }

  if (phone) {
    player.phone = phone.trim();
  }

  if (photo !== undefined) {
    const normalizedPhoto = typeof photo === 'string' ? photo.trim() : photo;
    player.photo = normalizedPhoto || undefined;
  }

  if (preferredSchedule) {
    player.preferredSchedule = normalizePreferredSchedule(preferredSchedule);
  }

  if (notes !== undefined) {
    const normalizedNotes = typeof notes === 'string' ? notes.trim() : notes;
    player.notes = normalizedNotes || undefined;
  }

  if (typeof notifyMatchRequests === 'boolean') {
    player.notifyMatchRequests = notifyMatchRequests;
  }

  if (typeof notifyMatchResults === 'boolean') {
    player.notifyMatchResults = notifyMatchResults;
  }

  if (birthDate) {
    player.birthDate = birthDate;
  }

  await player.save();

  return res.json(sanitizeUser(player));
}

async function deletePlayer(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { playerId } = req.params;

  const player = await User.findByIdAndDelete(playerId);
  if (!player) {
    return res.status(404).json({ message: 'Jugador no encontrado' });
  }

  return res.status(204).send();
}

module.exports = {
  listPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
  USER_ROLES,
  GENDERS,
  PREFERRED_SCHEDULES,
};
