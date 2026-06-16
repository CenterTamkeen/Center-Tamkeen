import type { Metadata } from "next";

import { AdminCoursesTable } from "@/components/admin/admin-courses-table";
import { getAdminCourses } from "@/lib/admin/data";

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

      {courses.length > 0 ? (
        <AdminCoursesTable courses={courses} />
      ) : (
        <div className="glass-panel text-foreground/60 rounded-xl px-5 py-12 text-center">
          لا توجد كورسات حتى الآن.
        </div>
      )}
    </div>
  );
}
