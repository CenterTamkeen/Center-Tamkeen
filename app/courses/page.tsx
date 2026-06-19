import type { Metadata } from "next";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { BackButton } from "@/components/navigation/back-button";
import { CourseCard } from "@/components/storefront/course-card";
import { CoursesFilterForm } from "@/components/storefront/courses-filter-form";
import { EmptyState } from "@/components/storefront/empty-state";
import { Pagination } from "@/components/storefront/pagination";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  getCourseSubjects,
  getCoursesPage,
  getFeaturedTeachers,
} from "@/lib/storefront/data";
import { gradeLabels, sectionLabels } from "@/lib/validations/auth";
import type { Database } from "@/types/database";

type StudentGrade = Database["public"]["Enums"]["student_grade"];
type StudentSection = Database["public"]["Enums"]["student_section"];

export const metadata: Metadata = {
  title: "الكورسات",
  description: "تصفح كورسات منصة تمكين التعليمية وفلتر حسب المدرس والسعر.",
};

type CoursesPageProps = {
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
  if (
    value === "price_asc" ||
    value === "price_desc" ||
    value === "newest" ||
    value === "popular"
  ) {
    return value;
  }

  return "newest";
}

function getPriceType(value?: string) {
  if (value === "free" || value === "paid") {
    return value;
  }

  return undefined;
}

function getOptionalNumber(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function getGrade(value?: string): StudentGrade | undefined {
  return value && value in gradeLabels ? (value as StudentGrade) : undefined;
}

function getSection(value?: string): StudentSection | undefined {
  return value && value in sectionLabels
    ? (value as StudentSection)
    : undefined;
}

function getPage(value?: string) {
  const page = Number(value);

  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;
  const query = getParam(params, "q")?.trim();
  const teacher = getParam(params, "teacher")?.trim();
  const subject = getParam(params, "subject")?.trim();
  const grade = getGrade(getParam(params, "grade"));
  const section = getSection(getParam(params, "section"));
  const priceType = getPriceType(getParam(params, "priceType"));
  const minPrice = getOptionalNumber(getParam(params, "minPrice"));
  const maxPrice = getOptionalNumber(getParam(params, "maxPrice"));
  const sort = getSort(getParam(params, "sort"));
  const page = getPage(getParam(params, "page"));
  const [teachers, subjects, coursePage] = await Promise.all([
    getFeaturedTeachers(100),
    getCourseSubjects(),
    getCoursesPage({
      query,
      teacher,
      subject,
      grade,
      section,
      priceType,
      minPrice,
      maxPrice,
      sort,
      page,
      pageSize: 12,
    }),
  ]);
  const { courses, totalCount, totalPages } = coursePage;

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero banner */}
        <section
          className="relative overflow-hidden border-b"
          style={{
            borderColor: "var(--footer-border)",
            background: "var(--panel-wash-background)",
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
              left: -100,
              background: "rgb(22 138 117 / 0.05)",
            }}
          />

          <div className="container-page relative py-14">
            <BackButton
              fallbackHref="/"
              label="رجوع للرئيسية"
              className="mb-5"
            />
            <div className="animate-fade-up">
              <p className="eyebrow">الكورسات</p>
              <h1 className="heading-gradient mt-2 text-3xl font-black sm:text-4xl">
                استكشف مواد تمكين
              </h1>
              <p className="text-foreground/65 mt-3 max-w-2xl leading-8">
                ابحث عن المادة، اختار المدرس، ورتب حسب السعر عشان توصل للكورس
                المناسب بسرعة.
              </p>
            </div>
          </div>
        </section>

        <section className="container-page space-y-7 py-8">
          <CoursesFilterForm
            teachers={teachers}
            subjects={subjects}
            defaultQuery={query}
            defaultTeacher={teacher}
            defaultSubject={subject}
            defaultGrade={grade}
            defaultSection={section}
            defaultPriceType={priceType}
            defaultMinPrice={minPrice?.toString()}
            defaultMaxPrice={maxPrice?.toString()}
            defaultSort={sort}
          />

          <div className="flex items-center justify-between gap-4">
            <div className="chip">
              {courses.length > 0
                ? `${totalCount.toLocaleString("ar-EG")} كورس متاح`
                : "لا توجد نتائج مطابقة"}
            </div>
          </div>

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
              title="مفيش كورسات بالفلتر الحالي"
              description="جرّب تغيير اسم المادة أو اختيار كل المدرسين. لو قاعدة البيانات لسه فاضية، الكورسات هتظهر هنا بعد إضافتها ونشرها."
            />
          )}

          <Pagination
            page={coursePage.page}
            totalPages={totalPages}
            searchParams={{
              q: query,
              teacher,
              subject,
              grade,
              section,
              priceType,
              minPrice: minPrice?.toString(),
              maxPrice: maxPrice?.toString(),
              sort,
            }}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
