import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  GraduationCap,
  KeyRound,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import StudentExamPanelTabBar from '@/components/student/StudentExamPanelTabBar';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  type PanelData,
  type PanelResult,
  type PanelTestSummary,
  type TabKey,
  fetchAuthorizedData,
  formatDate,
  formatDateTime,
  formatPercentage,
  getEntityId,
  getResultStatusMeta,
  isPendingReviewAnswer,
  safeNumber,
  studentExamPanelTabs,
} from '@/pages/student-exam-panel/shared';

const heroCopy: Record<TabKey, { badge: string; title: string; description: string; actionLabel: string; actionPath: string; }> = {
  exams: {
    badge: 'İmtahan baxışı',
    title: 'İmtahan paneliniz',
    description: 'Admin tərəfindən təsdiqlənmiş aktiv testləri izləyin və son nəticələrinizə baxın.',
    actionLabel: 'Nəticələrim',
    actionPath: '/exam-panel/results',
  },
  results: {
    badge: 'Tamamlanmış nəticələr',
    title: 'Nəticə tarixçəniz',
    description: 'Yalnız admin təsdiqli imtahanların yekun nəticələri burada toplanır.',
    actionLabel: 'İmtahanlara qayıt',
    actionPath: '/exam-panel',
  },
  keys: {
    badge: 'Cavab açarları',
    title: 'Açarları açın',
    description: 'Tamamlanan və admin tərəfindən təsdiqlənmiş imtahanların açarlarını ayrıca səhifədə yoxlayın.',
    actionLabel: 'Nəticələrim',
    actionPath: '/exam-panel/results',
  },
};

const getTestEndTime = (test: PanelTestSummary) => {
  const startsAtTime = test.startsAt ? new Date(test.startsAt).getTime() : null;
  const durationMinutes = Number(test.duration || 0);

  if (startsAtTime === null || !Number.isFinite(startsAtTime) || !Number.isFinite(durationMinutes)) {
    return null;
  }

  return startsAtTime + Math.max(0, durationMinutes) * 60 * 1000;
};

