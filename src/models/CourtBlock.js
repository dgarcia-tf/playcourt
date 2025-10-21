const mongoose = require('mongoose');

const COURT_BLOCK_CONTEXTS = {
  LEAGUE: 'league',
  TOURNAMENT: 'tournament',
};

const courtBlockSchema = new mongoose.Schema(
  {
    courts: {
      type: [String],
      default: [],
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          return value && this.startsAt && value > this.startsAt;
        },
        message: 'La hora de finalización debe ser posterior a la de inicio.',
      },
    },
    contextType: {
      type: String,
      enum: Object.values(COURT_BLOCK_CONTEXTS),
      required: true,
    },
    context: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

courtBlockSchema.index({ startsAt: 1, endsAt: 1 }, { background: true });
courtBlockSchema.index({ contextType: 1, context: 1 }, { background: true });

module.exports = {
  CourtBlock: mongoose.model('CourtBlock', courtBlockSchema),
  COURT_BLOCK_CONTEXTS,
};
