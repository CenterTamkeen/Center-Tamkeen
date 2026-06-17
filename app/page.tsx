import Link from "next/link";
import Image from "next/image";

import { getPublicHeroAnnouncements } from "@/lib/announcements/data";
import { HeroAnnouncementsSlider } from "@/components/site/hero-announcements-slider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { CourseCard } from "@/components/storefront/course-card";
import { EmptyState } from "@/components/storefront/empty-state";
import { ReviewCard } from "@/components/storefront/review-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getCurrentUserProfile, getRoleHomePath } from "@/lib/auth/roles";
import {
  getFeaturedTeachers,
  getLatestCourses,
  getLatestReviews,
  type TeacherSummary,
} from "@/lib/storefront/data";

const subjects = [
  { title: "الفيزياء", tone: "bg-[#eef7ff]", icon: "Φ" },
  { title: "الكيمياء", tone: "bg-[#eefbf5]", icon: "K" },
  { title: "الرياضيات", tone: "bg-[#fff8df]", icon: "∑" },
  { title: "الأحياء", tone: "bg-[#f0f9f1]", icon: "DNA" },
  { title: "العربي", tone: "bg-[#fff1f1]", icon: "ض" },
  { title: "الإنجليزي", tone: "bg-[#f3f0ff]", icon: "EN" },
];

const features = [
  {
    title: "مدرسين متخصصين",
    text: "اختار مدرسك وشوف كورساته وتفاصيله قبل الاشتراك.",
    icon: "👥",
  },
  {
    title: "محتوى منظم",
    text: "كل كورس متقسم لحصص واضحة ومتابعة سهلة.",
    icon: "▷",
  },
  {
    title: "حساب طالب",
    text: "بوابة للطالب لمتابعة الاشتراكات والطلبات.",
    icon: "▣",
  },
  {
    title: "إدارة قوية",
    text: "لوحات للمدرس والإدارة لمتابعة الكورسات والطلاب.",
    icon: "↗",
  },
];

const steps = [
  ["01", "سجّل حسابك", "أنشئ حساب طالب وادخل على المنصة."],
  ["02", "اختار كورسك", "تصفح المواد والمدرسين واختار المناسب."],
  ["03", "ابدأ التعلم", "تابع الحصص والمحتوى من مكان واحد."],
];

