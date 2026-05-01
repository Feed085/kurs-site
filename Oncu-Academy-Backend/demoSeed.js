const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('./models/Category');
const Course = require('./models/Course');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Test = require('./models/Test');
const TestResult = require('./models/TestResult');

const DEMO_COURSE_PREFIX = 'Numune Kurs:';
const DEMO_TEST_PREFIX = 'Numune Test:';
const DEMO_DRAFT_PREFIX = 'Numune Qaralama:';
const DEMO_EXAM_PREFIX = 'Numune Imtahan:';
const DEMO_TEACHER_PREFIX = 'demo.teacher';
const DEMO_STUDENT_PREFIX = 'demo.student';
const DEMO_PASSWORD = 'Demo123!';
const LEGACY_COURSE_PREFIXES = ['Demo:'];
const LEGACY_TEST_PREFIXES = ['Demo Test:', 'Demo Draft:', 'Demo Exam:'];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildStartsWithRegex = (prefixes) => new RegExp(`^(?:${prefixes.map(escapeRegex).join('|')})`);

const IMAGE_FALLBACKS = [
  'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
];

const AVATAR_FALLBACKS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
];

const VIDEO_LIBRARY = [
  { title: 'Tanisliq', duration: '04:12', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
  { title: 'Giris dersi', duration: '08:34', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { title: 'Movzunun izahi', duration: '12:20', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { title: 'Praktik numune', duration: '10:18', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' },
  { title: 'Praktika sessiyasi', duration: '09:47', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
  { title: 'Qisa yekun', duration: '06:52', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4' },
];

const categoriesSeed = [
  {
    slug: 'dil-kurslari',
    name: 'Dil Kurslari',
    description: 'Ingilizce, rusca ve diger dil programlari',
    color: '#D4AF37',
    icon: 'Languages',
    order: 1,
  },
  {
    slug: 'imtahan-hazirligi',
    name: 'Imtahan Hazirligi',
    description: 'SAT, IELTS ve diger beynelxalq imtahanlara hazirliq',
    color: '#0F766E',
    icon: 'NotebookPen',
    order: 2,
  },
  {
    slug: 'texnologiya',
    name: 'Texnologiya',
    description: 'Proqramlasdirma, dizayn ve digital bacariqlar',
    color: '#2563EB',
    icon: 'Laptop',
    order: 3,
  },
  {
    slug: 'mekteb-desteyi',
    name: 'Mekteb Desteyi',
    description: 'Mekteb fennleri uzre sistemli destek proqramlari',
    color: '#9333EA',
    icon: 'GraduationCap',
    order: 4,
  },
  {
    slug: 'yaradiciliq',
    name: 'Yaradiciliq',
    description: 'Danisiq, tedqdimat ve yaradiciliq kurslari',
    color: '#EA580C',
    icon: 'Sparkles',
    order: 5,
  },
];

const teacherSeed = [
  {
    key: 'leyla',
    name: 'Leyla',
    surname: 'Ahmadova',
    email: 'demo.teacher.leyla@sizinakademiyaniz.com',
    phoneNumber: '+994501000101',
    categories: ['dil-kurslari', 'imtahan-hazirligi'],
    education: 'Baki Dovlet Universiteti, filologiya',
    experience: 9,
    specializedAreas: ['IELTS', 'Akademik ingilis dili', 'Danisiq klublari'],
    location: 'Baki',
    socialNetworks: {
      instagram: 'https://instagram.com',
      linkedin: 'https://linkedin.com',
    },
  },
  {
    key: 'kamran',
    name: 'Kamran',
    surname: 'Aliyev',
    email: 'demo.teacher.kamran@sizinakademiyaniz.com',
    phoneNumber: '+994501000102',
    categories: ['texnologiya'],
    education: 'ADA Universiteti, Komputer elmleri',
    experience: 7,
    specializedAreas: ['Frontend', 'JavaScript', 'Mehsul dusuncesi'],
    location: 'Baki',
    socialNetworks: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
  },
  {
    key: 'aysel',
    name: 'Aysel',
    surname: 'Mammadova',
    email: 'demo.teacher.aysel@sizinakademiyaniz.com',
    phoneNumber: '+994501000103',
    categories: ['mekteb-desteyi'],
    education: 'Baki Muhendislik Universiteti, Riyaziyyat tedrisi',
    experience: 11,
    specializedAreas: ['Riyaziyyat', 'Mektebe hazirliq', 'Mentorluq'],
    location: 'Ganca',
    socialNetworks: {
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com',
    },
  },
  {
    key: 'nigar',
    name: 'Nigar',
    surname: 'Karimova',
    email: 'demo.teacher.nigar@sizinakademiyaniz.com',
    phoneNumber: '+994501000105',
    categories: ['dil-kurslari', 'yaradiciliq'],
    education: 'Khazar Universiteti, tercume uzre tedqiqatlar',
    experience: 6,
    specializedAreas: ['Rus dili', 'Danisiq praktikasi', 'Tegdimat dizayni'],
    location: 'Baki',
    socialNetworks: {
      instagram: 'https://instagram.com',
      linkedin: 'https://linkedin.com',
    },
  },
  {
    key: 'orxan',
    name: 'Orxan',
    surname: 'Huseynov',
    email: 'demo.teacher.orxan@sizinakademiyaniz.com',
    phoneNumber: '+994501000104',
    categories: ['imtahan-hazirligi', 'yaradiciliq'],
    education: 'UNEC, Biznes ve kommunikasiya',
    experience: 8,
    specializedAreas: ['SAT verbal', 'Natiqlik', 'Esse yazisi'],
    location: 'Sumqayit',
    socialNetworks: {
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com',
    },
  },
];

const courseSeed = [
  {
    key: 'ielts-mastery',
    title: 'Numune Kurs: IELTS Ustalik Sprinti',
    category: 'imtahan-hazirligi',
    teacherKey: 'leyla',
    price: 180,
    imageIndex: 0,
    description: 'Danisiq, yazi ve tam sınaq imtahanlari ile IELTS neticesini qaldiran intensiv proqram.',
    learningPoints: ['Band descriptor analizi', 'Heftelik sınaq yazi praktikalari', 'Danisiq ucun guven plani', 'Real imtahan vaxt strategiyasi'],
    includes: ['12 heftelik plan', 'PDF notlar', 'Heftelik mentor reyleri', 'Bitirme sertifikati'],
    hasCertificate: true,
    moduleTitles: ['Baslangic', 'Yazi fokusu', 'Danisiq laboratoriyasi', 'Sinaq imtahanlari'],
    rating: 4.9,
  },
  {
    key: 'general-english',
    title: 'Numune Kurs: Umumi Ingilis Dili Dinamikasi',
    category: 'dil-kurslari',
    teacherKey: 'leyla',
    price: 120,
    imageIndex: 1,
    description: 'Baslangic ve orta seviyeli telebeler ucun real danisiq esasli ingilis dili proqrami.',
    learningPoints: ['Gunluk danisiq rutini', 'Kontekst icinde qrammatika', 'Dinleme uzre qeyd aparma', 'Soz ehtiyatinin yadda saxlanmasi'],
    includes: ['Canli dersler', 'Qrup praktikasi', 'Heftelik tapsiriqlar', 'Mobil giris'],
    hasCertificate: true,
    moduleTitles: ['Temel bolme', 'Gunluk danisiq', 'Qrammatika klinikasi', 'Dinleme calismasi'],
    rating: 4.8,
  },
  {
    key: 'frontend-pro',
    title: 'Numune Kurs: Frontend Developer Proqrami',
    category: 'texnologiya',
    teacherKey: 'kamran',
    price: 240,
    imageIndex: 2,
    description: 'HTML, CSS, JavaScript ve React ile portfolio seviyyesinde frontend kursu.',
    learningPoints: ['Responsive layout sistemleri', 'Muasir JavaScript dusuncesi', 'Komponent arxitekturasi', 'API inteqrasiyasi'],
    includes: ['Menbe fayllari', 'Portfolio tapsiriqlari', 'Kod baxis sessiyalari', 'Karyera sual-cavab sessiyasi'],
    hasCertificate: true,
    moduleTitles: ['HTML CSS temeli', 'JavaScript esaslari', 'React qurulusu', 'Layihenin teqdimati'],
    rating: 4.95,
  },
  {
    key: 'uiux-essentials',
    title: 'Numune Kurs: UI UX Esaslari',
    category: 'texnologiya',
    teacherKey: 'kamran',
    price: 160,
    imageIndex: 3,
    description: 'Wireframe, interfeys axini ve praktik mehsul tapsiriqlari ile UI UX girisi.',
    learningPoints: ['Istifadeci axinin xeritelesdirilmesi', 'Wireframe sureti', 'Vizual iyerarxiya', 'Qisa metn esaslari'],
    includes: ['Sablon fayllari', 'Figma tapsiriqlari', 'Tenqidi baxis sessiyalari', 'Sertifikat'],
    hasCertificate: true,
    moduleTitles: ['Tedqiqat esaslari', 'Wireframe hazirlanmasi', 'Vizual sistemler', 'Portfolio numunesi'],
    rating: 4.7,
  },
  {
    key: 'math-boost',
    title: 'Numune Kurs: Riyaziyyat Guclendirme 7-9',
    category: 'mekteb-desteyi',
    teacherKey: 'aysel',
    price: 110,
    imageIndex: 4,
    description: 'Mektebliler ucun riyaziyyat tekrar, izah ve test praktikasini birlesdiren proqram.',
    learningPoints: ['Movzu tekrar bloklari', 'Qisa formula vereqleri', 'Test hell ritmi', 'Zeif sahelerin duzelisilmesi'],
    includes: ['Heftelik test', 'Valideyn hesabatlari', 'Canli sual-cavab', 'Lesson recordings'],
    hasCertificate: false,
    moduleTitles: ['Kesrler ve faizler', 'Tenlikler', 'Geometri', 'Imtahan praktikasi'],
    rating: 4.85,
  },
  {
    key: 'school-readiness',
    title: 'Numune Kurs: Mektebe Hazirliq Genis Paketi',
    category: 'mekteb-desteyi',
    teacherKey: 'aysel',
    price: 95,
    imageIndex: 5,
    description: 'Oxu, yazu, sayma ve diqqet bacariqlarini guclendiren mektebe hazirliq proqrami.',
    learningPoints: ['Herflerin taninmasi', 'Diqqet calismalari', 'Reqemlerle rahatliq', 'Valideyn ucun aktivlik planlari'],
    includes: ['Cap oluna bilen tapsiriqlar', 'Heftelik mini oyunlar', 'Irelileyis qeydlari', 'Valideyn istiqametlendirmesi'],
    hasCertificate: false,
    moduleTitles: ['Oxuya giris', 'Sayilar alemi', 'Diqqet oyunlari', 'Mini qiymetlendirme'],
    rating: 4.75,
  },
  {
    key: 'sat-verbal',
    title: 'Numune Kurs: SAT Verbal Suretlendirme',
    category: 'imtahan-hazirligi',
    teacherKey: 'orxan',
    price: 210,
    imageIndex: 0,
    description: 'Oxu, yazi ve esse mentiqini guclendiren SAT verbal hazirliq proqrami.',
    learningPoints: ['Subuta esaslanan oxu', 'Qrammatika teleleri', 'Passage vaxtlandirmasi', 'Bal artim plani'],
    includes: ['Sinaq SAT setleri', 'Heftelik analitika', 'Esse klinikasi', 'Ferdi rey'],
    hasCertificate: true,
    moduleTitles: ['Oxu sistemleri', 'Qrammatika calismalari', 'Passage strategiyasi', 'Tam sınaq baxisi'],
    rating: 4.88,
  },
  {
    key: 'public-speaking',
    title: 'Numune Kurs: Natiqlik Laboratoriyasi',
    category: 'yaradiciliq',
    teacherKey: 'orxan',
    price: 130,
    imageIndex: 1,
    description: 'Sahne cixisi, tesirli nitq ve tedqdimat strukturu uzre praktik proqram.',
    learningPoints: ['Sehne guveni', 'Hekaye qurulusu', 'Ses idaresi', 'Tegdimata giris usullari'],
    includes: ['Nitq tapsiriqlari', 'Rey daireleri', 'Video baxisi', 'Sertifikat'],
    hasCertificate: true,
    moduleTitles: ['Dusunce tazelemesi', 'Nitq strukturu', 'Teqdimat praktikasi', 'Yekun cixis'],
    rating: 4.82,
  },
  {
    key: 'russian-speaking',
    title: 'Numune Kurs: Rus Dili Danisiq Praktikasi',
    category: 'dil-kurslari',
    teacherKey: 'nigar',
    price: 115,
    imageIndex: 2,
    description: 'Danisiq esasli rus dili proqrami; gunluk ifadeler ve praktik dialoqlar uzerinden gedir.',
    learningPoints: ['Gunluk dialoq numuneleri', 'Dinleme tekrarlari', 'Danisiq ucun esas qrammatika', 'Danisiqda guven'],
    includes: ['Ses praktikasi', 'Is defteri', 'Qrup muzakiresi', 'Sertifikat'],
    hasCertificate: true,
    moduleTitles: ['Elifba tekrari', 'Gunluk ifadeler', 'Dialoq praktikasi', 'Danisiq cagirisi'],
    rating: 4.73,
  },
  {
    key: 'presentation-design',
    title: 'Numune Kurs: Tegdimat Dizayni Studiyasi',
    category: 'yaradiciliq',
    teacherKey: 'nigar',
    price: 145,
    imageIndex: 3,
    description: 'Slide dizayn, mesaj axini ve gorsel struktur uzre qisa amma tesirli proqram.',
    learningPoints: ['Slayd iyerarxiyasi', 'Hekaye xettinin qurulmasi', 'Vizual ardicilliq', 'Cixisa hazir slayd desteleri'],
    includes: ['Sablon desti', 'Dizayn tenqidi', 'Slayd kitabxanasi', 'Sertifikat'],
    hasCertificate: true,
    moduleTitles: ['Mesaj once', 'Slayd sistemleri', 'Vizual cilalanma', 'Yekun slayd destesi'],
    rating: 4.78,
  },
  {
    key: 'data-literacy',
    title: 'Numune Kurs: Data Savadliginin Esaslari',
    category: 'texnologiya',
    teacherKey: 'kamran',
    price: 175,
    imageIndex: 4,
    description: 'Excel, esas analitika ve data hekayeciliyi ile biznes ucun data savadligi kursu.',
    learningPoints: ['Cedvellerle serbest is', 'Esas dashboard qurulusu', 'Insight qurulusu', 'Qerar destek dusuncesi'],
    includes: ['Cedvel numuneleri', 'Dashboard tapsiriqlari', 'Praktika melumat desteleri', 'Sertifikat'],
    hasCertificate: true,
    moduleTitles: ['Cedvel temeli', 'Melumatin temizlenmesi', 'Dashboardlar', 'Data hekayeleri'],
    rating: 4.69,
  },
  {
    key: 'essay-writing',
    title: 'Numune Kurs: Esse Yazisi Atolyesi',
    category: 'yaradiciliq',
    teacherKey: 'orxan',
    price: 135,
    imageIndex: 5,
    description: 'Akademik ve muraciet esse yazisi ucun struktur, ton ve redakte praktikalari.',
    learningPoints: ['Ideyanin cercevelenmesi', 'Abzas ritmi', 'Redakte yoxlama siyahisi', 'Vaxt altinda aydinliq'],
    includes: ['Yazi movzulari', 'Muellim reyleri', 'Yeniden baxis sessiyalari', 'Sertifikat'],
    hasCertificate: true,
    moduleTitles: ['Oz sesini tapmaq', 'Struktur', 'Redakte', 'Tehvilin cilalanmasi'],
    rating: 4.84,
  },
];

const studentSeed = [
  { key: 'amin', name: 'Amin', surname: 'Safarli', email: 'demo.student.amin@sizinakademiyaniz.com', phoneNumber: '+994551000201', educationLevel: 'Bakalavr' },
  { key: 'fidan', name: 'Fidan', surname: 'Hasanova', email: 'demo.student.fidan@sizinakademiyaniz.com', phoneNumber: '+994551000202', educationLevel: '11-ci sinif' },
  { key: 'samir', name: 'Samir', surname: 'Quliyev', email: 'demo.student.samir@sizinakademiyaniz.com', phoneNumber: '+994551000203', educationLevel: 'Magistr' },
  { key: 'nuray', name: 'Nuray', surname: 'Ismayilova', email: 'demo.student.nuray@sizinakademiyaniz.com', phoneNumber: '+994551000204', educationLevel: '10-cu sinif' },
  { key: 'elvin', name: 'Elvin', surname: 'Mammadli', email: 'demo.student.elvin@sizinakademiyaniz.com', phoneNumber: '+994551000205', educationLevel: 'Bakalavr' },
  { key: 'aydan', name: 'Aydan', surname: 'Karimli', email: 'demo.student.aydan@sizinakademiyaniz.com', phoneNumber: '+994551000206', educationLevel: '9-cu sinif' },
  { key: 'murad', name: 'Murad', surname: 'Hasanov', email: 'demo.student.murad@sizinakademiyaniz.com', phoneNumber: '+994551000207', educationLevel: '12-ci sinif' },
  { key: 'selin', name: 'Selin', surname: 'Abbasova', email: 'demo.student.selin@sizinakademiyaniz.com', phoneNumber: '+994551000208', educationLevel: 'Bakalavr' },
  { key: 'ramin', name: 'Ramin', surname: 'Jafarov', email: 'demo.student.ramin@sizinakademiyaniz.com', phoneNumber: '+994551000209', educationLevel: '11-ci sinif' },
  { key: 'zahra', name: 'Zahra', surname: 'Rahimova', email: 'demo.student.zahra@sizinakademiyaniz.com', phoneNumber: '+994551000210', educationLevel: 'Magistr' },
];

const reviewComments = [
  'Program cox selis gedir, her hefte ozumde ferqi hiss etdim.',
  'Videolar qisa ve konkret oldugu ucun geri donub tekrar baxmaq rahatdir.',
  'Testler real ders ritmine uyur, bosluq qalmir.',
  'Muellim feedback-i cox deqiqdir, praktika hissesi xususi gucludur.',
  'Dashboard-da irelileyis goruntusu motivasiya yaradir.',
];

const numericQuestionTemplate = (courseTitle, moduleTitle) => ({
  questionType: 'text',
  content: `${courseTitle} kursunda "${moduleTitle}" modulu 3 heftede bitirilmelidirse, her hefte nece blok ders lazimdir?`,
  answerType: 'open_ended',
  openEndedAnswerType: 'number',
  options: [],
  correctAnswer: '4',
});

const buildMultipleChoiceQuestion = (courseTitle, moduleTitle, questionIndex) => ({
  questionType: 'text',
  content: `${courseTitle} - ${moduleTitle} ucun yoxlama suali ${questionIndex + 1}`,
  answerType: 'multiple_choice',
  options: [
    'Movzunu izah etmek ve numune gostermek',
    'Yalniz termini ezberletmek',
    'Video olmadan birbasa imtahan etmek',
    'Praktikani butovlukde legv etmek',
  ],
  correctAnswer: '0',
});

const buildModules = (course, courseIndex) => course.moduleTitles.map((moduleTitle, moduleIndex) => ({
  title: moduleTitle,
  videos: Array.from({ length: 4 }, (_, videoIndex) => {
    const libraryItem = VIDEO_LIBRARY[(courseIndex * 4 + moduleIndex + videoIndex) % VIDEO_LIBRARY.length];

    return {
      title: `${moduleTitle} - ${libraryItem.title}`,
      description: `${course.title} kursu ucun ${moduleTitle.toLowerCase()} bolmesinde praktik izah ve tetbiq videosu yer alir.`,
      videoUrl: libraryItem.videoUrl,
      duration: libraryItem.duration,
    };
  }),
}));

const createStudentAvatar = (student, index) => `https://ui-avatars.com/api/?name=${encodeURIComponent(`${student.name} ${student.surname}`)}&background=${['0D8ABC', '9333EA', 'D97706', '2563EB'][index % 4]}&color=ffffff`;

const normalizeScore = (value) => Math.max(0, Math.min(100, value));

const getCompletedLessonIds = (course, ratio) => {
  const lessonIds = (course.modules || []).flatMap((module) => (module.videos || []).map((video) => video._id.toString()));
  const completedCount = Math.max(0, Math.min(lessonIds.length, Math.round(lessonIds.length * ratio)));
  return lessonIds.slice(0, completedCount);
};

const createResultAnswers = (test, correctCountTarget) => {
  const totalQuestions = (test.questions || []).length;
  const boundedCorrectCount = Math.max(0, Math.min(totalQuestions, correctCountTarget));

  return (test.questions || []).map((question, index) => {
    const shouldBeCorrect = index < boundedCorrectCount;
    const answer = shouldBeCorrect
      ? String(question.correctAnswer)
      : (question.answerType === 'multiple_choice' ? '1' : '3');

    return {
      questionId: question._id,
      answer,
      isCorrect: shouldBeCorrect,
      status: 'graded',
    };
  });
};

const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/oncu-academy';
  await mongoose.connect(mongoUri);
};

const cleanupExistingDemoData = async () => {
  const demoStudentRegex = new RegExp(`^${DEMO_STUDENT_PREFIX.replace('.', '\\.')}`);
  const demoTeacherRegex = new RegExp(`^${DEMO_TEACHER_PREFIX.replace('.', '\\.')}`);
  const demoCourseRegex = buildStartsWithRegex([DEMO_COURSE_PREFIX, ...LEGACY_COURSE_PREFIXES]);
  const demoTestRegex = buildStartsWithRegex([DEMO_TEST_PREFIX, DEMO_DRAFT_PREFIX, DEMO_EXAM_PREFIX, ...LEGACY_TEST_PREFIXES]);

  const [demoStudents, demoTests] = await Promise.all([
    Student.find({ email: demoStudentRegex }).select('_id'),
    Test.find({ title: demoTestRegex }).select('_id'),
  ]);

  const demoStudentIds = demoStudents.map((item) => item._id);
  const demoTestIds = demoTests.map((item) => item._id);

  await Promise.all([
    TestResult.deleteMany({
      $or: [
        demoStudentIds.length > 0 ? { student: { $in: demoStudentIds } } : null,
        demoTestIds.length > 0 ? { test: { $in: demoTestIds } } : null,
      ].filter(Boolean),
    }),
    Test.deleteMany({ title: demoTestRegex }),
    Course.deleteMany({ title: demoCourseRegex }),
    Student.deleteMany({ email: demoStudentRegex }),
    Teacher.deleteMany({ email: demoTeacherRegex }),
  ]);
};

const seedCategories = async () => {
  const categoryMap = new Map();

  for (const category of categoriesSeed) {
    const doc = await Category.findOneAndUpdate(
      { slug: category.slug },
      { $set: category },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    categoryMap.set(category.slug, doc);
  }

  return categoryMap;
};

const seedTeachers = async () => {
  const teacherMap = new Map();

  for (let index = 0; index < teacherSeed.length; index += 1) {
    const teacherData = teacherSeed[index];
    const teacher = await Teacher.create({
      ...teacherData,
      avatar: AVATAR_FALLBACKS[index % AVATAR_FALLBACKS.length],
      password: DEMO_PASSWORD,
      initialPassword: DEMO_PASSWORD,
      role: 'teacher',
      rating: 0,
      reviews: [],
      courses: [],
    });

    teacherMap.set(teacherData.key, teacher);
  }

  return teacherMap;
};

const seedCourses = async (teacherMap) => {
  const courseMap = new Map();

  for (let index = 0; index < courseSeed.length; index += 1) {
    const courseData = courseSeed[index];
    const teacher = teacherMap.get(courseData.teacherKey);

    const course = await Course.create({
      title: courseData.title,
      category: courseData.category,
      instructor: teacher._id,
      image: IMAGE_FALLBACKS[courseData.imageIndex % IMAGE_FALLBACKS.length],
      description: courseData.description,
      price: courseData.price,
      hasCertificate: courseData.hasCertificate,
      rating: courseData.rating,
      reviews: [],
      learningPoints: courseData.learningPoints,
      includes: courseData.includes,
      tests: [],
      modules: buildModules(courseData, index),
      isActive: true,
      publishDate: new Date(Date.now() - (index + 3) * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - (index + 10) * 24 * 60 * 60 * 1000),
    });

    teacher.courses = teacher.courses || [];
    teacher.courses.push(course._id);
    courseMap.set(courseData.key, course);
  }

  await Promise.all([...teacherMap.values()].map((teacher) => teacher.save()));
  return courseMap;
};

const seedStudents = async () => {
  const studentMap = new Map();

  for (let index = 0; index < studentSeed.length; index += 1) {
    const studentData = studentSeed[index];
    const student = await Student.create({
      ...studentData,
      password: DEMO_PASSWORD,
      avatar: createStudentAvatar(studentData, index),
      activeCourses: [],
      courseProgress: [],
      assignedTests: [],
      completedTests: [],
      testResults: [],
      certificates: [],
    });

    studentMap.set(studentData.key, student);
  }

  return studentMap;
};

const seedCourseAndTeacherReviews = async (courseMap, teacherMap, studentMap) => {
  const students = [...studentMap.values()];
  const teacherRatings = new Map();

  for (const [courseKey, course] of courseMap.entries()) {
    const courseTemplate = courseSeed.find((item) => item.key === courseKey);
    const teacher = teacherMap.get(courseTemplate.teacherKey);
    const selectedStudents = students.slice(0, 3);

    course.reviews = selectedStudents.map((student, index) => ({
      user: student._id,
      name: `${student.name} ${student.surname}`,
      rating: 5 - (index % 2),
      comment: reviewComments[(index + course.reviews.length) % reviewComments.length],
      createdAt: new Date(Date.now() - (index + 2) * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - (index + 2) * 24 * 60 * 60 * 1000),
    }));
    course.rating = Number((course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length).toFixed(2));
    await course.save();

    const teacherReviewList = teacherRatings.get(teacher._id.toString()) || [];
    teacherReviewList.push(...selectedStudents.slice(0, 2).map((student, index) => ({
      user: student._id,
      name: `${student.name} ${student.surname}`,
      rating: 5 - (index % 2),
      comment: reviewComments[(index + 1) % reviewComments.length],
      createdAt: new Date(Date.now() - (index + 3) * 24 * 60 * 60 * 1000),
    })));
    teacherRatings.set(teacher._id.toString(), teacherReviewList);
  }

  for (const teacher of teacherMap.values()) {
    const reviews = teacherRatings.get(teacher._id.toString()) || [];
    teacher.reviews = reviews.slice(0, 4);
    teacher.rating = reviews.length > 0
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(2))
      : 0;
    await teacher.save();
  }
};

const seedTests = async (courseMap, teacherMap) => {
  const courseTests = [];

  for (const [courseKey, course] of courseMap.entries()) {
    const template = courseSeed.find((item) => item.key === courseKey);
    const teacher = teacherMap.get(template.teacherKey);
    const questions = [
      buildMultipleChoiceQuestion(course.title, course.modules[0].title, 0),
      buildMultipleChoiceQuestion(course.title, course.modules[1].title, 1),
      buildMultipleChoiceQuestion(course.title, course.modules[2].title, 2),
      buildMultipleChoiceQuestion(course.title, course.modules[3].title, 3),
      buildMultipleChoiceQuestion(course.title, course.modules[0].title, 4),
      buildMultipleChoiceQuestion(course.title, course.modules[2].title, 5),
      numericQuestionTemplate(course.title, course.modules[1].title),
      numericQuestionTemplate(course.title, course.modules[3].title),
    ];

    const test = await Test.create({
      title: `${DEMO_TEST_PREFIX} ${course.title.replace(DEMO_COURSE_PREFIX, '').trim()}`,
      type: 'course',
      course: course._id,
      instructor: teacher._id,
      duration: 35,
      allowRetake: true,
      workflowStatus: 'used',
      isStudentVisible: true,
      startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      activatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      questions,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    course.tests = [test._id];
    await course.save();
    courseTests.push(test);
  }

  const draftTeacher = teacherMap.get('kamran');
  const secondDraftTeacher = teacherMap.get('nigar');

  const draftTests = await Test.create([
    {
      title: `${DEMO_DRAFT_PREFIX} Frontend qiymetlendirme toplusu`,
      type: 'teacher_draft',
      instructor: draftTeacher._id,
      workflowStatus: 'submitted_to_admin',
      submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      allowRetake: false,
      isStudentVisible: false,
      questions: [
        buildMultipleChoiceQuestion('Frontend qiymetlendirmesi', 'Komponent sistemleri', 0),
        buildMultipleChoiceQuestion('Frontend qiymetlendirmesi', 'Veziyyet axini', 1),
      ],
    },
    {
      title: `${DEMO_DRAFT_PREFIX} Tegdimat atolyesi imtahani`,
      type: 'teacher_draft',
      instructor: secondDraftTeacher._id,
      workflowStatus: 'rejected',
      reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      adminNotes: 'Sual ifadeleri yayimdan once daha daqiqlestirilmelidir.',
      allowRetake: false,
      isStudentVisible: false,
      questions: [
        buildMultipleChoiceQuestion('Tegdimat atolyesi', 'Hekayenin cercevelenmesi', 0),
      ],
    },
  ]);

  const adminExam = await Test.create({
    title: `${DEMO_EXAM_PREFIX} Teqaud yerlesdirme imtahani`,
    type: 'admin_exam',
    instructor: teacherMap.get('orxan')._id,
    duration: 50,
    allowRetake: false,
    workflowStatus: 'approved',
    isStudentVisible: true,
    startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    activatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    questions: [
      buildMultipleChoiceQuestion('Teqaud yerlesdirilmesi', 'Mentiq', 0),
      buildMultipleChoiceQuestion('Teqaud yerlesdirilmesi', 'Dil', 1),
      numericQuestionTemplate('Teqaud yerlesdirilmesi', 'Vaxt planlamasi'),
      buildMultipleChoiceQuestion('Teqaud yerlesdirilmesi', 'Analiz', 2),
    ],
  });

  return {
    courseTests,
    draftTests,
    adminExam,
  };
};

const seedStudentUsage = async (courseMap, studentMap, testBundle) => {
  const courses = [...courseMap.values()];
  const courseTests = testBundle.courseTests;
  const students = [...studentMap.values()];
  const adminAssignedStudents = students.slice(0, 4);

  for (let index = 0; index < students.length; index += 1) {
    const student = students[index];
    const enrolledCourses = courses.filter((_, courseIndex) => (courseIndex + index) % 2 === 0).slice(0, 4);
    student.activeCourses = enrolledCourses.map((course) => course._id);
    student.courseProgress = enrolledCourses.map((course, progressIndex) => ({
      course: course._id,
      completedLessonIds: getCompletedLessonIds(course, 0.2 + (progressIndex * 0.2)),
      lastAccessed: new Date(Date.now() - (progressIndex + 1) * 6 * 60 * 60 * 1000),
    }));
    student.assignedTests = [];
    student.completedTests = [];
    student.testResults = [];
    student.certificates = [];

    if (adminAssignedStudents.some((item) => item._id.toString() === student._id.toString())) {
      student.assignedTests.push(testBundle.adminExam._id);
    }

    await student.save();
  }

  const resultsToCreate = [];

  students.slice(0, 6).forEach((student, studentIndex) => {
    courseTests.slice(studentIndex % 3, (studentIndex % 3) + 3).forEach((test, testIndex) => {
      const totalQuestions = test.questions.length;
      const correctCount = Math.max(4, totalQuestions - ((studentIndex + testIndex) % 3));
      const scorePercentage = normalizeScore((correctCount / totalQuestions) * 100);

      resultsToCreate.push({
        test: test._id,
        student: student._id,
        answers: createResultAnswers(test, correctCount),
        status: 'completed',
        scorePercentage,
        hasPendingAnswers: false,
        completedAt: new Date(Date.now() - (studentIndex + testIndex + 1) * 24 * 60 * 60 * 1000),
      });
    });
  });

  adminAssignedStudents.slice(0, 2).forEach((student, index) => {
    const totalQuestions = testBundle.adminExam.questions.length;
    const correctCount = totalQuestions - index - 1;
    resultsToCreate.push({
      test: testBundle.adminExam._id,
      student: student._id,
      answers: createResultAnswers(testBundle.adminExam, correctCount),
      status: 'completed',
      scorePercentage: normalizeScore((correctCount / totalQuestions) * 100),
      hasPendingAnswers: false,
      completedAt: new Date(Date.now() - (index + 1) * 12 * 60 * 60 * 1000),
    });
  });

  const createdResults = await TestResult.insertMany(resultsToCreate);
  const resultsByStudent = new Map();

  createdResults.forEach((result) => {
    const studentId = result.student.toString();
    const list = resultsByStudent.get(studentId) || [];
    list.push(result);
    resultsByStudent.set(studentId, list);
  });

  for (const student of students) {
    const results = resultsByStudent.get(student._id.toString()) || [];
    student.completedTests = results.map((result) => result.test);
    student.testResults = results.map((result) => ({
      test: result.test,
      scorePercentage: result.scorePercentage,
      completedAt: result.completedAt,
    }));
    student.certificates = results
      .filter((result) => result.scorePercentage >= 50 && !result.hasPendingAnswers)
      .map((result) => ({
        test: result.test,
        issuedAt: result.completedAt,
        scorePercentage: result.scorePercentage,
      }));
    await student.save();
  }
};

const printSummary = async () => {
  const [teacherCount, studentCount, courseCount, testCount, resultCount] = await Promise.all([
    Teacher.countDocuments({ email: new RegExp(`^${DEMO_TEACHER_PREFIX.replace('.', '\\.')}`) }),
    Student.countDocuments({ email: new RegExp(`^${DEMO_STUDENT_PREFIX.replace('.', '\\.')}`) }),
    Course.countDocuments({ title: buildStartsWithRegex([DEMO_COURSE_PREFIX, ...LEGACY_COURSE_PREFIXES]) }),
    Test.countDocuments({ title: buildStartsWithRegex([DEMO_TEST_PREFIX, DEMO_DRAFT_PREFIX, DEMO_EXAM_PREFIX, ...LEGACY_TEST_PREFIXES]) }),
    TestResult.countDocuments(),
  ]);

  console.log('Numune seed tamamlandi.');
  console.log(`- Numune muellim sayi: ${teacherCount}`);
  console.log(`- Numune telebe sayi: ${studentCount}`);
  console.log(`- Numune kurs sayi: ${courseCount}`);
  console.log(`- Numune test sayi: ${testCount}`);
  console.log(`- Umumi test neticesi sayi: ${resultCount}`);
  console.log(`- Numune login sifresi: ${DEMO_PASSWORD}`);
  console.log('- Numune muellim hesabi: demo.teacher.leyla@sizinakademiyaniz.com');
  console.log('- Numune telebe hesabi: demo.student.amin@sizinakademiyaniz.com');
};

const run = async () => {
  try {
    await connectDatabase();
    await cleanupExistingDemoData();

    const categoryMap = await seedCategories();
    const teacherMap = await seedTeachers(categoryMap);
    const courseMap = await seedCourses(teacherMap);
    const studentMap = await seedStudents();

    await seedCourseAndTeacherReviews(courseMap, teacherMap, studentMap);

    const testBundle = await seedTests(courseMap, teacherMap);
    await seedStudentUsage(courseMap, studentMap, testBundle);
    await printSummary();
  } catch (error) {
    console.error('Demo seed xetasi:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();