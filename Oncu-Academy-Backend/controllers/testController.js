const Test = require('../models/Test');
const TestResult = require('../models/TestResult');
const Student = require('../models/Student');
const AdminExamEntry = require('../models/AdminExamEntry');
const AdminExamLeaveSession = require('../models/AdminExamLeaveSession');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const TEST_TYPES = {
  COURSE: 'course',
  TEACHER_DRAFT: 'teacher_draft',
  ADMIN_EXAM: 'admin_exam'
};

const WORKFLOW_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted_to_admin',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  USED: 'used'
};

const ADMIN_EXAM_LEAVE_SESSION_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  EXPIRED: 'expired',
  FINISHED: 'finished',
  REJECTED: 'rejected'
};

const ADMIN_EXAM_ACCESS_ERROR_CODES = {
  REENTRY_BLOCKED: 'ADMIN_EXAM_REENTRY_BLOCKED',
  LEAVE_SESSION_PENDING: 'LEAVE_SESSION_PENDING',
  LEAVE_SESSION_EXPIRED: 'LEAVE_SESSION_EXPIRED',
  LEAVE_SESSION_FINISHED: 'LEAVE_SESSION_FINISHED',
  LEAVE_SESSION_REJECTED: 'LEAVE_SESSION_REJECTED',
  TERMINATED: 'ADMIN_EXAM_TERMINATED'
};

const ADMIN_EXAM_ENTRY_STATUSES = {
  STARTED: 'started',
  COMPLETED: 'completed',
  TERMINATED: 'terminated'
};

const TEST_RESULT_STATUSES = {
  COMPLETED: 'completed',
  TERMINATED: 'terminated'
};

const ADMIN_EXAM_LEAVE_SESSION_DURATION_MS = 5 * 60 * 1000;

const ADMIN_EXAM_TERMINAL_LEAVE_SESSION_STATUSES = new Set([
  ADMIN_EXAM_LEAVE_SESSION_STATUSES.EXPIRED,
  ADMIN_EXAM_LEAVE_SESSION_STATUSES.FINISHED,
  ADMIN_EXAM_LEAVE_SESSION_STATUSES.REJECTED,
]);

const ADMIN_EXAM_LEAVE_SESSION_STATUS_TO_ACCESS_CODE = {
  [ADMIN_EXAM_LEAVE_SESSION_STATUSES.PENDING]: ADMIN_EXAM_ACCESS_ERROR_CODES.LEAVE_SESSION_PENDING,
  [ADMIN_EXAM_LEAVE_SESSION_STATUSES.EXPIRED]: ADMIN_EXAM_ACCESS_ERROR_CODES.LEAVE_SESSION_EXPIRED,
  [ADMIN_EXAM_LEAVE_SESSION_STATUSES.FINISHED]: ADMIN_EXAM_ACCESS_ERROR_CODES.LEAVE_SESSION_FINISHED,
  [ADMIN_EXAM_LEAVE_SESSION_STATUSES.REJECTED]: ADMIN_EXAM_ACCESS_ERROR_CODES.LEAVE_SESSION_REJECTED,
};

const ADMIN_EXAM_LEAVE_SESSION_LOCK_MESSAGES = {
  [ADMIN_EXAM_LEAVE_SESSION_STATUSES.PENDING]: 'Leave session aktivdir, müəllim qərarı gözlənilir',
  [ADMIN_EXAM_LEAVE_SESSION_STATUSES.EXPIRED]: 'Leave session müddəti bitib, imtahan yenidən açıla bilməz',
  [ADMIN_EXAM_LEAVE_SESSION_STATUSES.FINISHED]: 'Bu imtahan üçün leave session artıq bağlanıb',
  [ADMIN_EXAM_LEAVE_SESSION_STATUSES.REJECTED]: 'Leave session rədd edilib, imtahan yenidən açıla bilməz',
};

const editableTeacherDraftStatuses = new Set([
  WORKFLOW_STATUSES.DRAFT,
  WORKFLOW_STATUSES.REJECTED,
  WORKFLOW_STATUSES.SUBMITTED
]);

const isTeacherUser = (user) => user?.constructor?.modelName === 'Teacher';
const isStudentUser = (user) => user?.constructor?.modelName === 'Student';

const toPlainTest = (test) => (test && typeof test.toObject === 'function' ? test.toObject() : test);

const toPlainResult = (result) => (result && typeof result.toObject === 'function' ? result.toObject() : result);

const resolveEntityId = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    return String(value._id || value.id || value);
  }

  return String(value);
};

const ensureTeacher = (req, res) => {
  if (!isTeacherUser(req.user)) {
    res.status(403).json({ success: false, message: 'Bu əməliyyat yalnız müəllim üçün əlçatandır' });
    return false;
  }

  return true;
};

const ensureStudent = (req, res) => {
  if (!isStudentUser(req.user)) {
    res.status(403).json({ success: false, message: 'Bu əməliyyat yalnız tələbələr üçün əlçatandır' });
    return false;
  }

  return true;
};

const hasExamAccessCode = (test) => Boolean(test?.accessCodeHash);

const getAdminExamEndTime = (test) => {
  const startsAt = test?.startsAt ? new Date(test.startsAt) : null;
  const durationMinutes = Number(test?.duration || 0);

  if (!startsAt || Number.isNaN(startsAt.getTime()) || !Number.isFinite(durationMinutes)) {
    return null;
  }

  return new Date(startsAt.getTime() + Math.max(0, durationMinutes) * 60 * 1000);
};

const buildAdminExamAccessState = async (test, studentId) => {
  const student = await Student.findById(studentId).select('assignedTests');
  const assignedTests = student?.assignedTests || [];
  const isAssigned = assignedTests.some((assignedTestId) => resolveEntityId(assignedTestId) === resolveEntityId(test._id));
  const isVisible = test.isStudentVisible !== false;
  const startsAt = test.startsAt ? new Date(test.startsAt) : null;
  const endsAt = getAdminExamEndTime(test);
  const now = new Date();
  const hasStarted = !startsAt || startsAt <= now;
  const hasExpired = Boolean(endsAt && endsAt <= now);

  return {
    isAssigned,
    isVisible,
    startsAt,
    endsAt,
    hasStarted,
    hasExpired,
    requiresAccessCode: hasExamAccessCode(test),
    canView: isAssigned && isVisible,
    canStart: isAssigned && isVisible && hasStarted && !hasExpired
  };
};

const sanitizeQuestionsForStudent = (questions = []) => questions.map((question) => {
  const plainQuestion = typeof question?.toObject === 'function' ? question.toObject() : question;

  return {
    ...plainQuestion,
    correctAnswer: undefined,
    sourceDraftTestId: undefined,
    sourceTeacherId: undefined
  };
});

const buildStudentAdminExamPayload = (test, accessState, options = {}) => {
  const plainTest = toPlainTest(test);
  const includeQuestions = options.includeQuestions === true;

  return {
    ...plainTest,
    questions: includeQuestions ? sanitizeQuestionsForStudent(plainTest.questions || []) : [],
    questionCount: Array.isArray(plainTest.questions) ? plainTest.questions.length : 0,
    accessCodeHash: undefined,
    adminNotes: undefined,
    hasAccessCode: Boolean(accessState?.requiresAccessCode),
    accessGranted: includeQuestions,
    resumeGranted: options.resumeGranted === true,
    accessStatus: {
      isAssigned: Boolean(accessState?.isAssigned),
      isVisible: Boolean(accessState?.isVisible),
      startsAt: accessState?.startsAt || null,
      endsAt: accessState?.endsAt || null,
      hasStarted: Boolean(accessState?.hasStarted),
      hasExpired: Boolean(accessState?.hasExpired),
      canStart: Boolean(accessState?.canStart),
      requiresAccessCode: Boolean(accessState?.requiresAccessCode)
    }
  };
};

const buildAdminExamAccessErrorResponseBody = (accessCheck) => {
  const responseBody = {
    success: false,
    message: accessCheck.message,
  };

  if (accessCheck.code) {
    responseBody.code = accessCheck.code;
  }

  if (accessCheck.data) {
    responseBody.data = accessCheck.data;
  } else if (accessCheck.leaveSessionLock) {
    responseBody.data = accessCheck.leaveSessionLock;
  }

  return responseBody;
};

const findAdminExamEntry = async (testId, studentId) => AdminExamEntry.findOne({
  testId,
  studentId,
});

