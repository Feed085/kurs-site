import type { Teacher, Course, Test, TestResult, Testimonial, User } from '@/types';

export const teachers: Teacher[] = [
  {
    id: '1',
    userId: 't1',
    name: 'Leyla',
    surname: 'Əhmədova',
    email: 'leyla@example.com',
    phone: '+994 50 123 45 67',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    bio: '15 illik təcrübəyə malik ingilis dili müəllimi. IELTS və SAT üzrə ixtisaslaşmışam.',
    education: 'Bakı Dövlət Universiteti, Filologiya fakültəsi',
    experience: 15,
    specialties: ['İngilis dili', 'IELTS', 'SAT'],
    studentCount: 1200,
    courseCount: 8,
    rating: 4.9,
    socialLinks: {
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
      linkedin: 'https://linkedin.com'
    }
  },
  {
    id: '2',
    userId: 't2',
    name: 'Kamran',
    surname: 'Hüseynov',
    email: 'kamran@example.com',
    phone: '+994 50 234 56 78',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    bio: 'Rus dili və ədəbiyyatı üzrə mütəxəssis. 10 ildən çox tədris təcrübəsi.',
    education: 'Moskva Dövlət Universiteti',
    experience: 12,
    specialties: ['Rus dili', 'Rus ədəbiyyatı'],
    studentCount: 800,
    courseCount: 5,
    rating: 4.8,
    socialLinks: {
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com'
    }
  },
  {
    id: '3',
    userId: 't3',
    name: 'Nigar',
    surname: 'Məmmədova',
    email: 'nigar@example.com',
    phone: '+994 50 345 67 89',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    bio: 'Ərab dili müəllimi. 8 illik təcrübə. Quran və ərəb ədəbiyyatı üzrə ixtisas.',
    education: 'Əl-Əzhər Universiteti',
    experience: 8,
    specialties: ['Ərab dili', 'Quran', 'İslam tarixi'],
    studentCount: 500,
    courseCount: 4,
    rating: 4.9,
    socialLinks: {
      instagram: 'https://instagram.com',
      linkedin: 'https://linkedin.com'
    }
  },
  {
    id: '4',
    userId: 't4',
    name: 'Elçin',
    surname: 'Quliyev',
    email: 'elchin@example.com',
    phone: '+994 50 456 78 90',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    bio: 'Riyaziyyat və SAT müəllimi. 20 illik təcrübə. Bir çox tələbəni prestijli universitetlərə hazırlamışam.',
    education: 'Texniki Universitet',
    experience: 20,
    specialties: ['Riyaziyyat', 'SAT', 'Fizika'],
    studentCount: 1500,
    courseCount: 6,
    rating: 5.0,
    socialLinks: {
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com'
    }
  },
  {
    id: '5',
    userId: 't5',
    name: 'Aygün',
    surname: 'Səfərova',
    email: 'aygun@example.com',
    phone: '+994 50 567 89 01',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    bio: 'Türk dili müəllimi. Ankara Universitetində təhsil almışam. 6 illik təcrübə.',
    education: 'Ankara Universiteti',
    experience: 6,
    specialties: ['Türk dili', 'Türk ədəbiyyatı'],
    studentCount: 400,
    courseCount: 3,
    rating: 4.7,
    socialLinks: {
      instagram: 'https://instagram.com'
    }
  },
  {
    id: '6',
    userId: 't6',
    name: 'Rəşad',
    surname: 'İbrahimov',
    email: 'reshad@example.com',
    phone: '+994 50 678 90 12',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    bio: 'Komputer elmləri və proqramlaşdırma müəllimi. Full-stack developer.',
    education: 'ADA Universiteti',
    experience: 7,
    specialties: ['Proqramlaşdırma', 'Web Development', 'Python'],
    studentCount: 600,
    courseCount: 5,
    rating: 4.8,
    socialLinks: {
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
      linkedin: 'https://linkedin.com'
    }
  }
];

