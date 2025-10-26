const mongoose = require('mongoose');
const { GENDERS } = require('./User');
const {
  DEFAULT_CATEGORY_COLOR,
  MATCH_FORMATS,
  DEFAULT_CATEGORY_MATCH_FORMAT,
} = require('./Category');
const { resolveCategoryColor } = require('../utils/colors');

const TOURNAMENT_CATEGORY_MATCH_TYPES = {
  SINGLES: 'individual',
  DOUBLES: 'dobles',
};

const TOURNAMENT_CATEGORY_ALLOWED_DRAW_SIZES = [8, 16, 24, 32];

const TOURNAMENT_CATEGORY_MATCH_FORMATS = MATCH_FORMATS;
const DEFAULT_TOURNAMENT_CATEGORY_MATCH_FORMAT = DEFAULT_CATEGORY_MATCH_FORMAT;

const TOURNAMENT_CATEGORY_STATUSES = {
  REGISTRATION: 'inscripcion',
  DRAW: 'cuadros',
  IN_PLAY: 'en_juego',
  FINISHED: 'finalizado',
};

const bracketMatchSchema = new mongoose.Schema(
  {
    matchNumber: {
      type: Number,
      min: 1,
    },
    playerA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    playerB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    placeholderA: {
      type: String,
      trim: true,
    },
    placeholderB: {
      type: String,
      trim: true,
    },
    seedA: {
      type: Number,
      min: 1,
    },
    seedB: {
      type: Number,
      min: 1,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const bracketRoundSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    matches: {
      type: [bracketMatchSchema],
      default: [],
    },
  },
  { _id: false }
);

const seedSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'playerType',
      required: true,
    },
    playerType: {
      type: String,
      enum: ['User', 'TournamentDoublesPair'],
      default: 'User',
    },
    seedNumber: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const tournamentCategorySchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    gender: {
      type: String,
      enum: Object.values(GENDERS),
      required: true,
    },
    menuTitle: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: DEFAULT_CATEGORY_COLOR,
      set: (value) => resolveCategoryColor(value),
    },
    matchType: {
      type: String,
      enum: Object.values(TOURNAMENT_CATEGORY_MATCH_TYPES),
      default: TOURNAMENT_CATEGORY_MATCH_TYPES.SINGLES,
    },
    matchFormat: {
      type: String,
      enum: Object.values(TOURNAMENT_CATEGORY_MATCH_FORMATS),
      default: DEFAULT_TOURNAMENT_CATEGORY_MATCH_FORMAT,
    },
    status: {
      type: String,
      enum: Object.values(TOURNAMENT_CATEGORY_STATUSES),
      default: TOURNAMENT_CATEGORY_STATUSES.REGISTRATION,
    },
    drawSize: {
      type: Number,
      enum: TOURNAMENT_CATEGORY_ALLOWED_DRAW_SIZES,
      required: true,
    },
    draw: {
      type: [bracketRoundSchema],
      default: [],
    },
    consolationDraw: {
      type: [bracketRoundSchema],
      default: [],
    },
    seeds: {
      type: [seedSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const uniqueIndexOptions = {
  unique: true,
  partialFilterExpression: {
    tournament: { $exists: true },
  },
};

tournamentCategorySchema.index({ tournament: 1, name: 1, gender: 1 }, uniqueIndexOptions);

tournamentCategorySchema.path('draw').default([]);
tournamentCategorySchema.path('consolationDraw').default([]);
tournamentCategorySchema.path('seeds').default([]);

tournamentCategorySchema.methods.normalizeMenuTitle = function normalizeMenuTitle() {
  if (!this.menuTitle || !this.menuTitle.trim()) {
    this.menuTitle = this.name;
  }
};

tournamentCategorySchema.pre('save', function handleMenuTitle(next) {
  this.normalizeMenuTitle();
  next();
});

tournamentCategorySchema.pre('insertMany', function ensureMenuTitle(docs, next) {
  docs.forEach((doc) => {
    if (!doc.menuTitle || !doc.menuTitle.trim()) {
      doc.menuTitle = doc.name;
    }
  });
  next();
});

module.exports = {
  TournamentCategory: mongoose.model('TournamentCategory', tournamentCategorySchema),
  TOURNAMENT_CATEGORY_STATUSES,
  TOURNAMENT_CATEGORY_MATCH_TYPES,
  TOURNAMENT_CATEGORY_MATCH_FORMATS,
  DEFAULT_TOURNAMENT_CATEGORY_MATCH_FORMAT,
  TOURNAMENT_CATEGORY_ALLOWED_DRAW_SIZES,
};
