const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { Category } = require('../models/Category');
const { Enrollment } = require('../models/Enrollment');
const { Tournament, TOURNAMENT_STATUS } = require('../models/Tournament');
const {
  TournamentCategory,
  TOURNAMENT_CATEGORY_MATCH_TYPES,
  TOURNAMENT_CATEGORY_MATCH_FORMATS,
  TOURNAMENT_CATEGORY_STATUSES,
} = require('../models/TournamentCategory');
const { League, LEAGUE_STATUS } = require('../models/League');
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
const LEAGUE_PLAYERS_PER_CATEGORY = 15;
const MAX_AGE = 55;
const MIN_AGE = 18;

const PREFERRED_SCHEDULE_OPTIONS = Object.values(PREFERRED_SCHEDULES);
const SHIRT_SIZE_OPTIONS = Object.values(SHIRT_SIZES);

const DEMO_TOURNAMENT_CATEGORIES = [
  {
    name: 'Absoluto Masculino',
    gender: GENDERS.MALE,
    matchType: TOURNAMENT_CATEGORY_MATCH_TYPES.SINGLES,
    matchFormat: TOURNAMENT_CATEGORY_MATCH_FORMATS.TWO_SETS_SIX_GAMES_SUPER_TB,
  },
  {
    name: 'Absoluto Femenino',
    gender: GENDERS.FEMALE,
    matchType: TOURNAMENT_CATEGORY_MATCH_TYPES.SINGLES,
    matchFormat: TOURNAMENT_CATEGORY_MATCH_FORMATS.TWO_SETS_SIX_GAMES_SUPER_TB,
  },
  {
    name: '+35 Masculino',
    gender: GENDERS.MALE,
    matchType: TOURNAMENT_CATEGORY_MATCH_TYPES.SINGLES,
    matchFormat: TOURNAMENT_CATEGORY_MATCH_FORMATS.TWO_SETS_SIX_GAMES_SUPER_TB,
  },
  {
    name: '+45 Masculino',
    gender: GENDERS.MALE,
    matchType: TOURNAMENT_CATEGORY_MATCH_TYPES.SINGLES,
    matchFormat: TOURNAMENT_CATEGORY_MATCH_FORMATS.TWO_SETS_SIX_GAMES_SUPER_TB,
  },
  {
    name: 'Dobles Mixtos',
    gender: GENDERS.MIXED,
    matchType: TOURNAMENT_CATEGORY_MATCH_TYPES.DOUBLES,
    matchFormat: TOURNAMENT_CATEGORY_MATCH_FORMATS.TWO_SETS_FOUR_GAMES_SUPER_TB,
  },
];

const DEMO_TOURNAMENTS = [
  {
    name: 'Torneo Demo Apertura',
    description: 'Evento de demostración con múltiples categorías para visualizar el módulo de torneos.',
  },
  {
    name: 'Torneo Demo Clausura',
    description: 'Competencia de ejemplo para practicar la gestión de cuadros y categorías.',
  },
];

const DEMO_LEAGUES = [
  {
    name: 'Liga Demo Apertura',
    description: 'Liga de muestra para ver clasificaciones y gestión diaria.',
    categories: [
      {
        name: 'Serie Demo Masculina',
        gender: GENDERS.MALE,
      },
      {
        name: 'Serie Demo Femenina',
        gender: GENDERS.FEMALE,
      },
    ],
  },
  {
    name: 'Liga Demo Clausura',
    description: 'Liga de práctica para probar seguimiento de resultados.',
    categories: [
      {
        name: 'Grupo Demo Masculino',
        gender: GENDERS.MALE,
      },
      {
        name: 'Grupo Demo Femenino',
        gender: GENDERS.FEMALE,
      },
    ],
  },
];

function addDaysUtc(baseDate, days) {
  const result = new Date(baseDate.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function ensureGenderBucket(registry, gender) {
  if (!registry[gender]) {
    registry[gender] = [];
  }
  return registry[gender];
}

function nextSequence(sequenceState) {
  const current = sequenceState.value;
  sequenceState.value += 1;
  return current;
}

async function createDemoUser({
  gender,
  hashedPassword,
  sequenceState,
  emailContext,
  notesContext,
}) {
  const seq = nextSequence(sequenceState);
  const fullName = buildFullName(gender);
  const email = buildDemoEmail(emailContext, seq + 1);
  const preferredSchedule = pickRandom(PREFERRED_SCHEDULE_OPTIONS);
  const shirtSize = pickRandom(SHIRT_SIZE_OPTIONS);
  const phone = buildDemoPhone(seq);

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
    notes: buildDemoNotes(notesContext),
    notifyMatchRequests: false,
    notifyMatchResults: false,
    isMember: false,
    membershipNumberVerified: false,
    shirtSize,
  });

  return { user, fullName };
}

