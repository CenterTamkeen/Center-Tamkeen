import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { CourseCard } from "@/components/storefront/course-card";
import { EmptyState } from "@/components/storefront/empty-state";
import { getCoursesByTeacher, getTeacherBySlug } from "@/lib/storefront/data";

type TeacherPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: TeacherPageProps): Promise<Metadata> {
  const { slug } = await params;
  const teacher = await getTeacherBySlug(slug);

  if (!teacher) {
    return {
      title: "المدرس غير موجود",
    };
  }

  return {
    title: teacher.profile?.full_name ?? "مدرس تمكين",
    description: teacher.bio ?? `كورسات ${teacher.subject} على منصة تمكين.`,
  };
}

export default async function TeacherPage({ params }: TeacherPageProps) {
  const { slug } = await params;
  const teacher = await getTeacherBySlug(slug);

  if (!teacher) {
    notFound();
  }

  const courses = await getCoursesByTeacher(teacher.id);
  const name = teacher.profile?.full_name ?? "مدرس تمكين";
  const avatar = teacher.avatar_url ?? teacher.profile?.avatar_url;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-border/70 bg-surface/65 border-b backdrop-blur-sm">
          <div className="container-page grid gap-8 py-12 sm:grid-cols-[180px_1fr]">
            <div className="border-primary-100 bg-primary-50 relative h-40 w-40 overflow-hidden rounded-lg border shadow-[var(--shadow-card)]">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={name}
                  fill
                  sizes="160px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="text-primary-700 flex h-full items-center justify-center text-5xl font-black">
                  {name.slice(0, 1)}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="eyebrow">{teacher.subject}</p>
              <h1 className="text-3xl font-black sm:text-4xl">{name}</h1>
              <p className="text-foreground/70 max-w-3xl leading-8">
                {teacher.bio ?? "نبذة المدرس هتظهر هنا قريبًا."}
              </p>
              <p className="chip bg-surface">
                {courses.length.toLocaleString("ar-EG")} كورس منشور
              </p>
            </div>
          </div>
        </section>

        <section className="container-page section-pad">
          <div className="mb-7">
            <p className="eyebrow">كورسات المدرس</p>
            <h2 className="mt-2 text-2xl font-black">الكورسات المتاحة</h2>
          </div>

          {courses.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="لا توجد كورسات منشورة لهذا المدرس"
              description="عند نشر أول كورس للمدرس، هيظهر هنا مباشرة."
            />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
