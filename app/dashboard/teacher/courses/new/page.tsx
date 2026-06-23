import type { Metadata } from "next";

import { CourseForm } from "@/components/teacher/course-form";
import { requireRole } from "@/lib/auth/roles";
import {
  getCurrentTeacher,
  getTeacherSubjectOptions,
} from "@/lib/teacher/data";

export const metadata: Metadata = {
  title: "كورس جديد",
};

export default async function NewCoursePage() {
  const { profile } = await requireRole(
    "teacher",
    "/dashboard/teacher/courses",
  );
  const teacher = await getCurrentTeacher(profile.id);
  const subjectOptions = await getTeacherSubjectOptions(teacher?.subject);

  return (
    <div className="card-modern p-6">
      <p className="eyebrow">كورس جديد</p>
      <h2 className="mb-5 text-xl font-black">إنشاء كورس</h2>
      <CourseForm subjectOptions={subjectOptions} />
    </div>
  );
}
