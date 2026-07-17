import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Camera, 
  MapPin, 
  Mail, 
  Phone, 
  Award, 
  BookOpen, 
  Users,
  Star,
  Edit2,
  Save,
  Facebook,
  Instagram,
  Linkedin,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/services/publicApi';

export default function TeacherProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    education: '',
    experience: '',
    specialties: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    location: '',
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
        const res = await fetch(`${API_BASE_URL}/teacher/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const d = await res.json();
        if (d.success) {
           setTeacher({ ...d.data, ...d.stats });
           setFormData({
             name: d.data.name,
             surname: d.data.surname,
             email: d.data.email,
             phone: d.data.phoneNumber || '',
             education: d.data.education || '',
             experience: String(d.data.experience ?? ''),
             specialties: (d.data.specializedAreas || []).join(', '),
             facebook: d.data.socialNetworks?.facebook || '',
             instagram: d.data.socialNetworks?.instagram || '',
             linkedin: d.data.socialNetworks?.linkedin || '',
             location: d.data.location || t('teacher.profile.baku_azerbaijan', { defaultValue: 'Bakı, Azərbaycan' }),
             avatar: d.data.avatar
           });
        }
      } catch (err) {
        toast.error(t('teacher.profile.load_error', { defaultValue: 'Profil yüklənə bilmədi' }));
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

      // Əgər yeni profil kaveri (avatar) seçilibsə əvvəlcə R2-yə yüklə
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
        ...formData,
        avatar: finalAvatarUrl,
        experience: formData.experience ? Number(formData.experience) : 0,
        specialties: formData.specialties.split(',').map((s: string) => s.trim()).filter(Boolean),
        socialLinks: {
          facebook: formData.facebook,
          instagram: formData.instagram,
          linkedin: formData.linkedin
        }
      };

      const res = await fetch(`${API_BASE_URL}/teacher/me`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(updatedProfile)
      });
      
      const d = await res.json();
      if (d.success) {
        setTeacher({ ...d.data, studentCount: teacher.studentCount, courseCount: teacher.courseCount, rating: teacher.rating });
        setFormData(prev => ({ ...prev, avatar: finalAvatarUrl }));
        setAvatarFile(null);
        setIsEditing(false);
        toast.success(t('teacher.profile.updated', { defaultValue: 'Profil yeniləndi!' }));
      } else {
        toast.error(t('common.error_prefix') + d.message);
      }
    } catch(err) {
      toast.error(t('common.server_error', { defaultValue: 'Sunucu ilə əlaqə qurula bilmədi' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    return <div className="min-h-screen pt-24 text-center">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F3F3F3] pt-20 lg:pt-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900 transition-colors mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('common.go_back', { defaultValue: 'Geri qayıt' })}
        </Button>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Profile Header (Simplified, no banner) */}
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative">
              <img
                src={formData.avatar}
                alt={`${formData.name} ${formData.surname}`}
                className="w-32 h-32 lg:w-40 lg:h-40 rounded-3xl object-cover border-4 border-gray-50 shadow-sm"
              />
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
              <p className="text-[#D4AF37] font-bold text-lg mb-4">{formData.specialties || t('teachers.specialty_not_set')}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <MapPin className="w-4 h-4" />
                  {formData.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <Mail className="w-4 h-4" />
                  {formData.email}
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
                    Yadda saxla
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
          {/* Subtle background decoration instead of full banner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-bl-full -mr-8 -mt-8" />
        </div>

        {/* Profile Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ad</label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Soyad</label>
                      <Input
                        name="surname"
                        value={formData.surname}
                        onChange={handleChange}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.email')}</label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('teachers.location')}</label>
                    <Input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder={t('teacher.profile.location_example', { defaultValue: 'Məs: Bakı, Azərbaycan' })}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">{t('teachers.contact_info')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">{t('auth.email')}</p>
                        <p className="text-sm font-bold text-gray-900">{formData.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Telefon</p>
                        <p className="text-sm font-bold text-gray-900">{formData.phone || t('student.not_set', { defaultValue: 'Qeyd edilməyib' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">{t('teachers.location')}</p>
                        <p className="text-sm font-bold text-gray-900">{formData.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>


            {/* Education & Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {t('teacher.profile.education')}
                </h2>
                {isEditing ? (
                  <Textarea
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder={t('teacher.profile.education_example', { defaultValue: 'Məs: Bakı Dövlət Universiteti, Filologiya fakültəsi, Ali təhsil' })}
                    className="rounded-xl min-h-[80px]"
                  />
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 leading-relaxed italic">{formData.education}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {t('teacher.profile.experience')}
                </h2>
                {isEditing ? (
                  <Input
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    type="number"
                    min="0"
                    placeholder={t('teacher.profile.experience_example', { defaultValue: 'Məs: 12' })}
                    className="rounded-xl"
                  />
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#A87A1F]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-[#A87A1F]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 leading-relaxed italic">{formData.experience || 0}</p>
                      <p className="text-sm text-gray-500 mt-1">{t('teachers.teaching_experience')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Specialties */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t('teacher.profile.specialties', { defaultValue: 'İxtisaslaşdığı Sahələr' })}
              </h2>
              {isEditing ? (
                <div className="space-y-4">
                   <Input
                    name="specialties"
                    value={formData.specialties}
                    onChange={handleChange}
                    placeholder={t('teacher.profile.specialties_example', { defaultValue: 'Məs: İngilis dili, IELTS, SAT' })}
                    className="rounded-xl"
                  />
                  <div className="flex flex-wrap gap-2">
                    {['İngilis dili', 'IELTS', 'SAT', 'TOEFL', 'Rus dili', 'Riyaziyyat'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const currentSpecs = formData.specialties.split(',').map((s: string) => s.trim()).filter(Boolean);
                          if (!currentSpecs.includes(tag)) {
                            setFormData(prev => ({ ...prev, specialties: [...currentSpecs, tag].join(', ') }));
                          }
                        }}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.specialties.split(',').map((specialty: string, index: number) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full text-sm font-medium"
                    >
                      {specialty.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Statistika</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-[#D4AF37]" />
                    <span className="text-gray-600">{t('teachers.students')}</span>
                  </div>
                  <span className="font-bold text-gray-900">{teacher?.studentCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-[#A87A1F]" />
                    <span className="text-gray-600">Kurslar</span>
                  </div>
                  <span className="font-bold text-gray-900">{teacher?.courseCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-[#F59E0B]" />
                    <span className="text-gray-600">{t('test.title', { defaultValue: 'Testlər' })}</span>
                  </div>
                  <span className="font-bold text-gray-900">{teacher?.testCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-600">Reytinq</span>
                  </div>
                  <span className="font-bold text-gray-900">{teacher?.rating}/5</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('teachers.social_networks')}</h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                    <Input
                      name="facebook"
                      value={formData.facebook}
                      onChange={handleChange}
                      placeholder={t('common.url_placeholder')}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                    <Input
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleChange}
                      placeholder={t('common.url_placeholder')}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                    <Input
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleChange}
                      placeholder={t('common.url_placeholder')}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              ) : (
                  <div className="space-y-3">
                    {[
                      { name: 'Facebook', icon: Facebook, color: '#1877F2', link: formData.facebook },
                      { name: 'Instagram', icon: Instagram, color: '#E1306C', link: formData.instagram },
                      { name: 'LinkedIn', icon: Linkedin, color: '#0A66C2', link: formData.linkedin }
                    ].map((platform) => (
                      <button
                        key={platform.name}
                        onClick={() => {
                          if (!platform.link || platform.link.trim() === '') {
                            toast.error(t('teacher.profile.social_not_added', { platform: platform.name, defaultValue: `${platform.name} hesabı əlavə edilməyib` }));
                          } else {
                            window.open(platform.link, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          platform.name === 'Facebook' ? 'bg-[#1877F2]/10 hover:bg-[#1877F2]/20' :
                          platform.name === 'Instagram' ? 'bg-gradient-to-r from-[#833AB4]/10 via-[#E1306C]/10 to-[#F77737]/10 hover:from-[#833AB4]/20 hover:via-[#E1306C]/20 hover:to-[#F77737]/20' :
                          'bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20'
                        }`}
                      >
                        <platform.icon 
                          className="w-5 h-5" 
                          style={{ color: platform.name === 'Instagram' ? '#E1306C' : platform.color }} 
                        />
                        <span className="text-gray-700 font-medium">{platform.name}</span>
                      </button>
                    ))}
                  </div>
                )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
