const mongoose = require('mongoose');

const TOURNAMENT_MATCH_STATUS = {
  PENDING: 'pendiente',
  SCHEDULED: 'programado',
  CONFIRMED: 'confirmado',
  REJECTED: 'rechazado',
  COMPLETED: 'completado',
};

const TOURNAMENT_BRACKETS = {
  MAIN: 'principal',
  CONSOLATION: 'consolacion',
  MANUAL: 'manual',
};

const confirmationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pendiente', 'confirmado', 'rechazado'],
      default: 'pendiente',
    },
    respondedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const tournamentMatchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TournamentCategory',
      required: true,
      index: true,
    },
    round: {
      type: String,
      trim: true,
    },
    matchNumber: {
      type: Number,
      min: 1,
    },
    roundOrder: {
      type: Number,
      min: 1,
      default: 1,
    },
    bracketType: {
      type: String,
      enum: Object.values(TOURNAMENT_BRACKETS),
      default: TOURNAMENT_BRACKETS.MANUAL,
      index: true,
    },
    players: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'playerType',
        },
      ],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length <= 2;
        },
        message: 'Un partido no puede tener más de dos jugadores',
      },
      default: [],
    },
    playerType: {
      type: String,
      enum: ['User', 'TournamentDoublesPair'],
      default: 'User',
    },
    scheduledAt: {
      type: Date,
    },
    court: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(TOURNAMENT_MATCH_STATUS),
      default: TOURNAMENT_MATCH_STATUS.PENDING,
    },
    confirmations: {
      type: Map,
      of: confirmationSchema,
      default: () => ({}),
    },
    previousMatches: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TournamentMatch',
        },
      ],
      default: [],
    },
    nextMatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TournamentMatch',
    },
    nextMatchSlot: {
      type: Number,
      enum: [0, 1],
    },
    loserNextMatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TournamentMatch',
    },
    loserNextMatchSlot: {
      type: Number,
      enum: [0, 1],
    },
    result: {
      winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      score: {
        type: String,
        trim: true,
      },
      notes: {
        type: String,
        trim: true,
      },
      reportedAt: {
        type: Date,
      },
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    resultStatus: {
      type: String,
      enum: ['sin_resultado', 'pendiente_admin', 'revision_requerida', 'confirmado'],
      default: 'sin_resultado',
    },
    resultProposals: {
      type: Map,
      of: new mongoose.Schema(
        {
          winner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          score: {
            type: String,
            trim: true,
          },
          notes: {
            type: String,
            trim: true,
          },
          submittedAt: {
            type: Date,
            default: Date.now,
          },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    notifications: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Notification',
        },
      ],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

tournamentMatchSchema.set('toJSON', { virtuals: true, flattenMaps: true });
tournamentMatchSchema.set('toObject', { virtuals: true, flattenMaps: true });

tournamentMatchSchema.index({ category: 1, round: 1, matchNumber: 1 }, { unique: false });
tournamentMatchSchema.index({ status: 1, scheduledAt: 1 });

module.exports = {
  TournamentMatch: mongoose.model('TournamentMatch', tournamentMatchSchema),
  TOURNAMENT_MATCH_STATUS,
  TOURNAMENT_BRACKETS,
};
