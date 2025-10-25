const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { Category } = require('../models/Category');
const { Enrollment } = require('../models/Enrollment');
const {
  User,
  USER_ROLES,
  GENDERS,
  PREFERRED_SCHEDULES,
  SHIRT_SIZES,
} = require('../models/User');
const { hashPassword } = require('../utils/password');

const DEMO_PASSWORD = 'Demo1234!';
const MAX_PLAYERS_PER_CATEGORY = 64;
const MAX_AGE = 55;
const MIN_AGE = 18;

const FIRST_NAMES_MALE = [
  'Carlos',
  'Miguel',
  'Alejandro',
  'Javier',
  'Luis',
  'Diego',
  'Raúl',
  'Sergio',
  'Fernando',
  'Hugo',
  'Iván',
  'Jorge',
  'Pablo',
  'Rubén',
  'Tomás',
  'Andrés',
  'Adrián',
  'David',
  'Ismael',
  'Óscar',
];

const FIRST_NAMES_FEMALE = [
  'Laura',
  'Ana',
  'Lucía',
  'María',
  'Elena',
  'Patricia',
  'Sofía',
  'Noelia',
  'Beatriz',
  'Carmen',
  'Silvia',
  'Natalia',
  'Paula',
  'Teresa',
  'Raquel',
  'Irene',
  'Clara',
  'Andrea',
  'Rocío',
  'Marta',
];

const LAST_NAMES = [
  'García',
  'Rodríguez',
  'Fernández',
  'López',
  'Martínez',
  'Sánchez',
  'Pérez',
  'Gómez',
  'Díaz',
  'Álvarez',
  'Romero',
  'Ruiz',
  'Torres',
  'Ramírez',
  'Navarro',
  'Domínguez',
  'Suárez',
  'Aguilar',
  'Castro',
  'Méndez',
];

function pickRandom(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return '';
  }
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function buildFullName(gender) {
  const genderSource =
    gender === GENDERS.FEMALE
      ? FIRST_NAMES_FEMALE
      : gender === GENDERS.MALE
      ? FIRST_NAMES_MALE
      : [...FIRST_NAMES_MALE, ...FIRST_NAMES_FEMALE];
  const firstName = pickRandom(genderSource);
  const lastName = `${pickRandom(LAST_NAMES)} ${pickRandom(LAST_NAMES)}`;
  return `${firstName} ${lastName}`;
}

function randomBirthDate() {
  const now = new Date();
  const age = Math.floor(Math.random() * (MAX_AGE - MIN_AGE + 1)) + MIN_AGE;
  const year = now.getFullYear() - age;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(Date.UTC(year, month, day));
}

function buildDemoEmail(categoryId, index) {
  const shortId = typeof categoryId === 'string' ? categoryId.slice(-6) : 'cat';
  const uniqueFragment = crypto.randomBytes(3).toString('hex');
  return `demo+${shortId}-${index}-${uniqueFragment}@demo.local`;
}

function buildDemoPhone(sequence) {
  const base = 600000000;
  return String(base + sequence);
}

function buildDemoNotes(categoryName) {
  return `Jugador demo generado automáticamente para la categoría "${categoryName}".`;
}

async function activateDemoMode(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (!req.body?.confirm) {
    return res.status(200).json({
      warning:
        'Advertencia: vas a cargar un entorno demo con jugadores ficticios. Confirma enviando { "confirm": true } en el cuerpo de la petición.',
      message:
        'No se ha creado ningún dato. Repite la solicitud con "confirm" en true para proceder con la generación del modo demo.',
    });
  }

  const categories = await Category.find({}).sort({ name: 1 });
  if (!categories.length) {
    return res.status(404).json({ message: 'No hay categorías registradas para generar el modo demo.' });
  }

  const hashedPassword = hashPassword(DEMO_PASSWORD);
  let sequence = 0;
  const summary = [];
  let totalCreated = 0;

  for (const category of categories) {
    const existingCount = await Enrollment.countDocuments({ category: category._id });
    const capacityRemaining = Math.max(0, MAX_PLAYERS_PER_CATEGORY - existingCount);
    let createdForCategory = 0;

    for (let i = 0; i < capacityRemaining; i += 1) {
      const gender =
        category.gender === GENDERS.MIXED
          ? pickRandom([GENDERS.MALE, GENDERS.FEMALE])
          : category.gender;

      const fullName = buildFullName(gender);
      const email = buildDemoEmail(category.id, existingCount + i + 1);
      const preferredSchedule = pickRandom(Object.values(PREFERRED_SCHEDULES));
      const shirtSize = pickRandom(Object.values(SHIRT_SIZES));
      const phone = buildDemoPhone(sequence + i);

      const user = await User.create({
        fullName,
        email,
        password: hashedPassword,
        gender,
        birthDate: randomBirthDate(),
        roles: [USER_ROLES.PLAYER],
        role: USER_ROLES.PLAYER,
        phone,
        preferredSchedule,
        notes: buildDemoNotes(category.name),
        notifyMatchRequests: false,
        notifyMatchResults: false,
        isMember: false,
        membershipNumberVerified: false,
        shirtSize,
      });

      await Enrollment.create({ user: user._id, category: category._id });

      createdForCategory += 1;
    }

    sequence += capacityRemaining;
    totalCreated += createdForCategory;

    summary.push({
      categoryId: category.id,
      categoryName: category.name,
      createdPlayers: createdForCategory,
      totalPlayers: existingCount + createdForCategory,
    });
  }

  return res.status(201).json({
    warning:
      'Entorno demo cargado: se han generado jugadores ficticios para las categorías disponibles. Recuerda limpiar los datos antes de trabajar en producción.',
    message: 'Modo demo activado correctamente.',
    totalPlayersCreated: totalCreated,
    categories: summary,
  });
}

module.exports = {
  activateDemoMode,
};
