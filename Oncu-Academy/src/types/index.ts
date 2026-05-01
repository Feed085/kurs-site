export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  createdAt: Date;
}

export interface Teacher {
  id: string;
  userId: string;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio: string;
  education: string;
  experience: number;
  specialties: string[];
  studentCount: number;
  courseCount: number;
  rating: number;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface Review {
  id?: string;
  _id?: string;
  user?: {
    id?: string;
    _id?: string;
    name?: string;
    surname?: string;
    avatar?: string;
  } | string | null;
  name?: string;
  rating: number;
  comment: string;
  createdAt?: Date | string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: 'language' | 'exam' | 'computer' | 'other';
  image?: string;
  teacherId: string;
  teacherName?: string;
  teacherAvatar?: string;
  duration: string;
  lessonCount: number;
  studentCount: number;
  price: number;
  rating: number;
  reviews?: Review[];
  learningPoints?: string[];
  includes?: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName?: string;
  videoUrl: string;
  thumbnail?: string;
  duration: string | number;
  order: number;
  isPublic: boolean;
  createdAt: Date;
}

export interface Test {
  id: string;
  title: string;
  courseId: string;
  courseName?: string;
  teacherId: string;
  duration: number;
  questionCount: number;
  questions: Question[];
  isActive: boolean;
  createdAt: Date;
}

export interface Question {
  id: string;
  testId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  openEndedAnswerType?: 'text' | 'number';
  order: number;
}

export interface TestResult {
  id: string;
  testId: string;
  studentId: string;
  studentName?: string;
  studentAvatar?: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  answers: Record<string, number>;
  completedAt: Date;
}

export interface StudentProgress {
  courseId: string;
  courseName: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessed: Date;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: Date;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

export interface StatItem {
  number: string;
  label: string;
}

export interface Testimonial {
  id: string;
  name: string;
  avatar?: string;
  quote: string;
  role?: string;
}
