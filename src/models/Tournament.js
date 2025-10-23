const mongoose = require('mongoose');

const TOURNAMENT_STATUS = {
  REGISTRATION: 'inscripcion',
  IN_PLAY: 'en_juego',
  FINISHED: 'finalizado',
};

const feeSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
    memberAmount: {
      type: Number,
      min: 0,
    },
    nonMemberAmount: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'EUR',
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const materialDeliverySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    delivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const paymentRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    amount: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pendiente', 'pagado', 'exento', 'fallido'],
      default: 'pendiente',
    },
    method: {
      type: String,
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const tournamentSchema = new mongoose.Schema(
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
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    registrationCloseDate: {
      type: Date,
    },
    poster: {
      type: String,
      trim: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    posterFile: {
      filename: {
        type: String,
        trim: true,
      },
      mimetype: {
        type: String,
        trim: true,
      },
      size: {
        type: Number,
        min: 0,
      },
      uploadedAt: {
        type: Date,
      },
    },
    fees: {
      type: [feeSchema],
      default: [],
    },
    hasShirt: {
      type: Boolean,
      default: false,
    },
    hasGiftBag: {
      type: Boolean,
      default: false,
    },
    shirtSizes: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(TOURNAMENT_STATUS),
      default: TOURNAMENT_STATUS.REGISTRATION,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TournamentCategory',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    materials: {
      type: [materialDeliverySchema],
      default: [],
    },
    payments: {
      type: [paymentRecordSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

tournamentSchema.path('categories').default([]);
tournamentSchema.path('fees').default([]);

tournamentSchema.index({ status: 1, startDate: 1 });
tournamentSchema.index({ registrationCloseDate: 1 });

tournamentSchema.methods.ensureCategoryAssociation = function ensureCategoryAssociation(categoryId) {
  const normalized = categoryId && categoryId.toString();
  if (!normalized) {
    return false;
  }
  return this.categories.some((entry) => entry && entry.toString() === normalized);
};

module.exports = {
  Tournament: mongoose.model('Tournament', tournamentSchema),
  TOURNAMENT_STATUS,
};