const buildAdminExamReentryBlockedResponse = (accessState, entry, message) => ({
  ok: false,
  status: 409,
  code: ADMIN_EXAM_ACCESS_ERROR_CODES.REENTRY_BLOCKED,
  message: message || 'Bu admin imtahanı üçün giriş hüququ artıq istifadə olunub',
  accessState,
  data: entry ? {
    status: entry.status,
    startedAt: entry.startedAt,
    finalizedAt: entry.finalizedAt,
  } : undefined,
});

const finalizeAdminExamEntry = async (testId, studentId, status) => {
  if (!testId || !studentId) {
    return null;
  }

  const nextStatus = status === ADMIN_EXAM_ENTRY_STATUSES.TERMINATED
    ? ADMIN_EXAM_ENTRY_STATUSES.TERMINATED
    : ADMIN_EXAM_ENTRY_STATUSES.COMPLETED;

  return AdminExamEntry.findOneAndUpdate(
    { testId, studentId },
    {
      $set: {
        status: nextStatus,
        finalizedAt: new Date(),
      },
    },
    { new: true }
  );
};

const findLatestAdminExamLeaveSession = async (testId, studentId) => {
  let session = await AdminExamLeaveSession.findOne({
    testId,
    studentId,
    status: {
      $in: Object.values(ADMIN_EXAM_LEAVE_SESSION_STATUSES),
    },
  }).sort({ createdAt: -1 });

  if (!session) {
    return null;
  }

  session = await markAdminExamLeaveSessionExpiredIfNeeded(session);
  return session;
};

const buildAdminExamLeaveSessionLockPayload = (session) => {
  const code = ADMIN_EXAM_LEAVE_SESSION_STATUS_TO_ACCESS_CODE[session?.status];

  if (!code) {
    return null;
  }

  return {
    code,
    ...buildAdminExamLeaveSessionPayload(session),
  };
};

const getActiveAdminExamLeaveSessionLock = async (testId, studentId) => {
  const session = await findLatestAdminExamLeaveSession(testId, studentId);

  if (!session || session.status === ADMIN_EXAM_LEAVE_SESSION_STATUSES.APPROVED) {
    return null;
  }

  const code = ADMIN_EXAM_LEAVE_SESSION_STATUS_TO_ACCESS_CODE[session.status];

  if (!code) {
    return null;
  }

  return {
    code,
    httpStatus: session.status === ADMIN_EXAM_LEAVE_SESSION_STATUSES.PENDING ? 423 : 409,
    message: ADMIN_EXAM_LEAVE_SESSION_LOCK_MESSAGES[session.status] || 'İmtahana giriş bloklanıb',
    session,
  };
};

const ensureStudentCanOpenAdminExam = async (test, studentId, options = {}) => {
  const accessState = await buildAdminExamAccessState(test, studentId);

  if (!accessState.isAssigned) {
    return { ok: false, status: 403, message: 'Bu imtahan sizə təyin edilməyib', accessState };
  }

  if (!accessState.isVisible) {
    return { ok: false, status: 403, message: 'Bu imtahan hələ tələbələr üçün aktiv deyil', accessState };
  }

  const latestLeaveSession = await findLatestAdminExamLeaveSession(test._id, studentId);

  if (options.ignoreLeaveSessionLock !== true && latestLeaveSession && latestLeaveSession.status !== ADMIN_EXAM_LEAVE_SESSION_STATUSES.APPROVED) {
    const code = ADMIN_EXAM_LEAVE_SESSION_STATUS_TO_ACCESS_CODE[latestLeaveSession.status];

    if (code) {
      return {
        ok: false,
        status: latestLeaveSession.status === ADMIN_EXAM_LEAVE_SESSION_STATUSES.PENDING ? 423 : 409,
        code,
        message: ADMIN_EXAM_LEAVE_SESSION_LOCK_MESSAGES[latestLeaveSession.status] || 'İmtahana giriş bloklanıb',
        accessState,
        leaveSessionLock: buildAdminExamLeaveSessionLockPayload(latestLeaveSession),
      };
    }
  }

  const consumedEntry = await findAdminExamEntry(test._id, studentId);

  if (consumedEntry) {
    if (
      consumedEntry.status === ADMIN_EXAM_ENTRY_STATUSES.STARTED
      && latestLeaveSession?.status === ADMIN_EXAM_LEAVE_SESSION_STATUSES.APPROVED
      && options.allowApprovedLeaveResume === true
    ) {
      return {
        ok: true,
        accessState,
        consumedEntry,
        approvedLeaveSession: latestLeaveSession,
      };
    }

    return buildAdminExamReentryBlockedResponse(accessState, consumedEntry);
  }

  const existingResult = await TestResult.findOne({
    test: test._id,
    student: studentId,
  }).select('_id');

  if (existingResult) {
    return buildAdminExamReentryBlockedResponse(accessState, null);
  }

  if (options.ignoreLeaveSessionLock !== true) {
    const leaveSessionLock = await getActiveAdminExamLeaveSessionLock(test._id, studentId);

    if (leaveSessionLock) {
      return {
        ok: false,
        status: leaveSessionLock.httpStatus,
        code: leaveSessionLock.code,
        message: leaveSessionLock.message,
        accessState,
        leaveSessionLock: buildAdminExamLeaveSessionLockPayload(leaveSessionLock.session),
      };
    }
  }
  return { ok: true, accessState };
};

const ensureStudentCanStartAdminExam = async (test, studentId, accessCode, options = {}) => {
  const accessCheck = await ensureStudentCanOpenAdminExam(test, studentId, options);

  if (!accessCheck.ok) {
    return accessCheck;
  }

  const { accessState } = accessCheck;

  if (!accessState.hasStarted) {
    return { ok: false, status: 403, message: 'İmtahanın başlama vaxtı hələ çatmayıb', accessState };
  }

  if (accessState.hasExpired && options.allowExpired !== true) {
    return { ok: false, status: 403, message: 'İmtahan müddəti artıq bitib', accessState };
  }

  if (accessState.requiresAccessCode) {
    const normalizedAccessCode = typeof accessCode === 'string' ? accessCode.trim() : '';

    if (!normalizedAccessCode) {
      return { ok: false, status: 400, message: 'İmtahan şifrəsi tələb olunur', accessState };
    }

    const isValidAccessCode = await bcrypt.compare(normalizedAccessCode, test.accessCodeHash);

    if (!isValidAccessCode) {
      return { ok: false, status: 403, message: 'İmtahan şifrəsi yanlışdır', accessState };
    }
  }

  return { ok: true, accessState };
};

const ensureStudentCanSubmitAdminExam = async (test, studentId, accessCode, options = {}) => {
  const accessState = await buildAdminExamAccessState(test, studentId);

  if (!accessState.isAssigned) {
    return { ok: false, status: 403, message: 'Bu imtahan sizə təyin edilməyib', accessState };
  }

  if (!accessState.isVisible) {
    return { ok: false, status: 403, message: 'Bu imtahan hələ tələbələr üçün aktiv deyil', accessState };
  }

  if (!accessState.hasStarted) {
    return { ok: false, status: 403, message: 'İmtahanın başlama vaxtı hələ çatmayıb', accessState };
  }

  if (accessState.hasExpired && options.allowExpired !== true) {
    return { ok: false, status: 403, message: 'İmtahan müddəti artıq bitib', accessState };
  }

  const consumedEntry = await findAdminExamEntry(test._id, studentId);

  if (consumedEntry) {
    return { ok: true, accessState, consumedEntry };
  }

  return {
    ok: false,
    status: 409,
    code: ADMIN_EXAM_ACCESS_ERROR_CODES.REENTRY_BLOCKED,
    message: 'Bu admin imtahanı üçün aktiv giriş tapılmadı',
    accessState,
  };
};

