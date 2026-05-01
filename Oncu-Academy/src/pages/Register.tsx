import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';


export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const termsSections = [
    {
      number: 1,
      title: t('footer.termsDialog.sections.general.title'),
      body: t('footer.termsDialog.sections.general.body'),
    },
    {
      number: 2,
      title: t('footer.termsDialog.sections.userResponsibility.title'),
      body: t('footer.termsDialog.sections.userResponsibility.body'),
    },
    {
      number: 3,
      title: t('footer.termsDialog.sections.privacy.title'),
      body: t('footer.termsDialog.sections.privacy.body'),
    },
    {
      number: 4,
      title: t('footer.termsDialog.sections.teacherResponsibility.title'),
      body: t('footer.termsDialog.sections.teacherResponsibility.body'),
    },
    {
      number: 5,
      title: t('footer.termsDialog.sections.studentResponsibility.title'),
      body: t('footer.termsDialog.sections.studentResponsibility.body'),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If not on the last step, just go to the next step
    if (step < 3) {
      // Basic validation for steps
      if (step === 1 && (!formData.name || !formData.surname)) {
        toast.error('Zəhmət olmasa ad və soyadınızı daxil edin');
        return;
      }
      if (step === 2 && (!formData.email || !formData.phone)) {
        toast.error('Zəhmət olmasa email və telefon nömrənizi daxil edin');
        return;
      }
      
      setStep(step + 1);
      return;
    }

    // On the last step, perform registration
    if (formData.password !== formData.confirmPassword) {
      toast.error('Şifrələr uyğun gəlmir');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Şifrə ən azı 6 simvoldan ibarət olmalıdır');
      return;
    }

    if (!acceptedTerms) {
      toast.error(t('auth.register.accept_terms_error'));
      return;
    }

    const success = await register({
      name: formData.name,
      surname: formData.surname,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: 'student', // Registering as student since teacher role selection was removed
    });

    if (success) {
      toast.success('Qeydiyyat uğurla tamamlandı!');
      navigate('/dashboard');
    } else {
      toast.error('Qeydiyyat zamanı xəta baş verdi');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-700 font-medium">
                  {t('auth.register.name')}
                </Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ad"
                    className="pl-11 h-12 rounded-xl border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="surname" className="text-gray-700 font-medium">
                  {t('auth.register.surname')}
                </Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="surname"
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    placeholder="Soyad"
                    className="pl-11 h-12 rounded-xl border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">
                {t('auth.register.email')}
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
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                {t('auth.register.phone')}
              </Label>
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+994 50 123 45 67"
                  className="pl-11 h-12 rounded-xl border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">
                {t('auth.register.password')}
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
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                {t('auth.register.confirm_password')}
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pl-11 pr-11 h-12 rounded-xl border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="acceptTerms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="w-5 h-5 rounded border-2 border-gray-400 data-[state=checked]:border-[#D4AF37] data-[state=checked]:bg-[#D4AF37]"
              />
              <div className="text-gray-500 font-medium select-none">
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-[#D4AF37] hover:text-[#B88A1B] font-bold appearance-none bg-transparent p-0 m-0 cursor-pointer outline-none mb-0 leading-none align-baseline"
                      style={{ fontSize: 'inherit' }}
                    >
                      İstifadə şərtləri
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto w-[90vw]">
                    <DialogHeader className="text-left">
                      <DialogTitle>{t('footer.termsDialog.title')}</DialogTitle>
                    </DialogHeader>
                    <ol className="space-y-3">
                      {termsSections.map((section) => (
                        <li
                          key={section.number}
                          className="rounded-lg border border-slate-200 bg-slate-50/80 p-4"
                        >
                          <h4 className="font-semibold text-slate-900">
                            {section.number}. {section.title}
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {section.body}
                          </p>
                        </li>
                      ))}
                    </ol>
                    <div className="flex justify-end pt-2">
                      <DialogClose asChild>
                        <Button variant="outline" size="sm">
                          {t('footer.termsDialog.close')}
                        </Button>
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>
                <Label
                  htmlFor="acceptTerms"
                  className="cursor-pointer text-gray-500 font-medium pl-1 text-[inherit]"
                >
                   ilə razıyam
                </Label>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
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
            {t('auth.register.title')}
          </h2>
          <p className="mt-2 text-gray-600">
            {t('auth.register.subtitle')}
          </p>
        </div>



        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                s <= step ? 'bg-[#D4AF37]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-gray-200/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {renderStep()}

            <div className="flex gap-3">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 h-12 rounded-xl border-gray-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading || (step === 3 && !acceptedTerms)}
                className="flex-1 bg-[#D4AF37] hover:bg-[#B88A1B] text-white font-semibold rounded-xl h-12 transition-all"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : step === 3 ? (
                  t('auth.register.submit')
                ) : (
                  'Davam et'
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Login Link */}
        <p className="mt-6 text-center text-gray-600">
          {t('auth.register.have_account')}{' '}
          <Link
            to="/login"
            className="text-[#D4AF37] hover:text-[#B88A1B] font-semibold"
          >
            {t('auth.register.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
