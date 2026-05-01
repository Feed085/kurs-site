export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  stats?: unknown;
  courses?: unknown;
};

export type PublicCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  order: number;
  isActive: boolean;
};

export type PublicCourse = {
  id: string;
  _id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  price: number;
  rating: number;
  learningPoints: string[];
  includes: string[];
  isActive: boolean;
  createdAt?: string;
  instructor: {
    id: string;
    _id: string;
    name: string;
    surname: string;
    avatar: string;
    rating: number;
  } | null;
};

export type PublicTeacher = {
  id: string;
  name: string;
  surname: string;
  avatar: string;
  categories: string[];
  rating: number;
  education: string;
  experience: number;
  location: string;
  bio: string;
  specialties: string[];
  specializedAreas: string[];
  socialLinks: Record<string, string>;
  studentCount: number;
  courseCount: number;
  testCount: number;
  courseReviewCount: number;
  teacherReviewCount: number;
  courseRating: number;
  teacherRating: number;
  createdAt?: string;
};

export type PublicTeacherReview = {
  _id?: string;
  user?: {
    _id?: string;
    id?: string;
    name?: string;
    surname?: string;
    avatar?: string;
  } | null;
  name?: string;
  rating: number;
  comment: string;
  createdAt?: string;
};

export type PublicTeacherDetailResponse = {
  success: boolean;
  data: PublicTeacher;
  courses: PublicCourse[];
  teacherReviews?: PublicTeacherReview[];
  stats?: {
    studentCount: number;
    courseCount: number;
    testCount: number;
    courseReviewCount?: number;
    teacherReviewCount?: number;
    courseRating?: number;
    teacherRating?: number;
  };
  message?: string;
};

export type PublicStats = {
  students: number;
  teachers: number;
  courses: number;
  experience: number;
};

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, init);

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return payload as T;
};

const normalizeId = (item: { id?: string; _id?: string } | null | undefined) => item?.id || item?._id || '';

const normalizeSocialLinks = (socialLinks: unknown) => {
  if (!socialLinks || typeof socialLinks !== 'object') {
    return {};
  }

  return Object.fromEntries(Object.entries(socialLinks as Record<string, string>));
};

const normalizeTeacher = (teacher: any): PublicTeacher => {
  const specializedAreas = Array.isArray(teacher.specializedAreas) ? teacher.specializedAreas : [];
  const specialties = Array.isArray(teacher.specialties) && teacher.specialties.length > 0
    ? teacher.specialties
    : specializedAreas;
  const experience = Number(teacher.experience || 0);

  return {
    id: normalizeId(teacher),
    name: teacher.name || '',
    surname: teacher.surname || '',
    avatar: teacher.avatar || '',
    categories: Array.isArray(teacher.categories) ? teacher.categories : [],
    rating: Number(teacher.teacherRating ?? teacher.rating ?? 0),
    education: teacher.education || '',
    experience: Number.isFinite(experience) ? experience : 0,
    location: teacher.location || '',
    bio: teacher.bio || teacher.education || teacher.location || specialties.slice(0, 3).join(', ') || 'Müəllim profili yenilənir.',
    specialties,
    specializedAreas,
    socialLinks: normalizeSocialLinks(teacher.socialLinks),
    studentCount: Number(teacher.studentCount || 0),
    courseCount: Number(teacher.courseCount || 0),
    testCount: Number(teacher.testCount || 0),
    courseReviewCount: Number(teacher.courseReviewCount || 0),
    teacherReviewCount: Number(teacher.teacherReviewCount || 0),
    courseRating: Number(teacher.courseRating || 0),
    teacherRating: Number(teacher.teacherRating ?? teacher.rating ?? 0),
    createdAt: teacher.createdAt
  };
};

