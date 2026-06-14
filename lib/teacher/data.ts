import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type TeacherRow = Database["public"]["Tables"]["teachers"]["Row"];
export type TeacherCourse = Database["public"]["Tables"]["courses"]["Row"] & {
  lessons: { id: string }[];
  enrollments: { id: string; student_id: string }[];
};
export type TeacherLesson = Database["public"]["Tables"]["lessons"]["Row"];
export type TeacherCoupon = Database["public"]["Tables"]["coupons"]["Row"];
export type TeacherStudent = {
  id: string;
  student_phone: string;
  school_name: string;
  profile: {
    full_name: string;
    phone: string | null;
  } | null;
  enrollments: {
    id: string;
    course: {
      title: string;
    } | null;
  }[];
  student_blocks: {
    id: string;
    teacher_id: string | null;
    reason: string | null;
    created_at: string;
  }[];
};

function logTeacherError(label: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[teacher:${label}]`, error);
  }
}

export async function getCurrentTeacher(profileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select(
      "id, profile_id, slug, bio, subject, avatar_url, is_active, created_at, updated_at",
    )
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    logTeacherError("current-teacher", error.message);
    return null;
  }

  return data as TeacherRow | null;
}

export async function getTeacherCourses(teacherId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, teacher_id, title, description, price, thumbnail_url, is_published, created_at, updated_at, lessons(id), enrollments(id, student_id)",
    )
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) {
    logTeacherError("courses", error.message);
    return [];
  }

  return (data ?? []) as TeacherCourse[];
}

export async function getTeacherCourseById(
  teacherId: string,
  courseId: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, teacher_id, title, description, price, thumbnail_url, is_published, created_at, updated_at",
    )
    .eq("teacher_id", teacherId)
    .eq("id", courseId)
    .maybeSingle();

  if (error) {
    logTeacherError("course-by-id", error.message);
    return null;
  }

  return data;
}

export async function getTeacherLessons(teacherId: string, courseId: string) {
  const course = await getTeacherCourseById(teacherId, courseId);

  if (!course) {
    return {
      course: null,
      lessons: [] as TeacherLesson[],
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(
      "id, course_id, title, order_index, vdocipher_video_id, duration, is_free_preview, created_at, updated_at",
    )
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  if (error) {
    logTeacherError("lessons", error.message);
    return {
      course,
      lessons: [],
    };
  }

  return {
    course,
    lessons: (data ?? []) as TeacherLesson[],
  };
}

export async function getTeacherCoupons(teacherId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select(
      "id, teacher_id, code, discount_type, discount_value, usage_limit, used_count, is_active, expires_at, created_at, updated_at",
    )
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) {
    logTeacherError("coupons", error.message);
    return [];
  }

  return (data ?? []) as TeacherCoupon[];
}

export async function getTeacherStats(teacherId: string) {
  const [courses, coupons] = await Promise.all([
    getTeacherCourses(teacherId),
    getTeacherCoupons(teacherId),
  ]);
  const supabase = await createClient();
  const { data: earnings, error: earningsError } = await supabase
    .from("teacher_earnings")
    .select("amount")
    .eq("teacher_id", teacherId);

  if (earningsError) {
    logTeacherError("earnings", earningsError.message);
  }

  const totalEarnings = (earnings ?? []).reduce(
    (sum, earning) => sum + earning.amount,
    0,
  );
  const studentCount = new Set(
    courses.flatMap((course) =>
      course.enrollments.map((item) => item.student_id),
    ),
  ).size;

  return {
    totalCourses: courses.length,
    publishedCourses: courses.filter((course) => course.is_published).length,
    totalLessons: courses.reduce(
      (sum, course) => sum + course.lessons.length,
      0,
    ),
    studentCount,
    activeCoupons: coupons.filter((coupon) => coupon.is_active).length,
    totalEarnings,
  };
}

export async function getTeacherStudents(teacherId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      "id, student_phone, school_name, profile:profiles(full_name, phone), enrollments!inner(id, course:courses!inner(title, teacher_id))",
    )
    .eq("enrollments.course.teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) {
    logTeacherError("students", error.message);
    return [];
  }

  const students = (data ?? []) as Omit<TeacherStudent, "student_blocks">[];
  const studentIds = students.map((student) => student.id);

  if (studentIds.length === 0) {
    return [];
  }

  const { data: blocks, error: blocksError } = await supabase
    .from("student_blocks")
    .select("id, student_id, teacher_id, reason, created_at")
    .in("student_id", studentIds)
    .eq("teacher_id", teacherId);

  if (blocksError) {
    logTeacherError("student-blocks", blocksError.message);
  }

  const blocksByStudent = new Map<string, TeacherStudent["student_blocks"]>();

  for (const block of blocks ?? []) {
    const current = blocksByStudent.get(block.student_id) ?? [];
    current.push({
      id: block.id,
      teacher_id: block.teacher_id,
      reason: block.reason,
      created_at: block.created_at,
    });
    blocksByStudent.set(block.student_id, current);
  }

  return students.map((student) => ({
    ...student,
    student_blocks: blocksByStudent.get(student.id) ?? [],
  }));
}
