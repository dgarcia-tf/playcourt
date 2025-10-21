const mongoose = require('mongoose');

const LEAGUE_STATUS = {
  ACTIVE: 'activa',
  CLOSED: 'cerrada',
};

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
    registrationCloseDate: {
      type: Date,
    },
    enrollmentFee: {
      type: Number,
      min: 0,
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
  },
  {
    timestamps: true,
  }
);

leagueSchema.path('categories').default([]);

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
