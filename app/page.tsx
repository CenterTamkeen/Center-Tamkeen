import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { CourseCard } from "@/components/storefront/course-card";
import { EmptyState } from "@/components/storefront/empty-state";
import { ReviewCard } from "@/components/storefront/review-card";
import { TeacherCard } from "@/components/storefront/teacher-card";
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
        <section className="border-border bg-surface border-b">
          <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
            <div className="space-y-7">
              <div className="border-primary-100 bg-primary-50 text-primary-700 inline-flex rounded-md border px-3 py-1 text-sm font-bold">
                منصة تعليمية لطلاب الثانوية العامة
              </div>
              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl leading-tight font-black text-balance sm:text-5xl lg:text-6xl">
                  منصة تمكين التعليمية
                </h1>
                <p className="text-foreground/70 max-w-2xl text-lg leading-9">
                  كورسات منظمة، مدرسين متخصصين، وبوابة طالب جاهزة لإدارة
                  الاشتراكات والطلبات مع تجهيز كامل للدفع وفيديوهات محمية.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/courses"
                  className="bg-primary text-primary-foreground hover:bg-primary-600 rounded-md px-5 py-3 text-sm font-bold transition"
                >
                  تصفح الكورسات
                </Link>
                <Link
                  href="/signup"
                  className="border-border bg-background hover:bg-surface-muted rounded-md border px-5 py-3 text-sm font-bold transition"
                >
                  إنشاء حساب طالب
                </Link>
              </div>
              <dl className="grid max-w-xl grid-cols-3 gap-3 pt-4">
                <div className="border-border rounded-md border p-3">
                  <dt className="text-primary-700 text-2xl font-black">
                    {teachers.length.toLocaleString("ar-EG")}
                  </dt>
                  <dd className="text-foreground/60 text-sm">مدرس</dd>
                </div>
                <div className="border-border rounded-md border p-3">
                  <dt className="text-primary-700 text-2xl font-black">
                    {courses.length.toLocaleString("ar-EG")}
                  </dt>
                  <dd className="text-foreground/60 text-sm">كورس</dd>
                </div>
                <div className="border-border rounded-md border p-3">
                  <dt className="text-primary-700 text-2xl font-black">RTL</dt>
                  <dd className="text-foreground/60 text-sm">عربي بالكامل</dd>
                </div>
              </dl>
            </div>

            <div className="border-border bg-background relative overflow-hidden rounded-md border p-6">
              <Image
                src="/Logo/tamkeen.png"
                alt="شعار منصة تمكين"
                width={260}
                height={260}
                priority
                className="mx-auto h-auto w-56"
              />
              <div className="mt-6 grid gap-3">
                {["بوابة طالب", "كورسات منشورة", "مدرسين مفعّلين"].map(
                  (item) => (
                    <div
                      key={item}
                      className="border-border bg-surface flex items-center justify-between rounded-md border px-4 py-3"
                    >
                      <span className="font-bold">{item}</span>
                      <span className="bg-primary-50 text-primary-700 rounded-md px-2 py-1 text-xs font-bold">
                        جاهز
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          id="teachers"
          className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
        >
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-primary-700 text-sm font-bold">
                أبرز المدرسين
              </p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                مدرسين تمكين المفعّلين
              </h2>
            </div>
            <Link
              href="/courses"
              className="text-primary-700 text-sm font-bold"
            >
              كل الكورسات
            </Link>
          </div>

          {teachers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((teacher) => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="لسه مفيش مدرسين ظاهرين"
              description="بعد إضافة المدرسين وتفعيلهم من قاعدة البيانات، هيظهروا هنا تلقائيًا."
            />
          )}
        </section>

        <section className="bg-surface border-y">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-primary-700 text-sm font-bold">
                  أحدث الكورسات
                </p>
                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  كورسات منشورة مؤخرًا
                </h2>
              </div>
              <Link
                href="/courses"
                className="text-primary-700 text-sm font-bold"
              >
                تصفح الكل
              </Link>
            </div>

            {courses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="لسه مفيش كورسات منشورة"
                description="أول ما المدرسين ينشروا كورساتهم، هتظهر هنا وفي صفحة تصفح الكورسات."
              />
            )}
          </div>
        </section>

        <section
          id="reviews"
          className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
        >
          <div className="mb-7">
            <p className="text-primary-700 text-sm font-bold">
              آراء وتقييمات الطلاب
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              تجربة الطلاب مع الكورسات
            </h2>
          </div>

          {reviews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="لسه مفيش تقييمات"
              description="بعد اشتراك الطلاب وكتابة تقييماتهم، هنستعرض أحدث الآراء هنا."
            />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
