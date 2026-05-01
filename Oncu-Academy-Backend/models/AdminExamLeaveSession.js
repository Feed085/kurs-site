const mongoose = require('mongoose');

const adminExamLeaveSessionSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Test',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Student',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'expired', 'finished', 'rejected'],
    default: 'pending',
  },
  qrToken: {
    type: String,
    trim: true,
  },
  manualCode: {
    type: String,
    trim: true,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
});

adminExamLeaveSessionSchema.index({ studentId: 1, testId: 1, status: 1, createdAt: -1 });
adminExamLeaveSessionSchema.index({ qrToken: 1 }, { unique: true, sparse: true });
adminExamLeaveSessionSchema.index({ manualCode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('AdminExamLeaveSession', adminExamLeaveSessionSchema);