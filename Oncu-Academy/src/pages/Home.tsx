import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Atom,
  Calculator,
  GraduationCap,
  Globe,
  Languages,
  Landmark,
  Layers3,
  Mail,
  MapPin,
  MessageSquare,
  MonitorPlay,
  FlaskConical,
  Phone,
  Quote,
  Send,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { testimonials } from '@/data/mockData';
import {
  buildFallbackCourseCategories,
  getPublicCategories,
  getPublicCourses,
  getPublicStats,
  getPublicTeachers,
  normalizeCategoryKey,
  resolveCategoryLabel,
  type PublicCategory,
  type PublicCourse,
  type PublicStats,
  type PublicTeacher,
} from '@/services/publicApi';
import { CONTACT_PHONE, WHATSAPP_PHONE } from '@/lib/contactInfo';

type ContactFormData = {
  name: string;
  courseId: string;
  selectionType: 'course' | 'test' | '';
  message: string;
};

const formatNumber = (value: number) => new Intl.NumberFormat('az-AZ').format(value);

const demoTeachers: PublicTeacher[] = [
  {
    id: 'demo-teacher-1',
    name: 'Leyla',
    surname: 'Əhmədova',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    categories: ['ingilis-dili', 'ielts'],
    rating: 4.9,
    education: 'Bakı Dövlət Universiteti, Filologiya fakültəsi',
    experience: 15,
    location: 'Bakı, Azərbaycan',
    bio: 'İngilis dili və IELTS hazırlığı üzrə ixtisaslaşmış müəllim.',
    specialties: ['İngilis dili', 'IELTS', 'Danışıq'],
    specializedAreas: ['İngilis dili', 'IELTS'],
    socialLinks: {
      instagram: 'https://instagram.com',
      linkedin: 'https://linkedin.com',
    },
    studentCount: 1200,
    courseCount: 8,
    testCount: 12,
    courseReviewCount: 45,
    teacherReviewCount: 32,
    courseRating: 4.9,
    teacherRating: 4.9,
  },
  {
    id: 'demo-teacher-2',
    name: 'Elçin',
    surname: 'Quliyev',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    categories: ['riyaziyyat', 'sat'],
    rating: 5.0,
    education: 'Azərbaycan Texniki Universiteti',
    experience: 20,
    location: 'Bakı, Azərbaycan',
    bio: 'Riyaziyyat və SAT hazırlığı üzrə güclü nəticələr verən müəllim.',
    specialties: ['Riyaziyyat', 'SAT', 'Fizika'],
    specializedAreas: ['Riyaziyyat', 'SAT'],
    socialLinks: {
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com',
    },
    studentCount: 1500,
    courseCount: 6,
    testCount: 10,
    courseReviewCount: 58,
    teacherReviewCount: 41,
    courseRating: 5.0,
    teacherRating: 5.0,
  },
  {
    id: 'demo-teacher-3',
    name: 'Rəşad',
    surname: 'İbrahimov',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    categories: ['proqramlasdirma', 'python'],
    rating: 4.8,
    education: 'ADA Universiteti',
    experience: 7,
    location: 'Bakı, Azərbaycan',
    bio: 'Web development və Python əsasları üzrə praktiki tədris aparır.',
    specialties: ['Proqramlaşdırma', 'Web Development', 'Python'],
    specializedAreas: ['Proqramlaşdırma', 'Python'],
    socialLinks: {
      instagram: 'https://instagram.com',
      facebook: 'https://facebook.com',
    },
    studentCount: 600,
    courseCount: 5,
    testCount: 7,
    courseReviewCount: 24,
    teacherReviewCount: 18,
    courseRating: 4.8,
    teacherRating: 4.8,
  },
  {
    id: 'demo-teacher-4',
    name: 'Kamran',
    surname: 'Hüseynov',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    categories: ['rus-dili'],
    rating: 4.8,
    education: 'Moskva Dövlət Universiteti',
    experience: 12,
    location: 'Bakı, Azərbaycan',
    bio: 'Rus dili və ədəbiyyatı üzrə təcrübəli müəllim.',
    specialties: ['Rus dili', 'Rus ədəbiyyatı'],
    specializedAreas: ['Rus dili', 'Rus ədəbiyyatı'],
    socialLinks: {
      instagram: 'https://instagram.com',
    },
    studentCount: 800,
    courseCount: 5,
    testCount: 6,
    courseReviewCount: 20,
    teacherReviewCount: 14,
    courseRating: 4.7,
    teacherRating: 4.8,
  },
];

