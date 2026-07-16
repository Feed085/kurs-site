import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, Search, MessageCircle, Star, Filter, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/services/publicApi';

export default function TeacherCourseReviews() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [minRating, setMinRating] = useState('all');
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
          throw new Error(data.message || 'Kurs rəyləri yüklənmədi');
        }
      } catch (error: any) {
        toast.error(error.message || 'Kurs rəyləri yüklənmədi');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [navigate]);

  const normalizedReviews = useMemo(() => {
    return courses.flatMap((course) => {
      const courseId = String(course._id || course.id || '');
      const reviews = Array.isArray(course.reviews) ? course.reviews : [];

      return reviews.map((review: any) => {
        const reviewerName = review.user && typeof review.user === 'object'
          ? `${review.user.name || ''} ${review.user.surname || ''}`.trim()
          : review.name || 'Tələbə';

        return {
          ...review,
          courseId,
          courseTitle: course.title || 'Naməlum kurs',
          courseRating: Number(course.rating || 0),
          ratingValue: Number(review.rating || 0),
          reviewerName,
          searchableText: [course.title, reviewerName, review.comment].filter(Boolean).join(' ').toLowerCase()
        };
      });
    });
  }, [courses]);

  const courseOptions = useMemo(() => {
    return courses
      .map((course) => ({
        id: String(course._id || course.id || ''),
        title: course.title || 'Naməlum kurs'
      }))
      .filter((course) => course.id);
  }, [courses]);

  const courseReviewCounts = useMemo(() => {
    return normalizedReviews.reduce((accumulator, review) => {
      accumulator[review.courseId] = (accumulator[review.courseId] || 0) + 1;
      return accumulator;
    }, {} as Record<string, number>);
  }, [normalizedReviews]);

  const filteredReviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const selectedRating = minRating === 'all' ? 0 : Number(minRating);

    return normalizedReviews.filter((review) => {
      const matchesCourse = selectedCourseId === 'all' ? true : review.courseId === String(selectedCourseId);
      const matchesRating = selectedRating === 0 ? true : review.ratingValue === selectedRating;
      const matchesSearch = !query || review.searchableText.includes(query);

      return matchesCourse && matchesRating && matchesSearch;
    });
  }, [normalizedReviews, searchQuery, selectedCourseId, minRating]);

  const totalReviews = normalizedReviews.length;
  const activeFiltersCount = [searchQuery.trim(), selectedCourseId !== 'all', minRating !== 'all'].filter(Boolean).length;
  const averageRating = totalReviews > 0
    ? normalizedReviews.reduce((sum, review) => sum + review.ratingValue, 0) / totalReviews
    : 0;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCourseId('all');
    setMinRating('all');
  };

  if (isLoading) {
    return <div className="min-h-screen pt-24 text-center">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F3F3F3] pt-20 lg:pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-900 group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Geri qayıt
        </Button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{t('testimonials.title', { defaultValue: 'Kurs rəyləri' })}</p>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900 mt-2">{t('teachers.course_reviews_panel')}</h1>
            <p className="text-gray-600 mt-1">{t('teachers.course_reviews_desc')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rəy, müəllim, kurs axtar..."
                className="pl-10 rounded-xl bg-white border-gray-200"
              />
            </div>
            <Button onClick={() => navigate('/teacher/profile#teacher-reviews')} variant="outline" className="rounded-xl border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/5">
              Müəllim Reyləri
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">{t('teachers.total_reviews')}</p>
            <div className="mt-2 text-2xl font-black text-gray-900">{totalReviews}</div>
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Orta bal</p>
            <div className="mt-2 text-2xl font-black text-gray-900">{averageRating.toFixed(1)}</div>
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Aktiv filtr</p>
            <div className="mt-2 text-2xl font-black text-gray-900">{activeFiltersCount}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 text-sm font-medium text-gray-600">
            <Filter className="w-4 h-4" />
            Filtrlər
          </div>
          <button
            type="button"
            onClick={() => setSelectedCourseId('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCourseId === 'all' ? 'bg-[#D4AF37] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}
          >
            Hamısı ({totalReviews})
          </button>
          {courseOptions.map((course) => {
            return (
              <button
                type="button"
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCourseId === course.id ? 'bg-[#D4AF37] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}
              >
                {course.title} ({courseReviewCounts[course.id] || 0})
              </button>
            );
          })}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all inline-flex items-center gap-2 bg-gray-900 text-white hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
              Filtrləri sil
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { value: 'all', label: 'Bütün ballar' },
            { value: '5', label: '5' },
            { value: '4', label: '4' },
            { value: '3', label: '3' },
            { value: '2', label: '2' },
            { value: '1', label: '1' }
          ].map((rating) => (
            <button
              type="button"
              key={rating.value}
              onClick={() => setMinRating(rating.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${minRating === rating.value ? 'bg-[#D4AF37] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}
            >
              {rating.value === 'all' ? (
                'Bütün ballar'
              ) : (
                <>
                  <span>{rating.label}</span>
                  <Star className="w-3.5 h-3.5 fill-current" />
                </>
              )}
            </button>
          ))}
        </div>

        <div className="mb-4 text-sm text-gray-500">
          {filteredReviews.length} nəticə göstərilir
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredReviews.map((review) => {
            return (
              <div key={review._id || `${review.courseId}-${review.reviewerName}-${review.createdAt || ''}`} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{review.courseTitle}</p>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">{review.reviewerName}</h3>
                    <p className="text-xs text-gray-500 mt-1">{review.createdAt ? new Date(review.createdAt).toLocaleDateString('az-AZ') : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl bg-gray-50 px-3 py-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-black text-gray-900">{review.ratingValue.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap break-words">{review.comment}</p>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="ghost"
                    className="text-[#D4AF37] hover:text-[#B88A1B] hover:bg-[#D4AF37]/5"
                    onClick={() => navigate(`/teacher/courses/${review.courseId}`)}
                  >
                    Kursu aç
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredReviews.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{t('common.no_results')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
