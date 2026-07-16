import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import ScrollToTop from '@/components/common/ScrollToTop';

// Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import StudentDashboard from '@/pages/StudentDashboard';
import StudentCompletedTests from '@/pages/StudentCompletedTests';
import StudentCertificates from '@/pages/StudentCertificates';
import StudentProfile from '@/pages/StudentProfile';
import StudentExamPanel from '@/pages/StudentExamPanel';
import StudentExamAnswerKeyDetail from '@/pages/StudentExamAnswerKeyDetail';
import CourseWatch from '@/pages/CourseWatch';
import TeacherDashboard from '@/pages/TeacherDashboard';
import TeacherProfile from '@/pages/TeacherProfile';
import UploadVideo from '@/pages/UploadVideo';
import CreateTest from '@/pages/CreateTest';
import TeacherStudents from '@/pages/TeacherStudents';
import CreateCourse from '@/pages/CreateCourse';
import Courses from '@/pages/Courses';
import CourseDetail from '@/pages/CourseDetail';
import Teachers from '@/pages/Teachers';
import TeacherDetail from '@/pages/TeacherDetail';
import Tests from '@/pages/Tests';
import TestDetail from '@/pages/TestDetail';
import Contact from '@/components/student/Contact';
import TeacherCourseEdit from '@/pages/TeacherCourseEdit';
import TeacherTestEdit from '@/pages/TeacherTestEdit';
import TeacherTestResults from '@/pages/TeacherTestResults';
import TeacherTests from '@/pages/TeacherTests';
import TeacherExamPanel from '@/pages/TeacherExamPanel';
import TeacherVideos from '@/pages/TeacherVideos';
import TeacherCourseReviews from '@/pages/TeacherCourseReviews';
import PrivacyPolicy from '@/pages/PrivacyPolicy';

import './i18n';

// Protected Route Component
function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: ('student' | 'teacher' | 'admin')[];
}) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Layout with Navbar and Footer
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 min-w-0 overflow-x-clip">
        {children}
      </main>
      <Footer />
    </div>
  );
}

// Simple Layout without Footer (for auth pages)
function SimpleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell min-h-screen overflow-x-clip">
      {children}
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          <MainLayout>
            <Home />
          </MainLayout>
        } 
      />
      <Route 
        path="/courses" 
        element={
          <MainLayout>
            <Courses />
          </MainLayout>
        } 
      />
      <Route 
        path="/courses/:id" 
        element={
          <MainLayout>
            <CourseDetail />
          </MainLayout>
        } 
      />
      <Route 
        path="/teachers" 
        element={
          <MainLayout>
            <Teachers />
          </MainLayout>
        } 
      />
      <Route 
        path="/teachers/:id" 
        element={
          <MainLayout>
            <TeacherDetail />
          </MainLayout>
        } 
      />
      <Route 
        path="/tests" 
        element={
          <MainLayout>
            <Tests />
          </MainLayout>
        } 
      />
      <Route 
        path="/exam-panel" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentExamPanel />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exam-panel/results" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentExamPanel />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exam-panel/keys" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentExamPanel />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exam-panel/keys/:resultId" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentExamAnswerKeyDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tests/:id" 
        element={
          <MainLayout>
            <TestDetail />
          </MainLayout>
        } 
      />
      <Route 
        path="/contact" 
        element={
          <MainLayout>
            <Contact />
          </MainLayout>
        } 
      />
      <Route 
        path="/privacy" 
        element={
          <MainLayout>
            <PrivacyPolicy />
          </MainLayout>
        } 
      />

      {/* Auth Routes */}
      <Route 
        path="/login" 
        element={
          <SimpleLayout>
            <Login />
          </SimpleLayout>
        } 
      />
      <Route 
        path="/register" 
        element={
          <SimpleLayout>
            <Register />
          </SimpleLayout>
        } 
      />

      {/* Student Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MainLayout>
              <StudentDashboard />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/profile" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MainLayout>
              <StudentProfile />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/completed-tests" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MainLayout>
              <StudentCompletedTests />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/courses/:id/watch" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MainLayout>
              <CourseWatch />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/certificates" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MainLayout>
              <StudentCertificates />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/courses/create" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <CreateCourse />
            </MainLayout>
          </ProtectedRoute>
        } 
      />

      {/* Teacher Routes */}
      <Route 
        path="/teacher/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <TeacherDashboard />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/students" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <TeacherStudents />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/tests" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <TeacherTests />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/exam-panel" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <TeacherExamPanel />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/videos" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <TeacherVideos />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/course-reviews" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <TeacherCourseReviews />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/profile" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <TeacherProfile />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/upload" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <UploadVideo />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/test/create" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <CreateTest />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/courses/:id" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <TeacherCourseEdit />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/tests/:id" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <TeacherTestEdit />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/tests/:id/results" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <TeacherTestResults />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function InitialSiteLoader({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'visible' | 'exiting' | 'hidden'>('visible');

  useEffect(() => {
    const minimumVisibleDuration = 1200;
    const fadeDuration = 320;
    const startTime = Date.now();
    let exitTimerId: number | null = null;
    let completeTimerId: number | null = null;

    const finishLoading = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(minimumVisibleDuration - elapsed, 0);

      exitTimerId = window.setTimeout(() => {
        setPhase('exiting');
        completeTimerId = window.setTimeout(() => {
          setPhase('hidden');
          onComplete();
        }, fadeDuration);
      }, remaining);
    };

    if (document.readyState === 'complete') {
      finishLoading();
    } else {
      window.addEventListener('load', finishLoading, { once: true });
    }

    return () => {
      window.removeEventListener('load', finishLoading);

      if (exitTimerId !== null) {
        window.clearTimeout(exitTimerId);
      }

      if (completeTimerId !== null) {
        window.clearTimeout(completeTimerId);
      }
    };
  }, [onComplete]);

  if (phase === 'hidden') {
    return null;
  }

  return (
    <div className={`site-entry-loader fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-[#f4ead1] ${phase === 'exiting' ? 'site-entry-loader--exit' : ''}`}>
      <div className="site-entry-loader__glow site-entry-loader__glow--left" />
      <div className="site-entry-loader__glow site-entry-loader__glow--right" />

      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        <div className="site-entry-loader__seal flex h-28 w-28 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-white shadow-[0_24px_70px_rgba(168,122,31,0.16)]">
          <div className="site-entry-loader__ring h-20 w-20 rounded-full border-4 border-[#D4AF37]/25 border-t-[#B88A1B] border-r-[#D4AF37]" />
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.38em] text-[#A87A1F]">{t('brand.name')}</p>
          <h1 className="mt-3 text-3xl font-black tracking-[0.08em] text-slate-900 sm:text-4xl">{t('loader.preparing')}</h1>
          <p className="mt-2 max-w-sm text-sm text-slate-600">{t('loader.loading_desc')}</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isInitialLoaderComplete, setIsInitialLoaderComplete] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <InitialSiteLoader onComplete={() => setIsInitialLoaderComplete(true)} />
        <div className={isInitialLoaderComplete ? 'opacity-100 transition-opacity duration-300' : 'pointer-events-none invisible opacity-0'}>
          <ScrollToTop />
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
            </div>
          }>
            <AppRoutes />
          </Suspense>
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            toastOptions={{
              style: {
                fontFamily: 'Inter, sans-serif',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
