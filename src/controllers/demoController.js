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
const {
  TournamentEnrollment,
  TOURNAMENT_ENROLLMENT_STATUS,
} = require('../models/TournamentEnrollment');
const { TournamentDoublesPair } = require('../models/TournamentDoublesPair');
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
const TOURNAMENT_SINGLES_PLAYERS = 24;
const TOURNAMENT_DOUBLES_PAIRS = 12;
const MAX_AGE = 55;
const MIN_AGE = 18;
const DEMO_LEAGUE_ENROLLMENT_FEE = 18;

const PREFERRED_SCHEDULE_OPTIONS = Object.values(PREFERRED_SCHEDULES);
const SHIRT_SIZE_OPTIONS = Object.values(SHIRT_SIZES);

const DEMO_TOURNAMENT_FEE_CONFIG = [
  {
    label: 'Inscripción individual',
    amount: 25,
    memberAmount: 20,
    nonMemberAmount: 25,
    currency: 'EUR',
    description: 'Cuota estándar para categorías individuales del torneo demo.',
  },
  {
    label: 'Inscripción dobles',
    amount: 40,
    memberAmount: 35,
    nonMemberAmount: 40,
    currency: 'EUR',
    description: 'Tarifa de referencia para parejas de dobles en el torneo demo.',
  },
];

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

function cloneDemoTournamentFees() {
  return DEMO_TOURNAMENT_FEE_CONFIG.map((fee) => ({ ...fee }));
}

function sanitizeContextLabel(label) {
  if (typeof label !== 'string') {
    return 'demo';
  }

  const trimmed = label.trim();
  return trimmed.length ? trimmed : 'demo';
}

