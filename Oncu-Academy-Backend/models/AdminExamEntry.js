const mongoose = require('mongoose');

const adminExamEntrySchema = new mongoose.Schema({
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
    enum: ['started', 'completed', 'terminated'],
    default: 'started',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  finalizedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

adminExamEntrySchema.index({ testId: 1, studentId: 1 }, { unique: true });
adminExamEntrySchema.index({ studentId: 1, status: 1, startedAt: -1 });

module.exports = mongoose.model('AdminExamEntry', adminExamEntrySchema);