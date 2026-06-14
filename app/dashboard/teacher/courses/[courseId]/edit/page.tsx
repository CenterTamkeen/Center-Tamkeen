import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CourseForm } from "@/components/teacher/course-form";
import { requireRole } from "@/lib/auth/roles";
import { getCurrentTeacher, getTeacherCourseById } from "@/lib/teacher/data";

type EditCoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export const metadata: Metadata = {
  title: "تعديل الكورس",
};

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { courseId } = await params;
  const { profile } = await requireRole(
    "teacher",
    "/dashboard/teacher/courses",
  );
  const teacher = await getCurrentTeacher(profile.id);

  if (!teacher) {
    notFound();
  }

  const course = await getTeacherCourseById(teacher.id, courseId);

  if (!course) {
    notFound();
  }

  return (
    <div className="card-modern p-6">
      <p className="eyebrow">تعديل الكورس</p>
      <h2 className="mb-5 text-xl font-black">{course.title}</h2>
      <CourseForm course={course} />
    </div>
  );
}
