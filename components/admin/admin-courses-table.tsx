"use client";

import { useMemo, useState } from "react";

import {
  deleteAdminCourseAction,
  toggleAdminCoursePublishAction,
} from "@/lib/admin/actions";
import type { AdminCourse } from "@/lib/admin/data";
import { formatPrice } from "@/lib/format";
import { gradeLabels, sectionLabels } from "@/lib/validations/auth";

export function AdminCoursesTable({ courses }: { courses: AdminCourse[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [teacher, setTeacher] = useState("all");
  const [subject, setSubject] = useState("all");
  const teachers = useMemo(
    () =>
      Array.from(
        new Set(
          courses.map(
            (course) => course.teacher?.profile?.full_name ?? "مدرس غير معروف",
          ),
        ),
      ),
    [courses],
  );
  const subjects = useMemo(
    () =>
      Array.from(
        new Set(
          courses.map((course) => course.teacher?.subject ?? "مادة غير محددة"),
        ),
      ),
    [courses],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return courses.filter((course) => {
      const teacherName =
        course.teacher?.profile?.full_name ?? "مدرس غير معروف";
      const courseSubject = course.teacher?.subject ?? "مادة غير محددة";
      const matchesQuery =
        !normalized || course.title.toLowerCase().includes(normalized);
      const matchesStatus =
        status === "all" ||
        (status === "published" ? course.is_published : !course.is_published);
      const matchesTeacher = teacher === "all" || teacherName === teacher;
      const matchesSubject = subject === "all" || courseSubject === subject;

      return matchesQuery && matchesStatus && matchesTeacher && matchesSubject;
    });
  }, [courses, query, status, subject, teacher]);

  return (
    <div className="space-y-4">
      <div className="glass-panel-strong grid gap-3 rounded-xl p-4 lg:grid-cols-[1fr_180px_180px_180px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="field bg-background/60"
          placeholder="بحث بعنوان الكورس"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="field bg-background/60"
        >
          <option value="all">كل الحالات</option>
          <option value="published">منشور</option>
          <option value="hidden">غير منشور</option>
        </select>
        <select
          value={teacher}
          onChange={(event) => setTeacher(event.target.value)}
          className="field bg-background/60"
        >
          <option value="all">كل المدرسين</option>
          {teachers.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="field bg-background/60"
        >
          <option value="all">كل المواد</option>
          {subjects.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 md:hidden">
        {filtered.map((course) => (
          <article key={course.id} className="card-modern p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-black">{course.title}</h3>
                <p className="text-foreground/60 mt-2 text-sm leading-6">
                  {course.teacher?.profile?.full_name ?? "مدرس غير معروف"} ·{" "}
                  {course.teacher?.subject ?? "مادة غير محددة"}
                </p>
              </div>
              <span className="chip shrink-0">
                {course.is_published ? "منشور" : "مخفي"}
              </span>
            </div>
            <div className="text-foreground/60 mt-3 flex flex-wrap gap-2 text-sm font-semibold">
              <span>{formatPrice(course.price)}</span>
              <span>{course.lessons.length.toLocaleString("ar-EG")} حصة</span>
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
            <div className="mt-4 grid grid-cols-2 gap-2">
              <form action={toggleAdminCoursePublishAction}>
                <input type="hidden" name="courseId" value={course.id} />
                <input
                  type="hidden"
                  name="nextPublished"
                  value={course.is_published ? "false" : "true"}
                />
                <button className="btn-secondary w-full px-3 py-2 text-xs">
                  {course.is_published ? "إخفاء" : "نشر"}
                </button>
              </form>
              <form action={deleteAdminCourseAction}>
                <input type="hidden" name="courseId" value={course.id} />
                <button
                  className="btn-secondary w-full px-3 py-2 text-xs text-red-700"
                  onClick={(event) => {
                    if (!confirm("هل تريد حذف الكورس؟")) {
                      event.preventDefault();
                    }
                  }}
                >
                  حذف
                </button>
              </form>
            </div>
          </article>
        ))}
        {filtered.length === 0 ? (
          <p className="glass-panel text-foreground/60 rounded-xl px-5 py-12 text-center">
            لا توجد نتائج مطابقة.
          </p>
        ) : null}
      </div>

      <div className="glass-panel-strong hidden overflow-x-auto rounded-xl md:block">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-primary-50/70 text-primary-800">
            <tr>
              <th className="px-4 py-3 text-right">الكورس</th>
              <th className="px-4 py-3 text-right">المدرس</th>
              <th className="px-4 py-3 text-right">الأرقام</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-primary-100 divide-y">
            {filtered.map((course) => (
              <tr key={course.id}>
                <td className="px-4 py-4 font-black">{course.title}</td>
                <td className="px-4 py-4">
                  {course.teacher?.profile?.full_name ?? "مدرس غير معروف"}
                  <p className="text-foreground/55 mt-1">
                    {course.teacher?.subject ?? "مادة غير محددة"}
                  </p>
                </td>
                <td className="px-4 py-4">
                  {formatPrice(course.price)} ·{" "}
                  {course.lessons.length.toLocaleString("ar-EG")} حصة ·{" "}
                  {course.enrollments.length.toLocaleString("ar-EG")} اشتراك
                </td>
                <td className="px-4 py-4">
                  <span className="chip">
                    {course.is_published ? "منشور" : "مخفي"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <form action={toggleAdminCoursePublishAction}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <input
                        type="hidden"
                        name="nextPublished"
                        value={course.is_published ? "false" : "true"}
                      />
                      <button className="btn-secondary px-3 py-2 text-xs">
                        {course.is_published ? "إخفاء" : "نشر"}
                      </button>
                    </form>
                    <form action={deleteAdminCourseAction}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <button
                        className="btn-secondary px-3 py-2 text-xs text-red-700"
                        onClick={(event) => {
                          if (!confirm("هل تريد حذف الكورس؟")) {
                            event.preventDefault();
                          }
                        }}
                      >
                        حذف
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="text-foreground/60 px-5 py-12 text-center">
            لا توجد نتائج مطابقة.
          </p>
        ) : null}
      </div>
    </div>
  );
}
