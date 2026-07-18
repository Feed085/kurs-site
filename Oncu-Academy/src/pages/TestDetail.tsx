import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  CalendarDays,
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag,
  CheckCircle,
  KeyRound,
  Lock,
  Loader2,
  XCircle,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/services/publicApi';

const normalizeMultipleChoiceAnswerIndex = (value: unknown) => {
  const parsedValue = Number(String(value).trim());
  return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : null;
};

const getMultipleChoiceCorrectAnswerIndex = (question: any) => {
  const storedIndex = normalizeMultipleChoiceAnswerIndex(question?.correctAnswer);
  if (storedIndex !== null) {
    return storedIndex;
  }

  if (Array.isArray(question?.options)) {
    const fallbackIndex = question.options.findIndex((option: string) => option === question?.correctAnswer);
    if (fallbackIndex >= 0) {
      return fallbackIndex;
    }
  }

  return null;
};

const getExamTimeLeftSeconds = (nextTest: any, fallbackPanelTest: any, now = Date.now()) => {
  const durationSeconds = Math.max(0, Math.floor(Number(nextTest?.duration || 0) * 60));
  const startsAtValue = nextTest?.accessStatus?.startsAt || nextTest?.startsAt || fallbackPanelTest?.startsAt || null;

  if (nextTest?.type !== 'admin_exam' || !startsAtValue) {
    return durationSeconds;
  }

  const startsAtTime = new Date(startsAtValue).getTime();

  if (!Number.isFinite(startsAtTime)) {
    return durationSeconds;
  }

  const endsAtTime = startsAtTime + durationSeconds * 1000;
  return Math.max(0, Math.floor((endsAtTime - now) / 1000));
};

type AdminExamLeaveSessionStatus = 'pending' | 'approved' | 'expired' | 'finished' | 'rejected';

type AdminExamLeaveSessionData = {
  sessionId: string;
  status: AdminExamLeaveSessionStatus;
  createdAt?: string;
  expiresAt?: string;
  resolvedAt?: string | null;
  manualCode?: string;
  timeLeftSeconds?: number;
};

type AdminExamLeaveLockCode = 'LEAVE_SESSION_PENDING' | 'LEAVE_SESSION_EXPIRED' | 'LEAVE_SESSION_FINISHED' | 'LEAVE_SESSION_REJECTED';

type AdminExamEntryBlockCode = AdminExamLeaveLockCode | 'ADMIN_EXAM_TERMINATED' | 'ADMIN_EXAM_REENTRY_BLOCKED';

type AdminExamEntryBlock = {
  code: AdminExamEntryBlockCode;
  message?: string;
  leaveSession?: AdminExamLeaveSessionData | null;
};

type TestSubmissionStatus = 'completed' | 'terminated';

const LEAVE_SESSION_POLL_INTERVAL_MS = 3000;

const ADMIN_EXAM_LEAVE_LOCK_CODES: AdminExamLeaveLockCode[] = [
  'LEAVE_SESSION_PENDING',
  'LEAVE_SESSION_EXPIRED',
  'LEAVE_SESSION_FINISHED',
  'LEAVE_SESSION_REJECTED'
];

const isAdminExamLeaveLockCode = (value: unknown): value is AdminExamLeaveLockCode => {
  return typeof value === 'string' && ADMIN_EXAM_LEAVE_LOCK_CODES.includes(value as AdminExamLeaveLockCode);
};

const extractAdminExamEntryBlock = (payload: any): AdminExamEntryBlock | null => {
  const responseCode = payload?.code ?? payload?.data?.code;

  if (isAdminExamLeaveLockCode(responseCode)) {
    const leaveSession = payload?.data?.sessionId
      ? {
          sessionId: String(payload.data.sessionId),
          status: payload.data.status as AdminExamLeaveSessionStatus,
          createdAt: payload.data.createdAt,
          expiresAt: payload.data.expiresAt,
          resolvedAt: payload.data.resolvedAt,
          manualCode: payload.data.manualCode,
          timeLeftSeconds: payload.data.timeLeftSeconds,
        }
      : null;

    return {
      code: responseCode,
      message: payload?.message,
      leaveSession,
    };
  }

  if (responseCode === 'ADMIN_EXAM_TERMINATED') {
    return {
      code: responseCode,
      message: payload?.message,
      leaveSession: null,
    };
  }

  if (responseCode === 'ADMIN_EXAM_REENTRY_BLOCKED') {
    return {
      code: responseCode,
      message: payload?.message,
      leaveSession: null,
    };
  }

  return null;
};

const readPersistedLeaveSession = (storageKey: string | null) => {
  if (!storageKey) {
    return null;
  }

  const rawValue = sessionStorage.getItem(storageKey);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as AdminExamLeaveSessionData;
    return parsedValue?.sessionId ? parsedValue : null;
  } catch {
    sessionStorage.removeItem(storageKey);
    return null;
  }
};

const getLeaveSessionTimeLeftSeconds = (session: AdminExamLeaveSessionData | null, now: number) => {
  if (!session) {
    return 0;
  }

  if (session.expiresAt) {
    const expiresAtTime = new Date(session.expiresAt).getTime();

    if (Number.isFinite(expiresAtTime)) {
      return Math.max(0, Math.ceil((expiresAtTime - now) / 1000));
    }
  }

  return Math.max(0, Number(session.timeLeftSeconds || 0));
};

