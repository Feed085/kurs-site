import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getPublicCourses, type PublicCourse } from '@/services/publicApi';
import { CONTACT_PHONE, WHATSAPP_PHONE } from '@/lib/contactInfo';

type ContactFormData = {
  name: string;
  courseId: string;
  selectionType: 'course' | 'test' | '';
  message: string;
};

const demoCourses: Pick<PublicCourse, 'id' | 'title'>[] = [
  { id: 'demo-course-1', title: 'SAT Hazırlığı' },
  { id: 'demo-course-2', title: 'IELTS Intensive' },
  { id: 'demo-course-3', title: 'Web Proqramlaşdırma' },
];

export default function Contact() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [courses, setCourses] = useState<Pick<PublicCourse, 'id' | 'title'>[]>(demoCourses);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    courseId: '',
    selectionType: '',
    message: '',
  });

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      try {
        const publicCourses = await getPublicCourses();

        if (isMounted) {
          setCourses(publicCourses.length > 0 ? publicCourses : demoCourses);
        }
      } catch (error) {
        console.error('Kontakt səhifəsi kursları yüklənmədi', error);
        if (isMounted) {
          setCourses(demoCourses);
        }
      }
    };

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const selectedCourse = courses.find((course) => course.id === formData.courseId);
    const selectionTypeLabel =
      formData.selectionType === 'course'
        ? t('contact.form.interest_course')
        : formData.selectionType === 'test'
          ? t('contact.form.interest_test')
          : '-';

    const message = [
      t('contact.message.greeting'),
      '',
      `Ad: ${formData.name || '-'}`,
      `Kurs: ${selectedCourse?.title || '-'}`,
      `Seçim: ${selectionTypeLabel}`,
      `Mesaj: ${formData.message || '-'}`,
    ].join('\n');

    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

    setIsSubmitted(true);
    toast.success('WhatsApp-a yönləndirilirsiniz');
    setFormData({ name: '', courseId: '', selectionType: '', message: '' });
    window.location.href = whatsappUrl;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

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
      icon: Clock,
      label: t('contact.info.working_hours'),
      value: '09:00 - 18:00',
    },
  ];

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0A0A0A] py-14 lg:py-28"
    >
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-24 hidden h-72 w-72 rounded-full bg-[#D4AF37]/5 blur-3xl sm:block" />
        <div className="absolute bottom-1/4 -right-24 hidden h-72 w-72 rounded-full bg-[#A87A1F]/5 blur-3xl sm:block" />
      </div>

      <div className="page-section relative z-10 mx-auto max-w-7xl">
        {/* Title */}
        <div ref={titleRef} className="text-center mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#D4AF37] rounded-full" />
            <span className="text-sm font-medium text-gray-300">{t('contact.title')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            {t('contact.title')}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>

        {/* Content */}
        <div ref={contentRef} className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
          {/* Contact Form */}
          <div className="contact-reveal rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-0 sm:p-8 sm:backdrop-blur-sm lg:p-10">
            <h3 className="text-xl font-bold text-white mb-6">
              {t('contact.form.title')}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('contact.form.name')}
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('contact.form.name_placeholder')}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-[#D4AF37] rounded-xl h-12"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('contact.form.select_course')}
                  </label>
                  <select
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleChange}
                    required
                    className="h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-white outline-none transition focus:border-[#D4AF37]"
                  >
                    <option value="" disabled className="bg-[#0A0A0A] text-white">
                      {t('contact.form.select_course')}
                    </option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id} className="bg-[#0A0A0A] text-white">
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('contact.form.interest_label')}
                  </label>
                  <select
                    name="selectionType"
                    value={formData.selectionType}
                    onChange={handleChange}
                    required
                    className="h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-white outline-none transition focus:border-[#D4AF37]"
                  >
                    <option value="" disabled className="bg-[#0A0A0A] text-white">
                      {t('contact.form.select')}
                    </option>
                    <option value="course" className="bg-[#0A0A0A] text-white">{t('contact.form.interest_course')}</option>
                    <option value="test" className="bg-[#0A0A0A] text-white">{t('contact.form.interest_test')}</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('contact.form.message')}
                </label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t('contact.form.message_placeholder')}
                  required
                  rows={5}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-[#D4AF37] rounded-xl resize-none"
                />
              </div>
              
              <Button
                type="submit"
                disabled={isSubmitted}
                className="w-full bg-[#D4AF37] hover:bg-[#B88A1B] text-white font-semibold rounded-xl h-12 transition-all"
              >
                {isSubmitted ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {t('contact.form.redirecting')}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    {t('contact.form.submit')}
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Map & Info */}
          <div className="space-y-6">
            {/* Map */}
            <div className="contact-reveal relative h-52 overflow-hidden rounded-3xl sm:h-64 lg:h-80">
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(t('contact.info.address_value'))}&z=16&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="lg:grayscale lg:hover:grayscale-0 transition-all duration-500"
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {contactInfo.map((item) => (
                <div
                  key={item.label}
                  className="contact-info-card flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10"
                >
                  <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                    <p className="text-sm text-white font-medium break-words leading-6">{item.value}</p>
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