const normalizeCourse = (course: any): PublicCourse => {
  const instructor = course.instructor || null;

  return {
    id: normalizeId(course),
    _id: normalizeId(course),
    title: course.title || '',
    description: course.description || '',
    category: course.category || '',
    image: course.image || '',
    price: Number(course.price || 0),
    rating: Number(course.rating || 0),
    learningPoints: Array.isArray(course.learningPoints) ? course.learningPoints.filter(Boolean) : [],
    includes: Array.isArray(course.includes) ? course.includes.filter(Boolean) : [],
    isActive: Boolean(course.isActive),
    createdAt: course.createdAt,
    instructor: instructor
      ? {
          id: normalizeId(instructor),
          _id: normalizeId(instructor),
          name: instructor.name || '',
          surname: instructor.surname || '',
          avatar: instructor.avatar || '',
          rating: Number(instructor.rating || 0)
        }
      : null
  };
};

const sortPublicCourses = (left: PublicCourse, right: PublicCourse) => {
  const ratingDiff = (right.rating || 0) - (left.rating || 0);

  if (ratingDiff !== 0) {
    return ratingDiff;
  }

  return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
};

const normalizeCategory = (category: any): PublicCategory => ({
  id: category.id || category.slug || '',
  slug: category.slug || category.id || '',
  name: category.name || '',
  description: category.description || '',
  color: category.color || '#D4AF37',
  icon: category.icon || 'Tag',
  order: Number(category.order || 0),
  isActive: Boolean(category.isActive)
});

export const normalizeCategoryKey = (value = '') => value
  .trim()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[çÇ]/g, 'c')
  .replace(/[ğĞ]/g, 'g')
  .replace(/[ıİ]/g, 'i')
  .replace(/[öÖ]/g, 'o')
  .replace(/[şŞ]/g, 's')
  .replace(/[üÜ]/g, 'u')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

export const resolveCategoryLabel = (value: string, categories: PublicCategory[]) => {
  const normalizedValue = normalizeCategoryKey(value);
  const match = categories.find((category) => {
    const idMatch = normalizeCategoryKey(category.id) === normalizedValue;
    const slugMatch = normalizeCategoryKey(category.slug) === normalizedValue;
    const nameMatch = normalizeCategoryKey(category.name) === normalizedValue;

    return idMatch || slugMatch || nameMatch;
  });

  return match?.name || value;
};

export const buildFallbackCourseCategories = (courses: PublicCourse[]): PublicCategory[] => {
  const categories = new Map<string, PublicCategory>();

  courses.forEach((course) => {
    const key = normalizeCategoryKey(course.category);
    if (!key || categories.has(key)) {
      return;
    }

    categories.set(key, {
      id: key,
      slug: key,
      name: course.category || key,
      description: '',
      color: '#D4AF37',
      icon: 'Tag',
      order: categories.size + 1,
      isActive: true
    });
  });

  return Array.from(categories.values());
};

export const getPublicCourses = async () => {
  const response = await requestJson<ApiResponse<any[]>>('/courses');
  return (response.data || []).map(normalizeCourse).sort(sortPublicCourses);
};

export const getPublicCategories = async () => {
  const response = await requestJson<ApiResponse<any[]>>('/categories');
  return (response.data || []).map(normalizeCategory);
};

export const getPublicTeachers = async () => {
  const response = await requestJson<ApiResponse<any[]>>('/teacher/public');
  return (response.data || []).map(normalizeTeacher);
};

export const getPublicStats = async () => {
  const response = await requestJson<ApiResponse<PublicStats>>('/public/stats');
  return response.data;
};

export const getPublicTeacher = async (id: string) => {
  const response = await requestJson<PublicTeacherDetailResponse>(`/teacher/public/${id}`);

  return {
    ...response,
    data: normalizeTeacher(response.data),
    teacherReviews: (response.teacherReviews || []).map((review) => ({
      ...review,
      user: review.user && typeof review.user === 'object'
        ? {
            _id: review.user._id || review.user.id,
            id: review.user.id || review.user._id,
            name: review.user.name || '',
            surname: review.user.surname || '',
            avatar: review.user.avatar || ''
          }
        : review.user,
      rating: Number(review.rating || 0),
      comment: review.comment || ''
    })),
    courses: (response.courses || []).map(normalizeCourse).sort(sortPublicCourses)
  };
};
