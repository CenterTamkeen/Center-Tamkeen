import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type TeacherRow = Database["public"]["Tables"]["teachers"]["Row"];
type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];
type StudentRow = Database["public"]["Tables"]["students"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ActivationCodeRow =
  Database["public"]["Tables"]["activation_codes"]["Row"];

export type AdminTeacher = Pick<
  TeacherRow,
  | "id"
  | "profile_id"
  | "slug"
  | "subject"
  | "bio"
  | "avatar_url"
  | "is_active"
  | "created_at"
> & {
  profile: {
    full_name: string;
    email?: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  courses: { id: string }[];
};

export type AdminCourse = Pick<
  CourseRow,
  | "id"
  | "subject"
  | "title"
  | "price"
  | "target_grade"
  | "target_section"
  | "is_published"
  | "created_at"
> & {
  teacher: {
    subject: string;
    slug: string;
    profile: {
      full_name: string;
    } | null;
  } | null;
  lessons: { id: string }[];
  enrollments: { id: string }[];
};

export type AdminOrder = Pick<
  OrderRow,
  | "id"
  | "total_amount"
  | "status"
  | "fawry_ref_no"
  | "rejection_reason"
  | "completed_at"
  | "created_at"
> & {
  student: {
    student_phone: string;
    profile: {
      full_name: string;
      phone: string | null;
    } | null;
  } | null;
  order_items: {
    id: string;
    price_at_purchase: number;
    course: {
      title: string;
      teacher: {
        profile: {
          full_name: string;
        } | null;
      } | null;
    } | null;
  }[];
};

export type AdminStudent = Pick<
  StudentRow,
  | "id"
  | "profile_id"
  | "student_phone"
  | "father_phone"
  | "school_name"
  | "gender"
  | "grade"
  | "section"
  | "photo_url"
  | "created_at"
  | "updated_at"
> & {
  profile: {
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    email?: string | null;
  } | null;
  enrollments: {
    id: string;
    enrolled_at: string;
    course: {
      title: string;
      subject: string | null;
      price: number;
      teacher: {
        profile: {
          full_name: string;
        } | null;
      } | null;
    } | null;
  }[];
  student_blocks: {
    id: string;
    teacher_id: string | null;
    reason: string | null;
    created_at: string;
  }[];
};

export type AdminReview = Pick<
  ReviewRow,
  "id" | "rating" | "comment" | "created_at"
> & {
  student: {
    profile: {
      full_name: string;
    } | null;
  } | null;
  course: {
    title: string;
    teacher: {
      profile: {
        full_name: string;
      } | null;
    } | null;
  } | null;
};

export type AdminActivationCode = Pick<
  ActivationCodeRow,
  "id" | "course_id" | "code" | "expires_at" | "used_at" | "created_at"
> & {
  course: {
    title: string;
    price: number;
    teacher: {
      profile: {
        full_name: string;
      } | null;
    } | null;
  } | null;
  used_by_student: {
    student_phone: string;
    profile: {
      full_name: string;
    } | null;
  } | null;
};

function logAdminError(label: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[admin:${label}]`, error);
  }
}

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

async function getAuthEmailByProfileId(profileIds: string[]) {
  const neededProfileIds = new Set(profileIds);
  const emailByProfileId = new Map<string, string | null>();

  if (
    neededProfileIds.size === 0 ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return emailByProfileId;
  }

  try {
    const admin = createAdminClient();
    let page = 1;

    while (neededProfileIds.size > 0) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

      if (error) {
        logAdminError("student-auth-email", error.message);
        break;
      }

      for (const user of data.users) {
        if (neededProfileIds.has(user.id)) {
          emailByProfileId.set(user.id, user.email ?? null);
          neededProfileIds.delete(user.id);
        }
      }

      if (data.users.length < 1000) {
        break;
      }

      page += 1;
    }
  } catch (authError) {
    logAdminError("student-auth-email", authError);
  }

  return emailByProfileId;
}

export async function getAdminTeachers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select(
      "id, profile_id, slug, subject, bio, avatar_url, is_active, created_at, profile:profiles(full_name, phone, avatar_url), courses(id)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    logAdminError("teachers", error.message);
    return [];
  }

  return (data ?? []) as AdminTeacher[];
}

export async function getAdminCourses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, subject, title, price, target_grade, target_section, is_published, created_at, teacher:teachers(subject, slug, profile:profiles(full_name)), lessons(id), enrollments(id)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    logAdminError("courses", error.message);
    return [];
  }

  return (data ?? []) as AdminCourse[];
}

export async function getAdminOrders(status?: OrderStatus | "all") {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(
      "id, total_amount, status, fawry_ref_no, rejection_reason, completed_at, created_at, student:students(student_phone, profile:profiles(full_name, phone)), order_items(id, price_at_purchase, course:courses(title, teacher:teachers(profile:profiles(full_name))))",
    )
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    logAdminError("orders", error.message);
    return [];
  }

  return (data ?? []) as AdminOrder[];
}

export async function getAdminActivationCodes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activation_codes")
    .select(
      "id, course_id, code, expires_at, used_at, created_at, course:courses(title, price, teacher:teachers(profile:profiles(full_name))), used_by_student:students(student_phone, profile:profiles(full_name))",
    )
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    logAdminError("activation-codes", error.message);
    return [];
  }

  return (data ?? []) as AdminActivationCode[];
}

export async function getAdminStudents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      "id, profile_id, student_phone, father_phone, school_name, gender, grade, section, photo_url, created_at, updated_at, profile:profiles(full_name, phone, avatar_url), enrollments(id, enrolled_at, course:courses(title, subject, price, teacher:teachers(profile:profiles(full_name))))",
    )
    .order("created_at", { ascending: false });

  if (error) {
    logAdminError("students", error.message);
    return [];
  }

  const students = (data ?? []) as Omit<AdminStudent, "student_blocks">[];
  const profileIds = students.map((student) => student.profile_id);
  const emailByProfileId = await getAuthEmailByProfileId(profileIds);

  const studentsWithEmails = students.map((student) => ({
    ...student,
    profile: student.profile
      ? {
          ...student.profile,
          email: emailByProfileId.get(student.profile_id) ?? null,
        }
      : student.profile,
  }));
  const studentIds = students.map((student) => student.id);

  if (studentIds.length === 0) {
    return [];
  }

  const { data: blocks, error: blocksError } = await supabase
    .from("student_blocks")
    .select("id, student_id, teacher_id, reason, created_at")
    .in("student_id", studentIds)
    .is("teacher_id", null);

  if (blocksError) {
    if (isMissingTable(blocksError, "student_blocks")) {
      return studentsWithEmails.map((student) => ({
        ...student,
        student_blocks: [],
      }));
    }

    logAdminError("student-blocks", blocksError.message);
  }

  const blocksByStudent = new Map<string, AdminStudent["student_blocks"]>();

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

  return studentsWithEmails.map((student) => ({
    ...student,
    student_blocks: blocksByStudent.get(student.id) ?? [],
  }));
}

export async function getAdminStats() {
  const supabase = await createClient();
  const [teachers, courses, orders, earnings, coupons, activationCodes] =
    await Promise.all([
      getAdminTeachers(),
      getAdminCourses(),
      getAdminOrders("all"),
      supabase.from("teacher_earnings").select("amount, teacher_id"),
      supabase
        .from("coupons")
        .select("used_count, discount_value, discount_type"),
      supabase.from("activation_codes").select("used_at, expires_at"),
    ]);

  if (earnings.error) {
    logAdminError("earnings", earnings.error.message);
  }

  if (coupons.error) {
    logAdminError("coupons", coupons.error.message);
  }

  if (activationCodes.error) {
    logAdminError("activation-codes-stats", activationCodes.error.message);
  }

  const completedOrders = orders.filter(
    (order) => order.status === "completed",
  );
  const totalSales = completedOrders.reduce(
    (sum, order) => sum + order.total_amount,
    0,
  );
  const teacherEarnings = (earnings.data ?? []).reduce(
    (sum, earning) => sum + earning.amount,
    0,
  );
  const usedCoupons = (coupons.data ?? []).reduce(
    (sum, coupon) => sum + coupon.used_count,
    0,
  );
  const couponDiscountImpact = (coupons.data ?? []).reduce((sum, coupon) => {
    return sum + coupon.used_count * coupon.discount_value;
  }, 0);
  const now = Date.now();
  const activationCodeRows = activationCodes.data ?? [];
  const usedActivationCodes = activationCodeRows.filter(
    (code) => code.used_at,
  ).length;
  const availableActivationCodes = activationCodeRows.filter(
    (code) => !code.used_at && new Date(code.expires_at).getTime() > now,
  ).length;
  const expiredActivationCodes = activationCodeRows.filter(
    (code) => !code.used_at && new Date(code.expires_at).getTime() <= now,
  ).length;

  return {
    totalTeachers: teachers.length,
    activeTeachers: teachers.filter((teacher) => teacher.is_active).length,
    totalCourses: courses.length,
    publishedCourses: courses.filter((course) => course.is_published).length,
    pendingOrders: orders.filter((order) => order.status === "pending").length,
    completedOrders: completedOrders.length,
    rejectedOrders: orders.filter((order) => order.status === "rejected")
      .length,
    totalSales,
    teacherEarnings,
    centerEarnings: Math.max(0, totalSales - teacherEarnings),
    usedCoupons,
    couponDiscountImpact,
    totalActivationCodes: activationCodeRows.length,
    usedActivationCodes,
    availableActivationCodes,
    expiredActivationCodes,
  };
}

export async function getAdminTeacherEarningsReport() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_earnings")
    .select(
      "amount, teacher_id, teacher:teachers(subject, profile:profiles(full_name))",
    );

  if (error) {
    logAdminError("teacher-earnings-report", error.message);
    return [];
  }

  const report = new Map<
    string,
    {
      teacherId: string;
      teacherName: string;
      subject: string;
      total: number;
    }
  >();

  for (const row of data ?? []) {
    const current = report.get(row.teacher_id) ?? {
      teacherId: row.teacher_id,
      teacherName: row.teacher?.profile?.full_name ?? "مدرس غير معروف",
      subject: row.teacher?.subject ?? "مادة غير محددة",
      total: 0,
    };

    current.total += row.amount;
    report.set(row.teacher_id, current);
  }

  return Array.from(report.values()).sort((a, b) => b.total - a.total);
}

export async function getAdminFinancialReportDetails() {
  const supabase = await createClient();
  const [orders, courses, couponsQuery] = await Promise.all([
    getAdminOrders("completed"),
    getAdminCourses(),
    supabase
      .from("coupons")
      .select("id, code, used_count, discount_value, discount_type"),
  ]);

  if (couponsQuery.error) {
    logAdminError("coupon-report", couponsQuery.error.message);
  }

  const salesByDate = new Map<string, number>();

  for (const order of orders) {
    const date = new Date(order.completed_at ?? order.created_at)
      .toISOString()
      .slice(0, 10);
    salesByDate.set(date, (salesByDate.get(date) ?? 0) + order.total_amount);
  }

  return {
    salesByDate: Array.from(salesByDate.entries()).map(([label, total]) => ({
      label,
      total,
    })),
    topCourses: courses
      .map((course) => ({
        id: course.id,
        title: course.title,
        teacherName: course.teacher?.profile?.full_name ?? "مدرس غير معروف",
        enrollments: course.enrollments.length,
        revenue: course.enrollments.length * course.price,
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 10),
    coupons: (couponsQuery.data ?? [])
      .map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        usedCount: coupon.used_count,
        discountValue: coupon.discount_value,
        discountType: coupon.discount_type,
      }))
      .sort((a, b) => b.usedCount - a.usedCount),
  };
}

export async function getAdminReviews() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, created_at, student:students(profile:profiles(full_name)), course:courses(title, teacher:teachers(profile:profiles(full_name)))",
    )
    .order("created_at", { ascending: false });

  if (error) {
    logAdminError("reviews", error.message);
    return [];
  }

  return (data ?? []) as AdminReview[];
}
