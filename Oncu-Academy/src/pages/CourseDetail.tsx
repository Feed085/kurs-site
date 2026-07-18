import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Users, 
  CheckCircle2, 
  PlayCircle, 
  ChevronRight,
  Calendar,
  ShoppingBag,
  MessageCircle,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import CourseReviewForm from '@/components/common/CourseReviewForm';
import CourseReviewsList from '@/components/common/CourseReviewsList';
import { API_BASE_URL } from '@/services/publicApi';
import { WHATSAPP_PHONE } from '@/lib/contactInfo';


export default function CourseDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const { user, isAuthenticated } = useAuth();
  const [enrollmentStatus, setEnrollmentStatus] = useState<'approved' | 'pending' | 'none'>('none');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchCourse = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/courses/${id}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setCourse(data.data);
          setTeacher(data.data.instructor);
          
          if (user && user.role === 'student') {
            // There is no enrollment API yet. But activeCourses can be checked
            const studentCheck = await fetch(`${API_BASE_URL}/student/me`, {
               headers: { 'Authorization': `Bearer ${localStorage.getItem('rim_auth_token')}` }
            });
            const stData = await studentCheck.json();
            if(stData.success && stData.data.activeCourses) {
               const hasCourse = stData.data.activeCourses.some((c: any) => c._id === id);
               if(hasCourse) setEnrollmentStatus('approved');
            }
          }
        }
      } catch (err) {
        toast.error(t('courses.load_error', { defaultValue: 'Kurs yüklənə bilmədi' }));
      }
    };
    fetchCourse();
  }, [id, user]);

  const handleRequest = () => {
    if (!isAuthenticated) {
      toast.error(t('courses.login_required', { defaultValue: 'Müraciət etmək üçün daxil olun' }));
      navigate('/login');
      return;
    }
    
    setIsRequesting(true);
    openWhatsApp();
    setIsRequesting(false);
  };

  const openWhatsApp = () => {
    const email = user?.email?.trim();

    if (!email) {
      toast.error(t('common.not_found'));
      return;
    }

    const message = t('courses.whatsapp_message', { 
      course: course.title, 
      email: email,
      defaultValue: `Salam, Men ${course.title} ile maraqlanıram. Nece ödeniş edeceyim haqqında melumat ala bilerem? ${email}` 
    });
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    const popup = window.open(url, '_blank', 'noopener,noreferrer');

    if (!popup) {
      window.location.href = url;
    }
  };

  if (!course) {
    return (
      <div className="page-shell min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('common.not_found')}</h1>
          <Button onClick={() => navigate(-1)}>
            {t('common.go_back', { defaultValue: 'Geri qayıt' })}
          </Button>
        </div>
      </div>
    );
  }

  const courseReviews = Array.isArray(course.reviews) ? course.reviews : [];
  const learningPoints = Array.isArray(course.learningPoints)
    ? course.learningPoints.filter((point: string) => Boolean(point && point.trim()))
    : [];
  const courseIncludes = Array.isArray(course.includes)
    ? course.includes.filter((item: string) => Boolean(item && item.trim()))
    : [];
  const studentCount = Number(course.studentCount || 0);
  const teacherExperience = Number(teacher?.experience || 0);
  const teacherExperienceLabel = teacherExperience > 0
    ? `${teacherExperience} ${t('common.years_experience', { defaultValue: 'il təcrübə' })}`
    : t('teachers.no_experience', { defaultValue: 'Təcrübə qeyd edilməyib' });
  const currentReview = courseReviews.find((review: any) => {
    const reviewUserId = review?.user?._id || review?.user?.id || review?.user;
    return reviewUserId && reviewUserId.toString() === user?.id;
  });







  return (
    <div className="page-shell min-h-screen bg-[#F3F3F3]">
      {/* Header Overlay Section */}
      <div className="relative overflow-hidden bg-[#0A0A0A] pb-12 pt-[calc(var(--site-header-height)+1.5rem)] sm:pb-16 lg:pb-24 lg:pt-[calc(var(--site-header-height)+3rem)]">
        {/* Abstract Background Shapes */}
        <div className="absolute right-0 top-0 hidden h-full w-1/2 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#D4AF37]/5 blur-[96px] sm:block" />
        <div className="absolute bottom-0 left-0 hidden h-full w-1/2 -translate-x-1/3 translate-y-1/3 rounded-full bg-[#A87A1F]/5 blur-[96px] sm:block" />
        
        <div className="page-section relative z-10 mx-auto max-w-7xl">
          <div className="lg:w-2/3">
            {/* Breadcrumbs */}
            <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-400">
              <Link to="/" className="hover:text-white transition-colors">{t('common.home', { defaultValue: 'Ana səhifə' })}</Link>
              <ChevronRight className="w-4 h-4" />
              <Link to="/courses" className="hover:text-white transition-colors">{t('common.courses', { defaultValue: 'Kurslar' })}</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white font-medium">{course.title}</span>
            </div>

            {/* Title & Description */}
            <h1 className="mb-5 text-3xl font-black leading-tight text-white sm:text-4xl lg:mb-6 lg:text-5xl">
              {course.title}
            </h1>
            <p className="mb-8 max-w-2xl text-base text-gray-400 sm:text-lg lg:text-xl">
              {course.description}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(course.rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-white font-bold">{Number(course.rating || 0).toFixed(1)}</span>
                <span className="text-gray-500">({courseReviews.length} {t('common.reviews_count', { defaultValue: 'rəy' })})</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-300">
                <Users className="w-5 h-5 text-[#D4AF37]" />
                <span className="font-medium text-sm">{studentCount} {t('common.student', { defaultValue: 'Tələbə' })}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-5 h-5 text-[#A87A1F]" />
                <span className="font-medium text-sm">{t('courses.last_updated', { defaultValue: 'Yenilənmə tarixi' })}: {new Date(course.updatedAt || course.createdAt).toLocaleDateString('az-AZ')}</span>
              </div>
            </div>
            
            {/* Mobile Price View */}
            <div className="mt-8 flex items-start justify-between rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm lg:hidden sm:p-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">{t('courses.about_course', { defaultValue: 'Kurs haqqında' })}</p>
                <div className="text-2xl font-black text-white sm:text-3xl">{course.title}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="page-section mx-auto max-w-7xl py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Column: Course Details */}
          <div className="flex-1 lg:w-2/3 space-y-12">
            
            {/* What you'll learn */}
            <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#D4AF37]" />
                {t('courses.what_you_will_learn', { defaultValue: 'Bu kursda nə öyrənəcəksiniz?' })}
              </h2>
              {learningPoints.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {learningPoints.map((point: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-sm leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 leading-relaxed">
                  {t('courses.no_learning_goals', { defaultValue: 'Bu kurs üçün öyrənmə hədəfləri hələ əlavə edilməyib.' })}
                </p>
              )}
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
                {t('courses.course_includes', { defaultValue: 'Kurs daxildir' })}
              </h2>
              {courseIncludes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courseIncludes.map((item: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 rounded-2xl bg-gray-50 border border-gray-100 p-4">
                      <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 leading-relaxed">
                  {t('courses.no_includes', { defaultValue: 'Bu kurs üçün daxil olan üstünlüklər hələ əlavə edilməyib.' })}
                </p>
              )}
            </section>



            {/* Instructor */}
            <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('courses.instructor', { defaultValue: 'Təlimçi' })}</h2>
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="shrink-0 flex flex-col items-center">
                  <div className="relative mb-4">
                    <img
                      src={teacher?.avatar || "https://ui-avatars.com/api/?name=Teacher"}
                      alt={teacher?.name}
                      loading="lazy"
                      decoding="async"
                      className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl object-cover border-4 border-gray-50 bg-white"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-1.5 rounded-xl shadow-lg">
                      <Star className="w-4 h-4 fill-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-900">{Number(teacher?.rating || 0).toFixed(1)} {t('common.rating', { defaultValue: 'Reytinq' })}</div>
                    <div className="text-xs text-gray-500">{t('teacher.role', { defaultValue: 'Müəllim' })}</div>
                  </div>
                </div>
                <div className="flex-1">
                  <Link 
                    to={`/teachers/${teacher?._id}`}
                    className="text-xl font-bold text-gray-900 hover:text-[#D4AF37] transition-colors block mb-2"
                  >
                    {teacher?.name} {teacher?.surname}
                  </Link>
                  <p className="text-sm font-medium text-[#D4AF37] uppercase tracking-wider mb-4">
                    {(teacher?.specializedAreas || []).join(', ')}
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 italic line-clamp-3">
                    {teacherExperienceLabel}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/teachers/${teacher?._id}`)}
                    className="rounded-xl border-gray-200 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                  >
                    {t('teacher.view_profile', { defaultValue: 'Profilə bax' })}
                  </Button>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{t('common.reviews', { defaultValue: 'Rəylər' })}</p>
                  <h2 className="text-2xl font-bold text-gray-900 mt-2">{t('courses.course_reviews_title', { defaultValue: 'Kurs haqqında fikirlər' })}</h2>
                  <p className="text-gray-500 mt-2">
                    {t('courses.average_rating', { rating: Number(course.rating || 0).toFixed(1), reviews: courseReviews.length, defaultValue: `Orta reytinq ${Number(course.rating || 0).toFixed(1)} və ${courseReviews.length} rəy.` })}
                  </p>
                </div>
                <div className="rounded-3xl bg-gray-50 border border-gray-100 px-5 py-4 text-right">
                  <div className="text-3xl font-black text-gray-900">{Number(course.rating || 0).toFixed(1)}</div>
                  <div className="flex items-center justify-end gap-1 mt-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(course.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">{courseReviews.length} {t('common.reviews_count', { defaultValue: 'rəy' })}</div>
                </div>
              </div>

              {user?.role === 'student' ? (
                enrollmentStatus === 'approved' ? (
                  <div className="space-y-6 mb-10">
                    <CourseReviewForm
                      key={course.id || course._id}
                      courseId={course._id || course.id}
                      initialRating={currentReview?.rating || 5}
                      initialComment={currentReview?.comment || ''}
                      onSubmitted={(updatedCourse) => setCourse(updatedCourse)}
                    />
                  </div>
                ) : (
                  <p>{t('courses.review_after_enrollment', { defaultValue: 'Kursa qeydiyyat təsdiqlənəndən sonra rəy yaza bilərsiniz.' })}</p>
                )
              ) : !isAuthenticated ? (
                <p>{t('courses.login_for_review', { defaultValue: 'Rəy yazmaq üçün tələbə hesabı ilə daxil olun.' })}</p>
              ) : null}

              <CourseReviewsList reviews={courseReviews} rating={course.rating || 0} />
            </section>
          </div>

          {/* Right Column: Floating Sidebar */}
          <aside className="lg:w-1/3">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-100">
                {/* Preview Image */}
                <div className="relative aspect-video">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Card Content */}
                <div className="p-8">


                  <div className="pt-6 border-t border-gray-100 flex flex-col gap-3">
                    {user?.role === 'teacher' ? (
                      <div className="bg-red-50 text-red-600 p-6 rounded-[24px] border border-red-100 text-center animate-in fade-in duration-500">
                        <ShieldCheck className="w-8 h-8 mx-auto mb-3 opacity-80" />
                        <h4 className="font-black text-sm uppercase tracking-wider mb-1">{t('courses.access_restricted', { defaultValue: 'Giriş Məhduddur' })}</h4>
                        <p className="text-xs font-medium opacity-80 leading-relaxed italic">
                          {t('courses.teacher_access_error', { defaultValue: 'Müəllim hesabı ilə tələbə kurslarına müraciət etmək mümkün deyil.' })}
                        </p>
                      </div>
                    ) : enrollmentStatus === 'approved' ? (
                      <Button 
                        onClick={() => navigate(`/courses/${course.id || course._id}/watch`)}
                        className="w-full h-14 bg-[#D4AF37] hover:bg-[#B88A1B] text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-[#D4AF37]/20"
                      >
                        <PlayCircle className="w-5 h-5" />
                        {t('courses.enter_course', { defaultValue: 'Kursa daxil ol' })}
                      </Button>
                    ) : enrollmentStatus === 'pending' ? (
                      <div className="space-y-3">
                        <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
                           <Loader2 className="w-5 h-5 animate-spin" />
                           {t('courses.request_pending', { defaultValue: 'Müraciətiniz gözləmədədir...' })}
                        </div>
                        <Button 
                          onClick={openWhatsApp}
                          className="w-full h-14 bg-[#25D366] hover:bg-[#128C7E] text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-green-200"
                        >
                          <MessageCircle className="w-5 h-5" />
                          {t('courses.contact_whatsapp', { defaultValue: 'WhatsApp ilə əlaqə saxla' })}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-4 mb-2">
                           <span className="text-4xl font-black text-gray-900">
                             {course.price > 0 ? `${course.price} AZN` : t('courses.free_exclamation', { defaultValue: 'Pulsuz!' })}
                           </span>
                        </div>
                        <Button 
                          onClick={handleRequest}
                          disabled={isRequesting}
                          className="w-full h-14 bg-[#000000] hover:bg-gray-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-gray-200"
                        >
                          {isRequesting ? (
                             <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                             <ShoppingBag className="w-5 h-5" />
                          )}
                          {t('courses.send_request', { defaultValue: 'Müraciət göndər' })}
                        </Button>
                          {t('courses.payment_instruction', { defaultValue: 'Müraciətdən sonra WhatsApp vasitəsilə adminlə əlaqə saxlayaraq ödənişi tamamlayın.' })}
                      </>
                    )}
                  </div>


                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

    </div>
  );
}
