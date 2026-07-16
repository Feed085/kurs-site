import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  ArrowLeft,
  CheckCheck,
  ClipboardList,
  CheckCircle,
  Pencil,
  FileText,
  FolderKanban,
  Loader2,
  Plus,
  Search,
  Send,
  Sparkles,
  TimerReset,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { TeacherAssessmentQuestionBuilder } from '@/components/common/TeacherAssessmentQuestionBuilder';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createDefaultAssessmentQuestion,
  createAssessmentQuestionId,
  formatAssessmentQuestionsForApi,
  type AssessmentQuestion,
  validateAssessmentQuestions,
} from '@/lib/teacherAssessment';
import { API_BASE_URL } from '@/services/publicApi';

type TeacherExamPanelTabKey = 'drafts' | 'create' | 'review' | 'results' | 'qr';

type DraftQuestion = AssessmentQuestion;

type StoredDraftQuestion = {
  _id?: string;
  questionType?: 'text' | 'image';
  content?: string;
  answerType?: 'multiple_choice' | 'open_ended';
  openEndedAnswerType?: 'text' | 'number';
  options?: string[];
  correctAnswer?: string;
};

type TeacherDraftExam = {
  _id?: string;
  id?: string;
  title?: string;
  duration?: number;
  allowRetake?: boolean;
  questions?: StoredDraftQuestion[];
  workflowStatus?: 'draft' | 'submitted_to_admin' | 'approved' | 'rejected' | 'used';
  adminNotes?: string;
  createdAt?: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
};

type LinkedStudentResult = {
  _id?: string;
  student?: {
    name?: string;
    surname?: string;
    email?: string;
  } | null;
  teacherPendingReviewCount?: number;
  hasPendingAnswers?: boolean;
  completedAt?: string;
};

type LinkedExamSummary = {
  _id?: string;
  id?: string;
  title?: string;
  duration?: number;
  createdAt?: string;
  resultsCount: number;
  pendingReviewCount: number;
  completedResultsCount: number;
  latestCompletedAt?: string | null;
  sourceDraftTitles?: string[];
  linkedStudents?: LinkedStudentResult[];
};

type ReviewExamQuestion = {
  _id?: string;
  id?: string;
  sourceDraftTestId?: string | { _id?: string; id?: string };
  sourceTeacherId?: string | { _id?: string; id?: string };
  questionType?: 'text' | 'image';
  content?: string;
  answerType?: 'multiple_choice' | 'open_ended';
  openEndedAnswerType?: 'text' | 'number';
  options?: string[];
  correctAnswer?: string;
};

type ReviewExamDetail = {
  _id?: string;
  id?: string;
  title?: string;
  sourceTeacherIds?: Array<string | { _id?: string; id?: string }>;
  questions?: ReviewExamQuestion[];
};

type ReviewResultAnswer = {
  questionId?: string | { _id?: string; id?: string };
  answer?: string;
  isCorrect?: boolean;
  status?: 'pending' | 'graded' | string;
};

type ReviewResult = {
  _id?: string;
  id?: string;
  student?: LinkedStudentResult['student'];
  answers?: ReviewResultAnswer[];
  teacherPendingReviewCount?: number;
  scorePercentage?: number;
  hasPendingAnswers?: boolean;
  completedAt?: string;
  createdAt?: string;
};

type TeacherExamPanelResponse = {
  drafts: TeacherDraftExam[];
  linkedExams: LinkedExamSummary[];
};

type TeacherLeaveSessionStatus = 'pending' | 'approved' | 'expired' | 'finished' | 'rejected';

type TeacherLeaveSessionReviewData = {
  sessionId: string;
  status: TeacherLeaveSessionStatus;
  createdAt?: string;
  expiresAt?: string;
  resolvedAt?: string | null;
  timeLeftSeconds?: number;
  student?: {
    id?: string;
    name?: string;
    surname?: string;
    email?: string;
  } | null;
  test?: {
    id?: string;
    title?: string;
    startsAt?: string | null;
    duration?: number | null;
  } | null;
};

const createDefaultQuestion = (id: string): DraftQuestion => createDefaultAssessmentQuestion(id);

const resolveEntityId = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'object') {
    const objectValue = value as { _id?: unknown; id?: unknown; toString?: () => string };

    if (objectValue._id !== undefined && objectValue._id !== null) {
      return resolveEntityId(objectValue._id);
    }

    if (objectValue.id !== undefined && objectValue.id !== null) {
      return resolveEntityId(objectValue.id);
    }

    if (typeof objectValue.toString === 'function') {
      return objectValue.toString();
    }
  }

  return String(value);
};

const isNumericOpenEndedQuestion = (question: ReviewExamQuestion) => {
  if (!question || question.answerType !== 'open_ended') {
    return false;
  }

  return question.openEndedAnswerType === 'number';
};

const hasAnswerValue = (value?: string) => Boolean(String(value ?? '').trim());

const isPendingExpertReviewAnswer = (answer: ReviewResultAnswer) => {
  if (!hasAnswerValue(answer?.answer)) {
    return false;
  }

  if (answer.status === 'pending') {
    return true;
  }

  if (answer.status === 'graded' || typeof answer.isCorrect === 'boolean') {
    return false;
  }

  return true;
};

