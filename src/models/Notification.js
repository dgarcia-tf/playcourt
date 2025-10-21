const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    richMessage: {
      type: String,
      trim: true,
    },
    attachments: {
      type: [
        {
          url: {
            type: String,
            required: true,
            trim: true,
          },
          description: {
            type: String,
            trim: true,
          },
          type: {
            type: String,
            enum: ['image', 'video', 'file', 'link'],
            default: 'image',
          },
        },
      ],
      default: [],
    },
    channel: {
      type: String,
      enum: ['app', 'email', 'sms', 'push'],
      default: 'app',
    },
    scheduledFor: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pendiente', 'enviado', 'cancelado'],
      default: 'pendiente',
    },
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
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

notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ match: 1 });

module.exports = {
  Notification: mongoose.model('Notification', notificationSchema),
};
