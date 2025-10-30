const { validationResult } = require('express-validator');
const {
  User,
  USER_ROLES,
  GENDERS,
  PREFERRED_SCHEDULES,
  normalizeRoles,
  normalizePreferredSchedule,
  normalizeShirtSize,
} = require('../models/User');
const { hashPassword } = require('../utils/password');
const { notifyAdminsOfNewUser } = require('../services/sequelize/userNotificationService');

function slugifyName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

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
  payload.isMember = Boolean(user.isMember);
  payload.membershipNumber = user.membershipNumber || null;
  payload.membershipNumberVerified = Boolean(user.membershipNumberVerified);
  payload.shirtSize = user.shirtSize || null;
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
    isMember,
    membershipNumber,
    shirtSize,
  } = req.body;

  const schedule = normalizePreferredSchedule(preferredSchedule);
  const normalizedNotes = typeof notes === 'string' ? notes.trim() : notes;
  const normalizedPhoto = typeof photo === 'string' ? photo.trim() : photo;
  const memberFlag = typeof isMember === 'boolean' ? isMember : false;
  const normalizedMembershipNumber =
    typeof membershipNumber === 'string' ? membershipNumber.trim() : '';
  const normalizedShirtSize = normalizeShirtSize(shirtSize);
  const membershipNumberVerified = Boolean(req.body.membershipNumberVerified);

  if (!normalizedShirtSize) {
    return res
      .status(400)
      .json({ message: 'Selecciona una talla de camiseta válida para el usuario.' });
  }

  if (memberFlag && !normalizedMembershipNumber) {
    return res
      .status(400)
      .json({ message: 'El número de socio es obligatorio para los socios' });
  }

  if (!memberFlag && membershipNumberVerified) {
    return res
      .status(400)
      .json({ message: 'Solo puedes validar el número de socio para usuarios marcados como socios.' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'Ya existe un usuario registrado con ese correo' });
  }

  if (memberFlag && normalizedMembershipNumber) {
    const membershipExists = await User.exists({ membershipNumber: normalizedMembershipNumber });
    if (membershipExists) {
      return res
        .status(409)
        .json({ message: 'Ya existe un usuario con el mismo número de socio' });
    }
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
    isMember: memberFlag,
    membershipNumber: memberFlag && normalizedMembershipNumber ? normalizedMembershipNumber : undefined,
    notifyMatchRequests: typeof notifyMatchRequests === 'boolean' ? notifyMatchRequests : true,
    notifyMatchResults: typeof notifyMatchResults === 'boolean' ? notifyMatchResults : true,
    membershipNumberVerified:
      memberFlag && normalizedMembershipNumber ? membershipNumberVerified : false,
    shirtSize: normalizedShirtSize,
  });

  await notifyAdminsOfNewUser(user, { actorId: req.user?.id });

  return res.status(201).json(sanitizeUser(user));
}

