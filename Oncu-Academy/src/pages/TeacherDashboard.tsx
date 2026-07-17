import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  BookOpen,
  FileText,
  Video,
  TrendingUp,
  Plus,
  ArrowRight,
  UserPlus,
  Star,
  MessageCircle,
  MessageSquare,
} from 'lucide-react';
import { API_BASE_URL } from '@/services/publicApi';

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('rim_auth_token');
        if (!token) {
          logout();
          navigate('/login', { replace: true });
          return;
        }

        const response = await fetch(`${API_BASE_URL}/teacher/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok || !data.success || !data.data || !data.stats) {
          if (response.status === 401 || response.status === 403) {
            logout();
            navigate('/login', { replace: true });
            return;
          }

          throw new Error(data.message || t('teacher.dashboard.load_error', { defaultValue: 'Dashboard məlumatları yüklənə bilmədi' }));
        }

        setDashboardData({
          teacher: data.data,
          stats: data.stats,
        });
        setLoadError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : t('teacher.dashboard.load_error', { defaultValue: 'Dashboard məlumatları yüklənə bilmədi' });
        setLoadError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [logout, navigate]);

  if (isLoading) {
    return <div className="min-h-screen pt-24 text-center">{t('common.loading')}</div>;
  }

  if (loadError || !dashboardData) {
    return (
      <div className="page-shell min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)]">
        <div className="page-section mx-auto max-w-3xl py-10">
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black text-gray-900">{t('teachers.dashboard_not_loaded')}</h1>
            <p className="mt-3 text-gray-600">{loadError || t('teachers.dashboard_data_not_ready')}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={() => window.location.reload()} className="rounded-xl bg-[#D4AF37] hover:bg-[#B88A1B]">
                {t('common.retry', { defaultValue: 'Yenidən yoxla' })}
              </Button>
              <Button variant="outline" onClick={() => navigate('/login')} className="rounded-xl">
                {t('teacher.dashboard.back_to_login', { defaultValue: 'Login səhifəsinə qayıt' })}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { teacher, stats } = dashboardData;
  const myCourses = Array.isArray(teacher?.courses) ? teacher.courses : [];
  const fallbackCourseRating = myCourses.length > 0
    ? Math.round((myCourses.reduce((sum: number, course: any) => sum + Number(course.rating || 0), 0) / myCourses.length) * 10) / 10
    : 0;
  const courseRating = Number(stats.courseRating || 0) || fallbackCourseRating;

  const scrollToMyCourses = () => {
    const section = document.getElementById('teacher-my-courses');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const statCards = [
    {
      label: t('teacher.dashboard.total_students', { defaultValue: 'Ümumi Tələbə' }),
      value: stats.studentCount,
      icon: Users,
      color: '#D4AF37',
      trend: '---',
      onClick: () => navigate('/teacher/students'),
    },
    {
      label: t('teacher.dashboard.active_courses', { defaultValue: 'Aktiv Kurslar' }),
      value: stats.courseCount,
      icon: BookOpen,
      color: '#A87A1F',
      trend: '---',
      onClick: scrollToMyCourses,
    },
    {
      label: t('teacher.dashboard.tests', { defaultValue: 'Testlər' }),
      value: stats.testCount,
      icon: FileText,
      color: '#F59E0B',
      trend: '---',
      onClick: () => navigate('/teacher/tests'),
    },
    {
      label: t('teacher.dashboard.video_lessons', { defaultValue: 'Video Dərslər' }),
      value: stats.videoCount,
      icon: Video,
      color: '#EC4899',
      trend: '---',
      onClick: () => navigate('/teacher/videos'),
    },
    {
      label: t('teacher.dashboard.course_reviews', { defaultValue: 'Kurs Rəyləri' }),
      value: stats.courseReviewCount || 0,
      icon: MessageCircle,
      color: '#10B981',
      trend: '---',
      onClick: () => navigate('/teacher/course-reviews'),
    },
    {
      label: t('teacher.dashboard.teacher_reviews', { defaultValue: 'Müəllim Rəyləri' }),
      value: stats.teacherReviewCount || 0,
      icon: MessageSquare,
      color: '#8B5CF6',
      trend: '---',
      onClick: () => navigate(`/teachers/${teacher._id || teacher.id}#reviews`),
    },
  ];

  const recentStudents: any[] = [];

  return (
    <div className="page-shell min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)]">
      <div className="page-section mx-auto max-w-7xl py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900">
              {t('teacher.dashboard.title')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('teacher.dashboard.welcome', { name: user?.name || teacher?.name, defaultValue: `Xoş gəldiniz, ${user?.name || teacher?.name}!` })}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => navigate('/teacher/profile')}
              variant="outline"
              className="w-full rounded-xl sm:w-auto"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {t('teacher.dashboard.profile', { defaultValue: 'Profil' })}
            </Button>
            <Button
              onClick={() => navigate('/teacher/courses/create')}
              variant="outline"
              className="w-full rounded-xl border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/5 sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('teacher.dashboard.create_course', { defaultValue: 'Kurs Yarat' })}
            </Button>
            <Button
              onClick={() => navigate('/teacher/upload')}
              variant="outline"
              className="w-full rounded-xl sm:w-auto"
            >
              <Video className="w-4 h-4 mr-2" />
              {t('teacher.dashboard.upload_video', { defaultValue: 'Video Yüklə' })}
            </Button>
            <Button
              onClick={() => navigate('/teacher/test/create')}
              className="w-full rounded-xl bg-[#D4AF37] hover:bg-[#B88A1B] sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('teacher.dashboard.create_test', { defaultValue: 'Test Yarat' })}
            </Button>
            <Button
              onClick={() => navigate('/teacher/exam-panel')}
              variant="outline"
              className="w-full rounded-xl border-[#A87A1F] text-[#A87A1F] hover:bg-[#A87A1F]/5 sm:w-auto"
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('teacher.dashboard.exam_panel', { defaultValue: 'İmtahan Paneli' })}
            </Button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map((stat) => (
            <button
              key={stat.label}
              type="button"
              onClick={stat.onClick}
              className="cursor-pointer rounded-2xl bg-white p-4 text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 sm:p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {stat.trend}
                </span>
              </div>
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-6 shadow-sm" id="teacher-my-courses">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {t('teacher.dashboard.my_courses')}
                </h2>
              </div>

              <div className="space-y-4">
                {myCourses.map((course: any) => (
                  <div
                    key={course.id || course._id}
                    className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full sm:w-40 h-24 object-cover rounded-xl"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900">{course.title}</h3>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{course.studentCount} {t('teacher.dashboard.students', { defaultValue: 'Tələbələr' })}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">{t('common.rating', { defaultValue: 'Reytinq' })}</span>
                            <span className="font-medium text-[#D4AF37]">{course.rating}/5</span>
                          </div>
                          <Progress value={course.rating * 20} className="h-2" />
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            window.scrollTo(0, 0);
                            navigate(`/teacher/courses/${course._id || course.id}`);
                          }}
                          className="text-[#D4AF37] hover:text-[#B88A1B] hover:bg-transparent p-0 font-bold flex items-center group/btn"
                        >
                          {t('teacher.dashboard.view_lessons', { defaultValue: 'Dərslərə bax' })}
                          <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {myCourses.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/70 px-6 py-14 text-center">
                    <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <h3 className="text-lg font-bold text-gray-900">{t('common.no_results')}</h3>
                    <p className="mt-2 text-sm text-gray-500">{t('teachers.no_courses_added_yet')}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {t('teacher.dashboard.my_students')}
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigate('/teacher/students');
                  }}
                  className="text-[#D4AF37] hover:text-[#B88A1B]"
                >
                  {t('common.all', { defaultValue: 'Hamısı' })}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="space-y-3">
                {recentStudents.map((student, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#A87A1F] rounded-full flex items-center justify-center text-white font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{student.name}</h4>
                      <p className="text-sm text-gray-500">{student.course}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[#D4AF37]">{student.progress}%</div>
                      <div className="text-xs text-gray-400">{student.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t('teacher.dashboard.statistics')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-[#D4AF37]/10 to-[#A87A1F]/10 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                    <span className="font-medium text-gray-700">{t('teacher.dashboard.course_rating', { defaultValue: 'Kurs Reytinqi' })}</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900">{courseRating.toFixed(1)}/5</div>
                  <div className="text-sm text-gray-500">{stats.courseReviewCount || 0} {t('teacher.dashboard.reviews', { defaultValue: 'rəy' })}</div>
                </div>

                <div className="p-4 bg-gradient-to-br from-[#8B5CF6]/10 to-[#EC4899]/10 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-5 h-5 text-[#8B5CF6]" />
                    <span className="font-medium text-gray-700">{t('teachers.teacher_rating')}</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {Number(stats.teacherRating || 0).toFixed(1)}/5
                  </div>
                  <div className="text-sm text-gray-500">{stats.teacherReviewCount || 0} {t('teacher.dashboard.reviews', { defaultValue: 'rəy' })}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
