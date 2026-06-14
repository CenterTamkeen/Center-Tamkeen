import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { CourseCard } from "@/components/storefront/course-card";
import { EmptyState } from "@/components/storefront/empty-state";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
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
              width: 300,
              height: 300,
              top: -100,
              left: -80,
              background: "rgb(22 138 117 / 0.05)",
            }}
          />

          <div className="container-page relative grid gap-8 py-14 sm:grid-cols-[180px_1fr]">
            <div className="animate-scale-up avatar-ring relative h-40 w-40 overflow-hidden rounded-2xl shadow-[var(--shadow-card)]">
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
                <div
                  className="text-primary-foreground flex h-full items-center justify-center text-5xl font-black"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--primary-400), var(--primary-600))",
                  }}
                >
                  {name.slice(0, 1)}
                </div>
              )}
            </div>

            <div
              className="animate-fade-up space-y-4"
              style={{ animationDelay: "0.15s" }}
            >
              <p className="eyebrow">{teacher.subject}</p>
              <h1 className="heading-gradient text-3xl font-black sm:text-4xl">
                {name}
              </h1>
              <p className="text-foreground/65 max-w-3xl leading-8">
                {teacher.bio ?? "نبذة المدرس هتظهر هنا قريبًا."}
              </p>
              <div className="chip">
                {courses.length.toLocaleString("ar-EG")} كورس منشور
              </div>
            </div>
          </div>
        </section>

        {/* Courses */}
        <section className="container-page section-pad">
          <ScrollReveal>
            <div className="section-accent mb-8 pt-5">
              <p className="eyebrow">كورسات المدرس</p>
              <h2 className="heading-gradient mt-2 text-2xl font-black">
                الكورسات المتاحة
              </h2>
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
                title="لا توجد كورسات منشورة لهذا المدرس"
                description="عند نشر أول كورس للمدرس، هيظهر هنا مباشرة."
              />
            </ScrollReveal>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
