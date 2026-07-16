import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/services/publicApi';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

const normalizeMultipleChoiceAnswerIndex = (value: unknown) => {
  const parsedValue = Number(String(value).trim());
  return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : null;
};

const resolveEntityId = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'object') {
    const objectValue = value as { _id?: unknown; id?: unknown; toString?: () => string };
    if (objectValue._id !== undefined && objectValue._id !== null) {
      return resolveEntityId(objectValue._id);
    }

    if (objectValue.id !== undefined && objectValue.id !== null) {
      return resolveEntityId(objectValue.id);
    }

    if (typeof objectValue.toString === 'function') {
      return objectValue.toString();
    }
  }

  return String(value);
};

const getMultipleChoiceCorrectAnswerIndex = (question: any) => {
  const storedIndex = normalizeMultipleChoiceAnswerIndex(question?.correctAnswer);
  if (storedIndex !== null) {
    return storedIndex;
  }

  if (Array.isArray(question?.options)) {
    const fallbackIndex = question.options.findIndex((option: string) => option === question?.correctAnswer);
    if (fallbackIndex >= 0) {
      return fallbackIndex;
    }
  }

  return null;
};

const getResultTimeValue = (result: any) => {
  const timeSource = result?.completedAt || result?.createdAt || 0;
  const timeValue = new Date(timeSource).getTime();
  return Number.isFinite(timeValue) ? timeValue : 0;
};

const getAttemptLabel = (attemptNumber: number) => {
  if (attemptNumber === 1) return '1-ci cəhd';
  if (attemptNumber === 2) return '2-ci cəhd';
  if (attemptNumber === 3) return '3-cü cəhd';
  return `${attemptNumber}-ci cəhd`;
};

const formatMultipleChoiceAnswer = (question: any, answer: string) => {
  const answerIndex = normalizeMultipleChoiceAnswerIndex(answer);
  if (answerIndex === null) {
    return answer || 'Cavab verilməyib';
  }

  const optionText = question?.options?.[answerIndex] ?? '';
  const optionLabel = String.fromCharCode(65 + answerIndex);
  return optionText ? `${optionLabel}: ${optionText}` : optionLabel;
};

