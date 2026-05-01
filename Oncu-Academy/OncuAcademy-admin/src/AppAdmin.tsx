import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  Edit3,
  GraduationCap,
  Grid,
  LayoutDashboard,
  LogOut,
  FileText,
  Menu,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Tag as TagIcon,
  Trash2,
  Undo2,
  UserPlus,
  Users,
  X,
  Clock
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import AdminLoginScreen from './components/AdminLoginScreen';
import AdminExamPanel from './components/AdminExamPanel';
import AdminExamHistoryDetail from './components/AdminExamHistoryDetail';
import { adminApi, ADMIN_SESSION_TOKEN_KEY, ADMIN_SESSION_USER_KEY } from './services/api';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  contentClassName?: string;
  bodyClassName?: string;
};

type DashboardCard = {
  key: string;
  label: string;
  value: number | null;
  displayValue?: string;
  trendLabel: string;
  trendType: 'up' | 'down' | 'neutral';
  note?: string;
};

type DashboardData = {
  cards: DashboardCard[];
  topCourses: Array<{
    id: string;
    title: string;
    category: string;
    instructorName: string;
    studentCount: number;
  }>;
  latestStudents: Array<{
    id: string;
    name: string;
    email: string;
    activeCoursesCount: number;
    assignedTestsCount: number;
    createdAt: string;
  }>;
  latestTeachers: Array<{
    id: string;
    name: string;
    surname: string;
    email: string;
    categories: string[];
    courseCount: number;
    testCount: number;
    rating: number;
  }>;
};

type CategoryItem = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
};

type TeacherItem = {
  id: string;
  name: string;
  surname: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  categories: string[];
  rating: number;
  courseCount: number;
  testCount: number;
  education?: string;
  experience?: string;
  location?: string;
};

type StudentItem = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  educationLevel?: string;
  activeCourses: Array<{ _id: string; title: string; category: string }>;
  assignedTests: Array<{ _id: string; title: string; courseTitle?: string }>;
  activeCoursesCount: number;
  assignedTestsCount: number;
  completedTestsCount: number;
  createdAt: string;
};

type StudentTestResultItem = {
  id: string;
  attemptNumber: number;
  scorePercentage: number;
  hasPendingAnswers: boolean;
  completedAt: string;
  createdAt?: string;
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
    status: 'graded' | 'pending';
    displayAnswer?: string;
    selectedDisplayAnswer?: string;
    questionIndex?: number;
  }>;
  test: any;
};

type CourseItem = {
  id: string;
  title: string;
  category: string;
  instructor: string;
  courseTitle?: string;
  price: number;
  isActive: boolean;
  studentCount: number;
};

type TestItem = {
  id: string;
  title: string;
  courseTitle: string;
  instructorName: string;
  duration: number;
  questionCount: number;
  createdAt?: string;
};

type AdminTestResultItem = {
  id: string;
  attemptNumber: number;
  scorePercentage: number;
  hasPendingAnswers: boolean;
  completedAt: string;
  createdAt?: string;
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
    status: 'graded' | 'pending';
    displayAnswer?: string;
    selectedDisplayAnswer?: string;
    questionIndex?: number;
  }>;
  answersByQuestionId?: Record<string, {
    questionId: string;
    answer: string;
    isCorrect: boolean;
    status: 'graded' | 'pending';
    displayAnswer?: string;
    selectedDisplayAnswer?: string;
    questionIndex?: number;
  }>;
  student: {
    id: string;
    name: string;
    surname?: string;
    email?: string;
    phoneNumber?: string;
    avatar?: string;
    educationLevel?: string;
  };
};

type AssignmentCourseResource = {
  _id?: string;
  id?: string;
  title: string;
  category?: string;
  instructor?: string;
};

type AssignmentTestResource = {
  _id?: string;
  id?: string;
  title: string;
  courseTitle?: string;
  instructorName?: string;
};

type AssignmentMode = 'course' | 'test';
type AssignmentAction = 'assign' | 'remove';

type AdminUser = {
  email: string;
  name: string;
  picture?: string;
};

type AdminSession = {
  token: string;
  user: AdminUser;
};

const ADMIN_LOGO_SRC = '/image.png';

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Panel', path: '/' },
  { icon: FileText, label: 'Testlər', path: '/tests' },
  { icon: Shield, label: 'İmtahan Paneli', path: '/exam-panel' },
  { icon: Users, label: 'Müəllimlər', path: '/teachers' },
  { icon: GraduationCap, label: 'Tələbələr', path: '/students' },
  { icon: Grid, label: 'Kateqoriyalar', path: '/categories' }
];

const adminRouteTitles: Record<string, string> = {
  '/': 'Panel',
  '/tests': 'Testlər',
  '/exam-panel': 'İmtahan Paneli',
  '/teachers': 'Müəllimlər',
  '/students': 'Tələbələr',
  '/categories': 'Kateqoriyalar'
};

const loadAdminSession = (): AdminSession | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem(ADMIN_SESSION_TOKEN_KEY);
  const userData = localStorage.getItem(ADMIN_SESSION_USER_KEY);

  if (!token || !userData) {
    return null;
  }

  try {
    const user = JSON.parse(userData) as AdminUser;
    if (!user?.email) {
      return null;
    }

    return { token, user };
  } catch {
    return null;
  }
};

const Modal = ({ isOpen, onClose, title, children, contentClassName, bodyClassName }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-2 py-2 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`flex max-h-[calc(100dvh-1rem)] w-full max-w-[calc(100%-0.75rem)] flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl animate-in zoom-in-95 duration-200 sm:max-h-[calc(100dvh-2rem)] sm:max-w-md sm:rounded-[28px] ${contentClassName || ''}`}>
        <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/30 p-3 sm:p-4 lg:p-6">
          <h3 className="text-base font-black text-gray-900 sm:text-lg lg:text-xl">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-white">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <div className={`flex-1 ${bodyClassName || 'overflow-y-auto p-3 sm:p-4 lg:p-6'}`}>{children}</div>
      </div>
    </div>
  );
};

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('az-AZ').format(value);
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('az-AZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value));
};

const formatAttemptLabel = (attemptNumber: number) => {
  if (attemptNumber === 1) return '1-ci cəhd';
  if (attemptNumber === 2) return '2-ci cəhd';
  if (attemptNumber === 3) return '3-cü cəhd';
  return `${attemptNumber}-ci cəhd`;
};

const normalizeMultipleChoiceAnswerIndex = (value: unknown) => {
  const parsedValue = Number(String(value).trim());
  return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : null;
};

const resolveEntityId = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'object' && value !== null && typeof (value as { toHexString?: () => string }).toHexString === 'function') {
    return (value as { toHexString: () => string }).toHexString();
  }

  if (typeof value === 'object') {
    const objectValue = value as { _id?: unknown; id?: unknown; toString?: () => string };
    if (objectValue._id !== undefined && objectValue._id !== null) {
      if (objectValue._id === value) {
        return String(value);
      }

      return resolveEntityId(objectValue._id);
    }

    if (objectValue.id !== undefined && objectValue.id !== null) {
      if (objectValue.id === value) {
        return String(value);
      }

      return resolveEntityId(objectValue.id);
    }

    if (typeof objectValue.toString === 'function') {
      const stringValue = objectValue.toString();
      if (stringValue !== '[object Object]') {
        return stringValue;
      }
    }
  }

  return String(value);
};

const getQuestionLookupKey = (question: any, index: number) => {
  return resolveEntityId(question?._id ?? question?.id ?? question?.questionId ?? index);
};

