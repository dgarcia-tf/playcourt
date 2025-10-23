const mongoose = require('mongoose');

const ENROLLMENT_REQUEST_STATUSES = {
  PENDING: 'pendiente',
  APPROVED: 'aprobada',
  REJECTED: 'rechazada',
};

const enrollmentRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ENROLLMENT_REQUEST_STATUSES),
      default: ENROLLMENT_REQUEST_STATUSES.PENDING,
    },
    shirtSize: {
      type: String,
      trim: true,
    },
    decisionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    decisionAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

enrollmentRequestSchema.index(
  { category: 1, user: 1 },
  {
    unique: true,
    partialFilterExpression: { status: ENROLLMENT_REQUEST_STATUSES.PENDING },
  }
);

enrollmentRequestSchema.index({ category: 1, status: 1 });

enrollmentRequestSchema.index({ user: 1, status: 1 });

module.exports = {
  EnrollmentRequest: mongoose.model('EnrollmentRequest', enrollmentRequestSchema),
  ENROLLMENT_REQUEST_STATUSES,
};
