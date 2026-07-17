import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';
import {
  buildFallbackCourseCategories,
  getPublicCategories,
  getPublicCourses,
  normalizeCategoryKey,
} from '@/services/publicApi';
import type { PublicCategory, PublicCourse } from '@/services/publicApi';

gsap.registerPlugin(ScrollTrigger);

export default function Courses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState('all');
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
        console.error(t('courses.load_error', { defaultValue: 'Kurslar yüklənə bilmədi' }), err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const courseCategories = categories.length > 0 ? categories : buildFallbackCourseCategories(courses);

  const filteredCourses = activeCategory === 'all'
    ? courses
    : courses.filter((course) => normalizeCategoryKey(course.category) === normalizeCategoryKey(activeCategory));

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Cards animation
      const cards = gridRef.current?.querySelectorAll('.course-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [filteredCourses.length]);

  return (
    <section
      ref={sectionRef}
      className="relative py-20 lg:py-32 bg-[#F3F3F3] overflow-hidden"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div ref={titleRef} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#D4AF37] rounded-full" />
            <span className="text-sm font-medium text-[#D4AF37]">{t('common.our_courses', { defaultValue: 'Kurslarımız' })}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            {t('courses.title')}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t('courses.subtitle')}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/30'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t('common.all', { defaultValue: 'Hamısı' })}
          </button>

          {isLoading && courseCategories.length === 0 ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-28 rounded-full" />
            ))
          ) : (
            courseCategories.slice(0, 6).map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category.id
                    ? 'bg-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/30'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))
          )}
        </div>

        {/* Course Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-3xl bg-white overflow-hidden shadow-lg shadow-gray-200/50">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-5 space-y-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-8 w-28 rounded-full" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            filteredCourses.slice(0, 8).map((course) => (
              <div
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
                className="course-card group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300 hover:-translate-y-2"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.image || 'https://via.placeholder.com/600x400'}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col justify-between h-[180px]">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2">
                      {course.description}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={course.instructor?.avatar || 'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirKVGVwei6Df8ct23tMACbeRpeM4981E21T/avatar/1149.jpg'}
                        alt={course.instructor?.name || t('common.teacher', { defaultValue: 'Müəllim' })}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-xs font-medium text-gray-600 truncate max-w-[120px]">
                        {course.instructor ? `${course.instructor.name} ${course.instructor.surname || ''}` : t('brand.name', { defaultValue: 'Sizin Akademiyanız' })}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#D4AF37]">
                      {course.price === 0 ? t('courses.free', { defaultValue: 'Ödənişsiz' }) : `${course.price} AZN`}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!isLoading && filteredCourses.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {t('courses.no_courses_in_category', { defaultValue: 'Seçilmiş kateqoriya üzrə kurs tapılmadı.' })}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button
            onClick={() => navigate('/courses')}
            variant="outline"
            className="border-2 border-gray-300 hover:border-[#D4AF37] hover:text-[#D4AF37] font-semibold rounded-full px-8 py-6 group"
          >
            {t('courses.view_all')}
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}
