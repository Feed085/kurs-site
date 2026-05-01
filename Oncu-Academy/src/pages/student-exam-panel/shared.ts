import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  KeyRound,
  Loader2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { API_BASE_URL } from '@/services/publicApi';

export type TabKey = 'exams' | 'results' | 'keys';

export type PanelTab = {
  key: TabKey;
  label: string;
  icon: LucideIcon;
  path: string;
};

export type PanelInstructor = {
  name?: string;
  surname?: string;
  avatar?: string;
};

export type PanelCourse = {
  _id?: string;
  id?: string;
  title?: string;
  category?: string;
  image?: string;
  instructor?: PanelInstructor | null;
};

export type PanelStats = {
  activeCoursesCount?: number;
  assignedTestsCount?: number;
  completedTestsCount?: number;
  adminApprovedAssignedTestsCount?: number;
  adminApprovedCompletedTestsCount?: number;
  certificatesCount?: number;
};

export type PanelTestSummary = {
  _id?: string;
  id?: string;
  title?: string;
  type?: 'course' | 'teacher_draft' | 'admin_exam' | string;
  course?: PanelCourse | null;
  instructor?: PanelInstructor | null;
  duration?: number;
  allowRetake?: boolean;
  hasAttempted?: boolean;
  attemptCount?: number;
  latestCompletedAt?: string | null;
  createdAt?: string;
  startsAt?: string | null;
  isStudentVisible?: boolean;
  hasAccessCode?: boolean;
  isAdminAssigned?: boolean;
};

export type PanelResultAnswer = {
  questionId?: string;
  answer?: string;
  isCorrect?: boolean;
  status?: 'graded' | 'pending' | string;
};

export type PanelResult = {
  _id?: string;
  id?: string;
  test?: PanelTestSummary | null;
  answers?: PanelResultAnswer[];
  scorePercentage?: number;
  hasPendingAnswers?: boolean;
  completedAt?: string;
  createdAt?: string;
};

export type PanelQuestion = {
  _id?: string;
  id?: string;
  questionType?: 'text' | 'image';
  content?: string;
  answerType?: 'multiple_choice' | 'open_ended';
  openEndedAnswerType?: 'text' | 'number';
  options?: string[];
  correctAnswer?: string | null;
};

export type PanelTestDetail = {
  _id?: string;
  id?: string;
  title?: string;
  type?: 'course' | 'teacher_draft' | 'admin_exam' | string;
  course?: PanelCourse | null;
  duration?: number;
  allowRetake?: boolean;
  questions?: PanelQuestion[];
  questionCount?: number;
  startsAt?: string | null;
  isStudentVisible?: boolean;
  hasAccessCode?: boolean;
  accessGranted?: boolean;
  accessStatus?: {
    isAssigned?: boolean;
    isVisible?: boolean;
    startsAt?: string | null;
    hasStarted?: boolean;
    canStart?: boolean;
    requiresAccessCode?: boolean;
  };
};

export type PanelData = {
  id?: string;
  name?: string;
  surname?: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  educationLevel?: string;
  assignedTests?: PanelTestSummary[];
  activeCourses?: PanelCourse[];
  stats?: PanelStats;
};

export const studentExamPanelTabs: PanelTab[] = [
  {
    key: 'exams',
    label: '📋 İmtahanlarım',
    icon: ClipboardList,
    path: '/exam-panel',
  },
  {
    key: 'results',
    label: '📊 Nəticələrim',
    icon: BarChart3,
    path: '/exam-panel/results',
  },
  {
    key: 'keys',
    label: '📝 Cavab Açarları',
    icon: KeyRound,
    path: '/exam-panel/keys',
  },
];

export const fetchAuthorizedData = async <T,>(path: string, token: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let payload: { success?: boolean; message?: string; data?: T } | null = null;

  try {
    payload = await response.json() as { success?: boolean; message?: string; data?: T } | null;
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  if (!payload) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return payload.data as T;
};

export const getEntityId = (entity: { id?: string; _id?: string } | null | undefined) => entity?.id || entity?._id || '';

export const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Tarix yoxdur';
  }

  return new Intl.DateTimeFormat('az-AZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export const normalizeMultipleChoiceAnswerIndex = (value: unknown) => {
  const parsedValue = Number(String(value).trim());
  return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : null;
};

export const getMultipleChoiceCorrectAnswerIndex = (question: PanelQuestion) => {
  const storedIndex = normalizeMultipleChoiceAnswerIndex(question?.correctAnswer);

  if (storedIndex !== null) {
    return storedIndex;
  }

  if (Array.isArray(question?.options)) {
    const fallbackIndex = question.options.findIndex((option) => option === question?.correctAnswer);

    if (fallbackIndex >= 0) {
      return fallbackIndex;
    }
  }

  return null;
};

export const formatMultipleChoiceAnswer = (question: PanelQuestion, answer: string) => {
  const answerIndex = normalizeMultipleChoiceAnswerIndex(answer);

  if (answerIndex === null) {
    return answer || 'Cavab verilməyib';
  }

  const optionText = question?.options?.[answerIndex] ?? '';
  const optionLabel = String.fromCharCode(65 + answerIndex);
  return optionText ? `${optionLabel}: ${optionText}` : optionLabel;
};

export const getCorrectAnswerLabel = (question: PanelQuestion) => {
  if (question.answerType === 'multiple_choice') {
    const correctIndex = getMultipleChoiceCorrectAnswerIndex(question);

    if (correctIndex !== null) {
      return formatMultipleChoiceAnswer(question, String(correctIndex));
    }

    return question.correctAnswer || 'Təyin edilməyib';
  }

  return question.correctAnswer?.trim() || 'Ekspertiza tələb olunur';
};

export const getStudentAnswerLabel = (question: PanelQuestion, answer?: string | null) => {
  if (!answer?.trim()) {
    return 'Cavab verilməyib';
  }

  if (question.answerType === 'multiple_choice') {
    return formatMultipleChoiceAnswer(question, answer);
  }

  return answer.trim();
};

export const safeNumber = (value: unknown) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

export const formatPercentage = (value: number | null) => (value === null ? '—' : `${value.toFixed(0)}%`);

export const isPendingReviewAnswer = (answer?: PanelResultAnswer | null) => {
  if (!answer?.answer?.trim()) {
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

export const getResultStatusMeta = (result: PanelResult) => {
  const score = safeNumber(result.scorePercentage);
  const hasPendingAnswers = Boolean(result.hasPendingAnswers) || (result.answers || []).some((answer) => isPendingReviewAnswer(answer));

  if (hasPendingAnswers) {
    return {
      label: 'Yoxlanılır',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
      icon: Loader2,
    };
  }

  if (score >= 50) {
    return {
      label: 'Keçdi',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      icon: CheckCircle2,
    };
  }

  return {
    label: 'Kəsildi',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
    icon: XCircle,
  };
};

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'Tarix yoxdur';
  }

  return new Intl.DateTimeFormat('az-AZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};