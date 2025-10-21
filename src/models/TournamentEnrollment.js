const mongoose = require('mongoose');

const TOURNAMENT_ENROLLMENT_STATUS = {
  PENDING: 'pendiente',
  CONFIRMED: 'confirmada',
  CANCELLED: 'cancelada',
};

const tournamentEnrollmentSchema = new mongoose.Schema(
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TOURNAMENT_ENROLLMENT_STATUS),
      default: TOURNAMENT_ENROLLMENT_STATUS.PENDING,
    },
    seedNumber: {
      type: Number,
      min: 1,
    },
    notes: {
      type: String,
      trim: true,
    },
    shirtSize: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

tournamentEnrollmentSchema.index(
  { category: 1, user: 1 },
  { unique: true }
);

tournamentEnrollmentSchema.index({ tournament: 1, status: 1 });

module.exports = {
  TournamentEnrollment: mongoose.model('TournamentEnrollment', tournamentEnrollmentSchema),
  TOURNAMENT_ENROLLMENT_STATUS,
};
