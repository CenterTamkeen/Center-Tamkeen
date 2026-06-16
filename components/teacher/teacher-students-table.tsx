"use client";

import { useMemo, useState } from "react";

import {
  blockStudentAction,
  unblockStudentAction,
} from "@/lib/student-blocks/actions";
import type { TeacherStudent } from "@/lib/teacher/data";

const pageSize = 8;

export function TeacherStudentsTable({
  students,
}: {
  students: TeacherStudent[];
}) {
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("all");
  const [page, setPage] = useState(1);
  const courses = useMemo(() => {
    const map = new Map<string, string>();

    for (const student of students) {
      for (const enrollment of student.enrollments) {
        if (enrollment.course) {
          map.set(enrollment.course.id, enrollment.course.title);
        }
      }
    }

    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [students]);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return students.filter((student) => {
      const name = student.profile?.full_name ?? "";
      const matchesQuery =
        !normalizedQuery ||
        name.toLowerCase().includes(normalizedQuery) ||
        student.student_phone.includes(normalizedQuery);
      const matchesCourse =
        courseId === "all" ||
        student.enrollments.some(
          (enrollment) => enrollment.course?.id === courseId,
        );

      return matchesQuery && matchesCourse;
    });
  }, [courseId, query, students]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-4">
      <div className="glass-panel-strong grid gap-3 rounded-xl p-4 md:grid-cols-[1fr_260px]">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          className="field bg-background/60"
          placeholder="بحث بالاسم أو رقم الهاتف"
        />
        <select
          value={courseId}
          onChange={(event) => {
            setCourseId(event.target.value);
            setPage(1);
          }}
          className="field bg-background/60"
        >
          <option value="all">كل الكورسات</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      <div className="glass-panel-strong overflow-x-auto rounded-xl">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-primary-50/70 text-primary-800">
            <tr>
              <th className="px-4 py-3 text-right">الطالب</th>
              <th className="px-4 py-3 text-right">الكورسات</th>
              <th className="px-4 py-3 text-right">تاريخ الاشتراك</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-primary-100 divide-y">
            {visible.map((student) => {
              const teacherBlock = student.student_blocks.find(
                (block) => block.reason !== "__global_placeholder__",
              );
              const firstEnrollment = student.enrollments[0];

              return (
                <tr key={student.id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-black">
                      {student.profile?.full_name ?? "طالب بدون اسم"}
                    </p>
                    <p className="text-foreground/55 mt-1">
                      {student.student_phone} · {student.school_name}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {student.enrollments.map((enrollment) => (
                        <span key={enrollment.id} className="chip">
                          {enrollment.course?.title ?? "كورس غير معروف"}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {firstEnrollment?.enrolled_at
                      ? new Date(
                          firstEnrollment.enrolled_at,
                        ).toLocaleDateString("ar-EG")
                      : "غير متاح"}
                  </td>
                  <td className="px-4 py-4">
                    <span className="chip">
                      {teacherBlock ? "محظور" : "نشط"}
                    </span>
                    {teacherBlock?.reason ? (
                      <p className="mt-2 text-xs font-semibold text-red-700">
                        {teacherBlock.reason}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    {teacherBlock ? (
                      <form action={unblockStudentAction}>
                        <input
                          type="hidden"
                          name="studentId"
                          value={student.id}
                        />
                        <button className="btn-secondary px-3 py-2 text-xs">
                          فك البلوك
                        </button>
                      </form>
                    ) : (
                      <form action={blockStudentAction} className="grid gap-2">
                        <input
                          type="hidden"
                          name="studentId"
                          value={student.id}
                        />
                        <input
                          name="reason"
                          placeholder="سبب اختياري"
                          className="field bg-background/60 py-2 text-sm"
                        />
                        <button className="btn-secondary px-3 py-2 text-xs text-red-700">
                          بلوك
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 ? (
          <p className="text-foreground/60 px-5 py-12 text-center">
            لا توجد نتائج مطابقة.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-foreground/55 text-sm font-semibold">
          {filtered.length.toLocaleString("ar-EG")} طالب
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary px-3 py-2 text-xs disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            السابق
          </button>
          <span className="text-sm font-black">
            {currentPage.toLocaleString("ar-EG")} /{" "}
            {totalPages.toLocaleString("ar-EG")}
          </span>
          <button
            type="button"
            className="btn-secondary px-3 py-2 text-xs disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  );
}