export default function TeacherTestResults() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [test, setTest] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    const token = localStorage.getItem('rim_auth_token');
    try {
      // 1. Fetch Test Details
      const testRes = await fetch(`${API_BASE_URL}/tests/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const testData = await testRes.json();
      if (testData.success) {
        setTest(testData.data);
      }

      // 2. Fetch Results
      const resRes = await fetch(`${API_BASE_URL}/tests/${id}/results`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await resRes.json();
      if (resData.success) {
        setResults(resData.data);
         // if dialog is open, update the selected result
         if (selectedResult) {
            const updatedResult = resData.data.find((r:any) => r._id === selectedResult._id);
            if (updatedResult) setSelectedResult(updatedResult);
         }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchResults();
    }
  }, [id]);

  const filteredResults = results.filter(r => 
    r.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.student?.surname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resultsWithAttemptNumbers = filteredResults
    .slice()
    .sort((left, right) => getResultTimeValue(left) - getResultTimeValue(right))
    .reduce<Array<any>>((accumulator, result) => {
      const studentId = result.student?._id || result.student?.id || result.student?.email || result.student?.name;
      const previousAttempts = accumulator.filter((item) => {
        const itemStudentId = item.student?._id || item.student?.id || item.student?.email || item.student?.name;
        return itemStudentId === studentId;
      }).length;

      accumulator.push({
        ...result,
        attemptNumber: previousAttempts + 1
      });

      return accumulator;
    }, []);

  const handleShowDetail = (result: any) => {
    setSelectedResult(result);
    setIsDetailOpen(true);
  };

  const handleEvaluateOpenEnded = async (resultId: string, questionId: string, isCorrect: boolean) => {
    const token = localStorage.getItem('rim_auth_token');
    try {
       const evaluations = [{ questionId, isCorrect }];
      const res = await fetch(`${API_BASE_URL}/tests/results/${resultId}/evaluate`, {
          method: 'PUT',
          headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ evaluations })
       });
       const data = await res.json();
       if (data.success) {
          toast.success('Cavab qiymətləndirildi');
          fetchResults(); // refresh data
       } else {
          toast.error(t('common.error'));
       }
    } catch (error) {
       toast.error('Server xətası');
    }
  };

  const isNumericOpenEndedQuestion = (question: any) => {
    if (!question || question.answerType !== 'open_ended') {
      return false;
    }

    return question.openEndedAnswerType === 'number';
  };

  const hasAnswerValue = (value?: string) => Boolean(String(value ?? '').trim());

  const isPendingExpertReviewAnswer = (answer: any) => {
    if (!hasAnswerValue(answer?.answer)) {
      return false;
    }

    if (answer?.status === 'pending') {
      return true;
    }

    if (answer?.status === 'graded' || typeof answer?.isCorrect === 'boolean') {
      return false;
    }

    return true;
  };

  const isQuestionOwnedByTeacher = (question: any) => {
    const ownerId = resolveEntityId(question?.sourceTeacherId);

    if (ownerId) {
      return ownerId === resolveEntityId(user?.id);
    }

    const linkedTeacherIds = Array.isArray(test?.sourceTeacherIds)
      ? test.sourceTeacherIds.map((value: unknown) => resolveEntityId(value)).filter(Boolean)
      : [];

    return linkedTeacherIds.length <= 1 || linkedTeacherIds.includes(resolveEntityId(user?.id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1.5rem)] flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1.5rem)] flex items-center justify-center">
        <p>{t('common.not_found')}</p>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)] pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-2 p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-900 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Geri qayıt
          </Button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-gray-900">
                Test Nəticələri
              </h1>
              <p className="text-gray-500 mt-1">
                {test.title} - {results.length} nəticə
              </p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tələbə axtar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl border-gray-200 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {resultsWithAttemptNumbers.map((result) => {
            const isPassed = result.scorePercentage >= 60;
            return (
               <div 
                 key={result._id}
                 onClick={() => handleShowDetail(result)}
                 className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
               >
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="relative">
                       <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-bold text-gray-600">
                          {result.student?.name?.[0]}{result.student?.surname?.[0]}
                       </div>
                       {result.hasPendingAnswers ? (
                         <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-yellow-500 flex items-center justify-center">
                           <AlertTriangle className="w-3 h-3 text-white" />
                         </div>
                       ) : (
                         <div className={cn(
                           "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center",
                           isPassed ? "bg-[#D4AF37]" : "bg-red-500"
                         )}>
                           {isPassed ? (
                             <CheckCircle className="w-3 h-3 text-white" />
                           ) : (
                             <XCircle className="w-3 h-3 text-white" />
                           )}
                         </div>
                       )}
                     </div>
                     <div>
                       <h4 className="font-bold text-gray-900">{result.student?.name} {result.student?.surname}</h4>
                       <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                         <Clock className="w-3 h-3" />
                         <span>{new Date(result.completedAt).toLocaleDateString('az-AZ')}</span>
                         <span className="rounded-full bg-blue-50 px-2 py-0.5 font-bold text-[#A87A1F]">
                           {getAttemptLabel(result.attemptNumber || 1)}
                         </span>
                       </div>
                     </div>
                   </div>
                   <div className="text-right">
                     {result.hasPendingAnswers ? (
                         <div className="text-sm font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
                           Yoxlamada
                         </div>
                     ) : (
                        <>
                           <div className={cn(
                             "text-xl font-black",
                             isPassed ? "text-[#D4AF37]" : "text-red-500"
                           )}>
                             {(result.scorePercentage || 0).toFixed(0)}%
                           </div>
                           <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                             Nəticə
                           </div>
                        </>
                     )}
                   </div>
                 </div>
               </div>
            )
          })}
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{t('common.no_results')}</p>
            <p className="text-[10px] text-gray-400 mt-2 italic">Test ID: {id}</p>
          </div>
        )}
      </div>

      {/* Result Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#D4AF37]" />
              Test Detalları: {selectedResult?.student?.name} {selectedResult?.student?.surname}
            </DialogTitle>
          </DialogHeader>
          
          {selectedResult && (
            <div className="py-4 space-y-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-[#D4AF37]">{selectedResult.answers.filter((a:any)=>a.isCorrect).length}</div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('test.stats.correct')}</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-red-500">{selectedResult.answers.filter((a:any)=>!a.isCorrect && a.status === 'graded').length}</div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('test.stats.incorrect')}</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-yellow-500">{selectedResult.answers.filter((a:any)=>a.status === 'pending').length}</div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('test.stats.pending')}</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-gray-600">{Math.max((test.questions || []).length - selectedResult.answers.length, 0)}</div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('test.stats.empty')}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 px-1">
                  Sual və Cavablar
                </h3>
                <div className="space-y-3">
                  {test.questions.map((q: any, idx: number) => {
                    const studentAnsObj = selectedResult.answers.find((a:any) => resolveEntityId(a.questionId) === resolveEntityId(q._id));
                    const hasAnswer = Boolean(studentAnsObj);
                    const isPending = studentAnsObj?.status === 'pending';
                    const isCorrect = Boolean(studentAnsObj?.isCorrect);
                    const isTeacherReviewablePending = isPendingExpertReviewAnswer(studentAnsObj) && isQuestionOwnedByTeacher(q) && !isNumericOpenEndedQuestion(q);
                    const selectedAnswerIndex = normalizeMultipleChoiceAnswerIndex(studentAnsObj?.answer);
                    const correctAnswerIndex = getMultipleChoiceCorrectAnswerIndex(q);
                    const answerStateLabel = !hasAnswer
                      ? 'Cavab verilməyib'
                      : isTeacherReviewablePending
                        ? 'Yoxlama gözləyir'
                        : isCorrect
                          ? 'Doğru'
                          : 'Yanlış';
                    
                    return (
                      <div key={q._id} className={cn(
                        "p-4 rounded-2xl border transition-all",
                        !hasAnswer ? "bg-gray-50/80 border-gray-200"
                                  : isPending ? "bg-yellow-50/50 border-yellow-200" 
                                  : isCorrect ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"
                      )}>
                        <div className="flex flex-col mb-3">
                           <div className="flex gap-3 mb-2">
                             <span className="font-bold text-gray-400">{idx + 1}.</span>
                             <div className="font-medium text-gray-900 text-sm leading-relaxed w-full">
                                {q.questionType === 'image' ? (
                                   <div className="w-full max-w-sm rounded-lg overflow-hidden my-2">
                                      <img src={q.content} alt="Sual" className="w-full h-auto" />
                                   </div>
                                ) : q.content}
                             </div>
                             <span className={cn(
                               "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                               !hasAnswer ? "bg-gray-100 text-gray-500"
                                 : isPending ? "bg-yellow-100 text-yellow-700"
                                 : isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                             )}>
                               {answerStateLabel}
                             </span>
                           </div>
                           
                           {/* Məntiqi cavab növünə görə Rendering */}
                           {q.answerType === 'open_ended' ? (
                              <div className="ml-7 mt-3">
                                 <div className="bg-white p-3 rounded-lg border border-gray-100 text-sm mb-3">
                                    <span className="text-xs text-gray-400 block mb-1 uppercase font-bold">{t('test.student_answer_label')}</span>
                                    {studentAnsObj?.answer || 'Cavab verilməyib'}
                                 </div>
                                 <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                    {!hasAnswer ? (
                                      <span className="text-sm font-bold text-gray-500 flex items-center gap-1">
                                        <Clock className="w-4 h-4"/> Cavab verilməyib
                                      </span>
                                    ) : isNumericOpenEndedQuestion(q) ? (
                                      <span className={isCorrect ? "text-sm font-bold text-green-600 flex items-center gap-1" : "text-sm font-bold text-red-600 flex items-center gap-1"}>
                                        {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        {isCorrect ? t('common.auto_correct') : t('common.auto_wrong')}
                                      </span>
                                    ) : isTeacherReviewablePending ? (
                                       <span className="text-sm font-bold text-yellow-600 flex items-center gap-1">
                                          <Clock className="w-4 h-4"/> Yoxlama Gözləyir
                                       </span>
                                    ) : (
                                       <span className={isCorrect ? "text-sm font-bold text-green-600 flex items-center gap-1" : "text-sm font-bold text-red-600 flex items-center gap-1"}>
                                          {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                          {isCorrect ? 'Doğru Qiymətləndirildi' : 'Yanlış Qiymətləndirildi'}
                                       </span>
                                    )}
                                    {isTeacherReviewablePending && (
                                  <div className="flex gap-2">
                                    <Button 
                                      title="Doğru Qəbul Et"
                                      size="sm" 
                                      variant="outline" 
                                      className="text-green-600 hover:bg-green-50 border-green-200" 
                                      onClick={() => handleEvaluateOpenEnded(selectedResult._id, q._id, true)}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      title="Yanlış Qəbul Et"
                                      size="sm" 
                                      variant="outline" 
                                      className="text-red-600 hover:bg-red-50 border-red-200" 
                                      onClick={() => handleEvaluateOpenEnded(selectedResult._id, q._id, false)}
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                                 </div>
                              </div>
                           ) : (
                              <div className="grid gap-2 ml-7 mt-2">
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <div className="rounded-lg border border-gray-100 bg-white p-3 text-sm">
                                    <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-400">{t('test.selected_option')}</span>
                                    <span className="font-medium text-gray-900">{hasAnswer ? formatMultipleChoiceAnswer(q, studentAnsObj?.answer || '') : t('test.no_answer_given')}</span>
                                  </div>
                                  <div className="rounded-lg border border-gray-100 bg-white p-3 text-sm">
                                    <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-400">{t('test.correct_option')}</span>
                                    <span className="font-medium text-gray-900">{correctAnswerIndex !== null ? formatMultipleChoiceAnswer(q, String(correctAnswerIndex)) : t('test.not_assigned')}</span>
                                  </div>
                                </div>
                                {q.options.map((option: string, optIdx: number) => {
                                   const isSelected = selectedAnswerIndex !== null ? selectedAnswerIndex === optIdx : studentAnsObj?.answer === option;
                                   const isActualCorrect = correctAnswerIndex !== null ? correctAnswerIndex === optIdx : q.correctAnswer === option;
   
                                   return (
                                     <div 
                                       key={optIdx}
                                       className={cn(
                                         "flex items-center gap-2 p-2 rounded-lg text-xs font-medium",
                                         isActualCorrect 
                                           ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20" 
                                           : isSelected && !isCorrect
                                           ? "bg-red-100 text-red-600 border border-red-200"
                                           : "bg-white text-gray-500 border border-gray-100"
                                       )}
                                     >
                                       <div className={cn(
                                         "w-5 h-5 rounded flex items-center justify-center shrink-0",
                                         isActualCorrect 
                                           ? "bg-[#D4AF37] text-white" 
                                           : isSelected && !isCorrect
                                           ? "bg-red-500 text-white"
                                           : "bg-gray-100 text-gray-400"
                                       )}>
                                         {String.fromCharCode(65 + optIdx)}
                                       </div>
                                       {option}
                                       {isActualCorrect && (
                                         <span className="ml-auto text-[10px] font-black uppercase opacity-70">{t('test.stats.correct')}</span>
                                       )}
                                       {!isActualCorrect && isSelected && (
                                         <span className="ml-auto text-[10px] font-black uppercase opacity-60">{t('test.selected')}</span>
                                       )}
                                     </div>
                                   )
                                })}
                                {!hasAnswer && (
                                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                                    Bu sual üçün cavab göndərilməyib.
                                  </div>
                                )}
                              </div>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
