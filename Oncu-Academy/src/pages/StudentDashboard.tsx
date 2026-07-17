import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  FileText, 
  Play,
  Award
} from 'lucide-react';
import { API_BASE_URL } from '@/services/publicApi';

export default function StudentDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [assignedTests, setAssignedTests] = useState<any[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');
  
  const [apiStats, setApiStats] = useState({
    activeCoursesCount: 0,
    assignedTestsCount: 0,
    completedTestsCount: 0,
    adminApprovedAssignedTestsCount: 0,
    certificatesCount: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('rim_auth_token');
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/student/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success && data.data && data.data.stats) {
          setApiStats({
            activeCoursesCount: data.data.stats.activeCoursesCount,
            assignedTestsCount: data.data.stats.assignedTestsCount ?? (data.data.assignedTests || []).length,
            completedTestsCount: data.data.stats.completedTestsCount,
            adminApprovedAssignedTestsCount: data.data.stats.adminApprovedAssignedTestsCount ?? 0,
            certificatesCount: data.data.stats.certificatesCount
          });
          setMyCourses(data.data.activeCourses || []);
          setAssignedTests((data.data.assignedTests || []).filter((test: any) => !test.isAdminAssigned));
        }
      } catch (err) {
        console.error(t('student.dashboard.stats_load_error', { defaultValue: 'Statistika yüklənərkən xəta baş verdi' }), err);
      }
    };
    
    if (user && user.role === 'student') {
      fetchStats();
    }
  }, [user]);

  const scrollToCourses = () => {
    const el = document.getElementById('my-courses-section');
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const scrollToTests = () => {
    const el = document.getElementById('my-tests-section');
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const stats = [
    { label: t('student.dashboard.active_courses', { defaultValue: 'Aktiv Kurslar' }), value: apiStats.activeCoursesCount.toString(), icon: BookOpen, color: '#D4AF37', onClick: scrollToCourses },
    { label: t('student.dashboard.my_tests', { defaultValue: 'Mənim Testlərim' }), value: apiStats.assignedTestsCount.toString(), icon: FileText, color: '#A87A1F', onClick: scrollToTests },
    { label: t('student.dashboard.completed_tests', { defaultValue: 'Tamamlanan Testlər' }), value: apiStats.completedTestsCount.toString(), icon: FileText, color: '#A87A1F', onClick: () => navigate('/dashboard/completed-tests') },
    { label: t('student.dashboard.certificates', { defaultValue: 'Sertifikatlar' }), value: apiStats.certificatesCount.toString(), icon: Award, color: '#F59E0B', onClick: () => navigate('/dashboard/certificates') },
  ];

  const filteredCourses = useMemo(() => {
    const query = courseSearch.trim().toLowerCase();

    if (!query) {
      return myCourses;
    }

    return myCourses.filter((course) => (
      [course.title, course.category, course.description]
        .join(' ')
        .toLowerCase()
        .includes(query)
    ));
  }, [courseSearch, myCourses]);

  const filteredTests = useMemo(() => {
    const query = testSearch.trim().toLowerCase();

    if (!query) {
      return assignedTests;
    }

    return assignedTests.filter((test) => (
      [
        test.title,
        test.course?.title || '',
        test.instructor ? `${test.instructor.name || ''} ${test.instructor.surname || ''}` : '',
        test.duration ? String(test.duration) : ''
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    ));
  }, [assignedTests, testSearch]);

  const hasExamPanelTests = apiStats.adminApprovedAssignedTestsCount > 0;

  return (
    <div className="page-shell min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)]">
      <div className="page-section mx-auto max-w-7xl py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900">
              {t('student.dashboard.title')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('student.dashboard.welcome', { name: user?.name, defaultValue: `Xoş gəldiniz, ${user?.name}!` })}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => navigate('/dashboard/profile')}
              variant="outline"
              className="rounded-xl border-gray-200"
            >
              {t('student.dashboard.my_profile', { defaultValue: 'Mənim Profilim' })}
            </Button>
            <Button
              onClick={() => navigate('/courses')}
              className="bg-[#D4AF37] hover:bg-[#B88A1B] text-white rounded-xl"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {t('student.dashboard.browse_courses', { defaultValue: 'Kurslara bax' })}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              onClick={stat.onClick}
              className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:p-5"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          {/* My Courses */}
          <div className="lg:col-span-2 space-y-8">
            <div id="my-courses-section" className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t('student.dashboard.my_courses')}
                  </h2>
                </div>
                <input
                  value={courseSearch}
                  onChange={(event) => setCourseSearch(event.target.value)}
                  type="text"
                  placeholder={t('student.dashboard.search_course', { defaultValue: 'Kurs axtar...' })}
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-[#D4AF37] focus:bg-white sm:max-w-xs"
                />
              </div>

              <div className="space-y-4">
                {filteredCourses.map((course) => (
                  <div
                    key={course._id || course.id}
                    className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full sm:w-32 h-24 object-cover rounded-xl"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{course.title}</h3>
                      <p className="text-sm text-gray-500 mb-3">{course.category}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">{t('student.progress', { defaultValue: 'Tərəqqi' })}</span>
                            <span className="font-medium text-[#D4AF37]">{course.progress ?? 0}%</span>
                          </div>
                          <Progress value={course.progress ?? 0} className="h-2" />
                        </div>
                        <Button
                          onClick={() => navigate(`/courses/${course._id}/watch`, { state: { from: 'dashboard' } })}
                          size="sm"
                          className="w-full rounded-lg bg-[#D4AF37] hover:bg-[#B88A1B] sm:w-auto"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {t('student.dashboard.start', { defaultValue: 'Başla' })}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                 {filteredCourses.length === 0 && (
                  <div className="text-center py-12">
                     <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-gray-300" />
                     </div>
                     <p className="text-gray-500">{t('student.no_courses_yet', { defaultValue: 'Hələ heç bir kursunuz yoxdur.' })}</p>
                     <Button 
                       variant="link" 
                       onClick={() => navigate('/courses')}
                       className="text-[#D4AF37] mt-2 font-bold"
                     >
                       {t('student.dashboard.browse_courses', { defaultValue: 'Kurslara göz at' })}
                     </Button>
                  </div>
                )}
              </div>
            </div>

            <div id="my-tests-section" className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t('student.my_tests', { defaultValue: 'Mənim Testlərim' })}</h2>
                  <p className="text-sm text-gray-500 mt-1">{t('student.my_tests_desc', { defaultValue: 'Sizə təyin olunmuş testlər' })}</p>
                </div>
                <input
                  value={testSearch}
                  onChange={(event) => setTestSearch(event.target.value)}
                  type="text"
                  placeholder={t('student.dashboard.search_test', { defaultValue: 'Test axtar...' })}
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-[#A87A1F] focus:bg-white sm:max-w-xs"
                />
              </div>

              {hasExamPanelTests ? (
                <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#D4AF37]/20 bg-[#FFF9E7] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-bold text-[#A87A1F]">{t('student.active_tests_in_exam_panel', { defaultValue: 'Aktiv İmtahanlar Panelidədir' })}</div>
                    <p className="mt-1 text-sm text-gray-600">
                      {t('student.dashboard.admin_exams_info', { count: apiStats.adminApprovedAssignedTestsCount, defaultValue: `${apiStats.adminApprovedAssignedTestsCount} admin imtahanı normal testlərdən ayrı saxlanılır.` })}
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/exam-panel')}
                    className="bg-[#D4AF37] hover:bg-[#B88A1B] rounded-xl text-white font-bold"
                  >
                    {t('student.dashboard.go_to_exam_panel', { defaultValue: 'İmtahan panelinə keç' })}
                  </Button>
                </div>
              ) : null}

              <div className="space-y-4">
                {filteredTests.map((test) => (
                  (() => {
                    const hasAttempted = Boolean(test.hasAttempted || (test.attemptCount || 0) > 0);
                    const canRetake = Boolean(test.allowRetake);
                    const buttonLabel = !hasAttempted ? t('student.dashboard.start_test', { defaultValue: 'Testə başla' }) : canRetake ? t('student.dashboard.retake_test', { defaultValue: 'Təkrar test' }) : t('student.dashboard.view_results', { defaultValue: 'Nəticələri gör' });
                    const buttonAction = !hasAttempted || canRetake
                      ? () => navigate(`/tests/${test._id || test.id}`)
                      : () => navigate('/dashboard/completed-tests');

                    return (
                  <div
                    key={test._id || test.id}
                    className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:bg-gray-100 sm:flex-row sm:items-center"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{test.title}</h3>
                      {hasAttempted && !canRetake ? (
                        <p className="mt-1 text-xs font-semibold text-[#A87A1F]">{t('student.test_completed', { defaultValue: 'Test tamamlanıb' })}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                        {test.course?.title ? <span>{test.course.title}</span> : null}
                        <span>{test.instructor ? `${test.instructor.name} ${test.instructor.surname || ''}` : t('student.unknown_teacher', { defaultValue: 'Naməlum müəllim' })}</span>
                        <span>{test.duration ? `${test.duration} ${t('test.minutes_short', { defaultValue: 'dəqiqə' })}` : t('student.no_duration', { defaultValue: 'Müddət yoxdur' })}</span>
                      </div>
                    </div>
                    <Button
                      onClick={buttonAction}
                      className="w-full rounded-xl bg-[#A87A1F] text-white font-bold hover:bg-[#006fd1] sm:w-auto sm:self-start"
                    >
                      {buttonLabel}
                    </Button>
                  </div>
                    );
                  })()
                ))}

                {filteredTests.length === 0 && (
                  <div className="text-center py-12 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{t('student.no_course_tests', { defaultValue: 'Hazırda kurs testiniz yoxdur.' })}</p>
                    {hasExamPanelTests ? (
                      <Button
                        onClick={() => navigate('/exam-panel')}
                        variant="link"
                        className="mt-2 font-bold text-[#A87A1F]"
                      >
                        {t('student.dashboard.open_admin_exams', { defaultValue: 'Admin imtahanlarını imtahan panelində aç' })}
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
               <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-[#D4AF37]" />
               </div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">{t('student.close_to_goals', { defaultValue: 'Hədəflərinizə yaxınsınız!' })}</h3>
               <p className="text-sm text-gray-500 mb-6">{t('student.close_to_goals_desc', { defaultValue: 'Kursları tamamlayaraq sertifikatlarınızı əldə edin və biliklərinizi rəsmiləşdirin.' })}</p>
               <Button 
                 onClick={() => navigate('/courses')}
                 className="w-full bg-[#D4AF37] hover:bg-[#B88A1B] rounded-xl font-bold"
               >
                 {t('student.dashboard.discover_new_course', { defaultValue: 'Yeni Kurs Kəşf Et' })}
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