async function ensureDemoTournaments() {
  const tournamentsSummary = [];
  const now = new Date();

  for (let index = 0; index < DEMO_TOURNAMENTS.length; index += 1) {
    const config = DEMO_TOURNAMENTS[index];
    let tournament = await Tournament.findOne({ name: config.name });
    let created = false;

    if (!tournament) {
      const startDate = addDaysUtc(now, 14 + index * 10);
      const endDate = addDaysUtc(startDate, 3);
      tournament = await Tournament.create({
        name: config.name,
        description: config.description,
        startDate,
        endDate,
        registrationCloseDate: addDaysUtc(startDate, -7),
        isPrivate: false,
        hasShirt: true,
        hasGiftBag: true,
        status: TOURNAMENT_STATUS.REGISTRATION,
        categories: [],
      });
      created = true;
    }

    const categorySummaries = [];
    const updatedCategories = [...(tournament.categories || [])];
    const existingCategoryIds = new Set(updatedCategories.map((id) => id.toString()));
    let categoriesChanged = false;

    for (const categoryConfig of DEMO_TOURNAMENT_CATEGORIES) {
      let tournamentCategory = await TournamentCategory.findOne({
        tournament: tournament._id,
        name: categoryConfig.name,
        gender: categoryConfig.gender,
      });

      let categoryCreated = false;

      if (!tournamentCategory) {
        tournamentCategory = await TournamentCategory.create({
          tournament: tournament._id,
          name: categoryConfig.name,
          gender: categoryConfig.gender,
          matchType: categoryConfig.matchType,
          matchFormat: categoryConfig.matchFormat,
          status: TOURNAMENT_CATEGORY_STATUSES.REGISTRATION,
        });
        categoryCreated = true;
      }

      const categoryId = tournamentCategory._id.toString();
      if (!existingCategoryIds.has(categoryId)) {
        updatedCategories.push(tournamentCategory._id);
        existingCategoryIds.add(categoryId);
        categoriesChanged = true;
      }

      categorySummaries.push({
        categoryId: tournamentCategory.id,
        categoryName: tournamentCategory.name,
        gender: tournamentCategory.gender,
        created: categoryCreated,
      });
    }

    if (categoriesChanged) {
      tournament.categories = updatedCategories;
      await tournament.save();
    }

    tournamentsSummary.push({
      tournamentId: tournament.id,
      name: tournament.name,
      created,
      categories: categorySummaries,
    });
  }

  return tournamentsSummary;
}