const buildAdminExamSummaries = async (adminExams) => {
  if (!adminExams.length) {
    return [];
  }

  const examIds = adminExams.map((exam) => exam._id);
  const [results, assignments] = await Promise.all([
    TestResult.find({ test: { $in: examIds } }).select('test hasPendingAnswers completedAt').sort({ completedAt: -1 }),
    Student.aggregate([
      { $match: { assignedTests: { $in: examIds } } },
      { $unwind: '$assignedTests' },
      { $match: { assignedTests: { $in: examIds } } },
      { $group: { _id: '$assignedTests', count: { $sum: 1 } } }
    ])
  ]);

  const assignmentMap = assignments.reduce((accumulator, entry) => {
    accumulator.set(resolveEntityId(entry._id), entry.count || 0);
    return accumulator;
  }, new Map());

  const resultMap = results.reduce((accumulator, result) => {
    const examId = resolveEntityId(result.test);
    const current = accumulator.get(examId) || {
      resultsCount: 0,
      pendingReviewCount: 0,
      latestCompletedAt: null
    };

    current.resultsCount += 1;
    if (result.hasPendingAnswers) {
      current.pendingReviewCount += 1;
    }

    if (!current.latestCompletedAt) {
      current.latestCompletedAt = result.completedAt || null;
    }

    accumulator.set(examId, current);
    return accumulator;
  }, new Map());

  return adminExams.map((exam) => {
    const plainExam = toPlainTest(exam);
    const examId = resolveEntityId(exam._id);
    const resultSummary = resultMap.get(examId) || {
      resultsCount: 0,
      pendingReviewCount: 0,
      latestCompletedAt: null
    };

    return {
      ...plainExam,
      accessCodeHash: undefined,
      hasAccessCode: hasExamAccessCode(exam),
      assignedStudentsCount: assignmentMap.get(examId) || 0,
      resultsCount: resultSummary.resultsCount,
      pendingReviewCount: resultSummary.pendingReviewCount,
      completedResultsCount: Math.max(resultSummary.resultsCount - resultSummary.pendingReviewCount, 0),
      latestCompletedAt: resultSummary.latestCompletedAt
    };
  });
};

const buildTeacherDraftPayload = (body, userId) => ({
  title: typeof body.title === 'string' ? body.title.trim() : '',
  instructor: userId,
  type: TEST_TYPES.TEACHER_DRAFT,
  duration: Number.isFinite(Number(body.duration)) ? Math.max(5, Math.min(180, Number(body.duration))) : null,
  allowRetake: body.allowRetake === true,
  workflowStatus: body.workflowStatus || WORKFLOW_STATUSES.DRAFT,
  questions: Array.isArray(body.questions) ? body.questions : [],
  adminNotes: body.adminNotes || ''
});

const MANUAL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const normalizeAdminExamLeaveManualCode = (value) => String(value || '')
  .trim()
  .replace(/\s+/g, '')
  .toUpperCase();

const generateAdminExamLeaveManualCode = () => {
  let code = '';

  for (let index = 0; index < 6; index += 1) {
    const alphabetIndex = crypto.randomInt(0, MANUAL_CODE_ALPHABET.length);
    code += MANUAL_CODE_ALPHABET[alphabetIndex];
  }

  return `${code.slice(0, 3)}-${code.slice(3)}`;
};

const createUniqueAdminExamLeaveManualCode = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const manualCode = generateAdminExamLeaveManualCode();
    const existingSession = await AdminExamLeaveSession.findOne({ manualCode }).select('_id');

    if (!existingSession) {
      return manualCode;
    }
  }

  throw new Error('Qısa ehtiyat kod yaradıla bilmədi');
};

const buildAdminExamLeaveSessionPayload = (session, options = {}) => {
  if (!session) {
    return null;
  }

  const now = Date.now();
  const expiresAtTime = new Date(session.expiresAt).getTime();
  const timeLeftSeconds = Number.isFinite(expiresAtTime)
    ? Math.max(0, Math.ceil((expiresAtTime - now) / 1000))
    : 0;

  return {
    sessionId: resolveEntityId(session._id),
    testId: resolveEntityId(session.testId),
    studentId: resolveEntityId(session.studentId),
    status: session.status,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    resolvedAt: session.resolvedAt,
    timeLeftSeconds,
    manualCode: options.includeManualCode === false ? undefined : session.manualCode,
  };
};

const buildAdminExamLeaveSessionReviewPayload = (session, options = {}) => {
  if (!session) {
    return null;
  }

  const student = options.student || null;
  const test = options.test || null;

  return {
    ...buildAdminExamLeaveSessionPayload(session, { includeQrToken: false }),
    student: student ? {
      id: resolveEntityId(student._id),
      name: student.name || '',
      surname: student.surname || '',
      email: student.email || '',
    } : null,
    test: test ? {
      id: resolveEntityId(test._id),
      title: test.title || '',
      startsAt: test.startsAt || null,
      duration: test.duration || null,
    } : null,
  };
};

const markAdminExamLeaveSessionExpiredIfNeeded = async (session) => {
  if (!session || session.status !== ADMIN_EXAM_LEAVE_SESSION_STATUSES.PENDING) {
    return session;
  }

  const expiresAtTime = new Date(session.expiresAt).getTime();

  if (!Number.isFinite(expiresAtTime) || expiresAtTime > Date.now()) {
    return session;
  }

  session.status = ADMIN_EXAM_LEAVE_SESSION_STATUSES.EXPIRED;
  session.resolvedAt = new Date();
  await session.save();

  return session;
};

const finishAdminExamLeaveSessions = async (testId, studentId) => {
  if (!testId || !studentId) {
    return;
  }

  await AdminExamLeaveSession.updateMany(
    {
      testId,
      studentId,
      status: {
        $in: [
          ADMIN_EXAM_LEAVE_SESSION_STATUSES.PENDING,
          ADMIN_EXAM_LEAVE_SESSION_STATUSES.APPROVED,
        ],
      },
    },
    {
      $set: {
        status: ADMIN_EXAM_LEAVE_SESSION_STATUSES.FINISHED,
        resolvedAt: new Date(),
      },
    }
  );
};

const findAdminExamLeaveSessionByLookup = async ({ sessionId, manualCode, qrToken }) => {
  if (sessionId) {
    return AdminExamLeaveSession.findById(sessionId);
  }

  const normalizedManualCode = normalizeAdminExamLeaveManualCode(manualCode || qrToken);

  if (normalizedManualCode) {
    return AdminExamLeaveSession.findOne({
      manualCode: normalizedManualCode,
    }).sort({ createdAt: -1 });
  }

  return null;
};

const loadAdminExamLeaveSessionReviewContext = async (session) => {
  const [test, student] = await Promise.all([
    Test.findById(session.testId).select('title startsAt duration instructor type sourceDraftTestIds sourceTeacherIds'),
    Student.findById(session.studentId).select('name surname email'),
  ]);

  return { test, student };
};

const buildAdminExamLeaveSessionActionResponse = async (res, session, statusCode, message) => {
  const { test, student } = await loadAdminExamLeaveSessionReviewContext(session);

  if (!test) {
    return res.status(404).json({ success: false, message: 'Test tapılmadı' });
  }

  return res.status(statusCode).json({
    success: true,
    message,
    data: buildAdminExamLeaveSessionReviewPayload(session, { test, student }),
  });
};

const getTeacherDraftIds = async (teacherId) => {
  const draftIds = await Test.find({
    instructor: teacherId,
    type: TEST_TYPES.TEACHER_DRAFT
  }).distinct('_id');

  return draftIds.map((draftId) => resolveEntityId(draftId)).filter(Boolean);
};

const canTeacherAccessLinkedExam = async (test, teacherId) => {
  if (!test || !teacherId) {
    return false;
  }

  if (resolveEntityId(test.instructor) === resolveEntityId(teacherId)) {
    return true;
  }

  if (test.type !== TEST_TYPES.ADMIN_EXAM || !Array.isArray(test.sourceDraftTestIds) || test.sourceDraftTestIds.length === 0) {
    return false;
  }

  if (Array.isArray(test.sourceTeacherIds) && test.sourceTeacherIds.some((linkedTeacherId) => resolveEntityId(linkedTeacherId) === resolveEntityId(teacherId))) {
    return true;
  }

  const linkedDraftCount = await Test.countDocuments({
    _id: { $in: test.sourceDraftTestIds },
    instructor: teacherId,
    type: TEST_TYPES.TEACHER_DRAFT
  });

  return linkedDraftCount > 0;
};

