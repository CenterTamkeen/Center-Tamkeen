import type { Metadata } from "next";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { CourseCard } from "@/components/storefront/course-card";
import { CoursesFilterForm } from "@/components/storefront/courses-filter-form";
import { EmptyState } from "@/components/storefront/empty-state";
import { Pagination } from "@/components/storefront/pagination";
import { getCoursesPage, getFeaturedTeachers } from "@/lib/storefront/data";

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
  if (value === "price_asc" || value === "price_desc" || value === "newest") {
    return value;
  }

  return "newest";
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
  const sort = getSort(getParam(params, "sort"));
  const page = getPage(getParam(params, "page"));
  const [teachers, coursePage] = await Promise.all([
    getFeaturedTeachers(100),
    getCoursesPage({
      query,
      teacher,
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
        <section className="border-border bg-surface border-b">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-primary-700 text-sm font-bold">الكورسات</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              استكشف مواد تمكين
            </h1>
            <p className="text-foreground/70 mt-3 max-w-2xl leading-8">
              ابحث عن المادة، اختار المدرس، ورتب حسب السعر عشان توصل للكورس
              المناسب بسرعة.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <CoursesFilterForm
            teachers={teachers}
            defaultQuery={query}
            defaultTeacher={teacher}
            defaultSort={sort}
          />

          <div className="flex items-center justify-between gap-4">
            <p className="text-foreground/65 text-sm">
              {courses.length > 0
                ? `${totalCount.toLocaleString("ar-EG")} كورس متاح`
                : "لا توجد نتائج مطابقة"}
            </p>
          </div>

          {courses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
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
              sort,
            }}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
