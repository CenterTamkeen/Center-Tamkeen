import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/navigation/back-button";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  formatDuration,
  formatPrice,
  getCourseById,
} from "@/lib/storefront/data";

type CoursePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    return {
      title: "الكورس غير موجود",
    };
  }

  return {
    title: course.title,
    description: course.description ?? `تفاصيل كورس ${course.title}.`,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    notFound();
  }

  const teacherName = course.teacher?.profile?.full_name ?? "مدرس تمكين";
  const previewLesson = course.lessons.find((lesson) => lesson.is_free_preview);

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section
          className="relative overflow-hidden border-b"
          style={{
            borderColor: "rgb(208 227 218 / 0.4)",
            background:
              "linear-gradient(180deg, rgb(236 245 241 / 0.5) 0%, rgb(255 255 255 / 0.3) 100%)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div
            className="deco-circle"
            style={{
              width: 400,
              height: 400,
              top: -150,
              right: -150,
              background: "rgb(22 138 117 / 0.05)",
            }}
          />

          <div className="container-page relative grid gap-8 py-12 lg:grid-cols-[1fr_420px]">
            <div className="animate-fade-up space-y-5">
              <BackButton fallbackHref="/courses" label="رجوع للكورسات" />
              <p className="eyebrow">
                {course.teacher?.subject ?? "كورس تعليمي"}
              </p>
              <h1 className="heading-gradient text-3xl leading-tight font-black sm:text-4xl">
                {course.title}
              </h1>
              <p className="text-foreground/65 max-w-3xl leading-8">
                {course.description ?? "تفاصيل الكورس هتظهر هنا قريبًا."}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {course.teacher?.slug ? (
                  <Link
                    href={`/teachers/${course.teacher.slug}`}
                    className="btn-secondary gap-2 px-4 py-2"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {teacherName}
                  </Link>
                ) : (
                  <span className="btn-secondary px-4 py-2">{teacherName}</span>
                )}
                <span
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-black"
                  style={{
                    background:
                      "linear-gradient(135deg, rgb(254 248 224 / 0.9), rgb(253 238 179 / 0.6))",
                    color: "var(--accent-700)",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  {formatPrice(course.price)}
                </span>
              </div>
            </div>

            <aside
              className="animate-blur-in glass-panel-strong overflow-hidden rounded-2xl"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="relative aspect-video">
                {course.thumbnail_url ? (
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 420px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div
                    className="text-primary-700 flex h-full items-center justify-center text-xl font-black"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--primary-50), var(--accent-100))",
                    }}
                  >
                    تمكين
                  </div>
                )}
              </div>
              <div className="space-y-4 p-5">
                <Link
                  href="/login"
                  className="btn-primary flex w-full justify-center gap-2 py-3.5"
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
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  أضف للسلة
                </Link>
              </div>
            </aside>
          </div>
        </section>

        {/* Content */}
        <section className="container-page grid gap-8 py-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">
            {/* Lessons */}
            <ScrollReveal as="section">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="heading-gradient text-2xl font-black">
                  محتوى الكورس
                </h2>
                <span className="chip">
                  {course.lessons.length.toLocaleString("ar-EG")} حصة
                </span>
              </div>
              <div className="glass-panel-strong overflow-hidden rounded-xl">
                {course.lessons.length > 0 ? (
                  course.lessons.map((lesson, i) => (
                    <div
                      key={lesson.id}
                      className="group hover:bg-primary-50/30 flex items-center justify-between gap-4 border-b px-5 py-4 transition-all duration-300 last:border-b-0"
                      style={{ borderColor: "rgb(208 227 218 / 0.4)" }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="text-foreground/40 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black"
                          style={{
                            background: "rgb(236 245 241 / 0.6)",
                          }}
                        >
                          {(i + 1).toLocaleString("ar-EG")}
                        </span>
                        <div>
                          <h3 className="group-hover:text-primary-700 font-bold transition-colors duration-300">
                            {lesson.title}
                          </h3>
                          <p className="text-foreground/50 text-sm">
                            {formatDuration(lesson.duration)}
                          </p>
                        </div>
                      </div>
                      {lesson.is_free_preview ? (
                        <span
                          className="badge-pulse text-primary-700 rounded-lg px-2.5 py-1 text-xs font-black"
                          style={{
                            background:
                              "linear-gradient(135deg, rgb(231 245 241 / 0.9), rgb(197 232 223 / 0.5))",
                          }}
                        >
                          Preview
                        </span>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-foreground/30"
                        >
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-foreground/60 px-5 py-10 text-center">
                    الحصص هتظهر هنا بعد إضافتها من لوحة المدرس.
                  </p>
                )}
              </div>
            </ScrollReveal>

            {/* Reviews */}
            <ScrollReveal as="section">
              <h2 className="heading-gradient mb-5 text-2xl font-black">
                التقييمات
              </h2>
              {course.reviews.length > 0 ? (
                <div className="grid gap-4">
                  {course.reviews.map((review) => (
                    <article
                      key={review.id}
                      className="card-modern quote-deco group p-5"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="group-hover:text-primary-700 font-bold transition-colors duration-300">
                          {review.student?.profile?.full_name ?? "طالب تمكين"}
                        </h3>
                        <span
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-black"
                          style={{
                            background:
                              "linear-gradient(135deg, rgb(254 248 224 / 0.9), rgb(253 238 179 / 0.6))",
                            color: "var(--accent-700)",
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-accent-500"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          {review.rating.toLocaleString("ar-EG")} / ٥
                        </span>
                      </div>
                      <p className="text-foreground/65 leading-7">
                        {review.comment ?? "تقييم بدون تعليق."}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="glass-panel text-foreground/60 rounded-xl px-5 py-10 text-center">
                  لا توجد تقييمات لهذا الكورس حتى الآن.
                </div>
              )}
            </ScrollReveal>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <ScrollReveal>
              <div className="glass-panel-strong sticky top-24 rounded-xl p-5">
                <h2 className="flex items-center gap-2 text-lg font-black">
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
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  حصة Preview
                </h2>
                {previewLesson ? (
                  <div
                    className="mt-4 space-y-2 rounded-xl p-3"
                    style={{ background: "rgb(236 245 241 / 0.5)" }}
                  >
                    <p className="font-bold">{previewLesson.title}</p>
                    <p className="text-foreground/55 text-sm">
                      {formatDuration(previewLesson.duration)}
                    </p>
                  </div>
                ) : (
                  <p className="text-foreground/60 mt-4 text-sm leading-7">
                    لا توجد حصة مجانية محددة حاليًا.
                  </p>
                )}
              </div>
            </ScrollReveal>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