export const courses: Course[] = [
  {
    id: '1',
    title: 'SAT Hazırlığı',
    description: 'ABŞ universitetlərinə qəbul imtahanına tam hazırlıq. Riyaziyyat və İngilis dili bölmələri.',
    category: 'exam',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',
    teacherId: '4',
    teacherName: 'Elçin Quliyev',
    teacherAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    duration: '6 ay',
    lessonCount: 72,
    studentCount: 150,
    price: 450,
    rating: 4.9,
    isActive: true,
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'IELTS Intensive',
    description: 'IELTS imtahanına intensiv hazırlıq. Listening, Reading, Writing və Speaking bölmələri.',
    category: 'exam',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop',
    teacherId: '1',
    teacherName: 'Leyla Əhmədova',
    teacherAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    duration: '3 ay',
    lessonCount: 36,
    studentCount: 200,
    price: 350,
    rating: 4.9,
    isActive: true,
    createdAt: new Date('2024-02-01')
  },
  {
    id: '3',
    title: 'İngilis Dili - Başlanğıc',
    description: 'İngilis dilini sıfırdan öyrənin. Qrammatika, sözlük və danışıq praktikası.',
    category: 'language',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=400&fit=crop',
    teacherId: '1',
    teacherName: 'Leyla Əhmədova',
    teacherAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    duration: '4 ay',
    lessonCount: 48,
    studentCount: 300,
    price: 280,
    rating: 4.8,
    isActive: true,
    createdAt: new Date('2024-01-20')
  },
  {
    id: '4',
    title: 'Rus Dili - Orta Səviyyə',
    description: 'Rus dilini inkişaf etdirin. Mürəkkəb qrammatika və geniş sözlük.',
    category: 'language',
    image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&h=400&fit=crop',
    teacherId: '2',
    teacherName: 'Kamran Hüseynov',
    teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    duration: '5 ay',
    lessonCount: 60,
    studentCount: 180,
    price: 300,
    rating: 4.7,
    isActive: true,
    createdAt: new Date('2024-02-10')
  },
  {
    id: '5',
    title: 'Ərab Dili - Əsaslar',
    description: 'Ərəb əlifbası, əsas qrammatika və gündəlik danışıq.',
    category: 'language',
    image: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=600&h=400&fit=crop',
    teacherId: '3',
    teacherName: 'Nigar Məmmədova',
    teacherAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    duration: '6 ay',
    lessonCount: 72,
    studentCount: 120,
    price: 320,
    rating: 4.9,
    isActive: true,
    createdAt: new Date('2024-01-25')
  },
  {
    id: '6',
    title: 'Türk Dili',
    description: 'Türk dilini asanlıqla öyrənin. Qrammatika və danışıq praktikası.',
    category: 'language',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop',
    teacherId: '5',
    teacherName: 'Aygün Səfərova',
    teacherAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    duration: '4 ay',
    lessonCount: 48,
    studentCount: 150,
    price: 250,
    rating: 4.6,
    isActive: true,
    createdAt: new Date('2024-02-15')
  },
  {
    id: '7',
    title: 'Web Proqramlaşdırma',
    description: 'HTML, CSS, JavaScript və React ilə web development öyrənin.',
    category: 'computer',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop',
    teacherId: '6',
    teacherName: 'Rəşad İbrahimov',
    teacherAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    duration: '6 ay',
    lessonCount: 72,
    studentCount: 100,
    price: 500,
    rating: 4.8,
    isActive: true,
    createdAt: new Date('2024-03-01')
  },
  {
    id: '8',
    title: 'Python Proqramlaşdırma',
    description: 'Python dilini sıfırdan öyrənin. Data analysis və AI əsasları.',
    category: 'computer',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop',
    teacherId: '6',
    teacherName: 'Rəşad İbrahimov',
    teacherAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    duration: '4 ay',
    lessonCount: 48,
    studentCount: 80,
    price: 400,
    rating: 4.7,
    isActive: true,
    createdAt: new Date('2024-03-10')
  }
];

