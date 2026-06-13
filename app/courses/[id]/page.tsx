import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
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
        <section className="border-border bg-surface border-b">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
            <div className="space-y-5">
              <p className="text-primary-700 text-sm font-bold">
                {course.teacher?.subject ?? "كورس تعليمي"}
              </p>
              <h1 className="text-3xl leading-tight font-black sm:text-4xl">
                {course.title}
              </h1>
              <p className="text-foreground/70 max-w-3xl leading-8">
                {course.description ?? "تفاصيل الكورس هتظهر هنا قريبًا."}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {course.teacher?.slug ? (
                  <Link
                    href={`/teachers/${course.teacher.slug}`}
                    className="border-border hover:bg-surface-muted rounded-md border px-3 py-2 text-sm font-bold transition"
                  >
                    {teacherName}
                  </Link>
                ) : (
                  <span className="border-border rounded-md border px-3 py-2 text-sm font-bold">
                    {teacherName}
                  </span>
                )}
                <span className="bg-accent-50 text-accent-700 rounded-md px-3 py-2 text-sm font-bold">
                  {formatPrice(course.price)}
                </span>
              </div>
            </div>

            <aside className="border-border bg-background overflow-hidden rounded-md border">
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
                  <div className="from-primary-50 to-accent-100 text-primary-700 flex h-full items-center justify-center bg-linear-to-br text-xl font-black">
                    تمكين
                  </div>
                )}
              </div>
              <div className="space-y-4 p-4">
                <Link
                  href="/login"
                  className="bg-primary text-primary-foreground hover:bg-primary-600 flex w-full justify-center rounded-md px-4 py-3 text-sm font-bold transition"
                >
                  أضف للسلة
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black">محتوى الكورس</h2>
                <span className="text-foreground/60 text-sm">
                  {course.lessons.length.toLocaleString("ar-EG")} حصة
                </span>
              </div>
              <div className="border-border bg-surface divide-border overflow-hidden rounded-md border">
                {course.lessons.length > 0 ? (
                  course.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0"
                    >
                      <div>
                        <h3 className="font-bold">{lesson.title}</h3>
                        <p className="text-foreground/55 text-sm">
                          {formatDuration(lesson.duration)}
                        </p>
                      </div>
                      {lesson.is_free_preview ? (
                        <span className="bg-primary-50 text-primary-700 rounded-md px-2.5 py-1 text-xs font-bold">
                          Preview
                        </span>
                      ) : (
                        <span className="text-foreground/45 text-sm">مغلق</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-foreground/65 px-4 py-8 text-center">
                    الحصص هتظهر هنا بعد إضافتها من لوحة المدرس.
                  </p>
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-black">التقييمات</h2>
              {course.reviews.length > 0 ? (
                <div className="grid gap-3">
                  {course.reviews.map((review) => (
                    <article
                      key={review.id}
                      className="border-border bg-surface rounded-md border p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="font-bold">
                          {review.student?.profile?.full_name ?? "طالب تمكين"}
                        </h3>
                        <span className="bg-accent-50 text-accent-700 rounded-md px-2 py-1 text-sm font-bold">
                          {review.rating.toLocaleString("ar-EG")} / ٥
                        </span>
                      </div>
                      <p className="text-foreground/70 leading-7">
                        {review.comment ?? "تقييم بدون تعليق."}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="border-border bg-surface text-foreground/65 rounded-md border px-4 py-8 text-center">
                  لا توجد تقييمات لهذا الكورس حتى الآن.
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <div className="border-border bg-surface rounded-md border p-4">
              <h2 className="text-lg font-black">حصة Preview</h2>
              {previewLesson ? (
                <div className="mt-3 space-y-2">
                  <p className="font-bold">{previewLesson.title}</p>
                  <p className="text-foreground/60 text-sm">
                    {formatDuration(previewLesson.duration)}
                  </p>
                </div>
              ) : (
                <p className="text-foreground/65 mt-3 text-sm leading-7">
                  لا توجد حصة مجانية محددة حاليًا.
                </p>
              )}
            </div>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
