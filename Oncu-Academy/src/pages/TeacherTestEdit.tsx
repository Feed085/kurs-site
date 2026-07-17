import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  FileText,
  CheckCircle2,
  Circle,
  Image as ImageIcon,
  Type,
  MinusCircle,
  PlusCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/services/publicApi';

interface Question {
  _id?: string;
  id: string | number;
  questionType: 'text' | 'image';
  content: string;
  imageFile?: File;
  answerType: 'multiple_choice' | 'open_ended';
  openEndedAnswerType?: 'text' | 'number';
  openEndedNumericAnswer?: string;
  options: string[];
  correctAnswer: number;
}

const getMultipleChoiceCorrectAnswerIndex = (question: any) => {
  const storedIndex = Number(String(question?.correctAnswer ?? '').trim());
  if (Number.isInteger(storedIndex) && storedIndex >= 0) {
    return storedIndex;
  }

  if (Array.isArray(question?.options)) {
    const fallbackIndex = question.options.findIndex((option: string) => option === question?.correctAnswer);
    if (fallbackIndex >= 0) {
      return fallbackIndex;
    }
  }

  return 0;
};

export default function TeacherTestEdit() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTest = async () => {
      if (!id) return;
      const token = localStorage.getItem('rim_auth_token');
      try {
        const res = await fetch(`${API_BASE_URL}/tests/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          // Normalize for frontend
          const normalizedQuestions = data.data.questions.map((q: any) => ({
            ...q,
            id: q._id, // use MongoDB ID as UI ID
            correctAnswer: q.answerType === 'multiple_choice' ? getMultipleChoiceCorrectAnswerIndex(q) : q.correctAnswer,
            openEndedAnswerType: q.openEndedAnswerType || (q.answerType === 'open_ended' && q.correctAnswer ? 'number' : 'text'),
            openEndedNumericAnswer: q.answerType === 'open_ended' ? (q.correctAnswer || '') : '',
          }));
          setTest({ ...data.data, allowRetake: data.data.allowRetake ?? false, questions: normalizedQuestions });
        } else {
          toast.error(t('common.not_found'));
        }
      } catch (err) {
        toast.error('Server xətası');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id]);

  const handleSave = async () => {
    if (!id || !test) return;
    
    setIsSaving(true);
    const token = localStorage.getItem('rim_auth_token');

    try {
      // 1. Upload new images if any
      const formattedQuestions = [];
      for (const q of test.questions) {
        let finalContent = q.content;

        if (q.answerType === 'open_ended' && q.openEndedAnswerType === 'number' && !q.openEndedNumericAnswer?.trim()) {
          toast.error(t('common.error'));
          setIsSaving(false);
          return;
        }
        
        if (q.questionType === 'image' && q.imageFile) {
          const presignReq = await fetch(
            `${API_BASE_URL}/upload/presign?filename=${encodeURIComponent(q.imageFile.name)}&contentType=${encodeURIComponent(q.imageFile.type)}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          const presignData = await presignReq.json();
          if (presignData.success) {
            await fetch(presignData.data.signedUrl, {
              method: 'PUT',
              headers: { 'Content-Type': q.imageFile.type },
              body: q.imageFile
            });
            finalContent = presignData.data.publicUrl;
          }
        }

        formattedQuestions.push({
          questionType: q.questionType,
          content: finalContent,
          answerType: q.answerType,
          openEndedAnswerType: q.answerType === 'open_ended' ? (q.openEndedAnswerType || 'text') : 'text',
          options: q.answerType === 'multiple_choice' ? q.options : [],
          correctAnswer: q.answerType === 'multiple_choice'
            ? String(q.correctAnswer ?? 0)
            : q.answerType === 'open_ended' && q.openEndedAnswerType === 'number'
            ? q.openEndedNumericAnswer.trim()
            : q.correctAnswer
        });
      }

      // 2. Update Test
      const res = await fetch(`${API_BASE_URL}/tests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: test.title,
          duration: test.duration,
          allowRetake: test.allowRetake ?? false,
          questions: formattedQuestions
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(t('common.save'));
        setTimeout(() => navigate(-1), 1000);
      } else {
        toast.error(t('common.error_prefix') + data.message);
      }
    } catch (err) {
      toast.error(t('common.error', { defaultValue: 'Server xətası' }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !test) return;

    const isConfirmed = window.confirm(t('teacher.test_edit.confirm_delete', { defaultValue: 'Bu testi silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz.' }));
    if (!isConfirmed) return;

    setIsSaving(true);
    const token = localStorage.getItem('rim_auth_token');

    try {
      const res = await fetch(`${API_BASE_URL}/tests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        toast.success(t('teacher.test_edit.deleted', { defaultValue: 'Test silindi' }));
        navigate('/teacher/tests', { replace: true });
      } else {
        toast.error(t('common.error_prefix') + data.message);
      }
    } catch (err) {
      toast.error(t('common.error', { defaultValue: 'Server xətası' }));
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      questionType: 'text',
      content: 'Yeni sual',
      answerType: 'multiple_choice',
      openEndedAnswerType: 'text',
      openEndedNumericAnswer: '',
      options: ['Variant A', 'Variant B', 'Variant C', 'Variant D'],
      correctAnswer: 0
    };
    setTest({
      ...test,
      questions: [...test.questions, newQuestion]
    });
  };

  const removeQuestion = (id: string | number) => {
    if (test.questions.length > 1) {
      setTest({
        ...test,
        questions: test.questions.filter((q: any) => q.id !== id)
      });
    } else {
      toast.error(t('teacher.test_edit.min_one_question', { defaultValue: 'Ən azı bir sual olmalıdır' }));
    }
  };

  const updateQuestionField = (id: string | number, field: keyof Question, value: any) => {
    setTest({
      ...test,
      questions: test.questions.map((q: any) => 
        q.id === id ? { ...q, [field]: value } : q
      )
    });
  };

  const updateOption = (id: string | number, optIndex: number, value: string) => {
    setTest({
      ...test,
      questions: test.questions.map((q: any) => {
        if (q.id === id) {
          const newOptions = [...q.options];
          newOptions[optIndex] = value;

          return { ...q, options: newOptions };
        }
        return q;
      })
    });
  };

  if (loading) {
     return (
       <div className="min-h-screen pt-24 flex items-center justify-center bg-[#F3F3F3]">
         <p className="text-gray-500 font-bold">{t('common.loading')}</p>
       </div>
     );
  }

  if (!test) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-[#F3F3F3]">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">{t('common.not_found')}</h2>
          <Button onClick={() => navigate(-1)} variant="link">{t('test.edit.go_back')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)] pb-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-2 p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-900 group"
              type="button"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              {t('common.go_back', { defaultValue: 'Geri qayıt' })}
            </Button>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900">
              {t('teacher.test_edit.edit_title', { defaultValue: 'Testi Redaktə Et' })}
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button 
                variant="outline" 
                className="w-full rounded-xl border-gray-200 sm:w-auto" 
                onClick={() => navigate(-1)}
              type="button"
            >
              {t('common.cancel', { defaultValue: 'Ləğv et' })}
            </Button>
            <Button
                variant="outline"
                className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
                onClick={handleDelete}
              type="button"
                disabled={isSaving}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Sil
            </Button>
            <Button 
                className="w-full rounded-xl bg-[#D4AF37] px-8 font-bold text-white shadow-lg shadow-[#D4AF37]/20 hover:bg-[#B88A1B] sm:w-auto" 
                onClick={handleSave}
              type="button"
                disabled={isSaving}
            >
              {isSaving ? t('common.saving', { defaultValue: 'Yadda saxlanılır...' }) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Yadda Saxla
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Test Info */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 mb-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('test.edit.test_title')}</label>
                <Input 
                  value={test.title}
                  onChange={(e) => setTest({ ...test, title: e.target.value })}
                  className="rounded-xl h-12 text-lg font-bold border-gray-200 focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('test.edit.duration_min')}</label>
                <Input 
                  type="number"
                  value={test.duration}
                  onChange={(e) => setTest({ ...test, duration: Number(e.target.value) })}
                  className="rounded-xl h-12 text-lg font-bold border-gray-200 focus:border-[#D4AF37]"
                />
              </div>
           </div>

           <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <Checkbox
                checked={Boolean(test.allowRetake)}
                onCheckedChange={(checked) => setTest({ ...test, allowRetake: checked === true })}
                className="mt-0.5 border-[#A87A1F] data-[state=checked]:border-[#A87A1F] data-[state=checked]:bg-[#A87A1F]"
              />
              <div>
                <p className="font-semibold text-gray-900">{t('test.edit.allow_retake')}</p>
                <p className="text-sm text-gray-500">{t('test.edit.allow_retake_desc')}</p>
              </div>
           </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#D4AF37]" />
              Suallar ({test.questions.length})
            </h2>
          </div>

          {test.questions.map((question: any, qIdx: number) => (
            <div key={question.id} className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 relative group">
              <button 
                type="button"
                onClick={() => removeQuestion(question.id)}
                className="absolute top-6 right-6 p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center font-bold text-sm">
                  {qIdx + 1}
                </span>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Sual</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-2xl w-fit">
                     <button
                       type="button"
                       onClick={() => updateQuestionField(question.id, 'questionType', 'text')}
                       className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          question.questionType === 'text' ? 'bg-white text-[#D4AF37] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                       }`}
                     >
                       <Type className="w-4 h-4" />
                       {t('teacher.test_edit.text_question', { defaultValue: 'Mətn Sualı' })}
                     </button>
                     <button
                       type="button"
                       onClick={() => updateQuestionField(question.id, 'questionType', 'image')}
                       className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          question.questionType === 'image' ? 'bg-white text-[#D4AF37] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                       }`}
                     >
                       <ImageIcon className="w-4 h-4" />
                       {t('teacher.test_edit.image_question', { defaultValue: 'Şəkil Sualı' })}
                     </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 p-2 bg-blue-50/50 rounded-2xl w-fit">
                     <button
                       type="button"
                       onClick={() => updateQuestionField(question.id, 'answerType', 'multiple_choice')}
                       className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          question.answerType === 'multiple_choice' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-400 hover:text-blue-600'
                       }`}
                     >
                       <CheckCircle className="w-4 h-4" />
                       {t('teacher.test_edit.multiple_choice', { defaultValue: 'Qapalı Test' })}
                     </button>
                     <button
                       type="button"
                       onClick={() => updateQuestionField(question.id, 'answerType', 'open_ended')}
                       className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          question.answerType === 'open_ended' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-400 hover:text-blue-600'
                       }`}
                     >
                       <FileText className="w-4 h-4" />
                       {t('teacher.test_edit.open_ended', { defaultValue: 'Açıq Sual (Yazı)' })}
                     </button>
                  </div>
              </div>

              <div className="space-y-6">
                {question.questionType === 'text' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">{t('test.edit.question_text')}</label>
                    <Input 
                      value={question.content}
                      onChange={(e) => updateQuestionField(question.id, 'content', e.target.value)}
                      className="rounded-xl h-12 border-gray-200 focus:border-[#D4AF37] font-medium"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                     <div className="relative max-w-2xl rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 group cursor-pointer hover:border-[#D4AF37]/50 transition-colors">
                        {question.content ? (
                          <>
                            <img src={question.content} alt="Sual" className="block w-full h-auto max-h-[520px] object-contain" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <p className="text-white text-xs font-bold">{t('test.edit.click_to_change_image')}</p>
                            </div>
                          </>
                        ) : (
                          <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-gray-400">
                             <ImageIcon className="w-10 h-10 mb-2 opacity-20" />
                             <p className="text-sm font-bold">{t('test.edit.upload_question_image')}</p>
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                                const fakeUrl = URL.createObjectURL(file);
                                setTest({
                                  ...test,
                                  questions: test.questions.map((q: any) => (
                                    q.id === question.id
                                      ? { ...q, content: fakeUrl, imageFile: file }
                                      : q
                                  ))
                                });
                             }
                          }}
                        />
                     </div>
                  </div>
                )}

                {question.answerType === 'multiple_choice' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-widest text-[10px]">Variantlar</label>
                        <div className="flex items-center gap-2">
                            <button 
                            type="button"
                            onClick={() => {
                              if (question.options.length > 2) {
                                const newOptions = [...question.options];
                                newOptions.pop();
                                setTest({
                                  ...test,
                                  questions: test.questions.map((q: any) => 
                                    q.id === question.id ? { ...q, options: newOptions, correctAnswer: Math.min(q.correctAnswer, newOptions.length - 1) } : q
                                  )
                                });
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <MinusCircle className="w-5 h-5" />
                          </button>
                          <span className="text-xs font-black">{question.options.length}</span>
                            <button 
                            type="button"
                            onClick={() => {
                              if (question.options.length < 6) {
                                const newOptions = [...question.options, ``];
                                setTest({
                                  ...test,
                                  questions: test.questions.map((q: any) => 
                                    q.id === question.id ? { ...q, options: newOptions } : q
                                  )
                                });
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-[#D4AF37] transition-colors"
                          >
                            <PlusCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {question.options.map((option: string, optIndex: number) => {
                          const isCorrect = question.correctAnswer === optIndex;
                          return (
                            <div key={optIndex} className={`relative flex items-center p-3 rounded-2xl border-2 transition-all ${
                                isCorrect 
                                ? 'border-[#D4AF37] bg-[#D4AF37]/5 shadow-sm' 
                                : 'border-gray-50 hover:border-gray-100'
                            }`}>
                                <button
                              onClick={() => updateQuestionField(question.id, 'correctAnswer', optIndex)}
                                    className={`mr-3 transition-colors ${
                                        isCorrect ? 'text-[#D4AF37]' : 'text-gray-300'
                                    }`}
                                >
                                    {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                </button>
                                <Input 
                                    value={option}
                                    onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                                    placeholder={`Variant ${String.fromCharCode(65 + optIndex)}`}
                                    className="border-none bg-transparent focus-visible:ring-0 p-0 font-medium h-auto"
                                />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                ) : (
                    <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-sm font-medium">
                        <label className="flex cursor-pointer items-center gap-3">
                          <Checkbox
                            checked={question.openEndedAnswerType === 'number'}
                            onCheckedChange={(checked) => updateQuestionField(question.id, 'openEndedAnswerType', checked === true ? 'number' : 'text')}
                            className="border-blue-300 data-[state=checked]:border-[#D4AF37] data-[state=checked]:bg-[#D4AF37]"
                          />
                          <span className="font-bold text-blue-700">{t('test.edit.numeric_answer_question')}</span>
                        </label>
                        <p className="text-blue-700/80">{t('test.edit.numeric_answer_desc')}</p>
                        {question.openEndedAnswerType === 'number' && (
                          <div className="relative max-w-sm">
                            <Input
                              type="number"
                              step="any"
                              inputMode="decimal"
                              value={question.openEndedNumericAnswer || ''}
                              onChange={(e) => updateQuestionField(question.id, 'openEndedNumericAnswer', e.target.value)}
                              placeholder={t('teacher.test_edit.number_example', { defaultValue: 'Məs: 3.5' })}
                              className="rounded-xl h-12 border-blue-200 focus:border-[#D4AF37] font-medium"
                            />
                          </div>
                        )}
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Floating Actions */}
        <div className="fixed inset-x-3 bottom-3 z-40 flex flex-col gap-3 rounded-3xl border border-white/50 bg-white/90 p-3 shadow-2xl backdrop-blur-md sm:left-1/2 sm:right-auto sm:bottom-6 sm:flex-row sm:gap-4 sm:rounded-2xl sm:p-2 sm:-translate-x-1/2">
             <Button 
            type="button"
                onClick={addQuestion}
          className="h-12 rounded-xl border-2 border-gray-100 bg-white px-8 font-bold text-gray-900 hover:bg-gray-50 sm:flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('teacher.test_edit.add_question', { defaultValue: 'Sual Əlavə Et' })}
            </Button>
            <Button 
              type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="h-12 rounded-xl bg-[#D4AF37] px-8 font-bold text-white shadow-lg shadow-[#D4AF37]/20 hover:bg-[#B88A1B] sm:flex-1" 
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? t('common.saving', { defaultValue: 'Yadda saxlanır...' }) : t('common.save', { defaultValue: 'Yadda Saxla' })}
            </Button>
        </div>
      </div>
    </div>
  );
}
