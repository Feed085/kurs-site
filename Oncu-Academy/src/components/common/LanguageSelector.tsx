import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  className?: string;
  align?: 'start' | 'center' | 'end';
}

const languages = [
  { code: 'en', label: 'English', short: 'EN', flag: '🇺🇸' },
  { code: 'tr', label: 'Türkçe', short: 'TR', flag: '🇹🇷' },
  { code: 'az', label: 'Azərbaycanca', short: 'AZ', flag: '🇦🇿' },
];

export default function LanguageSelector({ className, align = 'end' }: LanguageSelectorProps) {
  const { i18n } = useTranslation();

  const currentLangCode = i18n.language ? i18n.language.substring(0, 2) : 'en';
  const currentLang = languages.find((lang) => lang.code === currentLangCode) || languages[0];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex items-center gap-1.5 px-2.5 h-9 font-semibold text-sm rounded-full transition-colors focus-visible:ring-0 focus-visible:ring-offset-0",
            className
          )}
        >
          <Globe className="w-4 h-4 opacity-70" />
          <span>{currentLang.short}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-36 z-[110] bg-white border border-gray-100 shadow-lg rounded-xl p-1">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              "flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-sm transition-colors text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-900",
              currentLang.code === lang.code && "bg-[#D4AF37]/10 text-[#A87A1F] hover:bg-[#D4AF37]/10 hover:text-[#A87A1F] font-semibold"
            )}
          >
            <span className="text-base leading-none">{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
