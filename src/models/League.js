const mongoose = require('mongoose');

const LEAGUE_STATUS = {
  ACTIVE: 'activa',
  CLOSED: 'cerrada',
};

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
    shirtDelivered: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const leagueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      min: 2000,
    },
    description: {
      type: String,
      trim: true,
    },
    poster: {
      type: String,
      trim: true,
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
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(LEAGUE_STATUS),
      default: LEAGUE_STATUS.ACTIVE,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    registrationCloseDate: {
      type: Date,
    },
    enrollmentFee: {
      type: Number,
      min: 0,
    },
    hasShirt: {
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
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    closedAt: {
      type: Date,
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

leagueSchema.path('categories').default([]);
leagueSchema.path('payments').default([]);

leagueSchema.index(
  { year: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      year: { $exists: true },
    },
  }
);

leagueSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      year: { $exists: false },
    },
  }
);

module.exports = {
  League: mongoose.model('League', leagueSchema),
  LEAGUE_STATUS,
};
