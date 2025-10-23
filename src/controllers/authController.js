const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const {
  User,
  USER_ROLES,
  normalizeRoles,
  normalizePreferredSchedule,
  normalizeShirtSize,
} = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/password');

function generateToken(user) {
  const payload = {
    sub: user.id,
    role: user.role,
    roles: user.getRoles ? user.getRoles() : normalizeRoles(user.roles || user.role),
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '12h',
  });
}

function serializeUser(user) {
  const legacyPhoto = typeof user.photoUrl === 'string' ? user.photoUrl : undefined;
  const roles = user.getRoles ? user.getRoles() : normalizeRoles(user.roles || user.role);
  const primaryRole = roles.includes(USER_ROLES.ADMIN)
    ? USER_ROLES.ADMIN
    : roles[0] || USER_ROLES.PLAYER;
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: primaryRole,
    roles,
    gender: user.gender,
    birthDate: user.birthDate,
    phone: user.phone,
    isMember: Boolean(user.isMember),
    membershipNumber: user.membershipNumber || null,
    photo: user.photo || legacyPhoto,
    preferredSchedule: user.preferredSchedule,
    notes: user.notes,
    notifyMatchRequests: user.notifyMatchRequests,
    notifyMatchResults: user.notifyMatchResults,
    shirtSize: user.shirtSize || null,
  };
}

async function register(req, res) {
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
    role,
    roles: rolesInput,
    phone,
    photo,
    preferredSchedule,
    notes,
    notifyMatchRequests,
    notifyMatchResults,
    isMember,
    membershipNumber,
    shirtSize,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'El correo ya está registrado' });
  }

  const adminExists = await User.exists({ roles: USER_ROLES.ADMIN });

  const requestedRoles = rolesInput ?? role;
  let roles = normalizeRoles(requestedRoles);

  if (adminExists) {
    roles = normalizeRoles(roles.filter((item) => item !== USER_ROLES.ADMIN));
  } else if (!roles.includes(USER_ROLES.ADMIN)) {
    roles = normalizeRoles([...roles, USER_ROLES.ADMIN]);
  }

  if (!roles.length) {
    roles = [USER_ROLES.PLAYER];
  }

  const hashedPassword = hashPassword(password);
  const normalizedPhone = typeof phone === 'string' ? phone.trim() : phone;
  const normalizedPhoto = typeof photo === 'string' ? photo.trim() : photo;
  const normalizedNotes = typeof notes === 'string' ? notes.trim() : notes;
  const selectedSchedule = normalizePreferredSchedule(preferredSchedule);
  const memberFlag = typeof isMember === 'boolean' ? isMember : false;
  const normalizedMembershipNumber =
    typeof membershipNumber === 'string' ? membershipNumber.trim() : '';
  const normalizedShirtSize = normalizeShirtSize(shirtSize);

  if (!normalizedShirtSize) {
    return res.status(400).json({ message: 'Selecciona una talla de camiseta válida' });
  }

  if (memberFlag && !normalizedMembershipNumber) {
    return res
      .status(400)
      .json({ message: 'El número de socio es obligatorio para los socios' });
  }

  if (memberFlag && normalizedMembershipNumber) {
    const membershipExists = await User.exists({ membershipNumber: normalizedMembershipNumber });
    if (membershipExists) {
      return res
        .status(409)
        .json({ message: 'Ya existe un usuario con el mismo número de socio' });
    }
  }

  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    gender,
    birthDate,
    phone: normalizedPhone,
    photo: normalizedPhoto || undefined,
    preferredSchedule: selectedSchedule,
    notes: normalizedNotes || undefined,
    roles,
    role: roles.includes(USER_ROLES.ADMIN) ? USER_ROLES.ADMIN : roles[0],
    isMember: memberFlag,
    membershipNumber: memberFlag && normalizedMembershipNumber ? normalizedMembershipNumber : undefined,
    notifyMatchRequests: typeof notifyMatchRequests === 'boolean' ? notifyMatchRequests : true,
    notifyMatchResults: typeof notifyMatchResults === 'boolean' ? notifyMatchResults : true,
    shirtSize: normalizedShirtSize,
  });

  const token = generateToken(user);

  return res.status(201).json({
    token,
    user: serializeUser(user),
    setupCompleted: Boolean(adminExists || user.hasRole?.(USER_ROLES.ADMIN)),
  });
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const token = generateToken(user);

  return res.json({
    token,
    user: serializeUser(user),
  });
}

