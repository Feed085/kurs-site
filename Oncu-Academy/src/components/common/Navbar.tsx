import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, User, LogOut, BookOpen, Users, Phone, Home, ChevronDown, Settings, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPublicCourses, getPublicTeachers } from '@/services/publicApi';
import type { PublicCourse, PublicTeacher } from '@/services/publicApi';
import LanguageSelector from './LanguageSelector';


export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isCoursesHovered, setIsCoursesHovered] = useState(false);
  const [isTeachersHovered, setIsTeachersHovered] = useState(false);
  const [dbCourses, setDbCourses] = useState<PublicCourse[]>([]);
  const [publicTeachers, setPublicTeachers] = useState<PublicTeacher[]>([]);
  
  const isHomePage = location.pathname === '/';
  const isHomeTop = isHomePage && !isScrolled;
  const isWatchPage = location.pathname.includes('/watch');
  const isDarkHeaderPage = location.pathname === '/contact';
  const isDarkPage = (location.pathname.startsWith('/courses/') && !isWatchPage) || isDarkHeaderPage;
  
  const coursesTimer = useRef<any>(null);
  const teachersTimer = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPreviewData = async () => {
      try {
        const [coursesResult, teachersResult] = await Promise.allSettled([
          getPublicCourses(),
          getPublicTeachers()
        ]);

        if (!isMounted) {
          return;
        }

        setDbCourses(coursesResult.status === 'fulfilled' ? coursesResult.value : []);
        setPublicTeachers(teachersResult.status === 'fulfilled' ? teachersResult.value : []);
      } catch (error) {
        console.error('Navbar preview data could not be loaded', error);
      }
    };

    loadPreviewData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleMouseEnter = (type: 'courses' | 'teachers') => {
    if (type === 'courses') {
      if (coursesTimer.current) clearTimeout(coursesTimer.current);
      setIsCoursesHovered(true);
      setIsTeachersHovered(false);
    } else {
      if (teachersTimer.current) clearTimeout(teachersTimer.current);
      setIsTeachersHovered(true);
      setIsCoursesHovered(false);
    }
  };

  const handleMouseLeave = (type: 'courses' | 'teachers') => {
    const timer = setTimeout(() => {
      if (type === 'courses') setIsCoursesHovered(false);
      else setIsTeachersHovered(false);
    }, 150);
    
    if (type === 'courses') coursesTimer.current = timer;
    else teachersTimer.current = timer;
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.body.classList.toggle('mobile-menu-open', isOpen);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isOpen]);

  const navItems = [
    { label: t('nav.home'), href: '/', icon: Home },
    { label: t('nav.courses'), href: '/courses', icon: BookOpen },
    { label: t('nav.teachers'), href: '/teachers', icon: Users },
    { label: t('nav.contact'), href: '/contact', icon: Phone },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isHomeTop
          ? 'bg-transparent'
          : isScrolled || isWatchPage
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
          : isDarkHeaderPage
          ? 'bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[var(--site-header-height)] items-center justify-between gap-3 lg:gap-6">
          {/* Logo */}
          <Link 
            to="/" 
            className={cn(
              "flex min-w-0 items-center transition-opacity duration-200", 
              isOpen && "opacity-0 invisible lg:opacity-100"
            )}
          >
            <span className={`truncate font-bold text-base lg:text-2xl transition-colors ${
              isHomeTop
                ? 'text-white'
                : isScrolled || isWatchPage
                ? 'text-gray-900'
                : isDarkPage
                ? 'text-white'
                : 'text-gray-900'
            }`}>
              Sizin Akademiyanız
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => {
              const hasDropdown = item.href === '/courses' || item.href === '/teachers';
              const isHovered = item.href === '/courses' ? isCoursesHovered : isTeachersHovered;
              const type = item.href === '/courses' ? 'courses' : 'teachers';

              return (
                <div key={item.href} className="relative group">
                  <Link
                    to={item.href}
                    onMouseEnter={() => hasDropdown && handleMouseEnter(type)}
                    onMouseLeave={() => hasDropdown && handleMouseLeave(type)}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-[#D4AF37] px-3 py-1.5 rounded-lg flex items-center gap-1",
                      isActive(item.href)
                        ? 'text-[#D4AF37]'
                        : isHomeTop
                        ? 'text-white/90'
                        : (isScrolled || isWatchPage)
                        ? 'text-gray-700'
                        : isDarkPage
                        ? 'text-white/90'
                        : 'text-gray-700'
                    )}
                  >
                    {item.label}
                    {hasDropdown && (
                      <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isHovered && "rotate-180")} />
                    )}
                  </Link>

                  {hasDropdown && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className={cn(
                          "fixed bottom-0 left-0 right-0 top-[var(--site-header-height)] bg-black/30 backdrop-blur-[2px] z-[-1] transition-all duration-500 pointer-events-none",
                          isHovered ? "opacity-100 visible" : "opacity-0 invisible"
                        )}
                      />
                      {isHovered && (
                        <div 
                          className="fixed left-0 right-0 top-[var(--site-header-height)] -mt-[1px] w-screen border-b border-gray-100 bg-white shadow-[0_45px_100px_-25px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-top-2 duration-500 ease-out z-[100] pointer-events-auto"
                          onMouseEnter={() => handleMouseEnter(type)}
                          onMouseLeave={() => handleMouseLeave(type)}
                        >
                          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                            <div className="grid grid-cols-4 gap-6">
                              <div className="col-span-4 mb-1 flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-bold text-gray-900 tracking-tight">
                                    {item.href === '/courses' ? t('courses.title') : t('teachers.title')}
                                  </h4>
                                  <p className="text-[10px] text-gray-500">
                                    {item.href === '/courses' ? t('courses.subtitle') : t('teachers.subtitle')}
                                  </p>
                                </div>
                                <Link
                                  to={item.href}
                                  onClick={() => {
                                    setIsCoursesHovered(false);
                                    setIsTeachersHovered(false);
                                  }}
                                  className="text-[10px] font-bold text-[#D4AF37] hover:text-[#B88A1B] flex items-center gap-1 group transition-colors"
                                >
                                  {t('courses.view_all')}
                                  <ChevronDown className="w-2.5 h-2.5 -rotate-90 group-hover:translate-x-1 transition-transform" />
                                </Link>
                              </div>

                              {item.href === '/courses' ? (
                                [...dbCourses]
                                  .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                                  .slice(0, 4)
                                  .map((course) => (
                                  <Link
                                    key={course.id}
                                    to={`/courses`}
                                    onClick={() => setIsCoursesHovered(false)}
                                    className="group block select-none space-y-2 rounded-lg p-2 leading-none no-underline outline-none transition-all hover:bg-gray-50/80 border border-transparent hover:border-gray-100"
                                  >
                                    <div className="aspect-video w-full rounded-md overflow-hidden border border-gray-100 shadow-sm">
                                      <img 
                                        src={course.image} 
                                        alt={course.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-[13px] font-bold leading-tight text-gray-900 group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                                        {course.title}
                                      </div>
                                      <p className="line-clamp-1 text-[10px] leading-relaxed text-gray-500">
                                        {course.description}
                                      </p>
                                    </div>
                                  </Link>
                                ))
                              ) : (
                                publicTeachers.slice(0, 4).map((teacher) => (
                                  <Link
                                    key={teacher.id}
                                    to={`/teachers`}
                                    onClick={() => setIsTeachersHovered(false)}
                                    className="group block select-none space-y-3 rounded-lg p-2 leading-none no-underline outline-none transition-all hover:bg-gray-50/80 border border-transparent hover:border-gray-100"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-[#D4AF37] transition-colors shrink-0">
                                        <img 
                                          src={teacher.avatar} 
                                          alt={teacher.name} 
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-[13px] font-bold leading-tight text-gray-900 group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                                          {teacher.name} {teacher.surname}
                                        </div>
                                        <p className="line-clamp-1 text-[10px] text-gray-500 mt-0.5">
                                          {(teacher.specialties || []).join(', ')}
                                        </p>
                                      </div>
                                    </div>
                                  </Link>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <LanguageSelector
              className={cn(
                "hover:bg-[#D4AF37]/10 transition-colors",
                isHomeTop ? "text-white" : isScrolled || isWatchPage ? "text-gray-900" : isDarkPage ? "text-white" : "text-gray-900"
              )}
            />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "flex items-center gap-2 transition-colors",
                      isHomeTop ? "text-white" : isScrolled || isWatchPage ? "text-gray-900" : isDarkPage ? "text-white" : "text-gray-900"
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{user?.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 z-[110]">
                  <DropdownMenuItem onClick={() => {
                    window.scrollTo(0, 0);
                    navigate(user?.role === 'teacher' ? '/teacher/dashboard' : '/dashboard');
                  }}>
                    <User className="w-4 h-4 mr-2" />
                    {t('nav.dashboard')}
                  </DropdownMenuItem>
                  {user?.role === 'student' && (
                    <DropdownMenuItem onClick={() => {
                      window.scrollTo(0, 0);
                      navigate('/exam-panel');
                    }}>
                      <FileText className="w-4 h-4 mr-2" />
                      {t('nav.exam_panel')}
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'teacher' && (
                    <DropdownMenuItem onClick={() => {
                      window.scrollTo(0, 0);
                      navigate('/teacher/exam-panel');
                    }}>
                      <FileText className="w-4 h-4 mr-2" />
                      {t('nav.exam_panel')}
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'teacher' && (
                    <DropdownMenuItem onClick={() => {
                      window.scrollTo(0, 0);
                      navigate('/teacher/profile');
                    }}>
                      <Settings className="w-4 h-4 mr-2" />
                      {t('nav.profile')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className={cn(
                    "font-medium transition-colors",
                      isHomeTop ? "text-white" : isScrolled || isWatchPage ? "text-gray-900" : isDarkPage ? "text-white" : "text-gray-900"
                  )}
                >
                  {t('nav.login')}
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-[#D4AF37] hover:bg-[#B88A1B] text-white font-medium rounded-full px-6"
                >
                  {t('nav.register')}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu & Language Selector */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSelector
              className={cn(
                "hover:bg-[#D4AF37]/10 transition-colors",
                isHomeTop ? "text-white" : isScrolled || isWatchPage ? "text-gray-900" : isDarkPage ? "text-white" : "text-gray-900"
              )}
              align="end"
            />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={cn(
                  "hover:bg-[#D4AF37]/10 transition-colors z-[110]",
                  isHomeTop ? "text-white" : isScrolled || isWatchPage ? "text-gray-900" : (isDarkPage && !isOpen) ? "text-white" : "text-gray-900",
                  isOpen && "opacity-0 pointer-events-none"
                )}
              >
                <Menu className="w-7 h-7" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] border-l-0 bg-[#F3F3F3]/95 backdrop-blur-xl p-0">
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="p-6 border-b border-gray-100 bg-white/50">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-bold text-xl text-gray-900 leading-none">Sizin Akademiyanız</h4>
                      <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest mt-1">Gələcəyi bizimlə qurun</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation Links */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 pl-1">Naviqasiya</div>
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                        isActive(item.href) 
                          ? 'bg-[#D4AF37] text-white shadow-xl shadow-[#D4AF37]/20 translate-x-1' 
                          : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-100 active:scale-95'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                          isActive(item.href) ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-[#D4AF37]/10'
                        )}>
                          <item.icon className={cn("w-5 h-5", isActive(item.href) ? 'text-white' : 'text-gray-500 group-hover:text-[#D4AF37]')} />
                        </div>
                        <span className="font-bold text-base">{item.label}</span>
                      </div>
                      <ChevronDown className={cn("-rotate-90 w-4 h-4 transition-opacity", isActive(item.href) ? 'opacity-100' : 'opacity-30 group-hover:opacity-100')} />
                    </Link>
                  ))}
                </div>

                {/* Mobile Auth/User Section */}
                <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                  {isAuthenticated ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B88A1B] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 shrink-0">
                          <User className="w-7 h-7 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-lg truncate leading-tight">{user?.name} {user?.surname}</p>
                          <p className="text-sm text-gray-500 truncate mt-0.5">{user?.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <Button
                          variant="outline"
                          className="h-14 rounded-2xl border-gray-200 font-bold hover:bg-[#D4AF37]/5 hover:text-[#D4AF37] hover:border-[#D4AF37]/30"
                          onClick={() => {
                            setIsOpen(false);
                            window.scrollTo(0, 0);
                            navigate(user?.role === 'teacher' ? '/teacher/dashboard' : '/dashboard');
                          }}
                        >
                          <User className="w-4 h-4 mr-2" />
                          {t('nav.dashboard')}
                        </Button>
                        {user?.role === 'student' && (
                          <Button
                            variant="outline"
                            className="h-14 rounded-2xl border-gray-200 font-bold hover:bg-[#D4AF37]/5 hover:text-[#D4AF37] hover:border-[#D4AF37]/30"
                            onClick={() => {
                              setIsOpen(false);
                              window.scrollTo(0, 0);
                              navigate('/exam-panel');
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {t('nav.exam_panel')}
                          </Button>
                        )}
                        {user?.role === 'teacher' && (
                          <Button
                            variant="outline"
                            className="h-14 rounded-2xl border-gray-200 font-bold hover:bg-[#D4AF37]/5 hover:text-[#D4AF37] hover:border-[#D4AF37]/30"
                            onClick={() => {
                              setIsOpen(false);
                              window.scrollTo(0, 0);
                              navigate('/teacher/exam-panel');
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {t('nav.exam_panel')}
                          </Button>
                        )}
                        {user?.role === 'teacher' && (
                          <Button
                            variant="outline"
                            className="h-14 rounded-2xl border-gray-200 font-bold hover:bg-[#D4AF37]/5 hover:text-[#D4AF37] hover:border-[#D4AF37]/30"
                            onClick={() => {
                              setIsOpen(false);
                              window.scrollTo(0, 0);
                              navigate('/teacher/profile');
                            }}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            {t('nav.profile')}
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          className="h-14 rounded-2xl font-bold bg-red-50 text-red-600 border-red-100 hover:bg-red-100 shadow-none border"
                          onClick={() => {
                            setIsOpen(false);
                            handleLogout();
                          }}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          {t('nav.logout')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full h-14 rounded-2xl text-base font-bold border-gray-200 hover:bg-gray-50 bg-white"
                        onClick={() => {
                          setIsOpen(false);
                          navigate('/login');
                        }}
                      >
                        {t('nav.login')}
                      </Button>
                      <Button
                        className="w-full h-14 rounded-2xl text-base font-bold bg-[#D4AF37] hover:bg-[#B88A1B] shadow-lg shadow-[#D4AF37]/20 border-0"
                        onClick={() => {
                          setIsOpen(false);
                          navigate('/register');
                        }}
                      >
                        {t('nav.register')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