export default function StudentExamPanelPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [panelData, setPanelData] = useState<PanelData | null>(null);
  const [completedResults, setCompletedResults] = useState<PanelResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const activeTab = studentExamPanelTabs.find((tab) => location.pathname === tab.path) ?? studentExamPanelTabs[0];
  const hero = heroCopy[activeTab.key];

  useEffect(() => {
    let isMounted = true;

    const loadPanelData = async () => {
      const token = localStorage.getItem('rim_auth_token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const [profileResult, resultsResult] = await Promise.allSettled([
          fetchAuthorizedData<PanelData>('/student/me', token),
          fetchAuthorizedData<PanelResult[]>('/tests/results/my', token),
        ]);

        if (!isMounted) {
          return;
        }

        setPanelData(profileResult.status === 'fulfilled' ? profileResult.value : null);
        setCompletedResults(resultsResult.status === 'fulfilled' ? resultsResult.value : []);

        if (profileResult.status === 'rejected' || resultsResult.status === 'rejected') {
          setLoadError('Məlumatların bir hissəsi yüklənmədi. Panel mövcud verilənlərlə göstərilir.');
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPanelData(null);
        setCompletedResults([]);
        setLoadError(error instanceof Error ? error.message : 'Panel yüklənə bilmədi.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPanelData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const adminAssignedTests = useMemo(
    () => (panelData?.assignedTests ?? []).filter((test) => test.isAdminAssigned && test.isStudentVisible !== false),
    [panelData?.assignedTests]
  );

  const adminAssignedTestIds = useMemo(
    () => new Set(adminAssignedTests.map((test) => getEntityId(test)).filter(Boolean)),
    [adminAssignedTests]
  );

  const sortedAssignedTests = useMemo(
    () => [...adminAssignedTests].sort((left, right) => {
      const leftCompleted = Boolean(left.hasAttempted);
      const rightCompleted = Boolean(right.hasAttempted);

      if (leftCompleted !== rightCompleted) {
        return Number(leftCompleted) - Number(rightCompleted);
      }

      const leftDate = new Date(left.latestCompletedAt || left.createdAt || 0).getTime();
      const rightDate = new Date(right.latestCompletedAt || right.createdAt || 0).getTime();
      return rightDate - leftDate;
    }),
    [adminAssignedTests]
  );

  const activeTests = useMemo(
    () => sortedAssignedTests.filter((test) => {
      const endTime = getTestEndTime(test);
      const isExpired = Boolean(endTime && endTime <= currentTime);

      if (isExpired) {
        return false;
      }

      return !test.hasAttempted || test.allowRetake;
    }),
    [currentTime, sortedAssignedTests]
  );

  const expiredUnattemptedTests = useMemo(
    () => sortedAssignedTests.filter((test) => {
      const endTime = getTestEndTime(test);
      const isExpired = Boolean(endTime && endTime <= currentTime);

      return isExpired && !test.hasAttempted;
    }),
    [currentTime, sortedAssignedTests]
  );

  const sortedCompletedResults = useMemo(
    () => [...completedResults]
      .filter((result) => adminAssignedTestIds.has(getEntityId(result.test)))
      .sort((left, right) => {
        const leftDate = new Date(left.completedAt || left.createdAt || 0).getTime();
        const rightDate = new Date(right.completedAt || right.createdAt || 0).getTime();
        return rightDate - leftDate;
      }),
    [adminAssignedTestIds, completedResults]
  );

  const finalResults = useMemo(
    () => sortedCompletedResults.filter((result) => !result.hasPendingAnswers && !(result.answers || []).some((answer) => isPendingReviewAnswer(answer))),
    [sortedCompletedResults]
  );

  const activeTestsCount = activeTests.length;
  const completedTestsCount = sortedCompletedResults.length || panelData?.stats?.adminApprovedCompletedTestsCount || 0;
  const averageScore = finalResults.length > 0
    ? Math.round(finalResults.reduce((sum, result) => sum + safeNumber(result.scorePercentage), 0) / finalResults.length)
    : null;
  const displayName = [panelData?.name || user?.name || 'Tələbə', panelData?.surname || '']
    .filter(Boolean)
    .join(' ');
  const activeCoursesCount = panelData?.stats?.activeCoursesCount ?? panelData?.activeCourses?.length ?? 0;
  const pendingReviewsCount = sortedCompletedResults.filter((result) => result.hasPendingAnswers || (result.answers || []).some((answer) => isPendingReviewAnswer(answer))).length;

  const renderMetricCard = (
    icon: LucideIcon,
    label: string,
    value: string,
    helper: string,
    accent: string,
  ) => {
    const Icon = icon;

    return (
      <Card className="overflow-hidden border-slate-100 bg-white/95 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
              <p className="mt-1 text-xs text-slate-500">{helper}</p>
            </div>
            <div className="rounded-2xl p-3" style={{ backgroundColor: `${accent}14` }}>
              <Icon className="h-5 w-5" style={{ color: accent }} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSectionHeader = (title: string, description: string, action?: ReactNode) => (
    <CardHeader className="flex flex-col gap-4 border-b border-slate-100/80 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
        <CardDescription className="mt-1 text-slate-500">{description}</CardDescription>
      </div>
      {action}
    </CardHeader>
  );

  const renderEmptyState = (title: string, description: string, actionLabel: string, actionPath: string, icon: LucideIcon) => {
    const Icon = icon;

    return (
      <Empty className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 shadow-none">
        <EmptyMedia variant="icon" className="text-slate-400">
          <Icon className="h-6 w-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            type="button"
            onClick={() => navigate(actionPath)}
            className="rounded-xl bg-[#D4AF37] font-semibold text-white hover:bg-[#B88A1B]"
          >
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </EmptyContent>
      </Empty>
    );
  };

  const renderActiveTestCard = (test: PanelTestSummary) => {
    const testId = getEntityId(test);
    const courseTitle = test.course?.title || 'Kurs məlumatı yoxdur';
    const instructorName = test.instructor
      ? `${test.instructor.name || ''} ${test.instructor.surname || ''}`.trim()
      : 'Müəllim məlumatı yoxdur';
    const durationLabel = test.duration ? `${test.duration} dəqiqə` : 'Müddət yoxdur';
    const startsAtTime = test.startsAt ? new Date(test.startsAt).getTime() : null;
    const isScheduled = Boolean(startsAtTime && startsAtTime > Date.now());
    const buttonLabel = test.hasAttempted && test.allowRetake
      ? 'Təkrar et'
      : isScheduled
        ? 'Detalları aç'
        : 'İmtahana başla';

    return (
      <div
        key={testId || test.title}
        className="rounded-[1.75rem] border border-slate-100 bg-slate-50/75 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                {isScheduled ? 'Planlanıb' : 'Aktiv'}
              </Badge>
              <Badge variant="outline" className="border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#A87A1F]">
                Admin təsdiqli
              </Badge>
              {test.hasAccessCode ? (
                <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                  <KeyRound className="mr-1 h-3.5 w-3.5" />
                  Şifrə ilə
                </Badge>
              ) : null}
              {test.allowRetake ? (
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                  Təkrar mümkündür
                </Badge>
              ) : null}
              {test.hasAttempted ? (
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
                  {test.attemptCount || 1} cəhd
                </Badge>
              ) : null}
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">{test.title || 'Bilinməyən test'}</h3>
            <p className="mt-1 text-sm text-slate-500">{courseTitle}</p>
          </div>
          <div className="rounded-2xl bg-[#D4AF37]/10 p-3 text-[#A87A1F]">
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" />
              {durationLabel}
            </span>
            {test.startsAt ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {formatDateTime(test.startsAt)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" />
              {instructorName}
            </span>
          </div>
          <Button
            type="button"
            onClick={() => testId && navigate(`/tests/${testId}`, { state: { panelTest: test } })}
            className="rounded-xl bg-[#D4AF37] font-semibold text-white hover:bg-[#B88A1B]"
          >
            {buttonLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderResultCard = (result: PanelResult, compact = false) => {
    const testId = getEntityId(result.test);
    const testTitle = result.test?.title || 'Bilinməyən test';
    const courseTitle = result.test?.course?.title || 'Bilinməyən kurs';
    const instructorSource = result.test?.course?.instructor || result.test?.instructor;
    const instructorName = instructorSource
      ? `${instructorSource.name || ''} ${instructorSource.surname || ''}`.trim()
      : 'Müəllim məlumatı yoxdur';
    const completedDate = formatDate(result.completedAt || result.createdAt);
    const score = safeNumber(result.scorePercentage);
    const answers = result.answers || [];
    const correctAnswers = answers.filter((answer) => !isPendingReviewAnswer(answer) && answer.isCorrect).length;
    const pendingAnswers = answers.filter((answer) => isPendingReviewAnswer(answer)).length;
    const gradedAnswers = answers.filter((answer) => !isPendingReviewAnswer(answer)).length;
    const incorrectAnswers = Math.max(0, gradedAnswers - correctAnswers);
    const statusMeta = getResultStatusMeta(result);
    const StatusIcon = statusMeta.icon;

    return (
      <div
        key={getEntityId(result) || testId || testTitle}
        className="rounded-[1.75rem] border border-slate-100 bg-white/95 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn('border', statusMeta.className)}>
                <StatusIcon className="mr-1 h-3.5 w-3.5" />
                {statusMeta.label}
              </Badge>
              <Badge variant="outline" className="border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#A87A1F]">
                Admin təsdiqli
              </Badge>
              {result.test?.allowRetake ? (
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
                  Təkrar mümkündür
                </Badge>
              ) : null}
              <span className="text-xs font-medium text-slate-400">{completedDate}</span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">{testTitle}</h3>
            <p className="mt-1 text-sm text-slate-500">{courseTitle} · {instructorName}</p>
          </div>

          <div className="rounded-3xl bg-slate-50 px-5 py-4 text-right shadow-inner shadow-slate-100/80">
            <div className="text-3xl font-black text-slate-900">{formatPercentage(score)}</div>
            <div className="text-xs font-medium text-slate-500">Yekun nəticə</div>
          </div>
        </div>

        <div className={cn('mt-5 grid gap-4', compact ? 'lg:grid-cols-[minmax(0,1fr)]' : 'lg:grid-cols-[minmax(0,1fr)_240px]')}>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Bal göstəricisi</span>
              <span>{correctAnswers} düzgün · {pendingAnswers} gözləmədə</span>
            </div>
            <Progress value={Math.max(0, Math.min(100, score))} className="h-2" />
          </div>

          {!compact ? (
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl bg-emerald-50 px-3 py-3 text-center">
                <div className="text-lg font-black text-emerald-700">{correctAnswers}</div>
                <div className="text-xs text-emerald-700/80">Düzgün</div>
              </div>
              <div className="rounded-2xl bg-rose-50 px-3 py-3 text-center">
                <div className="text-lg font-black text-rose-700">{incorrectAnswers}</div>
                <div className="text-xs text-rose-700/80">Yanlış</div>
              </div>
              <div className="rounded-2xl bg-amber-50 px-3 py-3 text-center">
                <div className="text-lg font-black text-amber-700">{pendingAnswers}</div>
                <div className="text-xs text-amber-700/80">Gözləmədə</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderExpiredTestCard = (test: PanelTestSummary) => {
    const testId = getEntityId(test);
    const courseTitle = test.course?.title || 'Kurs məlumatı yoxdur';
    const expiredAt = getTestEndTime(test);

    return (
      <div
        key={testId || test.title}
        className="rounded-[1.75rem] border border-rose-100 bg-rose-50/70 p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-rose-200 bg-rose-100 text-rose-700">
            Müddəti bitib
          </Badge>
          <Badge variant="outline" className="border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#A87A1F]">
            Admin təsdiqli
          </Badge>
        </div>

        <h3 className="mt-3 text-lg font-bold text-slate-900">{test.title || 'Bilinməyən test'}</h3>
        <p className="mt-1 text-sm text-slate-500">{courseTitle}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          {test.startsAt ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {formatDateTime(test.startsAt)}
            </span>
          ) : null}
          {expiredAt ? (
            <span className="inline-flex items-center gap-1.5 text-rose-700">
              <Clock3 className="h-4 w-4" />
              Bitib: {formatDateTime(new Date(expiredAt).toISOString())}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  const renderOverviewSection = () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="gap-0 overflow-hidden border-slate-100 bg-white/95 shadow-sm">
        {renderSectionHeader(
          'Aktiv imtahanlar',
          'Admin tərəfindən tələbə üçün təsdiqlənmiş testlər burada görünür.',
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/exam-panel/results')}
            className="rounded-xl border-slate-200 text-slate-700"
          >
            Nəticələrim
          </Button>
        )}
        <CardContent className="space-y-4 px-6 py-6">
          {activeTests.length > 0
            ? activeTests.map((test) => renderActiveTestCard(test))
            : renderEmptyState(
                t('common.not_found'),
                'Admin tərəfindən yeni imtahan təyin ediləndə bu bölmədə görünəcək.',
                'Testlərə bax',
                '/tests',
                ClipboardList
              )}
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden border-slate-100 bg-white/95 shadow-sm">
        {renderSectionHeader(
          'Keçmiş imtahanlar',
          'Tamamlanan və ya müddəti bitən admin təsdiqli imtahanların qısa icmalı.',
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/exam-panel/results')}
            className="rounded-xl border-slate-200 text-slate-700"
          >
            Hamısı
          </Button>
        )}
        <CardContent className="space-y-4 px-6 py-6">
          {expiredUnattemptedTests.length > 0 || sortedCompletedResults.length > 0
            ? (
                <>
                  {expiredUnattemptedTests.map((test) => renderExpiredTestCard(test))}
                  {sortedCompletedResults.slice(0, Math.max(0, 3 - expiredUnattemptedTests.length)).map((result) => renderResultCard(result, true))}
                </>
              )
            : renderEmptyState(
                'Hələ nəticə yoxdur',
                'Admin təsdiqli imtahan tamamladıqdan sonra nəticələr burada görünəcək.',
                'İmtahanlara bax',
                '/tests',
                FileText
              )}
        </CardContent>
      </Card>
    </div>
  );

  const renderResultsSection = () => (
    <Card className="gap-0 overflow-hidden border-slate-100 bg-white/95 shadow-sm">
      {renderSectionHeader(
        'Tamamlanan imtahanlar',
        'Yalnız admin tərəfindən təsdiqlənmiş imtahanların yekun nəticələri burada toplanıb.',
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/exam-panel')}
          className="rounded-xl border-slate-200 text-slate-700"
        >
          İmtahanlara qayıt
        </Button>
      )}
      <CardContent className="space-y-4 px-6 py-6">
        {pendingReviewsCount > 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {pendingReviewsCount} nəticə hələ müəllim yoxlamasındadır.
          </div>
        ) : null}

        {sortedCompletedResults.length > 0
          ? sortedCompletedResults.map((result) => renderResultCard(result))
          : renderEmptyState(
              'Hələ nəticə yoxdur',
              'Admin təsdiqli tamamlanmış testləriniz burada toplanacaq.',
              'Testlərə bax',
              '/tests',
              CheckCircle2
            )}
      </CardContent>
    </Card>
  );

  const renderKeysSection = () => (
    <Card className="gap-0 overflow-hidden border-slate-100 bg-white/95 shadow-sm">
      {renderSectionHeader(
        'Cavab açarları',
        'Admin təsdiqli imtahanların sual və cavab detalları ayrıca səhifədə açılır.',
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/exam-panel/results')}
          className="rounded-xl border-slate-200 text-slate-700"
        >
          Nəticələrim
        </Button>
      )}
      <CardContent className="space-y-4 px-6 py-6">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
          Düzgün cavablar yalnız admin tərəfindən təsdiqlənmiş və tamamlanmış imtahanlar üçün göstərilir.
        </div>

        {sortedCompletedResults.length > 0
          ? sortedCompletedResults.map((result) => {
              const resultId = getEntityId(result);
              const statusMeta = getResultStatusMeta(result);
              const StatusIcon = statusMeta.icon;

              return (
                <div
                  key={resultId || getEntityId(result.test) || result.test?.title}
                  className="rounded-[1.75rem] border border-slate-100 bg-slate-50/75 p-5 shadow-sm transition-all hover:bg-white"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn('border', statusMeta.className)}>
                          <StatusIcon className="mr-1 h-3.5 w-3.5" />
                          {statusMeta.label}
                        </Badge>
                        <Badge variant="outline" className="border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#A87A1F]">
                          Admin təsdiqli
                        </Badge>
                        <span className="text-xs font-medium text-slate-400">{formatDate(result.completedAt || result.createdAt)}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-slate-900">{result.test?.title || 'Bilinməyən test'}</h3>
                      <p className="mt-1 text-sm text-slate-500">{result.test?.course?.title || 'Bilinməyən kurs'}</p>
                    </div>

                    <Button
                      type="button"
                      onClick={() => resultId && navigate(`/exam-panel/keys/${resultId}`)}
                      disabled={!resultId}
                      className="rounded-xl bg-[#D4AF37] font-semibold text-white hover:bg-[#B88A1B] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Açarı aç
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          : renderEmptyState(
              'Cavab açarı yoxdur',
              'Tamamlanmış admin təsdiqli test olduqda açarlarını burada görə bilərsiniz.',
              'Nəticələrim',
              '/exam-panel/results',
              KeyRound
            )}
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="border-slate-100 bg-white/95 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-28 rounded-full" />
                      <Skeleton className="h-8 w-16 rounded-full" />
                      <Skeleton className="h-3 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-11 w-11 rounded-2xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-[28rem] w-full rounded-[1.75rem]" />
            ))}
          </div>
        </div>
      );
    }

    if (activeTab.key === 'results') {
      return renderResultsSection();
    }

    if (activeTab.key === 'keys') {
      return renderKeysSection();
    }

    return renderOverviewSection();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900">
      <Navbar />
      <main className="pt-[var(--site-header-height)]">
        <StudentExamPanelTabBar activePath={activeTab.path} />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {loadError ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {loadError}
            </div>
          ) : null}

          <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-sm sm:p-6 lg:p-8">
            <div className="absolute -right-20 top-0 hidden h-56 w-56 rounded-full bg-[#D4AF37]/10 blur-3xl sm:block" />
            <div className="absolute -left-16 bottom-0 hidden h-40 w-40 rounded-full bg-sky-100/70 blur-3xl sm:block" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <Badge className="border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#A87A1F] hover:bg-[#D4AF37]/10">
                  {hero.badge}
                </Badge>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 lg:text-5xl">
                  {hero.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 lg:text-base">
                  Salam, {displayName}. {hero.description}
                </p>
              </div>

              <Button
                type="button"
                onClick={() => navigate(hero.actionPath)}
                className="w-full rounded-xl bg-[#D4AF37] px-5 font-semibold text-white hover:bg-[#B88A1B] sm:w-auto"
              >
                {hero.actionLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {renderMetricCard(
              ClipboardList,
              'Aktiv imtahanlar',
              String(activeTestsCount),
              'Admin təsdiqli aktiv testlər',
              '#10B981'
            )}
            {renderMetricCard(
              CheckCircle2,
              'Tamamlanan imtahanlar',
              String(completedTestsCount),
              'Yalnız admin təsdiqli nəticələr',
              '#D4AF37'
            )}
            {renderMetricCard(
              TrendingUp,
              'Ortalama',
              averageScore === null ? '—' : `${averageScore}%`,
              finalResults.length > 0 ? 'Yekunlaşdırılmış nəticələr üzrə' : 'Hələ yekun nəticə yoxdur',
              '#A87A1F'
            )}
          </div>

          <div className="mt-8 space-y-8">
            {renderContent()}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {activeCoursesCount} aktiv kurs
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {pendingReviewsCount} yoxlanışda nəticə
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
              <FileText className="h-3.5 w-3.5" />
              {completedTestsCount} ümumi nəticə
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}