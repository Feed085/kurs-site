import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  PlayCircle, 
  FileText,
  Video,
  Settings,
  Image as ImageIcon,
  Users,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Star,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import CourseReviewsList from '@/components/common/CourseReviewsList';
import { API_BASE_URL } from '@/services/publicApi';
import { formatVideoDuration } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tag } from 'lucide-react';

const loadVideoDuration = (videoUrl: string) => new Promise<number>((resolve) => {
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.src = videoUrl;

  video.onloadedmetadata = () => {
    resolve(Number.isFinite(video.duration) ? video.duration : 0);
  };

  video.onerror = () => {
    resolve(0);
  };
});

export default function TeacherCourseEdit() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0); 
    
    // Əgər ID "undefined" və ya hələ saxta mock ID-dirsə, API-yə sorğu atma
    if (!id || id === 'undefined' || id.length < 10) return;

    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem('rim_auth_token');
        const [courseRes, testsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/courses/${id}`),
          fetch(`${API_BASE_URL}/tests/course/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const courseData = await courseRes.json();
        
        if (courseData.success) {
          setCourse(courseData.data);
          const flatLessons = (courseData.data.modules || []).flatMap((m: any) => m.videos) || [];

          const lessonsWithDuration = await Promise.all(flatLessons.map(async (lesson: any) => {
            const existingDuration = formatVideoDuration(lesson.duration);

            if (existingDuration !== '0:00') {
              return {
                ...lesson,
                duration: existingDuration
              };
            }

            const resolvedDuration = lesson.videoUrl
              ? formatVideoDuration(await loadVideoDuration(lesson.videoUrl))
              : '0:00';

            return {
              ...lesson,
              duration: resolvedDuration
            };
          }));

          setLessons(lessonsWithDuration);
        } else {
          toast.error(t('common.not_found'), { id: 'course-not-found' });
        }

        const testsData = await testsRes.json();
        if (testsData.success) {
           setTests(testsData.data);
        }

        try {
          const categoriesRes = await fetch(`${API_BASE_URL}/categories`);
          const categoriesData = await categoriesRes.json();
          if (categoriesData.success) {
            const normalizedCategories = (categoriesData.data || []).map((category: any) => ({
              id: category.id || category.slug,
              name: category.name
            }));

            if (courseData.success && courseData.data?.category && !normalizedCategories.some((category: any) => category.name === courseData.data.category)) {
              normalizedCategories.unshift({ id: courseData.data.category, name: courseData.data.category });
            }

            setCategories(normalizedCategories);
          }
        } catch (categoryError) {
          console.error(t('teacher.course_edit.categories_load_error', { defaultValue: 'Kateqoriyalar yüklənmədi' }), categoryError);
        }

      } catch (err) {
        toast.error(t('common.server_connection_error', { defaultValue: 'Serverlə əlaqə kəsildi' }), { id: 'server-connection-error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [id]);





  const removeLesson = async (lessonId: string) => {
    const newLessons = lessons.filter(l => l._id !== lessonId && l.id !== lessonId);
    setLessons(newLessons);
    
    // Yadda saxla (Avtomatik backend eşləmə)
    try {
      const token = localStorage.getItem('rim_auth_token');
      const existingModules = course.modules && course.modules.length > 0 ? course.modules : [{ title: t('teacher.course_edit.lessons', { defaultValue: 'Dərslər' }), videos: [] }];
      existingModules[0].videos = newLessons;

      await fetch(`${API_BASE_URL}/courses/${course._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ modules: existingModules })
      });
      toast.success(t('teacher.course_edit.lesson_deleted', { defaultValue: 'Dərs silindi' }));
    } catch(err) {
      console.error(err);
    }
  };

  const handleEditClick = (lesson: any) => {
    setEditingLesson({ ...lesson });
    setIsEditorOpen(true);
  };

  const handleUpdateLesson = async () => {
    const trimmedTitle = typeof editingLesson?.title === 'string' ? editingLesson.title.trim() : '';

    if (!trimmedTitle) {
      toast.error(t('teacher.course_edit.video_title_required', { defaultValue: 'Video başlığı məcburidir' }));
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('rim_auth_token');

      const updatedEditingLesson = {
        ...editingLesson,
        title: trimmedTitle
      };

      delete updatedEditingLesson.thumbnail;
      delete updatedEditingLesson.thumbnailFile;

      const updatedLessons = lessons.map(l => 
         (l._id === editingLesson._id || l.id === editingLesson.id) ? updatedEditingLesson : l
      );
      
      setLessons(updatedLessons);
      
      // Backend yaz
      const existingModules = course.modules && course.modules.length > 0 ? course.modules : [{ title: t('teacher.course_edit.lessons', { defaultValue: 'Dərslər' }), videos: [] }];
      existingModules[0].videos = updatedLessons;

      const res = await fetch(`${API_BASE_URL}/courses/${course._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ modules: existingModules })
      });
      
      const data = await res.json();
      if(data.success) {
        toast.success(t('teacher.course_edit.video_updates_saved', { defaultValue: 'Video yeniləmələri qeyd olundu' }));
        setCourse({ ...course, modules: existingModules });
      }
    } catch(err) {
      toast.error(t('teacher.course_edit.video_update_error', { defaultValue: 'Videonu yeniləyərkən xəta baş verdi' }));
    }

    setIsLoading(false);
    setIsEditorOpen(false);
    setEditingLesson(null);
  };



  const handleSave = async () => {
    try {
      const token = localStorage.getItem('rim_auth_token');
      setIsLoading(true);

      const trimmedTitle = typeof course.title === 'string' ? course.title.trim() : '';
      const trimmedDescription = typeof course.description === 'string' ? course.description.trim() : '';

      if (!trimmedTitle) {
        toast.error(t('teacher.course_edit.course_title_required', { defaultValue: 'Kurs başlığı məcburidir' }));
        setIsLoading(false);
        return;
      }

      if (!trimmedDescription) {
        toast.error(t('teacher.course_edit.about_required', { defaultValue: 'Haqqında bölməsi məcburidir' }));
        setIsLoading(false);
        return;
      }

      const currentImage = typeof course.image === 'string' ? course.image.trim() : '';
      if (!currentImage && !course.imageFile) {
        toast.error(t('teacher.course_edit.cover_image_required', { defaultValue: 'Kover şəkli məcburidir' }));
        setIsLoading(false);
        return;
      }

      let finalImageUrl = currentImage;

      // Kurs kaveri üçün upload
      if (course.imageFile) {
        const presignReq = await fetch(
          `${API_BASE_URL}/upload/presign?filename=${encodeURIComponent(course.imageFile.name)}&contentType=${encodeURIComponent(course.imageFile.type)}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const presignData = await presignReq.json();
        if (presignData.success) {
          const { signedUrl, publicUrl } = presignData.data;
          await fetch(signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': course.imageFile.type },
            body: course.imageFile
          });
          finalImageUrl = publicUrl;
        }
      }

      const payload = {
        title: trimmedTitle,
        category: course.category,
        description: trimmedDescription,
        image: finalImageUrl,
        learningPoints: course.learningPoints || [],
        includes: course.includes || [],
        modules: [{ title: t('teacher.course_edit.lessons', { defaultValue: 'Dərslər' }), videos: lessons }]
      };

      const res = await fetch(`${API_BASE_URL}/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if(data.success) {
        toast.success(t('common.save'));
        setCourse({ ...course, image: finalImageUrl, imageFile: undefined });
      } else {
        toast.error(t('common.error_prefix') + data.message);
      }
    } catch(err) {
      toast.error(t('common.server_error'));
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteCourse = async () => {
    if (!course) {
      return;
    }

    const confirmed = window.confirm(
      t('common.delete') + '?'
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('rim_auth_token');
      if (!token) {
        toast.error(t('auth.toast.login_error'));
        navigate('/login');
        return;
      }

      setIsDeleting(true);

      const res = await fetch(`${API_BASE_URL}/courses/${course._id || id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        toast.success(t('common.delete'));
        navigate('/teacher/dashboard', { replace: true });
      } else {
        throw new Error(data.message || t('common.error'));
      }
    } catch (error: any) {
      toast.error(error.message || t('common.error'));
    } finally {
      setIsDeleting(false);
    }
  };


  if (isLoading) {
    return <div className="min-h-screen pt-24 text-center">{t('common.loading')}</div>;
  }

  if (!course) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p>{t('common.not_found')}</p>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-[#F3F3F3] pt-20 lg:pt-24 pb-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-2 p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-900 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              {t('common.go_back', { defaultValue: 'Geri qayıt' })}
            </Button>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900">
              {t('teacher.course_edit.edit_course', { defaultValue: 'Kursu Redaktə Et' })}
            </h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate(-1)}>
              {t('common.cancel', { defaultValue: 'Ləğv et' })}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleDeleteCourse}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? t('common.deleting', { defaultValue: 'Silinir...' }) : t('teacher.course_edit.delete_course', { defaultValue: 'Kursu Sil' })}
            </Button>
            <Button 
              className="bg-[#D4AF37] hover:bg-[#B88A1B] text-white rounded-xl px-8 font-bold shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-95" 
              onClick={handleSave}
            >
              <Save className="w-4 h-4 mr-2" />
              {t('common.save', { defaultValue: 'Yadda saxla' })}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#D4AF37]" />
                {t('teacher.course_edit.basic_info', { defaultValue: 'Əsas Məlumatlar' })}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('courses.course_title', { defaultValue: 'Kursun Adı' })}</label>
                  <Input 
                    value={course.title}
                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.category', { defaultValue: 'Kateqoriya' })}</label>
                  <Select 
                    value={course.category} 
                    onValueChange={(val) => setCourse({ ...course, category: val })}
                  >
                    <SelectTrigger className="w-full h-11 rounded-xl bg-white border-gray-200">
                      <div className="flex items-center gap-2.5">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <SelectValue placeholder={t('common.select_category', { defaultValue: 'Kateqoriya seçin' })} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl">
                      {categories.map((cat: any) => (
                        <SelectItem 
                          key={cat.id}
                          value={cat.name}
                          className="py-2.5 px-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('courses.about', { defaultValue: 'Haqqında' })}</label>
                  <Textarea 
                    value={course.description}
                    onChange={(e) => setCourse({ ...course, description: e.target.value })}
                    className="rounded-xl border-gray-200 min-h-[120px]"
                  />
                </div>
              </div>
            </div>

            {/* Video Lessons */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#D4AF37]" />
                  {t('teacher.course_edit.video_lessons', { defaultValue: 'Video Dərslər' })}
                </h2>
                <Button 
                  onClick={() => navigate('/teacher/upload')}
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/5 font-bold"
                >
                  <Video className="w-4 h-4 mr-1" />
                  {t('teacher.course_edit.upload_video', { defaultValue: 'Video Yüklə' })}
                </Button>
              </div>
              <div className="space-y-3">
                {lessons.map((lesson: any) => (
                  <div key={lesson.id || lesson._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <PlayCircle className="w-6 h-6 text-[#D4AF37]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{lesson.title}</h4>
                        <p className="text-xs text-gray-500">{t('courses.duration_label', { defaultValue: 'Müddət' })}: {formatVideoDuration(lesson.duration)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-400 hover:text-gray-900 transition-colors"
                        onClick={() => handleEditClick(lesson)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-400 hover:text-red-600 transition-all hover:scale-110"
                        onClick={() => removeLesson(lesson.id || lesson._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quizzes / Tests */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#D4AF37]" />
                  {t('teacher.course_edit.tests_and_assignments', { defaultValue: 'Testlər və Tapşırıqlar' })}
                </h2>
                <Button 
                  onClick={() => navigate('/teacher/test/create')}
                  className="bg-[#D4AF37] hover:bg-[#B88A1B] rounded-xl text-white px-4 h-9 font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('teacher.course_edit.create_test', { defaultValue: 'Test Yarat' })}
                </Button>
              </div>
              <div className="space-y-3">
                {tests.map((test: any) => (
                  <div key={test.id || test._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-4 text-sm font-bold text-gray-900">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <FileText className="w-6 h-6 text-blue-500" />
                      </div>
                      {test.title}
                    </div>
                    <div className="flex gap-2">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-8 w-8 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                         onClick={() => navigate(`/teacher/tests/${test._id}/results`)}
                         title={t('teacher.course_edit.view_results', { defaultValue: 'Nəticələrə bax' })}
                       >
                         <Users className="w-5 h-5" />
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-8 w-8 text-gray-400 hover:text-gray-900 transition-colors"
                         onClick={() => navigate(`/teacher/tests/${test._id}`)}
                       >
                         <Settings className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400">
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{t('teacher.reviews', { defaultValue: 'Rəylər' })}</p>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mt-2">
                    <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
                    {t('teacher.course_edit.course_reviews', { defaultValue: 'Kurs rəyləri' })}
                  </h2>
                </div>
                <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-right">
                  <div className="text-2xl font-black text-gray-900">{Number(course.rating || 0).toFixed(1)}</div>
                  <div className="flex items-center justify-end gap-1 mt-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(course.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">{(course.reviews || []).length} {t('teacher.reviews.reviews_label', { defaultValue: 'rəy' })}</div>
                </div>
              </div>

              <CourseReviewsList reviews={course.reviews || []} rating={course.rating || 0} pageSize={4} showSummary={false} />
            </div>

            {/* What You'll Learn */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
                  {t('teacher.course_edit.what_will_you_learn', { defaultValue: 'Bu kursda nə öyrənəcəksiniz?' })}
                </h2>
                <Button 
                  onClick={() => {
                    const newPoints = [...(course.learningPoints || []), t('teacher.course_edit.new_point', { defaultValue: 'Yeni öyrənəcəyiniz bənd' })];
                    setCourse({ ...course, learningPoints: newPoints });
                  }}
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/5 font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('teacher.course_edit.add_point', { defaultValue: 'Bənd Əlavə Et' })}
                </Button>
              </div>
              <div className="space-y-3">
                {(course.learningPoints || []).map((point: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <Input 
                      value={point}
                      onChange={(e) => {
                        const newPoints = [...course.learningPoints];
                        newPoints[idx] = e.target.value;
                        setCourse({ ...course, learningPoints: newPoints });
                      }}
                      className="rounded-xl border-gray-200"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        const newPoints = course.learningPoints.filter((_: any, i: number) => i !== idx);
                        setCourse({ ...course, learningPoints: newPoints });
                      }}
                      className="text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Includes */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                  {t('teacher.course_edit.course_includes', { defaultValue: 'Kurs daxildir' })}
                </h2>
                <Button 
                  onClick={() => {
                    const newIncludes = [...(course.includes || []), t('teacher.course_edit.new_feature', { defaultValue: 'Yeni xüsusiyyət' })];
                    setCourse({ ...course, includes: newIncludes });
                  }}
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/5 font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('teacher.course_edit.add', { defaultValue: 'Əlavə Et' })}
                </Button>
              </div>
              <div className="space-y-3">
                {(course.includes || []).map((item: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <Input 
                      value={item}
                      onChange={(e) => {
                        const newIncludes = [...course.includes];
                        newIncludes[idx] = e.target.value;
                        setCourse({ ...course, includes: newIncludes });
                      }}
                      className="rounded-xl border-gray-200"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        const newIncludes = course.includes.filter((_: any, i: number) => i !== idx);
                        setCourse({ ...course, includes: newIncludes });
                      }}
                      className="text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('courses.course_image', { defaultValue: 'Kurs Şəkli' })}</h3>
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 relative group cursor-pointer mb-4">
                <img 
                  src={course.image} 
                  alt={course.title} 
                  className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 p-3 rounded-full shadow-lg">
                    <ImageIcon className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                </div>
                  <input 
                  type="file" 
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const fakeUrl = URL.createObjectURL(file);
                      setCourse({ ...course, image: fakeUrl, imageFile: file });
                    }
                  }}
                />
              </div>
              <p className="text-xs text-center text-gray-500">{t('test.edit.click_to_change_image', { defaultValue: 'Şəkli dəyişmək üçün üzərinə klikləyin' })}</p>
            </div>

          </div>
        </div>
        
        {/* Floating Save Button */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/50 flex gap-4">
            <Button 
                onClick={() => navigate(-1)}
                variant="outline"
                className="rounded-xl px-8 h-12 font-bold bg-white border-2 border-gray-100"
            >
              {t('common.cancel', { defaultValue: 'Ləğv et' })}
            </Button>
            <Button 
                onClick={handleSave}
                className="bg-[#D4AF37] hover:bg-[#B88A1B] text-white rounded-xl px-12 h-12 font-bold shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-95"
            >
              <Save className="w-4 h-4 mr-2" />
              {t('common.save', { defaultValue: 'Yadda Saxla' })}
            </Button>
        </div>
      </div>
    </div>

      {/* Video Edit Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold italic">{t('courses.edit_video_lesson', { defaultValue: 'Video Dərsi Redaktə Et' })}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm font-bold text-gray-700">{t('courses.video_title', { defaultValue: 'Video Başlığı' })}</Label>
              <Input
                id="title"
                value={editingLesson?.title || ''}
                onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                required
                className="rounded-xl h-11 border-gray-200 focus:border-[#D4AF37]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm font-bold text-gray-700">{t('courses.description', { defaultValue: 'Açıqlama' })}</Label>
              <Textarea
                id="description"
                value={editingLesson?.description || ''}
                onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                placeholder={t('teacher.course_edit.description_placeholder', { defaultValue: 'Video dərsi haqqında ətraflı məlumat...' })}
                className="rounded-xl min-h-[80px] border-gray-200 focus:border-[#D4AF37] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="sticky bottom-0 bg-white pt-2 border-t mt-4">
            <Button 
              className="bg-[#D4AF37] hover:bg-[#B88A1B] text-white rounded-xl w-full h-12 font-bold shadow-lg shadow-[#D4AF37]/20"
              onClick={handleUpdateLesson}
            >
              {t('common.save_changes', { defaultValue: 'Dəyişiklikləri Yadda Saxla' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
