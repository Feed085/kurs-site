import { useState } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Star, 
  Users, 
  BookOpen, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { getPublicCategories, getPublicTeachers, normalizeCategoryKey } from '@/services/publicApi';
import type { PublicCategory, PublicTeacher } from '@/services/publicApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const demoTeachers: PublicTeacher[] = [
  {
    id: 'demo-teacher-1',
    name: 'Leyla',
    surname: 'Əhmədova',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    categories: ['ingilis-dili', 'ielts'],
    rating: 4.9,
    education: 'Bakı Dövlət Universiteti',
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

export default function Teachers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [teachers, setTeachers] = useState<PublicTeacher[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadTeachers = async () => {
      try {
        const [teacherList, categoryList] = await Promise.all([
          getPublicTeachers(),
          getPublicCategories()
        ]);

        if (isMounted) {
          setTeachers(teacherList.length > 0 ? teacherList : demoTeachers);
          setCategories(categoryList);
        }
      } catch (error) {
        console.error('Müəllimlər yüklənə bilmədi', error);
        if (isMounted) {
          setTeachers(demoTeachers);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTeachers();

    return () => {
      isMounted = false;
    };
  }, []);

  const backendCategories = categories.length > 0
    ? categories
    : Array.from(new Set(teachers.flatMap((teacher) => teacher.categories || [])))
        .filter(Boolean)
        .map((value, index) => ({
          id: value,
          slug: value,
          name: value,
          description: '',
          color: '#D4AF37',
          icon: 'Tag',
          order: index + 1,
          isActive: true
        }));

  const availableCategories = [
    { id: 'all', slug: 'all', name: t('courses.categories.all'), description: '', color: '#D4AF37', icon: 'Tag', order: 0, isActive: true },
    ...backendCategories
  ];

  const categoryMatches = (teacher: PublicTeacher, categoryValue: string) => {
    const teacherCategories = teacher.categories || [];
    const teacherSpecialties = teacher.specialties || [];

    return [...teacherCategories, ...teacherSpecialties].some((value) => {
      const normalizedValue = normalizeCategoryKey(value);
      return normalizedValue === normalizeCategoryKey(categoryValue);
    });
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.education?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher.bio || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher.specialties || []).some((specialty) => specialty.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSpecialty = 
      selectedCategory === 'all' || 
      categoryMatches(teacher, selectedCategory);
    
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="page-shell min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)]">
      <div className="page-section mx-auto max-w-7xl py-6 sm:py-8">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#D4AF37] rounded-full" />
            <span className="text-sm font-medium text-[#D4AF37]">{t('teachers.team_badge')}</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
            {t('teachers.title')}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('teachers.subtitle')}
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('teachers.search')}
              className="pl-12 h-12 rounded-xl bg-white border-0 shadow-sm"
            />
          </div>
          <div className="w-full sm:w-[220px] shrink-0">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full !h-14 bg-white border-2 border-gray-100 rounded-2xl shadow-lg shadow-gray-200/50 focus:ring-0 focus:ring-offset-0 outline-none focus:border-[#D4AF37] text-gray-700 font-medium px-5">
                <div className="flex items-center gap-2.5">
                  <Filter className="w-4 h-4 text-[#D4AF37]" />
                  <SelectValue placeholder={t('courses.category')} />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2 min-w-[220px]">
                {isLoading && categories.length === 0 ? (
                  <SelectItem value="loading" disabled className="py-3 px-4 rounded-xl text-sm font-medium text-gray-400">
                    {t('teachers.loading_categories')}
                  </SelectItem>
                ) : (
                  availableCategories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id}
                      className="py-3 px-4 rounded-xl text-sm font-medium text-gray-600 cursor-pointer focus:bg-[#D4AF37]/10 focus:text-[#D4AF37] data-[state=checked]:text-[#D4AF37] data-[state=checked]:bg-[#D4AF37]/5 transition-colors mb-1 last:mb-0"
                    >
                      {category.id === 'all' ? t('courses.categories.all') : category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm"
              >
                <Skeleton className="h-64 w-full rounded-none" />
                <div className="p-5 space-y-4">
                  <Skeleton className="h-6 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </div>
            ))
          ) : (
            filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={teacher.avatar}
                    alt={`${teacher.name} ${teacher.surname}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Rating */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-gray-900">{teacher.rating}</span>
                  </div>

                  {/* Name overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {teacher.name} {teacher.surname}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {(teacher.specialties || []).slice(0, 2).map((specialty, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Stats */}
                  <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Users className="w-4 h-4 text-[#D4AF37]" />
                      <span>{teacher.studentCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <BookOpen className="w-4 h-4 text-[#A87A1F]" />
                      <span>{teacher.courseCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <span className="text-[#F59E0B]">{teacher.experience} {t('teachers.years_abbr')}</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                    {teacher.bio}
                  </p>

                  {/* Button */}
                  <Button
                    onClick={() => navigate(`/teachers/${teacher.id}`)}
                    className="w-full bg-[#D4AF37] hover:bg-[#B88A1B] text-white rounded-xl group/btn"
                  >
                    {t('teachers.view_profile')}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Empty State */}
        {!isLoading && filteredTeachers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t('teachers.not_found')}
            </h3>
            <p className="text-gray-500">
              {t('test.empty_desc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
