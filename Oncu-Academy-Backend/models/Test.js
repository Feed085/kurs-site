const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionType: {
    type: String,
    enum: ['text', 'image'],
    required: true
  },
  content: {
    type: String, // Metn veya rəsm (image URL)
    required: true
  },
  answerType: {
    type: String,
    enum: ['multiple_choice', 'open_ended'],
    required: true
  },
  openEndedAnswerType: {
    type: String,
    enum: ['text', 'number'],
    default: 'text'
  },
  options: [{
    type: String // A, B, C, D variantları, "açıq tiplidə" boş qalır
  }],
  correctAnswer: {
    type: String,
    // "open_ended" - de bu boş ola bilər, manual yoxlanacaq
  },
  sourceDraftTestId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Test',
    default: null
  },
  sourceTeacherId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Teacher',
    default: null
  }
});

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lütfən testin adını daxil edin']
  },
  type: {
    type: String,
    enum: ['course', 'teacher_draft', 'admin_exam'],
    default: 'course'
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: function requiredCourse() {
      return this.type === 'course';
    },
    default: null
  },
  instructor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Teacher',
    required: true
  },
  duration: {
    type: Number, // Məsələn dəqiqə olaraq
    required: function requiredDuration() {
      return this.type !== 'teacher_draft';
    },
    default: null
  },
  allowRetake: {
    type: Boolean,
    default: false
  },
  workflowStatus: {
    type: String,
    enum: ['draft', 'submitted_to_admin', 'approved', 'rejected', 'used'],
    default: undefined
  },
  submittedAt: {
    type: Date,
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  adminNotes: {
    type: String,
    default: ''
  },
  isStudentVisible: {
    type: Boolean,
    default: false
  },
  startsAt: {
    type: Date,
    default: null
  },
  activatedAt: {
    type: Date,
    default: null
  },
  accessCodeHash: {
    type: String,
    default: ''
  },
  sourceDraftTestIds: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Test'
  }],
  sourceTeacherIds: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Teacher'
  }],
  questions: [questionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Test', testSchema);
