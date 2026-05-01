import { CheckCircle, FileText, HelpCircle, Image as ImageIcon, MinusCircle, PlusCircle, Trash2, Type } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { AssessmentQuestion } from '@/lib/teacherAssessment';

type TeacherAssessmentQuestionBuilderProps = {
  questions: AssessmentQuestion[];
  setQuestions: React.Dispatch<React.SetStateAction<AssessmentQuestion[]>>;
  updateQuestion: (id: string, field: keyof AssessmentQuestion, value: AssessmentQuestion[keyof AssessmentQuestion]) => void;
  updateOption: (questionId: string, optionIndex: number, value: string) => void;
  removeQuestion: (id: string) => void;
};

export function TeacherAssessmentQuestionBuilder({
  questions,
  setQuestions,
  updateQuestion,
  updateOption,
  removeQuestion,
}: TeacherAssessmentQuestionBuilderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Suallar ({questions.length})
        </h2>
      </div>

      {questions.map((question, questionIndex) => (
        <div key={question.id} className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                <HelpCircle className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <span className="font-bold text-gray-900">Sual {questionIndex + 1}</span>
            </div>
            <button
              type="button"
              onClick={() => removeQuestion(question.id)}
              className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="flex w-fit flex-wrap items-center gap-2 rounded-2xl bg-gray-50 p-2">
              <button
                type="button"
                onClick={() => updateQuestion(question.id, 'questionType', 'text')}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                  question.questionType === 'text' ? 'bg-white text-[#D4AF37] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <Type className="h-4 w-4" />
                Mətn sualı
              </button>
              <button
                type="button"
                onClick={() => updateQuestion(question.id, 'questionType', 'image')}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                  question.questionType === 'image' ? 'bg-white text-[#D4AF37] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <ImageIcon className="h-4 w-4" />
                Şəkil sualı
              </button>
            </div>

            <div className="flex w-fit flex-wrap items-center gap-2 rounded-2xl bg-blue-50/60 p-2">
              <button
                type="button"
                onClick={() => updateQuestion(question.id, 'answerType', 'multiple_choice')}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                  question.answerType === 'multiple_choice' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-400 hover:text-blue-600'
                )}
              >
                <CheckCircle className="h-4 w-4" />
                Qapalı test
              </button>
              <button
                type="button"
                onClick={() => updateQuestion(question.id, 'answerType', 'open_ended')}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                  question.answerType === 'open_ended' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-400 hover:text-blue-600'
                )}
              >
                <FileText className="h-4 w-4" />
                Açıq sual
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {question.questionType === 'text' ? (
              <Input
                value={question.content}
                onChange={(event) => updateQuestion(question.id, 'content', event.target.value)}
                placeholder="Sual mətnini daxil edin..."
                className="h-12 rounded-xl border-gray-200 focus:border-[#D4AF37]"
              />
            ) : (
              <div className="space-y-4">
                  <div className="group relative max-w-2xl cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-sm">
                  {question.content ? (
                    <>
                      <img src={question.content} alt={`Sual ${questionIndex + 1}`} className="block h-auto max-h-[520px] w-full object-contain" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <p className="text-xs font-bold text-white">Şəkli dəyişmək üçün klikləyin</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-slate-400">
                      <ImageIcon className="mb-2 h-10 w-10 text-[#D4AF37]/70" />
                      <p className="text-sm font-bold text-slate-700">Sual üçün şəkil yükləyin</p>
                      <p className="text-xs text-slate-400 mt-1">Klikləyərək fayl seçin və ya sürükləyin</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }

                      updateQuestion(question.id, 'content', URL.createObjectURL(file));
                      updateQuestion(question.id, 'imageFile', file);
                    }}
                  />
                </div>
              </div>
            )}

            {question.answerType === 'multiple_choice' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Variantlar</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (question.options.length <= 2) {
                          return;
                        }

                        const nextOptions = [...question.options];
                        nextOptions.pop();
                        setQuestions((currentQuestions) => currentQuestions.map((currentQuestion) => (
                          currentQuestion.id === question.id
                            ? {
                                ...currentQuestion,
                                options: nextOptions,
                                correctAnswer: Math.min(currentQuestion.correctAnswer, nextOptions.length - 1),
                              }
                            : currentQuestion
                        )));
                      }}
                      className="p-1 text-gray-400 transition-colors hover:text-red-500"
                    >
                      <MinusCircle className="h-5 w-5" />
                    </button>
                    <span className="w-4 text-center text-xs font-black">{question.options.length}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (question.options.length >= 6) {
                          return;
                        }

                        const nextOptions = [...question.options, ''];
                        setQuestions((currentQuestions) => currentQuestions.map((currentQuestion) => (
                          currentQuestion.id === question.id
                            ? { ...currentQuestion, options: nextOptions }
                            : currentQuestion
                        )));
                      }}
                      className="p-1 text-gray-400 transition-colors hover:text-[#D4AF37]"
                    >
                      <PlusCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={`${question.id}-${optionIndex}`} className="relative">
                      <div
                        className={cn(
                          'absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-xs font-bold transition-colors',
                          question.correctAnswer === optionIndex
                            ? 'bg-[#D4AF37] text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        )}
                        onClick={() => updateQuestion(question.id, 'correctAnswer', optionIndex)}
                      >
                        {String.fromCharCode(65 + optionIndex)}
                      </div>
                      <Input
                        value={option}
                        onChange={(event) => updateOption(question.id, optionIndex, event.target.value)}
                        placeholder={`Variant ${String.fromCharCode(65 + optionIndex)}`}
                        className={cn(
                          'h-12 rounded-xl border-gray-100 pl-12 focus:border-[#D4AF37]',
                          question.correctAnswer === optionIndex && 'border-[#D4AF37] ring-1 ring-[#D4AF37]'
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={question.openEndedAnswerType === 'number'}
                    onCheckedChange={(checked) => updateQuestion(question.id, 'openEndedAnswerType', checked === true ? 'number' : 'text')}
                    className="border-blue-300 data-[state=checked]:border-[#D4AF37] data-[state=checked]:bg-[#D4AF37]"
                  />
                  <span className="text-sm font-bold text-blue-700">Cavabı yalnız rəqəm olan sual</span>
                </label>

                {question.openEndedAnswerType === 'number' ? (
                  <div className="max-w-sm">
                    <Input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={question.openEndedNumericAnswer || ''}
                      onChange={(event) => updateQuestion(question.id, 'openEndedNumericAnswer', event.target.value)}
                      placeholder="Məs: 3.5"
                      className="h-12 rounded-xl border-blue-200 focus:border-[#D4AF37]"
                    />
                  </div>
                ) : (
                  <p className="text-sm font-medium text-blue-700/80">Mətn cavablar müəllim tərəfindən sonradan yoxlanılacaq.</p>
                )}
              </div>
            )}

            <p className="text-xs italic text-gray-400">
              {question.answerType === 'multiple_choice'
                ? 'Düzgün cavabı seçmək üçün variantın hərfinə klikləyin.'
                : 'Açıq mətn cavablar avtomatik yoxlanmır, müəllim panelində yoxlanılır.'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}