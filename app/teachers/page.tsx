import type { Metadata } from "next";

import { BackButton } from "@/components/navigation/back-button";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { EmptyState } from "@/components/storefront/empty-state";
import { Pagination } from "@/components/storefront/pagination";
import { TeacherCard } from "@/components/storefront/teacher-card";
import { TeachersFilterForm } from "@/components/storefront/teachers-filter-form";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getTeacherSubjects, getTeachersPage } from "@/lib/storefront/data";

export const metadata: Metadata = {
  title: "مدرسين منصة تمكين",
  description:
    "تصفح مدرسين منصة تمكين التعليمية وابحث باسم المدرس أو المادة لمتابعة الكورسات المتاحة.",
  alternates: {
    canonical: "/teachers",
  },
  openGraph: {
    title: "مدرسين منصة تمكين",
    description: "مدرسين متخصصين وكورسات ثانوية عامة على منصة تمكين.",
    url: "/teachers",
  },
};

type TeachersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function getSort(value?: string) {
  return value === "name" ? "name" : "newest";
}

function getPage(value?: string) {
  const page = Number(value);

  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

export default async function TeachersPage({
  searchParams,
}: TeachersPageProps) {
  const params = await searchParams;
  const query = getParam(params, "q")?.trim();
  const subject = getParam(params, "subject")?.trim();
  const sort = getSort(getParam(params, "sort"));
  const page = getPage(getParam(params, "page"));
  const [subjects, teachersPage] = await Promise.all([
    getTeacherSubjects(),
    getTeachersPage({
      query,
      subject,
      sort,
      page,
      pageSize: 12,
    }),
  ]);
  const { teachers, totalCount, totalPages } = teachersPage;

  return (
    <>
      <SiteHeader />
      <main>
        <section
          className="border-border/50 relative overflow-hidden border-b"
          style={{ background: "var(--hero-wash-background)" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgb(22_138_117/0.08),transparent_28%),radial-gradient(circle_at_82%_26%,rgb(245_197_24/0.12),transparent_24%)]" />
          <div className="container-page relative py-16">
            <BackButton
              fallbackHref="/"
              label="رجوع للرئيسية"
              className="mb-5"
            />
            <div className="animate-fade-up max-w-3xl">
              <p className="eyebrow">المدرسين</p>
              <h1 className="heading-gradient mt-2 text-4xl font-black sm:text-5xl">
                اختار مدرسك المناسب
              </h1>
              <p className="text-foreground/65 mt-4 leading-8">
                ابحث باسم المدرس أو المادة، وشوف صفحة كل مدرس والكورسات المتاحة
                عنده.
              </p>
            </div>
          </div>
        </section>

        <section className="container-page space-y-7 py-8">
          <TeachersFilterForm
            subjects={subjects}
            defaultQuery={query}
            defaultSubject={subject}
            defaultSort={sort}
          />

          <div className="chip">
            {teachers.length > 0
              ? `${totalCount.toLocaleString("ar-EG")} مدرس متاح`
              : "لا توجد نتائج مطابقة"}
          </div>

          {teachers.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((teacher, index) => (
                <ScrollReveal key={teacher.id} delay={index * 0.06}>
                  <TeacherCard teacher={teacher} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <EmptyState
              title="مفيش مدرسين بالفلتر الحالي"
              description="جرّب تغيير البحث أو اختيار كل المواد."
            />
          )}

          <Pagination
            basePath="/teachers"
            page={teachersPage.page}
            totalPages={totalPages}
            searchParams={{
              q: query,
              subject,
              sort,
            }}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