async function ensurePlayersForGender({
  gender,
  count,
  hashedPassword,
  sequenceState,
  createdPlayersByGender,
  contextLabel,
  additionalPlayersCounter,
  forceCreateNew = false,
}) {
  if (!gender || count <= 0) {
    return [];
  }

  const bucket = ensureGenderBucket(createdPlayersByGender, gender);
  const selected = [];
  const context = sanitizeContextLabel(contextLabel);
  const pool = forceCreateNew ? [] : [...bucket];

  const reusableCount = forceCreateNew ? 0 : Math.min(count, pool.length);

  for (let i = 0; i < reusableCount; i += 1) {
    const index = Math.floor(Math.random() * pool.length);
    const [player] = pool.splice(index, 1);
    if (player) {
      selected.push(player);
    }
  }

  while (selected.length < count) {
    const { user, fullName } = await createDemoUser({
      gender,
      hashedPassword,
      sequenceState,
      emailContext: context,
      notesContext: context,
    });

    const entry = { userId: user._id, fullName, gender };
    bucket.push(entry);
    selected.push(entry);

    if (additionalPlayersCounter) {
      additionalPlayersCounter.value += 1;
    }
  }

  return selected;
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

async function ensureDemoTournaments({ hashedPassword, sequenceState, createdPlayersByGender }) {
  const tournamentsSummary = [];
  const additionalPlayersCounter = { value: 0 };
  const now = new Date();

  for (let index = 0; index < DEMO_TOURNAMENTS.length; index += 1) {
    const config = DEMO_TOURNAMENTS[index];
    let tournament = await Tournament.findOne({ name: config.name });
    let created = false;
    let feesAdded = false;
    let tournamentNeedsSave = false;

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
        fees: cloneDemoTournamentFees(),
      });
      created = true;
      feesAdded = true;
    } else if (!Array.isArray(tournament.fees) || !tournament.fees.length) {
      tournament.fees = cloneDemoTournamentFees();
      feesAdded = true;
      tournamentNeedsSave = true;
    }

    const categorySummaries = [];
    const updatedCategories = [...(tournament.categories || [])];
    const existingCategoryIds = new Set(updatedCategories.map((id) => id.toString()));

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
        tournamentNeedsSave = true;
      }

      let addedPlayers = 0;
      let totalPlayers = 0;
      let pairsAdded = 0;
      let totalPairs = 0;
      const isDoubles = categoryConfig.matchType === TOURNAMENT_CATEGORY_MATCH_TYPES.DOUBLES;

      if (isDoubles) {
        const existingPairs = await TournamentDoublesPair.find({
          tournament: tournament._id,
          category: tournamentCategory._id,
        })
          .select('players')
          .lean();

        const pairKeys = new Set(
          existingPairs
            .map((pair) =>
              Array.isArray(pair.players)
                ? pair.players
                    .map((player) => player && player.toString())
                    .filter(Boolean)
                    .sort()
                    .join(':')
                : ''
            )
            .filter(Boolean)
        );

        const remainingPairs = Math.max(0, TOURNAMENT_DOUBLES_PAIRS - existingPairs.length);

        if (remainingPairs > 0) {
          const malePlayers = await ensurePlayersForGender({
            gender: GENDERS.MALE,
            count: remainingPairs,
            hashedPassword,
            sequenceState,
            createdPlayersByGender,
            contextLabel: `${tournament.name} ${tournamentCategory.name} masculino`,
            additionalPlayersCounter,
            forceCreateNew: true,
          });

          const femalePlayers = await ensurePlayersForGender({
            gender: GENDERS.FEMALE,
            count: remainingPairs,
            hashedPassword,
            sequenceState,
            createdPlayersByGender,
            contextLabel: `${tournament.name} ${tournamentCategory.name} femenino`,
            additionalPlayersCounter,
            forceCreateNew: true,
          });

          let seedIndex = 0;
          let attempts = 0;

          while (pairsAdded < remainingPairs && attempts < remainingPairs * 5) {
            attempts += 1;
            let maleEntry =
              malePlayers.length > 0 ? malePlayers[seedIndex % malePlayers.length] : undefined;
            let femaleEntry =
              femalePlayers.length > 0
                ? femalePlayers[seedIndex % femalePlayers.length]
                : undefined;
            seedIndex += 1;

            if (!maleEntry || !femaleEntry) {
              [maleEntry] = await ensurePlayersForGender({
                gender: GENDERS.MALE,
                count: 1,
                hashedPassword,
                sequenceState,
                createdPlayersByGender,
                contextLabel: `${tournament.name} ${tournamentCategory.name} masculino extra ${attempts}`,
                additionalPlayersCounter,
                forceCreateNew: true,
              });

              if (maleEntry) {
                malePlayers.push(maleEntry);
              }

              [femaleEntry] = await ensurePlayersForGender({
                gender: GENDERS.FEMALE,
                count: 1,
                hashedPassword,
                sequenceState,
                createdPlayersByGender,
                contextLabel: `${tournament.name} ${tournamentCategory.name} femenino extra ${attempts}`,
                additionalPlayersCounter,
                forceCreateNew: true,
              });

              if (femaleEntry) {
                femalePlayers.push(femaleEntry);
              }
            }

            if (!maleEntry || !femaleEntry) {
              continue;
            }

            let pairKey = [maleEntry.userId.toString(), femaleEntry.userId.toString()]
              .sort()
              .join(':');

            if (pairKeys.has(pairKey)) {
              [maleEntry] = await ensurePlayersForGender({
                gender: GENDERS.MALE,
                count: 1,
                hashedPassword,
                sequenceState,
                createdPlayersByGender,
                contextLabel: `${tournament.name} ${tournamentCategory.name} masculino extra ${attempts + remainingPairs}`,
                additionalPlayersCounter,
                forceCreateNew: true,
              });

              if (maleEntry) {
                malePlayers.push(maleEntry);
              }

              [femaleEntry] = await ensurePlayersForGender({
                gender: GENDERS.FEMALE,
                count: 1,
                hashedPassword,
                sequenceState,
                createdPlayersByGender,
                contextLabel: `${tournament.name} ${tournamentCategory.name} femenino extra ${attempts + remainingPairs}`,
                additionalPlayersCounter,
                forceCreateNew: true,
              });

              if (femaleEntry) {
                femalePlayers.push(femaleEntry);
              }

              if (!maleEntry || !femaleEntry) {
                continue;
              }

              pairKey = [maleEntry.userId.toString(), femaleEntry.userId.toString()]
                .sort()
                .join(':');

              if (pairKeys.has(pairKey)) {
                continue;
              }
            }

            try {
              await TournamentDoublesPair.create({
                tournament: tournament._id,
                category: tournamentCategory._id,
                players: [maleEntry.userId, femaleEntry.userId],
              });
              pairKeys.add(pairKey);
              pairsAdded += 1;

              const pairPlayers = [maleEntry, femaleEntry];
              for (const playerEntry of pairPlayers) {
                const alreadyEnrolled = await TournamentEnrollment.exists({
                  tournament: tournament._id,
                  category: tournamentCategory._id,
                  user: playerEntry.userId,
                });

                if (!alreadyEnrolled) {
                  await TournamentEnrollment.create({
                    tournament: tournament._id,
                    category: tournamentCategory._id,
                    user: playerEntry.userId,
                    status: TOURNAMENT_ENROLLMENT_STATUS.CONFIRMED,
                  });
                  addedPlayers += 1;
                }
              }
            } catch (error) {
              if (error?.code !== 11000) {
                throw error;
              }
            }
          }
        }

        totalPairs = await TournamentDoublesPair.countDocuments({
          tournament: tournament._id,
          category: tournamentCategory._id,
        });

        totalPlayers = await TournamentEnrollment.countDocuments({
          tournament: tournament._id,
          category: tournamentCategory._id,
          status: { $ne: TOURNAMENT_ENROLLMENT_STATUS.CANCELLED },
        });
      } else {
        const activeEnrollments = await TournamentEnrollment.countDocuments({
          tournament: tournament._id,
          category: tournamentCategory._id,
          status: { $ne: TOURNAMENT_ENROLLMENT_STATUS.CANCELLED },
        });

        const remainingSlots = Math.max(0, TOURNAMENT_SINGLES_PLAYERS - activeEnrollments);

        if (remainingSlots > 0) {
          const resolvedGender =
            categoryConfig.gender === GENDERS.MIXED
              ? pickRandom([GENDERS.MALE, GENDERS.FEMALE])
              : categoryConfig.gender;

          const players = await ensurePlayersForGender({
            gender: resolvedGender,
            count: remainingSlots,
            hashedPassword,
            sequenceState,
            createdPlayersByGender,
            contextLabel: `${tournament.name} ${tournamentCategory.name}`,
            additionalPlayersCounter,
          });

          for (const player of players) {
            let candidate = player;
            let attempts = 0;

            while (candidate && attempts < 3) {
              const alreadyEnrolled = await TournamentEnrollment.exists({
                tournament: tournament._id,
                category: tournamentCategory._id,
                user: candidate.userId,
              });

              if (!alreadyEnrolled) {
                await TournamentEnrollment.create({
                  tournament: tournament._id,
                  category: tournamentCategory._id,
                  user: candidate.userId,
                  status: TOURNAMENT_ENROLLMENT_STATUS.CONFIRMED,
                });
                addedPlayers += 1;
                break;
              }

              attempts += 1;
              [candidate] = await ensurePlayersForGender({
                gender: resolvedGender,
                count: 1,
                hashedPassword,
                sequenceState,
                createdPlayersByGender,
                contextLabel: `${tournament.name} ${tournamentCategory.name} refuerzo ${attempts}`,
                additionalPlayersCounter,
                forceCreateNew: true,
              });
            }
          }
        }

        totalPlayers = await TournamentEnrollment.countDocuments({
          tournament: tournament._id,
          category: tournamentCategory._id,
          status: { $ne: TOURNAMENT_ENROLLMENT_STATUS.CANCELLED },
        });
      }

      categorySummaries.push({
        categoryId: tournamentCategory.id,
        categoryName: tournamentCategory.name,
        gender: tournamentCategory.gender,
        created: categoryCreated,
        matchType: tournamentCategory.matchType,
        addedPlayers,
        totalPlayers,
        pairsAdded: isDoubles ? pairsAdded : undefined,
        totalPairs: isDoubles ? totalPairs : undefined,
      });
    }

    if (tournamentNeedsSave) {
      tournament.categories = updatedCategories;
      await tournament.save();
    }

    tournamentsSummary.push({
      tournamentId: tournament.id,
      name: tournament.name,
      created,
      feesAdded,
      feesConfigured: Array.isArray(tournament.fees) && tournament.fees.length > 0,
      categories: categorySummaries,
    });
  }

  return { tournamentsSummary, additionalPlayersCreated: additionalPlayersCounter.value };
}

