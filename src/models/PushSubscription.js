const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
      trim: true,
    },
    keys: {
      p256dh: {
        type: String,
        trim: true,
      },
      auth: {
        type: String,
        trim: true,
      },
    },
    expirationTime: {
      type: Date,
      default: null,
    },
    userAgent: {
      type: String,
      trim: true,
      default: '',
    },
    lastSuccessAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

pushSubscriptionSchema.index({ user: 1, endpoint: 1 }, { unique: true });
pushSubscriptionSchema.index({ endpoint: 1 });

module.exports = {
  PushSubscription: mongoose.model('PushSubscription', pushSubscriptionSchema),
};
