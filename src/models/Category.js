const mongoose = require('mongoose');
const { GENDERS } = require('./User');
const { DEFAULT_CATEGORY_COLOR, resolveCategoryColor } = require('../utils/colors');

const CATEGORY_STATUSES = {
  REGISTRATION: 'inscripcion',
  IN_PROGRESS: 'en_curso',
};

const CATEGORY_SKILL_LEVELS = {
  INITIATION: 'Iniciación',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
};

const MATCH_FORMATS = {
  TWO_SETS_SIX_GAMES_SUPER_TB: 'two_sets_six_games_super_tb',
  TWO_SETS_FOUR_GAMES_SUPER_TB: 'two_sets_four_games_super_tb',
  SINGLE_SET_TEN_GAMES_SUPER_TB: 'single_set_ten_games_super_tb',
};

const DEFAULT_CATEGORY_MATCH_FORMAT = MATCH_FORMATS.TWO_SETS_SIX_GAMES_SUPER_TB;

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    gender: {
      type: String,
      enum: Object.values(GENDERS),
      required: true,
    },
    skillLevel: {
      type: String,
      enum: Object.values(CATEGORY_SKILL_LEVELS),
      default: CATEGORY_SKILL_LEVELS.INTERMEDIATE,
      trim: true,
    },
    league: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'League',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(CATEGORY_STATUSES),
      default: CATEGORY_STATUSES.REGISTRATION,
    },
    minimumAge: {
      type: Number,
      min: 0,
    },
    rankingSnapshot: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        position: {
          type: Number,
          required: true,
          min: 1,
        },
        points: {
          type: Number,
          default: 0,
        },
        wins: {
          type: Number,
          default: 0,
        },
        gamesWon: {
          type: Number,
          default: 0,
        },
        previousPosition: {
          type: Number,
          default: null,
        },
        movement: {
          type: String,
          default: 'nuevo',
          trim: true,
        },
        movementDelta: {
          type: Number,
          default: null,
        },
      },
    ],
    previousRankingSnapshot: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        position: {
          type: Number,
          required: true,
          min: 1,
        },
        points: {
          type: Number,
          default: 0,
        },
        wins: {
          type: Number,
          default: 0,
        },
        gamesWon: {
          type: Number,
          default: 0,
        },
        previousPosition: {
          type: Number,
          default: null,
        },
        movement: {
          type: String,
          default: 'nuevo',
          trim: true,
        },
        movementDelta: {
          type: Number,
          default: null,
        },
      },
    ],
    rankingUpdatedAt: {
      type: Date,
    },
    color: {
      type: String,
      default: DEFAULT_CATEGORY_COLOR,
      set: (value) => resolveCategoryColor(value),
    },
    matchFormat: {
      type: String,
      enum: Object.values(MATCH_FORMATS),
      default: DEFAULT_CATEGORY_MATCH_FORMAT,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index(
  { league: 1, name: 1, gender: 1 },
  { unique: true, partialFilterExpression: { league: { $exists: true } } }
);

categorySchema.index(
  { name: 1, gender: 1 },
  { unique: true, partialFilterExpression: { league: { $exists: false } } }
);

module.exports = {
  Category: mongoose.model('Category', categorySchema),
  CATEGORY_STATUSES,
  CATEGORY_SKILL_LEVELS,
  DEFAULT_CATEGORY_COLOR,
  MATCH_FORMATS,
  DEFAULT_CATEGORY_MATCH_FORMAT,
};
