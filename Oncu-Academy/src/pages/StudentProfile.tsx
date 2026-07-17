import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Camera, 
  Mail, 
  Phone, 
  GraduationCap,
  Edit2,
  Save,
  ArrowLeft,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/services/publicApi';

export default function StudentProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    educationLevel: '',
    avatar: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('rim_auth_token');
        if (!token) {
          navigate('/login');
          return;
        }
        const res = await fetch(`${API_BASE_URL}/student/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const d = await res.json();
        if (d.success) {
           setStudent({ ...d.data, ...d.stats });
           setFormData({
             name: d.data.name,
             surname: d.data.surname,
             email: d.data.email,
             phone: d.data.phoneNumber || '',
             educationLevel: d.data.educationLevel || '',
             avatar: d.data.avatar || ''
           });
        }
      } catch (err) {
        toast.error(t('student.profile.load_error', { defaultValue: 'Profil yüklənə bilmədi' }));
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('rim_auth_token');
      setIsLoading(true);

      let finalAvatarUrl = formData.avatar;

      if (avatarFile) {
        const presignReq = await fetch(
          `${API_BASE_URL}/upload/presign?filename=${encodeURIComponent(avatarFile.name)}&contentType=${encodeURIComponent(avatarFile.type)}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const presignData = await presignReq.json();
        if (presignData.success) {
          const { signedUrl, publicUrl } = presignData.data;
          await fetch(signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': avatarFile.type },
            body: avatarFile
          });
          finalAvatarUrl = publicUrl;
        }
      }

      const updatedProfile = {
        name: formData.name,
        surname: formData.surname,
        phoneNumber: formData.phone,
        avatar: finalAvatarUrl,
        educationLevel: formData.educationLevel
      };

      const res = await fetch(`${API_BASE_URL}/student/me`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(updatedProfile)
      });
      
      const d = await res.json();
      if (d.success) {
        setStudent((prev: any) => ({ ...prev, ...updatedProfile, avatar: finalAvatarUrl }));
        setFormData((prev: any) => ({ ...prev, avatar: finalAvatarUrl }));
        setAvatarFile(null);
        setIsEditing(false);
        toast.success(t('student.profile.updated', { defaultValue: 'Profil yeniləndi!' }));
      } else {
        toast.error(t('common.error_prefix') + d.message);
      }
    } catch(err) {
      toast.error(t('common.server_error', { defaultValue: 'Serverlə əlaqə qurula bilmədi' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatar: fakeUrl }));
      setAvatarFile(file);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen pt-24 text-center text-gray-500 font-medium animate-pulse">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F3F3F3] pt-20 lg:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="text-gray-600 hover:text-gray-900 transition-colors mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('student.profile.back_to_dashboard', { defaultValue: 'İdarə Panelinə Qayıt' })}
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt={`${formData.name} ${formData.surname}`}
                  className="w-32 h-32 lg:w-40 lg:h-40 rounded-3xl object-cover border-4 border-gray-50 shadow-sm"
                />
              ) : (
                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-3xl border-4 border-gray-50 shadow-sm bg-gray-100 flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}
              {isEditing && (
                <div className="absolute bottom-2 right-2">
                  <label className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 cursor-pointer border border-gray-100">
                    <Camera className="w-5 h-5 text-[#D4AF37]" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2">
                {formData.name} {formData.surname}
              </h1>
              <p className="text-[#A87A1F] font-bold text-lg mb-4">
                 {t('student.profile.title', { defaultValue: 'Tələbə Profili' })}
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <GraduationCap className="w-4 h-4" />
                  {formData.educationLevel || t('student.profile.education_not_set', { defaultValue: 'Təhsil qeyd edilməyib' })}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <Phone className="w-4 h-4" />
                  {formData.phone || t('student.profile.phone_not_set', { defaultValue: 'Nömrə yoxdur' })}
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 md:relative md:top-auto md:right-auto self-start">
              <Button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className={`${isEditing 
                  ? 'bg-[#D4AF37] hover:bg-[#B88A1B] shadow-lg shadow-[#D4AF37]/20' 
                  : 'bg-gray-900 hover:bg-gray-800 text-white'} rounded-xl font-bold transition-all px-6`}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('common.save', { defaultValue: 'Yadda saxla' })}
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    {t('common.edit', { defaultValue: 'Redaktə et' })}
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#A87A1F]/5 rounded-bl-full -mr-8 -mt-8" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-6 shadow-sm">
             <h3 className="text-xl font-bold text-gray-900 mb-6">{t('student.personal_info')}</h3>
             {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.name', { defaultValue: 'Ad' })}</label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.surname', { defaultValue: 'Soyad' })}</label>
                      <Input
                        name="surname"
                        value={formData.surname}
                        onChange={handleChange}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">{t('student.mobile_number')}</label>
                       <Input
                         name="phone"
                         value={formData.phone}
                         onChange={handleChange}
                         className="rounded-xl"
                         placeholder="05x..."
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">{t('student.education_level')}</label>
                       <select 
                          name="educationLevel" 
                          value={formData.educationLevel}
                          onChange={handleChange}
                          className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                       >
                          <option value="Orta təhsil">{t('student.middle_education')}</option>
                          <option value="Bakalavr">Bakalavr</option>
                          <option value="Magistr">Magistr</option>
                          <option value="Digər">{t('student.other')}</option>
                       </select>
                     </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('student.email_readonly')}</label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="rounded-xl bg-gray-50 border-gray-100"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">{t('student.email_system')}</p>
                      <p className="text-sm font-bold text-gray-900">{formData.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">{t('student.mobile_number')}</p>
                      <p className="text-sm font-bold text-gray-900">{formData.phone || t('student.not_set')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <GraduationCap className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">{t('student.education_level')}</p>
                      <p className="text-sm font-bold text-gray-900">{formData.educationLevel || t('student.not_set')}</p>
                    </div>
                  </div>
                </div>
              )}
          </div>
          
          <div className="bg-[#A87A1F]/5 border-2 border-[#A87A1F]/10 rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#A87A1F]/5 rounded-bl-full -mr-20 -mt-20 pointer-events-none" />
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm z-10 mb-6">
                <GraduationCap className="w-10 h-10 text-[#A87A1F]" />
             </div>
             <h3 className="text-2xl font-black text-gray-900 z-10 mb-2">{t('student.academic_career')}</h3>
             <p className="text-gray-600 mb-6 z-10">
                Kurslara baxın, sınaqlarda iştirak edin və özünüzü inkişaf etdirərək sertifikatlar qazanın.
             </p>
             <Button 
               onClick={() => navigate('/courses')}
               className="bg-[#A87A1F] hover:bg-[#0070D1] text-white rounded-xl shadow-lg shadow-[#A87A1F]/20 font-bold px-8 z-10"
             >
                Kursları Kəşf Et
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
