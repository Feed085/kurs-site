import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, FileText, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

import TeacherAssessmentQuestionBuilder from '@/components/common/TeacherAssessmentQuestionBuilder';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/services/publicApi';
import {
  createAssessmentQuestionId,
  createDefaultAssessmentQuestion,
  formatAssessmentQuestionsForApi,
  type AssessmentQuestion,
  validateAssessmentDuration,
  validateAssessmentQuestions,
} from '@/lib/teacherAssessment';

type TeacherCourse = {
  _id?: string;
  id?: string;
  title?: string;
};

export default function CreateTest() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const durationInputRef = useRef<HTMLInputElement>(null);

  const [teacherCourses, setTeacherCourses] = useState<TeacherCourse[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [testData, setTestData] = useState({
    title: '',
    courseId: '',
    duration: 30,
    allowRetake: false,
  });
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([
    createDefaultAssessmentQuestion('1'),
  ]);

  useEffect(() => {
    const fetchCourses = async () => {
      const token = localStorage.getItem('rim_auth_token');
      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/courses/my-courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.message || 'Kurslar yüklənmədi.');
        }

        setTeacherCourses(payload.data || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Kurslar yüklənmədi.';
        toast.error(message);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const input = durationInputRef.current;
    if (!input) {
      return;
    }

    const handleWheelManual = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY < 0 ? 1 : -1;
      setTestData((currentData) => ({
        ...currentData,
        duration: Math.max(5, Math.min(180, Number(currentData.duration) + delta)),
      }));
    };

    input.addEventListener('wheel', handleWheelManual, { passive: false });
    return () => input.removeEventListener('wheel', handleWheelManual);
  }, []);

  const addQuestion = () => {
    setQuestions((currentQuestions) => [
      ...currentQuestions,
      createDefaultAssessmentQuestion(createAssessmentQuestionId()),
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length === 1) {
      toast.error('Ən azı bir sual olmalıdır.');
      return;
    }

    setQuestions((currentQuestions) => currentQuestions.filter((question) => question.id !== id));
  };

  const updateQuestion = (id: string, field: keyof AssessmentQuestion, value: AssessmentQuestion[keyof AssessmentQuestion]) => {
    setQuestions((currentQuestions) => currentQuestions.map((question) => (
      question.id === id ? { ...question, [field]: value } : question
    )));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions((currentQuestions) => currentQuestions.map((question) => (
      question.id === questionId
        ? {
            ...question,
            options: question.options.map((option, index) => index === optionIndex ? value : option),
          }
        : question
    )));
  };

  const resetForm = () => {
    setIsSaved(false);
    setTestData({ title: '', courseId: '', duration: 30, allowRetake: false });
    setQuestions([createDefaultAssessmentQuestion('1')]);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setTestData((currentData) => ({
      ...currentData,
      [name]: name === 'duration' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const title = testData.title.trim();
    if (!title) {
      toast.error(t('common.error'));
      return;
    }

    if (!testData.courseId) {
      toast.error(t('common.error'));
      return;
    }

    const durationError = validateAssessmentDuration(Number(testData.duration));
    if (durationError) {
      toast.error(durationError);
      return;
    }

    const questionError = validateAssessmentQuestions(questions);
    if (questionError) {
      toast.error(questionError);
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem('rim_auth_token');

    try {
      const formattedQuestions = await formatAssessmentQuestionsForApi(questions, token);
      const response = await fetch(`${API_BASE_URL}/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          course: testData.courseId,
          duration: Number(testData.duration),
          allowRetake: testData.allowRetake,
          questions: formattedQuestions,
        }),
      });
      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Test yaradılmadı.');
      }

      setIsSaved(true);
      toast.success('Test uğurla yaradıldı.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Server xətası baş verdi.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isSaved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)]">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="mb-4 text-2xl font-black text-gray-900">{t('test.create_success_title', { defaultValue: 'Test uğurla yaradıldı!' })}</h1>
          <p className="mb-8 text-gray-600">
            {t('test.create_success_desc', { defaultValue: 'Bu test artıq müəllim testləri siyahısında görünür və kurs daxilində istifadə oluna bilər.' })}
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/teacher/tests')} className="flex-1 rounded-xl">
              {t('test.go_to_tests', { defaultValue: 'Testlərə keç' })}
            </Button>
            <Button onClick={resetForm} className="flex-1 rounded-xl bg-[#D4AF37] hover:bg-[#B88A1B]">
              {t('test.create_new_test', { defaultValue: 'Yeni test yarat' })}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)] pb-24">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 lg:text-3xl">{t('teacher.test.title')}</h1>
            <p className="text-gray-600">{t('test.create_desc', { defaultValue: 'Kursa bağlı test yaradın və sualları birbaşa bu səhifədən qurun.' })}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pb-40">
          <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm lg:p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t('teacher.test.test_title')}</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    name="title"
                    value={testData.title}
                    onChange={handleChange}
                    placeholder="Məs: IELTS Listening Test 1"
                    className="h-12 rounded-xl pl-12"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t('teacher.test.course')}</label>
                <select
                  name="courseId"
                  value={testData.courseId}
                  onChange={handleChange}
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 outline-none focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                >
                  <option value="">{t('test.select_your_course', { defaultValue: 'Öz kursunuzu seçin' })}</option>
                  {teacherCourses.map((course) => (
                    <option key={course._id || course.id} value={course._id || course.id}>
                      {course.title || 'Adsız kurs'}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">{t('test.only_your_courses', { defaultValue: 'Bu siyahıda yalnız sizə aid kurslar göstərilir.' })}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t('teacher.test.duration')}</label>
                <div className="relative max-w-xs">
                  <Clock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    ref={durationInputRef}
                    name="duration"
                    type="number"
                    min={5}
                    max={180}
                    value={testData.duration}
                    onChange={handleChange}
                    className="h-12 rounded-xl pl-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">{t('test.minutes_short', { defaultValue: 'dəqiqə' })}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <Checkbox
                  checked={testData.allowRetake}
                  onCheckedChange={(checked) => setTestData((currentData) => ({ ...currentData, allowRetake: checked === true }))}
                  className="mt-0.5 border-[#A87A1F] data-[state=checked]:border-[#A87A1F] data-[state=checked]:bg-[#A87A1F]"
                />
                <div>
                  <p className="font-semibold text-gray-900">{t('test.edit.allow_retake', { defaultValue: 'Tələbə testi təkrar yaza bilsin' })}</p>
                  <p className="text-sm text-gray-500">{t('test.edit.allow_retake_desc', { defaultValue: 'Söndürülərsə test yalnız bir dəfə yazıla bilər.' })}</p>
                </div>
              </div>
            </div>
          </div>

          <TeacherAssessmentQuestionBuilder
            questions={questions}
            setQuestions={setQuestions}
            updateQuestion={updateQuestion}
            updateOption={updateOption}
            removeQuestion={removeQuestion}
          />

          <div className="fixed inset-x-3 bottom-3 z-40 flex flex-col gap-3 rounded-3xl border border-white/50 bg-white/90 p-3 shadow-2xl backdrop-blur-md sm:left-1/2 sm:right-auto sm:bottom-6 sm:flex-row sm:items-center sm:gap-4 sm:rounded-2xl sm:p-2 sm:-translate-x-1/2">
            <Button type="button" onClick={addQuestion} variant="outline" className="h-12 rounded-xl border-gray-200 bg-white px-6 font-bold sm:flex-1">
              <Plus className="mr-2 h-4 w-4" />
              {t('test.edit.add_question', { defaultValue: 'Sual əlavə et' })}
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="h-12 min-w-[180px] rounded-xl bg-[#D4AF37] px-10 font-bold text-white shadow-lg shadow-[#D4AF37]/20 hover:bg-[#B88A1B] sm:flex-1"
            >
              {isSaving ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>{t('common.saving', { defaultValue: 'Yadda saxlanır...' })}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Save className="h-5 w-5" />
                  <span>{t('teacher.test.save')}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
