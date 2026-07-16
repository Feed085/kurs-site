import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  Video, 
  FileVideo,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/services/publicApi';
import { formatVideoDuration } from '@/lib/utils';

const getVideoDuration = (file: File) => new Promise<number>((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');

  video.preload = 'metadata';
  video.src = objectUrl;

  video.onloadedmetadata = () => {
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    URL.revokeObjectURL(objectUrl);
    resolve(duration);
  };

  video.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error('Video müddəti oxuna bilmədi'));
  };
});

export default function UploadVideo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo({
      top: 150,
      behavior: 'smooth'
    });
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
  });
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [teacherCourses, setTeacherCourses] = useState<any[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('rim_auth_token');
        const res = await fetch(`${API_BASE_URL}/courses/my-courses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setTeacherCourses(data.data);
        }
      } catch (err) {
        toast.error(t('common.error_prefix') + ' ' + (err instanceof Error ? err.message : ''));
      }
    };
    fetchCourses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        toast.success(t('common.success'));
      } else {
        toast.error(t('common.error'));
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        toast.success(t('common.success'));
      } else {
        toast.error(t('common.error'));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoFile) {
      toast.error(t('common.error'));
      return;
    }
    if (!formData.title || !formData.courseId) {
      toast.error(t('common.error'));
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const token = localStorage.getItem('rim_auth_token');

      // 1. Get Presigned URL for Video
      const presignVideoReq = await fetch(
        `${API_BASE_URL}/upload/presign?filename=${encodeURIComponent(videoFile.name)}&contentType=${encodeURIComponent(videoFile.type)}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const presignVideoData = await presignVideoReq.json();
      if (!presignVideoData.success) throw new Error('Presigned URL (video) xətası');

      const videoSignedUrl = presignVideoData.data.signedUrl;
      const videoPublicUrl = presignVideoData.data.publicUrl;

      // 2. Upload Video via native XMLHttpRequest for tracking
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', videoSignedUrl, true);
        xhr.setRequestHeader('Content-Type', videoFile.type);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded * 100) / event.total);
            setUploadProgress(percentage);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(`Upload status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Şəbəkə xətası (upload)'));
        xhr.send(videoFile);
      });

      // 3. Update Course with new Video Module
      // Mövcud kursu çəkib, modullarını yeniləyəcəyik
      const courseReq = await fetch(`${API_BASE_URL}/courses/${formData.courseId}`);
      const courseData = await courseReq.json();
      if (!courseData.success) throw new Error(t('common.not_found'));

      let durationLabel = '0:00';
      try {
        durationLabel = formatVideoDuration(await getVideoDuration(videoFile));
      } catch (durationError) {
        console.warn('Video müddəti alınmadı', durationError);
      }
      
      const course = courseData.data;
      const newVideo = {
         title: formData.title,
         description: formData.description,
         duration: durationLabel,
         videoUrl: videoPublicUrl
      };

      const existingModules = course.modules && course.modules.length > 0 ? course.modules : [{ title: 'Dərslər', videos: [] }];
      existingModules[0].videos.push(newVideo);

      const updateReq = await fetch(`${API_BASE_URL}/courses/${formData.courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ modules: existingModules })
      });
      const updateData = await updateReq.json();
      if (!updateData.success) throw new Error('Kurs güncəllənə bilmədi');

      setIsUploaded(true);
      toast.success(t('common.save'));
    } catch(err: any) {
      toast.error(t('common.error_prefix') + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (isUploaded) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)] flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-4">
            {t('common.save')}
          </h1>
          <p className="text-gray-600 mb-8">
            Video'nuz təsdiqləndikdən sonra dərc olunacaq.
          </p>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-xl"
            >
              Geri qayıt
            </Button>
            <Button
              onClick={() => {
                setIsUploaded(false);
                setVideoFile(null);
                setFormData({ title: '', description: '', courseId: '' });
              }}
              className="flex-1 bg-[#D4AF37] hover:bg-[#B88A1B] rounded-xl"
            >
              Yeni video yüklə
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900">
              {t('teacher.upload.title')}
            </h1>
            <p className="text-gray-600">
              Yeni video dərs yükləyin
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-3xl border-2 border-dashed p-6 text-center transition-all sm:p-8 lg:p-12 ${
              isDragging
                ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                : videoFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {videoFile ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                  <FileVideo className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{videoFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideoFile(null);
                  }}
                  className="text-red-500 hover:text-red-600 text-sm font-medium"
                >
                  Sil
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Videonu bura sürükləyin
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    və ya klikləyib seçin
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  MP4, MOV, AVI (maks. 500MB)
                </p>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('teacher.upload.course')}
              </label>
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                required
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37] outline-none"
              >
                <option value="">{t('common.select', { defaultValue: 'Select...' })}</option>
                {teacherCourses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('teacher.upload.title_label')}
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Video başlığı"
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('teacher.upload.description')}
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Video haqqında qısa məlumat..."
                rows={4}
                className="rounded-xl resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isUploading}
            className="w-full bg-[#D4AF37] hover:bg-[#B88A1B] text-white font-semibold rounded-xl h-14 text-lg"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 w-full px-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('common.loading')} {uploadProgress}%</span>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5" />
                <span>{t('teacher.upload.upload')}</span>
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
