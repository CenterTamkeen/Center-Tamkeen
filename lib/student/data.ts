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

  const totalCourses = courses.length;
  const completedCourses = 0;
  const activeCourses = Math.max(totalCourses - completedCourses, 0);
  const totalLessons = courses.reduce(
    (sum, item) => sum + (item.course.lessons?.length ?? 0),
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
    courses,
  };
}