const buildLinkedExamSummaries = async (teacherDrafts, teacherId) => {
  const draftIds = teacherDrafts.map((draft) => draft._id);

  if (draftIds.length === 0) {
    return [];
  }

  const linkedExams = await Test.find({
    type: TEST_TYPES.ADMIN_EXAM,
    sourceDraftTestIds: { $in: draftIds }
  }).sort({ createdAt: -1 });

  if (linkedExams.length === 0) {
    return [];
  }

  const linkedExamIds = linkedExams.map((exam) => exam._id);
  const results = await TestResult.find({ test: { $in: linkedExamIds } })
    .populate('student', 'name surname email')
    .sort({ completedAt: -1 });

  const resultsByTestId = results.reduce((accumulator, result) => {
    const testId = resolveEntityId(result.test);

    if (!accumulator.has(testId)) {
      accumulator.set(testId, []);
    }

    accumulator.get(testId).push(result);
    return accumulator;
  }, new Map());

  const draftMap = new Map(teacherDrafts.map((draft) => [resolveEntityId(draft._id), draft]));

  return linkedExams.map((exam) => {
    const plainExam = toPlainTest(exam);
    const examId = resolveEntityId(exam._id);
    const examResults = resultsByTestId.get(examId) || [];
    const pendingReviewCount = examResults.filter((result) => getTeacherPendingReviewEntries(exam, result.answers || [], teacherId).length > 0).length;
    const sourceDraftTitles = (plainExam.sourceDraftTestIds || [])
      .map((draftId) => draftMap.get(resolveEntityId(draftId)))
      .filter(Boolean)
      .map((draft) => draft.title)
      .filter(Boolean);

    return {
      ...plainExam,
      accessCodeHash: undefined,
      hasAccessCode: hasExamAccessCode(exam),
      resultsCount: examResults.length,
      pendingReviewCount,
      completedResultsCount: Math.max(examResults.length - pendingReviewCount, 0),
      latestCompletedAt: examResults[0]?.completedAt || null,
      sourceDraftTitles,
      linkedStudents: examResults.map((result) => ({
        ...toPlainResult(result),
        teacherPendingReviewCount: getTeacherPendingReviewEntries(exam, result.answers || [], teacherId).length,
        student: result.student && typeof result.student.toObject === 'function'
          ? result.student.toObject()
          : result.student
      }))
    };
  });
};

const normalizeNumericAnswer = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsedValue = Number(String(value).replace(',', '.').trim());
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const isNumericOpenEndedQuestion = (question) => {
  if (!question || question.answerType !== 'open_ended') {
    return false;
  }

  return question.openEndedAnswerType === 'number';
};

const hasAnswerValue = (value) => Boolean(String(value ?? '').trim());

const isManualReviewQuestion = (question) => Boolean(question && question.answerType === 'open_ended' && !isNumericOpenEndedQuestion(question));

const getQuestionMap = (test) => new Map(
  (test?.questions || []).map((question) => [resolveEntityId(question?._id), question])
);

const isQuestionOwnedByTeacher = (question, test, teacherId) => {
  if (!question || !teacherId) {
    return false;
  }

  const normalizedTeacherId = resolveEntityId(teacherId);
  const sourceTeacherId = resolveEntityId(question.sourceTeacherId);

  if (sourceTeacherId) {
    return sourceTeacherId === normalizedTeacherId;
  }

  const linkedTeacherIds = Array.isArray(test?.sourceTeacherIds)
    ? test.sourceTeacherIds.map((linkedTeacherId) => resolveEntityId(linkedTeacherId)).filter(Boolean)
    : [];

  if (linkedTeacherIds.length === 1) {
    return linkedTeacherIds[0] === normalizedTeacherId;
  }

  return resolveEntityId(test?.instructor) === normalizedTeacherId;
};

const isAnswerPendingExpertReview = (answer, question) => {
  if (!isManualReviewQuestion(question) || !hasAnswerValue(answer?.answer)) {
    return false;
  }

  if (answer?.status === 'pending') {
    return true;
  }

  if (answer?.status === 'graded' || typeof answer?.isCorrect === 'boolean') {
    return false;
  }

  return true;
};

const getTeacherPendingReviewEntries = (test, answers = [], teacherId) => {
  const questionMap = getQuestionMap(test);

  return answers.reduce((entries, answer) => {
    const question = questionMap.get(resolveEntityId(answer?.questionId));

    if (!question || !isQuestionOwnedByTeacher(question, test, teacherId) || !isAnswerPendingExpertReview(answer, question)) {
      return entries;
    }

    entries.push({ answer, question });
    return entries;
  }, []);
};

const recalculateTestResultOutcome = (testResult) => {
  const totalQuestions = Array.isArray(testResult?.test?.questions) ? testResult.test.questions.length : 0;
  const correctCount = (testResult.answers || []).filter((answer) => answer?.isCorrect === true).length;
  const questionMap = getQuestionMap(testResult.test);

  testResult.scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  testResult.hasPendingAnswers = (testResult.answers || []).some((answer) => {
    const question = questionMap.get(resolveEntityId(answer?.questionId));
    return isAnswerPendingExpertReview(answer, question);
  });
};

const buildPublishedExamQuestions = (sourceDraftTestIds, sourceDrafts) => {
  const draftMap = new Map(sourceDrafts.map((draft) => [resolveEntityId(draft._id), draft]));

  return sourceDraftTestIds.flatMap((draftId) => {
    const draft = draftMap.get(resolveEntityId(draftId));

    if (!draft) {
      return [];
    }

    return (draft.questions || []).map((question) => {
      const plainQuestion = typeof question?.toObject === 'function' ? question.toObject() : question;

      return {
        ...plainQuestion,
        sourceDraftTestId: draft._id,
        sourceTeacherId: draft.instructor
      };
    });
  });
};

const normalizeMultipleChoiceAnswer = (value) => {
  const parsedValue = Number(String(value).trim());
  return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : null;
};

const getMultipleChoiceCorrectAnswerIndex = (question) => {
  const storedIndex = normalizeMultipleChoiceAnswer(question?.correctAnswer);
  if (storedIndex !== null) {
    return storedIndex;
  }

  if (!question?.options?.length) {
    return null;
  }

  const fallbackIndex = question.options.findIndex(option => option === question.correctAnswer);
  return fallbackIndex >= 0 ? fallbackIndex : null;
};

// @desc    Müəllim üçün yeni test yarat
// @route   POST /api/tests
// @access  Private (Teacher)
exports.createTest = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) {
      return;
    }

    const { title, course, duration, allowRetake, questions } = req.body;

    if (!String(title || '').trim()) {
      return res.status(400).json({ success: false, message: 'Test başlığı məcburidir' });
    }

    if (!course) {
      return res.status(400).json({ success: false, message: 'Kurs seçimi məcburidir' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Ən azı bir sual əlavə edin' });
    }

    const newTest = await Test.create({
      title: String(title).trim(),
      type: TEST_TYPES.COURSE,
      course,
      instructor: req.user.id,
      duration,
      allowRetake: allowRetake ?? false,
      questions
    });

    res.status(201).json({
      success: true,
      data: newTest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Hatası', error: error.message });
  }
};

// @desc    Müəllim üçün testi yenilə
// @route   PUT /api/tests/:id
// @access  Private (Teacher)
exports.updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, duration, allowRetake, questions } = req.body;

    const test = await Test.findById(id);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test tapılmadı' });
    }

    if (test.type !== TEST_TYPES.COURSE) {
      return res.status(400).json({ success: false, message: 'Bu route yalnız kurs testləri üçün nəzərdə tutulub' });
    }

    if (test.instructor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'İcazə rədd edildi' });
    }

    test.title = title ?? test.title;
    test.duration = duration ?? test.duration;
    test.allowRetake = allowRetake ?? test.allowRetake;
    if (Array.isArray(questions)) {
      test.questions = questions;
    }

    const updatedTest = await test.save();

    res.status(200).json({
      success: true,
      data: updatedTest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Hatası', error: error.message });
  }
};

// @desc    Müəllim üçün testi sil
// @route   DELETE /api/tests/:id
// @access  Private (Teacher)
exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await Test.findById(id);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test tapılmadı' });
    }

    if (test.type !== TEST_TYPES.COURSE) {
      return res.status(400).json({ success: false, message: 'Bu route yalnız kurs testləri üçün nəzərdə tutulub' });
    }

    if (test.instructor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'İcazə rədd edildi' });
    }

    await Test.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Test silindi'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Hatası', error: error.message });
  }
};

