import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type TeacherRow = Database["public"]["Tables"]["teachers"]["Row"];
type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

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
  "id" | "title" | "price" | "is_published" | "created_at"
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

function logAdminError(label: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[admin:${label}]`, error);
  }
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
      "id, title, price, is_published, created_at, teacher:teachers(subject, slug, profile:profiles(full_name)), lessons(id), enrollments(id)",
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

export async function getAdminStats() {
  const supabase = await createClient();
  const [teachers, courses, orders, earnings, coupons] = await Promise.all([
    getAdminTeachers(),
    getAdminCourses(),
    getAdminOrders("all"),
    supabase.from("teacher_earnings").select("amount, teacher_id"),
    supabase
      .from("coupons")
      .select("used_count, discount_value, discount_type"),
  ]);

  if (earnings.error) {
    logAdminError("earnings", earnings.error.message);
  }

  if (coupons.error) {
    logAdminError("coupons", coupons.error.message);
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
