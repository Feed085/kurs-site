import { Link } from 'react-router-dom';
import { FileText, Database, Share2, PenLine, ArrowRight, Lock } from 'lucide-react';

const policySections = [
  {
    id: 1,
    title: 'Toplanan Şəxsi Məlumatlar',
    description:
      'Platformada qeydiyyatdan keçərkən, dərslərə abunə olarkən və ya əlaqə formundan istifadə edərkən sizdən ad, soyad, e-poçt ünvanı, təhsil/fəaliyyət məlumatlarınız, eləcə də sistemə giriş üçün IP ünvanları toplanıla bilər. Həmçinin, platforma identifikasiya məqsədilə profil şəklinizin və ya biometrik sifət təsdiqləmənizin göndərilməsini tələb edə bilər (müəllimlər üçün).',
    icon: Database,
    accent: 'text-[#A87A1F]',
  },
  {
    id: 2,
    title: 'Məlumatların Paylaşılması',
    description:
      'Sizin şəxsi məlumatlarınız heç bir üçüncü tərəf kommersiya şirkətlərinə və ya reklam agentliklərinə satılmır. Məlumatlar yalnız Azərbaycan Respublikasının qanunvericiliyi tələb etdiyi hallarda müvafiq icra orqanlarına təqdim edilə bilər. Dərs zamanı paylaşılan məzmun və adınız eyni sinifdəki digər iştirakçılara görünə bilər.',
    icon: Share2,
    accent: 'text-[#F59E0B]',
  },
  {
    id: 3,
    title: 'Siyasətdə Dəyişikliklər və Razılıq',
    description:
      'Sizin Akademiyanız bu məxfilik siyasətini əvvəlcədən bildiriş etmədən, texnoloji və qanunvericilik yeniliklərinə uyğunlaşdırmaq məqsədilə yeniləyə bilər. Platformadan istifadə edərək siz bu şərtlərlə tam razılaşdığınızı bəyan edirsiniz.',
    icon: PenLine,
    accent: 'text-[#EF4444]',
  },
  {
    id: 4,
    title: 'Məxfilik və Təhlükəsizlik',
    description:
      'Məlumatlarınız yalnız xidmətin düzgün işləməsi, təhlükəsizliyin qorunması və sizə daha yaxşı tədris təcrübəsi təqdim edilməsi üçün istifadə olunur. Bu məlumatların qorunması üçün lazımi təhlükəsizlik tədbirləri görülür.',
    icon: Lock,
    accent: 'text-[#8B5CF6]',
  },
];

export default function PrivacyPolicy() {
  return (
    <main className="relative overflow-hidden bg-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.09),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.08),_transparent_34%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Məxfilik Siyasəti
          </h1>
          <div className="mx-auto mt-3 h-1 w-14 rounded-full bg-[#D4AF37]" />
        </div>

        <section className="rounded-3xl bg-white p-4 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] ring-1 ring-slate-200 sm:p-6 lg:p-8">
          <div className="rounded-2xl bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] p-5 text-slate-800 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#A87A1F] text-white shadow-md shadow-blue-200">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold leading-7 text-slate-900 sm:text-xl">
                  Məlumatlarınızın qorunması bizim üçün vacibdir
                </h2>
                <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-700 sm:text-[15px]">
                  Sizin Akademiyanız onlayn təhsil platforması olaraq (bundan sonra &quot;Sizin Akademiyanız&quot; və ya
                  &quot;Platforma&quot;) şəxsi məlumatlarınızın təhlükəsizliyinə xüsusi həssaslıqla
                  yanaşırıq. Bu Məxfilik Siyasəti hansı məlumatların toplandığını və necə istifadə
                  olunduğunu izah edir.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {policySections.map((section) => {
              const Icon = section.icon;

              return (
                <article
                  key={section.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 ${section.accent}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {section.id}. {section.title}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-[15px]">
                    {section.description}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#A87A1F]">
                <ArrowRight className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Məxfilik siyasətində dəyişikliklər və razılıq
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-[15px]">
                  Sizin Akademiyanız bu məxfilik siyasətini əvvəlcədən bildiriş etmədən, texnoloji və
                  qanunvericilik yeniliklərinə uyğunlaşdırmaq məqsədilə yeniləyə bilər.
                  Platformadan istifadə edərək siz bu şərtlərlə tam razılaşdığınızı bəyan
                  edirsiniz. Məxfilik siyasəti ilə bağlı hər hansı sualınız yaranarsa, zəhmət
                  olmasa{' '}
                  <Link to="/contact" className="font-semibold text-[#A87A1F] hover:underline">
                    Əlaqə bölməsindən
                  </Link>{' '}
                  müraciət edin.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}