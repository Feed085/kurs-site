import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Users, 
  User,
  BookOpen, 
  Award, 
  ArrowLeft,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getPublicTeacher } from '@/services/publicApi';
import TeacherReviewForm from '@/components/common/TeacherReviewForm';
import CourseReviewsList from '@/components/common/CourseReviewsList';

export default function TeacherDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [teacher, setTeacher] = useState<any>(null);
  const [teacherCourses, setTeacherCourses] = useState<any[]>([]);
  const [teacherReviews, setTeacherReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'courses' | 'about' | 'reviews'>('courses');

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchTeacher = async () => {
      try {
        if (!id) {
          return;
        }

        const response = await getPublicTeacher(id);

        if (response.success && response.data) {
           setTeacher(response.data);
           setTeacherCourses(response.courses || []);
            setTeacherReviews(response.teacherReviews || []);
           setStats(response.stats || {});
        }
      } catch (err) {
        toast.error(t('teacher.detail.load_error', { defaultValue: 'Müəllim yüklənə bilmədi' }));
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeacher();
  }, [id]);

  useEffect(() => {
    if (location.hash === '#reviews') {
      setActiveTab('reviews');
    }
  }, [location.hash]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>;
  }

  if (!teacher) {
    return (
      <div className="page-shell min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('common.not_found')}</h1>
          <Button onClick={() => navigate('/teachers')}>
            {t('teacher.detail.back_to_teachers', { defaultValue: 'Müəllimlərə qayıt' })}
          </Button>
        </div>
      </div>
    );
  }


  const teacherReviewCount = Number(stats?.teacherReviewCount || teacherReviews.length || 0);
  const teacherRating = Number(stats?.teacherRating || teacher.rating || 0);

  return (
    <div className="page-shell min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)]">
      {/* Cover */}
      <div className="relative h-40 bg-gradient-to-r from-[#D4AF37] to-[#A87A1F] sm:h-48 lg:h-72">
        <div className="absolute inset-0 bg-black/20 z-0" />
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-white hover:bg-white/20 z-10"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.back', { defaultValue: 'Geri' })}
        </Button>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8 -mt-16 sm:-mt-20">
        {/* Profile Card */}
        <div className="mb-8 rounded-3xl bg-white p-5 shadow-lg sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Avatar */}
            <div className="relative -mt-20 sm:-mt-24 lg:-mt-32">
              <img
                src={teacher.avatar}
                alt={`${teacher.name} ${teacher.surname}`}
                loading="lazy"
                decoding="async"
                className="w-32 h-32 lg:w-48 lg:h-48 rounded-3xl object-cover border-4 border-white shadow-lg"
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-black text-gray-900">
                    {teacher.name} {teacher.surname}
                  </h1>
                  <p className="text-gray-500 mt-1">
                    {(teacher.specializedAreas || []).join(', ')}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {teacher.location || t('teacher.detail.default_location', { defaultValue: 'Bakı, Azərbaycan' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center px-4 py-2 bg-[#D4AF37]/10 rounded-2xl">
                    <div className="text-2xl font-black text-[#D4AF37]">{teacherRating.toFixed(1)}</div>
                    <div className="flex items-center gap-0.5 justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(teacherRating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs font-medium text-gray-500">{teacherReviewCount} {t('teacher.reviews.reviews_label', { defaultValue: 'rəy' })}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-3">
                <div className="text-center sm:px-2">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-[#D4AF37]" />
                    <span className="text-2xl font-black text-gray-900">{stats?.studentCount || 0}</span>
                  </div>
                  <p className="text-sm text-gray-500">{t('teachers.students')}</p>
                </div>
                <div className="text-center sm:border-x sm:border-gray-100 sm:px-2">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <BookOpen className="w-5 h-5 text-[#A87A1F]" />
                    <span className="text-2xl font-black text-gray-900">{stats?.courseCount || 0}</span>
                  </div>
                  <p className="text-sm text-gray-500">{t('teachers.courses')}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Award className="w-5 h-5 text-[#F59E0B]" />
                    <span className="text-2xl font-black text-gray-900">{teacher.experience ?? 0}</span>
                  </div>
                  <p className="text-sm text-gray-500">{t('teachers.experience')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-100">
            {[
              { key: 'courses', label: t('common.courses', { defaultValue: 'Kurslar' }), icon: BookOpen },
              { key: 'about', label: t('common.about', { defaultValue: 'Haqqında' }), icon: User },
              { key: 'reviews', label: t('common.reviews', { defaultValue: 'Rəylər' }), icon: Star },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-6 lg:p-8">
            {activeTab === 'courses' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teacherCourses.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    {t('teacher.detail.no_courses', { defaultValue: 'Bu müəllimin hələ ki aktiv kursu yoxdur.' })}
                  </div>
                ) : (
                  teacherCourses.map((course) => (
                    <div
                      key={course._id}
                      className="flex cursor-pointer flex-col gap-4 rounded-2xl bg-gray-50 p-4 transition-colors hover:bg-gray-100 sm:flex-row"
                      onClick={() => navigate(`/courses/${course._id}`)}
                    >
                      <img
                        src={course.image || 'https://images.unsplash.com/photo-1546410531-bea5aadcb6ce'}
                        alt={course.title}
                        loading="lazy"
                        decoding="async"
                        className="h-44 w-full rounded-xl object-cover sm:h-20 sm:w-24"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{course.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {course.duration || '0:00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{t('teachers.education', { defaultValue: 'Təhsil' })}</h3>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
                    <Award className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{teacher.education}</p>
                      <p className="text-sm text-gray-500">{t('teachers.higher_education', { defaultValue: 'Ali təhsil' })}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{t('teachers.experience')}</h3>
                  <p className="text-gray-600 leading-relaxed">{teacher.experience ?? 0} {t('teachers.years_abbr')}</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{t('teacher.profile.specialties', { defaultValue: 'İxtisaslar' })}</h3>
                  <div className="flex flex-wrap gap-2">
                    {(teacher.specializedAreas || []).map((specialty: string, index: number) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full text-sm font-medium"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{t('teachers.social_networks')}</h3>
                  <div className="flex gap-3">
                    {teacher.socialLinks?.facebook && (
                      <a
                        href={teacher.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-[#1877F2]/10 rounded-xl flex items-center justify-center hover:bg-[#1877F2]/20 transition-colors"
                      >
                        <Facebook className="w-5 h-5 text-[#1877F2]" />
                      </a>
                    )}
                    {teacher.socialLinks?.instagram && (
                      <a
                        href={teacher.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-gradient-to-r from-[#833AB4]/10 via-[#E1306C]/10 to-[#F77737]/10 rounded-xl flex items-center justify-center hover:from-[#833AB4]/20 hover:via-[#E1306C]/20 hover:to-[#F77737]/20 transition-colors"
                      >
                        <Instagram className="w-5 h-5 text-[#E1306C]" />
                      </a>
                    )}
                    {teacher.socialLinks?.linkedin && (
                      <a
                        href={teacher.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-[#0A66C2]/10 rounded-xl flex items-center justify-center hover:bg-[#0A66C2]/20 transition-colors"
                      >
                        <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {isAuthenticated && user?.role === 'student' ? (
                  <TeacherReviewForm
                    teacherId={teacher.id || teacher._id}
                    initialRating={teacherRating || 5}
                    initialComment=""
                    onSubmitted={(updatedTeacher) => {
                      if (updatedTeacher) {
                        setTeacher((previousTeacher: any) => ({
                          ...previousTeacher,
                          rating: updatedTeacher.rating,
                          teacherRating: updatedTeacher.rating,
                        }));
                        setTeacherReviews(updatedTeacher.reviews || []);
                      }
                    }}
                  />
                ) : !isAuthenticated ? (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center mb-8">
                    <p className="text-gray-600 mb-4">{t('common.login_to_review', { defaultValue: 'Rəy yazmaq üçün qeydiyyatdan keçməlisiniz.' })}</p>
                    <Button 
                      onClick={() => navigate('/login')}
                      variant="outline"
                      className="rounded-xl"
                    >
                      {t('auth.login', { defaultValue: 'Daxil ol' })}
                    </Button>
                  </div>
                ) : null}

                <CourseReviewsList
                  reviews={teacherReviews}
                  rating={teacherRating}
                  pageSize={3}
                  title={t('teacher.detail.teacher_reviews_title', { defaultValue: 'Müəllim rəyləri' })}
                  subtitle={t('teacher.detail.teacher_reviews_subtitle', { defaultValue: 'Bu müəllim üçün' })}
                  summaryText={t('teacher.detail.reviews_summary', { defaultValue: 'rəy toplanıb.' })}
                  emptyMessage={t('teacher.detail.no_reviews_yet', { defaultValue: 'Hələ bu müəllim üçün rəy yoxdur.' })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