// @desc    Kursun bütün testlərini gətir
// @route   GET /api/tests/course/:courseId
// @access  Private
exports.getTestsByCourse = async (req, res) => {
  try {
    const tests = await Test.find({ course: req.params.courseId, type: TEST_TYPES.COURSE });
    res.status(200).json({
      success: true,
      data: tests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Hatası', error: error.message });
  }
};

// @desc    Müəllimin bütün testlərini gətir
// @route   GET /api/tests/my
// @access  Private (Teacher)
exports.getMyTests = async (req, res) => {
  try {
    const tests = await Test.find({ instructor: req.user.id, type: TEST_TYPES.COURSE })
      .populate('course', 'title category image instructor');

    res.status(200).json({
      success: true,
      data: tests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Hatası', error: error.message });
  }
};

// @desc    Test məlumatlarını gətir
// @route   GET /api/tests/:id
// @access  Private
exports.getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test tapılmadı' });
    }

    if (test.type === TEST_TYPES.TEACHER_DRAFT) {
      if (!isTeacherUser(req.user) || test.instructor.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Bu imtahan layihəsinə giriş icazəniz yoxdur' });
      }
    }

    if (test.type === TEST_TYPES.ADMIN_EXAM) {
      if (isStudentUser(req.user)) {
        const accessCheck = await ensureStudentCanOpenAdminExam(test, req.user.id, {
          allowApprovedLeaveResume: true,
        });

        if (!accessCheck.ok) {
          return res.status(accessCheck.status).json(buildAdminExamAccessErrorResponseBody(accessCheck));
        }

        return res.status(200).json({
          success: true,
          data: buildStudentAdminExamPayload(test, accessCheck.accessState, {
            includeQuestions: Boolean(accessCheck.approvedLeaveSession),
            resumeGranted: Boolean(accessCheck.approvedLeaveSession),
          })
        });
      }

      if (isTeacherUser(req.user)) {
        const canAccess = await canTeacherAccessLinkedExam(test, req.user.id);

        if (!canAccess) {
          return res.status(403).json({ success: false, message: 'Bu imtahana giriş icazəniz yoxdur' });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: test
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Hatası', error: error.message });
  }
};

// @desc    Tələbə testi cavablayıb təslim edir
// @route   POST /api/tests/:id/submit
// @access  Private (Student)
exports.submitTest = async (req, res) => {
  try {
    const { answers } = req.body; // array of { questionId, answer }
    const testId = req.params.id;
    const normalizedSubmissionStatus = req.body?.submissionStatus === TEST_RESULT_STATUSES.TERMINATED
      ? TEST_RESULT_STATUSES.TERMINATED
      : TEST_RESULT_STATUSES.COMPLETED;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test tapılmadı' });
    }

    if (test.type === TEST_TYPES.TEACHER_DRAFT) {
      return res.status(403).json({ success: false, message: 'Müəllim layihə imtahanları tələbələr üçün açıq deyil' });
    }

    if (test.type === TEST_TYPES.ADMIN_EXAM) {
      if (!ensureStudent(req, res)) {
        return;
      }

      const accessCheck = await ensureStudentCanSubmitAdminExam(test, req.user.id, req.body.accessCode, {
        allowExpired: true,
        ignoreLeaveSessionLock: normalizedSubmissionStatus === TEST_RESULT_STATUSES.TERMINATED,
      });

      if (!accessCheck.ok) {
        return res.status(accessCheck.status).json(buildAdminExamAccessErrorResponseBody(accessCheck));
      }
    }

    const existingResult = await TestResult.findOne({ test: testId, student: req.user.id });
    if (existingResult && !test.allowRetake) {
      return res.status(409).json({
        success: false,
        message: 'Bu test yalnız bir dəfə yazıla bilər'
      });
    }

    let correctCount = 0;
    let totalQuestions = test.questions.length;
    let hasPending = false;

    const processedAnswers = answers.map(studentAns => {
      const q = test.questions.find(x => x._id.toString() === studentAns.questionId);
      
      let isCorrect = false;
      let status = 'graded';

      if (q) {
        if (q.answerType === 'multiple_choice') {
          const studentAnswerIndex = normalizeMultipleChoiceAnswer(studentAns.answer);
          const correctAnswerIndex = getMultipleChoiceCorrectAnswerIndex(q);

          if (studentAnswerIndex !== null && correctAnswerIndex !== null && studentAnswerIndex === correctAnswerIndex) {
            isCorrect = true;
            correctCount++;
          } else if (studentAnswerIndex === null && q.correctAnswer === studentAns.answer) {
            isCorrect = true;
            correctCount++;
          }
        } else if (q.answerType === 'open_ended') {
          if (isNumericOpenEndedQuestion(q)) {
            const studentNumericAnswer = normalizeNumericAnswer(studentAns.answer);
            const correctNumericAnswer = normalizeNumericAnswer(q.correctAnswer);

            if (studentNumericAnswer !== null && correctNumericAnswer !== null && studentNumericAnswer === correctNumericAnswer) {
              isCorrect = true;
              correctCount++;
            }
          } else {
            status = 'pending';
            hasPending = true;
            // Open ended text sayılmır başlanğıcda (Müəllim düz xallayanda ümumi bal hesabı dəyişəcək)
          }
        }
      }

      return {
        questionId: studentAns.questionId,
        answer: studentAns.answer,
        isCorrect,
        status
      };
    });

    const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    const result = await TestResult.create({
      test: testId,
      student: req.user.id,
      answers: processedAnswers,
      status: normalizedSubmissionStatus,
      scorePercentage: scorePercentage,
      hasPendingAnswers: hasPending
    });

    if (test.type === TEST_TYPES.ADMIN_EXAM) {
      await finalizeAdminExamEntry(testId, req.user.id, normalizedSubmissionStatus);
      await finishAdminExamLeaveSessions(testId, req.user.id);
    }

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Hatası', error: error.message });
  }
};

// @desc    Admin imtahanı üçün leave session yarat
// @route   POST /api/tests/:id/leave-session
// @access  Private (Student)
exports.createAdminExamLeaveSession = async (req, res) => {
  try {
    if (!ensureStudent(req, res)) {
      return;
    }

    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test tapılmadı' });
    }

    if (test.type !== TEST_TYPES.ADMIN_EXAM) {
      return res.status(400).json({ success: false, message: 'Bu endpoint yalnız admin imtahanları üçündür' });
    }

    const activeLeaveSessionLock = await getActiveAdminExamLeaveSessionLock(test._id, req.user.id);

    if (activeLeaveSessionLock) {
      if (activeLeaveSessionLock.code === ADMIN_EXAM_ACCESS_ERROR_CODES.LEAVE_SESSION_PENDING) {
        return res.status(200).json({
          success: true,
          code: activeLeaveSessionLock.code,
          data: buildAdminExamLeaveSessionLockPayload(activeLeaveSessionLock.session),
        });
      }

      return res.status(activeLeaveSessionLock.httpStatus).json({
        success: false,
        code: activeLeaveSessionLock.code,
        message: activeLeaveSessionLock.message,
        data: buildAdminExamLeaveSessionLockPayload(activeLeaveSessionLock.session),
      });
    }

    const accessCheck = await ensureStudentCanSubmitAdminExam(test, req.user.id, req.body.accessCode, {
      allowExpired: true,
    });

    if (!accessCheck.ok) {
      return res.status(accessCheck.status).json(buildAdminExamAccessErrorResponseBody(accessCheck));
    }

    if (accessCheck.consumedEntry?.status !== ADMIN_EXAM_ENTRY_STATUSES.STARTED) {
      return res.status(409).json(buildAdminExamAccessErrorResponseBody(
        buildAdminExamReentryBlockedResponse(accessCheck.accessState, accessCheck.consumedEntry)
      ));
    }

    const now = new Date();

    const manualCode = await createUniqueAdminExamLeaveManualCode();

    const session = await AdminExamLeaveSession.create({
      testId: test._id,
      studentId: req.user.id,
      status: ADMIN_EXAM_LEAVE_SESSION_STATUSES.PENDING,
      manualCode,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ADMIN_EXAM_LEAVE_SESSION_DURATION_MS),
      resolvedAt: null,
    });

    res.status(201).json({
      success: true,
      data: buildAdminExamLeaveSessionPayload(session),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Leave session yaradılmadı', error: error.message });
  }
};

// @desc    Admin imtahanı leave session statusunu gətir
// @route   GET /api/tests/leave-sessions/:sessionId
// @access  Private (Student)
exports.getAdminExamLeaveSession = async (req, res) => {
  try {
    if (!ensureStudent(req, res)) {
      return;
    }

    let session = await AdminExamLeaveSession.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Leave session tapılmadı' });
    }

    if (resolveEntityId(session.studentId) !== resolveEntityId(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Bu leave session sizə aid deyil' });
    }

    session = await markAdminExamLeaveSessionExpiredIfNeeded(session);

    res.status(200).json({
      success: true,
      data: buildAdminExamLeaveSessionPayload(session),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Leave session statusu alınmadı', error: error.message });
  }
};

// @desc    Müəllim leave session manual kodunu yoxlayır
// @route   POST /api/tests/leave-sessions/resolve
// @access  Private (Teacher)
exports.resolveAdminExamLeaveSession = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) {
      return;
    }

    const sessionId = typeof req.body.sessionId === 'string' ? req.body.sessionId.trim() : '';
    const manualCode = normalizeAdminExamLeaveManualCode(req.body.manualCode);
    const qrToken = typeof req.body.qrToken === 'string' ? req.body.qrToken.trim() : '';

    if (!sessionId && !manualCode && !qrToken) {
      return res.status(400).json({ success: false, message: 'Manual kod və ya session identifikatoru tələb olunur' });
    }

    let session = await findAdminExamLeaveSessionByLookup({ sessionId, manualCode, qrToken });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Leave session tapılmadı' });
    }

    session = await markAdminExamLeaveSessionExpiredIfNeeded(session);

    const { test, student } = await loadAdminExamLeaveSessionReviewContext(session);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test tapılmadı' });
    }

    const canAccess = await canTeacherAccessLinkedExam(test, req.user.id);

    if (!canAccess) {
      return res.status(403).json({ success: false, message: 'Bu leave session üçün icazəniz yoxdur' });
    }

    const messageByStatus = {
      [ADMIN_EXAM_LEAVE_SESSION_STATUSES.PENDING]: 'Manual kod tapıldı, müəllim qərarı gözlənilir',
      [ADMIN_EXAM_LEAVE_SESSION_STATUSES.APPROVED]: 'Bu leave session artıq təsdiqlənib',
      [ADMIN_EXAM_LEAVE_SESSION_STATUSES.EXPIRED]: 'Leave session müddəti bitib',
      [ADMIN_EXAM_LEAVE_SESSION_STATUSES.FINISHED]: 'Bu leave session artıq bağlanıb',
      [ADMIN_EXAM_LEAVE_SESSION_STATUSES.REJECTED]: 'Bu leave session rədd edilib',
    };

    res.status(200).json({
      success: true,
      data: buildAdminExamLeaveSessionReviewPayload(session, { test, student }),
      message: messageByStatus[session.status] || 'Leave session tapıldı',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Manual kod yoxlanmadı', error: error.message });
  }
};

// @desc    Müəllim leave session-u təsdiqləyir və imtahanı davam etdirir
// @route   POST /api/tests/leave-sessions/:sessionId/approve
// @access  Private (Teacher)
exports.approveAdminExamLeaveSession = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) {
      return;
    }

    let session = await AdminExamLeaveSession.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Leave session tapılmadı' });
    }

    session = await markAdminExamLeaveSessionExpiredIfNeeded(session);

    const { test } = await loadAdminExamLeaveSessionReviewContext(session);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test tapılmadı' });
    }

    const canAccess = await canTeacherAccessLinkedExam(test, req.user.id);

    if (!canAccess) {
      return res.status(403).json({ success: false, message: 'Bu leave session üçün icazəniz yoxdur' });
    }

    if (session.status === ADMIN_EXAM_LEAVE_SESSION_STATUSES.APPROVED) {
      return buildAdminExamLeaveSessionActionResponse(res, session, 200, 'Bu leave session artıq təsdiqlənib');
    }

    if (session.status === ADMIN_EXAM_LEAVE_SESSION_STATUSES.PENDING) {
      session.status = ADMIN_EXAM_LEAVE_SESSION_STATUSES.APPROVED;
      session.resolvedAt = new Date();
      await session.save();

      return buildAdminExamLeaveSessionActionResponse(res, session, 200, 'Leave session təsdiqləndi, tələbə imtahana davam edə bilər');
    }

    return buildAdminExamLeaveSessionActionResponse(
      res,
      session,
      200,
      session.status === ADMIN_EXAM_LEAVE_SESSION_STATUSES.EXPIRED
        ? 'Leave session müddəti bitib'
        : session.status === ADMIN_EXAM_LEAVE_SESSION_STATUSES.REJECTED
          ? 'Bu leave session rədd edilib'
          : 'Bu leave session artıq bağlanıb'
    );
  } catch (error) {
    res.status(500).json({ success: false, message: 'Leave session təsdiqlənmədi', error: error.message });
  }
};

