import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Users, 
  Star, 
  ArrowRight,
  Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  buildFallbackCourseCategories,
  getPublicCategories,
  getPublicCourses,
  normalizeCategoryKey,
  resolveCategoryLabel,
} from '@/services/publicApi';
import type { PublicCategory, PublicCourse } from '@/services/publicApi';

export default function CoursesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchCourses = async () => {
      try {
        const [coursesResult, categoriesResult] = await Promise.allSettled([
          getPublicCourses(),
          getPublicCategories()
        ]);

        if (!isMounted) {
          return;
        }

        const loadedCourses = coursesResult.status === 'fulfilled' ? coursesResult.value : [];
        const loadedCategories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];

        setCourses(loadedCourses);
        setCategories(loadedCategories.length > 0 ? loadedCategories : buildFallbackCourseCategories(loadedCourses));
      } catch (err) {
        console.error('Kurslar yüklənə bilmədi', err);
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    fetchCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleCategories = categories.length > 0 ? categories : buildFallbackCourseCategories(courses);

  const filteredCourses = courses.filter((course) => {
    const categoryLabel = resolveCategoryLabel(course.category, visibleCategories);
    const titleMatch = course.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const teacherMatch = course.instructor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         course.instructor?.surname?.toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch = categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSearch = titleMatch || descMatch || teacherMatch || categoryMatch;
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      normalizeCategoryKey(course.category) === normalizeCategoryKey(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-shell min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)]">
      <div className="page-section mx-auto max-w-7xl py-6 sm:py-8">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#D4AF37] rounded-full" />
            <span className="text-sm font-medium text-[#D4AF37]">{t('courses.badge')}</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
            {t('courses.title')}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('courses.subtitle')}
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('courses.search')}
              className="pl-12 h-14 rounded-2xl bg-white border-2 border-gray-100 shadow-lg shadow-gray-200/50 focus:border-[#D4AF37] focus:ring-0 transition-all text-base placeholder:text-gray-400"
            />
          </div>
          <div className="w-full shrink-0 sm:w-[240px] lg:w-[260px]">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full !h-14 bg-white border-2 border-gray-100 rounded-2xl shadow-lg shadow-gray-200/50 focus:ring-0 focus:ring-offset-0 outline-none focus:border-[#D4AF37] text-gray-700 font-medium px-5">
                <div className="flex items-center gap-2.5">
                  <Filter className="w-4 h-4 text-[#D4AF37]" />
                  <SelectValue placeholder={t('courses.category')} />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2 min-w-[220px]">
                <SelectItem
                  value="all"
                  className="py-3 px-4 rounded-xl text-sm font-medium text-gray-600 cursor-pointer focus:bg-[#D4AF37]/10 focus:text-[#D4AF37] data-[state=checked]:text-[#D4AF37] data-[state=checked]:bg-[#D4AF37]/5 transition-colors mb-1 last:mb-0"
                >
                  {t('courses.categories.all')}
                </SelectItem>

                {isLoading && visibleCategories.length === 0 ? (
                  <SelectItem value="loading" disabled className="py-3 px-4 rounded-xl text-sm font-medium text-gray-400">
                    {t('teachers.loading_categories')}
                  </SelectItem>
                ) : (
                  visibleCategories.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id}
                      className="py-3 px-4 rounded-xl text-sm font-medium text-gray-600 cursor-pointer focus:bg-[#D4AF37]/10 focus:text-[#D4AF37] data-[state=checked]:text-[#D4AF37] data-[state=checked]:bg-[#D4AF37]/5 transition-colors mb-1 last:mb-0"
                    >
                      {cat.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="group bg-white rounded-3xl overflow-hidden shadow-sm">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-5 space-y-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-8 w-28 rounded-full" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
            ))
          ) : (
            filteredCourses.map((course) => (
              <div
                key={course.id}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.image || 'https://via.placeholder.com/600x400'}
                    alt={course.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  
                  {/* Rating badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-semibold">{course.rating || '0.0'}</span>
                  </div>

                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Meta */}
                  <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{course.instructor ? `${course.instructor.name} ${course.instructor.surname || ''}` : t('brand.name')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" />
                      <span>{resolveCategoryLabel(course.category, visibleCategories)}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <img
                        src={course.instructor?.avatar || 'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirKVGVwei6Df8ct23tMACbeRpeM4981E21T/avatar/1149.jpg'}
                        alt={course.instructor?.name || t('courses.instructor')}
                        loading="lazy"
                        decoding="async"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-xs font-medium text-gray-600 truncate max-w-[120px]">
                        {course.instructor ? `${course.instructor.name} ${course.instructor.surname || ''}` : t('brand.name')}
                      </span>
                    </div>
                    {/* Price info if available */}
                    <div className="text-sm font-bold text-[#D4AF37]">
                      {course.price === 0 ? t('courses.free') : `${course.price} AZN`}
                    </div>
                  </div>

                  {/* Button */}
                  <Button
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="w-full mt-4 bg-[#D4AF37] hover:bg-[#B88A1B] text-white rounded-xl group/btn"
                  >
                    {t('courses.view_lessons')}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Empty State */}
        {!isLoading && filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t('courses.not_found')}
            </h3>
            <p className="text-gray-500">
              {t('test.empty_desc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
