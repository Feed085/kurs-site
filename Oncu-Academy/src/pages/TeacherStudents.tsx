import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/services/publicApi';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Search, 
  Mail, 
  Phone, 
  Calendar,
  Users
} from 'lucide-react';

export default function TeacherStudents() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('rim_auth_token');
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/teacher/students`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
          setStudents(data.data);
        }
      } catch (err) {
        toast.error(t('common.error'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const allCourses = Array.from(new Set(students.map(s => s.course)));

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse ? student.course === selectedCourse : true;
    return matchesSearch && matchesCourse;
  });

  if (isLoading) {
    return <div className="min-h-screen pt-24 text-center">{t('common.loading')}</div>;
  }

  return (
    <div className="page-shell min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)]">
      <div className="page-section mx-auto max-w-7xl py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-900 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            {t('common.go_back', { defaultValue: 'Geri qayıt' })}
          </Button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-[#D4AF37]" />
                {t('teacher.students.my_students', { defaultValue: 'Tələbələrim' })}
              </h1>
              <p className="text-gray-600 mt-1">{t('teachers.students_count', { count: students.length })}</p>
            </div>
            <div className="flex w-full gap-3 md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t('teacher.students.search_placeholder', { defaultValue: 'Tələbə və ya kurs axtar...' })}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Course Filters */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCourse(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              selectedCourse === null
                ? 'bg-[#D4AF37] text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            {t('common.all', { defaultValue: 'Hamısı' })}
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
              selectedCourse === null ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {students.length}
            </span>
          </button>
          {allCourses.map((course) => {
            const count = students.filter(s => s.course === course).length;
            return (
              <button
                key={course}
                onClick={() => setSelectedCourse(course)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedCourse === course
                    ? 'bg-[#D4AF37] text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                }`}
              >
                {course}
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  selectedCourse === course ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Students Table/Grid */}
        <div className="space-y-3 md:hidden">
          {filteredStudents.map((student) => (
            <article key={student.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#A87A1F]/20 font-bold text-[#B88A1B]">
                  {student.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-gray-900">{student.name}</h3>
                  <p className="mt-1 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">{student.course}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2 break-all"><Mail className="h-3.5 w-3.5 shrink-0" />{student.email}</div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" />{student.phone}</div>
                <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 shrink-0" />{student.date}</div>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('teachers.students')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('common.course', { defaultValue: 'Kurs' })}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('teachers.contact')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('teacher.students.registration', { defaultValue: 'Qeydiyyat' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#A87A1F]/20 flex items-center justify-center text-[#B88A1B] font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                        {student.course}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          {student.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          {student.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {student.date}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="py-20 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">{t('common.no_results')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
