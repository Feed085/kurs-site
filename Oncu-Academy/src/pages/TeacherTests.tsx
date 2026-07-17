import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, Search, Filter, FileText, Clock, Layers3, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/services/publicApi';

type CourseTest = {
  _id?: string;
  id?: string;
  title?: string;
  duration?: number;
  createdAt?: string;
  questions?: unknown[];
  course?: {
    _id?: string;
    id?: string;
    title?: string;
  } | null;
};

export default function TeacherTests() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tests, setTests] = useState<CourseTest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const token = localStorage.getItem('rim_auth_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/tests/my`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success) {
          setTests(data.data || []);
        } else {
          throw new Error(data.message || t('teacher.tests.load_error', { defaultValue: 'Testlər yüklənmədi' }));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : t('teacher.tests.load_error', { defaultValue: 'Testlər yüklənmədi' });
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, [navigate]);

  const courses = useMemo(() => {
    const map = new Map<string, string>();
    tests.forEach((test) => {
      const course = test.course;
      if (!course) return;
      const courseId = course._id || course.id;
      if (!courseId) return;
      if (!map.has(courseId)) {
        map.set(courseId, course.title || t('common.unknown_course', { defaultValue: 'Naməlum kurs' }));
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [tests]);

  const filteredTests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tests.filter((test) => {
      const course = test.course;
      const courseId = course?._id || course?.id || '';
      const courseTitle = course?.title || '';
      const matchesCourse = selectedCourseId === 'all' ? true : courseId === selectedCourseId;
      const matchesSearch = !query || [test.title, courseTitle].some((value) => String(value || '').toLowerCase().includes(query));

      return matchesCourse && matchesSearch;
    });
  }, [searchQuery, selectedCourseId, tests]);

  if (isLoading) {
    return <div className="min-h-screen pt-24 text-center">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F3F3F3] pt-20 lg:pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-900 group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          {t('common.go_back', { defaultValue: 'Geri qayıt' })}
        </Button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{t('teacher.tests.subtitle')}</p>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900 mt-2">{t('teacher.tests.title')}</h1>
            <p className="text-gray-600 mt-1">{t('teacher.tests.description')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('teacher.tests.search_placeholder', { defaultValue: 'Test və ya kurs axtar...' })}
                className="pl-10 rounded-xl bg-white border-gray-200"
              />
            </div>
            <Button onClick={() => navigate('/teacher/test/create')} className="bg-[#D4AF37] hover:bg-[#B88A1B] rounded-xl">
              <FileText className="w-4 h-4 mr-2" />
              Test Yarat
            </Button>
            <Button onClick={() => navigate('/teacher/exam-panel')} variant="outline" className="rounded-xl border-[#A87A1F] text-[#A87A1F] hover:bg-[#A87A1F]/5">
              <ArrowRight className="w-4 h-4 mr-2" />
              İmtahan Paneli
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button
            type="button"
            onClick={() => setSelectedCourseId('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${selectedCourseId === 'all' ? 'bg-[#D4AF37] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}
          >
            <Filter className="w-4 h-4" />
            {t('common.all', { defaultValue: 'Hamısı' })}
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${selectedCourseId === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{tests.length}</span>
          </button>
          {courses.map((course) => {
            const count = tests.filter((test) => (test.course?._id || test.course?.id) === course.id).length;

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
            const course = test.course;
            const questionCount = Array.isArray(test.questions) ? test.questions.length : 0;

            return (
              <div key={test._id || test.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{new Date(test.createdAt || Date.now()).toLocaleDateString('az-AZ')}</span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{test.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course?.title || t('common.unknown_course')}</p>

                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-5">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                    <Layers3 className="w-3 h-3" />
                    {questionCount} {t('common.questions', { defaultValue: 'sual' })}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                    <Clock className="w-3 h-3" />
                    {test.duration} {t('common.minutes', { defaultValue: 'dəq' })}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => navigate(`/teacher/tests/${test._id || test.id}`)}
                  >
                    {t('common.edit', { defaultValue: 'Düzəlt' })}
                  </Button>
                  <Button
                    className="flex-1 rounded-xl bg-[#D4AF37] hover:bg-[#B88A1B]"
                    onClick={() => navigate(`/teacher/tests/${test._id || test.id}/results`)}
                  >
                    {t('teacher.tests.results', { defaultValue: 'Nəticələr' })}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTests.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{t('common.no_results')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