const demoCourses: PublicCourse[] = [
  {
    id: 'demo-course-1',
    _id: 'demo-course-1',
    title: 'SAT Hazırlığı',
    description: 'Riyaziyyat və ingilis dili üzrə tam hazırlıq proqramı.',
    category: 'SAT',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=800&fit=crop',
    price: 450,
    rating: 4.9,
    learningPoints: ['Riyaziyyat', 'Reading', 'Writing'],
    includes: ['Canlı dərs', 'Testlər', 'Qrup dəstəyi'],
    isActive: true,
    createdAt: '2024-03-10',
    instructor: {
      id: 'demo-teacher-2',
      _id: 'demo-teacher-2',
      name: 'Elçin',
      surname: 'Quliyev',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      rating: 5.0,
    },
  },
  {
    id: 'demo-course-2',
    _id: 'demo-course-2',
    title: 'IELTS Intensive',
    description: 'Listening, Reading, Writing və Speaking bölmələri ilə intensiv proqram.',
    category: 'IELTS',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=800&fit=crop',
    price: 350,
    rating: 4.9,
    learningPoints: ['Speaking', 'Writing', 'Reading'],
    includes: ['Mövzu izahı', 'Sınaq imtahanları', 'Geribildirim'],
    isActive: true,
    createdAt: '2024-03-12',
    instructor: {
      id: 'demo-teacher-1',
      _id: 'demo-teacher-1',
      name: 'Leyla',
      surname: 'Əhmədova',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      rating: 4.9,
    },
  },
  {
    id: 'demo-course-3',
    _id: 'demo-course-3',
    title: 'Web Proqramlaşdırma',
    description: 'HTML, CSS, JavaScript və React ilə web development əsasları.',
    category: 'Programming',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=800&fit=crop',
    price: 500,
    rating: 4.8,
    learningPoints: ['HTML', 'CSS', 'React'],
    includes: ['Kod nümunələri', 'Layihələr', 'Mentorluq'],
    isActive: true,
    createdAt: '2024-03-15',
    instructor: {
      id: 'demo-teacher-3',
      _id: 'demo-teacher-3',
      name: 'Rəşad',
      surname: 'İbrahimov',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      rating: 4.8,
    },
  },
  {
    id: 'demo-course-4',
    _id: 'demo-course-4',
    title: 'İngilis Dili - Başlanğıc',
    description: 'İngilis dilini sıfırdan öyrənmək üçün rahat və aydın kurs.',
    category: 'English',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=800&fit=crop',
    price: 280,
    rating: 4.8,
    learningPoints: ['Qrammatika', 'Söz ehtiyatı', 'Danışıq'],
    includes: ['Məşğələ', 'Tapşırıqlar', 'Video izah'],
    isActive: true,
    createdAt: '2024-03-18',
    instructor: {
      id: 'demo-teacher-1',
      _id: 'demo-teacher-1',
      name: 'Leyla',
      surname: 'Əhmədova',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      rating: 4.9,
    },
  },
];

gsap.registerPlugin(ScrollTrigger);

type RevealAnimationOptions = {
  start?: string;
  duration?: number;
  stagger?: number;
  y?: number;
};

function useSectionReveal(
  sectionRef: { current: HTMLElement | null },
  dependencies: readonly unknown[],
  options: RevealAnimationOptions = {}
) {
  useLayoutEffect(() => {
    const section = sectionRef.current;

    if (!section || typeof window === 'undefined') {
      return;
    }

    const targets = Array.from(section.querySelectorAll<HTMLElement>('[data-reveal]'));

    if (targets.length === 0) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const refreshScrollTrigger = () => {
      window.requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    };

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(targets, {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'none',
        });

        return;
      }

      gsap.fromTo(
        targets,
        {
          opacity: 0,
          y: options.y ?? 32,
          scale: 0.985,
          filter: 'blur(12px)',
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: options.duration ?? 0.7,
          stagger: options.stagger ?? 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: options.start ?? 'top 78%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    const resizeObserver = new ResizeObserver(() => {
      refreshScrollTrigger();
    });

    resizeObserver.observe(section);
    window.addEventListener('load', refreshScrollTrigger, { once: true });
    refreshScrollTrigger();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('load', refreshScrollTrigger);
      ctx.revert();
    };
  }, dependencies);
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setDisplayValue(value);
      return;
    }

    const node = numberRef.current;

    if (!node) {
      setDisplayValue(value);
      return;
    }

    let animationFrame = 0;
    let startTime: number | null = null;
    let started = false;

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / 650, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) {
          return;
        }

        started = true;
        animationFrame = window.requestAnimationFrame(animate);
        observer.disconnect();
      },
      { threshold: 0.35 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, [value]);

  return (
    <span ref={numberRef}>
      {displayValue}
      {suffix}
    </span>
  );
}

