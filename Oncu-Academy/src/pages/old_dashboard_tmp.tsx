import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { tests, teachers } from '@/data/mockData';
import { mockDb } from '@/services/mockDb';
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
  UserPlus
} from 'lucide-react';

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const teacher = teachers[0];

  const myCourses = mockDb.getTeacherCourses(teacher.id);
  const myTests = tests.slice(0, 3);

  const stats = [
    { label: '├£mumi T╔Öl╔Öb╔Ö', value: teacher?.studentCount || 1200, icon: Users, color: '#D4AF37', trend: '+12%' },
    { label: 'Aktiv Kurslar', value: teacher?.courseCount || 8, icon: BookOpen, color: '#A87A1F', trend: '+2' },
    { label: 'Testl╔Ör', value: myTests.length, icon: FileText, color: '#F59E0B', trend: '+5' },
    { label: 'Video D╔Örsl╔Ör', value: '45', icon: Video, color: '#EC4899', trend: '+8' },
  ];

  const recentStudents = [
    { name: 'Aysel M╔Ömm╔Ödova', course: 'IELTS Intensive', progress: 78, date: '2 saat ╔Övv╔Öl' },
    { name: 'Orxan ãÅliyev', course: 'SAT Haz─▒rl─▒─ş─▒', progress: 92, date: '5 saat ╔Övv╔Öl' },
    { name: 'G├╝nay H├╝seynova', course: '─░ngilis Dili', progress: 65, date: '1 g├╝n ╔Övv╔Öl' },
    { name: 'Tural ─░smay─▒lov', course: 'Web Proqramla┼şd─▒rma', progress: 45, date: '2 g├╝n ╔Övv╔Öl' },
  ];


  return (
    <div className="min-h-screen bg-[#F3F3F3] pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900">
              {t('teacher.dashboard.title')}
            </h1>
            <p className="text-gray-600 mt-1">
              Xo┼ş g╔Öldiniz, {user?.name || teacher?.name}!
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => navigate('/teacher/profile')}
              variant="outline"
              className="rounded-xl"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Profil
            </Button>
            <Button
              onClick={() => navigate('/teacher/courses/create')}
              variant="outline"
              className="rounded-xl border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/5"
            >
              <Plus className="w-4 h-4 mr-2" />
              Kurs Yarat
            </Button>
            <Button
              onClick={() => navigate('/teacher/upload')}
              variant="outline"
              className="rounded-xl"
            >
              <Video className="w-4 h-4 mr-2" />
              Video Y├╝kl╔Ö
            </Button>
            <Button
              onClick={() => navigate('/teacher/test/create')}
              className="bg-[#D4AF37] hover:bg-[#B88A1B] rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Test Yarat
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
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
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Courses */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {t('teacher.dashboard.my_courses')}
                </h2>

              </div>

              <div className="space-y-4">
                {myCourses.map((course) => (
                  <div
                    key={course.id}
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
                      <p className="text-sm text-gray-500 mb-3">{course.studentCount} t╔Öl╔Öb╔Ö</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">Reytinq</span>
                            <span className="font-medium text-[#D4AF37]">{course.rating}/5</span>
                          </div>
                          <Progress value={course.rating * 20} className="h-2" />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.scrollTo(0, 0);
                            navigate(`/teacher/courses/${course.id}`);
                          }}
                          className="rounded-lg border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/5 font-bold"
                        >
                          <Video className="w-4 h-4 mr-1" />
                          D╔Örsl╔Ör╔Ö Bax
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Students */}
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
                  Ham─▒s─▒
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="space-y-3">
                {recentStudents.map((student, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                  >
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}


            {/* Analytics */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t('teacher.dashboard.statistics')}
              </h2>
              <div className="space-y-4">

                <div className="p-4 bg-gradient-to-br from-[#A87A1F]/10 to-[#EC4899]/10 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-[#A87A1F]" />
                    <span className="font-medium text-gray-700">Ortalama Reytinq</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900">4.8/5</div>
                  <div className="text-sm text-green-600">+0.3 ke├ğ╔Ön aydan</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
