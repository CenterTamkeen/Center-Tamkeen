import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  deleteCourseAction,
  toggleCoursePublishAction,
} from "@/lib/teacher/actions";
import { getCurrentTeacher, getTeacherCourses } from "@/lib/teacher/data";
import { requireRole } from "@/lib/auth/roles";
import { formatPrice } from "@/lib/storefront/data";
import { gradeLabels, sectionLabels } from "@/lib/validations/auth";

export const metadata: Metadata = {
  title: "كورسات المدرس",
};

export default async function TeacherCoursesPage() {
  const { profile } = await requireRole(
    "teacher",
    "/dashboard/teacher/courses",
  );
  const teacher = await getCurrentTeacher(profile.id);

  if (!teacher) {
    return null;
  }

  const courses = await getTeacherCourses(teacher.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">إدارة الكورسات</p>
          <h2 className="text-xl font-black">كورساتك</h2>
        </div>
        <Link href="/dashboard/teacher/courses/new" className="btn-primary">
          كورس جديد
        </Link>
      </div>

      <div className="grid gap-4">
        {courses.length > 0 ? (
          courses.map((course) => (
            <article key={course.id} className="card-modern p-4">
              <div className="grid gap-4 md:grid-cols-[180px_1fr] lg:grid-cols-[180px_1fr_auto]">
                <div className="bg-primary-50 relative aspect-video overflow-hidden rounded-xl md:h-full">
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={course.title}
                      fill
                      sizes="180px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-primary-700 flex h-full items-center justify-center px-3 text-center font-black">
                      {course.subject ?? teacher.subject}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black">{course.title}</h3>
                    <span className="chip">
                      {course.is_published ? "منشور" : "مخفي"}
                    </span>
                    <span className="chip">
                      {course.subject ?? teacher.subject}
                    </span>
                  </div>
                  <p className="text-foreground/60 mt-2 line-clamp-2 text-sm leading-6">
                    {course.description ?? "لا يوجد وصف بعد."}
                  </p>
                  <div className="text-foreground/60 mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                    <span>{formatPrice(course.price)}</span>
                    <span>
                      {course.lessons.length.toLocaleString("ar-EG")} حصة
                    </span>
                    <span>
                      {course.enrollments.length.toLocaleString("ar-EG")} اشتراك
                    </span>
                    {course.target_grade ? (
                      <span>{gradeLabels[course.target_grade]}</span>
                    ) : null}
                    {course.target_section ? (
                      <span>
                        {sectionLabels[
                          course.target_section as keyof typeof sectionLabels
                        ] ?? course.target_section}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:col-span-2 lg:col-span-1 lg:flex-col lg:items-stretch">
                  <Link
                    href={`/dashboard/teacher/courses/${course.id}/lessons`}
                    className="btn-secondary px-3 py-2 text-xs"
                  >
                    الحصص
                  </Link>
                  <Link
                    href={`/dashboard/teacher/courses/${course.id}/edit`}
                    className="btn-secondary px-3 py-2 text-xs"
                  >
                    تعديل
                  </Link>
                  <form action={toggleCoursePublishAction}>
                    <input type="hidden" name="courseId" value={course.id} />
                    <input
                      type="hidden"
                      name="nextPublished"
                      value={course.is_published ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className="btn-secondary w-full px-3 py-2 text-xs"
                    >
                      {course.is_published ? "إخفاء" : "نشر"}
                    </button>
                  </form>
                  <form action={deleteCourseAction}>
                    <input type="hidden" name="courseId" value={course.id} />
                    <button
                      type="submit"
                      className="btn-secondary w-full px-3 py-2 text-xs text-red-700"
                    >
                      حذف
                    </button>
                  </form>
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