// @desc    Müəllim leave session-u rədd edir və imtahanı sonlandırır
// @route   POST /api/tests/leave-sessions/:sessionId/reject
// @access  Private (Teacher)
exports.rejectAdminExamLeaveSession = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) {
      return;
    }

    let session = await AdminExamLeaveSession.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Leave session tapılmadı' });
    }

    session = await markAdminExamLeaveSessionExpiredIfNeeded(session);

    const { test } = await loadAdminExamLeaveSessionReviewContext(session);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test tapılmadı' });
    }

    const canAccess = await canTeacherAccessLinkedExam(test, req.user.id);

    if (!canAccess) {
      return res.status(403).json({ success: false, message: 'Bu leave session üçün icazəniz yoxdur' });
    }

    if (session.status === ADMIN_EXAM_LEAVE_SESSION_STATUSES.REJECTED) {
      return buildAdminExamLeaveSessionActionResponse(res, session, 200, 'Bu leave session artıq rədd edilib');
    }

    if (session.status === ADMIN_EXAM_LEAVE_SESSION_STATUSES.PENDING) {
      session.status = ADMIN_EXAM_LEAVE_SESSION_STATUSES.REJECTED;
      session.resolvedAt = new Date();
      await session.save();

      return buildAdminExamLeaveSessionActionResponse(res, session, 200, 'Leave session rədd edildi, imtahan sonlandırılır');
    }

    return buildAdminExamLeaveSessionActionResponse(
      res,
      session,
      200,
      session.status === ADMIN_EXAM_LEAVE_SESSION_STATUSES.EXPIRED
        ? 'Leave session müddəti bitib'
        : session.status === ADMIN_EXAM_LEAVE_SESSION_STATUSES.APPROVED
          ? 'Bu leave session artıq təsdiqlənib'
          : 'Bu leave session artıq bağlanıb'
    );
  } catch (error) {
    res.status(500).json({ success: false, message: 'Leave session rədd edilmədi', error: error.message });
  }
};

// @desc    Müəllim gözləmədəki (open_ended) sualları dəyərləndirir
// @route   PUT /api/tests/results/:resultId/evaluate
// @access  Private (Teacher)
exports.evaluateOpenEnded = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) {
      return;
    }

    const { evaluations } = req.body; // [{ questionId, isCorrect: true/false }]
    const resultId = req.params.resultId;

    const testResult = await TestResult.findById(resultId).populate('test');
    if (!testResult) {
      return res.status(404).json({ success: false, message: 'Nəticə tapılmadı' });
    }

    const canAccess = await canTeacherAccessLinkedExam(testResult.test, req.user.id);
    if (!canAccess) {
      return res.status(403).json({ success: false, message: 'Bu cavabları yoxlamaq icazəniz yoxdur' });
    }

    const pendingEntries = getTeacherPendingReviewEntries(testResult.test, testResult.answers || [], req.user.id);
    const pendingByQuestionId = pendingEntries.reduce((accumulator, entry) => {
      accumulator.set(resolveEntityId(entry.answer.questionId), entry.answer);
      return accumulator;
    }, new Map());

    const normalizedEvaluations = Array.isArray(evaluations)
      ? evaluations.filter((entry) => pendingByQuestionId.has(resolveEntityId(entry?.questionId)))
      : [];

    if (normalizedEvaluations.length === 0) {
      return res.status(400).json({ success: false, message: 'Yoxlanacaq açıq cavab tapılmadı' });
    }

    normalizedEvaluations.forEach((entry) => {
      const answer = pendingByQuestionId.get(resolveEntityId(entry.questionId));

      if (!answer) {
        return;
      }

      answer.isCorrect = entry.isCorrect === true;
      answer.status = 'graded';
    });

    recalculateTestResultOutcome(testResult);
    
    await testResult.save();

    res.status(200).json({
      success: true,
      data: testResult
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Hatası', error: error.message });
  }
};

