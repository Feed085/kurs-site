import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare } from 'lucide-react';
import gsap from 'gsap';
import { getPublicStats } from '@/services/publicApi';

export default function Hero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [heroStats, setHeroStats] = useState({
    experience: 15,
    students: 5000,
    teachers: 50
  });

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Initial states
      gsap.set([titleRef.current, subtitleRef.current, descRef.current, buttonsRef.current], {
        opacity: 0,
        y: 50,
      });

      // Animation timeline
      const tl = gsap.timeline({ delay: 0.3 });

      tl.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
      })
        .to(
          subtitleRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.6'
        )
        .to(
          descRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.5'
        )
        .to(
          buttonsRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.5'
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const data = await getPublicStats();

        if (isMounted && data) {
          setHeroStats({
            experience: Number(data.experience || 15),
            students: Number(data.students || 0),
            teachers: Number(data.teachers || 0)
          });
        }
      } catch (error) {
        console.error('Hero statistikaları yüklənmədi', error);
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1.5rem)] sm:pt-[calc(var(--site-header-height)+2rem)]"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient circles */}
        <div className="absolute right-[-6rem] top-[-4rem] hidden h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-transparent blur-3xl sm:block lg:right-[-10rem] lg:top-[-8rem] lg:h-[50rem] lg:w-[50rem]" />
        <div className="absolute bottom-[-4rem] left-[-4rem] hidden h-[18rem] w-[18rem] rounded-full bg-gradient-to-tr from-[#A87A1F]/10 to-transparent blur-3xl sm:block lg:bottom-[-8rem] lg:left-[-8rem] lg:h-[38rem] lg:w-[38rem]" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #000 1px, transparent 1px),
              linear-gradient(to bottom, #000 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Floating shapes */}
      <div className="absolute left-10 top-20 hidden h-20 w-20 rounded-2xl bg-[#D4AF37]/20 rotate-12 animate-pulse lg:block" />
      <div className="absolute right-20 top-40 hidden h-16 w-16 rounded-full bg-[#A87A1F]/20 animate-bounce lg:block" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-40 left-20 hidden h-12 w-12 rounded-lg bg-[#D4AF37]/30 -rotate-12 animate-pulse lg:block" style={{ animationDuration: '2s' }} />
      <div className="absolute bottom-20 right-40 hidden h-24 w-24 rounded-xl bg-[#A87A1F]/10 rotate-45 lg:block" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-4 text-center sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg sm:mb-8">
          <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-700">{t('hero.badge')}</span>
        </div>

        {/* Main Title */}
        <h1
          ref={titleRef}
          className="mb-4 text-4xl font-black tracking-tight text-gray-900 sm:text-6xl md:text-7xl lg:text-9xl"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          {t('hero.title')}
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="mb-5 text-lg font-bold text-[#D4AF37] sm:text-2xl md:text-3xl sm:mb-6"
        >
          {t('hero.subtitle')}
        </p>

        {/* Description */}
        <p
          ref={descRef}
          className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg lg:mb-10"
        >
          {t('hero.description')}
        </p>

        {/* CTA Buttons */}
        <div ref={buttonsRef} className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button
            onClick={() => navigate('/courses')}
            className="group w-full rounded-full bg-[#D4AF37] px-8 py-6 text-base font-semibold text-white transition-all hover:bg-[#B88A1B] hover:shadow-lg hover:shadow-[#D4AF37]/30 sm:w-auto"
          >
            {t('hero.cta')}
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const contactSection = document.getElementById('contact');
              contactSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group w-full rounded-full border-2 border-gray-900/10 bg-white/50 px-8 py-6 text-base font-semibold text-gray-700 shadow-sm transition-all active:scale-95 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] hover:shadow-md sm:w-auto"
          >
            <MessageSquare className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            {t('hero.cta_secondary')}
          </Button>
        </div>

        {/* Stats Preview */}
        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-3 sm:mt-16 sm:grid-cols-3 sm:gap-6 lg:gap-8">
          {[
            { value: `${heroStats.experience}+`, label: t('stats.experience.label') },
            { value: `${heroStats.students}+`, label: t('stats.students.label') },
            { value: `${heroStats.teachers}+`, label: t('stats.teachers.label') },
          ].map((stat, index) => (
            <div key={index} className="rounded-2xl bg-white/70 px-4 py-4 text-center shadow-sm sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none">
              <div className="text-2xl sm:text-3xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>


    </section>
  );
}
