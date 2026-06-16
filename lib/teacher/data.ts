import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type TeacherRow = Database["public"]["Tables"]["teachers"]["Row"];
export type TeacherCourse = Database["public"]["Tables"]["courses"]["Row"] & {
  lessons: { id: string }[];
  enrollments: { id: string; student_id: string }[];
};
export type TeacherLesson = Database["public"]["Tables"]["lessons"]["Row"];
export type TeacherCoupon = Database["public"]["Tables"]["coupons"]["Row"] & {
  course: {
    id: string;
    title: string;
  } | null;
  target_student: {
    id: string;
    student_phone: string;
    profile: {
      full_name: string;
      phone: string | null;
    } | null;
  } | null;
  target_students: {
    id: string;
    student_phone: string;
    profile: {
      full_name: string;
      phone: string | null;
    } | null;
  }[];
  coupon_redemptions: {
    id: string;
    discount_amount: number;
    redeemed_at: string;
    student: {
      id: string;
      student_phone: string;
      profile: {
        full_name: string;
        phone: string | null;
      } | null;
    } | null;
  }[];
};
export type TeacherCouponStudent = Pick<
  TeacherStudent,
  "id" | "profile_id" | "student_phone" | "profile"
> & {
  email: string | null;
};
export type TeacherStudent = {
  id: string;
  profile_id: string;
  student_phone: string;
  school_name: string;
  profile: {
    full_name: string;
    phone: string | null;
  } | null;
  enrollments: {
    id: string;
    enrolled_at: string;
    course: {
      id: string;
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

function getAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

function isMissingOptionalCouponFeature(message: string) {
  return (
    message.includes("target_student_id") ||
    message.includes("course_id") ||
    message.includes("coupon_student_targets") ||
    message.includes("coupon_redemptions") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("Could not find")
  );
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
  const fullSelect =
    "id, teacher_id, course_id, code, discount_type, discount_value, usage_limit, used_count, target_student_id, is_active, expires_at, created_at, updated_at";
  const legacySelect =
    "id, teacher_id, code, discount_type, discount_value, usage_limit, used_count, is_active, expires_at, created_at, updated_at";
  const fullQuery = await supabase
    .from("coupons")
    .select(fullSelect)
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });
  let couponData: unknown[] | null = fullQuery.data;
  let couponError = fullQuery.error;

  if (couponError && isMissingOptionalCouponFeature(couponError.message)) {
    const legacyQuery = await supabase
      .from("coupons")
      .select(legacySelect)
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });

    couponData = legacyQuery.data;
    couponError = legacyQuery.error;
  }

  if (couponError) {
    logTeacherError("coupons", couponError.message);
    return [];
  }

  const coupons = (couponData ?? []).map((coupon) => {
    const couponRow = coupon as Partial<
      Database["public"]["Tables"]["coupons"]["Row"]
    >;

    return {
      ...couponRow,
      course_id: couponRow.course_id ?? null,
      target_student_id: couponRow.target_student_id ?? null,
      course: null,
      target_student: null,
      target_students: [],
      coupon_redemptions: [],
    };
  }) as TeacherCoupon[];

  if (coupons.length === 0) {
    return [];
  }

  const targetStudentIds = Array.from(
    new Set(coupons.map((coupon) => coupon.target_student_id).filter(Boolean)),
  ) as string[];
  const courseIds = Array.from(
    new Set(coupons.map((coupon) => coupon.course_id).filter(Boolean)),
  ) as string[];
  const studentsById = new Map<
    string,
    NonNullable<TeacherCoupon["target_student"]>
  >();
  const coursesById = new Map<string, NonNullable<TeacherCoupon["course"]>>();

  if (courseIds.length > 0) {
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id, title")
      .in("id", courseIds);

    if (coursesError) {
      logTeacherError("coupon-courses", coursesError.message);
    }

    for (const course of courses ?? []) {
      coursesById.set(course.id, course);
    }
  }

  if (targetStudentIds.length > 0) {
    const { data: targetStudents, error: targetStudentsError } = await supabase
      .from("students")
      .select("id, student_phone, profile:profiles(full_name, phone)")
      .in("id", targetStudentIds);

    if (targetStudentsError) {
      logTeacherError("coupon-target-students", targetStudentsError.message);
    }

    for (const student of targetStudents ?? []) {
      studentsById.set(student.id, student);
    }
  }

  const couponIds = coupons.map((coupon) => coupon.id);
  const { data: targets, error: targetsError } = await supabase
    .from("coupon_student_targets")
    .select("coupon_id, student_id")
    .in("coupon_id", couponIds);

  const targetRows = targets ?? [];
  const multiTargetStudentIds = Array.from(
    new Set(targetRows.map((target) => target.student_id)),
  );

  if (targetsError && !isMissingOptionalCouponFeature(targetsError.message)) {
    logTeacherError("coupon-student-targets", targetsError.message);
  }

  if (multiTargetStudentIds.length > 0) {
    const { data: multiTargetStudents, error: multiTargetStudentsError } =
      await supabase
        .from("students")
        .select("id, student_phone, profile:profiles(full_name, phone)")
        .in("id", multiTargetStudentIds);

    if (multiTargetStudentsError) {
      logTeacherError(
        "coupon-multi-target-students",
        multiTargetStudentsError.message,
      );
    }

    for (const student of multiTargetStudents ?? []) {
      studentsById.set(student.id, student);
    }
  }

  const { data: redemptions, error: redemptionsError } = await supabase
    .from("coupon_redemptions")
    .select("id, coupon_id, student_id, discount_amount, redeemed_at")
    .in("coupon_id", couponIds)
    .order("redeemed_at", { ascending: false });

  const couponRedemptions = redemptions ?? [];
  const redemptionStudentIds = Array.from(
    new Set(couponRedemptions.map((redemption) => redemption.student_id)),
  );

  if (
    redemptionsError &&
    !isMissingOptionalCouponFeature(redemptionsError.message)
  ) {
    logTeacherError("coupon-redemptions", redemptionsError.message);
  }

  if (redemptionStudentIds.length > 0) {
    const { data: redemptionStudents, error: redemptionStudentsError } =
      await supabase
        .from("students")
        .select("id, student_phone, profile:profiles(full_name, phone)")
        .in("id", redemptionStudentIds);

    if (redemptionStudentsError) {
      logTeacherError(
        "coupon-redemption-students",
        redemptionStudentsError.message,
      );
    }

    for (const student of redemptionStudents ?? []) {
      studentsById.set(student.id, student);
    }
  }

  const redemptionsByCoupon = new Map<
    string,
    TeacherCoupon["coupon_redemptions"]
  >();
  const targetsByCoupon = new Map<string, TeacherCoupon["target_students"]>();

  for (const target of targetRows) {
    const student = studentsById.get(target.student_id);

    if (!student) {
      continue;
    }

    const current = targetsByCoupon.get(target.coupon_id) ?? [];
    current.push(student);
    targetsByCoupon.set(target.coupon_id, current);
  }

  for (const redemption of couponRedemptions) {
    const current = redemptionsByCoupon.get(redemption.coupon_id) ?? [];
    current.push({
      id: redemption.id,
      discount_amount: redemption.discount_amount,
      redeemed_at: redemption.redeemed_at,
      student: studentsById.get(redemption.student_id) ?? null,
    });
    redemptionsByCoupon.set(redemption.coupon_id, current);
  }

  return coupons.map((coupon) => ({
    ...coupon,
    course: coupon.course_id
      ? (coursesById.get(coupon.course_id) ?? null)
      : null,
    target_student: coupon.target_student_id
      ? (studentsById.get(coupon.target_student_id) ?? null)
      : null,
    target_students: targetsByCoupon.get(coupon.id) ?? [],
    coupon_redemptions: redemptionsByCoupon.get(coupon.id) ?? [],
  }));
}

