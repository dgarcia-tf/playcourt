const mongoose = require('mongoose');
const { GENDERS } = require('./User');
const { CATEGORY_SKILL_LEVELS, DEFAULT_CATEGORY_COLOR } = require('./Category');
const { resolveCategoryColor } = require('../utils/colors');

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
      ref: 'User',
      required: true,
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
    skillLevel: {
      type: String,
      enum: Object.values(CATEGORY_SKILL_LEVELS),
      default: CATEGORY_SKILL_LEVELS.INTERMEDIATE,
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
    status: {
      type: String,
      enum: Object.values(TOURNAMENT_CATEGORY_STATUSES),
      default: TOURNAMENT_CATEGORY_STATUSES.REGISTRATION,
    },
    drawSize: {
      type: Number,
      min: 0,
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
};