const getAnswerForQuestion = (result: AdminTestResultItem, question: any, index: number) => {
  const questionLookupKey = getQuestionLookupKey(question, index);
  const answerFromMap = result.answersByQuestionId?.[questionLookupKey];

  if (answerFromMap) {
    return answerFromMap;
  }

  const exactAnswer = result.answers.find((item) => resolveEntityId(item.questionId) === questionLookupKey);
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

const isNumericOpenEndedQuestion = (question: any) => {
  if (!question || question.answerType !== 'open_ended') {
    return false;
  }

  if (question.openEndedAnswerType === 'number') {
    return true;
  }

  const normalizedCorrectAnswer = Number(String(question.correctAnswer ?? '').replace(',', '.').trim());
  return Number.isFinite(normalizedCorrectAnswer);
};

const resolveCategoryName = (categoryId: string, categories: CategoryItem[]) => {
  return categories.find((category) => category.id === categoryId)?.name || categoryId || '---';
};

const AdminBrand = ({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) => (
  <Link to="/" onClick={onNavigate} className="flex items-center gap-3">
    <img
      src={ADMIN_LOGO_SRC}
      alt="Sizin Akademiyanız"
      className="h-10 w-10 rounded-2xl object-cover ring-1 ring-black/5"
    />
    <div className="flex flex-col leading-none">
      <span className={`font-black uppercase italic tracking-tight text-gray-900 ${compact ? 'text-lg' : 'text-xl'}`}>
          Sizin Akademiyanız
        </span>
    </div>
  </Link>
);

const AdminNavigation = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();

  return (
    <nav className="flex-1 space-y-2 px-4 py-4">
      {adminMenuItems.map((item) => {
        const isActive = location.pathname === item.path;

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-4 rounded-2xl px-6 py-4 transition-all ${
              isActive
                ? 'bg-[#D4AF37] font-bold text-white shadow-lg shadow-[#D4AF37]/20'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-sm">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const Sidebar = ({ onLogout, adminUser }: { onLogout: () => void; adminUser: AdminUser }) => {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden h-screen w-56 flex-col overflow-y-auto border-r border-gray-100 bg-white lg:flex">
      <div className="flex h-24 items-center px-8">
        <AdminBrand />
      </div>

      <AdminNavigation />

      <div className="border-t border-gray-50 p-4 space-y-3">
        <div className="rounded-2xl bg-gray-50 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Daxil olan hesab</p>
          <p className="mt-1 truncate text-sm font-bold text-gray-900">{adminUser.email}</p>
        </div>
        <button onClick={onLogout} className="flex w-full items-center gap-4 rounded-2xl px-6 py-4 font-bold text-red-500 transition-all hover:bg-red-50">
          <LogOut className="h-5 w-5" />
          <span className="text-sm">Çıxış</span>
        </button>
      </div>
    </aside>
  );
};

const MobileMenu = ({
  open,
  onOpenChange,
  onLogout,
  adminUser,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
  adminUser: AdminUser;
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-[80] flex w-[min(88vw,22rem)] max-w-[22rem] flex-col bg-white shadow-2xl outline-none lg:hidden">
          <Dialog.Title className="sr-only">Admin menyu</Dialog.Title>

          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <AdminBrand onNavigate={() => onOpenChange(false)} />
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full border border-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <AdminNavigation onNavigate={() => onOpenChange(false)} />
          </div>

          <div className="border-t border-gray-100 p-4 space-y-3">
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Daxil olan hesab</p>
              <p className="mt-1 truncate text-sm font-bold text-gray-900">{adminUser.email}</p>
            </div>
            <button
              onClick={() => {
                onOpenChange(false);
                onLogout();
              }}
              className="flex w-full items-center gap-4 rounded-2xl px-6 py-4 font-bold text-red-500 transition-all hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm">Çıxış</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

const MobileTopBar = ({
  title,
  onOpenMenu,
  onLogout,
}: {
  title: string;
  onOpenMenu: () => void;
  onLogout: () => void;
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur lg:hidden">
      <div className="flex min-h-[var(--admin-topbar-height)] items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-700 shadow-sm transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
          aria-label="Menyunu aç"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <img
            src={ADMIN_LOGO_SRC}
            alt="Sizin Akademiyanız"
            className="h-10 w-10 rounded-2xl object-cover ring-1 ring-black/5"
          />
          <div className="min-w-0">
            <p className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Sizin Akademiyanız
            </p>
            <h1 className="truncate text-sm font-black text-gray-900">{title}</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label="Çıxış"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

const AdminShell = ({
  onLogout,
  adminUser,
  children,
}: {
  onLogout: () => void;
  adminUser: AdminUser;
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pageTitle = adminRouteTitles[location.pathname] || 'Admin panel';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.title = `${pageTitle} — Sizin Akademiyanız Admin`;
  }, [pageTitle]);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F8FAFC] lg:pl-56">
      <Sidebar onLogout={onLogout} adminUser={adminUser} />
      <MobileMenu
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        onLogout={onLogout}
        adminUser={adminUser}
      />

      <div className="flex min-h-screen flex-col overflow-x-clip">
        <MobileTopBar
          title={pageTitle}
          onOpenMenu={() => setMobileMenuOpen(true)}
          onLogout={onLogout}
        />
        <main className="min-w-0 flex-1 overflow-x-clip p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:p-6 lg:p-12">{children}</main>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const response = await adminApi.getDashboard();
      if (response.success) {
        setDashboard(response.data);
      } else {
        toast.error(response.message || 'Dashboard məlumatları alınmadı');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Dashboard məlumatları alınmadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const cards = dashboard?.cards || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Admin panel</h1>
          <p className="mt-1 text-gray-500">Kurs, tələbə və müəllim axınına canlı baxış.</p>
        </div>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:border-[#D4AF37] hover:text-[#D4AF37]"
        >
          <RefreshCw className="h-4 w-4" />
          Yenilə
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {(loading ? Array.from({ length: 4 }, () => undefined) : cards as Array<DashboardCard | undefined>).map((card, index) => {
          if (loading) {
            return (
              <div key={index} className="rounded-[32px] border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
                <div className="mb-4 h-3 w-24 animate-pulse rounded-full bg-gray-100" />
                <div className="h-9 w-32 animate-pulse rounded-2xl bg-gray-100" />
                <div className="mt-4 h-5 w-28 animate-pulse rounded-full bg-gray-100" />
              </div>
            );
          }

          if (!card) return null;

          return (
            <div key={card.key} className="rounded-[32px] border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-8">
              <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-gray-400">{card.label}</p>
              <div className="flex items-end justify-between gap-3">
                <h3 className="text-3xl font-black leading-none text-gray-900">
                  {card.displayValue || formatNumber(card.value)}
                </h3>
                <span
                  className={`rounded-lg px-2 py-1 text-xs font-bold ${
                    card.trendType === 'up'
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                      : card.trendType === 'down'
                        ? 'bg-red-50 text-red-500'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {card.trendLabel}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-500">{card.note}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-black text-gray-900">Ən aktiv kurslar</h3>
          <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gray-500">
            Canlı
          </span>
        </div>
        <div className="space-y-5">
          {(dashboard?.topCourses || []).map((course) => (
            <div key={course.id} className="flex flex-col gap-4 rounded-2xl border border-gray-50 p-4 transition-colors hover:bg-gray-50/50 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 font-black text-[#D4AF37] transition-all group-hover:bg-[#D4AF37] group-hover:text-white">
                  {course.title[0]}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{course.title}</h4>
                  <p className="text-xs text-gray-500">{course.instructorName} · {course.category}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{formatNumber(course.studentCount)} tələbə</div>
                <div className="text-[10px] font-black uppercase text-[#D4AF37]">Aktiv</div>
              </div>
            </div>
          ))}
          {!loading && dashboard && dashboard.topCourses.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
              Hələ aktiv kurs yoxdur.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
                <Users className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Son müəllimlər</h3>
                <p className="text-sm text-gray-500">Backend-dən gələn ən son qeydiyyatlar</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {(dashboard?.latestTeachers || []).map((teacher) => (
              <div key={teacher.id} className="rounded-2xl border border-gray-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div>
                    <div className="font-bold text-gray-900">{teacher.name} {teacher.surname}</div>
                    <div className="text-sm text-gray-500">{teacher.email}</div>
                  </div>
                  <div className="text-left text-sm font-bold text-gray-900 sm:text-right">
                    {teacher.courseCount} kurs · {teacher.testCount} test
                  </div>
                </div>
              </div>
            ))}
            {!loading && dashboard && dashboard.latestTeachers.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                Hələ müəllim yoxdur.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                <GraduationCap className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Son tələbələr</h3>
                <p className="text-sm text-gray-500">Yeni qoşulan tələbələr</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {(dashboard?.latestStudents || []).map((student) => (
              <div key={student.id} className="rounded-2xl border border-gray-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div>
                    <div className="font-bold text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </div>
                  <div className="text-left text-sm font-bold text-gray-900 sm:text-right">
                    {student.activeCoursesCount} kurs · {student.assignedTestsCount} test
                  </div>
                </div>
              </div>
            ))}
            {!loading && dashboard && dashboard.latestStudents.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                Hələ tələbə yoxdur.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Teachers = () => {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [createdInfo, setCreatedInfo] = useState<{ email: string; password: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    category: '',
    phoneNumber: ''
  });
  const deferredSearch = useDeferredValue(search);

  const loadData = async () => {
    setLoading(true);

    try {
      const [teachersResponse, categoriesResponse] = await Promise.all([
        adminApi.getTeachers(),
        adminApi.getCategories()
      ]);

      if (teachersResponse.success) {
        setTeachers(teachersResponse.data);
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Müəllim məlumatları alınmadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTeachers = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return teachers;

    return teachers.filter((teacher) => {
      const categoryName = resolveCategoryName(teacher.categories?.[0] || '', categories);
      return [teacher.name, teacher.surname, teacher.email, categoryName]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [teachers, categories, deferredSearch]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const payload = {
        name: newTeacher.name,
        surname: newTeacher.surname,
        email: newTeacher.email,
        phoneNumber: newTeacher.phoneNumber,
        categories: newTeacher.category ? [newTeacher.category] : []
      };

      const response = editingTeacherId
        ? await adminApi.updateTeacher(editingTeacherId, payload)
        : await adminApi.createTeacher({ ...payload, password: newTeacher.password });

      if (response.success) {
        if (!editingTeacherId) {
          setCreatedInfo({ email: newTeacher.email, password: newTeacher.password });
        } else {
          setCreatedInfo(null);
        }
        setNewTeacher({ name: '', surname: '', email: '', password: '', category: '', phoneNumber: '' });
        setIsModalOpen(false);
        setEditingTeacherId(null);
        toast.success('Müəllim hesabı yaradıldı');
        await loadData();
      } else {
        toast.error(response.message || 'Müəllim əməliyyatı uğursuz oldu');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Serverlə əlaqə qurula bilmədi');
    }
  };

  const copyCredentials = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Kopyalandı');
  };

  const openCreateModal = () => {
    setEditingTeacherId(null);
    setNewTeacher({ name: '', surname: '', email: '', password: '', category: '', phoneNumber: '' });
    setCreatedInfo(null);
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: TeacherItem) => {
    setEditingTeacherId(teacher.id);
    setNewTeacher({
      name: teacher.name,
      surname: teacher.surname,
      email: teacher.email,
      password: '',
      category: teacher.categories?.[0] || '',
      phoneNumber: teacher.phoneNumber || ''
    });
    setCreatedInfo(null);
    setIsModalOpen(true);
  };

  const handleDeleteTeacher = async (teacher: TeacherItem) => {
    const confirmed = window.confirm(`${teacher.name} ${teacher.surname} silinsin?`);
    if (!confirmed) return;

    try {
      const response = await adminApi.deleteTeacher(teacher.id);
      if (response.success) {
        toast.success('Müəllim silindi');
        await loadData();
      } else {
        toast.error(response.message || 'Müəllim silinmədi');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Müəllim silinmədi');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Müəllimlər</h1>
          <p className="mt-1 text-gray-500">Yalnız müəllim hesabları burada göstərilir.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#D4AF37] px-6 py-3 font-bold text-white shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-95 hover:bg-[#B88A1B]"
        >
          <Plus className="h-5 w-5" />
          Yeni Müəllim
        </button>
      </div>

      <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="text"
            placeholder="Müəllim adı, email və ya kateqoriya ilə axtar..."
            className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all focus:border-[#D4AF37] focus:ring-0"
          />
        </div>
      </div>

      {createdInfo && (
        <div className="animate-in slide-in-from-top-4 rounded-[32px] bg-[#D4AF37] p-5 text-white shadow-xl shadow-[#D4AF37]/20 duration-500 sm:p-8">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-black">
            <Check className="h-6 w-6" />
            Hesab yaradıldı
          </h3>
          <p className="mb-6 text-sm opacity-90">Aşağıdakı giriş məlumatlarını müəllimə göndərin:</p>
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span className="text-xs font-black uppercase tracking-widest opacity-60">Email</span>
              <div className="flex items-center gap-3">
                <span className="font-bold">{createdInfo.email}</span>
                <button onClick={() => copyCredentials(createdInfo.email)} className="rounded-lg p-2 transition-colors hover:bg-white/10">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span className="text-xs font-black uppercase tracking-widest opacity-60">Şifrə</span>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold tracking-wider">{createdInfo.password}</span>
                <button onClick={() => copyCredentials(createdInfo.password)} className="rounded-lg p-2 transition-colors hover:bg-white/10">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <button onClick={() => setCreatedInfo(null)} className="mt-6 text-xs font-black uppercase tracking-widest hover:underline">
            Bağla
          </button>
        </div>
      )}

      <div className="rounded-[32px] border border-gray-100 bg-white shadow-sm">
        <div className="space-y-3 p-3 sm:p-4">
          {loading && (
            <div className="rounded-2xl border border-gray-100 p-6 text-center text-gray-400">Müəllimlər yüklənir...</div>
          )}
          {!loading && filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="rounded-2xl border border-gray-100 p-4 transition-colors hover:bg-gray-50/50 sm:p-5">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_auto] xl:items-center">
                <div className="min-w-0">
                  <div className="truncate font-bold text-gray-900">{teacher.name} {teacher.surname}</div>
                  <div className="truncate text-sm text-gray-500">Müəllim hesabı</div>
                </div>
                <div className="min-w-0 text-sm text-gray-500">
                  <div className="truncate font-medium text-gray-700">{teacher.email}</div>
                  <div className="truncate text-xs text-gray-400">Əlaqə emaili</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase text-blue-600">
                    {resolveCategoryName(teacher.categories?.[0] || '', categories)}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-black uppercase text-gray-600">
                    {teacher.courseCount} kurs
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-black uppercase text-gray-600">
                    {teacher.testCount} test
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <button
                    onClick={() => openEditModal(teacher)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-600 transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Düzəlt
                  </button>
                  <button
                    onClick={() => handleDeleteTeacher(teacher)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-500 transition-colors hover:border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!loading && filteredTeachers.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center italic text-gray-400">
              Hələ ki, heç bir müəllim hesabı yaradılmayıb.
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTeacherId(null); }}
        title={editingTeacherId ? 'Müəllim Redaktə Et' : 'Yeni Müəllim Hesabı'}
      >
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="col-span-1 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 italic sm:text-xs">Ad</label>
            <input
              required
              value={newTeacher.name}
              onChange={(event) => setNewTeacher({ ...newTeacher, name: event.target.value })}
              type="text"
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm font-bold outline-none transition-all focus:border-[#D4AF37] focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3"
              placeholder="Məryəm"
            />
          </div>
          <div className="col-span-1 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 italic sm:text-xs">Soyad</label>
            <input
              required
              value={newTeacher.surname}
              onChange={(event) => setNewTeacher({ ...newTeacher, surname: event.target.value })}
              type="text"
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm font-bold outline-none transition-all focus:border-[#D4AF37] focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3"
              placeholder="Ələkbərli"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 italic sm:text-xs">Email</label>
            <input
              required
              value={newTeacher.email}
              onChange={(event) => setNewTeacher({ ...newTeacher, email: event.target.value })}
              type="email"
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm font-bold outline-none transition-all focus:border-[#D4AF37] focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3"
              placeholder="name@example.com"
            />
          </div>
          <div className="col-span-1 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 italic sm:text-xs">Telefon</label>
            <input
              value={newTeacher.phoneNumber}
              onChange={(event) => setNewTeacher({ ...newTeacher, phoneNumber: event.target.value })}
              type="text"
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm font-bold outline-none transition-all focus:border-[#D4AF37] focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3"
              placeholder="+994 50 000 00 00"
            />
          </div>
          <div className="col-span-1 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 italic sm:text-xs">Kateqoriya</label>
            <select
              required
              value={newTeacher.category}
              onChange={(event) => setNewTeacher({ ...newTeacher, category: event.target.value })}
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm font-bold outline-none transition-all focus:border-[#D4AF37] focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3"
            >
              <option value="">Kateqoriya seçin...</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 italic sm:text-xs">Müvəqqəti Şifrə</label>
            <input
              required={!editingTeacherId}
              value={newTeacher.password}
              onChange={(event) => setNewTeacher({ ...newTeacher, password: event.target.value })}
              type="text"
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm font-mono font-bold tracking-widest outline-none transition-all focus:border-[#D4AF37] focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3"
              placeholder={editingTeacherId ? 'Boş buraxın' : 'RIM2026!#'}
              disabled={Boolean(editingTeacherId)}
            />
          </div>
          <button
            type="submit"
            className="col-span-2 mt-1 w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-black text-white shadow-xl shadow-[#D4AF37]/20 transition-all active:scale-95 hover:bg-[#B88A1B] sm:rounded-2xl sm:py-4 sm:text-base"
          >
            {editingTeacherId ? 'Düzəlişi Saxla' : 'Hesabı Yarat'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

const Tests = () => {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [selectedTestData, setSelectedTestData] = useState<any | null>(null);
  const [testResults, setTestResults] = useState<AdminTestResultItem[]>([]);
  const [selectedTestResult, setSelectedTestResult] = useState<AdminTestResultItem | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState('');
  const [resultsSearch, setResultsSearch] = useState('');
  const resultsSectionRef = useRef<HTMLDivElement | null>(null);
  const deferredSearch = useDeferredValue(search);
  const deferredResultsSearch = useDeferredValue(resultsSearch);

  const loadData = async () => {
    setLoading(true);

    try {
      const response = await adminApi.getTests();
      if (response.success) {
        setTests(response.data || []);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Testlər alınmadı');
    } finally {
      setLoading(false);
    }
  };

  const loadTestResults = async (testId: string) => {
    setResultsLoading(true);
    setResultsError('');

    try {
      const response = await adminApi.getTestResults(testId);

      if (response.success) {
        const nextTestData = response.data?.test || null;
        const nextResults = response.data?.results || [];
        setSelectedTestData(nextTestData);
        setTestResults(nextResults);
        setSelectedTestResult(nextResults[0] || null);
      } else {
        setResultsError(response.message || 'Test nəticələri alınmadı');
      }
    } catch (error) {
      setResultsError(error instanceof Error ? error.message : 'Test nəticələri alınmadı');
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const courses = useMemo(() => {
    const map = new Map<string, string>();

    tests.forEach((test) => {
      if (!test.courseTitle) return;
      if (!map.has(test.courseTitle)) {
        map.set(test.courseTitle, test.courseTitle);
      }
    });

    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [tests]);

  const filteredTests = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return tests.filter((test) => {
      const matchesCourse = selectedCourseId === 'all' ? true : test.courseTitle === selectedCourseId;
      const matchesSearch = !query || [test.title, test.courseTitle, test.instructorName].some((value) => String(value || '').toLowerCase().includes(query));

      return matchesCourse && matchesSearch;
    });
  }, [deferredSearch, tests, selectedCourseId]);

  const filteredTestResults = useMemo(() => {
    const query = deferredResultsSearch.trim().toLowerCase();

    if (!query) {
      return testResults;
    }

    return testResults.filter((result) => (
      [
        result.student?.name || '',
        result.student?.surname || '',
        result.student?.email || '',
        formatAttemptLabel(result.attemptNumber || 1)
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    ));
  }, [deferredResultsSearch, testResults]);

  useEffect(() => {
    if (!filteredTests.length) {
      setSelectedTestId('');
      setSelectedTestData(null);
      setTestResults([]);
      setSelectedTestResult(null);
      return;
    }

    if (!filteredTests.some((test) => test.id === selectedTestId)) {
      setSelectedTestId(filteredTests[0].id);
    }
  }, [filteredTests, selectedTestId]);

  useEffect(() => {
    if (!selectedTestId) {
      return;
    }

    setResultsSearch('');
    setSelectedTestResult(null);
    loadTestResults(selectedTestId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTestId]);

  useEffect(() => {
    if (!filteredTestResults.length) {
      return;
    }

    const selectedVisible = selectedTestResult
      ? filteredTestResults.some((result) => result.id === selectedTestResult.id)
      : false;

    if (!selectedVisible) {
      setSelectedTestResult(filteredTestResults[0]);
    }
  }, [filteredTestResults, selectedTestResult]);

  const selectedTest = selectedTestData || filteredTests.find((test) => test.id === selectedTestId) || null;
  const totalAttempts = testResults.length;
  const pendingAttempts = testResults.filter((result) => result.hasPendingAnswers).length;
  const averageScore = testResults.length
    ? Math.round(testResults.reduce((sum, result) => sum + (result.scorePercentage || 0), 0) / testResults.length)
    : 0;
  const uniqueStudents = new Set(testResults.map((result) => result.student?.id || result.student?.email || `${result.student?.name || ''}-${result.student?.surname || ''}`)).size;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Testlər</p>
          <h1 className="mt-2 text-3xl font-black text-gray-900">Bütün testlər və nəticələr</h1>
          <p className="mt-1 text-gray-500">Testləri seçin, nəticələri inline görün və sual-cavabları səhifə içində izləyin.</p>
        </div>
        <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600">
          {filteredTests.length} test
        </div>
      </div>

      <div className="rounded-[32px] border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="text"
              placeholder="Test, kurs və ya müəllim ilə axtar..."
              className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all focus:border-[#D4AF37] focus:ring-0"
            />
          </div>
          <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600">
            {tests.length} ümumi test
          </div>
        </div>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible lg:px-0">
        <button
          type="button"
          onClick={() => setSelectedCourseId('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${selectedCourseId === 'all' ? 'bg-[#D4AF37] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}
        >
          <FileText className="w-4 h-4" />
          Hamısı
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${selectedCourseId === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{tests.length}</span>
        </button>
        {courses.map((course) => {
          const count = tests.filter((test) => test.courseTitle === course.id).length;

          return (
            <button
              type="button"
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${selectedCourseId === course.id ? 'bg-[#D4AF37] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}
            >
              {course.title}
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${selectedCourseId === course.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTests.map((test) => {
          const isSelected = selectedTestId === test.id;

          return (
            <button
              key={test.id}
              type="button"
              onClick={() => {
                setSelectedTestId(test.id);
                resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`rounded-3xl border p-5 text-left shadow-sm transition-all hover:shadow-md ${isSelected ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-gray-100 bg-white'}`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{formatDate(test.createdAt)}</span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{test.title}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{test.courseTitle}</p>

              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-5">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                  <Clock className="w-3 h-3" />
                  {test.duration} dəq
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                  <FileText className="w-3 h-3" />
                  {test.questionCount} sual
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-gray-500 truncate">{test.instructorName}</div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${isSelected ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {isSelected ? 'Seçildi' : 'Nəticələrə bax'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {!loading && filteredTests.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center italic text-gray-400">
          Uyğun test tapılmadı.
        </div>
      )}

      <div ref={resultsSectionRef} className="rounded-[32px] border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Nəticələr</p>
            <h2 className="mt-2 text-2xl font-black text-gray-900">Seçilmiş testin nəticələri</h2>
            <p className="mt-1 text-gray-500">Aşağıda nəticələr və sual-cavablar ayrı hissələrdə göstərilir.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm font-bold text-gray-600 sm:grid-cols-4">
            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-center">{totalAttempts} cəhd</div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-center">{uniqueStudents} tələbə</div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-center">{pendingAttempts} yoxlama</div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-center">{testResults.length ? `${averageScore}%` : '-'}</div>
          </div>
        </div>

        {!selectedTest ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
            Nəticələri görmək üçün bir test seçin.
          </div>
        ) : resultsLoading ? (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
            Nəticələr yüklənir...
          </div>
        ) : resultsError ? (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">
            {resultsError}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-start">
            <div className="space-y-3 xl:max-h-[60vh] xl:overflow-y-auto xl:pr-1">
              <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={resultsSearch}
                    onChange={(event) => setResultsSearch(event.target.value)}
                    type="text"
                    placeholder="Tələbə adı ilə axtar..."
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition-all focus:border-[#D4AF37] focus:bg-white"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                  <span>{filteredTestResults.length} tapıldı</span>
                  <span>{testResults.length} ümumi</span>
                </div>
              </div>

              {filteredTestResults.map((result) => {
                const isActive = selectedTestResult?.id === result.id;
                const isPassed = (result.scorePercentage || 0) >= 60;

                return (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => setSelectedTestResult(result)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${isActive ? 'border-[#A87A1F] bg-[#A87A1F]/5 shadow-sm' : 'border-gray-100 bg-white hover:border-[#A87A1F]/40 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-gray-900">
                          {result.student?.name || 'Naməlum tələbə'} {result.student?.surname || ''}
                        </div>
                        <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-[#A87A1F]">
                          {formatAttemptLabel(result.attemptNumber || 1)}
                        </div>
                      </div>
                      <div className={`rounded-xl px-2.5 py-1 text-xs font-black ${result.hasPendingAnswers ? 'bg-yellow-50 text-yellow-600' : isPassed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {result.hasPendingAnswers ? 'Yoxlama' : `${Math.round(result.scorePercentage || 0)}%`}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                      <span>{result.student?.email || '-'}</span>
                      <span>{formatDate(result.completedAt)}</span>
                    </div>
                  </button>
                );
              })}

              {filteredTestResults.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                  Axtarışa uyğun nəticə tapılmadı.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 xl:max-h-[60vh] xl:overflow-y-auto">
              {selectedTestResult ? (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-[#A87A1F]">
                        {formatAttemptLabel(selectedTestResult.attemptNumber || 1)}
                      </div>
                      <h4 className="mt-1 text-2xl font-black text-gray-900">
                        {selectedTestResult.student?.name || 'Naməlum tələbə'} {selectedTestResult.student?.surname || ''}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {selectedTestResult.student?.email || '-'}
                      </p>
                    </div>
                    <div className={`rounded-2xl px-4 py-3 text-right ${selectedTestResult.hasPendingAnswers ? 'bg-yellow-50 text-yellow-700' : (selectedTestResult.scorePercentage || 0) >= 60 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <div className="text-2xl font-black">
                        {selectedTestResult.hasPendingAnswers ? 'Yoxlama' : `${Math.round(selectedTestResult.scorePercentage || 0)}%`}
                      </div>
                      <div className="text-xs font-bold uppercase tracking-[0.14em]">
                        {selectedTestResult.hasPendingAnswers ? 'Gözləmədə' : 'Nəticə'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-2xl bg-gray-50 p-4 text-center">
                      <div className="text-2xl font-black text-[#D4AF37]">{selectedTestResult.answers.filter((answer) => answer.isCorrect).length}</div>
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Doğru</div>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4 text-center">
                      <div className="text-2xl font-black text-red-500">{selectedTestResult.answers.filter((answer) => !answer.isCorrect && answer.status === 'graded').length}</div>
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Yanlış</div>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4 text-center">
                      <div className="text-2xl font-black text-yellow-500">{selectedTestResult.answers.filter((answer) => answer.status === 'pending').length}</div>
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Gözləyən</div>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4 text-center">
                      <div className="text-2xl font-black text-gray-600">{Math.max((selectedTest?.questions || []).length - selectedTestResult.answers.length, 0)}</div>
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Boş</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-lg font-bold text-gray-900">Sual və cavablar</h5>
                    <div className="space-y-3">
                        {(selectedTest?.questions || []).map((question: any, index: number) => {
                          const answer = getAnswerForQuestion(selectedTestResult, question, index);
                        const hasAnswer = Boolean(answer);
                        const isSelectedQuestionCorrect = Boolean(answer?.isCorrect);
                        const selectedAnswerIndex = normalizeMultipleChoiceAnswerIndex(answer?.answer);
                        const correctAnswerIndex = getMultipleChoiceCorrectAnswerIndex(question);
                        const answerStateLabel = !hasAnswer
                          ? 'Cavab verilməyib'
                          : answer?.status === 'pending'
                            ? 'Yoxlama gözləyir'
                            : isSelectedQuestionCorrect
                              ? 'Doğru'
                              : 'Yanlış';

                        return (
                          <div
                            key={question._id}
                            className={`rounded-2xl border p-4 ${!hasAnswer ? 'border-gray-200 bg-gray-50/80' : answer?.status === 'pending' ? 'border-yellow-200 bg-yellow-50/50' : isSelectedQuestionCorrect ? 'border-green-100 bg-green-50/40' : 'border-red-100 bg-red-50/40'}`}
                          >
                            <div className="flex gap-3">
                              <span className="font-bold text-gray-400">{index + 1}.</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {question.questionType === 'image' ? (
                                      <div className="mt-2 max-w-sm overflow-hidden rounded-xl border border-gray-100">
                                        <img src={question.content} alt="Sual" className="h-auto w-full" />
                                      </div>
                                    ) : question.content}
                                  </div>
                                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${!hasAnswer ? 'bg-gray-100 text-gray-500' : answer?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : isSelectedQuestionCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {answerStateLabel}
                                  </span>
                                </div>

                                {question.answerType === 'open_ended' ? (
                                  <div className="mt-4 space-y-3">
                                    <div className="rounded-xl border border-gray-100 bg-white p-3 text-sm">
                                      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Tələbənin Cavabı</span>
                                      <span className="text-gray-900">{answer?.answer || 'Cavab verilməyib'}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 text-sm">
                                      {!hasAnswer ? (
                                        <span className="font-bold text-gray-500">Bu sual üçün hələ cavab göndərilməyib</span>
                                      ) : isNumericOpenEndedQuestion(question) ? (
                                        <span className={isSelectedQuestionCorrect ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                                          {isSelectedQuestionCorrect ? 'Avtomatik doğru' : 'Avtomatik yanlış'}
                                        </span>
                                      ) : (
                                        <span className={answer?.status === 'pending' ? 'font-bold text-yellow-600' : isSelectedQuestionCorrect ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                                          {answer?.status === 'pending' ? 'Yoxlama gözləyir' : isSelectedQuestionCorrect ? 'Doğru qiymətləndirildi' : 'Yanlış qiymətləndirildi'}
                                        </span>
                                      )}
                                      {!isNumericOpenEndedQuestion(question) && answer?.status !== 'pending' && (
                                        <span className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">Manual yoxlama yoxdur</span>
                                      )}
                                      {answer?.status === 'pending' && (
                                        <span className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">Müəllim baxmalıdır</span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-4 space-y-3">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      <div className="rounded-xl border border-gray-100 bg-white p-3 text-sm">
                                        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Seçilən şık</span>
                                        <span className="font-medium text-gray-900">{hasAnswer ? formatMultipleChoiceAnswer(question, answer?.answer || '') : 'Cavab verilməyib'}</span>
                                      </div>
                                      <div className="rounded-xl border border-gray-100 bg-white p-3 text-sm">
                                        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Düzgün şık</span>
                                        <span className="font-medium text-gray-900">{correctAnswerIndex !== null ? formatMultipleChoiceAnswer(question, String(correctAnswerIndex)) : 'Təyin edilməyib'}</span>
                                      </div>
                                    </div>

                                    {question.options.map((option: string, optionIndex: number) => {
                                      const isSelected = selectedAnswerIndex !== null ? selectedAnswerIndex === optionIndex : answer?.answer === option;
                                      const isActualCorrect = correctAnswerIndex !== null ? correctAnswerIndex === optionIndex : question.correctAnswer === option;
                                      const optionStateClass = isActualCorrect
                                        ? 'border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]'
                                        : isSelected && !isSelectedQuestionCorrect
                                          ? 'border-red-200 bg-red-100 text-red-600'
                                          : 'border-gray-100 bg-white text-gray-500';

                                      return (
                                        <div
                                          key={optionIndex}
                                          className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium ${optionStateClass}`}
                                        >
                                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${isActualCorrect ? 'bg-[#D4AF37] text-white' : isSelected && !isSelectedQuestionCorrect ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            {String.fromCharCode(65 + optionIndex)}
                                          </div>
                                          <span className="truncate">{option}</span>
                                          {isActualCorrect && <span className="ml-auto text-[10px] font-black uppercase opacity-70">Doğru</span>}
                                          {!isActualCorrect && isSelected && <span className="ml-auto text-[10px] font-black uppercase opacity-60">Seçilib</span>}
                                        </div>
                                      );
                                    })}

                                    {!hasAnswer && (
                                      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                                        Bu sual üçün cavab göndərilməyib.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-gray-500">
                  Görmək üçün bir nəticə seçin.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Students = () => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [studentResultsModalOpen, setStudentResultsModalOpen] = useState(false);
  const [studentResultsLoading, setStudentResultsLoading] = useState(false);
  const [studentResultsError, setStudentResultsError] = useState('');
  const [selectedResultsStudent, setSelectedResultsStudent] = useState<StudentItem | null>(null);
  const [studentResults, setStudentResults] = useState<StudentTestResultItem[]>([]);
  const [selectedStudentResult, setSelectedStudentResult] = useState<StudentTestResultItem | null>(null);
  const [studentResultsSearch, setStudentResultsSearch] = useState('');
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [assignmentType, setAssignmentType] = useState<AssignmentMode>('course');
  const [assignmentAction, setAssignmentAction] = useState<AssignmentAction>('assign');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const deferredAssignmentSearch = useDeferredValue(assignmentSearch);
  const deferredStudentResultsSearch = useDeferredValue(studentResultsSearch);

  const loadData = async () => {
    setLoading(true);

    try {
      const [studentsResponse, coursesResponse, testsResponse] = await Promise.all([
        adminApi.getStudents(),
        adminApi.getCourses(),
        adminApi.getTests()
      ]);

      if (studentsResponse.success) setStudents(studentsResponse.data);
      if (coursesResponse.success) setCourses(coursesResponse.data);
      if (testsResponse.success) setTests(testsResponse.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Tələbə məlumatları alınmadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return students;

    return students.filter((student) =>
      [student.name, student.email, student.phoneNumber || '', student.educationLevel || '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [students, deferredSearch]);

  const openAssignment = (student: StudentItem, mode: AssignmentMode = 'course', action: AssignmentAction = 'assign') => {
    setSelectedStudent(student);
    setAssignmentType(mode);
    setAssignmentAction(action);
    setSelectedTargetId('');
    setAssignmentSearch('');
    setAssignmentModalOpen(true);
  };

  const openStudentResults = async (student: StudentItem) => {
    setSelectedResultsStudent(student);
    setStudentResultsModalOpen(true);
    setStudentResultsLoading(true);
    setStudentResultsError('');
    setStudentResults([]);
    setSelectedStudentResult(null);
    setStudentResultsSearch('');

    try {
      const response = await adminApi.getStudentTestResults(student.id);

      if (response.success) {
        const resultsData = response.data?.results || [];
        setStudentResults(resultsData);
        setSelectedStudentResult(resultsData[0] || null);
      } else {
        setStudentResultsError(response.message || 'Tələbə nəticələri alınmadı');
      }
    } catch (error) {
      setStudentResultsError(error instanceof Error ? error.message : 'Tələbə nəticələri alınmadı');
    } finally {
      setStudentResultsLoading(false);
    }
  };

  const handleAssign = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedStudent) return;

    try {
      const response = await adminApi.assignStudentItem(selectedStudent.id, {
        type: assignmentType,
        targetId: selectedTargetId,
        action: assignmentAction
      });

      if (response.success) {
        toast.success(assignmentAction === 'assign'
          ? (assignmentType === 'course' ? 'Kurs tələbəyə verildi' : 'Test tələbəyə verildi')
          : (assignmentType === 'course' ? 'Kurs tələbədən geri alındı' : 'Test tələbədən geri alındı'));
        setAssignmentModalOpen(false);
        setSelectedStudent(null);
        setSelectedTargetId('');
        setAssignmentSearch('');
        await loadData();
      } else {
        toast.error(response.message || 'Təyinat edilə bilmədi');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Təyinat edilə bilmədi');
    }
  };

  const filteredResources = useMemo(() => {
    const query = deferredAssignmentSearch.trim().toLowerCase();

    const toSearchableText = (value: unknown) => String(value ?? '').toLowerCase();

    const courseResources = assignmentAction === 'assign'
      ? courses
      : (selectedStudent && assignmentType === 'course' ? selectedStudent.activeCourses : []);

    const testResources = assignmentAction === 'assign'
      ? tests
      : (selectedStudent && assignmentType === 'test' ? selectedStudent.assignedTests : []);

    if (!query) {
      return assignmentType === 'course'
        ? (courseResources as AssignmentCourseResource[])
        : (testResources as AssignmentTestResource[]);
    }

    if (assignmentType === 'course') {
      const typedCourseResources = courseResources as AssignmentCourseResource[];

      return typedCourseResources.filter((course) => (
        toSearchableText(course.title).includes(query)
        || toSearchableText(course.category).includes(query)
        || toSearchableText(course.instructor).includes(query)
      ));
    }

    const typedTestResources = testResources as AssignmentTestResource[];

    return typedTestResources.filter((test) => (
      toSearchableText(test.title).includes(query)
      || toSearchableText(test.courseTitle).includes(query)
      || toSearchableText(test.instructorName).includes(query)
    ));
  }, [assignmentAction, assignmentType, courses, deferredAssignmentSearch, selectedStudent, tests]);

  const filteredStudentResults = useMemo(() => {
    const query = deferredStudentResultsSearch.trim().toLowerCase();

    if (!query) {
      return studentResults;
    }

    return studentResults.filter((result) => (
      [
        result.test?.title || '',
        result.test?.course?.title || '',
        result.test?.instructor ? `${result.test.instructor.name || ''} ${result.test.instructor.surname || ''}` : '',
        formatAttemptLabel(result.attemptNumber || 1)
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    ));
  }, [deferredStudentResultsSearch, studentResults]);

  useEffect(() => {
    if (!studentResultsModalOpen) {
      return;
    }

    if (filteredStudentResults.length === 0) {
      return;
    }

    const selectedResultStillVisible = selectedStudentResult
      ? filteredStudentResults.some((result) => result.id === selectedStudentResult.id)
      : false;

    if (!selectedResultStillVisible) {
      setSelectedStudentResult(filteredStudentResults[0]);
    }
  }, [filteredStudentResults, selectedStudentResult, studentResultsModalOpen]);

  const getResourceId = (resource: { _id?: string; id?: string } | null | undefined) => resource?._id || resource?.id || '';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-black text-gray-900">Tələbələr</h1>
          <p className="mt-1 text-gray-500">Tələbələr görünür və onlara kurs və ya test təyin edilir.</p>
        </div>
        <button
          onClick={() => loadData()}
          className="inline-flex items-center gap-2 self-start rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:border-[#D4AF37] hover:text-[#D4AF37]"
        >
          <RefreshCw className="h-4 w-4" />
          Yenilə
        </button>
      </div>

      <div className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="text"
              placeholder="Tələbə adı, email və ya telefon ilə axtar..."
              className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all focus:border-[#D4AF37] focus:ring-0"
            />
          </div>
          <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600">
            {filteredStudents.length} tələbə
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-gray-100 bg-white shadow-sm">
        <div className="space-y-3 p-3 sm:p-4">
          {loading && (
            <div className="rounded-2xl border border-gray-100 p-6 text-center text-gray-400">Tələbələr yüklənir...</div>
          )}
          {!loading && filteredStudents.map((student) => (
            <div key={student.id} className="rounded-2xl border border-gray-100 p-4 transition-colors hover:bg-gray-50/50 sm:p-5">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_auto] xl:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
                      <GraduationCap className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-bold text-sm text-gray-900">{student.name}</div>
                      <div className="truncate text-[11px] text-gray-400">{student.educationLevel || 'Təyin edilməyib'}</div>
                    </div>
                  </div>
                </div>
                <div className="min-w-0 text-xs text-gray-500">
                  <div className="truncate font-medium text-gray-700">{student.email}</div>
                  <div className="truncate">{student.phoneNumber || '-'}</div>
                </div>
                <div className="min-w-0">
                  <div className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400 xl:hidden">Kurslar</div>
                  <div className="flex flex-wrap gap-1.5">
                    {student.activeCourses.map((course) => (
                      <span key={course._id} className="max-w-full rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold leading-tight text-gray-600 break-words">
                        {course.title}
                      </span>
                    ))}
                    {student.activeCourses.length === 0 && <span className="text-xs text-gray-400">Yoxdur</span>}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400 xl:hidden">Testlər</div>
                  <div className="flex flex-wrap gap-1.5">
                    {student.assignedTests.map((test) => (
                      <span key={test._id} className="max-w-full rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold leading-tight text-blue-600 break-words">
                        {test.title}
                      </span>
                    ))}
                    {student.assignedTests.length === 0 && <span className="text-xs text-gray-400">Yoxdur</span>}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 xl:items-end">
                  <div className="text-xs text-gray-500">{formatDate(student.createdAt)}</div>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openAssignment(student, 'course')}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-[#D4AF37]/20 transition-all hover:bg-[#B88A1B] active:scale-95"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Kurs ver
                      </button>
                      <button
                        onClick={() => openAssignment(student, 'test')}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#A87A1F] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-[#A87A1F]/20 transition-all hover:bg-[#006fd1] active:scale-95"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Test ver
                      </button>
                        <Link
                          to="/tests"
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-gray-900/15 transition-all hover:bg-gray-800 active:scale-95"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Test nəticələrini gör
                        </Link>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openAssignment(student, 'course', 'remove')}
                        disabled={student.activeCourses.length === 0}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Undo2 className="h-3.5 w-3.5 rotate-180" />
                        Kurs geri al
                      </button>
                      <button
                        onClick={() => openAssignment(student, 'test', 'remove')}
                        disabled={student.assignedTests.length === 0}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        Test geri al
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!loading && filteredStudents.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center italic text-gray-400">
              Hələ ki, heç bir tələbə yoxdur.
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={studentResultsModalOpen}
        onClose={() => setStudentResultsModalOpen(false)}
        title={selectedResultsStudent ? `${selectedResultsStudent.name} üçün test nəticələri` : 'Test nəticələri'}
        contentClassName="max-w-6xl"
        bodyClassName="overflow-hidden p-3 sm:p-4 lg:p-6"
      >
        <div className="flex h-full min-h-0 flex-col gap-5">
          <div className="rounded-3xl bg-gray-50 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-lg font-black text-gray-900">
                  {selectedResultsStudent ? `${selectedResultsStudent.name}` : 'Tələbə'} test nəticələri
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedResultsStudent?.email || ''}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-gray-600 shadow-sm">
                {studentResults.length} nəticə
              </div>
            </div>
          </div>

          {studentResultsLoading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
              Nəticələr yüklənir...
            </div>
          ) : studentResultsError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">
              {studentResultsError}
            </div>
          ) : studentResults.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
              Bu tələbə üçün nəticə tapılmadı.
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
              <div className="min-h-0 space-y-3 overflow-y-auto pr-1 xl:pr-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={studentResultsSearch}
                      onChange={(event) => setStudentResultsSearch(event.target.value)}
                      type="text"
                      placeholder="Test adı ilə axtar..."
                      className="w-full rounded-xl border border-gray-100 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition-all focus:border-[#A87A1F] focus:bg-white"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    <span>{filteredStudentResults.length} tapıldı</span>
                    <span>{studentResults.length} ümumi</span>
                  </div>
                </div>

                {filteredStudentResults.map((result) => {
                  const isActive = selectedStudentResult?.id === result.id;
                  const isPassed = (result.scorePercentage || 0) >= 60;

                  return (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => setSelectedStudentResult(result)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        isActive
                          ? 'border-[#A87A1F] bg-[#A87A1F]/5 shadow-sm'
                          : 'border-gray-100 bg-white hover:border-[#A87A1F]/40 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-bold text-gray-900">
                            {result.test?.title || 'Naməlum test'}
                          </div>
                          <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-[#A87A1F]">
                            {formatAttemptLabel(result.attemptNumber || 1)}
                          </div>
                        </div>
                        <div className={`rounded-xl px-2.5 py-1 text-xs font-black ${result.hasPendingAnswers ? 'bg-yellow-50 text-yellow-600' : isPassed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {result.hasPendingAnswers ? 'Yoxlama' : `${Math.round(result.scorePercentage || 0)}%`}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                        <span>{result.test?.course?.title || 'Kurs yoxdur'}</span>
                        <span>{formatDate(result.completedAt)}</span>
                      </div>
                    </button>
                  );
                })}
                {filteredStudentResults.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                    Axtarışa uyğun test nəticəsi tapılmadı.
                  </div>
                )}
              </div>

              <div className="min-h-0 overflow-y-auto rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
                {selectedStudentResult ? (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.16em] text-[#A87A1F]">
                          {formatAttemptLabel(selectedStudentResult.attemptNumber || 1)}
                        </div>
                        <h4 className="mt-1 text-2xl font-black text-gray-900">
                          {selectedStudentResult.test?.title || 'Naməlum test'}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {selectedStudentResult.test?.course?.title || 'Kurs yoxdur'} · {selectedStudentResult.test?.instructor ? `${selectedStudentResult.test.instructor.name} ${selectedStudentResult.test.instructor.surname || ''}` : 'Naməlum müəllim'}
                        </p>
                      </div>
                      <div className={`rounded-2xl px-4 py-3 text-right ${selectedStudentResult.hasPendingAnswers ? 'bg-yellow-50 text-yellow-700' : (selectedStudentResult.scorePercentage || 0) >= 60 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <div className="text-2xl font-black">
                          {selectedStudentResult.hasPendingAnswers ? 'Yoxlama' : `${Math.round(selectedStudentResult.scorePercentage || 0)}%`}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-[0.14em]">
                          {selectedStudentResult.hasPendingAnswers ? 'Gözləmədə' : 'Nəticə'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <div className="rounded-2xl bg-gray-50 p-4 text-center">
                        <div className="text-2xl font-black text-[#D4AF37]">{selectedStudentResult.answers.filter((answer) => answer.isCorrect).length}</div>
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Doğru</div>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-4 text-center">
                        <div className="text-2xl font-black text-red-500">{selectedStudentResult.answers.filter((answer) => !answer.isCorrect && answer.status === 'graded').length}</div>
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Yanlış</div>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-4 text-center">
                        <div className="text-2xl font-black text-yellow-500">{selectedStudentResult.answers.filter((answer) => answer.status === 'pending').length}</div>
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Gözləyən</div>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-4 text-center">
                        <div className="text-2xl font-black text-gray-600">{Math.max((selectedStudentResult.test?.questions || []).length - selectedStudentResult.answers.length, 0)}</div>
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Boş</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-lg font-bold text-gray-900">Sual və cavablar</h5>
                      <div className="space-y-3">
                        {(selectedStudentResult.test?.questions || []).map((question: any, index: number) => {
                          const answer = selectedStudentResult.answers.find((item) => resolveEntityId(item.questionId) === resolveEntityId(question._id));
                          const hasAnswer = Boolean(answer);
                          const isSelectedQuestionCorrect = Boolean(answer?.isCorrect);
                          const selectedAnswerIndex = normalizeMultipleChoiceAnswerIndex(answer?.answer);
                          const correctAnswerIndex = getMultipleChoiceCorrectAnswerIndex(question);
                          const answerStateLabel = !hasAnswer
                            ? 'Cavab verilməyib'
                            : answer?.status === 'pending'
                              ? 'Yoxlama gözləyir'
                              : isSelectedQuestionCorrect
                                ? 'Doğru'
                                : 'Yanlış';

                          return (
                            <div
                              key={question._id}
                              className={`rounded-2xl border p-4 ${!hasAnswer ? 'border-gray-200 bg-gray-50/80' : answer?.status === 'pending' ? 'border-yellow-200 bg-yellow-50/50' : isSelectedQuestionCorrect ? 'border-green-100 bg-green-50/40' : 'border-red-100 bg-red-50/40'}`}
                            >
                              <div className="flex gap-3">
                                <span className="font-bold text-gray-400">{index + 1}.</span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="text-sm font-medium text-gray-900">
                                      {question.questionType === 'image' ? (
                                        <div className="mt-2 max-w-sm overflow-hidden rounded-xl border border-gray-100">
                                          <img src={question.content} alt="Sual" className="h-auto w-full" />
                                        </div>
                                      ) : question.content}
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${!hasAnswer ? 'bg-gray-100 text-gray-500' : answer?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : isSelectedQuestionCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {answerStateLabel}
                                    </span>
                                  </div>

                                  {question.answerType === 'open_ended' ? (
                                    <div className="mt-4 space-y-3">
                                      <div className="rounded-xl border border-gray-100 bg-white p-3 text-sm">
                                        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Tələbənin Cavabı</span>
                                        <span className="text-gray-900">{answer?.selectedDisplayAnswer ?? answer?.displayAnswer ?? answer?.answer ?? 'Cavab verilməyib'}</span>
                                      </div>
                                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 text-sm">
                                        {!hasAnswer ? (
                                          <span className="font-bold text-gray-500">Bu sual üçün hələ cavab göndərilməyib</span>
                                        ) : isNumericOpenEndedQuestion(question) ? (
                                          <span className={isSelectedQuestionCorrect ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                                            {isSelectedQuestionCorrect ? 'Avtomatik doğru' : 'Avtomatik yanlış'}
                                          </span>
                                        ) : (
                                          <span className={answer?.status === 'pending' ? 'font-bold text-yellow-600' : isSelectedQuestionCorrect ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                                            {answer?.status === 'pending' ? 'Yoxlama gözləyir' : isSelectedQuestionCorrect ? 'Doğru qiymətləndirildi' : 'Yanlış qiymətləndirildi'}
                                          </span>
                                        )}
                                        {!isNumericOpenEndedQuestion(question) && answer?.status !== 'pending' && (
                                          <span className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">Manual yoxlama yoxdur</span>
                                        )}
                                        {answer?.status === 'pending' && (
                                          <span className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">Müəllim baxmalıdır</span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mt-4 space-y-3">
                                      <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="rounded-xl border border-gray-100 bg-white p-3 text-sm">
                                          <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Seçilən şık</span>
                                          <span className="font-medium text-gray-900">{hasAnswer ? (answer?.selectedDisplayAnswer ?? formatMultipleChoiceAnswer(question, answer?.answer ?? '')) : 'Cavab verilməyib'}</span>
                                        </div>
                                        <div className="rounded-xl border border-gray-100 bg-white p-3 text-sm">
                                          <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Düzgün şık</span>
                                          <span className="font-medium text-gray-900">{correctAnswerIndex !== null ? formatMultipleChoiceAnswer(question, String(correctAnswerIndex)) : 'Təyin edilməyib'}</span>
                                        </div>
                                      </div>

                                      {question.options.map((option: string, optionIndex: number) => {
                                      const isSelected = selectedAnswerIndex !== null ? selectedAnswerIndex === optionIndex : answer?.answer === option;
                                        const isActualCorrect = correctAnswerIndex !== null ? correctAnswerIndex === optionIndex : question.correctAnswer === option;
                                        const optionStateClass = isActualCorrect
                                          ? 'border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]'
                                          : isSelected && !isSelectedQuestionCorrect
                                            ? 'border-red-200 bg-red-100 text-red-600'
                                            : 'border-gray-100 bg-white text-gray-500';

                                        return (
                                          <div
                                            key={optionIndex}
                                            className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium ${optionStateClass}`}
                                          >
                                            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${isActualCorrect ? 'bg-[#D4AF37] text-white' : isSelected && !isSelectedQuestionCorrect ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                              {String.fromCharCode(65 + optionIndex)}
                                            </div>
                                            <span className="truncate">{option}</span>
                                            {isActualCorrect && <span className="ml-auto text-[10px] font-black uppercase opacity-70">Doğru</span>}
                                            {!isActualCorrect && isSelected && <span className="ml-auto text-[10px] font-black uppercase opacity-60">Seçilib</span>}
                                          </div>
                                        );
                                      })}
                                      {!hasAnswer && (
                                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                                          Bu sual üçün cavab göndərilməyib.
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-gray-500">
                    Görmək üçün bir nəticə seçin.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
        title={selectedStudent ? `${selectedStudent.name} üçün ${assignmentAction === 'assign' ? 'təyinat' : 'geri alma'}` : 'Təyinat'}
      >
        <form onSubmit={handleAssign} className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {assignmentAction === 'assign' ? (
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 italic sm:text-xs">Tip</label>
              <select
                value={assignmentType}
                onChange={(event) => {
                  const nextType = event.target.value as AssignmentMode;
                  setAssignmentType(nextType);
                  setSelectedTargetId('');
                  setAssignmentSearch('');
                }}
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm font-bold outline-none transition-all focus:border-[#D4AF37] focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3"
              >
                <option value="course">Kurs ver</option>
                <option value="test">Test ver</option>
              </select>
            </div>
          ) : (
            <div className={`col-span-2 rounded-2xl border px-4 py-3 text-sm font-bold ${assignmentType === 'course' ? 'border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[#00825a]' : 'border-[#A87A1F]/20 bg-[#A87A1F]/5 text-[#005cb8]'}`}>
              {assignmentType === 'course' ? 'Kurs geri alma' : 'Test geri alma'}
            </div>
          )}
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 italic sm:text-xs">
              {assignmentAction === 'assign'
                ? (assignmentType === 'course' ? 'Kurs seçin' : 'Test seçin')
                : (assignmentType === 'course' ? 'Geri alınacaq kurs seçin' : 'Geri alınacaq test seçin')}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:left-4 sm:h-5 sm:w-5" />
              <input
                value={assignmentSearch}
                onChange={(event) => setAssignmentSearch(event.target.value)}
                type="text"
                placeholder={assignmentAction === 'assign'
                  ? (assignmentType === 'course' ? 'Kurs axtar...' : 'Test axtar...')
                  : (assignmentType === 'course' ? 'Geri alınacaq kurs axtar...' : 'Geri alınacaq test axtar...')}
                className={`mb-2 w-full rounded-xl border border-gray-100 bg-gray-50 px-10 py-2.5 text-sm font-medium outline-none transition-all focus:bg-white sm:mb-3 sm:rounded-2xl sm:px-12 sm:py-3.5 ${assignmentAction === 'assign' ? 'focus:border-[#D4AF37]' : 'focus:border-red-500'}`}
              />
            </div>
            <select
              required
              value={selectedTargetId}
              onChange={(event) => setSelectedTargetId(event.target.value)}
              className={`w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm font-bold outline-none transition-all focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3 ${assignmentAction === 'assign' ? 'focus:border-[#D4AF37]' : 'focus:border-red-500'}`}
            >
              <option value="">Seçim edin...</option>
              {assignmentType === 'course' ? (
                (filteredResources as AssignmentCourseResource[]).length > 0
                  ? (filteredResources as AssignmentCourseResource[]).map((course) => (
                    <option key={getResourceId(course)} value={getResourceId(course)}>{course.title}</option>
                  ))
                  : <option value="" disabled>{assignmentAction === 'assign' ? 'Axtarışa uyğun kurs tapılmadı' : 'Geri alınacaq kurs tapılmadı'}</option>
              ) : (
                (filteredResources as AssignmentTestResource[]).map((test) => (
                  <option key={getResourceId(test)} value={getResourceId(test)}>{test.title}{assignmentAction === 'assign' && test.courseTitle ? ` · ${test.courseTitle}` : ''}</option>
                ))
              )}
            </select>
          </div>
          <button
            type="submit"
            className={`col-span-2 w-full rounded-xl py-3.5 text-sm font-black text-white shadow-xl transition-all active:scale-95 sm:rounded-2xl sm:py-4 sm:text-base ${assignmentAction === 'assign' ? 'bg-[#D4AF37] shadow-[#D4AF37]/20 hover:bg-[#B88A1B]' : 'bg-red-500 shadow-red-500/20 hover:bg-red-600'}`}
          >
            {assignmentAction === 'assign' ? 'Təyin et' : 'Geri al'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

const Categories = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const loadCategories = async () => {
    setLoading(true);

    try {
      const response = await adminApi.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Kateqoriyalar alınmadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter((category) => (
      category.name.toLowerCase().includes(query)
      || (category.description || '').toLowerCase().includes(query)
      || category.id.toLowerCase().includes(query)
    ));
  }, [categories, deferredSearchQuery]);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await adminApi.createCategory({ name: newCategory.name });
      if (response.success) {
        toast.success('Yeni kateqoriya əlavə edildi');
        setIsModalOpen(false);
        setNewCategory({ name: '' });
        await loadCategories();
      } else {
        toast.error(response.message || 'Kateqoriya əlavə edilə bilmədi');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Kateqoriya əlavə edilə bilmədi');
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      const response = await adminApi.deleteCategory(categoryId);
      if (response.success) {
        toast.success('Kateqoriya silindi');
        await loadCategories();
      } else {
        toast.error(response.message || 'Kateqoriya silinmədi');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Kateqoriya silinmədi');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
            <Grid className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Kateqoriyalar</h1>
            <p className="text-gray-500 font-medium">Kateqoriyalar artıq backend üzərində idarə olunur.</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-black px-6 py-3 font-bold text-white shadow-lg transition-all active:scale-95 hover:bg-gray-900"
        >
          <Plus className="h-5 w-5" />
          Yeni Kateqoriya
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-[28px] border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            type="text"
            placeholder="Kateqoriya axtar..."
            className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-12 py-4 font-medium outline-none transition-all focus:border-[#D4AF37] focus:bg-white"
          />
        </div>
        <div className="text-sm font-medium text-gray-500">
          {filteredCategories.length} kateqoriya
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-sm">
        <div className="space-y-3 p-3 sm:p-4 md:hidden">
          {loading && (
            <div className="rounded-2xl border border-gray-100 p-6 text-center text-gray-400">
              Kateqoriyalar yüklənir...
            </div>
          )}
          {!loading && filteredCategories.map((category) => (
            <div key={category.id} className="rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${category.color || '#E5E7EB'}22` }}
                >
                  <TagIcon className="h-5 w-5" style={{ color: category.color || '#9CA3AF' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-bold text-gray-900">{category.name}</div>
                      <div className="mt-1 break-words text-sm leading-6 text-gray-500">
                        {category.description || 'Açıklama yoxdur'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                      Sil
                    </button>
                  </div>
                  <code className="mt-3 inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-black text-blue-500">
                    {category.id}
                  </code>
                </div>
              </div>
            </div>
          ))}
          {!loading && filteredCategories.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center italic text-gray-400">
              {searchQuery.trim() ? 'Axtarışa uyğun kateqoriya tapılmadı.' : 'Hələ kateqoriya yoxdur.'}
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[11px] font-black italic uppercase tracking-widest text-gray-400">Rəng</th>
                <th className="px-8 py-5 text-[11px] font-black italic uppercase tracking-widest text-gray-400">Kateqoriya</th>
                <th className="px-8 py-5 text-[11px] font-black italic uppercase tracking-widest text-gray-400">Sistem ID</th>
                <th className="px-8 py-5 text-[11px] font-black italic uppercase tracking-widest text-gray-400 text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-gray-400">Kateqoriyalar yüklənir...</td>
                </tr>
              )}
              {!loading && filteredCategories.map((category) => (
                <tr key={category.id} className="transition-colors hover:bg-gray-50/30">
                  <td className="px-8 py-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${category.color || '#E5E7EB'}22` }}>
                      <TagIcon className="h-5 w-5" style={{ color: category.color || '#9CA3AF' }} />
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-lg text-gray-900">{category.name}</div>
                    <div className="text-sm text-gray-500">{category.description || 'Açıklama yoxdur'}</div>
                  </td>
                  <td className="px-8 py-6">
                    <code className="rounded-md bg-blue-50 px-2 py-1 text-xs font-black text-blue-500">{category.id}</code>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center italic text-gray-400">
                    {searchQuery.trim() ? 'Axtarışa uyğun kateqoriya tapılmadı.' : 'Hələ kateqoriya yoxdur.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Kateqoriya">
        <form onSubmit={handleAdd} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500 italic">Kateqoriya adı</label>
            <input
              required
              value={newCategory.name}
              onChange={(event) => setNewCategory({ name: event.target.value })}
              type="text"
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 font-bold outline-none transition-all focus:border-[#D4AF37] focus:bg-white"
              placeholder="Məs: Proqramlaşdırma"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-2xl bg-[#D4AF37] py-5 text-lg font-black text-white shadow-xl shadow-[#D4AF37]/20 transition-all hover:bg-[#B88A1B]"
          >
            Yarat
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default function AppAdmin() {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => loadAdminSession());

  useEffect(() => {
    const handleAuthExpired = () => {
      setAdminSession(null);
    };

    window.addEventListener('rim-admin-auth-expired', handleAuthExpired);

    return () => {
      window.removeEventListener('rim-admin-auth-expired', handleAuthExpired);
    };
  }, []);

  const handleAuthenticated = (session: AdminSession) => {
    localStorage.setItem(ADMIN_SESSION_TOKEN_KEY, session.token);
    localStorage.setItem(ADMIN_SESSION_USER_KEY, JSON.stringify(session.user));
    setAdminSession(session);
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
    localStorage.removeItem(ADMIN_SESSION_USER_KEY);
    setAdminSession(null);
  };

  if (!adminSession) {
    return (
      <>
        <Toaster position="top-right" richColors closeButton />
        <AdminLoginScreen onAuthenticated={handleAuthenticated} />
      </>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <AdminShell onLogout={handleLogout} adminUser={adminSession.user}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/exam-panel" element={<AdminExamPanel />} />
          <Route path="/exam-panel/history/:examId" element={<AdminExamHistoryDetail />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/students" element={<Students />} />
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </AdminShell>
    </BrowserRouter>
  );
}