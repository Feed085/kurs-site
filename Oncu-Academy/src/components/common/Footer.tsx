import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CONTACT_PHONE, WHATSAPP_URL } from '@/lib/contactInfo';


// Custom WhatsApp icon
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Footer() {
  const { t } = useTranslation();

  const socialLinks = [
    { icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ), label: 'Instagram', color: 'text-white/35', disabled: true },
    { icon: WhatsAppIcon, href: WHATSAPP_URL, label: 'WhatsApp', color: 'hover:text-[#D4AF37]' },
  ];

  const quickLinks = [
    { label: t('footer.links.about'), href: '/about' },
    { label: t('footer.links.courses'), href: '/courses' },
    { label: t('footer.links.teachers'), href: '/teachers' },
    { label: t('footer.links.contact'), href: '/contact' },
  ];

  const termsSections = [
    {
      number: 1,
      title: t('footer.termsDialog.sections.general.title'),
      body: t('footer.termsDialog.sections.general.body'),
    },
    {
      number: 2,
      title: t('footer.termsDialog.sections.userResponsibility.title'),
      body: t('footer.termsDialog.sections.userResponsibility.body'),
    },
    {
      number: 3,
      title: t('footer.termsDialog.sections.privacy.title'),
      body: t('footer.termsDialog.sections.privacy.body'),
    },
    {
      number: 4,
      title: t('footer.termsDialog.sections.teacherResponsibility.title'),
      body: t('footer.termsDialog.sections.teacherResponsibility.body'),
    },
    {
      number: 5,
      title: t('footer.termsDialog.sections.studentResponsibility.title'),
      body: t('footer.termsDialog.sections.studentResponsibility.body'),
    },
  ];

  return (
    <footer className="bg-[#0A0A0A] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center mb-6">
              <span className="font-bold text-xl lg:text-2xl italic tracking-tight">{t('brand.name')}</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t('footer_extra.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-6">{t('footer_extra.quick_links')}</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg mb-6">{t('contact.title')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <span className="text-gray-400 text-sm">
                  {t('contact.info.address_value')}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                <span className="text-gray-400 text-sm">{CONTACT_PHONE}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                <span className="text-gray-400 text-sm">sizinmailiniz@gmail.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  {t('contact.info.working_hours')}: 09:00 - 18:00
                </span>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-bold text-lg mb-6">{t('footer.follow_us')}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {t('footer_extra.social_follow_desc')}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                social.disabled ? (
                  <span
                    key={social.label}
                    className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center cursor-default ${social.color}`}
                    aria-label={`${social.label} deaktivdir`}
                    title={`${social.label} deaktivdir`}
                  >
                    <social.icon />
                  </span>
                ) : (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-all hover:bg-white/20 ${social.color}`}
                    aria-label={social.label}
                  >
                    <social.icon />
                  </a>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm text-center md:text-left">
              {t('footer.copyright')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link to="/privacy" className="text-gray-500 hover:text-white text-sm transition-colors">
                {t('footer.links.privacy')}
              </Link>
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="appearance-none border-0 bg-transparent p-0 text-gray-500 transition-colors hover:text-white text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] rounded-sm"
                  >
                    {t('footer.links.terms')}
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader className="text-left">
                    <DialogTitle>{t('footer.termsDialog.title')}</DialogTitle>
                  </DialogHeader>
                  <ol className="space-y-3">
                    {termsSections.map((section) => (
                      <li
                        key={section.number}
                        className="rounded-lg border border-slate-200 bg-slate-50/80 p-4"
                      >
                        <h4 className="font-semibold text-slate-900">
                          {section.number}. {section.title}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {section.body}
                        </p>
                      </li>
                    ))}
                  </ol>
                  <div className="flex justify-end pt-2">
                    <DialogClose asChild>
                      <Button variant="outline" size="sm">
                        {t('footer.termsDialog.close')}
                      </Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
