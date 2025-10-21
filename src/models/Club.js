const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    opensAt: {
      type: String,
      trim: true,
      default: '',
    },
    closesAt: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const courtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    surface: {
      type: String,
      trim: true,
      default: 'Dura',
    },
    indoor: {
      type: Boolean,
      default: false,
    },
    lights: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: 'Liga Social de Tenis',
    },
    slogan: {
      type: String,
      trim: true,
      default: 'Pasión por el tenis y la comunidad.',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    contactEmail: {
      type: String,
      trim: true,
      default: '',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    regulation: {
      type: String,
      trim: true,
      default: '',
    },
    tournamentRegulation: {
      type: String,
      trim: true,
      default: '',
    },
    logo: {
      type: String,
      trim: true,
      default: '',
    },
    schedules: {
      type: [scheduleSchema],
      default: [],
    },
    courts: {
      type: [courtSchema],
      default: [],
    },
    facilities: {
      type: [String],
      default: [],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

clubSchema.statics.getSingleton = async function getSingleton() {
  const existing = await this.findOne();
  if (existing) {
    return existing;
  }
  return this.create({});
};

module.exports = {
  Club: mongoose.model('Club', clubSchema),
};
