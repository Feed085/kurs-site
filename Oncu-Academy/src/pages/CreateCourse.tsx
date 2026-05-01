import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon,
  BookOpen,
  Layout,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/services/publicApi';

import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CreateCourse() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    price: '',
    hasCertificate: false,
    description: '',
    image: null as File | null,
    imageUrl: '' as string
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();

        if (data.success) {
          const normalizedCategories = (data.data || []).map((category: any) => ({
            id: category.id || category.slug,
            name: category.name
          }));

          setCategories(normalizedCategories);

          setFormData((prev) => {
            if (prev.category || normalizedCategories.length === 0) {
              return prev;
            }

            return { ...prev, category: normalizedCategories[0].name };
          });
        }
      } catch (error) {
        console.error('Kateqoriyalar yüklənə bilmədi', error);
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ 
        ...prev, 
        image: file,
        imageUrl: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = formData.title.trim();
    const trimmedDescription = formData.description.trim();
    const trimmedPrice = formData.price.trim();

    if (!trimmedTitle) {
      toast.error('Kurs başlığı məcburidir');
      return;
    }

    if (!formData.category) {
      toast.error('Zəhmət olmasa əsas xanalara məlumat yazın');
      return;
    }

    if (!trimmedDescription) {
      toast.error('Haqqında bölməsi məcburidir');
      return;
    }

    if (!trimmedPrice) {
      toast.error('Qiymət məcburidir');
      return;
    }

    const priceValue = Number(trimmedPrice);

    if (!Number.isFinite(priceValue) || priceValue < 0) {
      toast.error('Qiymət etibarlı rəqəm olmalıdır');
      return;
    }

    if (!formData.image) {
      toast.error('Kover şəkli məcburidir');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('rim_auth_token');
      if (!token) {
        toast.error('Sessiyanız bitib, yenidən giriş edin');
        navigate('/login');
        return;
      }

      let uploadedImageUrl = ''; // R2 Linki burada tutulacaq

      // R2 Kover yükləmə mərhələsi
      if (formData.image) {
        const uploadData = new FormData();
        uploadData.append('file', formData.image);

        const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: uploadData
        });

        const uploadResult = await uploadRes.json();
        if (!uploadResult.success) {
          throw new Error('Kover şəkli yüklənə bilmədi: ' + uploadResult.message);
        }
        uploadedImageUrl = uploadResult.data.url;
      }

      // Backend Kurs yaradılma mərhələsi
      const newCourse = {
        title: trimmedTitle,
        category: formData.category,
        price: priceValue,
        description: trimmedDescription,
        hasCertificate: formData.hasCertificate,
        image: uploadedImageUrl,
      };

      const courseRes = await fetch(`${API_BASE_URL}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCourse)
      });

      const courseData = await courseRes.json();
      
      if (courseData.success) {
        toast.success('Yeni kurs uğurla yaradıldı!');
        // Kurs yaradıldıqdan sonra gələcəkdə "Video idarə" pəncərəsinə yönləndiriləcək
        // Şimdilik dashboard-da görünsün
        navigate('/teacher/dashboard');
      } else {
        throw new Error(courseData.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Xəta baş verdi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-shell min-h-screen bg-[#F3F3F3] pt-[calc(var(--site-header-height)+1rem)] sm:pt-[calc(var(--site-header-height)+1.5rem)] pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-start gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Yeni Kurs Yarat</h1>
            <p className="text-gray-600">Tələbələr üçün yeni bir təlim proqramı hazırlayın</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-[#D4AF37]" />
                  Kursun Məlumatları
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kursun Adı</label>
                    <div className="relative">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Məs: IELTS Preparation Mastery"
                        className="pl-12 h-12 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kateqoriya</label>
                    <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                      <SelectTrigger className="w-full h-12 rounded-xl bg-white border-gray-200">
                        <div className="flex items-center gap-3">
                          <Tag className="w-5 h-5 text-gray-400" />
                          <SelectValue placeholder="Kateqoriya seçin" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl">
                        {isCategoriesLoading && (
                          <SelectItem value="loading" disabled className="py-2.5 px-4 rounded-lg">
                            Kateqoriyalar yüklənir...
                          </SelectItem>
                        )}
                        {!isCategoriesLoading && categories.length === 0 && (
                          <SelectItem value="empty" disabled className="py-2.5 px-4 rounded-lg">
                            Kateqoriya tapılmadı
                          </SelectItem>
                        )}
                        {!isCategoriesLoading && categories.map((cat: any) => (
                          <SelectItem
                            key={cat.id}
                            value={cat.name}
                            className="py-2.5 px-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Haqqında</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Kurs barədə ətraflı məlumat..."
                      required
                      className="rounded-xl min-h-[150px] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Qiymət (AZN)</label>
                      <Input
                        type="number"
                        min="0"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="Məs: 50 (Ödənişsizsə 0 yazın)"
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="flex items-center pt-8">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasCertificate}
                          onChange={(e) => setFormData({ ...formData, hasCertificate: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                        />
                        <span className="text-sm font-medium text-gray-700">Sonda Sertifikat veriləcək</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 xl:sticky xl:top-[calc(var(--site-header-height)+1rem)]">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#D4AF37]" />
                  Kover Şəkli
                </h3>

                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 relative group cursor-pointer">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="w-10 h-10 mb-2" />
                      <span className="text-xs">Şəkil seçin</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} required className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <p className="text-[10px] text-gray-500 mt-2 text-center uppercase tracking-wider">
                  Tövsiyə olunan ölçü: 1280x720 (16:9)
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#D4AF37] hover:bg-[#B88A1B] text-white font-bold h-14 rounded-2xl shadow-lg shadow-[#D4AF37]/20 transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Kursu Yadda Saxla
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