async function getSetupStatus(_req, res) {
  const adminExists = await User.exists({ roles: USER_ROLES.ADMIN });

  return res.json({
    needsSetup: !adminExists,
  });
}

async function getProfile(req, res) {
  return res.json({ user: serializeUser(req.user) });
}

async function updateProfile(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    fullName,
    email,
    gender,
    phone,
    photo,
    preferredSchedule,
    notes,
    password,
    birthDate,
    notifyMatchRequests,
    notifyMatchResults,
    isMember,
    membershipNumber,
    shirtSize,
  } = req.body;

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  if (email && email !== user.email) {
    const exists = await User.exists({ email });
    if (exists) {
      return res.status(409).json({ message: 'El correo ya está registrado por otro usuario' });
    }
    user.email = email;
  }

  if (fullName) {
    user.fullName = fullName;
  }

  if (gender) {
    user.gender = gender;
  }

  if (phone) {
    user.phone = phone.trim();
  }

  if (photo !== undefined) {
    user.photo = photo ? photo.trim() : undefined;
  }

  if (birthDate) {
    user.birthDate = birthDate;
  }

  if (preferredSchedule) {
    user.preferredSchedule = normalizePreferredSchedule(preferredSchedule);
  }

  if (notes !== undefined) {
    user.notes = notes ? notes.trim() : undefined;
  }

  if (shirtSize !== undefined) {
    const normalizedShirtSize = normalizeShirtSize(shirtSize);
    if (!normalizedShirtSize) {
      return res.status(400).json({ message: 'Selecciona una talla de camiseta válida' });
    }
    user.shirtSize = normalizedShirtSize;
  }

  let nextMemberFlag = typeof isMember === 'boolean' ? isMember : user.isMember;

  if (typeof notifyMatchRequests === 'boolean') {
    user.notifyMatchRequests = notifyMatchRequests;
  }

  if (typeof notifyMatchResults === 'boolean') {
    user.notifyMatchResults = notifyMatchResults;
  }

  if (password) {
    user.password = hashPassword(password);
  }

  if (membershipNumber !== undefined) {
    const normalizedMembershipNumber =
      typeof membershipNumber === 'string' ? membershipNumber.trim() : '';

    if (nextMemberFlag && !normalizedMembershipNumber) {
      return res
        .status(400)
        .json({ message: 'El número de socio es obligatorio para los socios' });
    }

    if (
      nextMemberFlag &&
      normalizedMembershipNumber &&
      normalizedMembershipNumber !== user.membershipNumber
    ) {
      const duplicateMembership = await User.exists({
        membershipNumber: normalizedMembershipNumber,
        _id: { $ne: user.id },
      });
      if (duplicateMembership) {
        return res
          .status(409)
          .json({ message: 'Ya existe un usuario con el mismo número de socio' });
      }
    }

    user.membershipNumber = nextMemberFlag && normalizedMembershipNumber
      ? normalizedMembershipNumber
      : undefined;
  } else if (typeof isMember === 'boolean' && !isMember) {
    user.membershipNumber = undefined;
  }

  user.isMember = Boolean(nextMemberFlag);

  await user.save();

  return res.json({ user: serializeUser(user) });
}

module.exports = {
  register,
  login,
  getSetupStatus,
  getProfile,
  updateProfile,
};
