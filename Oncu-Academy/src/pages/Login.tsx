import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, GraduationCap, UserCircle } from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, unknown>
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = 'google-identity-services-script';

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Google girişi yüklənmədi')), { once: true });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google girişi yüklənmədi'));
    document.head.appendChild(script);
  });
};

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loginWithGoogle, isLoading } = useAuth();
  const googleButtonHostRef = useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    let isMounted = true;

    const initGoogle = async () => {
      if (!clientId) {
        return;
      }

      try {
        await loadGoogleScript();

        if (!isMounted || !window.google?.accounts?.id) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            const credential = response.credential;

            if (!credential) {
              toast.error('Google məlumatı alınmadı');
              return;
            }

            const success = await loginWithGoogle(credential, role);

            if (success) {
              toast.success('Uğurla daxil oldunuz!');
              navigate(role === 'student' ? '/dashboard' : '/teacher/dashboard');
              return;
            }

            toast.error('Giriş məlumatları yanlışdır və ya hesab tapılmadı');
          },
        });

        if (googleButtonHostRef.current) {
          googleButtonHostRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleButtonHostRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            width: '280',
          });
        }
      } catch (error) {
        if (isMounted) {
          toast.error(error instanceof Error ? error.message : 'Google girişi yüklənmədi');
        }
      }
    };

    initGoogle();

    return () => {
      isMounted = false;
    };
  }, [clientId, loginWithGoogle, navigate, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Həm tələbə, həm müəllim girişi API-ya göndərilir
    const success = await login(formData.email, formData.password, role);
    if (success) {
      toast.success('Uğurla daxil oldunuz!');
      if (role === 'student') {
        navigate('/dashboard');
      } else {
        navigate('/teacher/dashboard');
      }
    } else {
      toast.error('Giriş məlumatları yanlışdır və ya hesab tapılmadı');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-[#F3F3F3] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-black text-gray-900">
            Sizin Akademiyanız
          </Link>
          <h2 className="mt-6 text-3xl font-black text-gray-900">
            {t('auth.login.title')}
          </h2>
          <p className="mt-2 text-gray-600">
            {t('auth.login.subtitle')}
          </p>
        </div>

        {/* Role Selection */}
        <div className="bg-white rounded-2xl p-1.5 flex gap-1 mb-6 shadow-sm">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
              role === 'student'
                ? 'bg-[#D4AF37] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            {t('auth.role.student')}
          </button>
          <button
            type="button"
            onClick={() => setRole('teacher')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
              role === 'teacher'
                ? 'bg-[#D4AF37] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UserCircle className="w-5 h-5" />
            {t('auth.role.teacher')}
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-gray-200/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">
                {t('auth.login.email')}
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className="pl-11 h-12 rounded-xl border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">
                {t('auth.login.password')}
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pl-11 pr-11 h-12 rounded-xl border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="text-sm text-gray-600">Məni xatırla</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-[#D4AF37] hover:text-[#B88A1B] font-medium"
              >
                {t('auth.login.forgot_password')}
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#D4AF37] hover:bg-[#B88A1B] text-white font-semibold rounded-xl h-12 transition-all"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t('auth.login.submit')
              )}
            </Button>

          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-gray-500">və ya</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="relative flex justify-center">
            <button
              type="button"
              className="flex items-center justify-center py-3 px-6 w-full max-w-[280px] bg-white text-gray-700 border border-gray-300 shadow-sm rounded-xl hover:bg-[#4285F4]/10 hover:border-[#4285F4]/50 transition-all duration-1000 ease-in-out group"
            >
              <div className="p-0.5 rounded-sm">
                <svg className="w-5 h-5 transition-transform duration-1000 ease-in-out group-hover:rotate-[360deg]" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium overflow-hidden whitespace-nowrap max-w-0 opacity-0 transition-all duration-1000 ease-in-out group-hover:max-w-[100px] group-hover:ml-3 group-hover:opacity-100">
                Google
              </span>
            </button>
            <div
              ref={googleButtonHostRef}
              className="absolute inset-0 z-10 flex justify-center opacity-0"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Register Link */}
        <p className="mt-6 text-center text-gray-600">
          {t('auth.login.no_account')}{' '}
          <Link
            to="/register"
            className="text-[#D4AF37] hover:text-[#B88A1B] font-semibold"
          >
            {t('auth.login.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
