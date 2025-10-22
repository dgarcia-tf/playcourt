const { validationResult, body, query, param } = require('express-validator');
const mongoose = require('mongoose');
const { CourtBlock, COURT_BLOCK_CONTEXTS } = require('../models/CourtBlock');
const { Club } = require('../models/Club');
const { League } = require('../models/League');
const { Tournament } = require('../models/Tournament');

function toDate(value) {
  if (!value) {
    return null;
  }
  const result = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(result.getTime())) {
    return null;
  }
  return result;
}

async function ensureCourtsValid(courtsInput = []) {
  const list = Array.isArray(courtsInput) ? courtsInput : [courtsInput];
  const normalized = list
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);

  if (!normalized.length) {
    return [];
  }

  const club = await Club.getSingleton();
  const availableCourts = Array.isArray(club?.courts) ? club.courts : [];
  const courtMap = new Map();
  availableCourts.forEach((court) => {
    const name = typeof court?.name === 'string' ? court.name.trim() : '';
    if (name) {
      courtMap.set(name.toLowerCase(), name);
    }
  });

  const resolved = [];
  normalized.forEach((name) => {
    const key = name.toLowerCase();
    if (!courtMap.has(key)) {
      const error = new Error(`La pista "${name}" no existe en la configuración del club.`);
      error.statusCode = 400;
      throw error;
    }
    const resolvedName = courtMap.get(key);
    if (!resolved.includes(resolvedName)) {
      resolved.push(resolvedName);
    }
  });

  return resolved;
}

async function resolveBlockContext({ contextType, contextId }) {
  if (contextType === COURT_BLOCK_CONTEXTS.LEAGUE) {
    const league = await League.findById(contextId).select('name year');
    if (!league) {
      const error = new Error('La liga seleccionada no existe.');
      error.statusCode = 404;
      throw error;
    }
    return {
      id: league._id,
      label: league.year ? `${league.name} · ${league.year}` : league.name || 'Liga',
    };
  }

  if (contextType === COURT_BLOCK_CONTEXTS.TOURNAMENT) {
    const tournament = await Tournament.findById(contextId).select('name year');
    if (!tournament) {
      const error = new Error('El torneo seleccionado no existe.');
      error.statusCode = 404;
      throw error;
    }
    return {
      id: tournament._id,
      label: tournament.year ? `${tournament.name} · ${tournament.year}` : tournament.name || 'Torneo',
    };
  }

  if (contextType === COURT_BLOCK_CONTEXTS.LESSON) {
    const club = await Club.getSingleton();
    if (!club?._id) {
      const error = new Error('No se pudo identificar el club para registrar el bloqueo.');
      error.statusCode = 500;
      throw error;
    }
    if (contextId && club._id.toString() !== contextId.toString()) {
      const error = new Error('El identificador seleccionado para las clases no es válido.');
      error.statusCode = 400;
      throw error;
    }
    const label = club.name ? `Clases de tenis · ${club.name}` : 'Clases de tenis';
    return {
      id: club._id,
      label,
    };
  }

  const error = new Error('Contexto de bloqueo inválido.');
  error.statusCode = 400;
  throw error;
}

function buildContextLabelMap(blocks = []) {
  const leagueIds = new Set();
  const tournamentIds = new Set();
  const lessonIds = new Set();

  blocks.forEach((block) => {
    if (!block?.context) {
      return;
    }
    if (block.contextType === COURT_BLOCK_CONTEXTS.LEAGUE) {
      leagueIds.add(block.context.toString());
    }
    if (block.contextType === COURT_BLOCK_CONTEXTS.TOURNAMENT) {
      tournamentIds.add(block.context.toString());
    }
    if (block.contextType === COURT_BLOCK_CONTEXTS.LESSON) {
      lessonIds.add(block.context.toString());
    }
  });

  return Promise.all([
    leagueIds.size
      ? League.find({ _id: { $in: Array.from(leagueIds) } }).select('name year').lean()
      : [],
    tournamentIds.size
      ? Tournament.find({ _id: { $in: Array.from(tournamentIds) } }).select('name year').lean()
      : [],
    lessonIds.size
      ? Club.find({ _id: { $in: Array.from(lessonIds) } }).select('name').lean()
      : [],
  ]).then(([leagues, tournaments, clubs]) => {
    const labels = new Map();
    leagues.forEach((league) => {
      const id = league?._id?.toString();
      if (!id) return;
      const label = league.year ? `${league.name} · ${league.year}` : league.name || 'Liga';
      labels.set(`${COURT_BLOCK_CONTEXTS.LEAGUE}:${id}`, label);
    });
    tournaments.forEach((tournament) => {
      const id = tournament?._id?.toString();
      if (!id) return;
      const label = tournament.year
        ? `${tournament.name} · ${tournament.year}`
        : tournament.name || 'Torneo';
      labels.set(`${COURT_BLOCK_CONTEXTS.TOURNAMENT}:${id}`, label);
    });
    clubs.forEach((club) => {
      const id = club?._id?.toString();
      if (!id) return;
      const label = club?.name ? `Clases de tenis · ${club.name}` : 'Clases de tenis';
      labels.set(`${COURT_BLOCK_CONTEXTS.LESSON}:${id}`, label);
    });
    lessonIds.forEach((lessonId) => {
      const key = `${COURT_BLOCK_CONTEXTS.LESSON}:${lessonId}`;
      if (!labels.has(key)) {
        labels.set(key, 'Clases de tenis');
      }
    });
    return labels;
  });
}

