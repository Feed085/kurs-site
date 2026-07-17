import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  className?: string;
}

const languages = [
  { code: 'en', label: 'English', short: 'EN', flag: '🇺🇸' },
  { code: 'tr', label: 'Türkçe', short: 'TR', flag: '🇹🇷' },
  { code: 'az', label: 'Azərbaycanca', short: 'AZ', flag: '🇦🇿' },
];

export default function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangCode = i18n.language ? i18n.language.substring(0, 2) : 'en';
  const currentLang = languages.find((lang) => lang.code === currentLangCode) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-sm rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 text-gray-700"
      >
        <Globe className="w-4 h-4 opacity-70" />
        <span>{currentLang.short}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 z-[110] bg-white border border-gray-100 shadow-lg rounded-xl p-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center justify-start gap-2 cursor-pointer px-3 py-2 rounded-lg text-sm transition-colors ${
                currentLang.code === lang.code 
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-gray-700 hover:bg-gray-50 focus:bg-gray-50"
              }`}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