function HomeHero({ stats }: { stats: PublicStats }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useLayoutEffect(() => {
    const section = heroRef.current;

    if (!section || typeof window === 'undefined') {
      return;
    }

    const targets = [titleRef.current, subtitleRef.current, descriptionRef.current, actionsRef.current, statsRef.current].filter(Boolean) as HTMLElement[];

    if (targets.length === 0) {
      return;
    }

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(targets, {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'none',
        });

        return;
      }

      gsap.set(targets, {
        opacity: 0,
        y: 56,
        scale: 0.985,
        filter: 'blur(12px)',
      });

      const timeline = gsap.timeline({
        delay: 0.05,
        defaults: {
          ease: 'power3.out',
        },
      });

      timeline
        .to(titleRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.65,
        })
        .to(
          subtitleRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.55,
          },
          '-=0.55'
        )
        .to(
          descriptionRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.55,
          },
          '-=0.42'
        )
        .to(
          actionsRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.5,
          },
          '-=0.35'
        )
        .to(
          statsRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.5,
          },
          '-=0.32'
        );
    }, section);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  const quickStats = [
    { value: stats.experience, suffix: '+', label: t('stats.experience.label') },
    { value: stats.students, suffix: '+', label: t('stats.students.label') },
    { value: stats.teachers, suffix: '+', label: t('stats.teachers.label') },
  ];

  const floatingSubjects = [
    {
      icon: BookOpen,
      label: t('subjects.az_lang'),
      position: 'top-[8%] left-[3%]',
      animation: 'float',
      delay: '0s',
    },
    {
      icon: Languages,
      label: t('subjects.en_lang'),
      position: 'top-[14%] right-[4%]',
      animation: 'floatReverse',
      delay: '0.5s',
    },
    {
      icon: Atom,
      label: t('subjects.physics'),
      position: 'top-[30%] left-[10%]',
      animation: 'float',
      delay: '0.9s',
    },
    {
      icon: Calculator,
      label: t('subjects.math'),
      position: 'top-[24%] right-[18%]',
      animation: 'float',
      delay: '1s',
    },
    {
      icon: FlaskConical,
      label: t('subjects.chemistry'),
      position: 'bottom-[24%] left-[8%]',
      animation: 'floatReverse',
      delay: '1.4s',
    },
    {
      icon: GraduationCap,
      label: t('subjects.primary'),
      position: 'bottom-[18%] right-[6%]',
      animation: 'floatReverse',
      delay: '1.3s',
    },
    {
      icon: Globe,
      label: t('subjects.geography'),
      position: 'top-[60%] left-[20%]',
      animation: 'float',
      delay: '0.8s',
    },
    {
      icon: Landmark,
      label: t('subjects.history'),
      position: 'bottom-[10%] right-[22%]',
      animation: 'floatReverse',
      delay: '1.7s',
    },
  ];

  const goToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section ref={heroRef} className="relative min-h-[100svh] overflow-hidden bg-[radial-gradient(circle_at_top,#243041_0%,#161b26_45%,#090d14_100%)]">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-24 right-[-8rem] h-[30rem] w-[30rem] rounded-full bg-[#D4AF37]/18 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-[-8rem] h-80 w-80 rounded-full bg-[#A87A1F]/14 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {floatingSubjects.map((subject) => {
          const Icon = subject.icon;

          return (
            <div
              key={subject.label}
              className={`absolute hidden items-center gap-3 text-white/45 opacity-70 lg:flex ${subject.position}`}
              style={{
                animation: prefersReducedMotion ? 'none' : `${subject.animation} 8.5s ease-in-out infinite`,
                animationDelay: subject.delay,
              }}
            >
              <Icon className="h-5 w-5 shrink-0 text-[#F7E27D]/50" />
              <span className="max-w-[11.5rem] text-sm font-normal leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.18)]">
                {subject.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-24">
        <div className="grid w-full items-center justify-items-center gap-10 lg:grid-cols-1">
          <div className="mx-auto max-w-4xl space-y-8 text-center text-white">
            <div className="space-y-5">
              <h1 ref={titleRef} className="mx-auto max-w-4xl bg-gradient-to-r from-[#F7E27D] via-[#E3BE52] to-[#D4AF37] bg-clip-text py-2 text-5xl font-black leading-[1.2] tracking-tight text-transparent sm:text-7xl lg:text-8xl">
                {t('hero.title')}
              </h1>
              <p ref={subtitleRef} className="mx-auto max-w-2xl text-xl font-semibold text-white sm:text-2xl">
                {t('hero.subtitle')}
              </p>
              <p ref={descriptionRef} className="mx-auto max-w-3xl text-base leading-8 text-white/72 sm:text-lg">
                {t('hero.description')}
              </p>
            </div>

            <div ref={actionsRef} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                onClick={() => navigate('/courses')}
                className="group h-14 rounded-full bg-[#D4AF37] px-7 text-base font-semibold text-white shadow-lg shadow-[#D4AF37]/25 hover:bg-[#B88A1B]"
              >
                {t('hero.cta')}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                onClick={goToContact}
                className="h-14 rounded-full border border-white/15 bg-white/5 px-7 text-base font-semibold text-white hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-white"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                {t('hero.cta_secondary')}
              </Button>
            </div>

            <div ref={statsRef} className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-3 sm:mt-10 lg:mt-12">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/5 p-4 text-white shadow-lg shadow-black/20 backdrop-blur"
                >
                  <div className="text-2xl font-black sm:text-3xl">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-[0.22em] text-white/45">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

  );
}

function HomeStory() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  const values = [
    {
      icon: Trophy,
      title: t('features.home_items.result.title'),
      desc: t('features.home_items.result.desc'),
    },
    {
      icon: MonitorPlay,
      title: t('features.home_items.video_lessons.title'),
      desc: t('features.home_items.video_lessons.desc'),
    },
    {
      icon: Layers3,
      title: t('features.home_items.plan.title'),
      desc: t('features.home_items.plan.desc'),
    },
    {
      icon: GraduationCap,
      title: t('features.home_items.teachers.title'),
      desc: t('features.home_items.teachers.desc'),
    },
  ];

  useSectionReveal(sectionRef, [], {
    start: 'top 78%',
    stagger: 0.1,
    y: 28,
  });

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#FAFAFA] py-32">
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="absolute right-[-8rem] top-10 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute bottom-0 left-[-6rem] h-72 w-72 rounded-full bg-[#A87A1F]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black leading-tight text-gray-950 sm:text-4xl lg:text-5xl">
            {t('features.title')}
          </h2>
          <p className="mt-4 text-base leading-8 text-gray-600 sm:text-lg">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {values.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                data-reveal
                className="rounded-[1.75rem] border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/15 text-[#8B5E17]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-gray-600">{item.desc}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HomeStats() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const resultImages = [
    new URL('../../Neticeler/image.png', import.meta.url).href,
    new URL('../../Neticeler/image copy.png', import.meta.url).href,
    new URL('../../Neticeler/image copy 2.png', import.meta.url).href,
    new URL('../../Neticeler/image copy 3.png', import.meta.url).href,
    new URL('../../Neticeler/image copy 4.png', import.meta.url).href,
    new URL('../../Neticeler/image copy 5.png', import.meta.url).href,
    new URL('../../Neticeler/image copy 6.png', import.meta.url).href,
    new URL('../../Neticeler/image copy 7.png', import.meta.url).href,
  ];

  useSectionReveal(sectionRef, [], {
    start: 'top 76%',
    stagger: 0.12,
    y: 30,
  });

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedImage]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#111827] py-16 lg:py-24">
      <div className="absolute inset-0 pointer-events-none opacity-70">
        <div className="absolute -top-16 left-1/4 h-56 w-56 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#A87A1F]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-reveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
            {t('results.title')}
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {resultImages.map((image, index) => (
            <button
              key={image}
              data-reveal
              type="button"
              onClick={() => setSelectedImage(image)}
              className="group relative aspect-[4/3] overflow-hidden rounded-[1rem] border border-white/10 bg-white/5 shadow-lg shadow-black/20 transition-transform duration-300 hover:-translate-y-0.5"
            >
              <img
                src={image}
                alt={t('results.image_alt', { index: index + 1 })}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-70" />
            </button>
          ))}
        </div>

        {selectedImage ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setSelectedImage(null)}
          >
            <button
              type="button"
              aria-label={t('results.close')}
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl text-white transition hover:bg-white/20"
            >
              x
            </button>
            <img
              src={selectedImage}
              alt=""
              className="max-h-[90vh] max-w-[92vw] rounded-[1.25rem] object-contain shadow-2xl shadow-black/50"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function HomeCourses({
  courses,
  categories,
  activeCategory,
  isLoading,
  onCategoryChange,
}: {
  courses: PublicCourse[];
  categories: PublicCategory[];
  activeCategory: string;
  isLoading: boolean;
  onCategoryChange: (categoryId: string) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);

  const filteredCourses = useMemo(() => {
    if (activeCategory === 'all') {
      return courses;
    }

    return courses.filter(
      (course) => normalizeCategoryKey(course.category) === normalizeCategoryKey(activeCategory)
    );
  }, [activeCategory, courses]);

  const featuredCourse = filteredCourses[0] ?? null;
  const supportingCourses = filteredCourses.slice(1, 5);
  const supportingCourseKey = supportingCourses.map((course) => course.id).join('|');

  const coursePrice = (course: PublicCourse) => (course.price === 0 ? t('courses.free') : `${course.price} AZN`);

  useSectionReveal(sectionRef, [isLoading, activeCategory, featuredCourse?.id, supportingCourseKey], {
    start: 'top 76%',
    stagger: 0.08,
    y: 28,
  });

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-white py-16 lg:py-24">
      <div className="absolute inset-0 pointer-events-none opacity-70">
        <div className="absolute right-[-8rem] top-0 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute bottom-0 left-[-6rem] h-72 w-72 rounded-full bg-[#A87A1F]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-reveal className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <h2 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
              {t('courses.title')}
            </h2>
            <p className="max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
              {t('courses.subtitle')}
            </p>
          </div>

          <Button
            onClick={() => navigate('/courses')}
            variant="outline"
            className="w-full rounded-full border-gray-300 bg-white/80 px-6 text-gray-900 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#8B5E17] lg:w-auto"
          >
            {t('courses.view_all')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div data-reveal className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={() => onCategoryChange('all')}
            className={`rounded-full px-5 py-3 text-sm font-semibold transition-all ${
              activeCategory === 'all'
                ? 'bg-[#111827] text-white shadow-lg shadow-[#111827]/20'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t('home.categories_all')}
          </button>

          {isLoading && categories.length === 0
            ? Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-28 rounded-full" />
              ))
            : categories.slice(0, 6).map((category) => (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition-all ${
                    activeCategory === category.id
                      ? 'bg-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/25'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category.name}
                </button>
              ))}
        </div>

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="overflow-hidden rounded-[2.25rem] bg-white shadow-2xl shadow-gray-200/40">
              <Skeleton className="h-[460px] w-full rounded-none" />
            </div>
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex gap-4 rounded-[1.75rem] bg-white p-4 shadow-lg shadow-gray-200/40">
                  <Skeleton className="h-28 w-24 rounded-2xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : featuredCourse ? (
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <article
              onClick={() => navigate(`/courses/${featuredCourse.id}`)}
              data-reveal
              className="group relative min-h-[460px] cursor-pointer overflow-hidden rounded-[2.25rem] bg-[#111827] text-white shadow-2xl shadow-gray-900/20"
            >
              <img
                src={featuredCourse.image || 'https://via.placeholder.com/1200x800'}
                alt={featuredCourse.title}
                className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/95 via-black/55 to-transparent" />

              <div className="relative flex min-h-[460px] flex-col justify-between p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                    {resolveCategoryLabel(featuredCourse.category, categories)}
                  </span>
                  <span className="rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-gray-950">
                    {coursePrice(featuredCourse)}
                  </span>
                </div>

                <div className="max-w-2xl space-y-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                    {featuredCourse.instructor
                      ? `${featuredCourse.instructor.name} ${featuredCourse.instructor.surname}`
                      : t('brand.name')}
                  </p>
                  <h3 className="text-3xl font-black leading-tight sm:text-4xl">
                    {featuredCourse.title}
                  </h3>
                  <p className="max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                    {featuredCourse.description}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/45">{t('courses.rating')}</p>
                    <div className="mt-2 flex items-center gap-2 text-lg font-bold">
                      <Star className="h-5 w-5 fill-current text-[#F7E27D]" />
                      <span>{Number(featuredCourse.rating || 0).toFixed(1)}</span>
                    </div>
                    <p className="mt-1 text-sm text-white/60">{t('courses.rating_desc')}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/45">{t('courses.learning_path')}</p>
                    <p className="mt-2 text-lg font-bold">{t('courses.topics_count', { count: featuredCourse.learningPoints.length })}</p>
                    <p className="mt-1 text-sm text-white/60">{t('courses.learning_path_desc')}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/45">{t('courses.price')}</p>
                    <p className="mt-2 text-lg font-bold">{coursePrice(featuredCourse)}</p>
                    <p className="mt-1 text-sm text-white/60">{t('courses.price_desc')}</p>
                  </div>
                </div>
              </div>
            </article>

            <div className="grid gap-4">
              {supportingCourses.length > 0 ? (
                supportingCourses.map((course) => (
                  <article
                    key={course.id}
                    onClick={() => navigate(`/courses/${course.id}`)}
                    data-reveal
                    className="group flex cursor-pointer gap-4 rounded-[1.75rem] border border-[#D4AF37]/15 bg-white/80 p-4 shadow-lg shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <img
                      src={course.image || 'https://via.placeholder.com/600x400'}
                      alt={course.title}
                      className="h-28 w-24 flex-none rounded-2xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8B5E17]">
                          {resolveCategoryLabel(course.category, categories)}
                        </span>
                        <span className="text-sm font-bold text-gray-950">{coursePrice(course)}</span>
                      </div>

                      <h4 className="mt-3 line-clamp-2 text-lg font-bold text-gray-950">
                        {course.title}
                      </h4>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                        {course.description}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <img
                            src={course.instructor?.avatar || 'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirKVGVwei6Df8ct23tMACbeRpeM4981E21T/avatar/1149.jpg'}
                            alt={course.instructor?.name || t('courses.instructor')}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <span className="truncate text-sm text-gray-700">
                            {course.instructor
                              ? `${course.instructor.name} ${course.instructor.surname || ''}`
                              : t('brand.name')}
                          </span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-[#A87A1F] transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-gray-300 bg-white/80 p-8 text-center text-gray-500">
                  {t('courses.not_found')}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-gray-300 bg-white/80 p-8 text-center text-gray-500">
            {t('courses.not_found')}
          </div>
        )}
      </div>
    </section>
  );
}

function HomeTeachers({
  teachers,
  isLoading,
  stats,
}: {
  teachers: PublicTeacher[];
  isLoading: boolean;
  stats: PublicStats;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);

  const summary = useMemo(() => {
    if (teachers.length === 0) {
      return {
        rating: '0.0',
        students: 0,
        courses: 0,
      };
    }

    const totalStudents = teachers.reduce((sum, teacher) => sum + (teacher.studentCount || 0), 0);
    const averageRating = teachers.reduce((sum, teacher) => sum + (teacher.rating || 0), 0) / teachers.length;

    return {
      rating: averageRating.toFixed(1),
      students: stats.students || totalStudents,
      courses: stats.courses || teachers.reduce((sum, teacher) => sum + (teacher.courseCount || 0), 0),
    };
  }, [stats.courses, stats.students, teachers]);

  const visibleTeachers = teachers.slice(0, 3);
  const visibleTeacherKey = visibleTeachers.map((teacher) => teacher.id).join('|');

  useSectionReveal(sectionRef, [isLoading, visibleTeacherKey], {
    start: 'top 76%',
    stagger: 0.08,
    y: 30,
  });

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#111827] py-16 lg:py-24">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 h-72 w-72 rounded-full bg-[#A87A1F]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div data-reveal className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-white shadow-2xl shadow-black/20 lg:p-10">
            <h2 className="text-3xl font-black leading-tight sm:text-4xl">
              {t('teachers.title')}
            </h2>
            <p className="mt-4 max-w-lg text-base leading-8 text-white/70 sm:text-lg">
              {t('teachers.subtitle')}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <Users className="h-5 w-5 text-[#F7E27D]" />
                <p className="mt-3 text-sm font-semibold text-white">{t('home.teacher_avg_rating')}</p>
                <p className="mt-1 text-2xl font-black text-white">{summary.rating}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <BookOpen className="h-5 w-5 text-[#F7E27D]" />
                <p className="mt-3 text-sm font-semibold text-white">{t('home.teacher_course_count')}</p>
                <p className="mt-1 text-2xl font-black text-white">{formatNumber(summary.courses)}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <GraduationCap className="h-5 w-5 text-[#F7E27D]" />
                <p className="mt-3 text-sm font-semibold text-white">{t('home.teacher_student_base')}</p>
                <p className="mt-1 text-2xl font-black text-white">{formatNumber(summary.students)}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/70">
              {t('home.teacher_team_desc')}
            </div>

            <Button
              onClick={() => navigate('/teachers')}
              variant="outline"
              className="mt-6 w-full rounded-full border-transparent bg-white text-black hover:bg-[#D4AF37] hover:text-white"
            >
              {t('teachers.view_profile')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5"
                  >
                    <Skeleton className="h-56 w-full rounded-none bg-white/10" />
                    <div className="space-y-3 p-5">
                      <Skeleton className="h-5 w-3/4 bg-white/10" />
                      <Skeleton className="h-4 w-1/2 bg-white/10" />
                      <Skeleton className="h-4 w-full bg-white/10" />
                      <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
                    </div>
                  </div>
                ))
              : visibleTeachers.map((teacher) => (
                  <article
                    key={teacher.id}
                    onClick={() => navigate(`/teachers/${teacher.id}`)}
                    data-reveal
                    className="group cursor-pointer overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={teacher.avatar}
                        alt={`${teacher.name} ${teacher.surname}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-gray-900">
                        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                        {teacher.rating}
                      </div>

                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-lg font-bold leading-tight text-white">
                          {teacher.name} {teacher.surname}
                        </h3>
                        <p className="mt-1 text-xs leading-6 text-white/70 line-clamp-2">
                          {(teacher.specialties || []).slice(0, 2).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-[#D4AF37]" />
                          {formatNumber(teacher.studentCount)} {t('home.teacher_students')}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-[#A87A1F]" />
                          {formatNumber(teacher.courseCount)} {t('home.teacher_courses')}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[#F7E27D]">
                          {teacher.experience} {t('home.teacher_years')}
                        </span>
                      </div>

                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/60">
                        {teacher.bio}
                      </p>

                      <Button
                        variant="outline"
                        className="mt-5 w-full rounded-xl border-transparent bg-white text-black hover:bg-[#D4AF37] hover:text-white"
                      >
                        {t('teachers.view_profile')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </article>
                ))}
          </div>
        </div>

        {visibleTeachers.length > 0 ? null : (
          <div data-reveal className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/5 p-8 text-center text-white/60">
            {t('home.teacher_not_found')}
          </div>
        )}
      </div>
    </section>
  );
}

function HomeTestimonials({
  currentIndex,
  onSelect,
  onPrev,
  onNext,
}: {
  currentIndex: number;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const activeTestimonial = testimonials[currentIndex] ?? testimonials[0];

  useSectionReveal(sectionRef, [], {
    start: 'top 76%',
    stagger: 0.12,
    y: 28,
  });

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-white py-16 lg:py-24">
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-[#A87A1F]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-reveal className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <h2 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
              {t('testimonials.title')}
            </h2>
            <p className="max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
              {t('testimonials.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <Button
              onClick={onPrev}
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full border-gray-300 bg-white/80 text-gray-900 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#8B5E17]"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={onNext}
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full border-gray-300 bg-white/80 text-gray-900 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#8B5E17]"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article data-reveal className="relative overflow-hidden rounded-[2.25rem] bg-[#111827] p-8 text-white shadow-2xl shadow-gray-900/20 sm:p-10 lg:p-12">
            <div className="absolute left-6 top-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37] text-gray-950 shadow-lg shadow-[#D4AF37]/25">
              <Quote className="h-7 w-7" />
            </div>

            <p className="mt-14 text-2xl leading-[1.7] text-white/90 sm:text-3xl">
              “{activeTestimonial.quote}”
            </p>

            <div className="mt-10 flex items-center gap-4">
              <img
                src={activeTestimonial.avatar}
                alt={activeTestimonial.name}
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white/10"
              />
              <div>
                <h3 className="text-lg font-bold text-white">{activeTestimonial.name}</h3>
                <p className="text-sm text-white/60">{activeTestimonial.role}</p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-1 text-[#F7E27D]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-5 w-5 fill-current" />
              ))}
            </div>

            <div className="mt-10 flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/60">
                {currentIndex + 1} / {testimonials.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={onPrev}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={onNext}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-transparent bg-[#D4AF37] text-gray-950 hover:bg-[#B88A1B] hover:text-white"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </article>

          <div className="grid gap-4">
            {testimonials.map((item, index) => {
              const active = index === currentIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(index)}
                  data-reveal
                  className={`group flex items-start gap-4 rounded-[1.75rem] border p-4 text-left transition-all duration-300 ${
                    active
                      ? 'border-[#D4AF37] bg-white shadow-2xl shadow-[#D4AF37]/10'
                      : 'border-white/60 bg-white/80 hover:border-[#D4AF37]/40 hover:bg-white'
                  }`}
                >
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="h-16 w-16 rounded-2xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="truncate text-base font-bold text-gray-950">{item.name}</h3>
                      <span className="rounded-full bg-[#D4AF37]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8B5E17]">
                        {item.role}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">{item.quote}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeContact({
  courses,
  formData,
  isSubmitting,
  onChange,
  onSubmit,
}: {
  courses: PublicCourse[];
  formData: ContactFormData;
  isSubmitting: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const availableCourses = courses.length > 0 ? courses : demoCourses;

  const contactInfo = [
    {
      icon: MapPin,
      label: t('contact.info.address'),
      value: t('contact.info.address_value'),
    },
    {
      icon: Phone,
      label: t('contact.info.phone'),
      value: CONTACT_PHONE,
    },
    {
      icon: Mail,
      label: t('contact.info.email'),
      value: 'sizinmailiniz@gmail.com',
    },
    {
      icon: Clock3,
      label: t('contact.info.working_hours'),
      value: '09:00 - 18:00',
    },
  ];

  useSectionReveal(sectionRef, [], {
    start: 'top 76%',
    stagger: 0.12,
    y: 30,
  });

  const scrollToForm = () => {
    document.getElementById('home-contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section ref={sectionRef} id="contact" className="relative overflow-hidden bg-[#111827] py-16 lg:py-24">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-[#A87A1F]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-reveal className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4 text-white">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              {t('contact.title')}
            </h2>
            <p className="max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
              {t('contact.subtitle')}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div data-reveal className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-white shadow-2xl shadow-black/20 sm:p-8">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/40">{t('home.contact_start_msg')}</p>
                  <h3 className="text-2xl font-bold">{t('home.contact_send_question')}</h3>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-white/70">
                {t('home.contact_form_desc')}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {contactInfo.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#F7E27D]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-white/40">{item.label}</p>
                        <p className="mt-1 text-sm font-medium leading-6 text-white">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#F7E27D]" />
                {t('home.contact_whatsapp_note')}
              </div>

              <Button
                onClick={scrollToForm}
                className="mt-6 w-full rounded-2xl bg-[#D4AF37] text-gray-950 hover:bg-[#B88A1B] hover:text-white"
              >
                {t('home.contact_go_to_form')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div data-reveal className="rounded-[2rem] bg-[#F8F1E4] p-6 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.6)] sm:p-8 lg:p-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8B5E17]">{t('home.contact_quick_form')}</p>
                <h3 className="mt-2 text-2xl font-black text-gray-950">{t('home.contact_want_advice')}</h3>
              </div>
              <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/15 text-[#A87A1F] sm:flex">
                <Send className="h-6 w-6" />
              </div>
            </div>

            <form id="home-contact-form" onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t('contact.form.name')}</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  placeholder={t('contact.form.name_placeholder')}
                  required
                  className="h-12 rounded-2xl border-gray-200 bg-white/90 text-gray-900 placeholder:text-gray-400 focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t('contact.form.select_course')}</label>
                  <select
                    name="courseId"
                    value={formData.courseId}
                    onChange={onChange}
                    required
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-white/90 px-4 text-gray-900 outline-none transition focus:border-[#D4AF37]"
                  >
                    <option value="" disabled>
                      {t('contact.form.select_course')}
                    </option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t('contact.form.interest_label')}</label>
                  <select
                    name="selectionType"
                    value={formData.selectionType}
                    onChange={onChange}
                    required
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-white/90 px-4 text-gray-900 outline-none transition focus:border-[#D4AF37]"
                  >
                    <option value="" disabled>
                      {t('contact.form.select')}
                    </option>
                    <option value="course">{t('contact.form.interest_course')}</option>
                    <option value="test">{t('contact.form.interest_test')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t('contact.form.message')}</label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={onChange}
                  placeholder={t('contact.form.message_placeholder')}
                  required
                  rows={6}
                  className="min-h-[112px] rounded-2xl border-gray-200 bg-white/90 text-gray-900 placeholder:text-gray-400 focus:border-[#D4AF37]"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-[#111827] text-white hover:bg-[#0B0F16]"
              >
                {isSubmitting ? (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    {t('contact.form.redirecting')}
                  </>
                ) : (
                  <>
                    {t('home.contact_whatsapp_send')}
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <div data-reveal className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-1 shadow-2xl shadow-black/20 lg:col-span-2">
            <div className="aspect-[16/7] overflow-hidden rounded-[1.75rem] bg-gray-900/40">
              <iframe
                title={t('brand.map_title')}
                src={`https://www.google.com/maps?q=${encodeURIComponent(t('contact.info.address_value'))}&z=16&output=embed`}
                className="h-full w-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<PublicStats>({
    experience: 15,
    students: 5000,
    teachers: 50,
    courses: 100,
  });
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [teachers, setTeachers] = useState<PublicTeacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    courseId: '',
    selectionType: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const data = await getPublicStats();

        if (isMounted && data) {
          setStats({
            experience: Number(data.experience || 15),
            students: Number(data.students || 0),
            teachers: Number(data.teachers || 0),
            courses: Number(data.courses || 0),
          });
        }
      } catch (error) {
        console.error('Ana səhifə statistikası yüklənmədi', error);
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      try {
        const [coursesResult, categoriesResult] = await Promise.allSettled([
          getPublicCourses(),
          getPublicCategories(),
        ]);

        if (!isMounted) {
          return;
        }

        const loadedCourses = coursesResult.status === 'fulfilled' ? coursesResult.value : [];
        const loadedCategories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
        const resolvedCourses = loadedCourses.length > 0 ? loadedCourses : demoCourses;

        setCourses(resolvedCourses);
        setCategories(
          loadedCategories.length > 0 ? loadedCategories : buildFallbackCourseCategories(resolvedCourses)
        );
      } catch (error) {
        console.error('Kurslar yüklənə bilmədi', error);
        setCourses(demoCourses);
        setCategories(buildFallbackCourseCategories(demoCourses));
      } finally {
        if (isMounted) {
          setCoursesLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTeachers = async () => {
      try {
        const teacherList = await getPublicTeachers();

        if (isMounted) {
          setTeachers(teacherList.length > 0 ? teacherList : demoTeachers);
        }
      } catch (error) {
        console.error('Müəllimlər yüklənə bilmədi', error);
        if (isMounted) {
          setTeachers(demoTeachers);
        }
      } finally {
        if (isMounted) {
          setTeachersLoading(false);
        }
      }
    };

    loadTeachers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTestimonialIndex((currentIndex) => (currentIndex + 1) % testimonials.length);
    }, 6500);

    return () => window.clearInterval(interval);
  }, []);

  const resolvedCategories = useMemo(() => {
    return categories.length > 0 ? categories : buildFallbackCourseCategories(courses);
  }, [categories, courses]);

  const filteredCourses = useMemo(() => {
    if (activeCategory === 'all') {
      return courses;
    }

    return courses.filter(
      (course) => normalizeCategoryKey(course.category) === normalizeCategoryKey(activeCategory)
    );
  }, [activeCategory, courses]);

  const handleContactChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const selectedCourse = courses.find((course) => course.id === formData.courseId);
    const selectionTypeLabel =
      formData.selectionType === 'course'
        ? t('contact.form.interest_course')
        : formData.selectionType === 'test'
          ? t('contact.form.interest_test')
          : '-';

    const message = [
      t('home.contact_whatsapp_greeting'),
      '',
      t('home.contact_whatsapp_name', { name: formData.name || '-' }),
      t('home.contact_whatsapp_course', { course: selectedCourse?.title || '-' }),
      t('home.contact_whatsapp_selection', { selection: selectionTypeLabel }),
      t('home.contact_whatsapp_message', { message: formData.message || '-' }),
    ].join('\n');

    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

    setIsSubmitting(true);
    window.location.href = whatsappUrl;
  };

  return (
    <main className="overflow-x-clip bg-[#FAFAFA] text-gray-900">
      <HomeHero stats={stats} />
      <HomeStory />
      <HomeStats />
      <HomeCourses
        courses={filteredCourses}
        categories={resolvedCategories}
        activeCategory={activeCategory}
        isLoading={coursesLoading}
        onCategoryChange={setActiveCategory}
      />
      <HomeTeachers teachers={teachers} isLoading={teachersLoading} stats={stats} />
      <HomeTestimonials
        currentIndex={testimonialIndex}
        onSelect={setTestimonialIndex}
        onPrev={() => setTestimonialIndex((currentIndex) => (currentIndex - 1 + testimonials.length) % testimonials.length)}
        onNext={() => setTestimonialIndex((currentIndex) => (currentIndex + 1) % testimonials.length)}
      />
      <HomeContact
        courses={courses}
        formData={formData}
        isSubmitting={isSubmitting}
        onChange={handleContactChange}
        onSubmit={handleContactSubmit}
      />
    </main>
  );
}

export default Home;