async function createDemoPlayers(req, res) {
  const DEMO_PLAYER_MALE_PHOTO =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAY0lEQVR4nO3PQQ3AIADAQMAJpjGKgYngcVnSU9DOfe74s6UDXjWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgfYv+Airwo7ydAAAAAElFTkSuQmCC';
  const DEMO_PLAYER_FEMALE_PHOTO =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAY0lEQVR4nO3PQQ3AIADAQEAI5lCPi4ngcVnSU9DOu8/4s6UDXjWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgfX0iAeqJMjWDAAAAAElFTkSuQmCC';

  const malePlayers = [
    { fullName: 'Novak Djokovic', birthDate: '1987-05-22' },
    { fullName: 'Carlos Alcaraz', birthDate: '2003-05-05' },
    { fullName: 'Jannik Sinner', birthDate: '2001-08-16' },
    { fullName: 'Daniil Medvedev', birthDate: '1996-02-11' },
    { fullName: 'Alexander Zverev', birthDate: '1997-04-20' },
    { fullName: 'Holger Rune', birthDate: '2003-04-29' },
    { fullName: 'Stefanos Tsitsipas', birthDate: '1998-08-12' },
    { fullName: 'Andrey Rublev', birthDate: '1997-10-20' },
    { fullName: 'Casper Ruud', birthDate: '1998-12-22' },
    { fullName: 'Taylor Fritz', birthDate: '1997-10-28' },
    { fullName: 'Frances Tiafoe', birthDate: '1998-01-20' },
    { fullName: 'Hubert Hurkacz', birthDate: '1997-02-11' },
    { fullName: 'Karen Khachanov', birthDate: '1996-05-21' },
    { fullName: 'Tommy Paul', birthDate: '1997-05-17' },
    { fullName: 'Alex de Minaur', birthDate: '1999-02-17' },
    { fullName: 'Felix Auger-Aliassime', birthDate: '2000-08-08' },
    { fullName: 'Cameron Norrie', birthDate: '1995-08-23' },
    { fullName: 'Lorenzo Musetti', birthDate: '2002-03-03' },
    { fullName: 'Matteo Berrettini', birthDate: '1996-04-12' },
    { fullName: 'Grigor Dimitrov', birthDate: '1991-05-16' },
    { fullName: 'Alexander Bublik', birthDate: '1997-06-17' },
    { fullName: 'Roberto Bautista Agut', birthDate: '1988-04-14' },
    { fullName: 'Denis Shapovalov', birthDate: '1999-04-15' },
    { fullName: 'Pablo Carreno Busta', birthDate: '1991-07-12' },
    { fullName: 'Nick Kyrgios', birthDate: '1995-04-27' },
    { fullName: 'Borna Coric', birthDate: '1996-11-14' },
    { fullName: 'Sebastian Korda', birthDate: '2000-07-05' },
    { fullName: 'Dominic Thiem', birthDate: '1993-09-03' },
    { fullName: 'Gael Monfils', birthDate: '1986-09-01' },
    { fullName: 'Marin Cilic', birthDate: '1988-09-28' },
    { fullName: 'Yoshihito Nishioka', birthDate: '1995-09-27' },
    { fullName: 'Ben Shelton', birthDate: '2002-10-09' },
  ].map((player) => ({ ...player, gender: GENDERS.MALE, photo: DEMO_PLAYER_MALE_PHOTO }));

  const femalePlayers = [
    { fullName: 'Iga Swiatek', birthDate: '2001-05-31' },
    { fullName: 'Aryna Sabalenka', birthDate: '1998-05-05' },
    { fullName: 'Coco Gauff', birthDate: '2004-03-13' },
    { fullName: 'Elena Rybakina', birthDate: '1999-06-17' },
    { fullName: 'Jessica Pegula', birthDate: '1994-02-24' },
    { fullName: 'Ons Jabeur', birthDate: '1994-08-28' },
    { fullName: 'Maria Sakkari', birthDate: '1995-07-25' },
    { fullName: 'Caroline Garcia', birthDate: '1993-10-16' },
    { fullName: 'Daria Kasatkina', birthDate: '1997-05-07' },
    { fullName: 'Veronika Kudermetova', birthDate: '1997-04-24' },
    { fullName: 'Belinda Bencic', birthDate: '1997-03-10' },
    { fullName: 'Petra Kvitova', birthDate: '1990-03-08' },
    { fullName: 'Barbora Krejcikova', birthDate: '1995-12-18' },
    { fullName: 'Paula Badosa', birthDate: '1997-11-15' },
    { fullName: 'Beatriz Haddad Maia', birthDate: '1996-05-30' },
    { fullName: 'Jelena Ostapenko', birthDate: '1997-06-08' },
    { fullName: 'Madison Keys', birthDate: '1995-02-17' },
    { fullName: 'Liudmila Samsonova', birthDate: '1998-11-11' },
    { fullName: 'Karolina Pliskova', birthDate: '1992-03-21' },
    { fullName: 'Elina Svitolina', birthDate: '1994-09-12' },
    { fullName: 'Victoria Azarenka', birthDate: '1989-07-31' },
    { fullName: 'Anastasia Potapova', birthDate: '2001-03-30' },
    { fullName: 'Ekaterina Alexandrova', birthDate: '1994-11-15' },
    { fullName: 'Magda Linette', birthDate: '1992-02-12' },
    { fullName: 'Qinwen Zheng', birthDate: '2002-10-08' },
    { fullName: 'Donna Vekic', birthDate: '1996-06-28' },
    { fullName: 'Bianca Andreescu', birthDate: '2000-06-16' },
    { fullName: 'Sloane Stephens', birthDate: '1993-03-20' },
    { fullName: 'Simona Halep', birthDate: '1991-09-27' },
    { fullName: 'Marketa Vondrousova', birthDate: '1999-06-28' },
    { fullName: 'Sorana Cirstea', birthDate: '1990-04-07' },
    { fullName: 'Marta Kostyuk', birthDate: '2002-06-28' },
  ].map((player) => ({ ...player, gender: GENDERS.FEMALE, photo: DEMO_PLAYER_FEMALE_PHOTO }));

  const demoPlayers = [...malePlayers, ...femalePlayers];

  const createdPlayers = [];
  const skippedPlayers = [];
  let playerIndex = 0;
  const demoPassword = process.env.DEMO_PLAYER_PASSWORD || 'Demo1234!';
  const hashedPassword = hashPassword(demoPassword);

  for (const player of demoPlayers) {
    playerIndex += 1;
    const slug = slugifyName(player.fullName);
    const email = `demo-${player.gender === GENDERS.MALE ? 'atp' : 'wta'}-${slug}@demo.tenis`;

    const existing = await User.findOne({ email });
    if (existing) {
      skippedPlayers.push(player.fullName);
      continue;
    }

    const birthDate = new Date(player.birthDate);

    const created = await User.create({
      fullName: player.fullName,
      email,
      password: hashedPassword,
      gender: player.gender,
      birthDate,
      photo: player.photo,
      roles: [USER_ROLES.PLAYER],
      role: USER_ROLES.PLAYER,
      phone: (600000000 + playerIndex).toString(),
      preferredSchedule: PREFERRED_SCHEDULES.FLEXIBLE,
      notifyMatchRequests: true,
      notifyMatchResults: true,
      isMember: false,
      membershipNumberVerified: false,
      shirtSize: player.gender === GENDERS.MALE ? 'L' : 'M',
      notes: 'Jugador generado automáticamente para el modo demo.',
    });

    createdPlayers.push(created.fullName);
  }

  return res.status(201).json({
    created: createdPlayers,
    skipped: skippedPlayers,
    totalCreated: createdPlayers.length,
    totalSkipped: skippedPlayers.length,
    password: demoPassword,
  });
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
    isMember,
    membershipNumber,
    shirtSize,
  } = req.body;

  const player = await User.findById(playerId).select('+password');
  if (!player) {
    return res.status(404).json({ message: 'Jugador no encontrado' });
  }

  const previousMembershipNumber = player.membershipNumber || '';
  const previousIsMember = Boolean(player.isMember);
  const requestedMembershipNumberVerified =
    typeof req.body.membershipNumberVerified === 'boolean'
      ? req.body.membershipNumberVerified
      : undefined;

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

  if (shirtSize !== undefined) {
    const normalizedShirtSize = normalizeShirtSize(shirtSize);
    if (!normalizedShirtSize) {
      return res
        .status(400)
        .json({ message: 'Selecciona una talla de camiseta válida para el usuario.' });
    }
    player.shirtSize = normalizedShirtSize;
  }

  let nextMemberFlag = typeof isMember === 'boolean' ? isMember : player.isMember;

  if (typeof notifyMatchRequests === 'boolean') {
    player.notifyMatchRequests = notifyMatchRequests;
  }

  if (typeof notifyMatchResults === 'boolean') {
    player.notifyMatchResults = notifyMatchResults;
  }

  if (birthDate) {
    player.birthDate = birthDate;
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
      normalizedMembershipNumber !== previousMembershipNumber
    ) {
      const duplicateMembership = await User.exists({
        membershipNumber: normalizedMembershipNumber,
        _id: { $ne: player.id },
      });
      if (duplicateMembership) {
        return res
          .status(409)
          .json({ message: 'Ya existe un usuario con el mismo número de socio' });
      }
    }

    player.membershipNumber = nextMemberFlag && normalizedMembershipNumber
      ? normalizedMembershipNumber
      : undefined;
  } else if (typeof isMember === 'boolean' && !isMember) {
    player.membershipNumber = undefined;
  }

  player.isMember = Boolean(nextMemberFlag);

  const currentMembershipNumber = player.membershipNumber || '';
  const membershipStatusChanged =
    currentMembershipNumber !== previousMembershipNumber ||
    player.isMember !== previousIsMember;

  if (!player.isMember) {
    player.membershipNumberVerified = false;
  } else if (requestedMembershipNumberVerified !== undefined) {
    if (requestedMembershipNumberVerified && !player.membershipNumber) {
      return res
        .status(400)
        .json({ message: 'No puedes validar un número de socio sin especificarlo.' });
    }

    if (!requestedMembershipNumberVerified) {
      player.membershipNumberVerified = false;
    } else {
      player.membershipNumberVerified = true;
    }
  } else if (membershipStatusChanged) {
    player.membershipNumberVerified = false;
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
  createDemoPlayers,
  updatePlayer,
  deletePlayer,
  USER_ROLES,
  GENDERS,
  PREFERRED_SCHEDULES,
};
