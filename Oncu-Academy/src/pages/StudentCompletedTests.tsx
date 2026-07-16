import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/services/publicApi';
import { 
  FileText, 
  ChevronLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw
} from 'lucide-react';

export default function StudentCompletedTests() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [completedTests, setCompletedTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedTests = async () => {
      const token = localStorage.getItem('rim_auth_token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/tests/results/my`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success && data.data) {
          setCompletedTests(data.data.filter((result: any) => result.test?.type !== 'admin_exam'));
        }
      } catch (err) {
        console.error('Tamamlanan testlər gətirilərkən xəta baş verdi', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletedTests();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F3F3F3] pt-20 lg:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Geri qayıt
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#A87A1F]/10 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#A87A1F]" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-gray-900">
                Tamamlanan Testlər
              </h1>
              <p className="text-gray-500 mt-1">
                İndiyə qədər bitirdiyiniz testlərin nəticələri
              </p>
            </div>
          </div>
        </div>

        {/* List of Completed Tests */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-16 text-gray-500">{t('common.loading')}</div>
          ) : completedTests.length === 0 ? (
             <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <FileText className="w-10 h-10 text-gray-400" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2">
               Hələ heç bir test tamamlanmayıb
             </h3>
             <p className="text-gray-500">
               Normal kurs testləri burada görünür. Admin imtahan nəticələri ayrıca imtahan panelində saxlanılır.
             </p>
             <Button
               onClick={() => navigate('/exam-panel/results')}
               variant="link"
               className="mt-3 font-bold text-[#A87A1F]"
             >
               İmtahan nəticələrinə bax
             </Button>
           </div>
          ) : (
            completedTests.map((result: any) => {
              const testTitle = result.test?.title || 'Bilinməyən Test';
              const courseTitle = result.test?.course?.title || 'Bilinməyən Kurs'; // if populated deep
              const percentage = result.scorePercentage || 0;
              const isPassed = percentage >= 50; // simple passing logic
              const qCount = result.answers?.length || 0;
              const correctS = result.answers?.filter((a:any) => a.isCorrect).length || 0;
              const hasPending = result.hasPendingAnswers;
              const canRetake = Boolean(result.test?.allowRetake);

              return (
            <div
              key={result._id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 sm:items-center justify-between transition-all hover:shadow-md"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
                    {courseTitle}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {new Date(result.completedAt || result.createdAt).toLocaleDateString('az-AZ')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                  {testTitle}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                     {hasPending && <span className="font-bold text-yellow-500">Gözləmədəki suallar var</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>{qCount} sual</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 shrink-0">
                <div className="text-left sm:text-center">
                  <div className={`text-2xl font-black ${hasPending ? 'text-yellow-500' : isPassed ? 'text-[#D4AF37]' : 'text-red-500'}`}>
                    {(percentage || 0).toFixed(0)}%
                  </div>
                  <div className={`flex items-center gap-1 mt-0.5 ${hasPending ? 'text-yellow-500' : isPassed ? 'text-[#D4AF37]' : 'text-red-500'}`}>
                    {hasPending ? (
                       <Clock className="w-3.5 h-3.5" />
                    ) : isPassed ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    <span className="text-xs font-semibold">
                      {hasPending ? 'Yoxlanılır' : isPassed ? 'Keçdi' : 'Kəsildi'}
                    </span>
                  </div>
                </div>

                <div className="text-sm">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-gray-500">Doğru:</span>
                    <span className="text-[#D4AF37] font-bold">{correctS}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">Yanlış:</span>
                    <span className="text-red-500 font-bold">{qCount - correctS}</span>
                  </div>
                </div>

                {canRetake ? (
                  <Button
                    onClick={() => navigate(`/tests/${result.test?._id}`)}
                    className="w-full sm:w-auto mt-2 sm:mt-0 bg-[#D4AF37] hover:bg-[#B88A1B] text-white rounded-xl"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Təkrar test
                  </Button>
                ) : (
                  <div className="w-full sm:w-auto mt-2 sm:mt-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-500">
                    Bu test tək dəfəlikdir
                  </div>
                )}
              </div>
            </div>
            );
          })
          )}
        </div>
      </div>
    </div>
  );
}
