const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    roomType: {
      type: String,
      enum: ['general', 'direct'],
      default: 'general',
    },
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      default: undefined,
      validate(participants) {
        if (!participants) return true;
        if (!Array.isArray(participants)) return false;
        if (this.roomType === 'direct') {
          return participants.length === 2;
        }
        return true;
      },
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    richContent: {
      type: String,
      trim: true,
      maxlength: 12000,
    },
    attachments: {
      type: [
        {
          filename: {
            type: String,
            trim: true,
          },
          description: {
            type: String,
            trim: true,
          },
          type: {
            type: String,
            enum: ['image', 'video', 'file', 'link'],
            default: 'file',
          },
          url: {
            type: String,
            trim: true,
          },
          dataUrl: {
            type: String,
            trim: true,
          },
          contentType: {
            type: String,
            trim: true,
          },
          size: {
            type: Number,
            min: 0,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

chatMessageSchema.index({ roomType: 1, createdAt: 1 });
chatMessageSchema.index({ roomType: 1, participants: 1, createdAt: 1 });

module.exports = {
  ChatMessage: mongoose.model('ChatMessage', chatMessageSchema),
};
