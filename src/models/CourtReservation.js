const mongoose = require('mongoose');

const RESERVATION_STATUS = {
  RESERVED: 'reservada',
  CANCELLED: 'cancelada',
};

const RESERVATION_TYPES = {
  MANUAL: 'manual',
  MATCH: 'partido',
};

const courtReservationSchema = new mongoose.Schema(
  {
    court: {
      type: String,
      required: true,
      trim: true,
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
          if (!value || !this.startsAt) {
            return false;
          }
          return value > this.startsAt;
        },
        message: 'La hora de finalización debe ser posterior a la hora de inicio.',
      },
    },
    status: {
      type: String,
      enum: Object.values(RESERVATION_STATUS),
      default: RESERVATION_STATUS.RESERVED,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
    },
    type: {
      type: String,
      enum: Object.values(RESERVATION_TYPES),
      default: RESERVATION_TYPES.MANUAL,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

courtReservationSchema.index({ court: 1, startsAt: 1 }, { background: true });
courtReservationSchema.index({ createdBy: 1, startsAt: 1 }, { background: true });
courtReservationSchema.index({ match: 1 }, { background: true });

module.exports = {
  CourtReservation: mongoose.model('CourtReservation', courtReservationSchema),
  RESERVATION_STATUS,
  RESERVATION_TYPES,
};
