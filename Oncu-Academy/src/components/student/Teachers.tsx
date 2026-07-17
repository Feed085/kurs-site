import { useEffect, useLayoutEffect, useRef } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Users, BookOpen, ArrowRight } from 'lucide-react';
import { getPublicTeachers } from '@/services/publicApi';
import type { PublicTeacher } from '@/services/publicApi';

gsap.registerPlugin(ScrollTrigger);

export default function Teachers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [teachers, setTeachers] = useState<PublicTeacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchTeachers = async () => {
      try {
        const teacherList = await getPublicTeachers();

        if (isMounted) {
          setTeachers(teacherList);
        }
      } catch (error) {
        console.error(t('teachers.load_error', { defaultValue: 'Müəllimlər yüklənə bilmədi' }), error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTeachers();

    return () => {
      isMounted = false;
    };
  }, []);

  useLayoutEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

    if (!isDesktop) {
      const mobileCards = gridRef.current?.querySelectorAll('.teacher-card');

      gsap.set(titleRef.current, { opacity: 1, y: 0 });
      if (mobileCards && mobileCards.length > 0) {
        gsap.set(mobileCards, { opacity: 1, y: 0, scale: 1 });
      }

      return;
    }

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
      const cards = gridRef.current?.querySelectorAll('.teacher-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
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
  }, [teachers.length, isLoading]);

  return (
    <section
      ref={sectionRef}
      className="relative py-16 lg:py-32 bg-[#0A0A0A] overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-[#A87A1F]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:hidden mb-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full mb-4">
              <span className="w-2 h-2 bg-[#D4AF37] rounded-full" />
            <span className="text-sm font-medium text-gray-300">{t('common.our_team', { defaultValue: 'Komandamız' })}</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-3">
              {t('teachers.title')}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
              {t('teachers.subtitle')}
            </p>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="teacher-card rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-3 min-w-0">
                      <Skeleton className="h-5 w-3/4 bg-white/10" />
                      <Skeleton className="h-4 w-1/2 bg-white/10" />
                      <div className="grid grid-cols-3 gap-2">
                        <Skeleton className="h-4 w-full bg-white/10" />
                        <Skeleton className="h-4 w-full bg-white/10" />
                        <Skeleton className="h-4 w-full bg-white/10" />
                      </div>
                      <Skeleton className="h-9 w-full rounded-xl bg-white/10" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              teachers.slice(0, 6).map((teacher) => (
                <div
                  key={teacher.id}
                  className="teacher-card rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={teacher.avatar}
                      alt={`${teacher.name} ${teacher.surname}`}
                      className="h-20 w-20 rounded-2xl object-cover shrink-0 border border-white/10"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-white leading-tight truncate">
                            {teacher.name} {teacher.surname}
                          </h3>
                          <p className="text-gray-300 text-xs mt-1 line-clamp-2">
                            {(teacher.specialties || []).slice(0, 2).join(', ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-white/90 rounded-full shrink-0">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-[11px] font-bold text-gray-900">{teacher.rating}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-400 mb-3">
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span className="truncate">{teacher.studentCount}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          <BookOpen className="w-3.5 h-3.5 text-[#A87A1F]" />
                          <span className="truncate">{teacher.courseCount}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 min-w-0 text-[#F59E0B]">
                          <span className="truncate">{teacher.experience} {t('common.years', { defaultValue: 'il' })}</span>
                        </span>
                      </div>

                      <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-4">
                        {teacher.bio}
                      </p>

                      <Button
                        onClick={() => navigate(`/teachers/${teacher.id}`)}
                        variant="outline"
                        className="w-full bg-white border-transparent text-black hover:bg-[#D4AF37] hover:text-white rounded-xl group/btn"
                      >
                        {t('teachers.view_profile')}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!isLoading && teachers.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              {t('teachers.no_data_found', { defaultValue: 'Müəllim məlumatı tapılmadı.' })}
            </div>
          )}
        </div>

        <div className="hidden lg:block">
        {/* Title */}
        <div ref={titleRef} className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-8 lg:mb-12">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full mb-4">
              <span className="w-2 h-2 bg-[#D4AF37] rounded-full" />
            <span className="text-sm font-medium text-gray-300">{t('common.our_team', { defaultValue: 'Komandamız' })}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              {t('teachers.title')}
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl">
              {t('teachers.subtitle')}
            </p>
          </div>
          <Button
            onClick={() => navigate('/teachers')}
            variant="outline"
            className="mt-4 w-full sm:w-auto lg:mt-0 bg-white border-transparent text-black hover:bg-[#D4AF37] hover:text-white rounded-full px-6 group"
          >
            {t('teachers.button')}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Teachers Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="teacher-card group relative bg-white/5 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/10"
              >
                <Skeleton className="h-48 sm:h-64 w-full rounded-none" />
                <div className="p-4 sm:p-5 space-y-4">
                  <Skeleton className="h-6 w-2/3 bg-white/10" />
                  <Skeleton className="h-4 w-1/2 bg-white/10" />
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <Skeleton className="h-4 w-16 bg-white/10" />
                    <Skeleton className="h-4 w-16 bg-white/10" />
                    <Skeleton className="h-4 w-16 bg-white/10" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
                </div>
              </div>
            ))
          ) : (
            teachers.slice(0, 6).map((teacher) => (
              <div
                key={teacher.id}
                className="teacher-card group relative bg-white/5 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2"
              >
                {/* Image */}
                <div className="relative h-48 sm:h-64 overflow-hidden">
                  <img
                    src={teacher.avatar}
                    alt={`${teacher.name} ${teacher.surname}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Rating */}
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-gray-900">{teacher.rating}</span>
                  </div>

                  {/* Name overlay */}
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 leading-tight">
                      {teacher.name} {teacher.surname}
                    </h3>
                    <p className="text-gray-300 text-xs sm:text-sm leading-snug">
                      {(teacher.specialties || []).slice(0, 2).join(', ')}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 min-w-0">
                      <Users className="w-4 h-4 text-[#D4AF37]" />
                      <span className="truncate">{teacher.studentCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 min-w-0">
                      <BookOpen className="w-4 h-4 text-[#A87A1F]" />
                      <span className="truncate">{teacher.courseCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 min-w-0">
                      <span className="text-[#F59E0B] truncate">{teacher.experience} {t('common.years', { defaultValue: 'il' })}</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                    {teacher.bio}
                  </p>

                  {/* Button */}
                  <Button
                    onClick={() => navigate(`/teachers/${teacher.id}`)}
                    variant="outline"
                    className="w-full bg-white border-transparent text-black hover:bg-[#D4AF37] hover:text-white rounded-xl group/btn"
                  >
                    {t('teachers.view_profile')}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {!isLoading && teachers.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            {t('teachers.no_data_found', { defaultValue: 'Müəllim məlumatı tapılmadı.' })}
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
