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
        <section className="border-border/70 relative overflow-hidden border-b">
          <div className="container-page grid min-h-[calc(100vh-76px)] items-center gap-10 py-10 lg:grid-cols-[1fr_430px]">
            <div className="animate-fade-up space-y-7">
              <div className="chip">منصة تعليمية لطلاب الثانوية العامة</div>
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
                <Link href="/courses" className="btn-primary">
                  تصفح الكورسات
                </Link>
                <Link href="/signup" className="btn-secondary">
                  إنشاء حساب طالب
                </Link>
              </div>
              <dl className="grid max-w-xl grid-cols-3 gap-3 pt-4">
                <div className="glass-panel rounded-lg p-3">
                  <dt className="text-primary-700 text-2xl font-black">
                    {teachers.length.toLocaleString("ar-EG")}
                  </dt>
                  <dd className="text-foreground/60 text-sm">مدرس</dd>
                </div>
                <div className="glass-panel rounded-lg p-3">
                  <dt className="text-primary-700 text-2xl font-black">
                    {courses.length.toLocaleString("ar-EG")}
                  </dt>
                  <dd className="text-foreground/60 text-sm">كورس</dd>
                </div>
                <div className="glass-panel rounded-lg p-3">
                  <dt className="text-primary-700 text-2xl font-black">RTL</dt>
                  <dd className="text-foreground/60 text-sm">عربي بالكامل</dd>
                </div>
              </dl>
            </div>

            <div className="glass-panel animate-float-soft shine relative overflow-hidden rounded-lg p-6">
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
                      className="border-border/70 bg-surface/90 flex items-center justify-between rounded-md border px-4 py-3 shadow-sm"
                    >
                      <span className="font-bold">{item}</span>
                      <span className="bg-primary-50 text-primary-700 rounded-md px-2 py-1 text-xs font-black">
                        جاهز
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="teachers" className="container-page section-pad">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">أبرز المدرسين</p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                مدرسين تمكين المفعّلين
              </h2>
            </div>
            <Link
              href="/courses"
              className="text-primary-700 hover:text-primary-900 text-sm font-black transition"
            >
              كل الكورسات
            </Link>
          </div>

          {teachers.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

        <section className="surface-band">
          <div className="container-page section-pad">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">أحدث الكورسات</p>
                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  كورسات منشورة مؤخرًا
                </h2>
              </div>
              <Link
                href="/courses"
                className="text-primary-700 hover:text-primary-900 text-sm font-black transition"
              >
                تصفح الكل
              </Link>
            </div>

            {courses.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

        <section id="reviews" className="container-page section-pad">
          <div className="mb-7">
            <p className="eyebrow">آراء وتقييمات الطلاب</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              تجربة الطلاب مع الكورسات
            </h2>
          </div>

          {reviews.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
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
