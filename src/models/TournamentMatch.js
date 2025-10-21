const mongoose = require('mongoose');

const TOURNAMENT_MATCH_STATUS = {
  PENDING: 'pendiente',
  SCHEDULED: 'programado',
  CONFIRMED: 'confirmado',
  REJECTED: 'rechazado',
  COMPLETED: 'completado',
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
    players: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 2;
        },
        message: 'Un partido debe tener exactamente dos jugadores',
      },
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

tournamentMatchSchema.index({ category: 1, round: 1, matchNumber: 1 }, { unique: false });
tournamentMatchSchema.index({ status: 1, scheduledAt: 1 });

module.exports = {
  TournamentMatch: mongoose.model('TournamentMatch', tournamentMatchSchema),
  TOURNAMENT_MATCH_STATUS,
};
