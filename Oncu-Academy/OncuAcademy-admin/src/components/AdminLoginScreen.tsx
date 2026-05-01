import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, RefreshCw, Shield, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/services/api';

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

type AdminUser = {
  email: string;
  name: string;
  picture?: string;
};

type AdminLoginScreenProps = {
  onAuthenticated: (session: { token: string; user: AdminUser }) => void;
};

const GOOGLE_SCRIPT_ID = 'google-identity-services-script';
const ADMIN_LOGO_SRC = '/image.png';

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

export default function AdminLoginScreen({ onAuthenticated }: AdminLoginScreenProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    document.title = 'Sizin Akademiyanız — Admin Girişi';
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initGoogle = async () => {
      if (!clientId) {
        if (isMounted) {
          setStatusMessage('VITE_GOOGLE_CLIENT_ID təyin edilməyib.');
          setIsReady(false);
        }
        return;
      }

      try {
        setIsConnecting(true);
        await loadGoogleScript();

        if (!isMounted || !buttonRef.current || !window.google?.accounts?.id) {
          return;
        }

        const buttonWidth = Math.max(Math.min(buttonRef.current.clientWidth || 0, 420), 240);

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            const credential = response.credential;
            if (!credential) {
              toast.error('Google məlumatı alınmadı');
              return;
            }

            try {
              const result = await adminApi.googleLogin(credential);
              if (result.success && result.data?.token) {
                onAuthenticated({
                  token: result.data.token,
                  user: result.data.user,
                });
                toast.success('Admin girişi uğurlu oldu');
                return;
              }

              toast.error(result.message || 'Giriş icazəsi yoxlanılmadı');
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Google girişi uğursuz oldu');
            }
          },
        });

        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: buttonWidth,
        });
        window.google.accounts.id.prompt();

        if (isMounted) {
          setIsReady(true);
          setStatusMessage('Yalnız icazəli Google hesabları giriş edə bilər.');
        }
      } catch (error) {
        if (isMounted) {
          setStatusMessage(error instanceof Error ? error.message : 'Google girişi yüklənmədi');
          setIsReady(false);
        }
      } finally {
        if (isMounted) {
          setIsConnecting(false);
        }
      }
    };

    initGoogle();

    return () => {
      isMounted = false;
    };
  }, [clientId, onAuthenticated]);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F8FAFC] text-gray-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 -top-16 hidden h-60 w-60 rounded-full bg-[#D4AF37]/12 blur-3xl sm:block lg:-left-24 lg:-top-24 lg:h-72 lg:w-72" />
        <div className="absolute bottom-0 right-0 hidden h-72 w-72 rounded-full bg-[#B88A1B]/10 blur-3xl sm:block lg:h-96 lg:w-96" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="flex flex-col justify-center rounded-[32px] border border-gray-100 bg-white p-6 shadow-2xl shadow-gray-200/60 backdrop-blur-sm sm:p-8 lg:p-12">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#D4AF37]/15 bg-[#D4AF37]/10 px-4 py-2 text-sm font-semibold text-[#B88A1B]">
              <Sparkles className="h-4 w-4" />
              Google ilə Admin Girişi
            </div>

            <div className="flex items-center gap-4">
              <img
                src={ADMIN_LOGO_SRC}
                alt="Sizin Akademiyanız"
                className="h-16 w-16 rounded-[24px] object-cover shadow-lg ring-1 ring-black/5 sm:h-20 sm:w-20"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                  Sizin Akademiyanız
                </p>
                <h1 className="mt-1 text-3xl font-black leading-tight text-gray-900 sm:text-4xl">
                  Admin panelə giriş
                </h1>
              </div>
            </div>

            <p className="mt-5 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
              Daxil olmaq üçün Google hesabınızı seçin. Backend icazəli email siyahısını yoxlayacaq və uyğun olmayan hesabları avtomatik rədd edəcək.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
                Mobil və masaüstü üçün optimallaşdırılıb
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
                Yalnız icazəli hesablar giriş edə bilər
              </div>
            </div>

          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-[32px] border border-gray-100 bg-white p-5 text-gray-900 shadow-2xl shadow-gray-200/60 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#B88A1B]">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Admin Girişi</h2>
                  <p className="text-sm text-gray-500">Yalnız icazəli Google hesabları</p>
                </div>
              </div>

              <div className="space-y-4">
                <div
                  ref={buttonRef}
                  className="min-h-[44px] overflow-hidden rounded-full"
                />

                {!isReady && (
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isConnecting ? 'animate-spin' : ''}`} />
                    Yenilə
                  </button>
                )}
              </div>

              <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                {statusMessage || 'Google düyməsi yüklənir...'}
              </div>

              <a
                href="https://support.google.com/accounts/answer/200744"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#B88A1B] transition-colors hover:text-[#A87A1F]"
              >
                Hesab icazələrini yoxla
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
