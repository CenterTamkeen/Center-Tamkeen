import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/roles";
import {
  blockStudentAction,
  unblockStudentAction,
} from "@/lib/student-blocks/actions";
import { getCurrentTeacher, getTeacherStudents } from "@/lib/teacher/data";

export const metadata: Metadata = {
  title: "طلاب المدرس",
};

export default async function TeacherStudentsPage() {
  const { profile } = await requireRole("teacher", "/dashboard/teacher");
  const teacher = await getCurrentTeacher(profile.id);

  if (!teacher) {
    notFound();
  }

  const students = await getTeacherStudents(teacher.id);

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">الطلاب</p>
        <h2 className="text-xl font-black">طلاب كورساتك</h2>
      </div>

      <div className="grid gap-4">
        {students.length > 0 ? (
          students.map((student) => {
            const teacherBlock = student.student_blocks.find(
              (block) => block.reason !== "__global_placeholder__",
            );
            const blocked = Boolean(teacherBlock);

            return (
              <article key={student.id} className="card-modern p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black">
                        {student.profile?.full_name ?? "طالب بدون اسم"}
                      </h3>
                      <span className="chip">
                        {blocked ? "محظور من كورساتك" : "نشط"}
                      </span>
                    </div>
                    <p className="text-foreground/65 mt-2 text-sm leading-6">
                      رقم الطالب: {student.student_phone} ·{" "}
                      {student.school_name}
                    </p>
                    <div className="text-foreground/60 mt-3 flex flex-wrap gap-2 text-sm">
                      {student.enrollments.map((enrollment) => (
                        <span key={enrollment.id} className="chip">
                          {enrollment.course?.title ?? "كورس غير معروف"}
                        </span>
                      ))}
                    </div>
                    {teacherBlock?.reason ? (
                      <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                        سبب البلوك: {teacherBlock.reason}
                      </p>
                    ) : null}
                  </div>

                  {blocked ? (
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
                        بلوك الطالب
                      </button>
                    </form>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="glass-panel text-foreground/60 rounded-xl px-5 py-12 text-center">
            لا يوجد طلاب مشتركين في كورساتك حتى الآن.
          </div>
        )}
      </div>
    </div>
  );
}