function formatCourtBlock(block, contextLabels = new Map()) {
  if (!block) {
    return null;
  }

  const id = block._id?.toString() || block.id?.toString?.();
  const contextId = block.context?.toString?.() || block.contextId?.toString?.() || '';
  const key = `${block.contextType}:${contextId}`;

  return {
    id,
    courts: Array.isArray(block.courts) ? block.courts : [],
    startsAt: block.startsAt,
    endsAt: block.endsAt,
    contextType: block.contextType,
    contextId,
    contextName: contextLabels.get(key) || '',
    notes: typeof block.notes === 'string' ? block.notes : '',
    appliesToAllCourts: !block.courts || block.courts.length === 0,
  };
}

const validateCreateBlock = [
  body('startsAt')
    .custom((value) => toDate(value) !== null)
    .withMessage('La fecha y hora de inicio es obligatoria.'),
  body('endsAt')
    .custom((value) => toDate(value) !== null)
    .withMessage('La fecha y hora de finalización es obligatoria.'),
  body('contextType')
    .isIn(Object.values(COURT_BLOCK_CONTEXTS))
    .withMessage('El contexto del bloqueo es inválido.'),
  body('contextId').notEmpty().withMessage('Debes seleccionar una liga, torneo o clases.'),
  body('courts')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every((entry) => typeof entry === 'string');
      }
      return typeof value === 'string';
    })
    .withMessage('La lista de pistas es inválida.'),
  body('notes').optional().isString().isLength({ max: 500 }),
];

const validateListBlocks = [
  query('start')
    .optional()
    .custom((value) => toDate(value) !== null)
    .withMessage('La fecha de inicio no es válida.'),
  query('end')
    .optional()
    .custom((value) => toDate(value) !== null)
    .withMessage('La fecha de fin no es válida.'),
  query('court').optional().isString().withMessage('La pista debe ser un texto.'),
];

const validateDeleteBlock = [param('id').isMongoId().withMessage('Identificador de bloqueo inválido.')];

async function createBlock(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const startsAt = toDate(req.body.startsAt);
  const endsAt = toDate(req.body.endsAt);

  if (!startsAt || !endsAt) {
    return res.status(400).json({ message: 'Las fechas del bloqueo son obligatorias.' });
  }

  if (endsAt <= startsAt) {
    return res.status(400).json({ message: 'La hora de fin debe ser posterior a la de inicio.' });
  }

  const contextType = req.body.contextType;
  const contextId = req.body.contextId;

  let context;
  try {
    context = await resolveBlockContext({ contextType, contextId });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  let courts = [];
  try {
    courts = await ensureCourtsValid(req.body.courts);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }

  const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : '';

  const block = await CourtBlock.create({
    courts,
    startsAt,
    endsAt,
    contextType,
    context: context.id,
    notes,
    createdBy: req.user.id,
  });

  const labels = await buildContextLabelMap([block]);
  const payload = formatCourtBlock(block, labels);

  return res.status(201).json(payload);
}

async function listBlocks(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const start = toDate(req.query.start);
  const end = toDate(req.query.end);
  const { court: rawCourt } = req.query;

  const filter = {};
  if (start && end) {
    filter.startsAt = { $lt: end };
    filter.endsAt = { $gt: start };
  } else if (start) {
    filter.endsAt = { $gt: start };
  } else if (end) {
    filter.startsAt = { $lt: end };
  }

  if (rawCourt) {
    const courtName = rawCourt.trim();
    filter.$or = [{ courts: { $size: 0 } }, { courts: courtName }];
  }

  const blocks = await CourtBlock.find(filter).sort({ startsAt: 1 }).lean();
  const labels = await buildContextLabelMap(blocks);
  const payload = blocks
    .map((block) => formatCourtBlock(block, labels))
    .filter(Boolean);

  return res.json(payload);
}

async function deleteBlock(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: 'Bloqueo no encontrado.' });
  }

  const block = await CourtBlock.findByIdAndDelete(id);
  if (!block) {
    return res.status(404).json({ message: 'Bloqueo no encontrado.' });
  }

  return res.json({ message: 'Bloqueo eliminado correctamente.' });
}

module.exports = {
  createBlock,
  listBlocks,
  deleteBlock,
  validateCreateBlock,
  validateListBlocks,
  validateDeleteBlock,
  formatCourtBlock,
  buildContextLabelMap,
};
