import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Search,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../services/api';

type AdminExamResultResponse = Awaited<ReturnType<typeof adminApi.getTestResults>>;
type AdminExamTestDetail = NonNullable<AdminExamResultResponse['data']>['test'];
type AdminExamResultItem = NonNullable<AdminExamResultResponse['data']>['results'][number];

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

const formatAttemptLabel = (attemptNumber: number) => {
  if (attemptNumber === 1) return '1-ci cəhd';
  if (attemptNumber === 2) return '2-ci cəhd';
  if (attemptNumber === 3) return '3-cü cəhd';
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

export default function AdminExamHistoryDetail() {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();

  const [examData, setExamData] = useState<AdminExamTestDetail | null>(null);
  const [results, setResults] = useState<AdminExamResultItem[]>([]);
  const [selectedResultId, setSelectedResultId] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const deferredParticipantSearch = useDeferredValue(participantSearch);

  useEffect(() => {
    let isMounted = true;

    const loadExamResults = async () => {
      if (!examId) {
        setLoadError('İmtahan tapılmadı.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError('');

      try {
        const response = await adminApi.getTestResults(examId);

        if (!response.success) {
          throw new Error(response.message || 'İmtahan nəticələri alınmadı');
        }

        if (!isMounted) {
          return;
        }

        const nextResults = response.data?.results || [];
        setExamData(response.data?.test || null);
        setResults(nextResults);
        setSelectedResultId(resolveEntityId(nextResults[0]?.id));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'İmtahan nəticələri alınmadı';
        setLoadError(message);
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadExamResults();

    return () => {
      isMounted = false;
    };
  }, [examId]);

  const filteredResults = useMemo(() => {
    const query = deferredParticipantSearch.trim().toLowerCase();

    if (!query) {
      return results;
    }

    return results.filter((result) => (
      [
        result.student?.name || '',
        result.student?.surname || '',
        result.student?.email || '',
        formatAttemptLabel(result.attemptNumber || 1),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    ));
  }, [deferredParticipantSearch, results]);

  const selectedResult = useMemo(() => {
    return results.find((result) => resolveEntityId(result.id) === selectedResultId) || null;
  }, [results, selectedResultId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/exam-panel')}
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-[#A87A1F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Keçmiş imtahanlara qayıt
          </button>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Bitmiş imtahan baxışı</p>
          <h1 className="mt-2 text-3xl font-black text-gray-900">{examData?.title || 'İmtahan nəticələri'}</h1>
          <p className="mt-1 text-gray-500">Bu səhifədə iştirak edən tələbələri və onların cavab detallarını ayrıca izləyə bilərsiniz.</p>
        </div>

        {examData ? (
          <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">{examData.duration} dəqiqə</span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">{(examData.questions || []).length} sual</span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">{results.length} iştirak</span>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="rounded-[32px] border border-gray-100 bg-white p-10 text-center text-gray-500 shadow-sm">İmtahan nəticələri yüklənir...</div>
      ) : loadError ? (
        <div className="rounded-[32px] border border-rose-100 bg-rose-50 p-6 text-sm font-bold text-rose-700 shadow-sm">{loadError}</div>
      ) : (
        <>
          <section className="rounded-[32px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">İştirak etmiş tələbələr</p>
                <h2 className="mt-2 text-2xl font-black text-gray-900">Nəticə siyahısı</h2>
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={participantSearch}
                  onChange={(event) => setParticipantSearch(event.target.value)}
                  type="text"
                  placeholder="Tələbə axtar..."
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-[#D4AF37] focus:bg-white"
                />
              </div>
            </div>

            {filteredResults.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center italic text-gray-400">Bu imtahan üzrə nəticə tapılmadı.</div>
            ) : (
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {filteredResults.map((result) => {
                  const resultId = resolveEntityId(result.id);
                  const summary = getResultSummary(result, examData?.questions || []);
                  const isSelected = selectedResultId === resultId;

                  return (
                    <button
                      key={resultId}
                      type="button"
                      onClick={() => setSelectedResultId(resultId)}
                      className={`rounded-[28px] border p-5 text-left shadow-sm transition-all ${isSelected ? 'border-[#D4AF37] bg-[#FFF9E7]' : 'border-gray-100 bg-gray-50 hover:border-[#D4AF37]/30 hover:bg-white'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-black text-gray-900">{result.student?.name} {result.student?.surname || ''}</div>
                          <div className="mt-1 text-sm text-gray-500">{result.student?.email || 'E-poçt yoxdur'}</div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2 text-right">
                          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">Nəticə</div>
                          <div className="mt-1 text-lg font-black text-gray-900">{Math.round(Number(result.scorePercentage || 0))}%</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
                        <span className="rounded-full bg-white px-3 py-1">{formatAttemptLabel(result.attemptNumber || 1)}</span>
                        <span className="rounded-full bg-white px-3 py-1">{formatDateTime(result.completedAt || result.createdAt)}</span>
                        <span className="rounded-full bg-white px-3 py-1">{result.hasPendingAnswers ? 'Yoxlanacaq cavab var' : 'Tam yoxlanıb'}</span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600 sm:grid-cols-4">
                        <div className="rounded-xl bg-white px-3 py-2 font-bold text-emerald-700">{summary.correctCount} doğru</div>
                        <div className="rounded-xl bg-white px-3 py-2 font-bold text-rose-700">{summary.incorrectCount} səhv</div>
                        <div className="rounded-xl bg-white px-3 py-2 font-bold text-slate-700">{summary.unansweredCount} boş</div>
                        <div className="rounded-xl bg-white px-3 py-2 font-bold text-amber-700">{summary.pendingCount} yoxlanacaq</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {selectedResult && examData ? (
            <section className="rounded-[32px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Tələbə cavab detalı</p>
                  <h2 className="mt-2 text-2xl font-black text-gray-900">{selectedResult.student?.name} {selectedResult.student?.surname || ''}</h2>
                  <p className="mt-1 text-sm text-gray-500">Sual-sual səhv, boş və yoxlanacaq cavablar burada görünür.</p>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
                  <span className="rounded-full bg-gray-50 px-3 py-1">{formatAttemptLabel(selectedResult.attemptNumber || 1)}</span>
                  <span className="rounded-full bg-gray-50 px-3 py-1">{Math.round(Number(selectedResult.scorePercentage || 0))}% nəticə</span>
                  <span className="rounded-full bg-gray-50 px-3 py-1">{formatDateTime(selectedResult.completedAt || selectedResult.createdAt)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {(examData.questions || []).map((question: AdminExamTestDetail['questions'][number], index: number) => {
                  const answer = getAnswerForQuestion(selectedResult, question, index);
                  const answerStatusMeta = getAnswerStatusMeta(answer);
                  const AnswerStatusIcon = answerStatusMeta.icon;
                  const selectedAnswerIndex = normalizeMultipleChoiceAnswerIndex(answer?.answer);
                  const correctAnswerIndex = getMultipleChoiceCorrectAnswerIndex(question);
                  const hasAnswer = Boolean(String(answer?.answer ?? '').trim());

                  return (
                    <article key={getQuestionLookupKey(question, index)} className="overflow-hidden rounded-[28px] border border-gray-100 bg-gray-50 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-white px-5 py-4">
                        <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-gray-500">Sual {index + 1}</span>
                        <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#A87A1F]">{question.answerType === 'multiple_choice' ? 'Qapalı sual' : 'Açıq sual'}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${answerStatusMeta.className}`}>
                          <AnswerStatusIcon className={`h-3.5 w-3.5 ${isPendingReviewAnswer(answer) ? 'animate-spin' : ''}`} />
                          {answerStatusMeta.label}
                        </span>
                      </div>

                      <div className="space-y-5 p-5">
                        <div className="text-sm font-semibold leading-6 text-gray-900">
                          {question.questionType === 'image' ? (
                            question.content ? (
                              <img src={question.content} alt={`Sual ${index + 1}`} className="max-h-72 rounded-2xl border border-gray-100 object-cover" />
                            ) : (
                              <p>Sual şəkli tapılmadı.</p>
                            )
                          ) : (
                            <p>{question.content || 'Sual mətni tapılmadı.'}</p>
                          )}
                        </div>

                        {question.answerType === 'multiple_choice' && Array.isArray(question.options) && question.options.length > 0 ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {question.options.map((option: string, optionIndex: number) => {
                              const isCorrect = correctAnswerIndex !== null && correctAnswerIndex === optionIndex;
                              const isSelected = selectedAnswerIndex !== null && selectedAnswerIndex === optionIndex;

                              return (
                                <div
                                  key={`${getQuestionLookupKey(question, index)}-${optionIndex}`}
                                  className={[
                                    'rounded-xl border px-3 py-3 text-sm break-words transition-colors',
                                    isCorrect
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                      : isSelected
                                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                                        : 'border-gray-100 bg-white text-gray-600',
                                  ].join(' ')}
                                >
                                  <span className="font-semibold">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="rounded-2xl border border-gray-100 bg-white p-4">
                            <div className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">Tələbənin cavabı</div>
                            <div className="mt-2 break-words text-sm font-medium text-gray-900">
                              {question.answerType === 'multiple_choice'
                                ? (hasAnswer ? formatMultipleChoiceAnswer(question, answer?.answer || '') : 'Cavab verilməyib')
                                : (answer?.answer || 'Cavab verilməyib')}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#FFF9E7] p-4">
                            <div className="text-xs font-black uppercase tracking-[0.16em] text-[#A87A1F]">Doğru cavab</div>
                            <div className="mt-2 break-words text-sm font-medium text-gray-900">
                              {question.answerType === 'multiple_choice'
                                ? (correctAnswerIndex !== null ? formatMultipleChoiceAnswer(question, String(correctAnswerIndex)) : 'Təyin edilməyib')
                                : (question.correctAnswer?.trim() || getOpenEndedReviewStatusLabel(answer))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}