export async function getTeacherCouponStudents(teacherId: string) {
  const students = await getTeacherStudents(teacherId);
  const admin = getAdminClient();
  const emailsByProfileId = new Map<string, string | null>();

  if (admin) {
    await Promise.all(
      students.map(async (student) => {
        const { data } = await admin.auth.admin.getUserById(student.profile_id);
        emailsByProfileId.set(student.profile_id, data.user?.email ?? null);
      }),
    );
  }

  return students.map((student) => ({
    id: student.id,
    profile_id: student.profile_id,
    student_phone: student.student_phone,
    profile: student.profile,
    email: emailsByProfileId.get(student.profile_id) ?? null,
  }));
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
      "id, profile_id, student_phone, school_name, profile:profiles(full_name, phone), enrollments!inner(id, enrolled_at, course:courses!inner(id, title, teacher_id))",
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

export async function getTeacherDashboardDetails(teacherId: string) {
  const supabase = await createClient();
  const [courses, coupons, earningsQuery, enrollmentsQuery, reviewsQuery] =
    await Promise.all([
      getTeacherCourses(teacherId),
      getTeacherCoupons(teacherId),
      supabase
        .from("teacher_earnings")
        .select("amount, created_at")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: true }),
      supabase
        .from("enrollments")
        .select(
          "id, enrolled_at, student:students(profile:profiles(full_name)), course:courses!inner(id, title, teacher_id)",
        )
        .eq("course.teacher_id", teacherId)
        .order("enrolled_at", { ascending: false })
        .limit(8),
      supabase
        .from("reviews")
        .select("rating, course:courses!inner(id, title, teacher_id)")
        .eq("course.teacher_id", teacherId),
    ]);

  if (earningsQuery.error) {
    logTeacherError("dashboard-earnings", earningsQuery.error.message);
  }

  if (enrollmentsQuery.error) {
    logTeacherError("dashboard-enrollments", enrollmentsQuery.error.message);
  }

  if (reviewsQuery.error) {
    logTeacherError("dashboard-reviews", reviewsQuery.error.message);
  }

  const salesByMonth = new Map<string, number>();

  for (const earning of earningsQuery.data ?? []) {
    const month = new Intl.DateTimeFormat("ar-EG", {
      month: "short",
      year: "numeric",
    }).format(new Date(earning.created_at));
    salesByMonth.set(month, (salesByMonth.get(month) ?? 0) + earning.amount);
  }

  const ratingsByCourse = new Map<
    string,
    { courseId: string; title: string; total: number; count: number }
  >();

  for (const review of reviewsQuery.data ?? []) {
    const course = review.course;

    if (!course) {
      continue;
    }

    const current = ratingsByCourse.get(course.id) ?? {
      courseId: course.id,
      title: course.title,
      total: 0,
      count: 0,
    };
    current.total += review.rating;
    current.count += 1;
    ratingsByCourse.set(course.id, current);
  }

  return {
    salesByMonth: Array.from(salesByMonth.entries()).map(([label, total]) => ({
      label,
      total,
    })),
    topCourses: courses
      .map((course) => ({
        id: course.id,
        title: course.title,
        enrollments: course.enrollments.length,
        revenue: course.enrollments.length * course.price,
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5),
    recentEnrollments: (enrollmentsQuery.data ?? []).map((enrollment) => ({
      id: enrollment.id,
      enrolledAt: enrollment.enrolled_at,
      studentName: enrollment.student?.profile?.full_name ?? "طالب بدون اسم",
      courseTitle: enrollment.course?.title ?? "كورس غير معروف",
    })),
    topCoupons: coupons
      .map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        usedCount: coupon.used_count,
        courseTitle: coupon.course?.title ?? "كل الكورسات",
      }))
      .sort((a, b) => b.usedCount - a.usedCount)
      .slice(0, 5),
    courseRatings: Array.from(ratingsByCourse.values()).map((item) => ({
      courseId: item.courseId,
      title: item.title,
      average: item.count ? item.total / item.count : 0,
      count: item.count,
    })),
  };
}