// @desc    Tələbə öz testlərinin nəticələrini alır
// @route   GET /api/tests/results/my
// @access  Private (Student)
exports.getMyTestResults = async (req, res) => {
  try {
    const results = await TestResult.find({ student: req.user.id })
       .populate({
         path: 'test',
         match: { type: { $ne: TEST_TYPES.TEACHER_DRAFT } },
         select: 'title course duration allowRetake type sourceDraftTestIds startsAt isStudentVisible',
         populate: {
           path: 'course',
           select: 'title instructor',
           populate: {
             path: 'instructor',
             select: 'name surname'
           }
         }
       });
    
    res.status(200).json({
      success: true,
      data: results.filter((result) => Boolean(result.test))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Hatası', error: error.message });
  }
};

// @desc    Müəllim öz testlərinin tələbə nəticələrini alır
// @route   GET /api/tests/:id/results
// @access  Private (Teacher)
exports.getTestResultsForTeacher = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) {
      return;
    }

    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test tapılmadı' });
    }

    const canAccess = await canTeacherAccessLinkedExam(test, req.user.id);

    if (!canAccess) {
      return res.status(403).json({ success: false, message: 'Bu nəticələrə baxmaq icazəniz yoxdur' });
    }

    const results = await TestResult.find({ test: req.params.id })
      .populate('student', 'name surname email');

    const normalizedResults = results.map((result) => ({
      ...toPlainResult(result),
      teacherPendingReviewCount: getTeacherPendingReviewEntries(test, result.answers || [], req.user.id).length,
      student: result.student && typeof result.student.toObject === 'function'
        ? result.student.toObject()
        : result.student
    }));

    res.status(200).json({
      success: true,
      data: normalizedResults
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Hatası', error: error.message });
  }
};

// @desc    Müəllim üçün ayrıca imtahan layihəsi yarat
// @route   POST /api/tests/teacher-exams
// @access  Private (Teacher)
exports.createTeacherExamDraft = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) {
      return;
    }

    const teacherDraftPayload = buildTeacherDraftPayload(req.body, req.user.id);

    if (!teacherDraftPayload.title) {
      return res.status(400).json({ success: false, message: 'İmtahan başlığı məcburidir' });
    }

    if (!Array.isArray(teacherDraftPayload.questions) || teacherDraftPayload.questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Ən azı bir sual əlavə edin' });
    }

    const teacherDraft = await Test.create(teacherDraftPayload);

    res.status(201).json({
      success: true,
      data: teacherDraft
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Müəllim imtahanı yaradılmadı', error: error.message });
  }
};

// @desc    Müəllimin ayrıca imtahan layihələrini və bağlı yekun imtahanları gətir
// @route   GET /api/tests/teacher-exams/panel
// @access  Private (Teacher)
exports.getTeacherExamPanelData = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) {
      return;
    }

    const teacherDrafts = await Test.find({
      instructor: req.user.id,
      type: TEST_TYPES.TEACHER_DRAFT
    }).sort({ createdAt: -1 });

    const linkedExams = await buildLinkedExamSummaries(teacherDrafts, req.user.id);

    res.status(200).json({
      success: true,
      data: {
        drafts: teacherDrafts,
        linkedExams
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Müəllim imtahan paneli yüklənmədi', error: error.message });
  }
};

// @desc    Müəllim ayrıca imtahan layihəsini yenilə
// @route   PUT /api/tests/teacher-exams/:id
// @access  Private (Teacher)
exports.updateTeacherExamDraft = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) {
      return;
    }

    const draft = await Test.findById(req.params.id);

    if (!draft || draft.type !== TEST_TYPES.TEACHER_DRAFT) {
      return res.status(404).json({ success: false, message: 'Müəllim imtahanı tapılmadı' });
    }

    if (draft.instructor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu imtahanı dəyişmək icazəniz yoxdur' });
    }

    if (!editableTeacherDraftStatuses.has(draft.workflowStatus || WORKFLOW_STATUSES.DRAFT)) {
      return res.status(400).json({ success: false, message: 'Adminə göndərilmiş və ya istifadə olunmuş imtahan redaktə edilə bilməz' });
    }

    draft.title = req.body.title ?? draft.title;
    draft.duration = req.body.duration ?? draft.duration;
    draft.allowRetake = req.body.allowRetake ?? draft.allowRetake;
    draft.adminNotes = req.body.adminNotes ?? draft.adminNotes;

    if (Array.isArray(req.body.questions)) {
      draft.questions = req.body.questions;
    }

    const currentWorkflowStatus = draft.workflowStatus || WORKFLOW_STATUSES.DRAFT;

    draft.workflowStatus = req.body.workflowStatus || (currentWorkflowStatus === WORKFLOW_STATUSES.SUBMITTED
      ? WORKFLOW_STATUSES.DRAFT
      : currentWorkflowStatus);

    if (currentWorkflowStatus === WORKFLOW_STATUSES.SUBMITTED && draft.workflowStatus === WORKFLOW_STATUSES.DRAFT) {
      draft.submittedAt = null;
      draft.reviewedAt = null;
    }

    const updatedDraft = await draft.save();

    res.status(200).json({
      success: true,
      data: updatedDraft
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Müəllim imtahanı yenilənmədi', error: error.message });
  }
};

// @desc    Müəllim ayrıca imtahan layihəsini adminə göndər
// @route   POST /api/tests/teacher-exams/:id/submit
// @access  Private (Teacher)
exports.submitTeacherExamDraft = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) {
      return;
    }

    const draft = await Test.findById(req.params.id);

    if (!draft || draft.type !== TEST_TYPES.TEACHER_DRAFT) {
      return res.status(404).json({ success: false, message: 'Müəllim imtahanı tapılmadı' });
    }

    if (draft.instructor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu imtahanı göndərmək icazəniz yoxdur' });
    }

    if (!editableTeacherDraftStatuses.has(draft.workflowStatus || WORKFLOW_STATUSES.DRAFT)) {
      return res.status(400).json({ success: false, message: 'İstifadə olunmuş və ya təsdiqlənmiş imtahan yenidən göndərilə bilməz' });
    }

    draft.workflowStatus = WORKFLOW_STATUSES.SUBMITTED;
    draft.submittedAt = new Date();
    draft.reviewedAt = null;

    const savedDraft = await draft.save();

    res.status(200).json({
      success: true,
      data: savedDraft
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'İmtahan adminə göndərilmədi', error: error.message });
  }
};

// @desc    Müəllim öz imtahan layihəsini silir
// @route   DELETE /api/tests/teacher-exams/:id
// @access  Private (Teacher)
exports.deleteTeacherExamDraft = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) {
      return;
    }

    const draft = await Test.findById(req.params.id);

    if (!draft || draft.type !== TEST_TYPES.TEACHER_DRAFT) {
      return res.status(404).json({ success: false, message: 'Müəllim imtahanı tapılmadı' });
    }

    if (draft.instructor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu imtahanı silmək icazəniz yoxdur' });
    }

    if (!editableTeacherDraftStatuses.has(draft.workflowStatus || WORKFLOW_STATUSES.DRAFT)) {
      return res.status(400).json({ success: false, message: 'Adminə göndərilmiş və ya istifadə olunmuş imtahan silinə bilməz' });
    }

    await Test.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'İmtahan layihəsi silindi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'İmtahan layihəsi silinmədi', error: error.message });
  }
};