export default function TestDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const panelTest = (location.state as { panelTest?: any } | null)?.panelTest || null;
  const leaveSessionStorageKey = id ? `oncu-admin-exam-leave-session-${id}` : null;
  const isCreatingLeaveSessionRef = useRef(false);

  const formatMultipleChoiceAnswer = (question: any, answer: string) => {
    const answerIndex = normalizeMultipleChoiceAnswerIndex(answer);
    if (answerIndex === null) {
      return answer || t('test.not_answered', { defaultValue: 'Cavab verilməyib' });
    }

    const optionText = question?.options?.[answerIndex] ?? '';
    const optionLabel = String.fromCharCode(65 + answerIndex);
    return optionText ? `${optionLabel}: ${optionText}` : optionLabel;
  };
  const isPollingLeaveSessionRef = useRef(false);
  const createLeaveSessionRef = useRef<((options?: { keepalive?: boolean; suppressUi?: boolean }) => Promise<void>) | null>(null);
  const lastSubmissionStatusRef = useRef<TestSubmissionStatus>('completed');
  const persistedLeaveSessionRef = useRef<AdminExamLeaveSessionData | null>(readPersistedLeaveSession(leaveSessionStorageKey));
  
  const [test, setTest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLeaveControlActive, setIsLeaveControlActive] = useState(false);
  const [showLeaveOverlay, setShowLeaveOverlay] = useState(false);
  const [leaveSession, setLeaveSession] = useState<AdminExamLeaveSessionData | null>(null);
  const [entryBlock, setEntryBlock] = useState<AdminExamEntryBlock | null>(null);
  const [isLeaveSessionLoading, setIsLeaveSessionLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  // selectedAnswers => { "questionId": "qapalı testdə seçilən indeks" və ya açıq cavab mətnı }
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [accessCode, setAccessCode] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isStartingAdminExam, setIsStartingAdminExam] = useState(false);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [resultData, setResultData] = useState<any>(null);

  const isAdminExam = test?.type === 'admin_exam';
  const testQuestions = Array.isArray(test?.questions) ? test.questions : [];
  const questionCount = Array.isArray(test?.questions) && test.questions.length > 0
    ? test.questions.length
    : Number(test?.questionCount || 0);
  const startsAtValue = test?.accessStatus?.startsAt || test?.startsAt || panelTest?.startsAt || null;
  const endsAtValue = test?.accessStatus?.endsAt || null;
  const startsAtTime = startsAtValue ? new Date(startsAtValue).getTime() : null;
  const endsAtTime = endsAtValue
    ? new Date(endsAtValue).getTime()
    : (startsAtTime !== null ? startsAtTime + Math.max(0, Number(test?.duration || 0)) * 60 * 1000 : null);
  const hasStarted = test?.accessStatus?.hasStarted ?? (!startsAtTime || startsAtTime <= currentTime);
  const isExpired = test?.accessStatus?.hasExpired ?? Boolean(endsAtTime && endsAtTime <= currentTime);
  const canStartAdminExam = !isExpired && (test?.accessStatus?.canStart ?? hasStarted);
  const requiresAccessCode = Boolean(test?.accessStatus?.requiresAccessCode ?? test?.hasAccessCode ?? panelTest?.hasAccessCode);
  const isAccessGranted = !isAdminExam || Boolean(test?.accessGranted) || (Array.isArray(test?.questions) && test.questions.length > 0 && !requiresAccessCode);
  const leaveSessionTimeLeft = getLeaveSessionTimeLeftSeconds(leaveSession, currentTime);

  const formatDateTime = (value?: string | null) => {
    if (!value) {
      return t('test.no_date_set', { defaultValue: 'Tarix təyin edilməyib' });
    }

    return new Intl.DateTimeFormat('az-AZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  };

  const formatCountdown = (targetTime: number) => {
    const totalSeconds = Math.max(0, Math.floor((targetTime - currentTime) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const persistLeaveSession = (session: AdminExamLeaveSessionData | null) => {
    if (!leaveSessionStorageKey || !session) {
      return;
    }

    sessionStorage.setItem(leaveSessionStorageKey, JSON.stringify(session));
  };

  const clearLeaveSession = () => {
    if (leaveSessionStorageKey) {
      sessionStorage.removeItem(leaveSessionStorageKey);
    }

    setLeaveSession(null);
    setIsLeaveSessionLoading(false);
  };

  const syncLeaveSession = (session: AdminExamLeaveSessionData | null) => {
    setLeaveSession(session);
    persistLeaveSession(session);
  };

  const applyAdminExamEntryBlock = (nextEntryBlock: AdminExamEntryBlock | null) => {
    setEntryBlock(nextEntryBlock);

    if (nextEntryBlock?.code === 'LEAVE_SESSION_PENDING' && nextEntryBlock.leaveSession?.sessionId) {
      syncLeaveSession(nextEntryBlock.leaveSession);
      setShowLeaveOverlay(true);
      setIsLeaveSessionLoading(false);
      return;
    }

    clearLeaveSession();
    setShowLeaveOverlay(false);
  };

  useEffect(() => {
    const persistedSession = readPersistedLeaveSession(leaveSessionStorageKey);
    persistedLeaveSessionRef.current = persistedSession;

    if (persistedSession?.status === 'pending') {
      setLeaveSession(persistedSession);
      setEntryBlock({
        code: 'LEAVE_SESSION_PENDING',
        leaveSession: persistedSession,
      });
      setShowLeaveOverlay(true);
      setIsLeaveSessionLoading(false);
    }
  }, [leaveSessionStorageKey]);

  const openLeaveOverlayIfNeeded = () => {
    if (entryBlock?.code === 'LEAVE_SESSION_PENDING' && leaveSession?.sessionId) {
      setShowLeaveOverlay(true);
      return;
    }

    if (!isAdminExam || !isStarted || isFinished || !isLeaveControlActive) {
      return;
    }

    const persistedSession = readPersistedLeaveSession(leaveSessionStorageKey);

    if (leaveSession?.status === 'pending' || persistedSession?.sessionId) {
      if (!leaveSession && persistedSession) {
        setLeaveSession(persistedSession);
      }

      setShowLeaveOverlay(true);
    }
  };

  const createLeaveSession = async (options?: { keepalive?: boolean; suppressUi?: boolean }) => {
    if (!isAdminExam || !isStarted || isFinished || !isLeaveControlActive || !id) {
      return;
    }

    const persistedSession = readPersistedLeaveSession(leaveSessionStorageKey);

    if (leaveSession?.status === 'pending' || persistedSession?.sessionId || isCreatingLeaveSessionRef.current) {
      if (!options?.suppressUi) {
        setShowLeaveOverlay(true);
        if (!leaveSession && persistedSession) {
          setLeaveSession(persistedSession);
        }
      }
      return;
    }

    const token = localStorage.getItem('rim_auth_token');

    if (!token) {
      return;
    }

    isCreatingLeaveSessionRef.current = true;

    if (!options?.suppressUi) {
      setShowLeaveOverlay(true);
      setIsLeaveSessionLoading(true);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tests/${id}/leave-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ accessCode }),
        keepalive: options?.keepalive === true,
      });
      const payload = await response.json();

      const nextEntryBlock = extractAdminExamEntryBlock(payload);

      if (nextEntryBlock) {
        if (nextEntryBlock.leaveSession) {
          persistLeaveSession(nextEntryBlock.leaveSession);
        }

        if (!options?.suppressUi) {
          applyAdminExamEntryBlock(nextEntryBlock);
        }

        if (!options?.suppressUi && nextEntryBlock.code !== 'LEAVE_SESSION_PENDING') {
          void finishTest({ submissionStatus: 'terminated' });
        }

        return;
      }

      if (!response.ok || payload?.success === false || !payload?.data?.sessionId) {
        throw new Error(payload?.message || t('test.leave_session_failed', { defaultValue: 'Leave session yaradılmadı' }));
      }

      persistLeaveSession(payload.data as AdminExamLeaveSessionData);

      if (!options?.suppressUi) {
        setEntryBlock(null);
        syncLeaveSession(payload.data as AdminExamLeaveSessionData);
      }
    } catch (error) {
      if (!options?.suppressUi) {
        const message = error instanceof Error ? error.message : t('test.leave_session_failed', { defaultValue: 'Leave session yaradılmadı' });
        toast.error(message);
      }
    } finally {
      isCreatingLeaveSessionRef.current = false;

      if (!options?.suppressUi) {
        setIsLeaveSessionLoading(false);
      }
    }
  };

  createLeaveSessionRef.current = createLeaveSession;

  useEffect(() => {
    const fetchTest = async () => {
      if (!id) return;
      const token = localStorage.getItem('rim_auth_token');
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/tests/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const nextEntryBlock = extractAdminExamEntryBlock(data);

        if (nextEntryBlock) {
          applyAdminExamEntryBlock(nextEntryBlock);
          return;
        }

        if (data.success) {
          setEntryBlock(null);
          setTest(data.data);
          setTimeLeft(getExamTimeLeftSeconds(data.data, panelTest));

          if (data.data?.resumeGranted === true) {
            clearLeaveSession();
            setShowLeaveOverlay(false);
            setIsStarted(true);
            setIsLeaveControlActive(true);
            setSubmitError(null);
          }
        } else {
          toast.error(t('test.load_error_prefix', { defaultValue: 'Test yüklənərkən xəta: ' }) + data.message);
          navigate(-1);
        }
      } catch (err) {
        toast.error(t('test.not_loaded', { defaultValue: 'Test yüklənmədi' }));
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTest();
  }, [id, navigate, panelTest]);

  useEffect(() => {
    if (!isAdminExam || isFinished) {
      return undefined;
    }

    const syncExamClock = () => {
      const now = Date.now();
      setCurrentTime(now);

      if (test) {
        setTimeLeft(getExamTimeLeftSeconds(test, panelTest, now));
      }
    };

    syncExamClock();

    const timer = window.setInterval(syncExamClock, 1000);

    return () => window.clearInterval(timer);
  }, [isAdminExam, isFinished, panelTest, test]);

  useEffect(() => {
    if (!isAdminExam && test && isStarted && timeLeft > 0 && !isFinished) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          return prev <= 1 ? 0 : prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isAdminExam, isStarted, timeLeft, isFinished, test]);

  useEffect(() => {
    if (test && isStarted && timeLeft <= 0 && !isFinished) {
      void finishTest();
    }
  }, [isFinished, isStarted, test, timeLeft]);

  useEffect(() => {
    if (!isAdminExam || !isStarted || isFinished || !isLeaveControlActive) {
      return undefined;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void createLeaveSession();
        return;
      }

      openLeaveOverlayIfNeeded();
    };

    const handleWindowBlur = () => {
      if (document.visibilityState === 'visible') {
        void createLeaveSession();
      }
    };

    const handleWindowFocus = () => {
      if (document.visibilityState === 'visible') {
        openLeaveOverlayIfNeeded();
      }
    };

    const handlePageHide = () => {
      void createLeaveSession({ keepalive: true });
    };

    const handleBeforeUnload = () => {
      void createLeaveSession({ keepalive: true });
    };

    openLeaveOverlayIfNeeded();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [accessCode, entryBlock, id, isAdminExam, isFinished, isLeaveControlActive, isStarted, leaveSession, leaveSessionStorageKey]);

  useEffect(() => {
    if (!showLeaveOverlay) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showLeaveOverlay]);

  useEffect(() => {
    return () => {
      void createLeaveSessionRef.current?.({ keepalive: true, suppressUi: true });
    };
  }, []);

  useEffect(() => {
    if (!showLeaveOverlay || !leaveSession?.sessionId || leaveSession.status !== 'pending' || isFinished) {
      return undefined;
    }

    let isCancelled = false;

    const pollLeaveSessionStatus = async () => {
      if (isPollingLeaveSessionRef.current) {
        return;
      }

      const token = localStorage.getItem('rim_auth_token');

      if (!token) {
        return;
      }

      isPollingLeaveSessionRef.current = true;

      try {
        const response = await fetch(`${API_BASE_URL}/tests/leave-sessions/${leaveSession.sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const payload = await response.json();

        if (!response.ok || payload?.success === false || !payload?.data) {
          throw new Error(payload?.message || t('test.leave_session_status_failed', { defaultValue: 'Leave session statusu alınmadı' }));
        }

        if (isCancelled) {
          return;
        }

        const nextSession = payload.data as AdminExamLeaveSessionData;
        syncLeaveSession(nextSession);

        if (nextSession.status === 'approved') {
          setEntryBlock(null);
          clearLeaveSession();
          setShowLeaveOverlay(false);

          if (!isStarted && id) {
            const token = localStorage.getItem('rim_auth_token');

            if (token) {
              setIsLoading(true);

              try {
                const testResponse = await fetch(`${API_BASE_URL}/tests/${id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                const testPayload = await testResponse.json();
                const refreshedEntryBlock = extractAdminExamEntryBlock(testPayload);

                if (refreshedEntryBlock) {
                  applyAdminExamEntryBlock(refreshedEntryBlock);
                } else if (testPayload?.success) {
                  setEntryBlock(null);
                  setTest(testPayload.data);
                  setTimeLeft(getExamTimeLeftSeconds(testPayload.data, panelTest));
                }
              } catch {
                toast.error(t('test.exam_info_not_updated', { defaultValue: 'İmtahan məlumatı yenilənmədi' }));
              } finally {
                setIsLoading(false);
              }
            }
          }

          toast.success(t('test.teacher_allowed_continue', { defaultValue: 'Müəllim icazə verdi, imtahan davam edir' }));
          return;
        }

        if (nextSession.status === 'expired' || nextSession.status === 'rejected' || nextSession.status === 'finished') {
          clearLeaveSession();
          toast.error(
            nextSession.status === 'expired'
              ? t('test.time_up_ending', { defaultValue: 'Müddət bitdi, imtahan sonlandırılır' })
              : nextSession.status === 'finished'
                ? t('test.session_closed_ending', { defaultValue: 'Sessiya bağlandı, imtahan sonlandırılır' })
                : t('test.exam_ending', { defaultValue: 'İmtahan sonlandırılır' })
          );
          void finishTest({ submissionStatus: 'terminated' });
        }
      } catch {
        // Leave overlay remains open; a later poll can recover.
      } finally {
        isPollingLeaveSessionRef.current = false;
      }
    };

    void pollLeaveSessionStatus();
    const intervalId = window.setInterval(() => {
      void pollLeaveSessionStatus();
    }, LEAVE_SESSION_POLL_INTERVAL_MS);

    return () => {
      isCancelled = true;
      isPollingLeaveSessionRef.current = false;
      window.clearInterval(intervalId);
    };
  }, [isFinished, leaveSession, showLeaveOverlay]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] pt-20 lg:pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('common.loading_data')}</h1>
          <Button onClick={() => navigate(-1)}>
            {t('common.go_back', { defaultValue: 'Geri qayıt' })}
          </Button>
        </div>
      </div>
    );
  }

  const startTest = async () => {
    if (isAdminExam && !isAccessGranted) {
      toast.error(t('test.complete_entry_check', { defaultValue: 'İmtahanı başlatmaq üçün əvvəlcə giriş yoxlamasını tamamlayın' }));
      return;
    }

    if (testQuestions.length === 0) {
      toast.error(t('test.questions_not_loaded', { defaultValue: 'İmtahan sualları yüklənməyib' }));
      return;
    }

    if (isAdminExam && isExpired) {
      toast.error(t('test.exam_expired', { defaultValue: 'İmtahan müddəti artıq bitib' }));
      return;
    }

    if (isAdminExam) {
      if (!id) {
        return;
      }

      const token = localStorage.getItem('rim_auth_token');

      if (!token) {
        toast.error(t('common.not_found'));
        return;
      }

      setIsStartingAdminExam(true);

      try {
        const response = await fetch(`${API_BASE_URL}/tests/${id}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ accessCode }),
        });
        const payload = await response.json();
        const nextEntryBlock = extractAdminExamEntryBlock(payload);

        if (nextEntryBlock) {
          applyAdminExamEntryBlock(nextEntryBlock);
          return;
        }

        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.message || t('test.exam_start_failed', { defaultValue: 'İmtahan startı qeydə alınmadı' }));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : t('test.exam_start_failed', { defaultValue: 'İmtahan startı qeydə alınmadı' });
        toast.error(message);
        return;
      } finally {
        setIsStartingAdminExam(false);
      }
    }

    setIsStarted(true);
    setIsLeaveControlActive(isAdminExam);
    setShowLeaveOverlay(false);
    setEntryBlock(null);
    clearLeaveSession();
    setSubmitError(null);
    toast.success(t('test.started'));
  };

  const unlockAdminExam = async () => {
    if (!id) {
      return;
    }

    const token = localStorage.getItem('rim_auth_token');
    setIsUnlocking(true);

    try {
      const res = await fetch(`${API_BASE_URL}/tests/${id}/access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ accessCode })
      });

      const data = await res.json();

      const nextEntryBlock = extractAdminExamEntryBlock(data);

      if (nextEntryBlock) {
        applyAdminExamEntryBlock(nextEntryBlock);
        return;
      }

      if (data.success) {
        setEntryBlock(null);
        setTest(data.data);
        setTimeLeft(getExamTimeLeftSeconds(data.data, panelTest));
        toast.success(t('test.exam_entry_approved', { defaultValue: 'İmtahana giriş təsdiqləndi' }));
      } else {
        toast.error(data.message || t('test.exam_entry_failed', { defaultValue: 'İmtahan girişi alınmadı' }));
      }
    } catch (err) {
      toast.error(t('test.exam_entry_check_failed', { defaultValue: 'İmtahan giriş yoxlaması alınmadı' }));
    } finally {
      setIsUnlocking(false);
    }
  };

  const finishTest = async (options?: { submissionStatus?: TestSubmissionStatus }) => {
    if (!id || isSubmittingResult) {
      return;
    }

    const submissionStatus = options?.submissionStatus === 'terminated' ? 'terminated' : 'completed';
    lastSubmissionStatusRef.current = submissionStatus;

    setIsLeaveControlActive(false);
    setShowLeaveOverlay(false);
    setEntryBlock(null);
    clearLeaveSession();
    setIsFinished(true); // freeze screen UI
    setIsSubmittingResult(true);
    setSubmitError(null);
    const token = localStorage.getItem('rim_auth_token');
    
    // format answers array
    const formattedAnswers = Object.keys(selectedAnswers).map(qId => ({
       questionId: qId,
       answer: selectedAnswers[qId]
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/tests/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          answers: formattedAnswers,
          accessCode,
          submissionStatus
        })
      });
      const data = await res.json();

      const nextEntryBlock = extractAdminExamEntryBlock(data);

      if (nextEntryBlock) {
        setEntryBlock(nextEntryBlock);
      }

      if (data.success) {
        setResultData(data.data);
        toast.success(data.data.hasPendingAnswers ? t('test.exam_finished_pending', { defaultValue: 'İmtahan bitdi! Bəzi açıq suallar sonradan yoxlanılacaq.' }) : t('test.test_completed', { defaultValue: 'Test tamamlandı!' }));
      } else {
        const message = data.message || t('test.result_submit_error', { defaultValue: 'Nəticə göndərilərkən xəta baş verdi' });
        setSubmitError(message);
        toast.error(message);
      }
    } catch(err) {
      const message = t('test.result_not_submitted', { defaultValue: 'Nəticə göndərilmədi!' });
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmittingResult(false);
    }
  };

  const handleSelectAnswer = (qId: string, answerValue: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: answerValue
    }));
  };

  const isNumericOpenEndedQuestion = (question: any) => {
    if (!question || question.answerType !== 'open_ended') {
      return false;
    }

    return question.openEndedAnswerType === 'number';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const leaveOverlayContent = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Flag className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">{t('test.out_of_focus_suspended')}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          {t('test.manual_code_instruction', { defaultValue: 'İmtahana davam etmək üçün aşağıdakı manual kodu müəllimə verin. Müəllim paneldən son qərarı verdikdən sonra sistem reaksiya verəcək.' })}
        </p>
        <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
          {leaveSession?.manualCode ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">{t('test.time_left', { defaultValue: 'Qalan vaxt' })}</div>
                <div className="mt-1 font-mono text-2xl font-black">{formatTime(leaveSessionTimeLeft)}</div>
              </div>
              <div className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-left text-slate-700">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{t('test.manual_code', { defaultValue: 'Manual kod' })}</div>
                <div className="mt-2 font-mono text-xl font-black tracking-[0.2em]">{leaveSession.manualCode}</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-medium">{isLeaveSessionLoading ? t('test.manual_code_preparing') : t('test.manual_code_waiting')}</p>
            </div>
          )}
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          {t('test.teacher_decision_timeout', { defaultValue: 'Müəllim 5 dəqiqə ərzində qərar verməsə, imtahan avtomatik sonlandırılacaq.' })}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => {
              void finishTest({ submissionStatus: 'terminated' });
            }}
            disabled={isSubmittingResult}
            className="h-12 w-full rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
          >
            {t('test.stop_exam', { defaultValue: 'İmtahanı dayandır' })}
          </Button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] pt-20 lg:pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('common.loading_data')}</h1>
          <Button onClick={() => navigate(-1)}>
            {t('common.go_back', { defaultValue: 'Geri qayıt' })}
          </Button>
        </div>
      </div>
    );
  }

  if (entryBlock && entryBlock.code !== 'LEAVE_SESSION_PENDING') {
    const blockedMessage = entryBlock.code === 'ADMIN_EXAM_REENTRY_BLOCKED'
      ? t('test.admin_exam_entry_used', { defaultValue: 'Bu admin imtahanı üçün giriş artıq birdəfəlik istifadə olunub. Yenidən daxil olmaq mümkün deyil.' })
      : entryBlock.code === 'LEAVE_SESSION_EXPIRED'
      ? t('test.leave_session_expired', { defaultValue: 'Leave session müddəti bitdiyi üçün bu imtahana artıq qayıda bilməzsiniz.' })
      : entryBlock.code === 'LEAVE_SESSION_REJECTED'
        ? t('test.leave_session_rejected', { defaultValue: 'Müəllim leave session-u rədd etdi. Bu imtahana yenidən giriş bağlanıb.' })
        : entryBlock.code === 'LEAVE_SESSION_FINISHED'
          ? t('test.leave_session_closed', { defaultValue: 'Bu imtahan üçün leave session bağlanıb və yenidən giriş mümkün deyil.' })
          : t('test.exam_terminated_for_you', { defaultValue: 'Bu imtahan sizin üçün artıq sonlandırılıb.' });

    return (
      <div className="min-h-screen bg-[#F3F3F3] pt-20 lg:pt-24 flex items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-lg lg:p-10">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <XCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">{t('test.exam_closed')}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{blockedMessage}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={() => navigate('/exam-panel')}>
              {t('test.back_to_exam_panel', { defaultValue: 'İmtahan panelinə qayıt' })}
            </Button>
            <Button onClick={() => navigate('/dashboard')} className="bg-[#D4AF37] hover:bg-[#B88A1B] text-white">
              {t('test.back_to_panel', { defaultValue: 'Panelə qayıt' })}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showLeaveOverlay && !test) {
    return (
      <div className="min-h-screen bg-[#F3F3F3]">
        {leaveOverlayContent}
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] pt-20 lg:pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('common.loading_data')}</h1>
          <Button onClick={() => navigate(-1)}>
            {t('common.go_back', { defaultValue: 'Geri qayıt' })}
          </Button>
        </div>
      </div>
    );
  }

  // Start Screen
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] pt-20 lg:pt-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t('common.go_back', { defaultValue: 'Geri qayıt' })}
          </Button>

          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#A87A1F] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Flag className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-2xl lg:text-3xl font-black text-gray-900 text-center mb-4">
              {test.title}
            </h1>
            <p className="text-gray-500 text-center mb-8">
              {isAdminExam ? t('test.admin_exam_subtitle', { defaultValue: 'Admin tərəfindən hazırlanmış yekun imtahan' }) : t('test.self_test', { defaultValue: 'Özünü Sına' })}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-[#D4AF37]">{questionCount}</div>
                <div className="text-sm text-gray-500">{t('test.question_label', { defaultValue: 'Sual' })}</div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-[#A87A1F]">{test.duration}</div>
                <div className="text-sm text-gray-500">{t('common.minute')}</div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-[#F59E0B]">100</div>
                <div className="text-sm text-gray-500">{t('test.score_label', { defaultValue: 'Bal' })}</div>
              </div>
            </div>

            {isAdminExam ? (
              <div className="mb-8 space-y-4">
                {startsAtValue ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <CalendarDays className="mt-0.5 h-5 w-5 text-slate-500" />
                      <div>
                        <div className="text-sm font-bold text-slate-900">{t('test.start_time')}</div>
                        <div className="mt-1 text-sm text-slate-600">{formatDateTime(startsAtValue)}</div>
                        {!hasStarted && startsAtTime ? (
                          <div className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-amber-600">
                            {t('test.time_until_open', { defaultValue: 'Açılışa qalan vaxt:' })} {formatCountdown(startsAtTime)}
                          </div>
                        ) : null}
                        {hasStarted && !isExpired ? (
                          <div className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-600">
                            {t('test.time_remaining', { defaultValue: 'Qalan müddət:' })} {formatTime(timeLeft)}
                          </div>
                        ) : null}
                        {isExpired ? (
                          <div className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-rose-600">
                            {t('test.exam_duration_ended', { defaultValue: 'İmtahan müddəti bitib' })}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                {requiresAccessCode ? (
                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                    <div className="flex items-start gap-3">
                      <KeyRound className="mt-0.5 h-5 w-5 text-violet-600" />
                      <div className="w-full">
                        <div className="text-sm font-bold text-violet-900">{t('test.exam_password_required')}</div>
                        <p className="mt-1 text-sm text-violet-700">{t('test.exam_password_description')}</p>
                        <Input
                          value={accessCode}
                          onChange={(event) => setAccessCode(event.target.value)}
                          placeholder={t("test.exam_password", { defaultValue: "İmtahan şifrəsi" })}
                          className="mt-3 h-12 rounded-xl border-violet-200 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    {t('test.no_password_required_entry_check', { defaultValue: 'Bu imtahan üçün ayrıca şifrə tələb olunmur. Başlamaq üçün giriş yoxlamasını tamamlayın.' })}
                  </div>
                )}

                {!isAccessGranted ? (
                  <Button
                    onClick={unlockAdminExam}
                    disabled={isUnlocking || !canStartAdminExam || (requiresAccessCode && !accessCode.trim())}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl h-14 text-lg"
                  >
                    <Lock className="mr-2 h-5 w-5" />
                    {isExpired ? t('test.exam_finished', { defaultValue: 'İmtahan bitib' }) : !canStartAdminExam ? t('test.wait_start_time', { defaultValue: 'Başlama vaxtını gözləyin' }) : isUnlocking ? t('test.verifying_entry', { defaultValue: 'Giriş yoxlanır...' }) : t('test.open_exam_entry', { defaultValue: 'İmtahan girişini aç' })}
                  </Button>
                ) : (
                  <div className={`rounded-2xl border p-4 text-sm font-semibold ${isExpired ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                    {isExpired ? t('test.entry_closed_expired', { defaultValue: 'İmtahan müddəti bitdiyi üçün giriş artıq bağlanıb.' }) : t('test.entry_approved_can_start', { defaultValue: 'Giriş təsdiqləndi. İndi imtahanı başlada bilərsiniz.' })}
                  </div>
                )}
              </div>
            ) : null}

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-8">
              <h3 className="font-bold text-yellow-800 mb-2">{t('test.rules.title', { defaultValue: 'Qaydalar:' })}</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>{t('test.rules.rule1')}</li>
                <li>{t('test.rules.rule2')}</li>
                <li>{t('test.rules.rule3')}</li>
              </ul>
            </div>

            <Button
              onClick={() => void startTest()}
              disabled={isAdminExam && (!isAccessGranted || isExpired || isStartingAdminExam)}
              className="w-full bg-[#D4AF37] hover:bg-[#B88A1B] text-white font-semibold rounded-xl h-14 text-lg"
            >
              {isAdminExam && isStartingAdminExam ? t('test.exam_starting', { defaultValue: 'İmtahan başladılır...' }) : t('test.start_exam', { defaultValue: 'İmtahana Başla' })}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (isFinished) {
    if (!resultData) {
      return (
        <div className="min-h-screen bg-[#F3F3F3] pt-20 lg:pt-24 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-lg font-bold text-gray-900">
              {isSubmittingResult ? t('test.submitting_result', { defaultValue: 'Nəticə göndərilir...' }) : t('test.result_not_submitted', { defaultValue: 'Nəticə göndərilmədi' })}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {isSubmittingResult ? t('test.exam_auto_ending_wait', { defaultValue: 'İmtahan avtomatik sonlandırılır, zəhmət olmasa gözləyin.' }) : (submitError || t('test.result_not_saved_error', { defaultValue: 'Bağlantı və ya server xətası səbəbilə nəticə qeydə alınmadı.' }))}
            </p>
            {!isSubmittingResult ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  onClick={() => {
                    void finishTest({ submissionStatus: lastSubmissionStatusRef.current });
                  }}
                  className="bg-[#D4AF37] hover:bg-[#B88A1B] text-white"
                >
                  {t('test.resend', { defaultValue: 'Yenidən göndər' })}
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  {t('test.back_to_panel', { defaultValue: 'Panelə qayıt' })}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )
    }

    const percentage = resultData.scorePercentage || 0;
    const isPassed = percentage >= 60;
    const hasPending = resultData.hasPendingAnswers;

    return (
      <div className="min-h-screen bg-[#F3F3F3] pt-20 lg:pt-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-lg">
            <div className="text-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                hasPending ? 'bg-yellow-100' : isPassed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {hasPending ? (
                  <Clock className="w-12 h-12 text-yellow-600" />
                ) : isPassed ? (
                  <Trophy className="w-12 h-12 text-green-600" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
              </div>

              <h1 className="text-2xl lg:text-3xl font-black text-gray-900 mb-2">
                {hasPending ? t('test.result_pending', { defaultValue: 'Nəticə Gözlənilir' }) : isPassed ? t('test.congratulations', { defaultValue: 'Təbriklər!' }) : t('test.failed', { defaultValue: 'Uğursuz oldu' })}
              </h1>
              <p className="text-gray-500 mb-8">
                {hasPending 
                  ? t('test.pending_open_questions', { defaultValue: 'Bəzi suallar açıq tiplidir. Müəllim yoxladıqdan sonra yekun nəticəni görə bilərsiniz!' })
                  : isPassed 
                    ? t('test.passed') 
                    : t('test.better_next_time', { defaultValue: 'Növbəti dəfə daha yaxşı nəticə göstərəcəyinizə əminik!' })}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-2xl font-black text-[#A87A1F]">{percentage.toFixed(0)}%</div>
                  <div className="text-sm text-gray-500">{t('test.current_result')}</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-2xl font-black text-yellow-500">
                    {resultData.answers.filter((a:any) => a.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-500">{t('test.pending_questions')}</div>
                </div>
              </div>

              {resultData.answers.filter((a:any) => !a.isCorrect && a.status === 'graded').length > 0 && (
                <div className="mb-8 text-left">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    {t('test.wrong_answers_graded', { defaultValue: 'Səhv Cavablarınız (Yoxlanmış)' })}
                  </h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {resultData.answers.filter((a:any) => !a.isCorrect && a.status === 'graded').map((a: any, idx: number) => {
                      const q = testQuestions.find((x:any) => x._id === a.questionId);
                      if (!q) return null;
                      
                      return (
                        <div key={q._id} className="bg-red-50/50 border border-red-100 rounded-xl p-4">
                          <p className="font-medium text-gray-900 mb-2">
                            {idx + 1}. {q.questionType === 'image' ? (
                              <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 max-w-xs">
                                <img src={q.content} alt={t('test.question', { defaultValue: 'Sual' })} className="w-full h-auto" />
                              </div>
                            ) : q.content}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 mt-3 text-sm">
                            <div className="flex-1 flex items-start gap-2 text-red-600 bg-red-100/50 px-3 py-2 rounded-lg">
                              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-medium block text-xs uppercase tracking-wider mb-0.5">{t('test.your_answer')}</span>
                                <span>{q.answerType === 'multiple_choice' ? formatMultipleChoiceAnswer(q, a.answer) : (a.answer || t('test.no_answer_given'))}</span>
                              </div>
                            </div>
                            <div className="flex-1 flex items-start gap-2 text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-2 rounded-lg">
                              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-medium block text-xs uppercase tracking-wider mb-0.5">{t('test.correct_answer')}</span>
                                <span>{q.answerType === 'multiple_choice' ? formatMultipleChoiceAnswer(q, String(getMultipleChoiceCorrectAnswerIndex(q) ?? '')) : (q.correctAnswer || t('test.expertise_required'))}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="w-full h-12 rounded-xl"
                >
                  {t('test.back_to_panel', { defaultValue: 'Panelə qayıt' })}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Test Screen
  const question = testQuestions[currentQuestion];
  const progress = testQuestions.length > 0 ? ((currentQuestion + 1) / testQuestions.length) * 100 : 0;

  if (!question || testQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] pt-20 lg:pt-24 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{t('test.questions_not_loaded')}</h1>
          <p className="text-sm text-gray-500 mb-6">{t('test.refresh_page_hint')}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={() => navigate('/exam-panel')}>
              {t('test.back_to_exam_panel', { defaultValue: 'İmtahan panelinə qayıt' })}
            </Button>
            <Button onClick={() => window.location.reload()} className="bg-[#D4AF37] hover:bg-[#B88A1B] text-white">
              {t('test.refresh_page', { defaultValue: 'Səhifəni yenilə' })}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)]">
      {showLeaveOverlay ? leaveOverlayContent : null}
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-bold text-gray-900">{test.title}</h1>
              <p className="text-sm text-gray-500">{t('test.question', { defaultValue: 'Sual' })} {currentQuestion + 1} / {testQuestions.length}</p>
            </div>
            <div className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 sm:w-auto ${
              timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <div className="mb-6 rounded-3xl bg-white p-5 shadow-lg sm:p-6 lg:p-8">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-6">
             {currentQuestion + 1}. 
             {question.questionType === 'image' ? (
                <div className="mt-4 rounded-2xl overflow-hidden border-2 border-gray-50 shadow-sm max-w-lg">
                   <img src={question.content} alt={t('test.question', { defaultValue: 'Sual' })} className="w-full h-auto" />
                </div>
             ) : (
                <span className="ml-2 block mt-2 text-xl font-medium">{question.content}</span>
             )}
          </h2>

          <div className="space-y-3">
             {question.answerType === 'multiple_choice' ? (
                question.options.map((option: string, index: number) => {
                     return (
                     <button
                       key={index}
                       onClick={() => handleSelectAnswer(question._id, String(index))}
                       className={`w-full rounded-xl p-3 text-left transition-all sm:p-4 ${
                         selectedAnswers[question._id] === String(index)
                           ? 'bg-[#A87A1F] text-white'
                           : 'bg-gray-50 text-gray-700 border border-transparent hover:bg-gray-50 hover:border-[#A87A1F]'
                       }`}
                     >
                       <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                           selectedAnswers[question._id] === String(index)
                             ? 'bg-white text-[#A87A1F]'
                             : 'bg-white text-gray-500'
                         }`}>
                           {String.fromCharCode(65 + index)}
                         </div>
                         <span>{option}</span>
                       </div>
                     </button>
                   );
                })
             ) : (
                <div className="pt-4">
                 <label className="text-sm font-bold text-gray-700 mb-2 block">
                     {isNumericOpenEndedQuestion(question) ? t('test.your_answer_numeric', { defaultValue: 'Sizin Cavabınız (Rəqəm)' }) : t('test.your_answer_open', { defaultValue: 'Sizin Cavabınız (Açıq sual)' })}
                 </label>
                   {isNumericOpenEndedQuestion(question) ? (
                   <Input
                     type="number"
                     step="any"
                     inputMode="decimal"
                     className="w-full rounded-2xl border-gray-200 p-4 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                     placeholder={t('test.example_number', { defaultValue: 'Məs: 3.5' })}
                     value={selectedAnswers[question._id] || ''}
                     onChange={(e) => handleSelectAnswer(question._id, e.target.value)}
                   />
                 ) : (
                   <textarea
                     rows={5}
                     className="w-full rounded-2xl border-gray-200 p-4 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                     placeholder={t('test.write_your_answer', { defaultValue: 'Fikrinizi bura yazın...' })}
                     value={selectedAnswers[question._id] || ''}
                     onChange={(e) => handleSelectAnswer(question._id, e.target.value)}
                   ></textarea>
                 )}
                </div>
             )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="w-full rounded-xl sm:w-auto"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t('test.previous', { defaultValue: 'Əvvəlki' })}
          </Button>

          <div className="flex max-w-full flex-wrap justify-center gap-2 sm:max-w-[50%]">
            {testQuestions.map((q: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 shrink-0 rounded-lg text-sm font-medium transition-all ${
                  idx === currentQuestion
                    ? 'bg-[#A87A1F] text-white'
                    : selectedAnswers[q._id] 
                    ? 'bg-[#A87A1F]/20 text-[#A87A1F]'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQuestion < testQuestions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestion(prev => Math.min(testQuestions.length - 1, prev + 1))}
              className="w-full rounded-xl bg-[#D4AF37] text-white hover:bg-[#B88A1B] sm:w-auto"
            >
              {t('test.next', { defaultValue: 'Növbəti' })}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                void finishTest({ submissionStatus: 'completed' });
              }}
              disabled={isSubmittingResult}
              className="w-full rounded-xl bg-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/30 hover:bg-[#B88A1B] sm:w-auto"
            >
              {isSubmittingResult ? t('test.sending', { defaultValue: 'Göndərilir...' }) : t('test.finish_exam', { defaultValue: 'İmtahanı Bitir' })}
              <CheckCircle className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
