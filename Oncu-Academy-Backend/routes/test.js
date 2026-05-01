const express = require('express');
const { protectAdmin } = require('../middleware/adminAuth');
const {
  createTest,
  updateTest,
  deleteTest,
  getTestsByCourse,
  getMyTests,
  getTestById,
  submitTest,
  evaluateOpenEnded,
  getMyTestResults,
  getTestResultsForTeacher,
  createTeacherExamDraft,
  getTeacherExamPanelData,
  updateTeacherExamDraft,
  deleteTeacherExamDraft,
  submitTeacherExamDraft,
  getSubmittedTeacherExamDraftsForAdmin,
  getAdminExamPanelData,
  updateTeacherExamDraftStatusByAdmin,
  createAdminExamFromDrafts,
  verifyAdminExamAccess,
  startAdminExamAttempt,
  createAdminExamLeaveSession,
  getAdminExamLeaveSession,
  resolveAdminExamLeaveSession,
  approveAdminExamLeaveSession,
  rejectAdminExamLeaveSession
} = require('../controllers/testController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, createTest);

router.route('/results/my')
  .get(protect, getMyTestResults);

router.route('/results/:resultId/evaluate')
  .put(protect, evaluateOpenEnded);

router.route('/course/:courseId')
  .get(protect, getTestsByCourse);

router.route('/my')
  .get(protect, getMyTests);

router.route('/teacher-exams/panel')
  .get(protect, getTeacherExamPanelData);

router.route('/teacher-exams')
  .post(protect, createTeacherExamDraft);

router.route('/teacher-exams/admin/submitted')
  .get(protectAdmin, getSubmittedTeacherExamDraftsForAdmin);

router.route('/teacher-exams/admin/panel')
  .get(protectAdmin, getAdminExamPanelData);

router.route('/teacher-exams/admin/publish')
  .post(protectAdmin, createAdminExamFromDrafts);

router.route('/teacher-exams/admin/:id/status')
  .patch(protectAdmin, updateTeacherExamDraftStatusByAdmin);

router.route('/teacher-exams/:id')
  .put(protect, updateTeacherExamDraft)
  .delete(protect, deleteTeacherExamDraft);

router.route('/teacher-exams/:id/submit')
  .post(protect, submitTeacherExamDraft);

router.route('/:id/access')
  .post(protect, verifyAdminExamAccess);

router.route('/:id/start')
  .post(protect, startAdminExamAttempt);

router.route('/leave-sessions/:sessionId')
  .get(protect, getAdminExamLeaveSession);

router.route('/leave-sessions/resolve')
  .post(protect, resolveAdminExamLeaveSession);

router.route('/leave-sessions/:sessionId/approve')
  .post(protect, approveAdminExamLeaveSession);

router.route('/leave-sessions/:sessionId/reject')
  .post(protect, rejectAdminExamLeaveSession);

router.route('/:id/leave-session')
  .post(protect, createAdminExamLeaveSession);

router.route('/:id/submit')
  .post(protect, submitTest);

router.route('/:id/results')
  .get(protect, getTestResultsForTeacher);

router.route('/:id')
  .get(protect, getTestById)
  .put(protect, updateTest)
  .delete(protect, deleteTest);

module.exports = router;