async function ensureDemoLeagues({ hashedPassword, sequenceState, createdPlayersByGender }) {
  const leaguesSummary = [];
  const additionalPlayersCounter = { value: 0 };
  const now = new Date();
  const currentYear = now.getUTCFullYear();

  for (const leagueConfig of DEMO_LEAGUES) {
    let league = await League.findOne({ name: leagueConfig.name });
    let created = false;
    let enrollmentFeeAdded = false;
    let leagueNeedsSave = false;

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
        enrollmentFee: DEMO_LEAGUE_ENROLLMENT_FEE,
      });
      created = true;
      enrollmentFeeAdded = true;
    } else if (typeof league.enrollmentFee !== 'number' || league.enrollmentFee <= 0) {
      league.enrollmentFee = DEMO_LEAGUE_ENROLLMENT_FEE;
      enrollmentFeeAdded = true;
      leagueNeedsSave = true;
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
        leagueNeedsSave = true;
      }

      const currentCount = await Enrollment.countDocuments({ category: category._id });
      const remainingSlots = Math.max(0, LEAGUE_PLAYERS_PER_CATEGORY - currentCount);
      let addedPlayers = 0;
      let totalPlayers = currentCount;

      if (remainingSlots > 0) {
        const resolvedGender =
          categoryConfig.gender === GENDERS.MIXED
            ? pickRandom([GENDERS.MALE, GENDERS.FEMALE])
            : categoryConfig.gender;

        const players = await ensurePlayersForGender({
          gender: resolvedGender,
          count: remainingSlots,
          hashedPassword,
          sequenceState,
          createdPlayersByGender,
          contextLabel: `${league.name} ${category.name}`,
          additionalPlayersCounter,
        });

        for (const player of players) {
          let candidate = player;
          let attempts = 0;

          while (candidate && attempts < 3) {
            const alreadyEnrolled = await Enrollment.exists({
              user: candidate.userId,
              category: category._id,
            });

            if (!alreadyEnrolled) {
              await Enrollment.create({ user: candidate.userId, category: category._id });
              addedPlayers += 1;
              totalPlayers += 1;
              break;
            }

            attempts += 1;
            [candidate] = await ensurePlayersForGender({
              gender: resolvedGender,
              count: 1,
              hashedPassword,
              sequenceState,
              createdPlayersByGender,
              contextLabel: `${league.name} ${category.name} refuerzo ${attempts}`,
              additionalPlayersCounter,
              forceCreateNew: true,
            });
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

    if (leagueNeedsSave) {
      league.categories = updatedCategories;
      await league.save();
    }

    leaguesSummary.push({
      leagueId: league.id,
      name: league.name,
      created,
      enrollmentFee: typeof league.enrollmentFee === 'number' ? league.enrollmentFee : null,
      enrollmentFeeAdded,
      categories: leagueCategoriesSummary,
    });
  }

  return { leaguesSummary, additionalPlayersCreated: additionalPlayersCounter.value };
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

  const { tournamentsSummary, additionalPlayersCreated: tournamentPlayersCreated } =
    await ensureDemoTournaments({
      hashedPassword,
      sequenceState,
      createdPlayersByGender,
    });

  const { leaguesSummary, additionalPlayersCreated: leaguePlayersCreated } = await ensureDemoLeagues({
    hashedPassword,
    sequenceState,
    createdPlayersByGender,
  });

  totalCreated += tournamentPlayersCreated + leaguePlayersCreated;

  return res.status(201).json({
    warning:
      'Entorno demo cargado: se han generado jugadores ficticios, torneos y ligas de ejemplo. Recuerda limpiar los datos antes de trabajar en producción.',
    message: 'Modo demo activado correctamente.',
    totalPlayersCreated: totalCreated,
    categories: summary,
    tournaments: tournamentsSummary,
    leagues: leaguesSummary,
  });
}

module.exports = {
  activateDemoMode,
};
