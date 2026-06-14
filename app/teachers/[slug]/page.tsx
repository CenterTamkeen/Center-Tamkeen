import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/navigation/back-button";
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
  const cover = teacher.cover_url;

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="border-border/50 relative overflow-hidden border-b bg-white/60">
          <div className="relative h-56 sm:h-72 lg:h-80">
            {cover ? (
              <Image
                src={cover}
                alt={`خلفية ${name}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="h-full bg-[linear-gradient(135deg,var(--primary-800),var(--primary-500),var(--accent-300))]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
            <div className="container-page absolute inset-x-0 top-6">
              <BackButton fallbackHref="/" label="رجوع للرئيسية" />
            </div>
          </div>

          <div className="container-page relative pb-10">
            <div className="-mt-20 grid gap-6 sm:grid-cols-[180px_1fr] sm:items-end">
              <div className="animate-scale-up avatar-ring relative h-40 w-40 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-[var(--shadow-card)]">
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
                className="animate-fade-up space-y-4 rounded-2xl bg-white/80 p-5 shadow-[var(--shadow-card)] backdrop-blur-xl"
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
