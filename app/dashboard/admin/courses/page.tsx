import type { Metadata } from "next";

import { getAdminCourses } from "@/lib/admin/data";
import { formatPrice } from "@/lib/storefront/data";

export const metadata: Metadata = {
  title: "مراجعة الكورسات",
};

export default async function AdminCoursesPage() {
  const courses = await getAdminCourses();

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">المحتوى</p>
        <h2 className="text-xl font-black">كل كورسات المنصة</h2>
      </div>

      <div className="grid gap-4">
        {courses.length > 0 ? (
          courses.map((course) => (
            <article key={course.id} className="card-modern p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black">{course.title}</h3>
                    <span className="chip">
                      {course.is_published ? "منشور" : "مخفي"}
                    </span>
                  </div>
                  <p className="text-foreground/65 mt-2 text-sm leading-6">
                    {course.teacher?.profile?.full_name ?? "مدرس غير معروف"} ·{" "}
                    {course.teacher?.subject ?? "مادة غير محددة"}
                  </p>
                </div>
                <div className="text-foreground/60 flex flex-wrap gap-2 text-sm font-semibold">
                  <span>{formatPrice(course.price)}</span>
                  <span>
                    {course.lessons.length.toLocaleString("ar-EG")} حصة
                  </span>
                  <span>
                    {course.enrollments.length.toLocaleString("ar-EG")} اشتراك
                  </span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="glass-panel text-foreground/60 rounded-xl px-5 py-12 text-center">
            لا توجد كورسات حتى الآن.
          </div>
        )}
      </div>
    </div>
  );
}