const isQuestionOwnedByTeacher = (
  question: ReviewExamQuestion | null,
  teacherId: string,
  examSourceTeacherIds: Array<string | { _id?: string; id?: string }> = [],
) => {
  if (!teacherId) {
    return false;
  }

  const ownerId = resolveEntityId(question?.sourceTeacherId);
  if (ownerId) {
    return ownerId === resolveEntityId(teacherId);
  }

  const linkedTeacherIds = examSourceTeacherIds.map((value) => resolveEntityId(value)).filter(Boolean);
  return linkedTeacherIds.length <= 1 || linkedTeacherIds.includes(resolveEntityId(teacherId));
};

const getPendingReviewEntries = (
  result: ReviewResult,
  questions: ReviewExamQuestion[] = [],
  teacherId = '',
  examSourceTeacherIds: Array<string | { _id?: string; id?: string }> = [],
) => {
  const questionsById = new Map(
    questions.map((question) => [resolveEntityId(question._id || question.id), question])
  );

  return (result.answers || [])
    .map((answer) => ({
      answer,
      question: questionsById.get(resolveEntityId(answer.questionId)) || null,
    }))
    .filter(({ answer, question }) => {
      if (!isPendingExpertReviewAnswer(answer)) {
        return false;
      }

      if (!question) {
        return isQuestionOwnedByTeacher(null, teacherId, examSourceTeacherIds);
      }

      return question.answerType === 'open_ended'
        && !isNumericOpenEndedQuestion(question)
        && isQuestionOwnedByTeacher(question, teacherId, examSourceTeacherIds);
    });
};

const getPendingAnswerCount = (
  result: ReviewResult,
  questions: ReviewExamQuestion[] = [],
  teacherId = '',
  examSourceTeacherIds: Array<string | { _id?: string; id?: string }> = [],
) => getPendingReviewEntries(result, questions, teacherId, examSourceTeacherIds).length;

const mapStoredQuestionToDraftQuestion = (question: StoredDraftQuestion, index: number): DraftQuestion => {
  const answerType = question.answerType === 'open_ended' ? 'open_ended' : 'multiple_choice';
  const questionType = question.questionType === 'image' ? 'image' : 'text';
  const options = Array.isArray(question.options) && question.options.length > 0
    ? question.options
    : ['', '', '', ''];
  const parsedCorrectAnswer = Number(question.correctAnswer);

  return {
    id: question._id || createAssessmentQuestionId() || `${index + 1}`,
    questionType,
    content: question.content || '',
    answerType,
    imageFile: undefined,
    openEndedAnswerType: question.openEndedAnswerType === 'number' ? 'number' : 'text',
    openEndedNumericAnswer: answerType === 'open_ended' && question.openEndedAnswerType === 'number'
      ? String(question.correctAnswer || '')
      : '',
    options,
    correctAnswer: answerType === 'multiple_choice' && Number.isFinite(parsedCorrectAnswer)
      ? parsedCorrectAnswer
      : 0,
  };
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Tarix yoxdur';
  }

  const parsedDate = new Date(value);

  if (!Number.isFinite(parsedDate.getTime())) {
    return 'Tarix yoxdur';
  }

  return new Intl.DateTimeFormat('az-AZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'Tarix yoxdur';
  }

  const parsedDate = new Date(value);

  if (!Number.isFinite(parsedDate.getTime())) {
    return 'Tarix yoxdur';
  }

  return new Intl.DateTimeFormat('az-AZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate);
};

const draftStatusMeta: Record<string, { label: string; className: string }> = {
  draft: {
    label: 'Layihə',
    className: 'bg-slate-100 text-slate-600',
  },
  submitted_to_admin: {
    label: 'Adminə göndərildi',
    className: 'bg-[#FFF3CD] text-[#A87A1F]',
  },
  approved: {
    label: 'Təsdiq olundu',
    className: 'bg-sky-100 text-sky-700',
  },
  rejected: {
    label: 'Rədd edildi',
    className: 'bg-rose-100 text-rose-700',
  },
  used: {
    label: 'İstifadə olundu',
    className: 'bg-emerald-100 text-emerald-700',
  },
};

const leaveSessionStatusMeta: Record<TeacherLeaveSessionStatus, { label: string; className: string }> = {
  pending: {
    label: 'Qərar gözləyir',
    className: 'bg-amber-100 text-amber-700',
  },
  approved: {
    label: 'Davam edir',
    className: 'bg-emerald-100 text-emerald-700',
  },
  expired: {
    label: 'Müddəti bitib',
    className: 'bg-slate-200 text-slate-700',
  },
  finished: {
    label: 'Bağlanıb',
    className: 'bg-slate-200 text-slate-700',
  },
  rejected: {
    label: 'Dayandırılıb',
    className: 'bg-rose-100 text-rose-700',
  },
};

const normalizeManualCodeInput = (value: string) => value.trim().replace(/\s+/g, '').toUpperCase();