async function ensureDemoLeagues({ hashedPassword, sequenceState, createdPlayersByGender }) {
  const leaguesSummary = [];
  let additionalPlayersCreated = 0;
  const now = new Date();
  const currentYear = now.getUTCFullYear();

  const getPlayersForCategory = async (gender, count, contextLabel) => {
    const bucket = ensureGenderBucket(createdPlayersByGender, gender);
    const pool = [...bucket];
    const selected = [];

    while (selected.length < Math.min(count, pool.length)) {
      const index = Math.floor(Math.random() * pool.length);
      const [player] = pool.splice(index, 1);
      selected.push(player);
    }

    while (selected.length < count) {
      const { user, fullName } = await createDemoUser({
        gender,
        hashedPassword,
        sequenceState,
        emailContext: `league-${contextLabel}`,
        notesContext: contextLabel,
      });

      const entry = { userId: user._id, fullName, gender };
      bucket.push(entry);
      selected.push(entry);
      additionalPlayersCreated += 1;
    }

    return selected;
  };

  for (const leagueConfig of DEMO_LEAGUES) {
    let league = await League.findOne({ name: leagueConfig.name });
    let created = false;

    if (!league) {
      league = await League.create({
        name: leagueConfig.name,
        description: leagueConfig.description,
        year: currentYear,
        startDate: addDaysUtc(now, -30),
        endDate: addDaysUtc(now, 90),
        status: LEAGUE_STATUS.ACTIVE,
        registrationCloseDate: addDaysUtc(now, 14),
        categories: [],
      });
      created = true;
    }

    const updatedCategories = [...(league.categories || [])];
    const existingCategoryIds = new Set(updatedCategories.map((id) => id.toString()));
    const leagueCategoriesSummary = [];

    for (const categoryConfig of leagueConfig.categories) {
      let category = await Category.findOne({
        league: league._id,
        name: categoryConfig.name,
        gender: categoryConfig.gender,
      });

      let categoryCreated = false;

      if (!category) {
        category = await Category.create({
          name: categoryConfig.name,
          gender: categoryConfig.gender,
          league: league._id,
          description: leagueConfig.description,
          startDate: addDaysUtc(now, -30),
          endDate: addDaysUtc(now, 90),
        });
        categoryCreated = true;
      }

      const categoryId = category._id.toString();
      if (!existingCategoryIds.has(categoryId)) {
        updatedCategories.push(category._id);
        existingCategoryIds.add(categoryId);
      }

      const currentCount = await Enrollment.countDocuments({ category: category._id });
      const remainingSlots = Math.max(0, LEAGUE_PLAYERS_PER_CATEGORY - currentCount);
      let addedPlayers = 0;
      let totalPlayers = currentCount;

      if (remainingSlots > 0) {
        const players = await getPlayersForCategory(
          categoryConfig.gender === GENDERS.MIXED
            ? pickRandom([GENDERS.MALE, GENDERS.FEMALE])
            : categoryConfig.gender,
          remainingSlots,
          `${league.name} ${category.name}`
        );

        for (const player of players) {
          const alreadyEnrolled = await Enrollment.exists({
            user: player.userId,
            category: category._id,
          });

          if (!alreadyEnrolled) {
            await Enrollment.create({ user: player.userId, category: category._id });
            addedPlayers += 1;
            totalPlayers += 1;
          }
        }
      }

      leagueCategoriesSummary.push({
        categoryId: category.id,
        categoryName: category.name,
        gender: categoryConfig.gender,
        created: categoryCreated,
        addedPlayers,
        totalPlayers,
      });
    }

    if (updatedCategories.length !== (league.categories || []).length) {
      league.categories = updatedCategories;
      await league.save();
    }

    leaguesSummary.push({
      leagueId: league.id,
      name: league.name,
      created,
      categories: leagueCategoriesSummary,
    });
  }

  return { leaguesSummary, additionalPlayersCreated };
}

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
  const sequenceState = { value: 0 };
  const summary = [];
  let totalCreated = 0;
  const createdPlayersByGender = {
    [GENDERS.MALE]: [],
    [GENDERS.FEMALE]: [],
  };

  for (const category of categories) {
    const existingCount = await Enrollment.countDocuments({ category: category._id });
    const capacityRemaining = Math.max(0, MAX_PLAYERS_PER_CATEGORY - existingCount);
    let createdForCategory = 0;

    for (let i = 0; i < capacityRemaining; i += 1) {
      const gender =
        category.gender === GENDERS.MIXED
          ? pickRandom([GENDERS.MALE, GENDERS.FEMALE])
          : category.gender;

      const { user, fullName } = await createDemoUser({
        gender,
        hashedPassword,
        sequenceState,
        emailContext: category.id,
        notesContext: category.name,
      });

      await Enrollment.create({ user: user._id, category: category._id });

      ensureGenderBucket(createdPlayersByGender, gender).push({
        userId: user._id,
        fullName,
        gender,
      });

      createdForCategory += 1;
    }
    totalCreated += createdForCategory;

    summary.push({
      categoryId: category.id,
      categoryName: category.name,
      createdPlayers: createdForCategory,
      totalPlayers: existingCount + createdForCategory,
    });
  }

  const tournaments = await ensureDemoTournaments();
  const { leaguesSummary, additionalPlayersCreated } = await ensureDemoLeagues({
    hashedPassword,
    sequenceState,
    createdPlayersByGender,
  });

  totalCreated += additionalPlayersCreated;

  return res.status(201).json({
    warning:
      'Entorno demo cargado: se han generado jugadores ficticios, torneos y ligas de ejemplo. Recuerda limpiar los datos antes de trabajar en producción.',
    message: 'Modo demo activado correctamente.',
    totalPlayersCreated: totalCreated,
    categories: summary,
    tournaments,
    leagues: leaguesSummary,
  });
}

module.exports = {
  activateDemoMode,
};
