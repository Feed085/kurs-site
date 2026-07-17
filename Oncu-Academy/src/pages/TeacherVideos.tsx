import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, Search, Film, Video, PlayCircle, Layers3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatVideoDuration } from '@/lib/utils';
import { API_BASE_URL } from '@/services/publicApi';

export default function TeacherVideos() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('rim_auth_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/courses/my-courses`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success) {
          setCourses(data.data || []);
        } else {
          throw new Error(data.message || t('teacher.videos.load_error', { defaultValue: 'Video dərslər yüklənmədi' }));
        }
      } catch (error: any) {
        toast.error(error.message || t('teacher.videos.load_error', { defaultValue: 'Video dərslər yüklənmədi' }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [navigate]);

  const flattenedVideos = useMemo(() => {
    return courses.flatMap((course) => {
      const modules = Array.isArray(course.modules) ? course.modules : [];

      return modules.flatMap((module: any, moduleIndex: number) => {
        const videos = Array.isArray(module.videos) ? module.videos : [];

        return videos.map((video: any, videoIndex: number) => ({
          ...video,
          courseId: course._id || course.id,
          courseTitle: course.title,
          courseImage: course.image,
          moduleTitle: module.title || `Modul ${moduleIndex + 1}`,
          videoKey: `${course._id || course.id}-${moduleIndex}-${videoIndex}`
        }));
      });
    });
  }, [courses]);

  const courseOptions = useMemo(() => {
    return courses.map((course) => ({
      id: course._id || course.id,
      title: course.title || t('common.unknown_course', { defaultValue: 'Naməlum kurs' })
    }));
  }, [courses]);

  const filteredVideos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return flattenedVideos.filter((video) => {
      const matchesCourse = selectedCourseId === 'all' ? true : video.courseId === selectedCourseId;
      const matchesSearch = !query || [video.title, video.courseTitle, video.moduleTitle].some((value) => String(value || '').toLowerCase().includes(query));
      return matchesCourse && matchesSearch;
    });
  }, [flattenedVideos, searchQuery, selectedCourseId]);

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
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{t('teacher.videos.subtitle')}</p>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900 mt-2">{t('teacher.videos.title')}</h1>
            <p className="text-gray-600 mt-1">{t('teacher.videos.description')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('teacher.videos.search_placeholder', { defaultValue: 'Video və ya modul axtar...' })}
                className="pl-10 rounded-xl bg-white border-gray-200"
              />
            </div>
            <Button onClick={() => navigate('/teacher/upload')} className="bg-[#D4AF37] hover:bg-[#B88A1B] rounded-xl">
              <Video className="w-4 h-4 mr-2" />
              {t('teacher.videos.upload_video', { defaultValue: 'Video Yüklə' })}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button
            type="button"
            onClick={() => setSelectedCourseId('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${selectedCourseId === 'all' ? 'bg-[#D4AF37] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}
          >
            <Film className="w-4 h-4" />
            {t('common.all', { defaultValue: 'Hamısı' })}
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${selectedCourseId === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{flattenedVideos.length}</span>
          </button>
          {courseOptions.map((course) => {
            const count = flattenedVideos.filter((video) => video.courseId === course.id).length;

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
          {filteredVideos.map((video) => (
            <div key={video.videoKey} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100 mb-4 relative">
                <img src={video.thumbnail || video.courseImage || 'https://via.placeholder.com/800x450'} alt={video.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <PlayCircle className="w-7 h-7 text-[#D4AF37]" />
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{video.title}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{video.courseTitle} · {video.moduleTitle}</p>

              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-5">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                  <Layers3 className="w-3 h-3" />
                  {t('teacher.videos.module', { defaultValue: 'Modul' })}: {video.moduleTitle}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                  <Video className="w-3 h-3" />
                  {t('teacher.videos.duration', { defaultValue: 'Müddət:' })} {formatVideoDuration(video.duration)}
                </span>
              </div>

              <Button
                className="w-full rounded-xl bg-[#D4AF37] hover:bg-[#B88A1B]"
                onClick={() => navigate(`/teacher/courses/${video.courseId}`)}
              >
                {t('teacher.videos.open_course', { defaultValue: 'Kursu Aç' })}
              </Button>
            </div>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{t('common.no_results')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