export default function TeacherExamPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [panelData, setPanelData] = useState<TeacherExamPanelResponse>({ drafts: [], linkedExams: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showAllDrafts, setShowAllDrafts] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingDraftWorkflowStatus, setEditingDraftWorkflowStatus] = useState<TeacherDraftExam['workflowStatus'] | null>(null);
  const [selectedReviewExamId, setSelectedReviewExamId] = useState<string | null>(null);
  const [selectedReviewResultId, setSelectedReviewResultId] = useState<string | null>(null);
  const [reviewExam, setReviewExam] = useState<ReviewExamDetail | null>(null);
  const [reviewResults, setReviewResults] = useState<ReviewResult[]>([]);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [evaluatingQuestionId, setEvaluatingQuestionId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<DraftQuestion[]>([createDefaultQuestion('1')]);
  const [isResolvingQr, setIsResolvingQr] = useState(false);
  const [qrScannerError, setQrScannerError] = useState<string | null>(null);
  const [qrScannerMessage, setQrScannerMessage] = useState('');
  const [manualQrValue, setManualQrValue] = useState('');
  const [scannedLeaveSession, setScannedLeaveSession] = useState<TeacherLeaveSessionReviewData | null>(null);
  const [leaveDecisionAction, setLeaveDecisionAction] = useState<'approve' | 'reject' | null>(null);
  const isResolvingQrRef = useRef(false);
  const lastResolvedCodeRef = useRef('');
  const isQrTabAvailable = user?.role === 'teacher';

  const activeTab = useMemo<TeacherExamPanelTabKey>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'create' || tab === 'review' || tab === 'results' || tab === 'qr') {
      return tab;
    }

    return 'drafts';
  }, [searchParams]);

  const loadPanelData = async () => {
    const token = localStorage.getItem('rim_auth_token');

    if (!token) {
      navigate('/login');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/tests/teacher-exams/panel`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await response.json();

    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.message || 'Müəllim imtahan paneli yüklənmədi');
    }

    setPanelData(payload.data || { drafts: [], linkedExams: [] });
  };

  useEffect(() => {
    const fetchPanel = async () => {
      try {
        await loadPanelData();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Müəllim imtahan paneli yüklənmədi';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPanel();
  }, [navigate]);

  const metrics = useMemo(() => {
    const submittedDrafts = panelData.drafts.filter((draft) => draft.workflowStatus === 'submitted_to_admin').length;
    const pendingLinkedReviews = panelData.linkedExams.reduce((sum, exam) => sum + Number(exam.pendingReviewCount || 0), 0);
    const usedDrafts = panelData.drafts.filter((draft) => draft.workflowStatus === 'used').length;

    return {
      totalDrafts: panelData.drafts.length,
      submittedDrafts,
      pendingLinkedReviews,
      usedDrafts,
    };
  }, [panelData]);

  const filteredDrafts = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('az');
    return panelData.drafts.filter((draft) => !query || String(draft.title || '').toLocaleLowerCase('az').includes(query));
  }, [panelData.drafts, searchQuery]);

  const reviewLinkedExams = useMemo(
    () => panelData.linkedExams.filter((exam) => exam.pendingReviewCount > 0),
    [panelData.linkedExams]
  );

  const pendingReviewResults = useMemo(
    () => reviewResults
      .filter((result) => getPendingAnswerCount(result, reviewExam?.questions || [], user?.id || '', reviewExam?.sourceTeacherIds || []) > 0)
      .sort((left, right) => new Date(right.completedAt || right.createdAt || 0).getTime() - new Date(left.completedAt || left.createdAt || 0).getTime()),
    [reviewExam?.questions, reviewExam?.sourceTeacherIds, reviewResults, user?.id]
  );

  const selectedReviewResult = useMemo(
    () => reviewResults.find((result) => resolveEntityId(result._id || result.id) === selectedReviewResultId) || null,
    [reviewResults, selectedReviewResultId]
  );

  const selectedReviewPendingAnswers = useMemo(() => {
    if (!selectedReviewResult || !reviewExam?.questions) {
      return [];
    }

    return getPendingReviewEntries(selectedReviewResult, reviewExam.questions, user?.id || '', reviewExam.sourceTeacherIds || []);
  }, [reviewExam?.questions, reviewExam?.sourceTeacherIds, selectedReviewResult, user?.id]);

  const resultExams = useMemo(
    () => panelData.linkedExams.filter((exam) => exam.resultsCount > 0),
    [panelData.linkedExams]
  );

  const scannedLeaveSessionStatusMeta = scannedLeaveSession
    ? leaveSessionStatusMeta[scannedLeaveSession.status] || leaveSessionStatusMeta.pending
    : null;
  const scannedStudentFullName = [scannedLeaveSession?.student?.name, scannedLeaveSession?.student?.surname]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(' ');

  const handleTabChange = (tab: TeacherExamPanelTabKey) => {
    const nextParams = new URLSearchParams(searchParams);

    if (tab === 'drafts') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', tab);
    }

    setSearchParams(nextParams);
  };

  const handleResolveScannedQr = async (rawValue: string) => {
    const token = localStorage.getItem('rim_auth_token');

    if (!token) {
      navigate('/login');
      return;
    }

    const normalizedManualCode = normalizeManualCodeInput(rawValue);

    if (!normalizedManualCode) {
      setQrScannerError(t('common.error'));
      return;
    }

    const scanKey = normalizedManualCode;

    if (!scanKey || isResolvingQrRef.current || lastResolvedCodeRef.current === scanKey) {
      return;
    }

    lastResolvedCodeRef.current = scanKey;
    isResolvingQrRef.current = true;
    setIsResolvingQr(true);
    setQrScannerError(null);
    setQrScannerMessage('Manual kod yoxlanılır...');

    try {
      const response = await fetch(`${API_BASE_URL}/tests/leave-sessions/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ manualCode: normalizedManualCode }),
      });
      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Manual kod yoxlanmadı');
      }

      const nextSession = payload?.data as TeacherLeaveSessionReviewData | null;

      setScannedLeaveSession(nextSession?.sessionId ? nextSession : null);
      setQrScannerMessage(payload?.message || 'Manual kod tapıldı');
      setManualQrValue(normalizedManualCode);

      if (nextSession?.status === 'pending' || nextSession?.status === 'approved') {
        toast.success(payload?.message || 'Manual kod tapıldı');
      } else {
        toast.error(payload?.message || 'Leave session aktiv deyil');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Manual kod yoxlanmadı';
      setQrScannerError(message);
      setQrScannerMessage('');
      toast.error(message);
    } finally {
      isResolvingQrRef.current = false;
      setIsResolvingQr(false);
      window.setTimeout(() => {
        if (lastResolvedCodeRef.current === scanKey) {
          lastResolvedCodeRef.current = '';
        }
      }, 2000);
    }
  };

  const handleLeaveSessionDecision = async (action: 'approve' | 'reject') => {
    const token = localStorage.getItem('rim_auth_token');

    if (!token) {
      navigate('/login');
      return;
    }

    if (!scannedLeaveSession?.sessionId) {
      return;
    }

    setLeaveDecisionAction(action);
    setQrScannerError(null);
    setQrScannerMessage(action === 'approve' ? 'Davam qərarı göndərilir...' : 'Dayandırma qərarı göndərilir...');

    try {
      const response = await fetch(`${API_BASE_URL}/tests/leave-sessions/${scannedLeaveSession.sessionId}/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Qərar qeydə alınmadı');
      }

      const nextSession = payload?.data as TeacherLeaveSessionReviewData | null;

      setScannedLeaveSession(nextSession?.sessionId ? nextSession : scannedLeaveSession);
      setQrScannerMessage(payload?.message || (action === 'approve' ? 'Leave session təsdiqləndi' : 'Leave session rədd edildi'));
      toast.success(payload?.message || (action === 'approve' ? 'Leave session təsdiqləndi' : 'Leave session rədd edildi'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Qərar qeydə alınmadı';
      setQrScannerError(message);
      setQrScannerMessage('');
      toast.error(message);
    } finally {
      setLeaveDecisionAction(null);
    }
  };

  const loadReviewExamData = async (examId: string) => {
    const token = localStorage.getItem('rim_auth_token');

    if (!token) {
      navigate('/login');
      return;
    }

    setIsReviewLoading(true);

    try {
      const [examResponse, resultsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/tests/${examId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/tests/${examId}/results`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const examPayload = await examResponse.json();
      const resultsPayload = await resultsResponse.json();

      if (!examResponse.ok || examPayload?.success === false) {
        throw new Error(examPayload?.message || 'İmtahan detalları yüklənmədi');
      }

      if (!resultsResponse.ok || resultsPayload?.success === false) {
        throw new Error(resultsPayload?.message || 'Tələbə nəticələri yüklənmədi');
      }

      setReviewExam(examPayload.data || null);
      setReviewResults(resultsPayload.data || []);
      setSelectedReviewExamId(examId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Yoxlama paneli yüklənmədi';
      toast.error(message);
    } finally {
      setIsReviewLoading(false);
    }
  };

  const updateQuestion = (id: string, field: keyof DraftQuestion, value: DraftQuestion[keyof DraftQuestion]) => {
    setQuestions((currentQuestions) => currentQuestions.map((question) => (
      question.id === id ? { ...question, [field]: value } : question
    )));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions((currentQuestions) => currentQuestions.map((question) => (
      question.id === questionId
        ? {
            ...question,
            options: question.options.map((option, index) => index === optionIndex ? value : option),
          }
        : question
    )));
  };

  const addQuestion = () => setQuestions((currentQuestions) => [...currentQuestions, createDefaultQuestion(createAssessmentQuestionId())]);

  const removeQuestion = (questionId: string) => {
    if (questions.length === 1) {
      toast.error('Ən azı bir sual olmalıdır');
      return;
    }

    setQuestions((currentQuestions) => currentQuestions.filter((question) => question.id !== questionId));
  };

  const resetDraftForm = () => {
    setEditingDraftId(null);
    setEditingDraftWorkflowStatus(null);
    setTitle('');
    setQuestions([createDefaultQuestion('1')]);
  };

  const handleEditDraft = (draft: TeacherDraftExam) => {
    const draftId = draft._id || draft.id;

    if (!draftId) {
      toast.error(t('common.not_found'));
      return;
    }

    setEditingDraftId(draftId);
    setEditingDraftWorkflowStatus(draft.workflowStatus || 'draft');
    setTitle(draft.title || '');
    setQuestions(
      Array.isArray(draft.questions) && draft.questions.length > 0
        ? draft.questions.map(mapStoredQuestionToDraftQuestion)
        : [createDefaultQuestion('1')]
    );
    handleTabChange('create');
  };

  const handleOpenReviewExam = async (examId: string) => {
    setSelectedReviewResultId(null);
    await loadReviewExamData(examId);
  };

  const handleBackToReviewExamList = () => {
    setSelectedReviewExamId(null);
    setSelectedReviewResultId(null);
    setReviewExam(null);
    setReviewResults([]);
  };

  const handleBackToStudentList = () => {
    setSelectedReviewResultId(null);
  };

  const handleEvaluateReviewAnswer = async (resultId: string, questionId: string, isCorrect: boolean) => {
    const token = localStorage.getItem('rim_auth_token');

    if (!token) {
      navigate('/login');
      return;
    }

    setEvaluatingQuestionId(questionId);

    try {
      const response = await fetch(`${API_BASE_URL}/tests/results/${resultId}/evaluate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          evaluations: [{ questionId, isCorrect }],
        }),
      });
      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t('common.error'));
      }

      toast.success(t('common.success'));

      if (selectedReviewExamId) {
        await loadReviewExamData(selectedReviewExamId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      toast.error(message);
    } finally {
      setEvaluatingQuestionId(null);
    }
  };

  const handleSaveDraft = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error(t('common.error'));
      return;
    }

    const questionError = validateAssessmentQuestions(questions);
    if (questionError) {
      toast.error(questionError);
      return;
    }

    setIsSavingDraft(true);

    try {
      const token = localStorage.getItem('rim_auth_token');
      const isResubmittingEditedDraft = Boolean(editingDraftId && editingDraftWorkflowStatus === 'submitted_to_admin');
      const formattedQuestions = await formatAssessmentQuestionsForApi(questions, token);
      const response = await fetch(`${API_BASE_URL}/tests/teacher-exams${editingDraftId ? `/${editingDraftId}` : ''}`, {
        method: editingDraftId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          questions: formattedQuestions,
        }),
      });
      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || (editingDraftId ? t('common.error') : t('common.error')));
      }

      const savedDraftId = String(payload?.data?._id || payload?.data?.id || editingDraftId || '');

      if (isResubmittingEditedDraft && savedDraftId) {
        const submitResponse = await fetch(`${API_BASE_URL}/tests/teacher-exams/${savedDraftId}/submit`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const submitPayload = await submitResponse.json();

        if (!submitResponse.ok || submitPayload?.success === false) {
          throw new Error(submitPayload?.message || t('common.error'));
        }
      }

      toast.success(
        isResubmittingEditedDraft
          ? t('common.success')
          : editingDraftId
            ? t('common.success')
            : t('common.success')
      );
      resetDraftForm();
      await loadPanelData();
      handleTabChange('drafts');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      toast.error(message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmitDraft = async (draftId: string) => {
    const token = localStorage.getItem('rim_auth_token');

    try {
      const response = await fetch(`${API_BASE_URL}/tests/teacher-exams/${draftId}/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t('common.error'));
      }

      toast.success(t('common.success'));
      await loadPanelData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      toast.error(message);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!window.confirm(t('common.confirm'))) {
      return;
    }

    const token = localStorage.getItem('rim_auth_token');

    try {
      const response = await fetch(`${API_BASE_URL}/tests/teacher-exams/${draftId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t('common.error'));
      }

      if (editingDraftId === draftId) {
        resetDraftForm();
      }

      toast.success(t('common.success'));
      await loadPanelData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      toast.error(message);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen pt-24 text-center text-slate-600">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900">
      <div className="border-b border-slate-200/80 bg-white/85 pt-[var(--site-header-height)] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 py-4">
            {[
              { key: 'drafts', label: t('exam.drafts'), count: panelData.drafts.length },
              { key: 'create', label: t('exam.create') },
              { key: 'review', label: t('exam.review'), count: reviewLinkedExams.length },
              { key: 'results', label: t('exam.results'), count: resultExams.length },
              ...(isQrTabAvailable ? [{ key: 'qr', label: t('exam.session_code') }] : []),
            ].map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <Button
                  key={tab.key}
                  type="button"
                  variant="ghost"
                  onClick={() => handleTabChange(tab.key as TeacherExamPanelTabKey)}
                  className={[
                    'h-10 shrink-0 rounded-xl border px-4 text-sm font-semibold transition-all',
                    isActive
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#A87A1F] shadow-sm hover:bg-[#D4AF37]/15'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
                  ].join(' ')}
                >
                  {tab.label}
                  {typeof tab.count === 'number' ? (
                    <span className={[
                      'ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold',
                      isActive ? 'bg-[#D4AF37]/15 text-[#A87A1F]' : 'bg-slate-100 text-slate-500',
                    ].join(' ')}>
                      {tab.count}
                    </span>
                  ) : null}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="absolute -right-20 top-0 hidden h-56 w-56 rounded-full bg-[#D4AF37]/10 blur-3xl sm:block" />
          <div className="absolute -left-16 bottom-0 hidden h-40 w-40 rounded-full bg-sky-100/70 blur-3xl sm:block" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#A87A1F]">
                <Sparkles className="h-3.5 w-3.5" />
                {t('teacher.panel')}
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 lg:text-5xl">
                {t('teacher.draft_exams')}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 lg:text-base">
                {t('teacher.panel_description')}
              </p>
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('common.search')}
                className="h-12 rounded-2xl border-slate-200 bg-white pl-11 text-slate-700 shadow-sm placeholder:text-slate-400"
              />
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { title: t('metrics.draft_exams'), value: metrics.totalDrafts, icon: ClipboardList, tone: 'from-[#FFF6D8] via-white to-white' },
            { title: t('metrics.submitted_to_admin'), value: metrics.submittedDrafts, icon: Send, tone: 'from-[#EAF4FF] via-white to-white' },
            { title: t('metrics.pending_reviews'), value: metrics.pendingLinkedReviews, icon: TimerReset, tone: 'from-[#FFF2E2] via-white to-white' },
            { title: t('metrics.used_exams'), value: metrics.usedDrafts, icon: CheckCheck, tone: 'from-[#EEF8F1] via-white to-white' },
          ].map((metric) => {
            const MetricIcon = metric.icon;

            return (
              <div key={metric.title} className={`rounded-[1.75rem] border border-white/80 bg-gradient-to-br ${metric.tone} p-5 shadow-sm`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{metric.title}</p>
                    <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{metric.value}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-white/90 text-[#A87A1F] shadow-sm">
                    <MetricIcon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {activeTab === 'drafts' && (
          <section className="mt-8 rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A87A1F]">{t('teacher.my_exams')}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{t('teacher.created_drafts')}</h2>
              </div>
              <Button type="button" onClick={() => {
                resetDraftForm();
                handleTabChange('create');
              }} className="w-full rounded-2xl bg-[#D4AF37] text-slate-950 hover:bg-[#B88A1B] sm:w-auto">
                <Plus className="h-4 w-4" />
                {t('exam.create')}
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {(showAllDrafts ? filteredDrafts : filteredDrafts.slice(0, 4)).map((draft) => {
                const status = draftStatusMeta[draft.workflowStatus || 'draft'] || draftStatusMeta.draft;
                const draftId = draft._id || draft.id || '';
                const canSubmit = (draft.workflowStatus || 'draft') === 'draft' || draft.workflowStatus === 'rejected';
                const canDelete = canSubmit;
                const canEdit = canSubmit || draft.workflowStatus === 'submitted_to_admin';

                return (
                  <article key={draftId} className="rounded-[1.75rem] border border-slate-200/80 bg-[#FCFCFD] p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>
                          {status.label}
                        </span>
                        <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900">{draft.title || t('common.untitled')}</h3>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-[#A87A1F]" />
                            {(draft.questions || []).length} {t('common.question_count')}
                          </span>
                          <span>{formatDate(draft.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:min-w-[180px]">
                        {canEdit && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleEditDraft(draft)}
                            className="rounded-2xl border-slate-200 text-slate-700 hover:border-[#D4AF37]/40 hover:bg-[#FFF8E1] hover:text-slate-900"
                          >
                            <Pencil className="h-4 w-4" />
                            {t('common.edit')}
                          </Button>
                        )}
                        <Button
                          type="button"
                          disabled={!canSubmit}
                          onClick={() => draftId && handleSubmitDraft(draftId)}
                          className="rounded-2xl bg-[#D4AF37] text-slate-950 hover:bg-[#B88A1B] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Send className="h-4 w-4" />
                          {t('common.submit')}
                        </Button>
                        {canDelete && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => draftId && handleDeleteDraft(draftId)}
                            className="rounded-2xl border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('common.delete')}
                          </Button>
                        )}
                      </div>
                    </div>

                    {draft.adminNotes ? (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {draft.adminNotes}
                      </div>
                    ) : null}
                  </article>
                );
              })}

              {filteredDrafts.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center xl:col-span-2">
                  <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-4 text-xl font-black tracking-tight text-slate-900">{t('teacher.no_drafts')}</h3>
                  <p className="mt-2 text-sm text-slate-500">{t('teacher.create_first_hint')}</p>
                </div>
              ) : null}
              {filteredDrafts.length > 4 ? (
                <div className="xl:col-span-2 flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllDrafts((prev) => !prev)}
                    className="text-sm font-semibold text-[#A87A1F] hover:underline"
                  >
                    {showAllDrafts
                      ? t('common.show_less')
                      : t('common.show_more', { count: filteredDrafts.length - 4 })}
                  </button>
                </div>
              ) : null}            </div>
          </section>
        )}

        {activeTab === 'create' && (
          <section className="mt-8 rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-sm lg:p-8">
            <div className="border-b border-slate-100 pb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A87A1F]">{editingDraftId ? t('exam.edit') : t('exam.create')}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{editingDraftId ? t('exam.update_exam') : t('exam.new_exam')}</h2>
              <p className="mt-2 text-sm text-slate-600">{t('exam.create_description')}</p>
            </div>

            <form onSubmit={handleSaveDraft} className="mt-6 space-y-6">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">{t('exam.title')}</label>
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('exam.title_placeholder')} className="rounded-2xl border-slate-200 bg-white" />
                </div>
              </div>

              <TeacherAssessmentQuestionBuilder
                questions={questions}
                setQuestions={setQuestions}
                updateQuestion={updateQuestion}
                updateOption={updateOption}
                removeQuestion={removeQuestion}
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" onClick={addQuestion} className="rounded-2xl border-slate-200">
                  <Plus className="h-4 w-4" />
                  {t('exam.add_question')}
                </Button>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {editingDraftId ? (
                    <Button type="button" variant="outline" onClick={resetDraftForm} className="rounded-2xl border-slate-200">
                      {t('common.cancel')}
                    </Button>
                  ) : null}
                  <Button type="submit" disabled={isSavingDraft} className="rounded-2xl bg-[#D4AF37] text-slate-950 hover:bg-[#B88A1B] disabled:cursor-not-allowed disabled:opacity-60">
                    {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {editingDraftId ? t('common.save') : t('common.create')}
                  </Button>
                </div>
              </div>
            </form>
          </section>
        )}

        {activeTab === 'review' && (
          <section className="mt-8 rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-sm">
            {!selectedReviewExamId ? (
              <>
                <div className="border-b border-slate-100 pb-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A87A1F]">{t('teacher.review_exams')}</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{t('teacher.pending_expertise')}</h2>
                  <p className="mt-2 text-sm text-slate-500">{t('teacher.review_description')}</p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {reviewLinkedExams.map((exam) => (
                    <article key={exam._id || exam.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-xl font-black tracking-tight text-slate-900">{exam.title}</h3>
                          <p className="mt-2 text-sm text-slate-500">{t('teacher.pending_count', { count: exam.pendingReviewCount })}</p>
                          {exam.sourceDraftTitles?.length ? (
                            <p className="mt-2 text-xs text-slate-400">{t('teacher.source')}: {exam.sourceDraftTitles.join(', ')}</p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            const examId = exam._id || exam.id;
                            if (examId) {
                              void handleOpenReviewExam(examId);
                            }
                          }}
                          className="rounded-2xl bg-[#D4AF37] text-slate-950 hover:bg-[#B88A1B]"
                        >
                          <Users className="h-4 w-4" />
                          {t('teacher.open_students')}
                        </Button>
                      </div>
                    </article>
                  ))}

                  {reviewLinkedExams.length === 0 ? (
                    <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center xl:col-span-2">
                      <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
                      <h3 className="mt-4 text-xl font-black tracking-tight text-slate-900">{t('teacher.no_reviews')}</h3>
                      <p className="mt-2 text-sm text-slate-500">{t('teacher.no_reviews_description')}</p>
                    </div>
                  ) : null}
                </div>
              </>
            ) : selectedReviewResult ? (
              <>
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <button type="button" onClick={handleBackToStudentList} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
                      <ArrowLeft className="h-4 w-4" />
                      {t('common.back_to_list')}
                    </button>
                    <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#A87A1F]">{t('teacher.expertise_questions')}</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{selectedReviewResult.student?.name} {selectedReviewResult.student?.surname}</h2>
                    <p className="mt-2 text-sm text-slate-500">{t('teacher.open_questions_hint')}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {selectedReviewPendingAnswers.map(({ answer, question }, index) => {
                    const questionId = resolveEntityId(question?._id || question?.id || answer.questionId);
                    const resultId = resolveEntityId(selectedReviewResult._id || selectedReviewResult.id);

                    return (
                      <article key={`${resultId}-${questionId}`} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                              {t('common.question')} {index + 1}
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{t('common.question')}</p>
                              {question?.questionType === 'image' ? (
                                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                  <img src={question.content} alt={`Sual ${index + 1}`} className="max-h-[420px] w-full object-contain" />
                                </div>
                              ) : (
                                <p className="mt-3 text-sm leading-6 text-slate-800">{question?.content || t('teacher.missing_question_text')}</p>
                              )}
                            </div>

                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{t('teacher.student_answer')}</p>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">{answer.answer || t('teacher.no_answer')}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            type="button"
                            disabled={evaluatingQuestionId === questionId}
                            onClick={() => void handleEvaluateReviewAnswer(resultId, questionId, true)}
                            className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <CheckCircle className="h-4 w-4" />
                            {t('common.correct')}
                          </Button>
                          <Button
                            type="button"
                            disabled={evaluatingQuestionId === questionId}
                            onClick={() => void handleEvaluateReviewAnswer(resultId, questionId, false)}
                            className="rounded-2xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                          >
                            <XCircle className="h-4 w-4" />
                            {t('common.incorrect')}
                          </Button>
                        </div>
                      </article>
                    );
                  })}

                  {selectedReviewPendingAnswers.length === 0 ? (
                    <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center">
                      <CheckCheck className="mx-auto h-10 w-10 text-slate-300" />
                      <h3 className="mt-4 text-xl font-black tracking-tight text-slate-900">{t('teacher.expertise_completed')}</h3>
                      <p className="mt-2 text-sm text-slate-500">{t('teacher.no_pending_questions')}</p>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <button type="button" onClick={handleBackToReviewExamList} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
                      <ArrowLeft className="h-4 w-4" />
                      {t('common.back_to_list')}
                    </button>
                    <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#A87A1F]">{t('teacher.student_list')}</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{reviewExam?.title || t('exam.exam')}</h2>
                    <p className="mt-2 text-sm text-slate-500">{t('teacher.select_student_hint')}</p>
                  </div>
                </div>

                {isReviewLoading ? (
                  <div className="py-16 text-center text-slate-500">{t('common.loading')}</div>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {pendingReviewResults.map((result) => {
                      const resultId = resolveEntityId(result._id || result.id);

                      return (
                        <article key={resultId} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-xl font-black tracking-tight text-slate-900">{result.student?.name} {result.student?.surname}</h3>
                              <p className="mt-2 text-sm text-slate-500">{t('teacher.exam_panel.expertise_questions_pending', { count: getPendingAnswerCount(result, reviewExam?.questions || [], user?.id || '', reviewExam?.sourceTeacherIds || []) })}</p>
                              <p className="mt-1 text-xs text-slate-400">{result.student?.email || t('teacher.exam_panel.no_email')}</p>
                            </div>
                            <Button
                              type="button"
                              onClick={() => setSelectedReviewResultId(resultId)}
                              className="rounded-2xl bg-[#D4AF37] text-slate-950 hover:bg-[#B88A1B]"
                            >
                              <FileText className="h-4 w-4" />
                              Cavabları aç
                            </Button>
                          </div>
                        </article>
                      );
                    })}

                    {pendingReviewResults.length === 0 ? (
                      <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center xl:col-span-2">
                        <Users className="mx-auto h-10 w-10 text-slate-300" />
                        <h3 className="mt-4 text-xl font-black tracking-tight text-slate-900">{t('teacher.exam_panel.no_pending_students')}</h3>
                        <p className="mt-2 text-sm text-slate-500">{t('teacher.exam_panel.all_questions_checked')}</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === 'results' && (
          <section className="mt-8 rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A87A1F]">{t('teacher.exam_panel.results_label')}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{t('teacher.exam_panel.used_exams')}</h2>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {resultExams.map((exam) => (
                <article key={exam._id || exam.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-slate-900">{exam.title}</h3>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <FolderKanban className="h-4 w-4 text-[#A87A1F]" />
                          {exam.resultsCount} nəticə
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCheck className="h-4 w-4 text-[#A87A1F]" />
                          {exam.completedResultsCount} tamamlanmış baxış
                        </span>
                        <span>{formatDate(exam.latestCompletedAt || exam.createdAt)}</span>
                      </div>
                      {exam.sourceDraftTitles?.length ? (
                        <p className="mt-2 text-xs text-slate-400">{t('teacher.exam_panel.source')}: {exam.sourceDraftTitles.join(', ')}</p>
                      ) : null}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/teacher/tests/${exam._id || exam.id}/results`)}
                      className="rounded-2xl border-slate-200 bg-white text-slate-700 hover:border-[#D4AF37]/40 hover:bg-[#FFF8E1] hover:text-slate-900"
                    >
                      Nəticələri aç
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </article>
              ))}

              {resultExams.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center xl:col-span-2">
                  <FileText className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-4 text-xl font-black tracking-tight text-slate-900">{t('teacher.exam_panel.no_result_visible')}</h3>
                  <p className="mt-2 text-sm text-slate-500">{t('teacher.exam_panel.results_appear_desc')}</p>
                </div>
              ) : null}
            </div>
          </section>
        )}

        {activeTab === 'qr' && (
          <section className="mt-8 rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A87A1F]">Sessiya kodu</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{t('teacher.exam_panel.leave_session_decision')}</h2>
              <p className="mt-2 text-sm text-slate-500">{t('teacher.exam_panel.leave_session_desc')}</p>
            </div>

            {!isQrTabAvailable ? (
              <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center">
                <XCircle className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-4 text-xl font-black tracking-tight text-slate-900">{t('teacher.exam_panel.teacher_only')}</h3>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(320px,1.15fr)]">
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    Manual kod daxil edilən kimi leave session tapılır, amma tələbə yalnız aşağıdakı son qərardan sonra reaksiya verir.
                  </div>

                  {qrScannerError ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      {qrScannerError}
                    </div>
                  ) : null}

                  {qrScannerMessage ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                      {qrScannerMessage}
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-3 text-sm text-slate-500">
                    <p>{t('teacher.exam_panel.step_1')}</p>
                    <p>{t('teacher.exam_panel.step_2')}</p>
                    <p>{t('teacher.exam_panel.step_3')}</p>
                  </div>

                  <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-700">{t('teacher.exam_panel.enter_backup_code')}</p>
                    <Input
                      value={manualQrValue}
                      onChange={(event) => setManualQrValue(event.target.value.toUpperCase())}
                      placeholder="Məsələn: ABC-9K2"
                      className="h-11 rounded-xl border-slate-200"
                    />
                    <Button
                      type="button"
                      disabled={isResolvingQr || !manualQrValue.trim()}
                      onClick={() => {
                        void handleResolveScannedQr(manualQrValue);
                      }}
                      className="w-full rounded-2xl bg-[#D4AF37] text-slate-950 hover:bg-[#B88A1B] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isResolvingQr ? 'Kod yoxlanılır...' : 'Kodu yoxla'}
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isResolvingQr}
                    onClick={() => {
                      lastResolvedCodeRef.current = '';
                      setQrScannerError(null);
                      setQrScannerMessage('');
                      setScannedLeaveSession(null);
                      setManualQrValue('');
                    }}
                    className="mt-3 w-full rounded-2xl border-slate-200 bg-white text-slate-700 hover:border-[#D4AF37]/40 hover:bg-[#FFF8E1] hover:text-slate-900"
                  >
                    Təmizlə
                  </Button>
                </div>

                {scannedLeaveSession ? (
                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Leave session preview</p>
                        <h3 className="mt-2 text-lg font-black text-slate-900">{scannedStudentFullName || t('teacher.exam_panel.no_student_info')}</h3>
                        <p className="mt-1 text-sm text-slate-500">{scannedLeaveSession.test?.title || t('teacher.exam_panel.no_exam_info')}</p>
                      </div>
                      {scannedLeaveSessionStatusMeta ? (
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${scannedLeaveSessionStatusMeta.className}`}>
                          {scannedLeaveSessionStatusMeta.label}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Ad</div>
                        <div className="mt-1 text-sm font-semibold text-slate-700">{scannedLeaveSession.student?.name || '-'}</div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Soyad</div>
                        <div className="mt-1 text-sm font-semibold text-slate-700">{scannedLeaveSession.student?.surname || '-'}</div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">İmtahan</div>
                        <div className="mt-1 text-sm font-semibold text-slate-700">{scannedLeaveSession.test?.title || '-'}</div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{t('teacher.exam_panel.session_time')}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-700">{formatDateTime(scannedLeaveSession.createdAt)}</div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 sm:col-span-2">
                        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Sessiya statusu</div>
                        <div className="mt-1 text-sm font-semibold text-slate-700">{scannedLeaveSessionStatusMeta?.label || scannedLeaveSession.status}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        disabled={leaveDecisionAction !== null || scannedLeaveSession.status !== 'pending'}
                        onClick={() => {
                          void handleLeaveSessionDecision('approve');
                        }}
                        className="w-full rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {leaveDecisionAction === 'approve' ? 'Davam etdirilir...' : 'Davam et'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={leaveDecisionAction !== null || scannedLeaveSession.status !== 'pending'}
                        onClick={() => {
                          void handleLeaveSessionDecision('reject');
                        }}
                        className="w-full rounded-2xl border-rose-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {leaveDecisionAction === 'reject' ? 'Dayandırılır...' : 'İmtahanı dayandır'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center">
                    <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
                    <h3 className="mt-4 text-xl font-black tracking-tight text-slate-900">{t('teacher.exam_panel.preview_pending')}</h3>
                    <p className="mt-2 text-sm text-slate-500">{t('teacher.exam_panel.preview_desc')}</p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}