export const tests: Test[] = [
  {
    id: '1',
    title: 'İngilis Dili - Başlanğıc Testi',
    courseId: '3',
    courseName: 'İngilis Dili - Başlanğıc',
    teacherId: '1',
    duration: 30,
    questionCount: 20,
    questions: [
      {
        id: 'q1',
        testId: '1',
        question: '"Hello" sözünün mənası nədir?',
        options: ['Salam', 'Sağ ol', 'Gecən xeyir', 'Sabahın xeyir'],
        correctAnswer: 0,
        order: 1
      },
      {
        id: 'q2',
        testId: '1',
        question: '"Thank you" sözünün mənası nədir?',
        options: ['Zəhmət olmasa', 'Sağ olun', 'Bağışlayın', 'Görüşənədək'],
        correctAnswer: 1,
        order: 2
      },
      {
        id: 'q3',
        testId: '1',
        question: '"Good morning" nə vaxt deyilir?',
        options: ['Gecə', 'Səhər', 'Günorta', 'Axşam'],
        correctAnswer: 1,
        order: 3
      },
      {
        id: 'q4',
        testId: '1',
        question: '"Book" sözünün mənası nədir?',
        options: ['Defter', 'Kitab', 'Qələm', 'Stol'],
        correctAnswer: 1,
        order: 4
      },
      {
        id: 'q5',
        testId: '1',
        question: '"I am a student" cümləsində "student" nə deməkdir?',
        options: ['Müəllim', 'Tələbə', 'Həkim', 'Mühəndis'],
        correctAnswer: 1,
        order: 5
      }
    ],
    isActive: true,
    createdAt: new Date('2024-02-01')
  },
  {
    id: '2',
    title: 'SAT Riyaziyyat Testi',
    courseId: '1',
    courseName: 'SAT Hazırlığı',
    teacherId: '4',
    duration: 45,
    questionCount: 25,
    questions: [
      {
        id: 'q1',
        testId: '2',
        question: '2x + 5 = 15 olduğunda, x-in dəyəri nədir?',
        options: ['3', '5', '7', '10'],
        correctAnswer: 1,
        order: 1
      },
      {
        id: 'q2',
        testId: '2',
        question: 'Bir düzbucaqlının sahəsi 48-dir. Eni 6-dırsa, uzunluğu nədir?',
        options: ['6', '7', '8', '9'],
        correctAnswer: 2,
        order: 2
      },
      {
        id: 'q3',
        testId: '2',
        question: '3² + 4² = ?',
        options: ['16', '25', '36', '49'],
        correctAnswer: 1,
        order: 3
      }
    ],
    isActive: true,
    createdAt: new Date('2024-02-15')
  },
  {
    id: '3',
    title: 'Rus Dili - Əsaslar',
    courseId: '4',
    courseName: 'Rus Dili - Orta Səviyyə',
    teacherId: '2',
    duration: 25,
    questionCount: 15,
    questions: [
      {
        id: 'q1',
        testId: '3',
        question: '"Здравствуйте" sözünün mənası nədir?',
        options: ['Salam', 'Sağ olun', 'Gecən xeyir', 'Xoş gəlmisiniz'],
        correctAnswer: 0,
        order: 1
      },
      {
        id: 'q2',
        testId: '3',
        question: '"Спасибо" sözünün mənası nədir?',
        options: ['Zəhmət olmasa', 'Sağ olun', 'Bağışlayın', 'Görüşənədək'],
        correctAnswer: 1,
        order: 2
      }
    ],
    isActive: true,
    createdAt: new Date('2024-03-01')
  }
];

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Aysel Məmmədova',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    quote: 'Sizin Akademiyanız mənə ingilis dilini öyrənməkdə çox kömək etdi. Müəllimlər çox peşəkardır və dərslər çox maraqlı keçir!',
    role: 'Tələbə'
  },
  {
    id: '2',
    name: 'Orxan Əliyev',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    quote: 'SAT hazırlığımı Sizin Akademiyanızda etdim və 1500+ bal topladım. Elçin müəllimə təşəkkür edirəm!',
    role: 'Tələbə'
  },
  {
    id: '3',
    name: 'Günay Hüseynova',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop',
    quote: 'Rus dilini sıfırdan öyrəndim və indi sərbəst danışa bilirəm. Kamran müəllim çox səbirli və peşəkardır.',
    role: 'Tələbə'
  },
  {
    id: '4',
    name: 'Tural İsmayılov',
    avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=200&h=200&fit=crop',
    quote: 'Web proqramlaşdırma kursu sayəsində indi özümün startup-ımı qururam. Rəşad müəllimə minnətdaram!',
    role: 'Tələbə'
  }
];

export const currentUser: User = {
  id: 'u1',
  name: 'Test',
  surname: 'User',
  email: 'test@example.com',
  phone: '+994 50 123 45 67',
  role: 'student',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  createdAt: new Date('2024-01-01')
};

