import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getPublicStats } from '@/services/publicApi';

gsap.registerPlugin(ScrollTrigger);

interface CounterProps {
  end: number;
  duration?: number;
  suffix?: string;
}

function Counter({ end, duration = 2, suffix = '' }: CounterProps) {
  const [count, setCount] = useState(0);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obj = { value: 0 };
    
    ScrollTrigger.create({
      trigger: counterRef.current,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(obj, {
          value: end,
          duration,
          ease: 'power2.out',
          onUpdate: () => setCount(Math.floor(obj.value)),
        });
      },
      once: true,
    });
  }, [end, duration]);

  return (
    <span ref={counterRef}>
      {count}{suffix}
    </span>
  );
}

export default function Stats() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [statsData, setStatsData] = useState({
    experience: 15,
    students: 5000,
    teachers: 50,
    courses: 100
  });

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 80, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const data = await getPublicStats();

        if (isMounted && data) {
          setStatsData({
            experience: Number(data.experience || 15),
            students: Number(data.students || 0),
            teachers: Number(data.teachers || 0),
            courses: Number(data.courses || 0)
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

  const stats = [
    { key: 'experience', value: statsData.experience, suffix: '' },
    { key: 'students', value: statsData.students, suffix: '+' },
    { key: 'teachers', value: statsData.teachers, suffix: '+' },
    { key: 'courses', value: statsData.courses, suffix: '+' },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-20 lg:py-32 bg-[#F3F3F3] overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={cardRef}
          className="relative bg-white rounded-[40px] p-8 sm:p-12 lg:p-16 shadow-2xl shadow-gray-200/50"
        >
          {/* Decorative elements */}
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-[#D4AF37]/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#A87A1F]/10 rounded-full blur-2xl" />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div key={stat.key} className="text-center relative">
                {/* Green accent line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#D4AF37] rounded-full mb-4" />
                
                <div className="pt-6">
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-2">
                    <Counter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm sm:text-base text-gray-500 font-medium uppercase tracking-wider">
                    {t(`stats.${stat.key}.label`)}
                  </div>
                </div>

                {/* Separator */}
                {index < stats.length - 1 && (
                  <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-16 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
