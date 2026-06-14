import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { CourseCard } from "@/components/storefront/course-card";
import { EmptyState } from "@/components/storefront/empty-state";
import { ReviewCard } from "@/components/storefront/review-card";
import { TeacherCard } from "@/components/storefront/teacher-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  getFeaturedTeachers,
  getLatestCourses,
  getLatestReviews,
} from "@/lib/storefront/data";

export default async function Home() {
  const [teachers, courses, reviews] = await Promise.all([
    getFeaturedTeachers(6),
    getLatestCourses(6),
    getLatestReviews(3),
  ]);

  return (
    <>
      <SiteHeader />
      <main>
        {/* ═══ Hero Section ═══ */}
        <section
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(165deg, #f0f9f6 0%, #f5faf8 30%, #fefcf4 60%, #f5faf8 100%)",
          }}
        >
          {/* Decorative background elements */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "radial-gradient(circle, var(--primary-700) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div
            className="deco-circle animate-float-soft"
            style={{
              width: 600,
              height: 600,
              top: -250,
              right: -250,
              background: "rgb(22 138 117 / 0.07)",
            }}
          />
          <div
            className="deco-circle animate-float-soft"
            style={{
              width: 400,
              height: 400,
              bottom: -150,
              left: -150,
              background: "rgb(245 197 24 / 0.06)",
              animationDelay: "2.5s",
            }}
          />
          <div
            className="deco-circle"
            style={{
              width: 200,
              height: 200,
              top: "30%",
              left: "55%",
              background: "rgb(22 138 117 / 0.04)",
            }}
          />
          {/* Animated ring decoration */}
          <div
            className="absolute top-[20%] left-[15%] hidden h-20 w-20 rounded-full border-2 opacity-[0.07] lg:block"
            style={{
              borderColor: "var(--primary-400)",
              animation: "rotate-subtle 20s linear infinite",
            }}
          />
          <div
            className="absolute right-[10%] bottom-[25%] hidden h-12 w-12 rounded-full border-2 opacity-[0.05] lg:block"
            style={{
              borderColor: "var(--accent-400)",
              animation: "rotate-subtle 15s linear infinite reverse",
            }}
          />

          {/* Bottom gradient fade */}
          <div
            className="absolute right-0 bottom-0 left-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgb(22 138 117 / 0.15), rgb(245 197 24 / 0.1), transparent)",
            }}
          />

          <div className="container-page relative grid min-h-[calc(100vh-76px)] items-center gap-10 py-14 lg:grid-cols-[1fr_460px] lg:gap-16">
            {/* ── Text content ── */}
            <div className="animate-fade-up space-y-8">
              <div className="chip">
                <span className="relative ml-2 flex h-2 w-2">
                  <span className="bg-primary-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                  <span className="bg-primary-500 relative inline-flex h-2 w-2 rounded-full" />
                </span>
                منصة تعليمية لطلاب الثانوية العامة
              </div>

              <div className="space-y-5">
                <h1
                  className="max-w-3xl text-4xl leading-[1.15] font-black text-balance sm:text-5xl lg:text-6xl"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--foreground) 0%, var(--primary-800) 50%, var(--primary-600) 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  منصة تمكين التعليمية
                </h1>
                <p className="text-foreground/60 max-w-xl text-lg leading-9">
                  كورسات منظمة، مدرسين متخصصين، وبوابة طالب جاهزة لإدارة
                  الاشتراكات والطلبات مع تجهيز كامل للدفع وفيديوهات محمية.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/courses"
                  className="btn-primary gap-2 px-7 py-3.5 text-base"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  تصفح الكورسات
                </Link>
                <Link
                  href="/signup"
                  className="btn-secondary gap-2 px-7 py-3.5 text-base"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                  إنشاء حساب طالب
                </Link>
              </div>

              {/* Stats */}
              <dl className="grid max-w-lg grid-cols-3 gap-3 pt-2">
                {[
                  {
                    value: teachers.length,
                    label: "مدرس",
                    icon: (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    ),
                  },
                  {
                    value: courses.length,
                    label: "كورس",
                    icon: (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    ),
                  },
                  {
                    label: "عربي بالكامل",
                    text: "RTL",
                    icon: (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    ),
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="group rounded-xl p-4 transition-all duration-400"
                    style={{
                      background: "rgb(255 255 255 / 0.6)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      border: "1px solid rgb(208 227 218 / 0.5)",
                      boxShadow: "0 2px 8px rgb(13 37 31 / 0.04)",
                    }}
                  >
                    <div className="text-primary-500/60 group-hover:text-primary-500 mb-2 transition-colors duration-300">
                      {stat.icon}
                    </div>
                    <dt
                      className="text-2xl font-black"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--primary-700), var(--primary-400))",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {stat.text ?? <AnimatedCounter target={stat.value!} />}
                    </dt>
                    <dd className="text-foreground/50 mt-0.5 text-xs">
                      {stat.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* ── Bento Grid — Platform Showcase ── */}
            <div
              className="animate-blur-in relative"
              style={{ animationDelay: "0.3s" }}
            >
              {/* Glow behind card */}
              <div
                className="absolute inset-4 -z-10 rounded-3xl opacity-40 blur-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgb(22 138 117 / 0.15), rgb(245 197 24 / 0.08))",
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                {/* ─ Tile 1: Video Player Preview ─ */}
                <div
                  className="animate-slide-right group col-span-2 overflow-hidden rounded-2xl p-5 transition-all duration-400 hover:shadow-[var(--shadow-card-hover)]"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--primary-800), var(--primary-900))",
                    animationDelay: "0.35s",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="white"
                          opacity="0.9"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-black text-white/95">
                          حصص مرئية محمية
                        </p>
                        <p className="text-[11px] text-white/50">
                          محتوى مشفر وآمن بالكامل
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-6 rounded-full bg-white/20" />
                      <span className="h-1.5 w-10 rounded-full bg-white/30" />
                      <span className="bg-accent-400/60 h-1.5 w-4 rounded-full" />
                    </div>
                  </div>
                  {/* Mini waveform / timeline */}
                  <div className="mt-4 flex items-end gap-[3px]">
                    {[
                      40, 65, 35, 80, 55, 70, 45, 90, 60, 75, 50, 85, 40, 70,
                      55, 80, 45, 65, 75, 50, 60, 85, 40, 55,
                    ].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-all duration-300"
                        style={{
                          height: `${h * 0.35}px`,
                          background:
                            i < 14
                              ? "linear-gradient(180deg, var(--primary-300), var(--primary-500))"
                              : "rgb(255 255 255 / 0.12)",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* ─ Tile 2: Teacher Profile ─ */}
                <div
                  className="animate-slide-right group overflow-hidden rounded-2xl p-4 transition-all duration-400 hover:shadow-[var(--shadow-card-hover)]"
                  style={{
                    background: "rgb(255 255 255 / 0.85)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgb(208 227 218 / 0.5)",
                    animationDelay: "0.45s",
                  }}
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <div
                      className="text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--primary-400), var(--primary-600))",
                      }}
                    >
                      م
                    </div>
                    <div>
                      <p className="text-foreground/85 text-[13px] font-bold">
                        نخبة المدرسين
                      </p>
                      <p className="text-foreground/45 text-[11px]">
                        متخصصين ومعتمدين
                      </p>
                    </div>
                  </div>
                  {/* Mini avatars stack */}
                  <div className="flex items-center">
                    <div className="flex -space-x-2 space-x-reverse">
                      {["أ", "ع", "م", "ه"].map((letter, i) => (
                        <div
                          key={i}
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white"
                          style={{
                            background: [
                              "linear-gradient(135deg, #2ca088, #168a75)",
                              "linear-gradient(135deg, #57b9a3, #2ca088)",
                              "linear-gradient(135deg, #f7c724, #d4a40c)",
                              "linear-gradient(135deg, #8fd2c2, #57b9a3)",
                            ][i],
                            zIndex: 4 - i,
                          }}
                        >
                          {letter}
                        </div>
                      ))}
                    </div>
                    <span className="text-primary-600 mr-2 text-[11px] font-bold">
                      +{teachers.length}
                    </span>
                  </div>
                </div>

                {/* ─ Tile 3: Live Students ─ */}
                <div
                  className="animate-slide-right group flex flex-col justify-between overflow-hidden rounded-2xl p-4 transition-all duration-400 hover:shadow-[var(--shadow-card-hover)]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgb(254 248 224 / 0.8), rgb(253 238 179 / 0.5))",
                    border: "1px solid rgb(245 197 24 / 0.15)",
                    animationDelay: "0.5s",
                  }}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: "rgb(245 197 24 / 0.2)" }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--accent-700)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="mt-3">
                    <p className="text-accent-700 text-2xl font-black">
                      <AnimatedCounter target={courses.length * 15} />+
                    </p>
                    <p className="text-accent-700/60 text-[11px] font-bold">
                      طالب مسجّل
                    </p>
                  </div>
                </div>

                {/* ─ Tile 4: Subjects ─ */}
                <div
                  className="animate-slide-right group overflow-hidden rounded-2xl p-4 transition-all duration-400 hover:shadow-[var(--shadow-card-hover)]"
                  style={{
                    background: "rgb(255 255 255 / 0.85)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgb(208 227 218 / 0.5)",
                    animationDelay: "0.55s",
                  }}
                >
                  <p className="text-foreground/80 text-[13px] font-bold">
                    المواد المتاحة
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {["فيزياء", "كيمياء", "رياضيات", "أحياء", "عربي"].map(
                      (subject) => (
                        <span
                          key={subject}
                          className="text-primary-700 rounded-lg px-2 py-1 text-[10px] font-bold"
                          style={{ background: "rgb(231 245 241 / 0.7)" }}
                        >
                          {subject}
                        </span>
                      ),
                    )}
                  </div>
                </div>

                {/* ─ Tile 5: Security ─ */}
                <div
                  className="animate-slide-right group overflow-hidden rounded-2xl p-4 transition-all duration-400 hover:shadow-[var(--shadow-card-hover)]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgb(231 245 241 / 0.7), rgb(197 232 223 / 0.4))",
                    border: "1px solid rgb(22 138 117 / 0.1)",
                    animationDelay: "0.6s",
                  }}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: "rgb(22 138 117 / 0.12)" }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--primary-600)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <p className="text-primary-700 mt-2 text-[12px] font-bold">
                    محتوى محمي
                  </p>
                  <p className="text-primary-600/50 text-[10px]">
                    تشفير وحماية كاملة
                  </p>
                </div>

                {/* ─ Tile 6: Brand Stamp ─ */}
                <div
                  className="animate-slide-right group flex items-center justify-center overflow-hidden rounded-2xl p-4 transition-all duration-400 hover:shadow-[var(--shadow-card-hover)]"
                  style={{
                    background: "rgb(255 255 255 / 0.85)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgb(208 227 218 / 0.5)",
                    animationDelay: "0.65s",
                  }}
                >
                  <div className="text-center">
                    <Image
                      src="/Logo/tamkeen-transparent.png"
                      alt="شعار منصة تمكين"
                      width={48}
                      height={48}
                      priority
                      className="mx-auto h-12 w-12 object-contain"
                    />
                    <p
                      className="mt-1.5 text-[11px] font-black"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--primary-600), var(--primary-400))",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      تمكين التعليمية
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Teachers Section ═══ */}
        <section id="teachers" className="container-page section-pad">
          <ScrollReveal>
            <div className="mb-8 flex items-end justify-between gap-4">
              <div className="section-accent pt-5">
                <p className="eyebrow">أبرز المدرسين</p>
                <h2 className="heading-gradient mt-2 text-2xl font-black sm:text-3xl">
                  مدرسين تمكين المفعّلين
                </h2>
              </div>
              <Link
                href="/courses"
                className="group text-primary-700 hover:text-primary-500 flex items-center gap-1.5 text-sm font-black transition-colors duration-300"
              >
                كل الكورسات
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-x-[-3px]"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </Link>
            </div>
          </ScrollReveal>

          {teachers.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((teacher, i) => (
                <ScrollReveal key={teacher.id} delay={i * 0.08}>
                  <TeacherCard teacher={teacher} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <ScrollReveal>
              <EmptyState
                title="لسه مفيش مدرسين ظاهرين"
                description="بعد إضافة المدرسين وتفعيلهم من قاعدة البيانات، هيظهروا هنا تلقائيًا."
              />
            </ScrollReveal>
          )}
        </section>

        {/* ═══ Courses Section ═══ */}
        <section className="surface-band">
          <div className="container-page section-pad">
            <ScrollReveal>
              <div className="mb-8 flex items-end justify-between gap-4">
                <div className="section-accent pt-5">
                  <p className="eyebrow">أحدث الكورسات</p>
                  <h2 className="heading-gradient mt-2 text-2xl font-black sm:text-3xl">
                    كورسات منشورة مؤخرًا
                  </h2>
                </div>
                <Link
                  href="/courses"
                  className="group text-primary-700 hover:text-primary-500 flex items-center gap-1.5 text-sm font-black transition-colors duration-300"
                >
                  تصفح الكل
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-300 group-hover:translate-x-[-3px]"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>

            {courses.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course, i) => (
                  <ScrollReveal key={course.id} delay={i * 0.08}>
                    <CourseCard course={course} />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <ScrollReveal>
                <EmptyState
                  title="لسه مفيش كورسات منشورة"
                  description="أول ما المدرسين ينشروا كورساتهم، هتظهر هنا وفي صفحة تصفح الكورسات."
                />
              </ScrollReveal>
            )}
          </div>
        </section>

        {/* ═══ Reviews Section ═══ */}
        <section id="reviews" className="container-page section-pad">
          <ScrollReveal>
            <div className="mb-8">
              <div className="section-accent pt-5">
                <p className="eyebrow">آراء وتقييمات الطلاب</p>
                <h2 className="heading-gradient mt-2 text-2xl font-black sm:text-3xl">
                  تجربة الطلاب مع الكورسات
                </h2>
              </div>
            </div>
          </ScrollReveal>

          {reviews.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {reviews.map((review, i) => (
                <ScrollReveal key={review.id} delay={i * 0.1}>
                  <ReviewCard review={review} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <ScrollReveal>
              <EmptyState
                title="لسه مفيش تقييمات"
                description="بعد اشتراك الطلاب وكتابة تقييماتهم، هنستعرض أحدث الآراء هنا."
              />
            </ScrollReveal>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