export const testResults: TestResult[] = [
  {
    id: 'tr1',
    testId: 'test-1',
    studentId: 's1',
    studentName: 'Aysel Məmmədova',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    score: 90,
    correctAnswers: 18,
    wrongAnswers: 2,
    totalQuestions: 20,
    answers: {
      '1': 0, // correct
      '2': 1, // correct
    },
    completedAt: new Date('2024-03-20T14:30:00')
  },
  {
    id: 'tr2',
    testId: 'test-1',
    studentId: 's2',
    studentName: 'Orxan Əliyev',
    studentAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    score: 75,
    correctAnswers: 1,
    wrongAnswers: 1,
    totalQuestions: 2,
    answers: {
      '1': 0,
      '2': 3, // wrong
    },
    completedAt: new Date('2024-03-21T10:15:00')
  },
  {
    id: 'tr3',
    testId: 'test-1',
    studentId: 's3',
    studentName: 'Kamran Atayev',
    studentAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop',
    score: 100,
    correctAnswers: 2,
    wrongAnswers: 0,
    totalQuestions: 2,
    answers: {
      '1': 0, '2': 1
    },
    completedAt: new Date('2024-03-22T09:00:00')
  },
  {
    id: 'tr-all-1',
    testId: 'asas',
    studentId: 's1',
    studentName: 'Aysel Məmmədova',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    score: 100,
    correctAnswers: 2,
    wrongAnswers: 0,
    totalQuestions: 2,
    answers: { '1': 0, '2': 0 },
    completedAt: new Date('2024-03-22T12:40:00')
  },
  {
    id: 'tr-all-2',
    testId: 'asas',
    studentId: 's2',
    studentName: 'Orxan Əliyev',
    studentAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    score: 50,
    correctAnswers: 1,
    wrongAnswers: 1,
    totalQuestions: 2,
    answers: { '1': 0, '2': 1 },
    completedAt: new Date('2024-03-22T12:45:00')
  },
  {
    id: 'tr-all-3',
    testId: 'test-1',
    studentId: 's1',
    studentName: 'Aysel Məmmədova',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    score: 100,
    correctAnswers: 2,
    wrongAnswers: 0,
    totalQuestions: 2,
    answers: { '1': 0, '2': 0 },
    completedAt: new Date('2024-03-22T12:40:00')
  },
  {
    id: 'tr4',
    testId: '2',
    studentId: 's4',
    studentName: 'Nigar Məmmədova',
    studentAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    score: 80,
    correctAnswers: 4,
    wrongAnswers: 1,
    totalQuestions: 5,
    answers: {
      'q1': 1, 'q2': 2, 'q3': 1, 'q4': 0, 'q5': 2
    },
    completedAt: new Date('2024-03-22T11:20:00')
  },
  {
    id: 'tr5',
    testId: 'ielts-test-1',
    studentId: 's5',
    studentName: 'Aysel Məmmədova',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    score: 100,
    correctAnswers: 2,
    wrongAnswers: 0,
    totalQuestions: 2,
    answers: { '1': 2, '2': 1 },
    completedAt: new Date('2024-03-22T12:00:00')
  },
  {
    id: 'tr6',
    testId: 'sat-math-1',
    studentId: 's6',
    studentName: 'Orxan Əliyev',
    studentAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    score: 50,
    correctAnswers: 1,
    wrongAnswers: 1,
    totalQuestions: 2,
    answers: { '1': 2, '2': 2 },
    completedAt: new Date('2024-03-22T12:15:00')
  },
  {
    id: 'tr7',
    testId: 'ielts-test-2',
    studentId: 's2',
    studentName: 'Orxan Əliyev',
    studentAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    score: 100,
    correctAnswers: 2,
    wrongAnswers: 0,
    totalQuestions: 2,
    answers: { '1': 1, '2': 1 },
    completedAt: new Date('2024-03-22T12:30:00')
  },
  {
    id: 'tr8',
    testId: 'ielts-test-2',
    studentId: 's3',
    studentName: 'Kamran Atayev',
    studentAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop',
    score: 50,
    correctAnswers: 1,
    wrongAnswers: 1,
    totalQuestions: 2,
    answers: { '1': 0, '2': 3 },
    completedAt: new Date('2024-03-22T12:35:00')
  },
  {
    id: 'tr9',
    testId: 'asas',
    studentId: 's5',
    studentName: 'Aysel Məmmədova',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    score: 100,
    correctAnswers: 2,
    wrongAnswers: 0,
    totalQuestions: 2,
    answers: { '1': 0, '2': 0 },
    completedAt: new Date('2024-03-22T12:40:00')
  },
  {
    id: 'tr10',
    testId: 'asas',
    studentId: 's6',
    studentName: 'Orxan Əliyev',
    studentAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 2,
    totalQuestions: 2,
    answers: { '1': 1, '2': 1 },
    completedAt: new Date('2024-03-22T12:45:00')
  }
];

export const stats = {
  experience: 15,
  students: 5000,
  teachers: 50,
  courses: 100
};