// @desc    Admin üçün müəllimdən gələn imtahan layihələrini gətir
// @route   GET /api/tests/teacher-exams/admin/submitted
// @access  Private (Admin)
exports.getSubmittedTeacherExamDraftsForAdmin = async (_req, res) => {
  try {
    const drafts = await Test.find({
      type: TEST_TYPES.TEACHER_DRAFT,
      workflowStatus: { $in: [WORKFLOW_STATUSES.SUBMITTED, WORKFLOW_STATUSES.APPROVED, WORKFLOW_STATUSES.REJECTED] }
    })
      .populate('instructor', 'name surname email avatar')
      .sort({ submittedAt: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: drafts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Admin üçün layihələr alınmadı', error: error.message });
  }
};

// @desc    Admin üçün imtahan paneli datasını gətir
// @route   GET /api/tests/teacher-exams/admin/panel
// @access  Private (Admin)
exports.getAdminExamPanelData = async (_req, res) => {
  try {
    const [drafts, adminExams] = await Promise.all([
      Test.find({
        type: TEST_TYPES.TEACHER_DRAFT,
        workflowStatus: { $in: [WORKFLOW_STATUSES.SUBMITTED, WORKFLOW_STATUSES.APPROVED, WORKFLOW_STATUSES.REJECTED, WORKFLOW_STATUSES.USED] }
      })
        .populate('instructor', 'name surname email avatar')
        .sort({ submittedAt: -1, createdAt: -1 }),
      Test.find({ type: TEST_TYPES.ADMIN_EXAM })
        .populate('instructor', 'name surname email avatar')
        .sort({ createdAt: -1 })
    ]);

    const publishedExams = await buildAdminExamSummaries(adminExams);

    res.status(200).json({
      success: true,
      data: {
        drafts,
        publishedExams
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Admin imtahan paneli yüklənmədi', error: error.message });
  }
};

// @desc    Admin müəllim imtahan layihəsinin statusunu yenilə
// @route   PATCH /api/tests/teacher-exams/admin/:id/status
// @access  Private (Admin)
exports.updateTeacherExamDraftStatusByAdmin = async (req, res) => {
  try {
    const draft = await Test.findById(req.params.id);

    if (!draft || draft.type !== TEST_TYPES.TEACHER_DRAFT) {
      return res.status(404).json({ success: false, message: 'Müəllim imtahanı tapılmadı' });
    }

    const nextStatus = req.body.workflowStatus;
    const allowedStatuses = new Set([WORKFLOW_STATUSES.APPROVED, WORKFLOW_STATUSES.REJECTED, WORKFLOW_STATUSES.USED]);

    if (!allowedStatuses.has(nextStatus)) {
      return res.status(400).json({ success: false, message: 'Keçərsiz status dəyəri' });
    }

    draft.workflowStatus = nextStatus;
    draft.reviewedAt = new Date();
    draft.adminNotes = req.body.adminNotes ?? draft.adminNotes;

    const updatedDraft = await draft.save();

    res.status(200).json({
      success: true,
      data: updatedDraft
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Layihə statusu yenilənmədi', error: error.message });
  }
};

// @desc    Admin müəllim layihələrindən yekun imtahan yaradır
// @route   POST /api/tests/teacher-exams/admin/publish
// @access  Private (Admin)
exports.createAdminExamFromDrafts = async (req, res) => {
  try {
    const sourceDraftTestIds = Array.isArray(req.body.sourceDraftTestIds)
      ? req.body.sourceDraftTestIds.filter(Boolean)
      : [];
    const normalizedTitle = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const normalizedDuration = Number(req.body.duration);
    const normalizedAccessCode = typeof req.body.accessCode === 'string' ? req.body.accessCode.trim() : '';
    const startsAt = req.body.startsAt ? new Date(req.body.startsAt) : null;

    if (sourceDraftTestIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Ən azı bir müəllim imtahanı seçilməlidir' });
    }

    if (!normalizedTitle) {
      return res.status(400).json({ success: false, message: 'İmtahan adı mütləqdir' });
    }

    if (!Number.isFinite(normalizedDuration) || normalizedDuration <= 0) {
      return res.status(400).json({ success: false, message: 'İmtahan müddəti düzgün daxil edilməlidir' });
    }

    if (!startsAt || Number.isNaN(startsAt.getTime())) {
      return res.status(400).json({ success: false, message: 'İmtahanın başlama vaxtı mütləqdir' });
    }

    if (!normalizedAccessCode) {
      return res.status(400).json({ success: false, message: 'İmtahan şifrəsi mütləqdir' });
    }

    const sourceDrafts = await Test.find({
      _id: { $in: sourceDraftTestIds },
      type: TEST_TYPES.TEACHER_DRAFT,
      workflowStatus: { $in: [WORKFLOW_STATUSES.SUBMITTED, WORKFLOW_STATUSES.APPROVED, WORKFLOW_STATUSES.USED] }
    });

    if (sourceDrafts.length !== sourceDraftTestIds.length) {
      return res.status(404).json({ success: false, message: 'Seçilən layihələr tapılmadı' });
    }

    const orderedDrafts = sourceDraftTestIds
      .map((draftId) => sourceDrafts.find((draft) => resolveEntityId(draft._id) === resolveEntityId(draftId)))
      .filter(Boolean);
    const sourceTeacherIds = Array.from(new Set(orderedDrafts.map((draft) => resolveEntityId(draft.instructor)).filter(Boolean)));
    const normalizedQuestions = buildPublishedExamQuestions(sourceDraftTestIds, orderedDrafts);
    const accessCodeHash = await bcrypt.hash(normalizedAccessCode, 10);

    const publishedExam = await Test.create({
      title: normalizedTitle,
      type: TEST_TYPES.ADMIN_EXAM,
      instructor: sourceDrafts[0].instructor,
      duration: normalizedDuration,
      allowRetake: req.body.allowRetake ?? false,
      questions: normalizedQuestions,
      workflowStatus: WORKFLOW_STATUSES.APPROVED,
      isStudentVisible: req.body.isStudentVisible !== false,
      startsAt,
      activatedAt: new Date(),
      accessCodeHash,
      sourceDraftTestIds,
      sourceTeacherIds
    });

    await Student.updateMany(
      {},
      {
        $addToSet: {
          assignedTests: publishedExam._id
        }
      }
    );

    await Test.updateMany(
      { _id: { $in: sourceDraftTestIds } },
      {
        $set: {
          workflowStatus: WORKFLOW_STATUSES.USED,
          reviewedAt: new Date()
        }
      }
    );

    res.status(201).json({
      success: true,
      data: {
        ...toPlainTest(publishedExam),
        accessCodeHash: undefined,
        hasAccessCode: true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Yekun imtahan yaradılmadı', error: error.message });
  }
};

// @desc    Tələbə üçün admin imtahanına giriş yoxlaması
// @route   POST /api/tests/:id/access
// @access  Private (Student)
exports.verifyAdminExamAccess = async (req, res) => {
  try {
    if (!ensureStudent(req, res)) {
      return;
    }

    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test tapılmadı' });
    }

    if (test.type !== TEST_TYPES.ADMIN_EXAM) {
      return res.status(400).json({ success: false, message: 'Bu endpoint yalnız admin imtahanları üçündür' });
    }

    const accessCheck = await ensureStudentCanStartAdminExam(test, req.user.id, req.body.accessCode);

    if (!accessCheck.ok) {
      return res.status(accessCheck.status).json(buildAdminExamAccessErrorResponseBody(accessCheck));
    }

    res.status(200).json({
      success: true,
      data: buildStudentAdminExamPayload(test, accessCheck.accessState, { includeQuestions: true })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'İmtahan giriş yoxlaması alınmadı', error: error.message });
  }
};

// @desc    Tələbə üçün admin imtahanını başlat və birdəfəlik girişi istehlak et
// @route   POST /api/tests/:id/start
// @access  Private (Student)
exports.startAdminExamAttempt = async (req, res) => {
  try {
    if (!ensureStudent(req, res)) {
      return;
    }

    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test tapılmadı' });
    }

    if (test.type !== TEST_TYPES.ADMIN_EXAM) {
      return res.status(400).json({ success: false, message: 'Bu endpoint yalnız admin imtahanları üçündür' });
    }

    const accessCheck = await ensureStudentCanStartAdminExam(test, req.user.id, req.body.accessCode);

    if (!accessCheck.ok) {
      return res.status(accessCheck.status).json(buildAdminExamAccessErrorResponseBody(accessCheck));
    }

    let entry;

    try {
      entry = await AdminExamEntry.create({
        testId: test._id,
        studentId: req.user.id,
        status: ADMIN_EXAM_ENTRY_STATUSES.STARTED,
        startedAt: new Date(),
        finalizedAt: null,
      });
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }

      entry = await findAdminExamEntry(test._id, req.user.id);

      return res.status(409).json(buildAdminExamAccessErrorResponseBody(
        buildAdminExamReentryBlockedResponse(accessCheck.accessState, entry)
      ));
    }

    return res.status(200).json({
      success: true,
      data: {
        startedAt: entry.startedAt,
        status: entry.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'İmtahan başlatılmadı', error: error.message });
  }
};
