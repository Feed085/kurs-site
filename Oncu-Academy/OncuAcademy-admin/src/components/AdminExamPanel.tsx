import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, type ExamPanelResponse } from '../services/api';
import { useTranslation } from "react-i18next";

type DraftItem = NonNullable<ExamPanelResponse['data']>['drafts'][number];
type PublishedExamItem = NonNullable<ExamPanelResponse['data']>['publishedExams'][number];
type AdminExamResultResponse = Awaited<ReturnType<typeof adminApi.getTestResults>>;
type AdminExamTestDetail = NonNullable<AdminExamResultResponse['data']>['test'];
type AdminExamResultItem = NonNullable<AdminExamResultResponse['data']>['results'][number];
type AdminExamPanelTab = 'create' | 'history';
type HistoryStatusFilter = 'all' | 'planned' | 'active' | 'completed';
type ExamLifecycleStatus = Exclude<HistoryStatusFilter, 'all'>;

const ADMIN_EXAM_ACCESS_CODES_STORAGE_KEY = 'rim_admin_exam_access_codes';

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value);

  if (!Number.isFinite(parsedDate.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('az-AZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsedDate);
};

const toDateInputValue = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

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


const normalizeMultipleChoiceAnswerIndex = (value: unknown) => {
  const parsedValue = Number(String(value).trim());
  return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : null;
};

const formatAttemptLabel = (attemptNumber: number, t?: any) => {
  if (attemptNumber === 1) return t ? t('admin.1_ci_c_hd', { defaultValue: '1-ci cəhd' }) : '1-ci cəhd';
  if (attemptNumber === 2) return t ? t('admin.2_ci_c_hd', { defaultValue: '2-ci cəhd' }) : '2-ci cəhd';
  if (attemptNumber === 3) return t ? t('admin.3_c__c_hd', { defaultValue: '3-cü cəhd' }) : '3-cü cəhd';
  return `${attemptNumber}-ci cəhd`;
};

const getQuestionLookupKey = (question: any, index: number) => {
  return resolveEntityId(question?._id ?? question?.id ?? question?.questionId ?? index);
};

const getAnswerForQuestion = (result: AdminExamResultItem, question: any, index: number) => {
  const questionLookupKey = getQuestionLookupKey(question, index);
  const answerFromMap = result.answersByQuestionId?.[questionLookupKey];

  if (answerFromMap) {
    return answerFromMap;
  }

  const exactAnswer = result.answers.find((item: AdminExamResultItem['answers'][number]) => resolveEntityId(item.questionId) === questionLookupKey);

  if (exactAnswer) {
    return exactAnswer;
  }

  return result.answers[index] || null;
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

const formatMultipleChoiceAnswer = (question: any, answer: string) => {
  const answerIndex = normalizeMultipleChoiceAnswerIndex(answer);

  if (answerIndex === null) {
    return answer || 'Cavab verilməyib';
  }

  const optionText = question?.options?.[answerIndex] ?? '';
  const optionLabel = String.fromCharCode(65 + answerIndex);
  return optionText ? `${optionLabel}: ${optionText}` : optionLabel;
};

const readAccessCodeCache = () => {
  if (typeof window === 'undefined') {
    return {} as Record<string, string>;
  }

  try {
    const rawValue = localStorage.getItem(ADMIN_EXAM_ACCESS_CODES_STORAGE_KEY);

    if (!rawValue) {
      return {} as Record<string, string>;
    }

    const parsedValue = JSON.parse(rawValue);
    return typeof parsedValue === 'object' && parsedValue ? parsedValue as Record<string, string> : {};
  } catch {
    return {} as Record<string, string>;
  }
};

const persistAccessCodeCache = (value: Record<string, string>) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(ADMIN_EXAM_ACCESS_CODES_STORAGE_KEY, JSON.stringify(value));
};

const getExamLifecycleStatus = (exam: PublishedExamItem): ExamLifecycleStatus => {
  const now = Date.now();
  const startValue = new Date(exam.startsAt || exam.activatedAt || exam.createdAt || 0).getTime();
  const durationValue = Number(exam.duration || 0) * 60 * 1000;

  if (Number.isFinite(startValue) && startValue > now) {
    return 'planned';
  }

  if (Number.isFinite(startValue) && durationValue > 0 && now <= startValue + durationValue) {
    return 'active';
  }

  if (Number(exam.resultsCount || 0) > 0) {
    return 'completed';
  }

  if (Number.isFinite(startValue) && durationValue > 0 && now > startValue + durationValue) {
    return 'completed';
  }

  return exam.isStudentVisible ? 'active' : 'planned';
};

const getExamStatusMeta = (status: ExamLifecycleStatus) => {
  if (status === 'planned') {
    return {
      label: 'Planlanmış',
      className: 'bg-sky-50 text-sky-700 border-sky-100',
    };
  }

  if (status === 'completed') {
    return {
      label: 'Tamamlanmış',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    };
  }

  return {
    label: 'Aktiv',
    className: 'bg-amber-50 text-amber-700 border-amber-100',
  };
};

const getResultSummary = (result: AdminExamResultItem, questions: any[]) => {
  return questions.reduce((summary, question, index) => {
    const answer = getAnswerForQuestion(result, question, index);
    const hasAnswer = Boolean(String(answer?.answer ?? '').trim());

    if (!hasAnswer) {
      summary.unansweredCount += 1;
      return summary;
    }

    if (isPendingReviewAnswer(answer)) {
      summary.pendingCount += 1;
      return summary;
    }

    if (answer?.isCorrect) {
      summary.correctCount += 1;
      return summary;
    }

    summary.incorrectCount += 1;
    return summary;
  }, {
    correctCount: 0,
    incorrectCount: 0,
    unansweredCount: 0,
    pendingCount: 0,
  });
};

const isPendingReviewAnswer = (answer?: { answer?: string; status?: 'graded' | 'pending'; isCorrect?: boolean } | null) => {
  if (!String(answer?.answer ?? '').trim()) {
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

const getOpenEndedReviewStatusLabel = (answer?: { answer?: string; status?: 'graded' | 'pending'; isCorrect?: boolean } | null) => (
  isPendingReviewAnswer(answer) ? 'Təyin edilməyib' : 'Yoxlanılıb'
);

const getAnswerStatusMeta = (answer?: { answer?: string; status?: 'graded' | 'pending'; isCorrect?: boolean } | null) => {
  if (!String(answer?.answer ?? '').trim()) {
    return {
      label: 'Cavab yoxdur',
      className: 'border-slate-200 bg-slate-50 text-slate-600',
      icon: XCircle,
    };
  }

  if (isPendingReviewAnswer(answer)) {
    return {
      label: 'Yoxlanılır',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
      icon: Loader2,
    };
  }

  if (answer?.isCorrect) {
    return {
      label: 'Düzgün',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      icon: CheckCircle2,
    };
  }

  return {
    label: 'Yanlış',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
    icon: XCircle,
  };
};

const AdminExamPanel = () => {
    const { t } = useTranslation();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [publishedExams, setPublishedExams] = useState<PublishedExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminExamPanelTab>('create');
  const [draftSearch, setDraftSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<HistoryStatusFilter>('all');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [accessCodeMap, setAccessCodeMap] = useState<Record<string, string>>(() => readAccessCodeCache());
  const deferredDraftSearch = useDeferredValue(draftSearch);
  const deferredHistorySearch = useDeferredValue(historySearch);
  const [publishForm, setPublishForm] = useState({
    title: '',
    duration: '60',
    startsAt: '',
    accessCode: '',
    isStudentVisible: true
  });

  const loadData = async () => {
    setLoading(true);

    try {
      const response = await adminApi.getExamPanelData();

      if (response.success) {
        setDrafts(response.data?.drafts || []);
        setPublishedExams(response.data?.publishedExams || []);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'İmtahan paneli yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDrafts = useMemo(() => {
    const query = deferredDraftSearch.trim().toLowerCase();

    if (!query) {
      return drafts;
    }

    return drafts.filter((draft) => {
      const instructorName = `${draft.instructor?.name || ''} ${draft.instructor?.surname || ''}`.trim();
      return [draft.title, instructorName, draft.instructor?.email || '', draft.workflowStatus || '']
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [deferredDraftSearch, drafts]);

  const selectedDrafts = useMemo(() => drafts.filter((draft) => selectedDraftIds.includes(String(draft._id))), [drafts, selectedDraftIds]);

  const selectedQuestionCount = useMemo(() => {
    return selectedDrafts.reduce((sum, draft) => sum + (draft.questions?.length || 0), 0);
  }, [selectedDrafts]);

  const activeExam = useMemo(() => {
    return publishedExams
      .filter((exam) => getExamLifecycleStatus(exam) === 'active')
      .sort((left, right) => new Date(left.startsAt || left.activatedAt || left.createdAt || 0).getTime() - new Date(right.startsAt || right.activatedAt || right.createdAt || 0).getTime())[0] || null;
  }, [publishedExams]);

  const filteredPublishedExams = useMemo(() => {
    const query = deferredHistorySearch.trim().toLowerCase();

    return publishedExams
      .filter((exam) => {
        const status = getExamLifecycleStatus(exam);
        const matchesSearch = !query || [exam.title, status, exam.isStudentVisible ? 'görünür' : 'gizlidir']
          .join(' ')
          .toLowerCase()
          .includes(query);

        const examDate = toDateInputValue(exam.startsAt || exam.activatedAt || exam.createdAt);
        const matchesStartDate = !historyStartDate || (examDate && examDate >= historyStartDate);
        const matchesEndDate = !historyEndDate || (examDate && examDate <= historyEndDate);
        const matchesStatus = historyStatusFilter === 'all' || status === historyStatusFilter;

        return matchesSearch && matchesStartDate && matchesEndDate && matchesStatus;
      })
      .sort((left, right) => new Date(right.startsAt || right.activatedAt || right.createdAt || 0).getTime() - new Date(left.startsAt || left.activatedAt || left.createdAt || 0).getTime());
  }, [deferredHistorySearch, historyEndDate, historyStartDate, historyStatusFilter, publishedExams]);

  const toggleDraftSelection = (draftId: string) => {
    setSelectedDraftIds((current) => (
      current.includes(draftId)
        ? current.filter((id) => id !== draftId)
        : [...current, draftId]
    ));
  };

  const handlePublish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedDraftIds.length === 0) {
      toast.error(t('admin._n_az__bir_m__llim_i', { defaultValue: 'Ən azı bir müəllim imtahanı seçin' }));
      return;
    }

    setPublishing(true);

    try {
      const response = await adminApi.publishExamFromDrafts({
        sourceDraftTestIds: selectedDraftIds,
        title: publishForm.title,
        duration: Number(publishForm.duration),
        startsAt: new Date(publishForm.startsAt).toISOString(),
        accessCode: publishForm.accessCode,
        isStudentVisible: publishForm.isStudentVisible
      });

      if (response.success) {
        const createdExamId = resolveEntityId(response.data?._id ?? response.data?.id);
        const nextAccessCodeMap = publishForm.accessCode.trim() && createdExamId
          ? {
              ...accessCodeMap,
              [createdExamId]: publishForm.accessCode.trim(),
            }
          : accessCodeMap;

        if (nextAccessCodeMap !== accessCodeMap) {
          setAccessCodeMap(nextAccessCodeMap);
          persistAccessCodeCache(nextAccessCodeMap);
        }

        toast.success(t('admin._mtahan_b_t_n_t_l_b_', { defaultValue: 'İmtahan bütün tələbələr üçün hazırlandı' }));
        setSelectedDraftIds([]);
        setPublishForm((current) => ({
          ...current,
          title: '',
          accessCode: ''
        }));
        setActiveTab('history');
        await loadData();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'İmtahan yayımlanmadı');
    } finally {
      setPublishing(false);
    }
  };

  const handleOpenExam = (exam: PublishedExamItem) => {
    const examId = resolveEntityId(exam._id ?? exam.id);

    if (!examId) {
      return;
    }

    navigate(`/exam-panel/history/${examId}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">İmtahan Paneli</p>
          <h1 className="mt-2 text-3xl font-black text-gray-900">{t('admin.m__llim_imtahanlar_n', { defaultValue: t('admin.m__llim_imtahanlar_n', { defaultValue: 'Müəllim imtahanlarını idarə et' }) })}</h1>
          <p className="mt-1 text-gray-500">{t('admin.layih_l_ri_se_ib_yay', { defaultValue: t('admin.layih_l_ri_se_ib_yay', { defaultValue: 'Layihələri seçib yayımlayın, daha sonra həmin imtahanları keçmiş imtahanlar bölməsində izləyin və nəticələri açın.' }) })}</p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-black text-gray-700 shadow-sm transition hover:border-[#D4AF37]/40 hover:text-[#A87A1F]"
        >
          <RefreshCw className="h-4 w-4" />
          {t('admin.yenil_', { defaultValue: t('admin.yenil_', { defaultValue: 'Yenilə' }) })}</button>
      </div>

      <div className="flex flex-wrap gap-3">
        {[
          { key: 'create', label: 'İmtahan yarat', count: drafts.length },
          { key: 'history', label: t('admin.ke_mi__imtahanlar', { defaultValue: 'Keçmiş imtahanlar' }), count: publishedExams.length },
        ].map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as AdminExamPanelTab)}
              className={[
                'inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition-all',
                isActive
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#A87A1F]'
                  : 'border-gray-100 bg-white text-gray-600 hover:border-[#D4AF37]/30 hover:text-[#A87A1F]',
              ].join(' ')}
            >
              {tab.label}
              <span className={[
                'rounded-full px-2.5 py-1 text-[11px]',
                isActive ? 'bg-[#D4AF37]/15 text-[#A87A1F]' : 'bg-gray-100 text-gray-500',
              ].join(' ')}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">{t('admin.g_zl_y_n_layih_l_r', { defaultValue: t('admin.g_zl_y_n_layih_l_r', { defaultValue: 'Gözləyən layihələr' }) })}</div>
          <div className="mt-3 text-3xl font-black text-gray-900">{drafts.length}</div>
          <div className="mt-1 text-sm text-gray-500">{t('admin.admin_bax_______n_g_', { defaultValue: t('admin.admin_bax_______n_g_', { defaultValue: 'Admin baxışı üçün gələn müəllim imtahanları' }) })}</div>
        </div>
        <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">{t('admin.se_il_n_suallar', { defaultValue: t('admin.se_il_n_suallar', { defaultValue: 'Seçilən suallar' }) })}</div>
          <div className="mt-3 text-3xl font-black text-gray-900">{selectedQuestionCount}</div>
          <div className="mt-1 text-sm text-gray-500">{t('admin.birl__diril_c_k_sual', { defaultValue: t('admin.birl__diril_c_k_sual', { defaultValue: 'Birləşdiriləcək sual sayı' }) })}</div>
        </div>
        <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">{t('admin.ke_mi__imtahanlar', { defaultValue: t('admin.ke_mi__imtahanlar', { defaultValue: 'Keçmiş imtahanlar' }) })}</div>
          <div className="mt-3 text-3xl font-black text-gray-900">{publishedExams.length}</div>
          <div className="mt-1 text-sm text-gray-500">{t('admin.yay_mlanm___v__arxiv', { defaultValue: t('admin.yay_mlanm___v__arxiv', { defaultValue: 'Yayımlanmış və arxivdə saxlanılan imtahanlar' }) })}</div>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_420px]">
          <section className="space-y-5">
            <div className="rounded-[32px] border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{t('admin.m__llim_g_nd_ri_l_ri', { defaultValue: t('admin.m__llim_g_nd_ri_l_ri', { defaultValue: 'Müəllim göndərişləri' }) })}</p>
                  <h2 className="mt-2 text-2xl font-black text-gray-900">{t('admin.se__v__birl__dir', { defaultValue: t('admin.se__v__birl__dir', { defaultValue: 'Seç və birləşdir' }) })}</h2>
                </div>
                <div className="relative max-w-md flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    value={draftSearch}
                    onChange={(event) => setDraftSearch(event.target.value)}
                    type="text"
                    placeholder={t('admin.ba_l_q_v__ya_m__llim', { defaultValue: 'Başlıq və ya müəllim ilə axtar...' })}
                    className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="rounded-[32px] border border-gray-100 bg-white p-10 text-center text-gray-500 shadow-sm">{t('admin._mtahan_g_nd_ri_l_ri', { defaultValue: t('admin._mtahan_g_nd_ri_l_ri', { defaultValue: 'İmtahan göndərişləri yüklənir...' }) })}</div>
            ) : filteredDrafts.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-gray-200 bg-white p-10 text-center italic text-gray-400">{t('admin.se_im____n_uy_un_m__', { defaultValue: t('admin.se_im____n_uy_un_m__', { defaultValue: 'Seçim üçün uyğun müəllim imtahanı tapılmadı.' }) })}</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredDrafts.map((draft) => {
                  const draftId = String(draft._id);
                  const isSelected = selectedDraftIds.includes(draftId);
                  const instructorName = `${draft.instructor?.name || ''} ${draft.instructor?.surname || ''}`.trim() || t('admin.nam_lum_m__llim', { defaultValue: 'Naməlum müəllim' });

                  return (
                    <button
                      key={draftId}
                      type="button"
                      onClick={() => toggleDraftSelection(draftId)}
                      className={`rounded-[28px] border p-5 text-left shadow-sm transition-all ${isSelected ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-gray-100 bg-white hover:border-[#D4AF37]/30 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isSelected ? 'bg-[#D4AF37] text-white' : 'bg-[#D4AF37]/10 text-[#A87A1F]'}`}>
                            {isSelected ? <Check className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-lg font-black text-gray-900">{draft.title}</div>
                            <div className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-gray-400">{instructorName}</div>
                          </div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${isSelected ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {isSelected ? 'Seçildi' : 'Seç'}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50 px-3 py-1">
                          <FileText className="h-3.5 w-3.5" />
                          {draft.questions?.length || 0} sual
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50 px-3 py-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateTime(draft.submittedAt || draft.createdAt)}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <span>{draft.instructor?.email || t('admin.e_po_t_yoxdur', { defaultValue: 'E-poçt yoxdur' })}</span>
                        <span className="font-bold capitalize text-[#A87A1F]">{String(draft.workflowStatus || 'draft').replace(/_/g, ' ')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <form onSubmit={handlePublish} className="rounded-[32px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">İmtahan yarat</p>
                <h2 className="mt-2 text-2xl font-black text-gray-900">{t('admin.yay_mlama_formu', { defaultValue: t('admin.yay_mlama_formu', { defaultValue: 'Yayımlama formu' }) })}</h2>
              <p className="mt-1 text-sm text-gray-500">{t('admin.bu_b_lm__yaln_z_m__l', { defaultValue: t('admin.bu_b_lm__yaln_z_m__l', { defaultValue: 'Bu bölmə yalnız müəllim layihələrini seçib yekun imtahan yaratmaq üçündür. Yayımlanmış imtahanlar keçmiş imtahanlar bölməsində saxlanılır.' }) })}</p>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600">
                  {selectedDraftIds.length} {t('admin.m__llim_imtahan__se_', { defaultValue: t('admin.m__llim_imtahan__se_', { defaultValue: 'müəllim imtahanı seçilib,' }) })}{selectedQuestionCount} {t('admin.sual_birl__diril_c_k', { defaultValue: t('admin.sual_birl__diril_c_k', { defaultValue: 'sual birləşdiriləcək.' }) })}</div>

                <label className="block space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 italic">{t('admin._mtahan_ad_', { defaultValue: t('admin._mtahan_ad_', { defaultValue: 'İmtahan adı' }) })}</span>
                  <input
                    required
                    value={publishForm.title}
                    onChange={(event) => setPublishForm((current) => ({ ...current, title: event.target.value }))}
                    type="text"
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-[#D4AF37] focus:bg-white"
                    placeholder={t('admin.m_s_l_n__aprel_yekun', { defaultValue: 'Məsələn: Aprel yekun imtahanı' })}
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 italic">{t('admin.m_dd_t', { defaultValue: t('admin.m_dd_t', { defaultValue: 'Müddət' }) })}</span>
                    <input
                      required
                      min="1"
                      value={publishForm.duration}
                      onChange={(event) => setPublishForm((current) => ({ ...current, duration: event.target.value }))}
                      type="number"
                      className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-[#D4AF37] focus:bg-white"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 italic">{t('admin._ifr_', { defaultValue: t('admin._ifr_', { defaultValue: 'Şifrə' }) })}</span>
                    <input
                      required
                      value={publishForm.accessCode}
                      onChange={(event) => setPublishForm((current) => ({ ...current, accessCode: event.target.value }))}
                      type="text"
                      className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-[#D4AF37] focus:bg-white"
                      placeholder={t('admin.m_s_l_n__exam_2026', { defaultValue: 'Məsələn: EXAM-2026' })}
                    />
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 italic">{t('admin.ba_lama_vaxt_', { defaultValue: t('admin.ba_lama_vaxt_', { defaultValue: 'Başlama vaxtı' }) })}</span>
                  <input
                    required
                    value={publishForm.startsAt}
                    onChange={(event) => setPublishForm((current) => ({ ...current, startsAt: event.target.value }))}
                    type="datetime-local"
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-[#D4AF37] focus:bg-white"
                  />
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <input
                    checked={publishForm.isStudentVisible}
                    onChange={(event) => setPublishForm((current) => ({ ...current, isStudentVisible: event.target.checked }))}
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <span>
                    <span className="block text-sm font-black text-gray-900">{t('admin.t_l_b__panelind__g_s', { defaultValue: t('admin.t_l_b__panelind__g_s', { defaultValue: 'Tələbə panelində göstər' }) })}</span>
                    <span className="mt-1 block text-xs text-gray-500">{t('admin.aktivdirs__imtahan_p', { defaultValue: t('admin.aktivdirs__imtahan_p', { defaultValue: 'Aktivdirsə imtahan paneldə əvvəlcədən görünəcək, amma start vaxtına qədər açıla bilməyəcək.' }) })}</span>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={publishing || selectedDraftIds.length === 0}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-white shadow-xl shadow-[#D4AF37]/20 transition-all hover:bg-[#B88A1B] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
              >
                <Shield className="h-4 w-4" />
                  {publishing ? 'Hazırlanır...' : 'Yekun imtahanı yayımla'}
              </button>
            </form>

            <section className="rounded-[32px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Arxiv qeydi</p>
              <h2 className="mt-2 text-2xl font-black text-gray-900">{t('admin.yay_mlanan_imtahanla', { defaultValue: t('admin.yay_mlanan_imtahanla', { defaultValue: 'Yayımlanan imtahanlar arxivə düşür' }) })}</h2>
              <p className="mt-2 text-sm text-gray-500">{t('admin._mtahan_yay_mland_qd', { defaultValue: t('admin._mtahan_yay_mland_qd', { defaultValue: 'İmtahan yayımlandıqdan sonra iş siyahısından çıxmır, ayrıca `Keçmiş imtahanlar` bölməsində saxlanılır. Bitmiş imtahana klik etdikdə iştirakçı və cavab detalları ayrıca səhifədə açılır.' }) })}</p>
            </section>
          </aside>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-[32px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{t('admin.haz_rda_aktiv_imtaha', { defaultValue: t('admin.haz_rda_aktiv_imtaha', { defaultValue: 'Hazırda aktiv imtahan' }) })}</p>
                <h2 className="mt-2 text-2xl font-black text-gray-900">Aktiv kart</h2>
                <p className="mt-1 text-sm text-gray-500">{t('admin.ba_lama_vaxt___atm__', { defaultValue: t('admin.ba_lama_vaxt___atm__', { defaultValue: 'Başlama vaxtı çatmış imtahan burada ayrıca görünür və şifrəsi bu brauzerdə saxlanılır.' }) })}</p>
              </div>
              {activeExam ? (
                <button
                  type="button"
                  onClick={() => handleOpenExam(activeExam)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 text-sm font-black text-[#A87A1F] sm:w-auto"
                >
                  {t('admin._trafl__bax', { defaultValue: t('admin._trafl__bax', { defaultValue: 'Ətraflı bax' }) })}<ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {!activeExam ? (
              <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">{t('admin.haz_rda_aktiv_imtaha', { defaultValue: t('admin.haz_rda_aktiv_imtaha', { defaultValue: 'Hazırda aktiv imtahan yoxdur. Planlaşdırılmış və bitmiş imtahanlar aşağıdakı siyahıda görünür.' }) })}</div>
            ) : (
              <div className="mt-5 rounded-[28px] border border-[#D4AF37]/20 bg-[#FFF9E7] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-amber-700">Aktiv</div>
                    <h3 className="mt-3 text-2xl font-black text-gray-900">{activeExam.title}</h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-gray-600">
                      <span className="rounded-full bg-white px-3 py-1">{formatDateTime(activeExam.startsAt)}</span>
                      <span className="rounded-full bg-white px-3 py-1">{activeExam.duration} {t('admin.d_q', { defaultValue: t('admin.d_q', { defaultValue: 'dəq' }) })}</span>
                      <span className="rounded-full bg-white px-3 py-1">{activeExam.isStudentVisible ? 'Paneldə görünür' : 'Gizlidir'}</span>
                    </div>
                  </div>

                  <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-md">
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-gray-700">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-gray-400">{t('admin._ifr_', { defaultValue: t('admin._ifr_', { defaultValue: 'Şifrə' }) })}</div>
                      <div className="mt-2 inline-flex items-center gap-2 break-all text-sm text-gray-900 sm:text-base">
                        <KeyRound className="h-4 w-4 text-[#A87A1F]" />
                        {accessCodeMap[resolveEntityId(activeExam._id ?? activeExam.id)] || t('admin.bu_brauzerd__saxlanm', { defaultValue: 'Bu brauzerdə saxlanmayıb' })}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-gray-700">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-gray-400">{t('admin.n_tic_l_r', { defaultValue: t('admin.n_tic_l_r', { defaultValue: 'Nəticələr' }) })}</div>
                      <div className="mt-2 text-base text-gray-900">{activeExam.resultsCount} {t('admin.i_tirak', { defaultValue: t('admin.i_tirak', { defaultValue: 'iştirak' }) })}</div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-gray-700">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-gray-400">{t('admin.t_yin_olunan_t_l_b_', { defaultValue: t('admin.t_yin_olunan_t_l_b_', { defaultValue: 'Təyin olunan tələbə' }) })}</div>
                      <div className="mt-2 text-base text-gray-900">{activeExam.assignedStudentsCount}</div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-gray-700">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-gray-400">{t('admin.g_zl_y_n_yoxlama', { defaultValue: t('admin.g_zl_y_n_yoxlama', { defaultValue: 'Gözləyən yoxlama' }) })}</div>
                      <div className="mt-2 text-base text-gray-900">{activeExam.pendingReviewCount}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[32px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{t('admin.ke_mi__imtahanlar', { defaultValue: t('admin.ke_mi__imtahanlar', { defaultValue: 'Keçmiş imtahanlar' }) })}</p>
                <h2 className="mt-2 text-2xl font-black text-gray-900">{t('admin.yay_mlanm___imtahan_', { defaultValue: t('admin.yay_mlanm___imtahan_', { defaultValue: 'Yayımlanmış imtahan arxivi' }) })}</h2>
                <p className="mt-1 text-sm text-gray-500">{t('admin.burada_yay_mlanm___b', { defaultValue: t('admin.burada_yay_mlanm___b', { defaultValue: 'Burada yayımlanmış bütün imtahanları tarix və status üzrə süzə bilərsiniz.' }) })}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={historySearch}
                    onChange={(event) => setHistorySearch(event.target.value)}
                    type="text"
                    placeholder="İmtahan axtar..."
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-[#D4AF37] focus:bg-white"
                  />
                </div>
                <select
                  value={historyStatusFilter}
                  onChange={(event) => setHistoryStatusFilter(event.target.value as HistoryStatusFilter)}
                  className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600 outline-none transition-all focus:border-[#D4AF37] focus:bg-white"
                >
                  <option value="all">{t('admin.b_t_n_statuslar', { defaultValue: t('admin.b_t_n_statuslar', { defaultValue: 'Bütün statuslar' }) })}</option>
                  <option value="planned">{t('admin.planla_d_r_lm__', { defaultValue: t('admin.planla_d_r_lm__', { defaultValue: 'Planlaşdırılmış' }) })}</option>
                  <option value="active">Aktiv</option>
                  <option value="completed">{t('admin.bitmi_', { defaultValue: t('admin.bitmi_', { defaultValue: 'Bitmiş' }) })}</option>
                </select>
                <input
                  value={historyStartDate}
                  onChange={(event) => setHistoryStartDate(event.target.value)}
                  type="date"
                  className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600 outline-none transition-all focus:border-[#D4AF37] focus:bg-white"
                />
                <input
                  value={historyEndDate}
                  onChange={(event) => setHistoryEndDate(event.target.value)}
                  type="date"
                  className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600 outline-none transition-all focus:border-[#D4AF37] focus:bg-white"
                />
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {loading ? (
                <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-gray-50 p-10 text-center text-gray-500">{t('admin.ke_mi__imtahanlar_y_', { defaultValue: t('admin.ke_mi__imtahanlar_y_', { defaultValue: 'Keçmiş imtahanlar yüklənir...' }) })}</div>
              ) : filteredPublishedExams.length === 0 ? (
                <div className="xl:col-span-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center italic text-gray-400">{t('admin.filtr__uy_un_yay_mla', { defaultValue: t('admin.filtr__uy_un_yay_mla', { defaultValue: 'Filtrə uyğun yayımlanmış imtahan tapılmadı.' }) })}</div>
              ) : (
                filteredPublishedExams.map((exam) => {
                  const examId = resolveEntityId(exam._id ?? exam.id);
                  const status = getExamLifecycleStatus(exam);
                  const statusMeta = getExamStatusMeta(status);

                  return (
                    <button
                      key={examId}
                      type="button"
                      onClick={() => handleOpenExam(exam)}
                      className="rounded-[28px] border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:border-[#D4AF37]/30 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${statusMeta.className}`}>
                            {statusMeta.label}
                          </div>
                          <div className="mt-3 text-xl font-black text-gray-900">{exam.title}</div>
                          <div className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-gray-400">{formatDateTime(exam.startsAt || exam.activatedAt || exam.createdAt)}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div className="rounded-xl bg-gray-50 px-3 py-2 font-bold">{exam.duration} {t('admin.d_q', { defaultValue: t('admin.d_q', { defaultValue: 'dəq' }) })}</div>
                        <div className="rounded-xl bg-gray-50 px-3 py-2 font-bold">{exam.questions?.length || 0} sual</div>
                        <div className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 font-bold"><Users className="h-3.5 w-3.5" /> {exam.assignedStudentsCount} {t('admin.t_l_b_', { defaultValue: t('admin.t_l_b_', { defaultValue: 'tələbə' }) })}</div>
                        <div className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 font-bold"><FileText className="h-3.5 w-3.5" /> {exam.resultsCount} {t('admin.n_tic_', { defaultValue: t('admin.n_tic_', { defaultValue: 'nəticə' }) })}</div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
                        <span className="rounded-full bg-gray-50 px-3 py-1">{exam.pendingReviewCount} yoxlanacaq</span>
                        <span className="rounded-full bg-gray-50 px-3 py-1">{exam.completedResultsCount} {t('admin.tamamlanm___n_tic_', { defaultValue: t('admin.tamamlanm___n_tic_', { defaultValue: 'tamamlanmış nəticə' }) })}</span>
                        <span className="rounded-full bg-gray-50 px-3 py-1">{exam.isStudentVisible ? 'Görünür' : 'Gizlidir'}</span>
                        <span className="rounded-full bg-gray-50 px-3 py-1">{accessCodeMap[examId] || (exam.hasAccessCode ? 'Şifrə saxlanmayıb' : 'Şifrəsiz')}</span>
                      </div>

                      {status === 'completed' ? (
                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#A87A1F]">
                          {t('admin.bitmi__imtahan_n_i_t', { defaultValue: t('admin.bitmi__imtahan_n_i_t', { defaultValue: 'Bitmiş imtahanın iştirakçılarını aç' }) })}<ArrowRight className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="mt-4 text-sm font-bold text-gray-500">{t('admin._mtahan_n__mumi_v_zi', { defaultValue: t('admin._mtahan_n__mumi_v_zi', { defaultValue: 'İmtahanın ümumi vəziyyətini aç' }) })}</div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminExamPanel;
