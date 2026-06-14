import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LessonManager } from "@/components/teacher/lesson-manager";
import { requireRole } from "@/lib/auth/roles";
import { getCurrentTeacher, getTeacherLessons } from "@/lib/teacher/data";

type LessonsPageProps = {
  params: Promise<{ courseId: string }>;
};

export const metadata: Metadata = {
  title: "حصص الكورس",
};

export default async function CourseLessonsPage({ params }: LessonsPageProps) {
  const { courseId } = await params;
  const { profile } = await requireRole(
    "teacher",
    "/dashboard/teacher/courses",
  );
  const teacher = await getCurrentTeacher(profile.id);

  if (!teacher) {
    notFound();
  }

  const { course, lessons } = await getTeacherLessons(teacher.id, courseId);

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">إدارة الحصص</p>
          <h2 className="text-xl font-black">{course.title}</h2>
        </div>
        <Link href="/dashboard/teacher/courses" className="btn-secondary">
          رجوع للكورسات
        </Link>
      </div>
      <LessonManager courseId={course.id} lessons={lessons} />
    </div>
  );
}
