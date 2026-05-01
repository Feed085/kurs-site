import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, Loader2, XCircle } from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import StudentExamPanelTabBar from '@/components/student/StudentExamPanelTabBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  type PanelData,
  type PanelQuestion,
  type PanelResult,
  type PanelResultAnswer,
  type PanelTestDetail,
  fetchAuthorizedData,
  formatDate,
  formatPercentage,
  getCorrectAnswerLabel,
  getEntityId,
  getMultipleChoiceCorrectAnswerIndex,
  getResultStatusMeta,
  getStudentAnswerLabel,
  isPendingReviewAnswer,
  normalizeMultipleChoiceAnswerIndex,
  safeNumber,
} from '@/pages/student-exam-panel/shared';

const getAnswerStatusMeta = (answer?: PanelResultAnswer) => {
  if (!answer?.answer?.trim()) {
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

  if (answer.isCorrect) {
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

const getQuestionAnswer = (result: PanelResult, question: PanelQuestion, index: number) => {
  const normalizedQuestionId = getEntityId(question);
  const answers = result.answers || [];
  const exactAnswer = answers.find((answer) => String(answer.questionId || '') === normalizedQuestionId);
  return exactAnswer || answers[index];
};

export default function StudentExamAnswerKeyDetail() {
  const navigate = useNavigate();
  const { resultId } = useParams<{ resultId: string }>();

  const [result, setResult] = useState<PanelResult | null>(null);
  const [testDetail, setTestDetail] = useState<PanelTestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAnswerKeyDetail = async () => {
      const token = localStorage.getItem('rim_auth_token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      if (!resultId) {
        setLoadError('Cavab açarı tapılmadı.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const [panelData, results] = await Promise.all([
          fetchAuthorizedData<PanelData>('/student/me', token),
          fetchAuthorizedData<PanelResult[]>('/tests/results/my', token),
        ]);

        const adminAssignedTestIds = new Set(
          (panelData.assignedTests || [])
            .filter((test) => test.isAdminAssigned)
            .map((test) => getEntityId(test))
            .filter(Boolean)
        );

        const matchedResult = results.find((entry) => getEntityId(entry) === resultId);

        if (!matchedResult) {
          throw new Error('Cavab açarı tapılmadı.');
        }

        const testId = getEntityId(matchedResult.test);

        if (!testId || !adminAssignedTestIds.has(testId)) {
          throw new Error('Bu cavab açarı yalnız admin tərəfindən təsdiqlənmiş imtahanlar üçün əlçatandır.');
        }

        const detail = await fetchAuthorizedData<PanelTestDetail>(`/tests/${testId}`, token);

        if (!isMounted) {
          return;
        }

        setResult(matchedResult);
        setTestDetail(detail);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setResult(null);
        setTestDetail(null);
        setLoadError(error instanceof Error ? error.message : 'Cavab açarı yüklənmədi.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAnswerKeyDetail();

    return () => {
      isMounted = false;
    };
  }, [navigate, resultId]);

  const summary = useMemo(() => {
    if (!result) {
      return {
        correctCount: 0,
        pendingCount: 0,
        incorrectCount: 0,
      };
    }

    const answers = result.answers || [];
    const correctCount = answers.filter((answer) => !isPendingReviewAnswer(answer) && answer.isCorrect).length;
    const pendingCount = answers.filter((answer) => isPendingReviewAnswer(answer)).length;
    const gradedCount = answers.filter((answer) => !isPendingReviewAnswer(answer)).length;

    return {
      correctCount,
      pendingCount,
      incorrectCount: Math.max(0, gradedCount - correctCount),
    };
  }, [result]);

  const handleGoBack = () => {
    navigate('/exam-panel/keys');
  };

  const renderQuestionCard = (question: PanelQuestion, index: number) => {
    if (!result) {
      return null;
    }

    const answer = getQuestionAnswer(result, question, index);
    const answerStatusMeta = getAnswerStatusMeta(answer);
    const AnswerStatusIcon = answerStatusMeta.icon;
    const studentAnswerLabel = getStudentAnswerLabel(question, answer?.answer);
    const correctAnswerLabel = getCorrectAnswerLabel(question);
    const studentAnswerIndex = normalizeMultipleChoiceAnswerIndex(answer?.answer);
    const correctAnswerIndex = getMultipleChoiceCorrectAnswerIndex(question);

    return (
      <Card key={getEntityId(question) || `${index}`} className="overflow-hidden border-slate-100 bg-white/95 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/80">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
              Sual {index + 1}
            </Badge>
            <Badge className="bg-[#D4AF37]/10 text-[#A87A1F] hover:bg-[#D4AF37]/10">
              {question.answerType === 'multiple_choice' ? 'Qapalı sual' : 'Açıq sual'}
            </Badge>
            <Badge variant="outline" className={cn('border', answerStatusMeta.className)}>
              <AnswerStatusIcon className={cn('mr-1 h-3.5 w-3.5', isPendingReviewAnswer(answer) ? 'animate-spin' : '')} />
              {answerStatusMeta.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <div className="text-sm font-medium leading-6 text-slate-900">
            {question.questionType === 'image' ? (
              question.content ? (
                <img
                  src={question.content}
                  alt={`Sual ${index + 1}`}
                  className="max-h-72 rounded-2xl border border-slate-100 object-cover"
                />
              ) : (
                <p>Sual məzmunu tapılmadı.</p>
              )
            ) : (
              <p>{question.content || 'Sual məzmunu tapılmadı.'}</p>
            )}
          </div>

          {question.answerType === 'multiple_choice' && Array.isArray(question.options) && question.options.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {question.options.map((option, optionIndex) => {
                const isCorrect = correctAnswerIndex !== null && correctAnswerIndex === optionIndex;
                const isSelected = studentAnswerIndex !== null && studentAnswerIndex === optionIndex;

                return (
                  <div
                    key={`${getEntityId(question)}-${optionIndex}`}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-sm transition-colors',
                      isCorrect
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : isSelected
                          ? 'border-amber-200 bg-amber-50 text-amber-800'
                          : 'border-slate-100 bg-slate-50 text-slate-600'
                    )}
                  >
                    <span className="font-semibold">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sizin cavabınız</div>
              <div className="mt-2 text-sm font-medium text-slate-900">{studentAnswerLabel}</div>
            </div>
            <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A87A1F]/80">Düzgün cavab</div>
              <div className="mt-2 text-sm font-medium text-slate-900">{correctAnswerLabel}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900">
      <Navbar />
      <main className="pt-16 lg:pt-20">
        <StudentExamPanelTabBar activePath="/exam-panel/keys" />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoBack}
              className="rounded-xl border-slate-200 bg-white text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri qayıt
            </Button>
          </div>

          {loadError ? (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {loadError}
            </div>
          ) : null}

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-52 w-full rounded-[2rem]" />
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-72 w-full rounded-[1.75rem]" />
              ))}
            </div>
          ) : result && testDetail ? (
            <div className="space-y-8">
              <Card className="overflow-hidden border-slate-100 bg-white/95 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/80">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn('border', getResultStatusMeta(result).className)}>
                          {getResultStatusMeta(result).label}
                        </Badge>
                        <Badge variant="outline" className="border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#A87A1F]">
                          Admin təsdiqli
                        </Badge>
                      </div>
                      <CardTitle className="mt-3 text-2xl font-black text-slate-900 lg:text-3xl">
                        {result.test?.title || testDetail.title || 'Cavab açarı'}
                      </CardTitle>
                      <CardDescription className="mt-2 text-slate-600">
                        {result.test?.course?.title || testDetail.course?.title || 'Kurs məlumatı yoxdur'}
                      </CardDescription>
                    </div>

                    <div className="rounded-3xl bg-white px-5 py-4 text-right shadow-inner shadow-slate-100/80">
                      <div className="text-3xl font-black text-slate-900">{formatPercentage(safeNumber(result.scorePercentage))}</div>
                      <div className="text-xs font-medium text-slate-500">Yekun nəticə</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 p-6">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                      <Clock3 className="h-4 w-4" />
                      {formatDate(result.completedAt || result.createdAt)}
                    </span>
                    {testDetail.duration ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                        <Clock3 className="h-4 w-4" />
                        {testDetail.duration} dəqiqə
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>Bal göstəricisi</span>
                      <span>{summary.correctCount} düzgün · {summary.pendingCount} gözləmədə</span>
                    </div>
                    <Progress value={Math.max(0, Math.min(100, safeNumber(result.scorePercentage)))} className="h-2" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-center">
                      <div className="text-2xl font-black text-emerald-700">{summary.correctCount}</div>
                      <div className="text-xs text-emerald-700/80">Düzgün</div>
                    </div>
                    <div className="rounded-2xl bg-rose-50 px-4 py-4 text-center">
                      <div className="text-2xl font-black text-rose-700">{summary.incorrectCount}</div>
                      <div className="text-xs text-rose-700/80">Yanlış</div>
                    </div>
                    <div className="rounded-2xl bg-amber-50 px-4 py-4 text-center">
                      <div className="text-2xl font-black text-amber-700">{summary.pendingCount}</div>
                      <div className="text-xs text-amber-700/80">Gözləmədə</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <section className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Sual və cavab xülasəsi</h2>
                  <p className="mt-1 text-sm text-slate-500">Hər sual üzrə verdiyiniz cavabı və düzgün nəticəni aşağıda görə bilərsiniz.</p>
                </div>

                {(testDetail.questions || []).length > 0 ? (
                  <div className="space-y-4">
                    {(testDetail.questions || []).map((question, index) => renderQuestionCard(question, index))}
                  </div>
                ) : (
                  <Card className="border-dashed border-slate-200 bg-white/95 shadow-none">
                    <CardContent className="px-6 py-10 text-center text-sm text-slate-500">
                      Bu imtahan üçün sual detalları tapılmadı.
                    </CardContent>
                  </Card>
                )}
              </section>
            </div>
          ) : (
            <Card className="border-slate-100 bg-white/95 shadow-sm">
              <CardContent className="px-6 py-10 text-center text-sm text-slate-500">
                Cavab açarı məlumatı tapılmadı.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}