import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TeacherStudentsTable } from "@/components/teacher/teacher-students-table";
import { requireRole } from "@/lib/auth/roles";
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

      {students.length > 0 ? (
        <TeacherStudentsTable students={students} />
      ) : (
        <div className="glass-panel text-foreground/60 rounded-xl px-5 py-12 text-center">
          لا يوجد طلاب مشتركين في كورساتك حتى الآن.
        </div>
      )}
    </div>
  );
}
