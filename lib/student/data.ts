import { createClient } from "@/lib/supabase/server";

type StudentDashboardCourse = {
  id: string;
  subject: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  teacher: {
    slug: string;
    subject: string;
    profile: {
      full_name: string;
    } | null;
  } | null;
  lessons: { id: string }[];
};

type StudentDashboardEnrollment = {
  id: string;
  enrolled_at: string;
  course: StudentDashboardCourse | null;
};

type StudentDashboardRecord = {
  id: string;
  student_phone: string | null;
  school_name: string | null;
  grade: string | null;
  section: string | null;
  enrollments: StudentDashboardEnrollment[];
};

function isMissingTable(
  error: { message?: string; code?: string },
  table: string,
) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes(table) ||
    error.message?.includes("schema cache") ||
    error.message?.includes("Could not find")
  );
}
function logStudentError(label: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[student:${label}]`, error);
  }
}

export async function getStudentDashboard(profileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      "id, student_phone, school_name, grade, section, enrollments(id, enrolled_at, course:courses(id, subject, title, description, price, thumbnail_url, teacher:teachers(slug, subject, profile:profiles(full_name)), lessons(id)))",
    )
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    logStudentError("dashboard", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  const student = data as StudentDashboardRecord;
  const enrollments = [...(student.enrollments ?? [])].sort(
    (a, b) =>
      new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime(),
  );
  const courses = enrollments
    .map((enrollment) => ({
      enrollmentId: enrollment.id,
      enrolledAt: enrollment.enrolled_at,
      course: enrollment.course,
    }))
    .filter(
      (
        item,
      ): item is {
        enrollmentId: string;
        enrolledAt: string;
        course: StudentDashboardCourse;
      } => Boolean(item.course),
    );

  const courseIds = courses.map((item) => item.course.id);
  const { data: progressRows, error: progressError } =
    courseIds.length > 0
      ? await supabase
          .from("lesson_progress")
          .select("course_id, lesson_id, status")
          .eq("student_id", student.id)
          .in("course_id", courseIds)
      : { data: [], error: null };

  if (progressError && !isMissingTable(progressError, "lesson_progress")) {
    logStudentError("lesson-progress", progressError.message);
  }

  const progressByCourse = new Map<string, Set<string>>();

  for (const row of progressRows ?? []) {
    if (row.status !== "completed") {
      continue;
    }

    const completedLessons =
      progressByCourse.get(row.course_id) ?? new Set<string>();
    completedLessons.add(row.lesson_id);
    progressByCourse.set(row.course_id, completedLessons);
  }

  const coursesWithProgress = courses.map((item) => {
    const lessonCount = item.course.lessons?.length ?? 0;
    const completedLessons = progressByCourse.get(item.course.id)?.size ?? 0;
    const progressPercent =
      lessonCount > 0 ? Math.round((completedLessons / lessonCount) * 100) : 0;

    return {
      ...item,
      progress: {
        lessonCount,
        completedLessons,
        progressPercent,
      },
    };
  });

  const totalCourses = coursesWithProgress.length;
  const completedCourses = coursesWithProgress.filter(
    (item) =>
      item.progress.lessonCount > 0 && item.progress.progressPercent >= 100,
  ).length;
  const activeCourses = Math.max(totalCourses - completedCourses, 0);
  const totalLessons = coursesWithProgress.reduce(
    (sum, item) => sum + item.progress.lessonCount,
    0,
  );

  return {
    student: {
      id: student.id,
      studentPhone: student.student_phone,
      schoolName: student.school_name,
      grade: student.grade,
      section: student.section,
    },
    stats: {
      totalCourses,
      completedCourses,
      activeCourses,
      totalLessons,
    },
    courses: coursesWithProgress,
  };
}