export default async function Home() {
  const [teachers, courses, reviews, session, announcements] =
    await Promise.all([
      getFeaturedTeachers(6),
      getLatestCourses(6),
      getLatestReviews(3),
      getCurrentUserProfile(),
      getPublicHeroAnnouncements(),
    ]);
  const dashboardHref = session ? getRoleHomePath(session.profile.role) : null;

  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <section className="border-border/60 relative overflow-hidden border-b bg-[linear-gradient(180deg,#ffffff_0%,#f5faf8_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgb(22_138_117/0.08),transparent_28%),radial-gradient(circle_at_78%_30%,rgb(245_197_24/0.12),transparent_24%)]" />
          <div className="container-page relative grid min-h-[860px] items-center gap-14 py-24 lg:grid-cols-[1fr_580px] lg:py-32">
            <div className="max-w-4xl space-y-8">
              <div className="chip">منصة تعليمية لطلاب الثانوية العامة</div>
              <div className="space-y-4">
                <h1 className="heading-gradient text-5xl leading-tight font-black sm:text-6xl lg:text-7xl">
                  ابدأ رحلتك في تمكين بثقة وتنظيم
                </h1>
                <p className="text-foreground/65 max-w-3xl text-xl leading-10">
                  كورسات منظمة، مدرسين متخصصين، وتجربة عربية بسيطة تساعدك توصل
                  للمادة والمدرس المناسب بسرعة.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/courses" className="btn-primary px-7 py-3.5">
                  تصفح الكورسات
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <HeroAnnouncementsSlider announcements={announcements} />
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[#eefbf5] p-5">
                  <p className="text-primary-700 text-3xl font-black">
                    <AnimatedCounter target={teachers.length} />+
                  </p>
                  <p className="text-foreground/55 mt-1 text-sm font-bold">
                    مدرس متاح
                  </p>
                </div>
                <div className="rounded-2xl bg-[#fff8df] p-5">
                  <p className="text-accent-700 text-3xl font-black">
                    <AnimatedCounter target={courses.length} />+
                  </p>
                  <p className="text-foreground/55 mt-1 text-sm font-bold">
                    كورس منشور
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="teachers" className="container-page py-20">
          <SectionTitle eyebrow="المدرسين" title="اختار مدرسك وابدأ" />
          {teachers.length > 0 ? (
            <TeachersMarquee teachers={teachers} />
          ) : (
            <EmptyState
              title="لسه مفيش مدرسين ظاهرين"
              description="بعد إضافة المدرسين وتفعيلهم، هيظهروا هنا تلقائيًا."
            />
          )}
        </section>

        <section className="bg-[#f6f8fa] py-20">
          <div className="container-page">
            <SectionTitle eyebrow="الكورسات" title="أحدث الكورسات المنشورة" />
            {courses.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course, i) => (
                  <ScrollReveal key={course.id} delay={i * 0.06}>
                    <CourseCard course={course} />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <EmptyState
                title="لسه مفيش كورسات منشورة"
                description="أول ما المدرسين ينشروا كورساتهم، هتظهر هنا."
              />
            )}
          </div>
        </section>

        <section className="container-page py-14">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["500+", "طالب مستهدف"],
              ["50+", "حصة تعليمية"],
              ["24/7", "وصول للمحتوى"],
            ].map(([value, label]) => (
              <ScrollReveal key={label}>
                <div className="group hover:bg-primary-50 relative overflow-hidden rounded-2xl bg-[#f6f8fa] p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]">
                  <div className="bg-primary-500 absolute inset-x-6 top-0 h-1 origin-center scale-x-0 rounded-b-full transition-transform duration-300 group-hover:scale-x-100" />
                  <p className="text-primary-900 text-3xl font-black">
                    {value}
                  </p>
                  <p className="text-foreground/55 group-hover:text-primary-700 mt-2 text-sm font-semibold transition-colors duration-300">
                    {label}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <section className="container-page py-16">
          <ScrollReveal>
            <div className="mb-9 text-center">
              <p className="eyebrow">المواد</p>
              <h2 className="text-primary-950 mt-2 text-3xl font-black">
                تعلم المادة المناسبة لك
              </h2>
              <p className="text-foreground/55 mt-3">
                كل المواد الأساسية في مكان واحد، ومع كل مدرس كورساته.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject, index) => (
              <ScrollReveal key={subject.title} delay={index * 0.05}>
                <div
                  className={`${subject.tone} group hover:border-primary-200 flex items-center justify-between rounded-2xl border border-black/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]`}
                >
                  <p className="font-black">{subject.title}</p>
                  <span className="text-primary-700 flex h-12 min-w-12 items-center justify-center rounded-xl bg-white text-sm font-black shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2">
                    {subject.icon}
                  </span>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/courses" className="btn-secondary px-5 py-3">
              استعراض كل الكورسات
            </Link>
          </div>
        </section>

        <section className="bg-[#f6f8fa] py-20">
          <div className="container-page">
            <ScrollReveal>
              <div className="mb-10 text-center">
                <p className="eyebrow">لماذا تمكين؟</p>
                <h2 className="text-primary-950 mt-2 text-3xl font-black">
                  كل ما تحتاجه في مكان واحد
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <ScrollReveal key={feature.title} delay={index * 0.06}>
                  <article className="group flex h-full flex-col rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]">
                    <div className="bg-primary-50 text-primary-700 mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                      {feature.icon}
                    </div>
                    <h3 className="group-hover:text-primary-700 text-lg font-black transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-foreground/55 mt-3 text-sm leading-7">
                      {feature.text}
                    </p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page py-20">
          <ScrollReveal>
            <div className="mb-12 text-center">
              <p className="eyebrow">كيف تبدأ؟</p>
              <h2 className="text-primary-950 mt-2 text-3xl font-black">
                ثلاث خطوات فقط
              </h2>
            </div>
          </ScrollReveal>
          <div className="relative grid gap-6 md:grid-cols-3">
            <div className="from-primary-900/10 via-primary-900/35 to-primary-900/10 absolute top-15 right-[16.5%] left-[16.5%] hidden h-px bg-gradient-to-l md:block" />
            {steps.map(([number, title, text], index) => (
              <ScrollReveal key={number} delay={index * 0.08}>
                <div className="group hover:bg-primary-50/60 rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
                  <div className="bg-primary-900 relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-white shadow-[var(--shadow-card)] ring-8 ring-white transition-transform duration-300 group-hover:scale-110">
                    {number}
                  </div>
                  <h3 className="group-hover:text-primary-700 mt-5 text-xl font-black transition-colors duration-300">
                    {title}
                  </h3>
                  <p className="text-foreground/55 mt-3 leading-7">{text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <section id="reviews" className="container-page py-20">
          <SectionTitle eyebrow="التقييمات" title="آراء الطلاب" />
          {reviews.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {reviews.map((review, i) => (
                <ScrollReveal key={review.id} delay={i * 0.08}>
                  <ReviewCard review={review} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <EmptyState
              title="لسه مفيش تقييمات"
              description="بعد اشتراك الطلاب وكتابة تقييماتهم، هنستعرض أحدث الآراء هنا."
            />
          )}
        </section>

        <section className="bg-primary-900 relative min-h-[520px] overflow-hidden py-24 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(245_197_24/0.18),transparent_28%),radial-gradient(circle_at_80%_70%,rgb(22_138_117/0.28),transparent_26%)]" />
          <div className="absolute inset-0 [background-image:radial-gradient(circle,rgb(255_255_255/0.5)_1px,transparent_1px)] [background-size:28px_28px] opacity-20" />
          <div className="pointer-events-none absolute inset-x-0 top-8 overflow-hidden">
            <TamkeenTextLoop className="text-white/8" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-10 overflow-hidden">
            <TamkeenTextLoop className="text-white/6 [animation-direction:reverse]" />
          </div>
          <div className="container-page relative text-center">
            <ScrollReveal>
              <div className="relative z-10 mx-auto mt-20 max-w-3xl">
                <div className="mx-auto mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white/90 backdrop-blur">
                  ابدأ رحلتك التعليمية دلوقتي
                </div>
                <h2 className="text-4xl leading-tight font-black sm:text-5xl">
                  جاهز تختار كورسك وتبدأ؟
                </h2>
                <p className="mt-5 text-lg leading-8 text-white/75">
                  أنشئ حساب طالب أو تصفح الكورسات المتاحة، وكل حاجة هتفضل قدامك
                  حتى وأنت في آخر الصفحة.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {dashboardHref ? (
                    <>
                      <Link
                        href={dashboardHref}
                        className="bg-accent-500 text-accent-foreground hover:bg-accent-400 inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-sm font-black shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1"
                      >
                        الدخول للوحة
                      </Link>
                      <Link
                        href="/profile"
                        className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-black text-white backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/15"
                      >
                        الملف الشخصي
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/signup"
                        className="bg-accent-500 text-accent-foreground hover:bg-accent-400 inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-sm font-black shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1"
                      >
                        إنشاء حساب طالب
                      </Link>
                      <Link
                        href="/login"
                        className="inline-flex items-center justify-center rounded-xl border border-white/20 px-7 py-3.5 text-sm font-black text-white/90 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
                      >
                        تسجيل الدخول
                      </Link>
                    </>
                  )}
                  <Link
                    href="/courses"
                    className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-black text-white backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/15"
                  >
                    تصفح الكورسات
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function TeachersMarquee({ teachers }: { teachers: TeacherSummary[] }) {
  const marqueeTeachers = [...teachers, ...teachers];

  return (
    <ScrollReveal>
      <div className="relative overflow-hidden py-5">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
        <div className="tamkeen-marquee flex w-max gap-6 hover:[animation-play-state:paused]">
          {marqueeTeachers.map((teacher, index) => {
            const name = teacher.profile?.full_name ?? "مدرس تمكين";
            const avatar = teacher.avatar_url ?? teacher.profile?.avatar_url;

            return (
              <Link
                key={`${teacher.id}-${index}`}
                href={`/teachers/${teacher.slug}`}
                className="group relative flex w-56 shrink-0 flex-col items-center px-4 py-5 text-center transition-all duration-300 hover:-translate-y-1"
              >
                <span className="bg-primary-600 absolute top-0 z-10 rounded-full px-4 py-1.5 text-xs font-black text-white shadow-[var(--shadow-card)] transition-transform duration-300 group-hover:-translate-y-1">
                  {teacher.subject}
                </span>
                <div className="bg-primary-50 relative mt-5 h-40 w-40 overflow-hidden rounded-full border-4 border-white shadow-[var(--shadow-card)] transition-transform duration-300 group-hover:scale-110">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={name}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="bg-primary-600 flex h-full items-center justify-center text-3xl font-black text-white">
                      {name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <h3 className="text-foreground group-hover:text-primary-700 mt-5 line-clamp-2 min-h-14 text-lg leading-7 font-black transition-colors duration-300">
                  {name}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </ScrollReveal>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <ScrollReveal>
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="text-primary-950 mt-2 text-3xl font-black">{title}</h2>
        </div>
        <Link href="/courses" className="btn-secondary px-4 py-2 text-xs">
          تصفح الكل
        </Link>
      </div>
    </ScrollReveal>
  );
}

function TamkeenTextLoop({ className }: { className: string }) {
  const words = Array.from({ length: 18 });

  return (
    <div className={`tamkeen-loop flex w-max ${className}`}>
      {[0, 1].map((group) => (
        <div key={group} className="flex shrink-0 gap-10 px-5">
          {words.map((_, index) => (
            <span key={`${group}-${index}`} className="text-4xl font-black">
              تمكين
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
